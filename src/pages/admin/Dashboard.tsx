import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, DollarSign, ShoppingCart, TrendingUp, Calendar, Target } from 'lucide-react';
import { CreateCampaignWizard } from '@/components/admin/CreateCampaignWizard';
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" onClick={() => navigate('/admin/students')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">View and manage student fundraisers for this campaign</p>
              <Button variant="outline" className="w-full">Manage Students</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer flex flex-col" onClick={() => navigate('/admin/orders')}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Orders
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <p className="text-muted-foreground mb-4 flex-1">Track and manage all orders for this fundraiser</p>
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
              <p className="text-muted-foreground mb-4 flex-1">Edit campaign details, dates, and goals</p>
              <Button variant="outline" className="w-full">Edit Campaign</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
