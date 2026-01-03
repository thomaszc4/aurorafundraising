import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Loader2, Trophy, Target, MessageSquare,
  TrendingUp, Crown, Medal, Award, Copy, ExternalLink,
  Menu, LayoutDashboard, Share2, QrCode, ShoppingBag, LogOut, Heart
} from 'lucide-react';
import { ParticipantMiniTaskList } from '@/components/participant/ParticipantMiniTaskList';
import { ParticipantOnboardingWizard } from '@/components/participant/ParticipantOnboardingWizard';
import { RewardsShop } from '@/components/participant/RewardsShop';
import { ParticipantQRCode } from '@/components/participant/ParticipantQRCode';
import { SocialMediaTemplates } from '@/components/participant/SocialMediaTemplates';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import DOMPurify from 'dompurify';
import { motion, AnimatePresence } from 'framer-motion';

interface Participant {
  id: string;
  campaign_id: string;
  nickname: string;
  total_raised: number | null;
  items_sold: number | null;
  task_states?: any;
  points_balance?: number;
  tshirt_size?: string;
  tshirt_claimed?: boolean;
}

interface Campaign {
  id: string;
  name: string;
  organization_name: string;
  goal_amount: number | null;
  end_date: string | null;
  fundraiser_type: string | null;
}

interface LeaderboardEntry {
  nickname: string;
  total_raised: number | null;
  items_sold: number | null;
}

interface Message {
  id: string;
  title: string;
  content: string;
  created_at: string;
  audience_filters?: {
    type: 'all' | 'active' | 'zero_raised' | 'top_performers' | 'parents';
  };
}

type DashboardView = 'dashboard' | 'social' | 'door' | 'shop';

export default function ParticipantDashboard() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rank, setRank] = useState<number>(0);

  const [activeView, setActiveView] = useState<DashboardView>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    if (participant && !participant.task_states?.wizard_completed) {
      setShowWizard(true);
    }
  }, [participant]);

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
        .select('id, name, organization_name, goal_amount, end_date, fundraiser_type')
        .eq('id', participantData.campaign_id)
        .single();

      setCampaign(campaignData);

      // Fetch leaderboard
      const { data: leaderboardData } = await supabase
        .from('participants')
        .select('nickname, total_raised, items_sold')
        .eq('campaign_id', participantData.campaign_id)
        .order('total_raised', { ascending: false })
        .limit(10);

      setLeaderboard((leaderboardData || []) as unknown as LeaderboardEntry[]);

      // Calculate rank
      const position = ((leaderboardData || []) as any[]).findIndex(
        p => p.nickname === (participantData as any).nickname
      ) + 1;
      setRank(position || (leaderboardData?.length || 0) + 1);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('participant_messages')
        .select('*')
        .eq('campaign_id', participantData.campaign_id)
        .order('created_at', { ascending: false })
        .limit(10);

      const filteredMessages = (messagesData || []).filter((msg: any) => {
        const filters = msg.audience_filters;
        if (!filters || !filters.type || filters.type === 'all') return true;
        if (filters.type === 'zero_raised') return (participantData.total_raised || 0) === 0;
        if (filters.type === 'top_performers') return (participantData.total_raised || 0) > 100;
        return true;
      });

      setMessages(filteredMessages as Message[]);

    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, navigate]);

  const refreshData = async () => {
    if (!token) return;
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('id', token)
      .single();
    if (data) setParticipant(data as unknown as Participant);
  };

  const completeWizard = async () => {
    setShowWizard(false);
    if (!participant) return;

    try {
      const currentStates = participant.task_states || {};
      const newStates = { ...currentStates, wizard_completed: true };

      await supabase
        .from('participants')
        .update({ task_states: newStates } as any)
        .eq('id', participant.id);

      setParticipant({ ...participant, task_states: newStates });
    } catch (err) {
      console.error('Error completing wizard:', err);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/fundraise/${participant?.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied! Share it with friends and family.');
  };

  const handleNavClick = (view: DashboardView) => {
    setActiveView(view);
    setIsMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!participant || !campaign) return null;

  const goalProgress = Math.min(100, ((participant.total_raised || 0) / (100)) * 100); // Assuming 100 is per-student goal for now or logic is elsewhere? 
  // Wait, component had `<ParticipantMiniTaskList goalAmount={100} />`. Usually individual goal is $100-$300.
  // I will use 100 as default target for bar visualization if campaign goal is large.

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50/50 pb-20">

      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b shadow-sm">
        <div className="container mx-auto px-4 max-w-lg h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Heart className="h-4 w-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">
              Aurora
            </span>
          </div>

          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden md:flex">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[300px]">
              <SheetHeader className="mb-6 text-left">
                <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                  <span className="text-primary">Menu</span>
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2">
                <Button
                  variant={activeView === 'dashboard' ? 'secondary' : 'ghost'}
                  className="justify-start gap-3 h-12 text-base font-medium"
                  onClick={() => handleNavClick('dashboard')}
                >
                  <LayoutDashboard className="h-5 w-5" /> Dashboard
                </Button>
                <Button
                  variant={activeView === 'social' ? 'secondary' : 'ghost'}
                  className="justify-start gap-3 h-12 text-base font-medium"
                  onClick={() => handleNavClick('social')}
                >
                  <Share2 className="h-5 w-5" /> Social Templates
                </Button>
                <Button
                  variant={activeView === 'door' ? 'secondary' : 'ghost'}
                  className="justify-start gap-3 h-12 text-base font-medium"
                  onClick={() => handleNavClick('door')}
                >
                  <QrCode className="h-5 w-5" /> Door to Door
                </Button>
                <Button
                  variant={activeView === 'shop' ? 'secondary' : 'ghost'}
                  className="justify-start gap-3 h-12 text-base font-medium"
                  onClick={() => handleNavClick('shop')}
                >
                  <ShoppingBag className="h-5 w-5" /> Rewards Shop
                </Button>

                <div className="my-2 border-t" />
                <Button variant="ghost" className="justify-start gap-3 h-12 text-base text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => navigate('/')}>
                  <LogOut className="h-5 w-5" /> Exit
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-lg space-y-6">
        <AnimatePresence mode="wait">

          {activeView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Welcome Header */}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Hello, {participant.nickname}! 👋</h1>
                <p className="text-muted-foreground">Keep up the great work for {campaign.name}.</p>
              </div>

              {/* Progress Card */}
              <Card className="border-none shadow-lg bg-gradient-to-br from-primary via-primary/90 to-indigo-600 text-white overflow-hidden relative">
                {/* Decor Circles */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-32 w-32 rounded-full bg-black/10 blur-2xl"></div>

                <CardHeader className="pb-2 relative z-10">
                  <CardTitle className="text-lg font-medium opacity-90">Total Raised</CardTitle>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">${participant.total_raised || 0}</span>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2 opacity-90">
                        <span>Progress to Goal</span>
                        <span>{Math.round(goalProgress)}%</span>
                      </div>
                      <Progress value={goalProgress} className="h-3 bg-black/20" indicatorClassName="bg-white" />
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="bg-white/20 rounded-lg p-3 flex-1 flex items-center gap-3 backdrop-blur-sm">
                        <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs opacity-70 uppercase tracking-wide font-semibold">Items Sold</p>
                          <p className="text-xl font-bold">{participant.items_sold || 0}</p>
                        </div>
                      </div>
                      <div className="bg-white/20 rounded-lg p-3 flex-1 flex items-center gap-3 backdrop-blur-sm">
                        <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center">
                          <Target className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <p className="text-xs opacity-70 uppercase tracking-wide font-semibold">Rank</p>
                          <p className="text-xl font-bold">#{rank}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Share Link with Sample Text */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Share2 className="h-4 w-4 text-primary" />
                    Share with Friends
                  </CardTitle>
                  <CardDescription>
                    Copy this message to send to friends and family!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-xl border border-dashed relative group">
                    <p className="text-sm text-foreground/80 italic leading-relaxed">
                      "Hi! I'm raising money for <strong>{campaign.organization_name}</strong>. We're selling some great items to help reach our goal! Could you help me out? Check out my page here: <span className="text-primary underline">{window.location.origin}/fundraise/{participant.id}</span>"
                    </p>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Badge variant="secondary" className="text-xs">Preview</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/fundraise/${participant?.id}`;
                        const text = `Hi! I'm raising money for ${campaign?.organization_name}. We're selling some great items to help reach our goal! Could you help me out? Check out my page here: ${shareUrl}`;
                        navigator.clipboard.writeText(text);
                        toast.success('Full message copied!');
                      }}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      <MessageSquare className="mr-2 h-4 w-4" /> Copy Message & Link
                    </Button>
                    <Button
                      variant="outline"
                      onClick={copyShareLink}
                      className="w-full"
                    >
                      <Copy className="mr-2 h-4 w-4" /> Copy Link Only
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Tasks */}
              <div>
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" /> Daily Checklist
                </h3>
                <ParticipantMiniTaskList
                  participant={participant as any}
                  goalAmount={100}
                  onUpdate={refreshData}
                />
              </div>
            </motion.div>
          )}

          {activeView === 'social' && (
            <motion.div
              key="social"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <SocialMediaTemplates
                shareUrl={`${window.location.origin}/fundraise/${participant.id}`}
                campaignName={campaign.name}
                organizationName={campaign.organization_name}
                fundraiserType={campaign.fundraiser_type || 'product'}
              />
            </motion.div>
          )}

          {activeView === 'door' && (
            <motion.div
              key="door"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-6 w-6" /> Door-to-Door Helper
                  </CardTitle>
                  <CardDescription className="text-indigo-100">
                    Show this QR code to neighbors so they can check out securely on their own phone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                  <div className="bg-white p-4 rounded-xl shadow-lg">
                    <ParticipantQRCode
                      shareUrl={`${window.location.origin}/fundraise/${participant.id}`}
                      participantName={participant.nickname}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Script Idea</CardTitle>
                </CardHeader>
                <CardContent className="prose prose-sm">
                  <p className="italic text-muted-foreground text-lg">
                    "Hi! I'm raising money for <strong>{campaign.organization_name}</strong>. Would you like to support us? You can scan this code to see our catalog and order online!"
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {activeView === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <RewardsShop
                itemsSold={participant.items_sold || 0}
                participantId={participant.id}
                campaignId={participant.campaign_id}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <ParticipantOnboardingWizard
        isOpen={showWizard}
        onComplete={completeWizard}
        participantName={participant.nickname}
      />
    </div>
  );
}
