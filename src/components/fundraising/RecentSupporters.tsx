import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentSupportersProps {
  fundraiserId: string;
}

interface Supporter {
  id: string;
  customer_name: string | null;
  total_amount: number;
  created_at: string;
}

export const RecentSupporters = ({ fundraiserId }: RecentSupportersProps) => {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentSupporters();
  }, [fundraiserId]);

  const fetchRecentSupporters = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, total_amount, created_at')
        .eq('student_fundraiser_id', fundraiserId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setSupporters(data || []);
    } catch (error) {
      console.error('Error fetching supporters:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Recent Supporters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-3">
                <div className="w-8 h-8 bg-muted rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-24" />
                  <div className="h-3 bg-muted rounded w-16 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (supporters.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Recent Supporters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            Be the first to support this fundraiser!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Recent Supporters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {supporters.map((supporter) => (
            <div key={supporter.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {supporter.customer_name || 'Anonymous'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(supporter.created_at), { addSuffix: true })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary-blue">
                  ${Number(supporter.total_amount).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
