import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Settings,
  Palette,
  Target,
  CalendarDays,
  Save,
  Upload,
  Image as ImageIcon,
  
  Trash2,
  Plus

} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface BrandColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

interface Campaign {
  id: string;
  name: string;
  organization_name: string;
  organization_type: string | null;
  description: string | null;
  goal_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  fundraiser_type: string;
  logo_url: string | null;
  brand_colors: BrandColors | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | null;
  program_size: number | null;
}

export default function CampaignSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaignId) {
      const selected = campaigns.find(c => c.id === selectedCampaignId);
      setCampaign(selected || null);
    }
  }, [selectedCampaignId, campaigns]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_admin_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns((data || []).map(c => ({
        ...c,
        brand_colors: c.brand_colors as BrandColors | null,
        status: c.status as Campaign['status'],
      })));
      if (data && data.length > 0) {
        setSelectedCampaignId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!campaign) return;
    setSaving(true);

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: any = {
        name: campaign.name,
        organization_name: campaign.organization_name,
        organization_type: campaign.organization_type,
        description: campaign.description,
        goal_amount: campaign.goal_amount,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        status: campaign.status,
        program_size: campaign.program_size,
        brand_colors: campaign.brand_colors,
      };

      const { error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaign.id);

      if (error) throw error;
      toast.success('Settings saved successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !campaign) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${campaign.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-logos')
        .getPublicUrl(fileName);

      // Extract colors from logo
      const colors = await extractColorsFromImage(file);

      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          logo_url: publicUrl,
          brand_colors: colors
        })
        .eq('id', campaign.id);

      if (updateError) throw updateError;

      setCampaign({ ...campaign, logo_url: publicUrl, brand_colors: colors });
      toast.success('Logo uploaded and colors extracted');
      fetchCampaigns();
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const extractColorsFromImage = (file: File): Promise<{ primary: string; secondary: string; accent: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);

        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height);
        if (!imageData) {
          resolve({ primary: '#3B82F6', secondary: '#10B981', accent: '#F59E0B' });
          return;
        }

        const colorCounts: Record<string, number> = {};
        for (let i = 0; i < imageData.data.length; i += 4) {
          const r = Math.round(imageData.data[i] / 32) * 32;
          const g = Math.round(imageData.data[i + 1] / 32) * 32;
          const b = Math.round(imageData.data[i + 2] / 32) * 32;
          const a = imageData.data[i + 3];

          if (a < 128) continue;
          if (r > 240 && g > 240 && b > 240) continue;
          if (r < 15 && g < 15 && b < 15) continue;

          const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
          colorCounts[hex] = (colorCounts[hex] || 0) + 1;
        }

        const sortedColors = Object.entries(colorCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([color]) => color);

        resolve({
          primary: sortedColors[0] || '#3B82F6',
          secondary: sortedColors[1] || '#10B981',
          accent: sortedColors[2] || '#F59E0B',
        });
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const updateBrandColor = (key: 'primary' | 'secondary' | 'accent', value: string) => {
    if (!campaign) return;
    setCampaign({
      ...campaign,
      brand_colors: {
        ...campaign.brand_colors,
        [key]: value,
      },
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </AdminLayout>
    );
  }

  if (campaigns.length === 0) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Aurora</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Get started by creating your first fundraiser. Configure your settings after you've created a campaign.
            </p>
          </div>
          <Button size="lg" onClick={() => navigate('/admin?view=create')} className="gap-2">
            <Plus className="w-5 h-5" />
            Create Your First Fundraiser
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (campaigns.length === 0) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Aurora</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Get started by creating your first fundraiser. Our platform helps you raise 10x more than traditional fundraisers.
            </p>
          </div>
          <Button size="lg" onClick={() => navigate('/admin?view=create')} className="gap-2">
            <Plus className="w-5 h-5" />
            Create Your First Fundraiser
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      campaignName={campaign?.name}
      campaigns={campaigns.map(c => ({ id: c.id, name: c.name }))}
      selectedCampaignId={selectedCampaignId || undefined}
      onCampaignChange={setSelectedCampaignId}
      onCreateCampaign={() => navigate('/admin?view=create')}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Campaign Settings</h1>
            <p className="text-muted-foreground">Configure your campaign details and branding</p>
          </div>
          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={saving || !campaign}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {!campaign ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Select a campaign to edit settings</p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="general" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-xl">
              <TabsTrigger value="general">
                <Settings className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="branding">
                <Palette className="h-4 w-4 mr-2" />
                Branding
              </TabsTrigger>
              <TabsTrigger value="goals">
                <Target className="h-4 w-4 mr-2" />
                Goals
              </TabsTrigger>
              <TabsTrigger value="schedule">
                <CalendarDays className="h-4 w-4 mr-2" />
                Schedule
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>Basic campaign details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Organization Name</Label>
                      <Input
                        value={campaign.organization_name}
                        onChange={(e) => setCampaign({ ...campaign, organization_name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Program Name</Label>
                      <Input
                        value={campaign.name}
                        onChange={(e) => setCampaign({ ...campaign, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Organization Type</Label>
                      <Select
                        value={campaign.organization_type || 'school'}
                        onValueChange={(value) => setCampaign({ ...campaign, organization_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="school">School</SelectItem>
                          <SelectItem value="sports_team">Sports Team</SelectItem>
                          <SelectItem value="church">Church</SelectItem>
                          <SelectItem value="nonprofit">Nonprofit</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Select
                        value={((campaign.status === 'draft' || !campaign.status) ? 'active' : campaign.status)}
                        onValueChange={(value: 'active' | 'paused' | 'completed') => setCampaign({ ...campaign, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={campaign.description || ''}
                      onChange={(e) => setCampaign({ ...campaign, description: e.target.value })}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>Customize your campaign's visual identity</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Campaign Logo</Label>
                    <div className="flex items-start gap-6">
                      {campaign.logo_url ? (
                        <div className="relative">
                          <img
                            src={campaign.logo_url}
                            alt="Campaign logo"
                            className="w-32 h-32 object-contain rounded-lg border bg-card"
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={async () => {
                              const { error } = await supabase
                                .from('campaigns')
                                .update({ logo_url: null })
                                .eq('id', campaign.id);
                              if (!error) {
                                setCampaign({ ...campaign, logo_url: null });
                                toast.success('Logo removed');
                              }
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <Button variant="outline" disabled={uploading} asChild>
                          <label className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload Logo'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={handleLogoUpload}
                            />
                          </label>
                        </Button>
                        <p className="text-sm text-muted-foreground">
                          PNG, JPG up to 5MB. Colors will be extracted automatically.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Brand Colors</Label>
                    <p className="text-sm text-muted-foreground">
                      These colors are used for social media posts and campaign branding
                    </p>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm">Primary</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={campaign.brand_colors?.primary || '#3B82F6'}
                            onChange={(e) => updateBrandColor('primary', e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border"
                          />
                          <Input
                            value={campaign.brand_colors?.primary || '#3B82F6'}
                            onChange={(e) => updateBrandColor('primary', e.target.value)}
                            className="font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Secondary</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={campaign.brand_colors?.secondary || '#10B981'}
                            onChange={(e) => updateBrandColor('secondary', e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border"
                          />
                          <Input
                            value={campaign.brand_colors?.secondary || '#10B981'}
                            onChange={(e) => updateBrandColor('secondary', e.target.value)}
                            className="font-mono"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm">Accent</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={campaign.brand_colors?.accent || '#F59E0B'}
                            onChange={(e) => updateBrandColor('accent', e.target.value)}
                            className="w-12 h-10 rounded cursor-pointer border"
                          />
                          <Input
                            value={campaign.brand_colors?.accent || '#F59E0B'}
                            onChange={(e) => updateBrandColor('accent', e.target.value)}
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Color Preview */}
                    <div className="mt-4 p-4 rounded-lg border bg-card">
                      <p className="text-sm text-muted-foreground mb-3">Preview</p>
                      <div className="flex gap-4">
                        <div
                          className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: campaign.brand_colors?.primary || '#3B82F6' }}
                        >
                          Primary
                        </div>
                        <div
                          className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: campaign.brand_colors?.secondary || '#10B981' }}
                        >
                          Secondary
                        </div>
                        <div
                          className="w-20 h-20 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                          style={{ backgroundColor: campaign.brand_colors?.accent || '#F59E0B' }}
                        >
                          Accent
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="goals">
              <Card>
                <CardHeader>
                  <CardTitle>Goals & Targets</CardTitle>
                  <CardDescription>Set your fundraising objectives</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Fundraising Goal ($)</Label>
                      <Input
                        type="number"
                        value={campaign.goal_amount || ''}
                        onChange={(e) => setCampaign({ ...campaign, goal_amount: parseFloat(e.target.value) || null })}
                        placeholder="10000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Program Size (participants)</Label>
                      <Input
                        type="number"
                        value={campaign.program_size || ''}
                        onChange={(e) => setCampaign({ ...campaign, program_size: parseInt(e.target.value) || null })}
                        placeholder="50"
                      />
                    </div>
                  </div>

                  {campaign.goal_amount && campaign.program_size && (
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Average per participant</p>
                      <p className="text-2xl font-bold text-primary">
                        ${(campaign.goal_amount / campaign.program_size).toFixed(2)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>Set your campaign timeline</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !campaign.start_date && 'text-muted-foreground'
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {campaign.start_date
                              ? format(new Date(campaign.start_date), 'PPP')
                              : 'Select start date'
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={campaign.start_date ? new Date(campaign.start_date) : undefined}
                            onSelect={(date) => setCampaign({
                              ...campaign,
                              start_date: date?.toISOString() || null
                            })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !campaign.end_date && 'text-muted-foreground'
                            )}
                          >
                            <CalendarDays className="mr-2 h-4 w-4" />
                            {campaign.end_date
                              ? format(new Date(campaign.end_date), 'PPP')
                              : 'Select end date'
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={campaign.end_date ? new Date(campaign.end_date) : undefined}
                            onSelect={(date) => setCampaign({
                              ...campaign,
                              end_date: date?.toISOString() || null
                            })}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {campaign.start_date && campaign.end_date && (
                    <div className="p-4 rounded-lg bg-muted">
                      <p className="text-sm text-muted-foreground">Campaign Duration</p>
                      <p className="text-2xl font-bold text-primary">
                        {Math.ceil((new Date(campaign.end_date).getTime() - new Date(campaign.start_date).getTime()) / (1000 * 60 * 60 * 24))} days
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AdminLayout>
  );
}
