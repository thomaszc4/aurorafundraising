import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function CheckoutCancel() {
  return (
    <Layout>
      <div className="container-tight py-12">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-destructive" />
            </div>
            <CardTitle className="text-3xl">Payment Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg text-muted-foreground">
              Your payment was cancelled. No charges have been made.
            </p>
            <Button asChild size="lg">
              <Link to="/">Return to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
