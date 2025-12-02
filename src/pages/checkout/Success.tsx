import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      updateOrderStatus();
    }
  }, [sessionId]);

  const updateOrderStatus = async () => {
    try {
      // Update order status to completed
      const { data } = await supabase
        .from('orders')
        .update({ status: 'completed' })
        .eq('stripe_session_id', sessionId)
        .select()
        .single();

      setOrder(data);
    } catch (error) {
      console.error('Error updating order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container-tight py-12">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-secondary" />
            </div>
            <CardTitle className="text-3xl">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground">
              Thank you for your purchase! Your order has been confirmed.
            </p>
            {order && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Order Total</p>
                <p className="text-2xl font-bold">${Number(order.total_amount).toFixed(2)}</p>
              </div>
            )}
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to your email address.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
