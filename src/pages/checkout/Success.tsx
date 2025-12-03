import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      // Only fetch order data - do NOT update status client-side
      // Status is updated securely via Stripe webhook
      fetchOrderData();
    } else {
      setLoading(false);
    }
  }, [sessionId]);

  const fetchOrderData = async () => {
    try {
      // Fetch order to display confirmation info
      // The webhook will have already updated the status
      const { data } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('stripe_session_id', sessionId)
        .single();

      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
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
              {loading ? (
                <Loader2 className="h-16 w-16 text-muted-foreground animate-spin" />
              ) : (
                <CheckCircle className="h-16 w-16 text-secondary" />
              )}
            </div>
            <CardTitle className="text-3xl">
              {loading ? 'Processing...' : 'Payment Successful!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground">
              {loading 
                ? 'Please wait while we confirm your payment...'
                : 'Thank you for your purchase! Your order has been confirmed.'
              }
            </p>
            {order && !loading && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Order Total</p>
                <p className="text-2xl font-bold">${Number(order.total_amount).toFixed(2)}</p>
              </div>
            )}
            {!loading && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  A confirmation email has been sent to your email address.
                </p>
              </div>
            )}
            <Button asChild size="lg" disabled={loading}>
              <Link to="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
