import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Package,
  Download,
  ChevronDown,
  ChevronRight,
  Truck,
  MapPin,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

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
  status: string;
  delivery_status: string | null;
  delivery_method: string | null;
  shipping_address: string | null;
  created_at: string;
  order_items: OrderItem[];
  student_fundraiser_id?: string;
}

interface StudentWithOrders {
  student_id: string;
  student_name: string;
  fundraiser_id: string;
  orders: Order[];
  total_sales: number;
  total_profit: number;
  order_count: number;
}

interface Campaign {
  id: string;
  name: string;
}

interface OrdersByStudentProps {
  campaignId?: string;
}

export function OrdersByStudent({ campaignId }: OrdersByStudentProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(campaignId || null);
  const [studentOrders, setStudentOrders] = useState<StudentWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (campaignId) {
      setSelectedCampaignId(campaignId);
    } else {
      fetchCampaigns();
    }
  }, [campaignId, user]);

  useEffect(() => {
    if (selectedCampaignId) {
      fetchOrdersByStudent();
    }
  }, [selectedCampaignId]);

  const fetchCampaigns = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('organization_admin_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      if (data && data.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      if (!campaignId) setLoading(false);
    }
  };

  const fetchOrdersByStudent = async () => {
    if (!selectedCampaignId) {
      setStudentOrders([]);
      return;
    }

    setLoading(true);

    try {
      // First, get student fundraisers with profile data
      const { data: fundraisers, error: fundraisersError } = await supabase
        .from('student_fundraisers')
        .select(`
          id,
          student_id,
          profiles!student_fundraisers_student_id_fkey(full_name)
        `)
        .eq('campaign_id', selectedCampaignId);

      if (fundraisersError) throw fundraisersError;

      const fundraiserIds = fundraisers?.map(f => f.id) || [];

      if (fundraiserIds.length === 0) {
        setStudentOrders([]);
        setLoading(false);
        return;
      }

      // Then fetch orders for these fundraisers
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*, products(name))
        `)
        .in('student_fundraiser_id', fundraiserIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Group orders by student
      const studentMap = new Map<string, StudentWithOrders>();

      fundraisers?.forEach(f => {
        const profileData = f.profiles as { full_name: string | null } | null;
        studentMap.set(f.id, {
          student_id: f.student_id,
          student_name: profileData?.full_name || 'Unknown Student',
          fundraiser_id: f.id,
          orders: [],
          total_sales: 0,
          total_profit: 0,
          order_count: 0,
        });
      });

      orders?.forEach((order: any) => {
        const student = studentMap.get(order.student_fundraiser_id);
        if (student) {
          student.orders.push(order);
          student.total_sales += Number(order.total_amount || 0);
          student.total_profit += Number(order.profit_amount || 0);
          student.order_count += 1;
        }
      });

      setStudentOrders(Array.from(studentMap.values()).sort((a, b) => b.total_sales - a.total_sales));
    } catch (error: any) {
      console.error('Error fetching student orders:', error);
      toast.error(`Failed to load orders: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentExpanded = (fundraiserId: string) => {
    const newExpanded = new Set(expandedStudents);
    if (newExpanded.has(fundraiserId)) {
      newExpanded.delete(fundraiserId);
    } else {
      newExpanded.add(fundraiserId);
    }
    setExpandedStudents(newExpanded);
  };

  const updateDeliveryStatus = async (orderId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ delivery_status: status })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Delivery status updated');
      fetchOrdersByStudent();
    } catch (error) {
      console.error('Error updating delivery status:', error);
      toast.error('Failed to update status');
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

  const exportStudentOrders = (student: StudentWithOrders) => {
    const rows = [
      ['Customer', 'Email', 'Phone', 'Items', 'Total', 'Delivery Method', 'Address', 'Status'],
    ];

    student.orders.forEach(order => {
      const items = order.order_items.map(i => `${i.products?.name || 'Unknown'} x${i.quantity}`).join('; ');
      rows.push([
        order.customer_name || '',
        order.customer_email,
        order.customer_phone || '',
        items,
        `$${Number(order.total_amount).toFixed(2)}`,
        order.delivery_method || 'pickup',
        order.shipping_address || '',
        order.delivery_status || 'pending',
      ]);
    });

    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${student.student_name.replace(/\s+/g, '-').toLowerCase()}.csv`;
    a.click();
  };

  if (loading && campaigns.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/4"></div>
        <div className="h-64 bg-muted rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!campaignId && (
        <div className="flex items-center justify-between">
          <Select value={selectedCampaignId || ''} onValueChange={setSelectedCampaignId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <p className="text-2xl font-bold">{studentOrders.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="text-2xl font-bold">{studentOrders.reduce((sum, s) => sum + s.order_count, 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Sales</p>
            <p className="text-2xl font-bold text-primary">
              ${studentOrders.reduce((sum, s) => sum + s.total_sales, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Profit</p>
            <p className="text-2xl font-bold text-accent-teal">
              ${studentOrders.reduce((sum, s) => sum + s.total_profit, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Student Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Orders by Participant</CardTitle>
        </CardHeader>
        <CardContent>
          {studentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No orders found for this campaign.
            </p>
          ) : (
            <div className="space-y-2">
              {studentOrders.map((student) => (
                <div key={student.fundraiser_id} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleStudentExpanded(student.fundraiser_id)}
                  >
                    <div className="flex items-center gap-4">
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        {expandedStudents.has(student.fundraiser_id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{student.student_name}</span>
                      </div>
                      <Badge variant="outline">{student.order_count} orders</Badge>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Sales</p>
                        <p className="font-medium">${student.total_sales.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Profit</p>
                        <p className="font-medium text-accent-teal">${student.total_profit.toFixed(2)}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          exportStudentOrders(student);
                        }}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  </div>

                  {expandedStudents.has(student.fundraiser_id) && (
                    <div className="border-t bg-muted/30">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Items</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Delivery</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {student.orders.map((order) => (
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
                                <div className="flex items-center gap-1">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                  {order.order_items.length} item(s)
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                ${Number(order.total_amount).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {order.delivery_method === 'ship' ? (
                                    <Truck className="h-4 w-4" />
                                  ) : (
                                    <MapPin className="h-4 w-4" />
                                  )}
                                  <span className="capitalize">{order.delivery_method || 'pickup'}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={order.delivery_status || 'pending'}
                                  onValueChange={(value) => updateDeliveryStatus(order.id, value)}
                                >
                                  <SelectTrigger className="w-32 h-8">
                                    <Badge variant="outline" className={getDeliveryStatusColor(order.delivery_status)}>
                                      {order.delivery_status || 'pending'}
                                    </Badge>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                                    <SelectItem value="shipped">Shipped</SelectItem>
                                    <SelectItem value="delivered">Delivered</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">${Number(selectedOrder.total_amount).toFixed(2)}</p>
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
                    <SelectTrigger className="w-40">
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
