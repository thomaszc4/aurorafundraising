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

    const finalNickname = nickname.trim() || `Supporter ${Math.floor(Math.random() * 10000)}`;
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();

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
          nickname: finalNickname,
          pin_hash: randomPin // In production, hash this properly
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
              <Label htmlFor="nickname">Pick a Nickname (Optional)</Label>
              <Input
                id="nickname"
                placeholder="e.g., SuperSeller, CookieChamp"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                disabled={submitting}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank to stay anonymous
              </p>
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
