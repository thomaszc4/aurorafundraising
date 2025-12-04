import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, ShoppingCart, TrendingUp, Calendar, Target, ClipboardList, Scale, Heart, User, BarChart3, Zap, FileText, Trophy, ClipboardList as Survey, FlaskConical, Mail } from 'lucide-react';
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
import { DonorLeaderboard } from '@/components/fundraising/DonorLeaderboard';
import { Tables } from '@/integrations/supabase/types';

type Campaign = Tables<'campaigns'>;

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignStats, setCampaignStats] = useState({
    totalStudents: 0,
    totalOrders: 0,
    totalRaised: 0,
    goalProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [showProjectManager, setShowProjectManager] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [showDonorManagement, setShowDonorManagement] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showRetentionAnalytics, setShowRetentionAnalytics] = useState(false);
  const [showDonorJourney, setShowDonorJourney] = useState(false);
  const [showImpactUpdates, setShowImpactUpdates] = useState(false);
  const [showDonorSurvey, setShowDonorSurvey] = useState(false);
  const [showABTesting, setShowABTesting] = useState(false);
  const [showDonorLeaderboard, setShowDonorLeaderboard] = useState(false);
  const [showEmailAnalytics, setShowEmailAnalytics] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignStats(selectedCampaign.id);
    }
  }, [selectedCampaign]);

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
      // Fetch students for this campaign
      const { count: studentsCount } = await supabase
        .from('student_fundraisers')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', campaignId)
        .eq('is_active', true);

      // Fetch orders for this campaign
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
    setShowCreateWizard(false);
    fetchCampaigns();
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show wizard as main content when creating new fundraiser
  if (showCreateWizard) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <CreateCampaignWizard
            onComplete={handleCampaignCreated}
            onCancel={() => setShowCreateWizard(false)}
          />
        </div>
      </Layout>
    );
  }

  // Show Project Manager
  if (showProjectManager && selectedCampaign) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <FundraiserProjectManager
            campaignId={selectedCampaign.id}
            fundraiserTypeId={selectedCampaign.fundraiser_type || 'product'}
            startDate={selectedCampaign.start_date ? new Date(selectedCampaign.start_date) : undefined}
            onClose={() => setShowProjectManager(false)}
          />
        </div>
      </Layout>
    );
  }

  // Show Comparison Tool
  if (showComparison) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <FundraiserComparison onClose={() => setShowComparison(false)} />
        </div>
      </Layout>
    );
  }

  // Show Donor Management
  if (showDonorManagement && selectedCampaign) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <DonorManagement campaignId={selectedCampaign.id} onClose={() => setShowDonorManagement(false)} />
        </div>
      </Layout>
    );
  }

  // Show Profile Editor
  if (showProfileEditor) {
    return (
      <Layout>
        <div className="container-wide py-12 max-w-2xl mx-auto">
          <Button variant="ghost" onClick={() => setShowProfileEditor(false)} className="mb-4">← Back to Dashboard</Button>
          <ProfileEditor />
        </div>
      </Layout>
    );
  }

  // Show Retention Analytics
  if (showRetentionAnalytics && selectedCampaign) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <RetentionAnalytics campaignId={selectedCampaign.id} onClose={() => setShowRetentionAnalytics(false)} />
        </div>
      </Layout>
    );
  }

  // Show Donor Journey Manager
  if (showDonorJourney && selectedCampaign) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <DonorJourneyManager campaignId={selectedCampaign.id} onClose={() => setShowDonorJourney(false)} />
        </div>
      </Layout>
    );
  }

  // Show Impact Updates Manager
  if (showImpactUpdates && selectedCampaign) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <ImpactUpdatesManager campaignId={selectedCampaign.id} onClose={() => setShowImpactUpdates(false)} />
        </div>
      </Layout>
    );
  }

  // Show Donor Survey Manager
  if (showDonorSurvey && selectedCampaign) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <Button variant="ghost" onClick={() => setShowDonorSurvey(false)} className="mb-4">← Back to Dashboard</Button>
          <DonorSurveyManager campaignId={selectedCampaign.id} onClose={() => setShowDonorSurvey(false)} />
        </div>
      </Layout>
    );
  }

  // Show Email A/B Testing
  if (showABTesting && selectedCampaign) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <Button variant="ghost" onClick={() => setShowABTesting(false)} className="mb-4">← Back to Dashboard</Button>
          <EmailABTesting campaignId={selectedCampaign.id} onClose={() => setShowABTesting(false)} />
        </div>
      </Layout>
    );
  }

  // Show Donor Leaderboard
  if (showDonorLeaderboard && selectedCampaign) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <Button variant="ghost" onClick={() => setShowDonorLeaderboard(false)} className="mb-4">← Back to Dashboard</Button>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">Donor Recognition Wall</h2>
            <p className="text-muted-foreground">Celebrating our generous supporters</p>
          </div>
          <DonorLeaderboard campaignId={selectedCampaign.id} limit={20} variant="wall" />
        </div>
      </Layout>
    );
  }

  // Show Email Analytics Dashboard
  if (showEmailAnalytics && selectedCampaign) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <Button variant="ghost" onClick={() => setShowEmailAnalytics(false)} className="mb-4">← Back to Dashboard</Button>
          <EmailAnalyticsDashboard campaignId={selectedCampaign.id} />
        </div>
      </Layout>
    );
  }

  // No fundraisers - show create CTA
  if (campaigns.length === 0) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="mb-8">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-12 h-12 text-primary" />
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Your Dashboard</h1>
              <p className="text-muted-foreground text-lg max-w-md mx-auto">
                Get started by creating your first fundraiser campaign. Set up your organization, add products, and invite students to participate.
              </p>
            </div>
            <Button size="lg" onClick={() => setShowCreateWizard(true)} className="gap-2">
              <Plus className="w-5 h-5" />
              Create a Fundraiser
            </Button>
          </div>
        </div>
      </Layout>
    );
  }


  return (
    <Layout>
      <div className="container-wide py-12">
        {/* Header with campaign selector and new fundraiser button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              {selectedCampaign?.name || 'Fundraiser Dashboard'}
            </h1>
            <p className="text-muted-foreground">{selectedCampaign?.organization_name}</p>
          </div>
          <Button onClick={() => setShowCreateWizard(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            New Fundraiser
          </Button>
        </div>

        {/* Campaign Tabs */}
        {campaigns.length > 1 && (
          <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
            {campaigns.map((campaign) => (
              <Button
                key={campaign.id}
                variant={selectedCampaign?.id === campaign.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCampaign(campaign)}
              >
                {campaign.name}
              </Button>
            ))}
          </div>
        )}

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

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaign Status</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{selectedCampaign?.status || 'Draft'}</div>
              {selectedCampaign?.end_date && (
                <p className="text-xs text-muted-foreground">
                  Ends {new Date(selectedCampaign.end_date).toLocaleDateString()}
                </p>
              )}
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
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${campaignStats.goalProgress}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-primary/50 bg-primary/5" onClick={() => setShowProjectManager(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ClipboardList className="h-5 w-5" />
                Project Manager
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Step-by-step guide to run your fundraiser</p>
              <Button className="w-full">Open Manager</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-rose-500/50 bg-rose-500/5" onClick={() => setShowDonorManagement(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-rose-600">
                <Heart className="h-5 w-5" />
                Donor CRM
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Track donors, send thanks, build relationships</p>
              <Button variant="outline" className="w-full border-rose-500/50 text-rose-600 hover:bg-rose-500/10">Manage Donors</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-green-500/50 bg-green-500/5" onClick={() => setShowRetentionAnalytics(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <BarChart3 className="h-5 w-5" />
                Retention Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Quarterly metrics and retention tracking</p>
              <Button variant="outline" className="w-full border-green-500/50 text-green-600 hover:bg-green-500/10">View Analytics</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-purple-500/50 bg-purple-500/5" onClick={() => setShowDonorJourney(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Zap className="h-5 w-5" />
                Donor Journeys
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Automated email workflows for donors</p>
              <Button variant="outline" className="w-full border-purple-500/50 text-purple-600 hover:bg-purple-500/10">Manage Journeys</Button>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-orange-500/50 bg-orange-500/5" onClick={() => setShowImpactUpdates(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-600">
                <FileText className="h-5 w-5" />
                Impact Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Share stories, stats, and photos with donors</p>
              <Button variant="outline" className="w-full border-orange-500/50 text-orange-600 hover:bg-orange-500/10">Create Update</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-amber-500/50 bg-amber-500/5" onClick={() => setShowComparison(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <Scale className="h-5 w-5" />
                Compare Types
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Compare fundraiser types side-by-side</p>
              <Button variant="outline" className="w-full border-amber-500/50 text-amber-600 hover:bg-amber-500/10">Compare</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-cyan-500/50 bg-cyan-500/5" onClick={() => setShowProfileEditor(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-600">
                <User className="h-5 w-5" />
                My Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Update your personal information</p>
              <Button variant="outline" className="w-full border-cyan-500/50 text-cyan-600 hover:bg-cyan-500/10">Edit Profile</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" onClick={() => navigate('/admin/students')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">View and manage student fundraisers</p>
              <Button variant="outline" className="w-full">Manage</Button>
            </CardContent>
          </Card>
        </div>

        {/* Engagement & Testing Row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-pink-500/50 bg-pink-500/5" onClick={() => setShowDonorLeaderboard(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-pink-600">
                <Trophy className="h-5 w-5" />
                Recognition Wall
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Public leaderboard celebrating top donors</p>
              <Button variant="outline" className="w-full border-pink-500/50 text-pink-600 hover:bg-pink-500/10">View Wall</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-blue-500/50 bg-blue-500/5" onClick={() => setShowDonorSurvey(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Survey className="h-5 w-5" />
                Donor Surveys
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Collect feedback and communication preferences</p>
              <Button variant="outline" className="w-full border-blue-500/50 text-blue-600 hover:bg-blue-500/10">Manage Surveys</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-violet-500/50 bg-violet-500/5" onClick={() => setShowABTesting(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-violet-600">
                <FlaskConical className="h-5 w-5" />
                Email A/B Testing
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Optimize email open rates and engagement</p>
              <Button variant="outline" className="w-full border-violet-500/50 text-violet-600 hover:bg-violet-500/10">Run Tests</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col border-cyan-500/50 bg-cyan-500/5" onClick={() => setShowEmailAnalytics(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-cyan-600">
                <Mail className="h-5 w-5" />
                Email Analytics
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Track open rates, clicks, and engagement</p>
              <Button variant="outline" className="w-full border-cyan-500/50 text-cyan-600 hover:bg-cyan-500/10">View Analytics</Button>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Actions */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" onClick={() => navigate('/admin/orders')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Track and manage all orders</p>
              <Button variant="outline" className="w-full">View Orders</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" onClick={() => navigate('/admin/campaigns')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Campaign Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Edit campaign details and goals</p>
              <Button variant="outline" className="w-full">Edit Campaign</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
