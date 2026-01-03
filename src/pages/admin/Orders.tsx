import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Eye, Package, List, Users, Target, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { OrdersByStudent } from '@/components/admin/OrdersByStudent';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface Campaign {
  id: string;
  name: string;
}

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products: {
    name: string;
  } | null;
}

interface Order {
  id: string;
  customer_name: string | null;
  customer_email: string;
  customer_phone: string | null;
  total_amount: number;
  profit_amount: number | null;
  status: OrderStatus;
  delivery_status: string | null;
  delivery_method: string | null;
  shipping_address: string | null;
  created_at: string;
  student_fundraiser_id: string | null;
  order_items: OrderItem[];
  student_fundraisers?: {
    profiles: {
      full_name: string | null;
    } | null;
  } | null;
}

export default function AdminOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasCampaigns, setHasCampaigns] = useState<boolean | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');


  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  useEffect(() => {
    checkCampaigns();
  }, [user]);

  const checkCampaigns = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('organization_admin_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        setHasCampaigns(false);
        setLoading(false);
      } else {
        setHasCampaigns(true);
        setCampaigns(data);
        // Select the first campaign by default if none selected
        if (!selectedCampaignId) {
          setSelectedCampaignId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error checking campaigns:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCampaignId) {
      fetchOrders();
    }
  }, [selectedCampaignId]);

  const fetchOrders = async () => {
    if (!selectedCampaignId) return;
    setLoading(true);

    try {
      // First, get all student fundraisers for this campaign
      const { data: fundraisers, error: fundraisersError } = await supabase
        .from('student_fundraisers')
        .select('id, student_id')
        .eq('campaign_id', selectedCampaignId);

      if (fundraisersError) throw fundraisersError;

      // Get the student IDs
      const studentIds = fundraisers?.map(f => f.student_id).filter(Boolean) || [];

      // Fetch profiles for these students
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);

      if (profilesError) console.error('Error fetching profiles:', profilesError);

      // Create a map of student_id -> full_name
      const profileMap = new Map(
        profiles?.map(p => [p.id, p.full_name]) || []
      );

      // Create a map of fundraiser_id -> student name
      const fundraiserMap = new Map(
        fundraisers?.map(f => [
          f.id,
          profileMap.get(f.student_id) || 'Unknown Student'
        ]) || []
      );

      const fundraiserIds = fundraisers?.map(f => f.id) || [];

      if (fundraiserIds.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      // Then fetch orders for these fundraisers
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(name))
        `)
        .in('student_fundraiser_id', fundraiserIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Merge the student names into the orders
      const ordersWithNames = (data || []).map(order => ({
        ...order,
        student_fundraisers: {
          profiles: {
            full_name: fundraiserMap.get(order.student_fundraiser_id!) || 'Unknown Student'
          }
        }
      }));

      setOrders(ordersWithNames as Order[]);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      toast.error(`Failed to load orders: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Order status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order');
    }
  };

  const updateDeliveryStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Delivery status updated');
      fetchOrders();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Failed to update delivery status');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return 'bg-accent-teal/20 text-accent-teal border-accent-teal/30';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getDeliveryStatusColor = (status: string | null) => {
    switch (status) {
      case 'delivered':
        return 'bg-accent-teal/20 text-accent-teal border-accent-teal/30';
      case 'shipped':
        return 'bg-primary-blue/20 text-primary-blue border-primary-blue/30';
      case 'ready_for_pickup':
        return 'bg-amber-500/20 text-amber-600 border-amber-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter);

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </AdminLayout>
    );
  }

  if (hasCampaigns === false) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4">Welcome to Aurora</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Get started by creating your first fundraiser to start receiving orders.
            </p>
          </div>
          <Button size="lg" onClick={() => navigate('/admin?view=create')} className="gap-2">
            <Plus className="w-5 h-5" />
            Create Your First Fundraiser
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (!hasCampaigns) {
    return (
      <AdminLayout>
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
          <Button size="lg" onClick={() => navigate('/admin?view=create')} className="gap-2">
            <Plus className="w-5 h-5" />
            Create Your First Fundraiser
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      campaignName={selectedCampaign?.name}
      campaigns={campaigns}
      selectedCampaignId={selectedCampaignId || undefined}
      onCampaignChange={setSelectedCampaignId}
      onCreateCampaign={() => navigate('/admin?view=create')}
    >
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Orders</h1>
          <p className="text-muted-foreground">
            Track and manage orders for <span className="font-semibold text-primary">{selectedCampaign?.name}</span>
          </p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">
              <List className="h-4 w-4 mr-2" />
              All Orders
            </TabsTrigger>
            <TabsTrigger value="by-student">
              <Users className="h-4 w-4 mr-2" />
              By Participant
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="flex justify-end mb-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Delivery</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No orders found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{order.customer_name || 'N/A'}</p>
                              <p className="text-sm text-muted-foreground">{order.customer_email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {order.student_fundraisers?.profiles?.full_name || 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">
                            ${Number(order.total_amount).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getDeliveryStatusColor(order.delivery_status)}>
                              {order.delivery_status || 'pending'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="by-student">
            <OrdersByStudent campaignId={selectedCampaignId || undefined} />
          </TabsContent>
        </Tabs>

        {/* Order Details Dialog */}
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Order Details</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedOrder.customer_name || 'N/A'}</p>
                    <p className="text-sm">{selectedOrder.customer_email}</p>
                    {selectedOrder.customer_phone && (
                      <p className="text-sm">{selectedOrder.customer_phone}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Delivery</p>
                    <p className="font-medium capitalize">{selectedOrder.delivery_method || 'Pickup'}</p>
                    {selectedOrder.shipping_address && (
                      <p className="text-sm text-muted-foreground">{selectedOrder.shipping_address}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Items</p>
                  <div className="space-y-2">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <span>{item.products?.name || 'Unknown Product'}</span>
                          <span className="text-muted-foreground">x{item.quantity}</span>
                        </div>
                        <span className="font-medium">${Number(item.subtotal).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value: OrderStatus) => {
                        updateOrderStatus(selectedOrder.id, value);
                        setSelectedOrder({ ...selectedOrder, status: value });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Status</p>
                    <Select
                      value={selectedOrder.delivery_status || 'pending'}
                      onValueChange={(value) => {
                        updateDeliveryStatus(selectedOrder.id, value);
                        setSelectedOrder({ ...selectedOrder, delivery_status: value });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-xl font-bold">${Number(selectedOrder.total_amount).toFixed(2)}</p>
                  </div>
                  {selectedOrder.profit_amount && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Profit</p>
                      <p className="text-xl font-bold text-accent-teal">${Number(selectedOrder.profit_amount).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
