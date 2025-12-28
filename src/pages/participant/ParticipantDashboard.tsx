import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2, Trophy, Target, Share2, MessageSquare, Gift,
  TrendingUp, Crown, Medal, Award, Copy, ExternalLink
} from 'lucide-react';

interface Participant {
  id: string;
  campaign_id: string;
  first_name: string;
  total_raised: number | null;
  items_sold: number | null;
}

interface Campaign {
  id: string;
  name: string;
  organization_name: string;
  goal_amount: number | null;
  end_date: string | null;
}

interface Incentive {
  id: string;
  name: string;
  description: string | null;
  incentive_type: string;
  threshold_amount: number | null;
  threshold_items: number | null;
  reward: string;
}

interface LeaderboardEntry {
  first_name: string;
  total_raised: number | null;
  items_sold: number | null;
}

interface Message {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function ParticipantDashboard() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rank, setRank] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        navigate('/');
        return;
      }

      try {
        // Fetch participant
        const { data: participantData, error: participantError } = await supabase
          .from('participants')
          .select('*')
          .eq('id', token)
          // .eq('is_active', true) // Removed due to schema mismatch
          .single();

        if (participantError || !participantData) {
          toast.error('Session expired. Please join again.');
          navigate('/');
          return;
        }

        setParticipant(participantData as unknown as Participant);

        // Fetch campaign
        const { data: campaignData } = await supabase
          .from('campaigns')
          .select('id, name, organization_name, goal_amount, end_date')
          .eq('id', participantData.campaign_id)
          .single();

        setCampaign(campaignData);

        // Fetch incentives
        const { data: incentivesData } = await supabase
          .from('incentives')
          .select('*')
          .eq('campaign_id', participantData.campaign_id);
        // .eq('is_active', true); // Removed due to schema mismatch

        setIncentives(incentivesData || []);

        // Fetch leaderboard
        const { data: leaderboardData } = await supabase
          .from('participants')
          .select('first_name, total_raised, items_sold')
          .eq('campaign_id', participantData.campaign_id)
          // .eq('is_active', true) // Removed due to schema mismatch
          .order('total_raised', { ascending: false })
          .limit(10);

        setLeaderboard((leaderboardData || []) as unknown as LeaderboardEntry[]);

        // Calculate rank
        const position = ((leaderboardData || []) as any[]).findIndex(
          p => p.first_name === (participantData as any).first_name
        ) + 1;
        setRank(position || (leaderboardData?.length || 0) + 1);

        // Fetch messages
        const { data: messagesData } = await supabase
          .from('participant_messages')
          .select('*')
          .eq('campaign_id', participantData.campaign_id)
          .order('created_at', { ascending: false })
          .limit(5);

        setMessages(messagesData || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/fundraise/${participant?.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied! Share it with friends and family.');
  };

  const getRankIcon = (position: number) => {
    if (position === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (position === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium text-muted-foreground">#{position}</span>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!participant || !campaign) {
    return null;
  }

  const personalGoal = 100; // Default personal goal
  const currentRaised = participant.total_raised || 0;
  const progress = Math.min((currentRaised / personalGoal) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-bold text-lg">{campaign.name}</h1>
              <p className="text-sm text-muted-foreground">{campaign.organization_name}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center justify-end gap-2 text-primary-foreground">
                <p className="font-medium">{participant.first_name}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    localStorage.removeItem('participant_token');
                    localStorage.removeItem(`participant_token_${participant.campaign_id}`);
                    navigate('/');
                  }}
                  title="Log Out"
                >
                  <ExternalLink className="h-4 w-4 rotate-180" />
                </Button>
              </div>
              <Badge variant="secondary" className="text-xs">
                #{rank} on leaderboard
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6 max-w-2xl">
        {/* Play Game Button */}
        <Card className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Trophy size={120} />
          </div>
          <CardContent className="p-6 relative z-10 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">Play Aurora</h2>
              <p className="text-violet-100 mb-4 max-w-[200px] text-sm">Explore the world, complete quests, and earn rewards!</p>
              <Button
                size="lg"
                variant="secondary"
                className="font-bold text-violet-700 hover:text-violet-800"
                onClick={() => navigate('/debug-game')}
              >
                Enter World
              </Button>
            </div>
            <div className="bg-white/10 p-3 rounded-full hidden sm:block">
              <Trophy className="h-10 w-10 text-yellow-300" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">${(participant.total_raised || 0).toFixed(0)}</p>
                <p className="text-sm opacity-90">Raised</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{participant.items_sold || 0}</p>
                <p className="text-sm text-muted-foreground">Items Sold</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress to Goal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Your Goal Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>${(participant.total_raised || 0).toFixed(0)} raised</span>
                <span>${personalGoal} goal</span>
              </div>
              <Progress value={progress} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {progress >= 100 ? "🎉 Goal reached!" : `${(personalGoal - (participant.total_raised || 0)).toFixed(0)} to go!`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Share Link */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share Your Link
            </CardTitle>
            <CardDescription>
              Send this to friends and family to support you!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button onClick={copyShareLink} className="flex-1">
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button variant="outline" asChild>
                <a href={`/fundraise/${participant.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Challenges/Incentives */}
        {incentives.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Gift className="h-4 w-4" />
                Challenges & Rewards
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {incentives.map((incentive) => {
                const participantRaised = participant.total_raised || 0;
                const participantItems = participant.items_sold || 0;

                const isCompleted = incentive.threshold_amount
                  ? participantRaised >= incentive.threshold_amount
                  : incentive.threshold_items
                    ? participantItems >= incentive.threshold_items
                    : false;

                const progressValue = incentive.threshold_amount
                  ? Math.min((participantRaised / incentive.threshold_amount) * 100, 100)
                  : incentive.threshold_items
                    ? Math.min((participantItems / incentive.threshold_items) * 100, 100)
                    : 0;

                return (
                  <div
                    key={incentive.id}
                    className={`p-3 rounded-lg border ${isCompleted ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-muted/50'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm flex items-center gap-2">
                          {incentive.name}
                          {isCompleted && <Badge variant="default" className="text-xs">Earned!</Badge>}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {incentive.description || `Reward: ${incentive.reward}`}
                        </p>
                      </div>
                      <Badge variant={isCompleted ? "default" : "secondary"} className="shrink-0">
                        {incentive.incentive_type === 'individual' && incentive.threshold_amount && `$${incentive.threshold_amount}`}
                        {incentive.incentive_type === 'individual' && incentive.threshold_items && `${incentive.threshold_items} items`}
                        {incentive.incentive_type === 'competition' && 'Top Seller'}
                        {incentive.incentive_type === 'group' && 'Team Goal'}
                      </Badge>
                    </div>
                    {incentive.incentive_type === 'individual' && (
                      <Progress value={progressValue} className="h-1.5 mt-2" />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-2 rounded-lg ${entry.first_name === participant.first_name
                    ? 'bg-primary/10 border border-primary/20'
                    : 'bg-muted/50'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 flex justify-center">
                      {getRankIcon(index + 1)}
                    </div>
                    <span className={`text-sm ${entry.first_name === participant.first_name ? 'font-semibold' : ''}`}>
                      {entry.first_name}
                      {entry.first_name === participant.first_name && ' (You)'}
                    </span>
                  </div>
                  <span className="font-medium text-sm">${(entry.total_raised || 0).toFixed(0)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        {messages.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages from Coach
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="p-3 rounded-lg bg-muted/50 border">
                  <p className="font-medium text-sm">{message.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{message.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(message.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
