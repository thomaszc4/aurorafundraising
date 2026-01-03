import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Users, DollarSign, ShoppingCart, Target, ArrowLeft, Gamepad2, Clock } from 'lucide-react';
import { CreateCampaignWizard } from '@/components/admin/CreateCampaignWizard';
import { FundraiserProjectManager } from '@/components/admin/FundraiserProjectManager';
import { FundraiserComparison } from '@/components/admin/FundraiserComparison';
import { ProfileEditor } from '@/components/admin/ProfileEditor';
import { ResourcesManager } from '@/components/admin/ResourcesManager';
import { SocialPostGenerator } from '@/components/admin/SocialPostGenerator';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProgressEnhanced } from '@/components/ui/progress-enhanced';
import { OnboardingTutorial } from '@/components/admin/OnboardingTutorial';
import { DashboardTaskList } from '@/components/admin/DashboardTaskList';
import { ParticipantManager } from '@/components/admin/ParticipantManager';
import { CommunicationCenter } from '@/components/admin/CommunicationCenter';
import { IncentiveManager } from '@/components/admin/IncentiveManager';
import { AuroraGame } from '@/components/game/AuroraGame';
import { Support } from '@/components/admin/Support';
import { Tables } from '@/integrations/supabase/types';
import { applyTheme, BrandColors } from '@/lib/theme';

type Campaign = Tables<'campaigns'>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignStats, setCampaignStats] = useState({
    totalStudents: 0,
    totalOrders: 0,
    totalRaised: 0,
    goalProgress: 0,
    avgRaised: 0,
    daysLeft: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  // View state from URL params
  const currentView = searchParams.get('view') || 'overview';

  useEffect(() => {
    fetchCampaigns();
    // checkFirstVisit(); // Hiding video for now
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      applyTheme((selectedCampaign.brand_colors as unknown) as BrandColors);
      fetchCampaignStats(selectedCampaign.id);
    } else {
      applyTheme(null);
    }

    return () => applyTheme(null);
  }, [selectedCampaign]);

  const checkFirstVisit = async () => {
    const hasSeenTutorial = localStorage.getItem('aurora_seen_tutorial');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  };

  const handleTutorialComplete = () => {
    localStorage.setItem('aurora_seen_tutorial', 'true');
    setShowTutorial(false);
  };

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_admin_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCampaigns(data || []);
      if (data && data.length > 0) {
        setSelectedCampaign(data[0]);
      } else {
        // Auto-start creation wizard for new users
        setView('create');
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignStats = async (campaignId: string) => {
    try {
      const [studentsRes, participantsRes] = await Promise.all([
        supabase
          .from('student_fundraisers')
          .select('id, total_raised')
          .eq('campaign_id', campaignId),
        supabase
          .from('participants')
          .select('id, total_raised')
          .eq('campaign_id', campaignId)
      ]);

      const fundraisers = studentsRes.data || [];
      const participants = participantsRes.data || [];

      const studentsCount = fundraisers.length + participants.length;
      const fundraiserIds = fundraisers.map(f => f.id);
      const participantIds = participants.map(p => p.id);

      let ordersCount = 0;
      let totalRaised = 0;

      // Count orders from both types
      const [studentOrders, participantOrders] = await Promise.all([
        fundraiserIds.length > 0
          ? supabase.from('orders').select('*', { count: 'exact', head: true }).in('student_fundraiser_id', fundraiserIds).eq('status', 'completed')
          : Promise.resolve({ count: 0 }),
        participantIds.length > 0
          ? supabase.from('orders').select('*', { count: 'exact', head: true }).in('participant_id', participantIds).eq('status', 'completed')
          : Promise.resolve({ count: 0 })
      ]);

      ordersCount = (studentOrders.count || 0) + (participantOrders.count || 0);

      const studentsRaised = fundraisers.reduce((sum, f) => sum + Number(f.total_raised || 0), 0);
      const participantsRaised = participants.reduce((sum, p) => sum + Number(p.total_raised || 0), 0);
      totalRaised = studentsRaised + participantsRaised;

      const goalAmount = selectedCampaign?.goal_amount || 0;
      const goalProgress = goalAmount > 0 ? (totalRaised / Number(goalAmount)) * 100 : 0;
      const avgRaised = studentsCount && studentsCount > 0 ? totalRaised / studentsCount : 0;

      let daysLeft = 0;
      if (selectedCampaign?.end_date) {
        const end = new Date(selectedCampaign.end_date);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      setCampaignStats({
        totalStudents: studentsCount || 0,
        totalOrders: ordersCount,
        totalRaised,
        goalProgress: Math.min(goalProgress, 100),
        avgRaised,
        daysLeft,
      });
    } catch (error) {
      console.error('Error fetching campaign stats:', error);
    }
  };

  const handleCampaignCreated = () => {
    setSearchParams({});
    fetchCampaigns();
  };

  const handleCampaignChange = (campaignId: string) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    if (campaign) {
      setSelectedCampaign(campaign);
    }
  };

  const setView = (view: string) => {
    if (view === 'overview') {
      setSearchParams({});
    } else {
      setSearchParams({ view });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Show wizard when creating
  if (currentView === 'create') {
    return (
      <AdminLayout
        campaignName={selectedCampaign?.name}
        campaigns={campaigns.map(c => ({ id: c.id, name: c.name }))}
        selectedCampaignId={selectedCampaign?.id}
        onCampaignChange={handleCampaignChange}
        onCreateCampaign={() => setView('create')}
      >
        <CreateCampaignWizard
          onComplete={handleCampaignCreated}
          onCancel={() => setView('overview')}
        />
      </AdminLayout>
    );
  }

  // No campaigns - show create CTA
  if (campaigns.length === 0) {
    return (
      <AdminLayout>
        {showTutorial && <OnboardingTutorial onComplete={handleTutorialComplete} />}
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
          <Button size="lg" onClick={() => setView('create')} className="gap-2">
            <Plus className="w-5 h-5" />
            Create Your First Fundraiser
          </Button>
        </div>
      </AdminLayout>
    );
  }

  // Render different views based on URL param
  const renderContent = () => {
    const BackButton = ({ onClick }: { onClick: () => void }) => (
      <Button variant="ghost" onClick={onClick} className="mb-4 gap-2">
        <ArrowLeft className="h-4 w-4" />
        Back to Overview
      </Button>
    );

    switch (currentView) {
      case 'project-manager':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <FundraiserProjectManager
              campaignId={selectedCampaign.id}
              fundraiserTypeId={selectedCampaign.fundraiser_type || 'product'}
              startDate={selectedCampaign.start_date ? new Date(selectedCampaign.start_date) : undefined}
              onClose={() => setView('overview')}
              onNavigate={(view) => setView(view)}
            />
          </>
        );

      case 'game':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Aurora Tundra (Preview)</h2>
                  <p className="text-muted-foreground">Test the game environment</p>
                </div>
              </div>
              <AuroraGame
                playerId={user?.id || 'admin-preview'}
                campaignId={selectedCampaign.id}
                displayName={user?.email?.split('@')[0] || 'Admin'}
                className="w-full"
              />
            </div>
          </>
        );

      case 'participants':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <ParticipantManager campaignId={selectedCampaign.id} />
          </>
        );

      case 'messages':
        const initialTitle = searchParams.get('title') || undefined;
        const initialContent = searchParams.get('content') || undefined;
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <CommunicationCenter
              campaignId={selectedCampaign.id}
              initialTitle={initialTitle}
              initialContent={initialContent}
            />
          </>
        );

      case 'incentives':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <IncentiveManager campaignId={selectedCampaign.id} />
          </>
        );

      case 'comparison':
        return (
          <>
            <BackButton onClick={() => setView('overview')} />
            <FundraiserComparison onClose={() => setView('overview')} />
          </>
        );

      case 'profile':
        return (
          <>
            <BackButton onClick={() => setView('overview')} />
            <div className="max-w-2xl">
              <ProfileEditor />
            </div>
          </>
        );

      case 'resources':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <ResourcesManager campaignId={selectedCampaign.id} />
          </>
        );

      case 'social-posts':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Social Media Posts</h2>
              <p className="text-muted-foreground">Generate AI-powered posts and create share templates for participants</p>
            </div>
            <SocialPostGenerator
              campaignId={selectedCampaign.id}
              organizationName={selectedCampaign.name}
              organizationType={selectedCampaign.organization_name}
              fundraiserType={selectedCampaign.fundraiser_type || 'product'}
              goalAmount={selectedCampaign.goal_amount ? Number(selectedCampaign.goal_amount) : undefined}
              description={selectedCampaign.description || undefined}
            />
          </>
        );

      case 'support':
        return (
          <>
            <BackButton onClick={() => setView('overview')} />
            <Support />
          </>
        );

      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <>
      {showTutorial && <OnboardingTutorial onComplete={handleTutorialComplete} />}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-secondary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-secondary/20 transition-all" />
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground">Active Participants</h3>
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-foreground mt-2">{campaignStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Participating fundraisers</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/20 transition-all" />
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground">Average Raised</h3>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-foreground mt-2">
              ${campaignStats.avgRaised.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Raised per participant</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-accent/20 transition-all" />
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground">Total Orders</h3>
            <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-foreground mt-2">{campaignStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">Completed orders</p>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary-blue/30 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary-blue/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary-blue/20 transition-all" />
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground">Days Left</h3>
            <div className="w-8 h-8 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-3xl font-bold text-foreground mt-2">{campaignStats.daysLeft}</div>
            <p className="text-xs text-muted-foreground mt-1">Until campaign ends</p>
          </div>
        </div>

        {/* NEW GAME CARD - HIDDEN FOR MVP
        <div
          onClick={() => setView('game')}
          className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all duration-300 cursor-pointer"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary/20 transition-all" />
          <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <h3 className="text-sm font-medium text-muted-foreground">Aurora Tundra</h3>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Gamepad2 className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-lg font-bold text-foreground mt-2">Play Game</div>
            <p className="text-xs text-muted-foreground mt-1">Preview & Test</p>
          </div>
        </div>
        */}

      </div>

      {/* Progress Bar */}
      {selectedCampaign?.goal_amount && (
        <div className="glass-card p-8 rounded-3xl mb-8 border border-white/10 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden group">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-blue/10 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity duration-500 group-hover:opacity-100 opacity-70" />

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
              <div className="space-y-1">
                <h3 className="text-muted-foreground font-medium text-xs uppercase tracking-wider flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-primary" />
                  Campaign Goal
                </h3>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-4xl md:text-5xl font-black text-foreground tracking-tight">
                    ${campaignStats.totalRaised.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-xl text-muted-foreground font-medium mb-1">
                    of ${Number(selectedCampaign.goal_amount).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-3xl font-bold text-primary">
                    {campaignStats.goalProgress.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <ProgressEnhanced
              value={campaignStats.goalProgress}
              showMilestones
              className="h-3 rounded-full bg-secondary/20"
              indicatorClassName="bg-gradient-to-r from-primary to-primary-blue shadow-lg shadow-primary/20"
            />

            <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground font-medium">
              <span>0%</span>
              <span>Goal Reached</span>
            </div>
          </div>
        </div>
      )}

      {/* Task List - directly below progress */}
      {selectedCampaign && (
        <DashboardTaskList
          campaignId={selectedCampaign.id}
          fundraiserTypeId={selectedCampaign.fundraiser_type || 'product'}
          startDate={selectedCampaign.start_date ? new Date(selectedCampaign.start_date) : undefined}
          endDate={selectedCampaign.end_date ? new Date(selectedCampaign.end_date) : undefined}
          onViewAll={() => setView('project-manager')}
        />
      )}
    </>
  );

  return (
    <AdminLayout
      campaignName={selectedCampaign?.name}
      campaigns={campaigns.map(c => ({ id: c.id, name: c.name }))}
      selectedCampaignId={selectedCampaign?.id}
      onCampaignChange={handleCampaignChange}
      onCreateCampaign={() => setView('create')}
    >
      {renderContent()}
    </AdminLayout>
  );
}
