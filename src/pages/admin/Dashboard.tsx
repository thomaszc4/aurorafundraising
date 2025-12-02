import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { DollarSign, Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeStudents: 0,
    totalOrders: 0,
    totalRevenue: 0,
    completedOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch campaigns count
      const { count: campaignsCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true });

      // Fetch active students
      const { count: studentsCount } = await supabase
        .from('student_fundraisers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Fetch orders
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, profit_amount, status');

      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
      const totalRevenue = orders
        ?.filter(o => o.status === 'completed')
        .reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      setStats({
        totalCampaigns: campaignsCount || 0,
        activeStudents: studentsCount || 0,
        totalOrders,
        totalRevenue,
        completedOrders,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
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

  return (
    <Layout>
      <div className="container-wide py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your fundraising platform</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Campaigns</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCampaigns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completedOrders} completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Create and manage fundraising campaigns</p>
              <Button asChild>
                <Link to="/admin/campaigns">Manage Campaigns</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Add and manage products for sale</p>
              <Button asChild>
                <Link to="/admin/products">Manage Products</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Students</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">View and manage student fundraisers</p>
              <Button asChild>
                <Link to="/admin/students">View Students</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">Track and manage all orders</p>
              <Button asChild>
                <Link to="/admin/orders">View Orders</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
