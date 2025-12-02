import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Copy, DollarSign, Package, Share2, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [fundraiser, setFundraiser] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFundraiserData();
    }
  }, [user]);

  const fetchFundraiserData = async () => {
    try {
      // Fetch student fundraiser
      const { data: fundraiserData } = await supabase
        .from('student_fundraisers')
        .select('*, campaigns(*)')
        .eq('student_id', user?.id)
        .eq('is_active', true)
        .single();

      if (fundraiserData) {
        setFundraiser(fundraiserData);
        setCampaign(fundraiserData.campaigns);

        // Fetch orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*, order_items(*, products(*))')
          .eq('student_fundraiser_id', fundraiserData.id)
          .order('created_at', { ascending: false });

        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error fetching fundraiser data:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/student/${fundraiser.page_slug}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard!');
  };

  const shareUrl = fundraiser ? `${window.location.origin}/student/${fundraiser.page_slug}` : '';
  const progress = fundraiser?.personal_goal 
    ? (Number(fundraiser.total_raised) / Number(fundraiser.personal_goal)) * 100 
    : 0;

  if (loading) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid gap-6 md:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!fundraiser) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <Card>
            <CardHeader>
              <CardTitle>No Active Fundraiser</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You don't have an active fundraiser yet. Please contact your organization administrator to get started.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-wide py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">My Fundraiser</h1>
          <p className="text-muted-foreground">{campaign?.name}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${Number(fundraiser.total_raised).toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Goal: ${Number(fundraiser.personal_goal).toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
              <p className="text-xs text-muted-foreground">
                {orders.filter(o => o.status === 'completed').length} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
              <Progress value={progress} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Fundraising Page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-muted rounded-lg"
              />
              <Button onClick={copyShareLink} size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                  <Share2 className="h-4 w-4 mr-2" />
                  View Page
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <p className="text-muted-foreground">No orders yet. Share your link to get started!</p>
            ) : (
              <div className="space-y-4">
                {orders.slice(0, 10).map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4">
                    <div>
                      <p className="font-medium">{order.customer_name || order.customer_email}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${Number(order.total_amount).toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground capitalize">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
