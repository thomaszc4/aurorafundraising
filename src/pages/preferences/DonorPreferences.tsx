import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Settings, Eye, Mail, Bell, CheckCircle, Shield, Heart } from 'lucide-react';

interface DonorData {
  id: string;
  name: string;
  email: string;
  display_name: string | null;
  display_on_wall: boolean;
  communication_preference: string | null;
  campaign_id: string;
  campaign?: {
    name: string;
    organization_name: string;
  };
}

export default function DonorPreferences() {
  const { donorId } = useParams();
  const [donor, setDonor] = useState<DonorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [preferences, setPreferences] = useState({
    displayOnWall: true,
    displayName: '',
    communicationPreference: 'monthly',
  });

  useEffect(() => {
    if (donorId) {
      fetchDonorData();
    }
  }, [donorId]);

  const fetchDonorData = async () => {
    try {
      const { data, error } = await supabase
        .from('donors')
        .select(`
          id,
          name,
          email,
          display_name,
          display_on_wall,
          communication_preference,
          campaign_id,
          campaigns:campaign_id (
            name,
            organization_name
          )
        `)
        .eq('id', donorId)
        .single();

      if (error) throw error;
      
      const donorData = {
        ...data,
        campaign: Array.isArray(data.campaigns) ? data.campaigns[0] : data.campaigns
      } as DonorData;
      
      setDonor(donorData);
      setPreferences({
        displayOnWall: donorData.display_on_wall ?? true,
        displayName: donorData.display_name || '',
        communicationPreference: donorData.communication_preference || 'monthly',
      });
    } catch (error) {
      console.error('Error fetching donor data:', error);
      toast.error('Unable to load your preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!donor) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('donors')
        .update({
          display_on_wall: preferences.displayOnWall,
          display_name: preferences.displayName || null,
          communication_preference: preferences.communicationPreference,
        })
        .eq('id', donor.id);

      if (error) throw error;

      setSaved(true);
      toast.success('Preferences saved successfully!');
      
      // Reset saved indicator after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (error: any) {
      console.error('Error saving preferences:', error);
      toast.error(error.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-tight py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3 mx-auto" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!donor) {
    return (
      <Layout>
        <div className="container-tight py-12 text-center">
          <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Preferences Not Found</h1>
          <p className="text-muted-foreground">
            This preference link may be invalid or expired. Please check your email for a valid link.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-tight py-12">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Settings className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Preferences</h1>
          <p className="text-muted-foreground">
            Manage how you're recognized and stay connected with{' '}
            <span className="font-medium text-foreground">
              {donor.campaign?.organization_name || 'our organization'}
            </span>
          </p>
        </div>

        <div className="space-y-6">
          {/* Recognition Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Eye className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <CardTitle>Recognition Settings</CardTitle>
                  <CardDescription>
                    Control how your name appears on our supporter wall
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="displayOnWall" className="font-medium">
                    Display on Supporter Wall
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Show your name as a supporter on our public recognition wall
                  </p>
                </div>
                <Switch
                  id="displayOnWall"
                  checked={preferences.displayOnWall}
                  onCheckedChange={(checked) => 
                    setPreferences({ ...preferences, displayOnWall: checked })
                  }
                />
              </div>

              {preferences.displayOnWall && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={preferences.displayName}
                      onChange={(e) => 
                        setPreferences({ ...preferences, displayName: e.target.value })
                      }
                      placeholder={donor.name}
                    />
                    <p className="text-sm text-muted-foreground">
                      Customize how your name appears. Leave blank to use "{donor.name}"
                    </p>
                  </div>

                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-1">Preview:</p>
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-primary" />
                      <span className="font-medium">
                        {preferences.displayName || donor.name}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Communication Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Communication Preferences</CardTitle>
                  <CardDescription>
                    Choose how often you'd like to hear from us
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="frequency">Email Frequency</Label>
                <Select
                  value={preferences.communicationPreference}
                  onValueChange={(value) => 
                    setPreferences({ ...preferences, communicationPreference: value })
                  }
                >
                  <SelectTrigger id="frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Weekly updates
                      </div>
                    </SelectItem>
                    <SelectItem value="monthly">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Monthly updates
                      </div>
                    </SelectItem>
                    <SelectItem value="quarterly">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Quarterly updates
                      </div>
                    </SelectItem>
                    <SelectItem value="major_only">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Major announcements only
                      </div>
                    </SelectItem>
                    <SelectItem value="never">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-muted-foreground" />
                        No emails (opt out)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>What you'll receive:</strong>
                  {preferences.communicationPreference === 'weekly' && ' Weekly progress updates, impact stories, and fundraising news'}
                  {preferences.communicationPreference === 'monthly' && ' Monthly summary of progress and impact stories'}
                  {preferences.communicationPreference === 'quarterly' && ' Quarterly impact reports with photos and stories'}
                  {preferences.communicationPreference === 'major_only' && ' Only important milestones and campaign completions'}
                  {preferences.communicationPreference === 'never' && ' You won\'t receive any marketing emails (transactional emails like receipts will still be sent)'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-center">
            <Button 
              onClick={handleSave} 
              size="lg" 
              disabled={saving}
              className="min-w-[200px]"
            >
              {saving ? (
                'Saving...'
              ) : saved ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Saved!
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>

          {/* Footer Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Your email: <span className="font-medium">{donor.email}</span>
            </p>
            <p className="mt-1">
              Questions? Contact{' '}
              <a href="/contact" className="text-primary hover:underline">
                our support team
              </a>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
