import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Upload, Plus, Trash2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface Product {
  id: string;
  name: string;
  price: number;
  average_raised_per_student: number | null;
}

interface StudentEntry {
  name: string;
  email: string;
}

interface CreateCampaignWizardProps {
  onComplete: () => void;
  onCancel: () => void;
  editingCampaign?: any;
}

type FundraiserType = 'product' | 'walkathon' | 'readathon' | 'jogathon' | 'other_athon';
type AthonDonationType = 'pledge_per_unit' | 'flat_donation';

const FUNDRAISER_TYPES = [
  { value: 'product', label: 'Product Sale', description: 'Sell products to raise funds', avgRaised: 150 },
  { value: 'walkathon', label: 'Walk-a-thon', description: 'Sponsors pledge per lap or mile', avgRaised: 120 },
  { value: 'readathon', label: 'Read-a-thon', description: 'Sponsors pledge per book or page', avgRaised: 95 },
  { value: 'jogathon', label: 'Jog-a-thon', description: 'Sponsors pledge per lap or distance', avgRaised: 110 },
  { value: 'other_athon', label: 'Other A-thon', description: 'Custom activity-based fundraiser', avgRaised: 100 },
];

export function CreateCampaignWizard({ onComplete, onCancel, editingCampaign }: CreateCampaignWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Basic Info
  const [name, setName] = useState(editingCampaign?.name || '');
  const [organizationName, setOrganizationName] = useState(editingCampaign?.organization_name || '');
  const [description, setDescription] = useState(editingCampaign?.description || '');
  const [goalAmount, setGoalAmount] = useState(editingCampaign?.goal_amount?.toString() || '');
  const [startDate, setStartDate] = useState(editingCampaign?.start_date?.split('T')[0] || '');
  const [endDate, setEndDate] = useState(editingCampaign?.end_date?.split('T')[0] || '');

  // Step 2: Fundraiser Type
  const [fundraiserType, setFundraiserType] = useState<FundraiserType>(
    editingCampaign?.fundraiser_type || 'product'
  );
  const [athonDonationType, setAthonDonationType] = useState<AthonDonationType>(
    editingCampaign?.athon_donation_type || 'pledge_per_unit'
  );
  const [athonUnitName, setAthonUnitName] = useState(editingCampaign?.athon_unit_name || '');

  // Step 3: Products (for product type)
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Step 4: Students
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');

  useEffect(() => {
    if (fundraiserType === 'product') {
      fetchProducts();
    }
  }, [fundraiserType]);

  useEffect(() => {
    if (editingCampaign?.id) {
      fetchExistingStudents();
      fetchSelectedProducts();
    }
  }, [editingCampaign]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, average_raised_per_student')
      .eq('is_active', true);

    if (!error && data) {
      setProducts(data);
    }
  };

  const fetchExistingStudents = async () => {
    if (!editingCampaign?.id) return;
    const { data } = await supabase
      .from('student_invitations')
      .select('student_name, student_email')
      .eq('campaign_id', editingCampaign.id);

    if (data) {
      setStudents(data.map(s => ({ name: s.student_name, email: s.student_email })));
    }
  };

  const fetchSelectedProducts = async () => {
    if (!editingCampaign?.id) return;
    const { data } = await supabase
      .from('campaign_products')
      .select('product_id')
      .eq('campaign_id', editingCampaign.id);

    if (data) {
      setSelectedProductIds(data.map(p => p.product_id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet);

      const newStudents: StudentEntry[] = jsonData.map((row: any) => ({
        name: row.name || row.Name || row.student_name || row['Student Name'] || '',
        email: row.email || row.Email || row.student_email || row['Student Email'] || '',
      })).filter(s => s.name && s.email);

      setStudents(prev => [...prev, ...newStudents]);
      toast.success(`Added ${newStudents.length} students from file`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file. Please use a valid CSV or Excel file.');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addStudent = () => {
    if (!newStudentName || !newStudentEmail) {
      toast.error('Please enter both name and email');
      return;
    }

    if (students.some(s => s.email === newStudentEmail)) {
      toast.error('This email is already in the list');
      return;
    }

    setStudents(prev => [...prev, { name: newStudentName, email: newStudentEmail }]);
    setNewStudentName('');
    setNewStudentEmail('');
  };

  const removeStudent = (index: number) => {
    setStudents(prev => prev.filter((_, i) => i !== index));
  };

  const toggleProduct = (productId: string) => {
    setSelectedProductIds(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async () => {
    if (!goalAmount) {
      toast.error('Goal amount is required');
      return;
    }

    setLoading(true);
    try {
      const campaignData = {
        name,
        organization_name: organizationName,
        description: description || null,
        goal_amount: parseFloat(goalAmount),
        start_date: startDate || null,
        end_date: endDate || null,
        fundraiser_type: fundraiserType,
        athon_donation_type: fundraiserType !== 'product' ? athonDonationType : null,
        athon_unit_name: fundraiserType !== 'product' ? athonUnitName : null,
        organization_admin_id: user?.id,
      };

      let campaignId: string;

      if (editingCampaign?.id) {
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);

        if (error) throw error;
        campaignId = editingCampaign.id;

        // Clear existing students and products
        await supabase.from('student_invitations').delete().eq('campaign_id', campaignId);
        await supabase.from('campaign_products').delete().eq('campaign_id', campaignId);
      } else {
        const { data, error } = await supabase
          .from('campaigns')
          .insert(campaignData)
          .select('id')
          .single();

        if (error) throw error;
        campaignId = data.id;
      }

      // Add selected products
      if (fundraiserType === 'product' && selectedProductIds.length > 0) {
        const productInserts = selectedProductIds.map(productId => ({
          campaign_id: campaignId,
          product_id: productId,
        }));
        await supabase.from('campaign_products').insert(productInserts);
      }

      // Add students
      if (students.length > 0) {
        const studentInserts = students.map(s => ({
          campaign_id: campaignId,
          student_name: s.name,
          student_email: s.email,
        }));
        await supabase.from('student_invitations').insert(studentInserts);
      }

      toast.success(editingCampaign ? 'Campaign updated successfully' : 'Campaign created successfully');
      onComplete();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save campaign');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return name && organizationName && goalAmount && startDate && endDate;
      case 2:
        if (fundraiserType === 'product') return true;
        return athonUnitName;
      case 3:
        if (fundraiserType !== 'product') return true;
        return selectedProductIds.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const totalSteps = fundraiserType === 'product' ? 4 : 3;

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i + 1 === step
                  ? 'bg-primary text-primary-foreground'
                  : i + 1 < step
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={`w-12 h-0.5 ${i + 1 < step ? 'bg-primary' : 'bg-muted'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Details</CardTitle>
            <CardDescription>Enter the basic information for your fundraiser</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Lincoln High School"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Program Type *</Label>
                <Input
                  id="org"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Marching Band"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your fundraiser..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goal">Fundraising Goal *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  id="goal"
                  type="text"
                  value={goalAmount ? Number(goalAmount).toLocaleString() : ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setGoalAmount(value);
                  }}
                  placeholder="10,000"
                  className="pl-7"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Date *</Label>
                <Input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    // Clear end date if it's before the new start date
                    if (endDate && e.target.value > endDate) {
                      setEndDate('');
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end">End Date *</Label>
                <Input
                  id="end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate || undefined}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Fundraiser Type */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Fundraiser Type</CardTitle>
            <CardDescription>Choose the type of fundraiser you want to run</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={fundraiserType} onValueChange={(v) => setFundraiserType(v as FundraiserType)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {FUNDRAISER_TYPES.map((type) => (
                  <div key={type.value} className="relative">
                    <RadioGroupItem
                      value={type.value}
                      id={type.value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={type.value}
                      className="flex flex-col p-4 border rounded-lg cursor-pointer hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                    >
                      <span className="font-medium">{type.label}</span>
                      <span className="text-sm text-muted-foreground">{type.description}</span>
                      <span className="text-sm text-primary mt-2">
                        ~${type.avgRaised} raised on average by each student
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            {fundraiserType !== 'product' && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>Donation Type</Label>
                  <RadioGroup
                    value={athonDonationType}
                    onValueChange={(v) => setAthonDonationType(v as AthonDonationType)}
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pledge_per_unit" id="pledge" />
                        <Label htmlFor="pledge">Pledge per unit</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="flat_donation" id="flat" />
                        <Label htmlFor="flat">Flat donations</Label>
                      </div>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit Name *</Label>
                  <Input
                    id="unit"
                    value={athonUnitName}
                    onChange={(e) => setAthonUnitName(e.target.value)}
                    placeholder={
                      fundraiserType === 'walkathon' ? 'lap' :
                      fundraiserType === 'readathon' ? 'book' :
                      fundraiserType === 'jogathon' ? 'mile' : 'unit'
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    e.g., "lap", "book", "page", "mile"
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Products (only for product type) */}
      {step === 3 && fundraiserType === 'product' && (
        <Card>
          <CardHeader>
            <CardTitle>Select Products</CardTitle>
            <CardDescription>Choose which products students can sell</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Avg. Raised/Student</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProductIds.includes(product.id)}
                        onCheckedChange={() => toggleProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                    <TableCell className="text-primary">
                      ${product.average_raised_per_student?.toFixed(2) || '0.00'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Step 3/4: Students */}
      {((step === 3 && fundraiserType !== 'product') || (step === 4 && fundraiserType === 'product')) && (
        <Card>
          <CardHeader>
            <CardTitle>Add Students</CardTitle>
            <CardDescription>
              Upload a CSV/Excel file or manually add students. They'll receive login emails when the fundraiser starts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload a CSV or Excel file with columns: name, email
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Choose File
              </Button>
            </div>

            {/* Manual Entry */}
            <div className="space-y-2">
              <Label>Or add students manually</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Student name"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                />
                <Input
                  placeholder="Email address"
                  type="email"
                  value={newStudentEmail}
                  onChange={(e) => setNewStudentEmail(e.target.value)}
                />
                <Button onClick={addStudent}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Student List */}
            {students.length > 0 && (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => (
                      <TableRow key={index}>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStudent(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {students.length} student{students.length !== 1 ? 's' : ''} added
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        {step < totalSteps ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
          </Button>
        )}
      </div>
    </div>
  );
}
