import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  Loader2, Package, Truck, CheckCircle, LogOut,
  Building, MapPin, Calendar, Printer, Search
} from 'lucide-react';

const VENDOR_STORAGE_KEY = 'vendor_session';

interface VendorSession {
  id: string;
  email: string;
  company_name: string | null;
}

interface CampaignOrder {
  campaign_id: string;
  campaign_name: string;
  organization_name: string;
  total_orders: number;
  total_items: number;
  total_revenue: number;
  status: string;
  product_summary: { name: string; quantity: number }[];
}

export default function VendorDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorSession | null>(null);
  const [campaignOrders, setCampaignOrders] = useState<CampaignOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const session = localStorage.getItem(VENDOR_STORAGE_KEY);
    if (!session) {
      navigate('/vendor');
      return;
    }

    try {
      const vendorData = JSON.parse(session) as VendorSession;
      setVendor(vendorData);
      fetchOrders();
    } catch {
      navigate('/vendor');
    }
  }, [navigate]);

  const fetchOrders = async () => {
    try {
      // Fetch all campaigns with completed orders
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          student_fundraiser_id,
          order_items (
            quantity,
            product_id,
            products (name)
          ),
          student_fundraisers (
            campaign_id,
            campaigns (
              id,
              name,
              organization_name
            )
          )
        `)
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching orders:', error);
        setLoading(false);
        return;
      }

      // Group orders by campaign
      const campaignMap = new Map<string, CampaignOrder>();

      orders?.forEach(order => {
        const campaign = (order.student_fundraisers as any)?.campaigns;
        if (!campaign) return;

        const campaignId = campaign.id;

        if (!campaignMap.has(campaignId)) {
          campaignMap.set(campaignId, {
            campaign_id: campaignId,
            campaign_name: campaign.name,
            organization_name: campaign.organization_name,
            total_orders: 0,
            total_items: 0,
            total_revenue: 0,
            status: 'pending',
            product_summary: []
          });
        }

        const entry = campaignMap.get(campaignId)!;
        entry.total_orders += 1;
        entry.total_revenue += order.total_amount || 0;

        // Aggregate products
        (order.order_items as any[])?.forEach(item => {
          entry.total_items += item.quantity || 0;
          const productName = (item.products as any)?.name || 'Unknown';
          const existing = entry.product_summary.find(p => p.name === productName);
          if (existing) {
            existing.quantity += item.quantity || 0;
          } else {
            entry.product_summary.push({ name: productName, quantity: item.quantity || 0 });
          }
        });
      });

      setCampaignOrders(Array.from(campaignMap.values()));
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(VENDOR_STORAGE_KEY);
    navigate('/vendor');
  };

  const markAsShipped = async (campaignId: string) => {
    toast.success('Marked as shipped!');
    // In production, update shipment status in database
    setCampaignOrders(prev =>
      prev.map(c => c.campaign_id === campaignId ? { ...c, status: 'shipped' } : c)
    );
  };

  const filteredOrders = campaignOrders.filter(order =>
    order.campaign_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'shipped':
        return <Badge className="bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20">Shipped</Badge>;
      case 'preparing':
        return <Badge className="bg-accent/10 text-accent hover:bg-accent/20 border-accent/20">Preparing</Badge>;
      default:
        return <Badge variant="secondary" className="bg-white/5 hover:bg-white/10">Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary-blue/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-accent/10 rounded-full blur-[100px] animate-pulse delay-1000" />
        <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-secondary/10 rounded-full blur-[80px] animate-float" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-blue/10 flex items-center justify-center border border-primary-blue/20 shadow-glow cursor-pointer hover:bg-primary-blue/20 transition-all">
                <Package className="h-5 w-5 text-primary-blue" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-foreground">Vendor Portal</h1>
                <p className="text-sm text-muted-foreground">{vendor?.company_name || vendor?.email}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="hover:bg-destructive/10 hover:text-destructive transition-all">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-primary-blue/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary-blue/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-primary-blue/20 transition-all" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-primary-blue/10 flex items-center justify-center border border-primary-blue/20 text-primary-blue">
                <Building className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">{campaignOrders.length}</p>
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-secondary/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-secondary/20 transition-all" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center border border-secondary/20 text-secondary">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {campaignOrders.reduce((sum, c) => sum + c.total_items, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Items to Ship</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-accent/30 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-accent/20 transition-all" />
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 text-accent">
                <Truck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-3xl font-bold text-foreground">
                  {campaignOrders.filter(c => c.status === 'pending').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Shipments</p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        {/* Orders Table */}
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Campaign Orders</h2>
                <p className="text-sm text-muted-foreground">View and manage orders by campaign</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-background/50 border-white/10"
                />
              </div>
            </div>
          </div>
          <div className="p-0">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No orders found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-white/5 border-white/5">
                      <TableHead>Campaign</TableHead>
                      <TableHead>Organization</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Items</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.campaign_id} className="hover:bg-white/5 border-white/5">
                        <TableCell className="font-medium">{order.campaign_name}</TableCell>
                        <TableCell>{order.organization_name}</TableCell>
                        <TableCell className="text-right">{order.total_orders}</TableCell>
                        <TableCell className="text-right">{order.total_items}</TableCell>
                        <TableCell>{getStatusBadge(order.status)}</TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            {order.product_summary.slice(0, 3).map((p, i) => (
                              <span key={i} className="text-xs block text-muted-foreground">
                                {p.name} <span className="text-foreground font-medium">(×{p.quantity})</span>
                              </span>
                            ))}
                            {order.product_summary.length > 3 && (
                              <span className="text-xs text-muted-foreground block mt-1">
                                +{order.product_summary.length - 3} more
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-white/10">
                              <Printer className="h-4 w-4" />
                            </Button>
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => markAsShipped(order.campaign_id)}
                                className="bg-primary-blue hover:bg-primary-blue/90 text-white shadow-glow"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Ship
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
