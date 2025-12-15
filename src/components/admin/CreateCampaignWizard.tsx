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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload, Plus, Trash2, ArrowLeft, ArrowRight, Check, CalendarIcon,
  X, CheckCircle2, Clock, Star, Sparkles, Image, AlertCircle, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  FUNDRAISER_CATEGORIES,
  getFundraiserTypeById,
  FundraiserType,
  FundraiserCategory as FundraiserCategoryType
} from '@/data/fundraiserTypes';
import { parseStudentFile, downloadSampleCSV, ParseResult } from '@/utils/csvParser';

const generateJoinCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};


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

type FundraiserTypeValue = 'product' | 'walkathon' | 'readathon' | 'jogathon' | 'other_athon';
type AthonDonationType = 'pledge_per_unit' | 'flat_donation';

export function CreateCampaignWizard({
  onComplete,
  onCancel,
  editingCampaign
}: CreateCampaignWizardProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Step 1: Basic Info
  const [name, setName] = useState(editingCampaign?.name || '');
  const [organizationName, setOrganizationName] = useState(editingCampaign?.organization_name || '');
  const [description, setDescription] = useState(editingCampaign?.description || '');
  const [goalAmount, setGoalAmount] = useState(editingCampaign?.goal_amount?.toString() || '');
  const [programSize, setProgramSize] = useState(editingCampaign?.program_size?.toString() || '');
  const [startDate, setStartDate] = useState<Date | undefined>(
    editingCampaign?.start_date ? new Date(editingCampaign.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    editingCampaign?.end_date ? new Date(editingCampaign.end_date) : undefined
  );
  const [logoUrl, setLogoUrl] = useState(editingCampaign?.logo_url || '');
  const [logoPreview, setLogoPreview] = useState<string | null>(editingCampaign?.logo_url || null);
  const [brandColors, setBrandColors] = useState<{ primary: string; secondary: string; accent: string } | null>(
    editingCampaign?.brand_colors || null
  );

  // Step 2: Fundraiser Type
  // Step 2: Fundraiser Type (Hardcoded to QuickStove/Product)
  // We default these immediately so the UI skips the selection step
  const [selectedCategory, setSelectedCategory] = useState<FundraiserCategoryType | null>(FUNDRAISER_CATEGORIES[0]);
  const [selectedFundraiserType, setSelectedFundraiserType] = useState<FundraiserType | null>(FUNDRAISER_CATEGORIES[0].types[0]);
  const [fundraiserTypeValue, setFundraiserTypeValue] = useState<FundraiserTypeValue>('product');
  const [athonDonationType, setAthonDonationType] = useState<AthonDonationType>('pledge_per_unit');
  const [athonUnitName, setAthonUnitName] = useState('');
  const [showSuccessGuide, setShowSuccessGuide] = useState(false);

  // Step 3: Products (for product type)
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Step 4: Students
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [showParsePreview, setShowParsePreview] = useState(false);

  useEffect(() => {
    if (fundraiserTypeValue === 'product') {
      fetchProducts();
    }
  }, [fundraiserTypeValue]);

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
      // Auto-select all active products (QuickStove) since we are skipping the selection step
      setSelectedProductIds(data.map(p => p.id));
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

  // Extract dominant colors from an image
  const extractColorsFromImage = (imageDataUrl: string): Promise<{ primary: string; secondary: string; accent: string }> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ primary: '#2563eb', secondary: '#10b981', accent: '#f59e0b' });
          return;
        }

        // Sample the image at a smaller size for performance
        const sampleSize = 50;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        // Build color frequency map
        const colorMap: { [key: string]: { count: number; r: number; g: number; b: number } } = {};

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent/near-white/near-black pixels
          if (a < 128) continue;
          if (r > 240 && g > 240 && b > 240) continue;
          if (r < 15 && g < 15 && b < 15) continue;

          // Round to reduce color variations
          const key = `${Math.round(r / 20) * 20},${Math.round(g / 20) * 20},${Math.round(b / 20) * 20}`;

          if (!colorMap[key]) {
            colorMap[key] = { count: 0, r, g, b };
          }
          colorMap[key].count++;
        }

        // Sort by frequency and get top colors
        const sortedColors = Object.values(colorMap)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        const toHex = (r: number, g: number, b: number) =>
          '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

        const primary = sortedColors[0] ? toHex(sortedColors[0].r, sortedColors[0].g, sortedColors[0].b) : '#2563eb';
        const secondary = sortedColors[1] ? toHex(sortedColors[1].r, sortedColors[1].g, sortedColors[1].b) : '#10b981';
        const accent = sortedColors[2] ? toHex(sortedColors[2].r, sortedColors[2].g, sortedColors[2].b) : '#f59e0b';

        resolve({ primary, secondary, accent });
      };
      img.onerror = () => {
        resolve({ primary: '#2563eb', secondary: '#10b981', accent: '#f59e0b' });
      };
      img.src = imageDataUrl;
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview and extract colors
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setLogoPreview(dataUrl);

      // Extract colors from the image
      try {
        const colors = await extractColorsFromImage(dataUrl);
        setBrandColors(colors);
        toast.success('Brand colors extracted from logo');
      } catch (err) {
        console.error('Error extracting colors:', err);
      }
    };
    reader.readAsDataURL(file);

    // Upload to Supabase storage
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('campaign-logos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('campaign-logos')
        .getPublicUrl(fileName);

      setLogoUrl(urlData.publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseStudentFile(file);
      setParseResult(result);
      setShowParsePreview(true);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse file');
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmParsedStudents = () => {
    if (parseResult) {
      setStudents(prev => [...prev, ...parseResult.students]);
      toast.success(`Added ${parseResult.validRows} students`);
      setShowParsePreview(false);
      setParseResult(null);
    }
  };

  const addStudent = () => {
    if (!newStudentName || !newStudentEmail) {
      toast.error('Please enter both name and email');
      return;
    }
    // Allow same email for different names (parent with multiple children)
    const isDuplicate = students.some(
      s => s.email.toLowerCase() === newStudentEmail.toLowerCase() &&
        s.name.toLowerCase() === newStudentName.toLowerCase()
    );
    if (isDuplicate) {
      toast.error('This student is already in the list');
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

  const handleSelectFundraiserType = (type: FundraiserType) => {
    setSelectedFundraiserType(type);

    // Map to database values
    if (type.id === 'product' || type.id === 'quickstove') {
      setFundraiserTypeValue('product');
    } else if (type.id === 'walkathon') {
      setFundraiserTypeValue('walkathon');
    } else if (type.id === 'readathon') {
      setFundraiserTypeValue('readathon');
    } else if (type.id === 'jogathon') {
      setFundraiserTypeValue('jogathon');
    } else {
      setFundraiserTypeValue('other_athon');
    }

    if (type.defaultUnit) {
      setAthonUnitName(type.defaultUnit);
    }
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
        goal_amount: Math.ceil(parseFloat(goalAmount)),
        program_size: programSize ? parseInt(programSize) : null,
        start_date: startDate ? startDate.toISOString() : null,
        end_date: endDate ? endDate.toISOString() : null,
        fundraiser_type: fundraiserTypeValue,
        athon_donation_type: fundraiserTypeValue !== 'product' ? athonDonationType : null,
        athon_unit_name: fundraiserTypeValue !== 'product' ? athonUnitName : null,
        organization_admin_id: user?.id,
        logo_url: logoUrl || null,
        brand_colors: brandColors || null
      };

      let campaignId: string;

      if (editingCampaign?.id) {
        const { error } = await supabase
          .from('campaigns')
          .update(campaignData)
          .eq('id', editingCampaign.id);
        if (error) throw error;
        campaignId = editingCampaign.id;

        await supabase.from('campaign_products').delete().eq('campaign_id', campaignId);
      } else {
        const { data, error } = await supabase
          .from('campaigns')
          .insert(campaignData)
          .select('id')
          .single();
        if (error) throw error;
        campaignId = data.id;

        // Auto-create join settings for new campaigns
        const { error: joinError } = await supabase
          .from('campaign_join_settings')
          .insert({
            campaign_id: campaignId,
            join_code: generateJoinCode(),
            require_code: false,
            max_participants: programSize ? parseInt(programSize) : null
          });
        if (joinError) console.error('Error creating join settings:', joinError);
      }

      if (fundraiserTypeValue === 'product' && selectedProductIds.length > 0) {
        const productInserts = selectedProductIds.map(productId => ({
          campaign_id: campaignId,
          product_id: productId
        }));
        await supabase.from('campaign_products').insert(productInserts);
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
    return name && organizationName && goalAmount && startDate && endDate;
  };

  const totalSteps = 1;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-emerald-500';
      case 'medium': return 'bg-amber-500';
      case 'hard': return 'bg-rose-500';
      default: return 'bg-muted';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
                i + 1 === step
                  ? 'bg-primary text-primary-foreground'
                  : i + 1 < step
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
              )}
            >
              {i + 1 < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            {i < totalSteps - 1 && (
              <div className={cn("w-12 h-0.5", i + 1 < step ? 'bg-primary' : 'bg-muted')} />
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
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Organization Logo (Optional)</Label>
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "w-20 h-20 rounded-xl border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors",
                    logoPreview ? "border-solid border-primary" : "border-muted-foreground/25"
                  )}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain rounded-xl" />
                  ) : (
                    <Image className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button variant="outline" size="sm" onClick={() => logoInputRef.current?.click()}>
                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your logo will appear on student pages and materials
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Lincoln High School"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org">Program Type *</Label>
                <Input
                  id="org"
                  value={organizationName}
                  onChange={e => setOrganizationName(e.target.value)}
                  placeholder="Marching Band"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your fundraiser..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="goal">Fundraising Goal *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="goal"
                    type="text"
                    value={goalAmount ? Number(goalAmount).toLocaleString() : ''}
                    onChange={e => {
                      const value = e.target.value.replace(/[^0-9.]/g, '');
                      const parts = value.split('.');
                      const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : value;
                      setGoalAmount(sanitized);
                    }}
                    onBlur={() => {
                      if (goalAmount) {
                        setGoalAmount(Math.ceil(parseFloat(goalAmount)).toString());
                      }
                    }}
                    placeholder="10,000"
                    className="pl-7"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="programSize">Program Size</Label>
                <Input
                  id="programSize"
                  type="number"
                  value={programSize}
                  onChange={e => setProgramSize(e.target.value)}
                  placeholder="e.g. 50 students"
                />
                <p className="text-xs text-muted-foreground">
                  Number of students/participants
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 items-center",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={date => {
                        setStartDate(date);
                        if (endDate && date && date > endDate) {
                          setEndDate(undefined);
                        }
                      }}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 items-center",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={date => (startDate ? date < startDate : false)}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

          </CardContent>
        </Card>
      )}



      {/* Success Guide Modal */}
      <Dialog open={showSuccessGuide} onOpenChange={setShowSuccessGuide}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedFundraiserType && (
                <>
                  <div className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                    selectedFundraiserType.color
                  )}>
                    {(() => {
                      const Icon = selectedFundraiserType.icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  {selectedFundraiserType.label} Success Guide
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              Follow these steps to run a successful {selectedFundraiserType?.label}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              {selectedFundraiserType?.successGuide.map((guideStep, index) => (
                <div key={index} className="flex gap-4">
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br",
                    selectedFundraiserType.color
                  )}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-1">{guideStep.title}</h4>
                    <p className="text-sm text-muted-foreground">{guideStep.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={() => setShowSuccessGuide(false)}>Got it!</Button>
          </div>
        </DialogContent>
      </Dialog>



      {/* CSV Preview Dialog */}
      <Dialog open={showParsePreview} onOpenChange={setShowParsePreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              Review the parsed data before importing
            </DialogDescription>
          </DialogHeader>

          {parseResult && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div className="bg-green-500/10 text-green-600 px-3 py-1 rounded-full">
                  {parseResult.validRows} valid students
                </div>
                {parseResult.errors.length > 0 && (
                  <div className="bg-destructive/10 text-destructive px-3 py-1 rounded-full">
                    {parseResult.errors.length} errors
                  </div>
                )}
              </div>

              {parseResult.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ul className="list-disc list-inside text-sm">
                      {parseResult.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {parseResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <ScrollArea className="h-24">
                      <ul className="list-disc list-inside text-sm">
                        {parseResult.errors.slice(0, 10).map((e, i) => (
                          <li key={i}>{e}</li>
                        ))}
                        {parseResult.errors.length > 10 && (
                          <li>...and {parseResult.errors.length - 10} more errors</li>
                        )}
                      </ul>
                    </ScrollArea>
                  </AlertDescription>
                </Alert>
              )}

              {parseResult.students.length > 0 && (
                <ScrollArea className="h-48 border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parseResult.students.slice(0, 20).map((s, i) => (
                        <TableRow key={i}>
                          <TableCell>{s.name}</TableCell>
                          <TableCell>{s.email}</TableCell>
                        </TableRow>
                      ))}
                      {parseResult.students.length > 20 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground">
                            ...and {parseResult.students.length - 20} more
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowParsePreview(false)}>
                  Cancel
                </Button>
                <Button onClick={confirmParsedStudents} disabled={parseResult.validRows === 0}>
                  Import {parseResult.validRows} Students
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Step 2: Students (Renumbered from 3, previously 4) */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Students</CardTitle>
            <CardDescription>
              Add students to participate in this fundraiser. Parents can share email addresses across multiple children.
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
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Upload a CSV or Excel file with student names and emails
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                We'll auto-detect columns named "name", "student", "email", "parent email", etc.
              </p>
              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  Choose File
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadSampleCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>

            {/* Manual Entry */}
            <div className="space-y-4">
              <Label>Or add manually</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Student Name"
                  value={newStudentName}
                  onChange={e => setNewStudentName(e.target.value)}
                />
                <Input
                  placeholder="Parent Email"
                  type="email"
                  value={newStudentEmail}
                  onChange={e => setNewStudentEmail(e.target.value)}
                />
                <Button onClick={addStudent}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Multiple children can share the same parent email address
              </p>
            </div>

            {/* Student List */}
            {students.length > 0 && (
              <div className="space-y-2">
                <Label>Students ({students.length})</Label>
                <ScrollArea className="h-48 border rounded-lg">
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
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            if (step === 1) {
              onCancel();
            } else {
              setStep(step - 1);
            }
          }}
        >
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        <Button
          onClick={() => {
            if (step < totalSteps) {
              setStep(step + 1);
            } else {
              handleSubmit();
            }
          }}
          disabled={!canProceed() || loading}
        >
          {loading ? 'Saving...' : step === totalSteps ? 'Create Campaign' : 'Next'}
          {!loading && step < totalSteps && <ArrowRight className="ml-2 h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
