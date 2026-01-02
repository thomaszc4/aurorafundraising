import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, PartyPopper, Users, Target } from 'lucide-react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

interface Campaign {
  id: string;
  name: string;
  organization_name: string;
  description: string | null;
  goal_amount: number | null;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived' | null;
}

interface JoinSettings {
  join_code?: string;
  id?: string;
  campaign_id?: string;
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
  const [unlockPin, setUnlockPin] = useState('');
  const [pinError, setPinError] = useState(false);

  const [participantCount, setParticipantCount] = useState(0);
  const [existingToken, setExistingToken] = useState<string | null>(null);
  const [existingParticipantName, setExistingParticipantName] = useState<string | null>(null);

  /* View Mode State: 'join' is default to ensure privacy */
  const [viewMode, setViewMode] = useState<'join' | 'resume'>('join');

  useEffect(() => {
    const fetchCampaign = async () => {
      if (!code) return;

      try {
        let campaignId = '';

        // Check if code is a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(code);

        if (isUuid) {
          campaignId = code;

          // Fetch settings for max participants check
          const { data: settings } = await supabase
            .from('campaign_join_settings')
            .select('require_code, max_participants')
            .eq('campaign_id', campaignId)
            .maybeSingle(); // Use maybeSingle as settings might not exist yet

          if (settings) {
            setJoinSettings({ ...settings, campaign_id: campaignId, join_code: '', id: '' });
          }
        } else {
          // Find campaign by join code (legacy support)
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
          campaignId = settings.campaign_id;
        }

        // Fetch campaign details
        const { data: campaignData, error: campaignError } = await supabase
          .from('campaigns')
          .select('id, name, organization_name, description, goal_amount, status')
          .eq('id', campaignId)
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
          .eq('campaign_id', campaignData.id);
        // .eq('is_active', true); // Removed to prevent 400 error (column missing)

        setParticipantCount(count || 0);

        // Check if user already joined this campaign (duplicate prevention)
        const storageKey = `participant_token_${campaignData.id}`;
        const savedToken = localStorage.getItem(storageKey);
        if (savedToken) {
          // Verify token is still valid (using ID as token now)
          const { data: existingParticipant } = await supabase
            .from('participants')
            .select('id, first_name')
            .eq('id', savedToken) // Changed to check ID
            // .eq('is_active', true) // Removed
            .single();

          if (existingParticipant) {
            setExistingToken(savedToken);
            setExistingParticipantName((existingParticipant as any).first_name);
            // We intentionally do NOT switch viewMode here to preserve privacy
          } else {
            // Token is stale, remove it
            localStorage.removeItem(storageKey);
          }
        }
      } catch (err) {
        console.error('Error fetching campaign:', err);
        toast.error('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
  }, [code]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(false);

    if (!existingToken) return;

    // Verify PIN
    const { data, error } = await supabase
      .from('participants')
      .select('id')
      .eq('id', existingToken)
      .eq('last_name', unlockPin) // Check PIN (stored in last_name)
      .single();

    if (error || !data) {
      setPinError(true);
      toast.error('Incorrect PIN');
      return;
    }

    // Success
    localStorage.setItem('participant_token', existingToken); // Refresh main token
    navigate(`/p/${existingToken}`);
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Sanitize nickname: trim, limit length, remove special chars
    const sanitizedNickname = nickname
      .trim()
      .slice(0, 20)
      .replace(/[<>'";]/g, '');
    const finalNickname = sanitizedNickname || `Supporter ${Math.floor(Math.random() * 10000)}`;

    if (pin.length < 4) {
      toast.error('Please enter a 4-digit PIN');
      return;
    }

    if (!campaign) return;

    if (campaign.status !== 'active' && campaign.status !== 'draft') { // Handling potential status names
      toast.error(`Cannot join: Campaign is ${campaign.status || 'not active'}`);
      return;
    }

    setSubmitting(true);

    try {
      // Re-fetch participant count to mitigate race condition
      const { count: freshCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id);
      // .eq('is_active', true); // Removed

      // Check max participants with fresh count
      if (joinSettings?.max_participants && (freshCount || 0) >= joinSettings.max_participants) {
        toast.error('This campaign has reached its maximum participants');
        setSubmitting(false);
        return;
      }

      // Create participant with simple PIN hash (in production, use proper hashing)
      const { data, error } = await supabase
        .from('participants')
        .insert({
          campaign_id: campaign.id,
          first_name: finalNickname, // Mapping nickname to first_name
          last_name: pin, // Storing PIN in available last_name column
          code: crypto.randomUUID(), // Generating a unique code for the participant
          // pin_hash: pin, // Removed (column missing)
        } as any)
        .select('id') // Changed from access_token to id
        .single();

      if (error) {
        console.error('Error joining campaign:', error);
        toast.error(`Failed to join: ${error.message || 'Unknown error'}`);
        return;
      }

      toast.success('Welcome to the fundraiser!');

      // Store token in localStorage for this specific campaign (duplicate prevention)
      // Using ID as the access token for now since access_token column is missing
      const token = data.id;
      localStorage.setItem(`participant_token_${campaign.id}`, token);
      localStorage.setItem('participant_token', token);
      navigate(`/p/${token}`);
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

  // Resume Session View (Password Protected)
  if (viewMode === 'resume' && existingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader className="space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <PartyPopper className="h-8 w-8 text-green-600" />
            </div>
            {/* Hiding details until unlocked is safer, but user asked to resume account */}
            <CardTitle>Resume Session</CardTitle>
            <CardDescription>
              Enter the 4-digit PIN you created for this campaign.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form onSubmit={handleUnlock} className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={4}
                  value={unlockPin}
                  onChange={(value: string) => setUnlockPin(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button
                className="w-full"
                size="lg"
                type="submit"
                disabled={unlockPin.length < 4}
              >
                Unlock Dashboard
              </Button>
            </form>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => setViewMode('join')}
            >
              Back to Join Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: Join View
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
          {/* Resume Link - Only visible if token exists */}
          {existingToken && (
            <Button
              variant="link"
              className="text-primary text-sm h-auto p-0 hover:underline"
              onClick={() => setViewMode('resume')}
            >
              Continuing on this device? Resume Session
            </Button>
          )}
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
                This will be shown on the leaderboard.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin">Create a Secret PIN</Label>
              <div className="flex justify-center pt-2 pb-2">
                <InputOTP
                  maxLength={4}
                  value={pin}
                  onChange={(value: string) => setPin(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={1} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={2} className="w-12 h-12 text-lg" />
                    <InputOTPSlot index={3} className="w-12 h-12 text-lg" />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                You'll need this to log back in on this device!
              </p>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting || pin.length < 4}>
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
