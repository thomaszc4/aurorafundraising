import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Users, 
  Package, 
  TrendingUp,
  Calendar,
  ShoppingCart
} from 'lucide-react';
import { toast } from 'sonner';

interface CampaignStats {
  id: string;
  name: string;
  organization_name: string;
  fundraiser_type: string;
  goal_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  total_raised: number;
  student_count: number;
  order_count: number;
}

interface ProductStats {
  id: string;
  name: string;
  price: number;
  cost: number | null;
  total_ordered: number;
  total_revenue: number;
  total_profit: number;
}

interface OverviewStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalStudents: number;
  totalRaised: number;
  totalOrders: number;
  totalProducts: number;
}

export default function SuperAdminDashboard() {
  const [overview, setOverview] = useState<OverviewStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalStudents: 0,
    totalRaised: 0,
    totalOrders: 0,
    totalProducts: 0,
  });
  const [campaigns, setCampaigns] = useState<CampaignStats[]>([]);
  const [products, setProducts] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch campaigns with aggregated stats
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          id,
          name,
          organization_name,
          fundraiser_type,
          goal_amount,
          start_date,
          end_date
        `)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Fetch student fundraisers for each campaign
      const { data: studentsData } = await supabase
        .from('student_fundraisers')
        .select('id, campaign_id, total_raised');

      // Fetch orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('id, student_fundraiser_id, total_amount, profit_amount, status');

      // Fetch products with order stats
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, cost');

      if (productsError) throw productsError;

      // Fetch order items
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity, subtotal');

      // Calculate campaign stats
      const campaignStats: CampaignStats[] = (campaignsData || []).map(campaign => {
        const campaignStudents = studentsData?.filter(s => s.campaign_id === campaign.id) || [];
        const studentIds = campaignStudents.map(s => s.id);
        const campaignOrders = ordersData?.filter(o => 
          o.student_fundraiser_id && studentIds.includes(o.student_fundraiser_id) && o.status === 'completed'
        ) || [];
        
        return {
          ...campaign,
          total_raised: campaignStudents.reduce((sum, s) => sum + Number(s.total_raised || 0), 0),
          student_count: campaignStudents.length,
          order_count: campaignOrders.length,
        };
      });

      // Calculate product stats
      const productStats: ProductStats[] = (productsData || []).map(product => {
        const productOrderItems = orderItems?.filter(oi => oi.product_id === product.id) || [];
        const totalOrdered = productOrderItems.reduce((sum, oi) => sum + oi.quantity, 0);
        const totalRevenue = productOrderItems.reduce((sum, oi) => sum + Number(oi.subtotal), 0);
        const totalProfit = totalRevenue - (totalOrdered * Number(product.cost || 0));
        
        return {
          ...product,
          total_ordered: totalOrdered,
          total_revenue: totalRevenue,
          total_profit: totalProfit,
        };
      });

      // Calculate overview
      const completedOrders = ordersData?.filter(o => o.status === 'completed') || [];
      const now = new Date();
      const activeCampaigns = campaignsData?.filter(c => {
        if (!c.start_date || !c.end_date) return false;
        const start = new Date(c.start_date);
        const end = new Date(c.end_date);
        return start <= now && end >= now;
      }).length || 0;

      setOverview({
        totalCampaigns: campaignsData?.length || 0,
        activeCampaigns,
        totalStudents: studentsData?.length || 0,
        totalRaised: completedOrders.reduce((sum, o) => sum + Number(o.profit_amount || 0), 0),
        totalOrders: completedOrders.length,
        totalProducts: productsData?.length || 0,
      });

      setCampaigns(campaignStats);
      setProducts(productStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getFundraiserTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      product: 'bg-primary/20 text-primary',
      walkathon: 'bg-accent-teal/20 text-accent-teal',
      readathon: 'bg-amber-500/20 text-amber-600',
      jogathon: 'bg-green-500/20 text-green-600',
      other_athon: 'bg-purple-500/20 text-purple-600',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const getCampaignStatus = (campaign: CampaignStats) => {
    if (!campaign.start_date || !campaign.end_date) return 'draft';
    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);
    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'active';
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-wide py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Super Admin Dashboard</h1>
          <p className="text-muted-foreground">Complete overview of all fundraising activities</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{overview.totalCampaigns}</p>
                  <p className="text-xs text-muted-foreground">Total Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-accent-teal" />
                <div>
                  <p className="text-2xl font-bold">{overview.activeCampaigns}</p>
                  <p className="text-xs text-muted-foreground">Active Now</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{overview.totalStudents}</p>
                  <p className="text-xs text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">${overview.totalRaised.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Raised</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{overview.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{overview.totalProducts}</p>
                  <p className="text-xs text-muted-foreground">Products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="campaigns" className="space-y-4">
          <TabsList>
            <TabsTrigger value="campaigns">All Campaigns</TabsTrigger>
            <TabsTrigger value="products">Product Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns">
            <Card>
              <CardHeader>
                <CardTitle>All Fundraisers</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Raised</TableHead>
                      <TableHead>Goal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.organization_name}</TableCell>
                        <TableCell>
                          <Badge className={getFundraiserTypeBadge(campaign.fundraiser_type)}>
                            {campaign.fundraiser_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getCampaignStatus(campaign) === 'active' ? 'default' : 'secondary'}>
                            {getCampaignStatus(campaign)}
                          </Badge>
                        </TableCell>
                        <TableCell>{campaign.student_count}</TableCell>
                        <TableCell>{campaign.order_count}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          ${campaign.total_raised.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {campaign.goal_amount ? `$${Number(campaign.goal_amount).toLocaleString()}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardHeader>
                <CardTitle>Product Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Total Ordered</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Profit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>${Number(product.price).toFixed(2)}</TableCell>
                        <TableCell>${Number(product.cost || 0).toFixed(2)}</TableCell>
                        <TableCell>{product.total_ordered}</TableCell>
                        <TableCell>${product.total_revenue.toFixed(2)}</TableCell>
                        <TableCell className="font-medium text-green-600">
                          ${product.total_profit.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
