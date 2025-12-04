import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { MailX, CheckCircle, Loader2, Heart, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Unsubscribe() {
  const { donorId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [donor, setDonor] = useState<{ name: string; email: string; campaign_name?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (donorId) {
      verifyAndFetch();
    }
  }, [donorId]);

  const verifyAndFetch = async () => {
    try {
      const { data, error } = await supabase
        .from('donors')
        .select(`
          name,
          email,
          communication_preference,
          campaigns:campaign_id (name)
        `)
        .eq('id', donorId)
        .single();

      if (error) throw error;

      setDonor({
        name: data.name,
        email: data.email,
        campaign_name: Array.isArray(data.campaigns) 
          ? data.campaigns[0]?.name 
          : (data.campaigns as any)?.name
      });

      // Check if already unsubscribed
      if (data.communication_preference === 'never') {
        setUnsubscribed(true);
      }
    } catch (error) {
      console.error('Error fetching donor:', error);
      setError('This unsubscribe link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!donorId) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('donors')
        .update({ communication_preference: 'never' })
        .eq('id', donorId);

      if (error) throw error;

      setUnsubscribed(true);
      toast.success('You have been unsubscribed');
    } catch (error: any) {
      console.error('Error unsubscribing:', error);
      toast.error(error.message || 'Failed to unsubscribe');
    } finally {
      setProcessing(false);
    }
  };

  const handleResubscribe = async () => {
    if (!donorId) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('donors')
        .update({ communication_preference: 'monthly' })
        .eq('id', donorId);

      if (error) throw error;

      setUnsubscribed(false);
      toast.success('You have been resubscribed to monthly updates');
    } catch (error: any) {
      console.error('Error resubscribing:', error);
      toast.error(error.message || 'Failed to resubscribe');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-tight py-12 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  if (error || !donor) {
    return (
      <Layout>
        <div className="container-tight py-12">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <MailX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Link Not Valid</h2>
              <p className="text-muted-foreground mb-6">
                {error || 'This unsubscribe link may be invalid or expired.'}
              </p>
              <Button asChild>
                <Link to="/">Return to Home</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (unsubscribed) {
    return (
      <Layout>
        <div className="container-tight py-12">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">You're Unsubscribed</h2>
              <p className="text-muted-foreground mb-2">
                {donor.email} has been removed from our mailing list.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                You'll still receive important transactional emails like donation receipts.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm mb-3">Changed your mind?</p>
                  <Button variant="outline" onClick={handleResubscribe} disabled={processing}>
                    {processing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Heart className="h-4 w-4 mr-2" />
                    )}
                    Resubscribe to Updates
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Want more control?{' '}
                  <Link to={`/preferences/${donorId}`} className="text-primary hover:underline">
                    Manage your preferences
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-tight py-12">
        <Card>
          <CardContent className="pt-8 pb-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-muted">
                  <MailX className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h2 className="text-2xl font-bold mb-2">Unsubscribe from Emails</h2>
              <p className="text-muted-foreground">
                You're about to unsubscribe <strong>{donor.email}</strong> from{' '}
                {donor.campaign_name ? `${donor.campaign_name} ` : ''}fundraising updates.
              </p>
            </div>

            <div className="space-y-4 max-w-md mx-auto">
              <Button 
                onClick={handleUnsubscribe} 
                variant="destructive" 
                className="w-full"
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MailX className="h-4 w-4 mr-2" />
                )}
                Yes, Unsubscribe Me
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <Button asChild variant="outline" className="w-full">
                <Link to={`/preferences/${donorId}`}>
                  Manage My Preferences Instead
                </Link>
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You can choose to receive fewer emails instead of unsubscribing completely.
              </p>
            </div>

            <div className="mt-8 text-center">
              <Button variant="ghost" asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
