import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, PartyPopper, Users, Target } from 'lucide-react';

interface Campaign {
  id: string;
  name: string;
  organization_name: string;
  description: string | null;
  goal_amount: number | null;
}

interface JoinSettings {
  require_code: boolean;
  max_participants: number | null;
}

export default function JoinCampaign() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [joinSettings, setJoinSettings] = useState<JoinSettings | null>(null);
  const [nickname, setNickname] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!code) return;

      try {
        // Find campaign by join code
        const { data: settings, error: settingsError } = await supabase
          .from('campaign_join_settings')
          .select('campaign_id, require_code, max_participants')
          .eq('join_code', code.toUpperCase())
          .single();

        if (settingsError || !settings) {
          toast.error('Campaign not found');
          setLoading(false);
          return;
        }

        setJoinSettings(settings);

        // Fetch campaign details
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, name, organization_name, description, goal_amount')
          .eq('id', settings.campaign_id)
          .single();

        if (campaignError || !campaignData) {
          toast.error('Campaign not found');
          setLoading(false);
          return;
        }

        setCampaign(campaignData);

        // Get current participant count
        const { count } = await supabase
          .from('participants')
          .select('*', { count: 'exact', head: true })
          .eq('campaign_id', campaignData.id)
          .eq('is_active', true);

        setParticipantCount(count || 0);
      } catch (err) {
        console.error('Error fetching campaign:', err);
        toast.error('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [code]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast.error('Please enter a nickname');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      toast.error('PIN must be 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    if (!campaign) return;

    // Check max participants
    if (joinSettings?.max_participants && participantCount >= joinSettings.max_participants) {
      toast.error('This campaign has reached its maximum participants');
      return;
    }

    setSubmitting(true);

    try {
      // Create participant with simple PIN hash (in production, use proper hashing)
      const { data, error } = await supabase
        .from('participants')
        .insert({
          campaign_id: campaign.id,
          nickname: nickname.trim(),
          pin_hash: pin // In production, hash this properly
        })
        .select('access_token')
        .single();

      if (error) {
        console.error('Error joining:', error);
        toast.error('Failed to join campaign');
        return;
      }

      toast.success('Welcome to the fundraiser!');
      
      // Store token and redirect
      localStorage.setItem('participant_token', data.access_token);
      navigate(`/p/${data.access_token}`);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-destructive">Campaign Not Found</CardTitle>
            <CardDescription>
              This join link may be invalid or expired. Ask your teacher or coach for the correct link!
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <PartyPopper className="h-8 w-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl">{campaign.name}</CardTitle>
            <CardDescription className="text-base mt-1">
              {campaign.organization_name}
            </CardDescription>
          </div>
          {campaign.description && (
            <p className="text-sm text-muted-foreground">{campaign.description}</p>
          )}
          <div className="flex justify-center gap-6 pt-2">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{participantCount} joined</span>
            </div>
            {campaign.goal_amount && (
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span>${campaign.goal_amount.toLocaleString()} goal</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">Pick a Nickname</Label>
              <Input
                id="nickname"
                placeholder="e.g., SuperSeller, CookieChamp"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                This is how you'll appear on the leaderboard
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">Create a 4-Digit PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                You'll use this to log back in
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                disabled={submitting}
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : (
                'Join the Fundraiser!'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
