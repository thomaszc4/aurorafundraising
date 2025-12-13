import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressEnhanced } from '@/components/ui/progress-enhanced';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, DollarSign, Package, Share2, Target, QrCode, MapPin, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeGenerator } from '@/components/student/QRCodeGenerator';
import { DoorToDoorMode } from '@/components/student/DoorToDoorMode';
import { ResourcesManager } from '@/components/admin/ResourcesManager';
import { cn } from '@/lib/utils';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [fundraiser, setFundraiser] = useState<any>(null);
  const [campaign, setCampaign] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      fetchFundraiserData();
    }
  }, [user]);

  const fetchFundraiserData = async () => {
    try {
      const { data: fundraiserData } = await supabase
        .from('student_fundraisers')
        .select('*, campaigns(*)')
        .eq('student_id', user?.id)
        .eq('is_active', true)
        .single();

      if (fundraiserData) {
        setFundraiser(fundraiserData);
        setCampaign(fundraiserData.campaigns);

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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-xl">
            <TabsTrigger value="overview" className="gap-2">
              <Target className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="share" className="gap-2">
              <QrCode className="h-4 w-4" />
              Share
            </TabsTrigger>
            <TabsTrigger value="door-to-door" className="gap-2">
              <MapPin className="h-4 w-4" />
              Door-to-Door
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary-blue/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary-blue/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary-blue/20 transition-all" />
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Raised</h3>
                  <div className="w-8 h-8 rounded-full bg-primary-blue/10 flex items-center justify-center text-primary-blue">
                    <DollarSign className="h-4 w-4" />
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-blue mt-2">
                    ${Number(fundraiser.total_raised).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Goal: ${Number(fundraiser.personal_goal).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-secondary/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-secondary/20 transition-all" />
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Orders</h3>
                  <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                    <Package className="h-4 w-4" />
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="text-3xl font-bold text-foreground mt-2">{orders.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {orders.filter(o => o.status === 'completed').length} completed
                  </p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-accent/20 transition-all" />
                <div className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                  <h3 className="text-sm font-medium text-muted-foreground">Progress</h3>
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent-foreground">
                    <Target className="h-4 w-4" />
                  </div>
                </div>
                <div className="relative z-10">
                  <div className="text-3xl font-bold text-foreground mt-2">{progress.toFixed(0)}%</div>
                  <ProgressEnhanced value={progress} className="mt-2 h-2" showMilestones />
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl mb-8 border border-white/5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Your Fundraising Page</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={shareUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-background/50 border border-white/10 rounded-lg text-sm"
                  />
                  <Button onClick={copyShareLink} size="icon" variant="secondary">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="default" asChild className="flex-1 shadow-glow hover:shadow-glow-lg transition-all">
                    <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                      <Share2 className="h-4 w-4 mr-2" />
                      View Page
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-white/5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold">Recent Orders</h3>
              </div>
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No orders yet. Share your link to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.slice(0, 10).map((order) => (
                      <div key={order.id} className="flex items-center justify-between border-b border-white/5 pb-4 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-foreground">{order.customer_name || order.customer_email}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">${Number(order.total_amount).toFixed(2)}</p>
                          <div className={cn(
                            "text-xs px-2 py-0.5 rounded-full inline-block mt-1",
                            order.status === 'completed' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            <span className="capitalize">{order.status}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="share">
            <QRCodeGenerator
              url={shareUrl}
              studentName={user?.email?.split('@')[0] || 'Student'}
              campaignName={campaign?.name || 'Fundraiser'}
            />
          </TabsContent>

          <TabsContent value="door-to-door">
            <DoorToDoorMode
              shareUrl={shareUrl}
              studentName={user?.email?.split('@')[0] || 'Student'}
              productName={campaign?.name || 'Fundraiser'}
            />
          </TabsContent>

          <TabsContent value="resources">
            {campaign && (
              <ResourcesManager
                campaignId={campaign.id}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
