import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Users, DollarSign, ShoppingCart, Target, ArrowLeft } from 'lucide-react';
import { CreateCampaignWizard } from '@/components/admin/CreateCampaignWizard';
import { FundraiserProjectManager } from '@/components/admin/FundraiserProjectManager';
import { FundraiserComparison } from '@/components/admin/FundraiserComparison';
import { DonorManagement } from '@/components/admin/DonorManagement';
import { ProfileEditor } from '@/components/admin/ProfileEditor';
import { RetentionAnalytics } from '@/components/admin/RetentionAnalytics';
import { DonorJourneyManager } from '@/components/admin/DonorJourneyManager';
import { ImpactUpdatesManager } from '@/components/admin/ImpactUpdatesManager';
import { DonorSurveyManager } from '@/components/admin/DonorSurveyManager';
import { EmailABTesting } from '@/components/admin/EmailABTesting';
import { EmailAnalyticsDashboard } from '@/components/admin/EmailAnalyticsDashboard';
import { EmailScheduler } from '@/components/admin/EmailScheduler';
import { EmailTemplateBuilder } from '@/components/admin/EmailTemplateBuilder';
import { DonorDatabase } from '@/components/admin/DonorDatabase';
import { BulkEmailSender } from '@/components/admin/BulkEmailSender';
import { DonorLeaderboard } from '@/components/fundraising/DonorLeaderboard';
import { ResourcesManager } from '@/components/admin/ResourcesManager';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { ProgressEnhanced } from '@/components/ui/progress-enhanced';
import { OnboardingTutorial } from '@/components/admin/OnboardingTutorial';
import { Tables } from '@/integrations/supabase/types';

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
  });
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  // View state from URL params
  const currentView = searchParams.get('view') || 'overview';

  useEffect(() => {
    fetchCampaigns();
    checkFirstVisit();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignStats(selectedCampaign.id);
    }
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCampaigns(data || []);
      if (data && data.length > 0) {
        setSelectedCampaign(data[0]);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaignStats = async (campaignId: string) => {
    try {
      const { count: studentsCount } = await supabase
        .from('student_fundraisers')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('is_active', true);

      const { data: fundraisers } = await supabase
        .from('student_fundraisers')
        .select('id, total_raised')
        .eq('campaign_id', campaignId);

      const fundraiserIds = fundraisers?.map(f => f.id) || [];
      
      let ordersCount = 0;
      let totalRaised = 0;

      if (fundraiserIds.length > 0) {
        const { count } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .in('student_fundraiser_id', fundraiserIds)
          .eq('status', 'completed');
        
        ordersCount = count || 0;
        totalRaised = fundraisers?.reduce((sum, f) => sum + Number(f.total_raised || 0), 0) || 0;
      }

      const goalAmount = selectedCampaign?.goal_amount || 0;
      const goalProgress = goalAmount > 0 ? (totalRaised / Number(goalAmount)) * 100 : 0;

      setCampaignStats({
        totalStudents: studentsCount || 0,
        totalOrders: ordersCount,
        totalRaised,
        goalProgress: Math.min(goalProgress, 100),
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
            />
          </>
        );

      case 'donors':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <DonorManagement campaignId={selectedCampaign.id} onClose={() => setView('overview')} />
          </>
        );

      case 'retention':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <RetentionAnalytics campaignId={selectedCampaign.id} onClose={() => setView('overview')} />
          </>
        );

      case 'journeys':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <DonorJourneyManager campaignId={selectedCampaign.id} onClose={() => setView('overview')} />
          </>
        );

      case 'impact':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <ImpactUpdatesManager campaignId={selectedCampaign.id} onClose={() => setView('overview')} />
          </>
        );

      case 'surveys':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <DonorSurveyManager campaignId={selectedCampaign.id} onClose={() => setView('overview')} />
          </>
        );

      case 'ab-testing':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <EmailABTesting campaignId={selectedCampaign.id} onClose={() => setView('overview')} />
          </>
        );

      case 'email-analytics':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <EmailAnalyticsDashboard campaignId={selectedCampaign.id} />
          </>
        );

      case 'email-scheduler':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <EmailScheduler campaignId={selectedCampaign.id} onClose={() => setView('overview')} />
          </>
        );

      case 'templates':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <EmailTemplateBuilder campaignId={selectedCampaign.id} onClose={() => setView('overview')} />
          </>
        );

      case 'database':
        return (
          <>
            <BackButton onClick={() => setView('overview')} />
            <DonorDatabase onClose={() => setView('overview')} />
          </>
        );

      case 'leaderboard':
        return selectedCampaign && (
          <>
            <BackButton onClick={() => setView('overview')} />
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">Donor Recognition Wall</h2>
              <p className="text-muted-foreground">Celebrating our generous supporters</p>
            </div>
            <DonorLeaderboard campaignId={selectedCampaign.id} limit={20} variant="wall" />
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

      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <>
      {showTutorial && <OnboardingTutorial onComplete={handleTutorialComplete} />}
      
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${campaignStats.totalRaised.toFixed(2)}</div>
            {selectedCampaign?.goal_amount && (
              <p className="text-xs text-muted-foreground">
                {campaignStats.goalProgress.toFixed(0)}% of ${Number(selectedCampaign.goal_amount).toLocaleString()} goal
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Participating fundraisers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">Completed orders</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setView('project-manager')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Steps</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-primary">View Tasks →</div>
            <p className="text-xs text-muted-foreground">Open project manager</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      {selectedCampaign?.goal_amount && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fundraising Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>${campaignStats.totalRaised.toFixed(2)} raised</span>
                <span>${Number(selectedCampaign.goal_amount).toLocaleString()} goal</span>
              </div>
              <ProgressEnhanced 
                value={campaignStats.goalProgress} 
                showMilestones 
                className="h-4"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions Grid - Simplified */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer border-primary/30" 
          onClick={() => setView('project-manager')}
        >
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-1">📋 Project Manager</h3>
            <p className="text-sm text-muted-foreground">Step-by-step guide for your fundraiser</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => setView('donors')}
        >
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-1">❤️ Donor CRM</h3>
            <p className="text-sm text-muted-foreground">Track and thank your supporters</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => navigate('/admin/students')}
        >
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-1">👥 Students</h3>
            <p className="text-sm text-muted-foreground">Manage student fundraisers</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => navigate('/admin/orders')}
        >
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-1">🛒 Orders</h3>
            <p className="text-sm text-muted-foreground">Track all purchases</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => setView('resources')}
        >
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-1">📁 Resources</h3>
            <p className="text-sm text-muted-foreground">Files, guides, and materials</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-md transition-shadow cursor-pointer" 
          onClick={() => setView('retention')}
        >
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-1">📊 Analytics</h3>
            <p className="text-sm text-muted-foreground">Retention and performance metrics</p>
          </CardContent>
        </Card>
      </div>
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
