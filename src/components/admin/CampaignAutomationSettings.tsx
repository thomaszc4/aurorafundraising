import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, Hand, Bell, Mail, Share2, Heart, Sparkles, 
  Settings2, Loader2, CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  AutomationMode, 
  AutomationSettings,
  getAutomationSettings, 
  createDefaultSettings,
  updateAutomationSettings 
} from '@/services/automationEngine';
import { cn } from '@/lib/utils';

interface CampaignAutomationSettingsProps {
  campaignId: string;
}

const modeOptions: { 
  mode: AutomationMode; 
  label: string; 
  description: string; 
  icon: React.ElementType;
  color: string;
}[] = [
  {
    mode: 'manual',
    label: 'Manual Control',
    description: 'You decide when each action happens. Nothing runs automatically.',
    icon: Hand,
    color: 'border-blue-500 bg-blue-50 dark:bg-blue-950',
  },
  {
    mode: 'approval_required',
    label: 'Approval Required',
    description: 'System prepares everything, but waits for your approval before sending.',
    icon: Bell,
    color: 'border-amber-500 bg-amber-50 dark:bg-amber-950',
  },
  {
    mode: 'autopilot',
    label: 'Autopilot Mode',
    description: 'System handles everything automatically based on your campaign dates.',
    icon: Zap,
    color: 'border-green-500 bg-green-50 dark:bg-green-950',
  },
];

const categorySettings = [
  {
    key: 'auto_send_invitations' as const,
    label: 'Participant Invitations',
    description: 'Automatically send invitations when participants are added',
    icon: Mail,
  },
  {
    key: 'auto_send_reminders' as const,
    label: 'Campaign Reminders',
    description: 'Send progress updates and reminder emails on schedule',
    icon: Bell,
  },
  {
    key: 'auto_celebrate_milestones' as const,
    label: 'Milestone Celebrations',
    description: 'Automatically celebrate when goals are reached',
    icon: Sparkles,
  },
  {
    key: 'auto_thank_donors' as const,
    label: 'Donor Thank Yous',
    description: 'Send appreciation emails to donors after purchases',
    icon: Heart,
  },
  {
    key: 'auto_generate_social_posts' as const,
    label: 'Social Post Suggestions',
    description: 'Generate and suggest social media content',
    icon: Share2,
  },
];

export function CampaignAutomationSettings({ campaignId }: CampaignAutomationSettingsProps) {
  const [settings, setSettings] = useState<AutomationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [campaignId]);

  const loadSettings = async () => {
    setLoading(true);
    let data = await getAutomationSettings(campaignId);
    
    if (!data) {
      data = await createDefaultSettings(campaignId);
    }
    
    setSettings(data);
    setLoading(false);
  };

  const handleModeChange = async (mode: AutomationMode) => {
    if (!settings) return;
    
    setSaving(true);
    const success = await updateAutomationSettings(campaignId, { automation_mode: mode });
    
    if (success) {
      setSettings({ ...settings, automation_mode: mode });
      toast.success(`Switched to ${modeOptions.find(m => m.mode === mode)?.label}`);
    } else {
      toast.error('Failed to update settings');
    }
    setSaving(false);
  };

  const handleToggle = async (key: keyof AutomationSettings, value: boolean) => {
    if (!settings) return;
    
    setSaving(true);
    const success = await updateAutomationSettings(campaignId, { [key]: value });
    
    if (success) {
      setSettings({ ...settings, [key]: value });
    } else {
      toast.error('Failed to update setting');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Failed to load automation settings
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Automation Mode Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Automation Mode
          </CardTitle>
          <CardDescription>
            Choose how much the system should handle automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {modeOptions.map(({ mode, label, description, icon: Icon, color }) => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                disabled={saving}
                className={cn(
                  "relative p-4 rounded-lg border-2 text-left transition-all",
                  "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary",
                  settings.automation_mode === mode 
                    ? color 
                    : "border-border bg-card hover:bg-muted/50"
                )}
              >
                {settings.automation_mode === mode && (
                  <CheckCircle className="absolute top-3 right-3 h-5 w-5 text-green-600" />
                )}
                <Icon className={cn(
                  "h-8 w-8 mb-3",
                  settings.automation_mode === mode 
                    ? "text-foreground" 
                    : "text-muted-foreground"
                )} />
                <h3 className="font-semibold mb-1">{label}</h3>
                <p className="text-sm text-muted-foreground">{description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category-specific Settings */}
      {settings.automation_mode !== 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              What to Automate
            </CardTitle>
            <CardDescription>
              Fine-tune which tasks should run automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categorySettings.map(({ key, label, description, icon: Icon }, index) => (
              <React.Fragment key={key}>
                {index > 0 && <Separator />}
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-muted">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <Label htmlFor={key} className="font-medium">
                        {label}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {description}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id={key}
                    checked={settings[key] as boolean}
                    onCheckedChange={(checked) => handleToggle(key, checked)}
                    disabled={saving}
                  />
                </div>
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Status Summary */}
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.automation_mode === 'autopilot' ? (
                <Badge className="bg-green-600">
                  <Zap className="h-3 w-3 mr-1" />
                  Autopilot Active
                </Badge>
              ) : settings.automation_mode === 'approval_required' ? (
                <Badge className="bg-amber-600">
                  <Bell className="h-3 w-3 mr-1" />
                  Approval Required
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Hand className="h-3 w-3 mr-1" />
                  Manual Mode
                </Badge>
              )}
              <span className="text-sm text-muted-foreground">
                {settings.automation_mode === 'autopilot' 
                  ? 'The system will handle tasks automatically based on your campaign schedule.'
                  : settings.automation_mode === 'approval_required'
                  ? 'You\'ll be notified before any automated action is taken.'
                  : 'You have full control over every action.'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
