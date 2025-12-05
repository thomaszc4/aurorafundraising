import * as XLSX from 'xlsx';

export interface ParsedStudent {
  name: string;
  email: string;
  errors?: string[];
}

export interface ParseResult {
  students: ParsedStudent[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

// Common column name variations for name fields
const NAME_COLUMNS = [
  'name', 'student_name', 'student name', 'full_name', 'full name',
  'first_name', 'first name', 'firstname', 'child_name', 'child name',
  'participant_name', 'participant name', 'participant', 'student',
  'member_name', 'member name', 'member', 'volunteer_name', 'volunteer name',
  'child', 'kid_name', 'kid name', 'kid'
];

// Common column name variations for email fields
const EMAIL_COLUMNS = [
  'email', 'student_email', 'student email', 'parent_email', 'parent email',
  'email_address', 'email address', 'emailaddress', 'e-mail', 'e_mail',
  'contact_email', 'contact email', 'guardian_email', 'guardian email',
  'family_email', 'family email', 'mail'
];

// Normalize column name for matching
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

// Find the best matching column
function findColumn(headers: string[], variations: string[]): string | null {
  const normalizedVariations = variations.map(normalizeColumnName);
  
  for (const header of headers) {
    const normalized = normalizeColumnName(header);
    if (normalizedVariations.includes(normalized)) {
      return header;
    }
  }
  
  // Try partial match
  for (const header of headers) {
    const normalized = normalizeColumnName(header);
    for (const variation of normalizedVariations) {
      if (normalized.includes(variation) || variation.includes(normalized)) {
        return header;
      }
    }
  }
  
  return null;
}

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Clean string value
function cleanString(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

// Remove BOM character
function removeBOM(text: string): string {
  return text.replace(/^\uFEFF/, '');
}

export async function parseStudentFile(file: File): Promise<ParseResult> {
  const result: ParseResult = {
    students: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    validRows: 0
  };

  try {
    const arrayBuffer = await file.arrayBuffer();
    let workbook: XLSX.WorkBook;
    
    // Handle different file types
    const fileName = file.name.toLowerCase();
    
    if (fileName.endsWith('.csv')) {
      // For CSV, also try to detect encoding
      const text = removeBOM(new TextDecoder().decode(arrayBuffer));
      workbook = XLSX.read(text, { type: 'string', raw: true });
    } else {
      workbook = XLSX.read(arrayBuffer, { type: 'array' });
    }

    if (workbook.SheetNames.length === 0) {
      result.errors.push('No sheets found in the file');
      return result;
    }

    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON with header detection
    const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    
    if (jsonData.length === 0) {
      result.errors.push('No data found in the file');
      return result;
    }

    result.totalRows = jsonData.length;

    // Get headers from first row
    const headers = Object.keys(jsonData[0] as object);
    
    // Find name and email columns
    const nameColumn = findColumn(headers, NAME_COLUMNS);
    const emailColumn = findColumn(headers, EMAIL_COLUMNS);

    if (!nameColumn) {
      // Try to use first column as name if it looks like names
      const firstCol = headers[0];
      const firstValue = cleanString((jsonData[0] as any)[firstCol]);
      if (firstValue && !isValidEmail(firstValue) && firstValue.length > 1) {
        result.warnings.push(`Using "${firstCol}" as the name column`);
      } else {
        result.errors.push('Could not find a name column. Please include a column with one of these headers: ' + NAME_COLUMNS.slice(0, 5).join(', '));
        return result;
      }
    }

    if (!emailColumn) {
      // Try to use second column as email if it looks like emails
      const secondCol = headers[1];
      if (secondCol) {
        const secondValue = cleanString((jsonData[0] as any)[secondCol]);
        if (isValidEmail(secondValue)) {
          result.warnings.push(`Using "${secondCol}" as the email column`);
        } else {
          result.errors.push('Could not find an email column. Please include a column with one of these headers: ' + EMAIL_COLUMNS.slice(0, 5).join(', '));
          return result;
        }
      } else {
        result.errors.push('Could not find an email column');
        return result;
      }
    }

    const actualNameCol = nameColumn || headers[0];
    const actualEmailCol = emailColumn || headers[1];

    // Process each row
    const seenEmails = new Map<string, string[]>(); // email -> array of names
    
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as Record<string, any>;
      const rowNum = i + 2; // Account for header row and 1-indexing
      
      const name = cleanString(row[actualNameCol]);
      const email = cleanString(row[actualEmailCol]).toLowerCase();
      
      const student: ParsedStudent = { name, email, errors: [] };
      
      // Validate name
      if (!name) {
        student.errors!.push(`Row ${rowNum}: Missing name`);
      } else if (name.length < 2) {
        student.errors!.push(`Row ${rowNum}: Name too short`);
      }
      
      // Validate email
      if (!email) {
        student.errors!.push(`Row ${rowNum}: Missing email`);
      } else if (!isValidEmail(email)) {
        student.errors!.push(`Row ${rowNum}: Invalid email format "${email}"`);
      }
      
      // Check for duplicate name+email combination
      if (name && email) {
        const existingNames = seenEmails.get(email) || [];
        if (existingNames.includes(name.toLowerCase())) {
          student.errors!.push(`Row ${rowNum}: Duplicate entry for "${name}" with email "${email}"`);
        } else {
          existingNames.push(name.toLowerCase());
          seenEmails.set(email, existingNames);
        }
      }
      
      // Add to results
      if (student.errors!.length === 0) {
        delete student.errors;
        result.students.push(student);
        result.validRows++;
      } else {
        result.errors.push(...student.errors!);
      }
    }

    // Add warning for shared emails (not an error, just informational)
    for (const [email, names] of seenEmails) {
      if (names.length > 1) {
        result.warnings.push(`Email "${email}" is shared by ${names.length} students (this is allowed for parent emails)`);
      }
    }

  } catch (error) {
    console.error('Error parsing file:', error);
    result.errors.push(`Failed to parse file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

// Export sample CSV template
export function downloadSampleCSV() {
  const sampleData = `Student Name,Parent Email
John Smith,parent1@email.com
Jane Doe,parent2@email.com
Mike Johnson,parent1@email.com
Sarah Williams,parent3@email.com`;
  
  const blob = new Blob([sampleData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'student_template.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}