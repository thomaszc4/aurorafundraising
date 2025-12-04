import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  TrendingUp, TrendingDown, Users, UserPlus, UserMinus, 
  RefreshCw, Target, ArrowLeft, Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DonorMetric {
  id: string;
  period_start: string;
  period_end: string;
  total_donors: number;
  new_donors: number;
  repeat_donors: number;
  lapsed_donors: number;
  monthly_donors: number;
  retention_rate: number | null;
}

interface RetentionAnalyticsProps {
  campaignId: string;
  onClose?: () => void;
}

export function RetentionAnalytics({ campaignId, onClose }: RetentionAnalyticsProps) {
  const [metrics, setMetrics] = useState<DonorMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [timeRange, setTimeRange] = useState('12');

  useEffect(() => {
    fetchMetrics();
  }, [campaignId, timeRange]);

  const fetchMetrics = async () => {
    setLoading(true);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(timeRange));

    const { data, error } = await supabase
      .from('donor_metrics')
      .select('*')
      .eq('campaign_id', campaignId)
      .gte('period_start', startDate.toISOString().split('T')[0])
      .order('period_start', { ascending: true });

    if (error) {
      console.error('Error fetching metrics:', error);
    } else {
      setMetrics(data || []);
    }
    setLoading(false);
  };

  const calculateQuarterlyMetrics = async () => {
    setCalculating(true);
    try {
      const { data: donors } = await supabase
        .from('donors')
        .select('*')
        .eq('campaign_id', campaignId);

      if (!donors || donors.length === 0) {
        toast.error('No donor data to analyze');
        setCalculating(false);
        return;
      }

      // Calculate metrics for current quarter
      const now = new Date();
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);

      const previousQuarterStart = new Date(quarterStart);
      previousQuarterStart.setMonth(previousQuarterStart.getMonth() - 3);

      const totalDonors = donors.length;
      const newDonors = donors.filter(d => 
        d.first_donation_at && new Date(d.first_donation_at) >= quarterStart
      ).length;
      const repeatDonors = donors.filter(d => d.donation_count > 1).length;
      const lapsedDonors = donors.filter(d => d.segment === 'lapsed').length;
      const monthlyDonors = donors.filter(d => d.segment === 'recurring').length;

      // Calculate retention rate
      const previousDonors = donors.filter(d =>
        d.first_donation_at && new Date(d.first_donation_at) < quarterStart
      ).length;
      const retainedDonors = donors.filter(d =>
        d.first_donation_at && 
        new Date(d.first_donation_at) < quarterStart &&
        d.last_donation_at &&
        new Date(d.last_donation_at) >= quarterStart
      ).length;
      const retentionRate = previousDonors > 0 ? (retainedDonors / previousDonors) * 100 : 0;

      const { error } = await supabase.from('donor_metrics').upsert({
        campaign_id: campaignId,
        period_start: quarterStart.toISOString().split('T')[0],
        period_end: quarterEnd.toISOString().split('T')[0],
        total_donors: totalDonors,
        new_donors: newDonors,
        repeat_donors: repeatDonors,
        lapsed_donors: lapsedDonors,
        monthly_donors: monthlyDonors,
        retention_rate: retentionRate
      }, { onConflict: 'campaign_id,period_start,period_end' });

      if (error) throw error;
      
      toast.success('Metrics calculated and saved');
      fetchMetrics();
    } catch (error) {
      console.error('Error calculating metrics:', error);
      toast.error('Failed to calculate metrics');
    } finally {
      setCalculating(false);
    }
  };

  const currentMetrics = metrics[metrics.length - 1];
  const previousMetrics = metrics[metrics.length - 2];

  const getChange = (current: number | undefined, previous: number | undefined) => {
    if (!current || !previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const chartData = metrics.map(m => ({
    period: new Date(m.period_start).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    retention: m.retention_rate || 0,
    total: m.total_donors,
    new: m.new_donors,
    repeat: m.repeat_donors
  }));

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">Donor Retention Analytics</h2>
            <p className="text-muted-foreground">Track and improve donor retention rates</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">Last 6 months</SelectItem>
              <SelectItem value="12">Last 12 months</SelectItem>
              <SelectItem value="24">Last 24 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={calculateQuarterlyMetrics} disabled={calculating} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", calculating && "animate-spin")} />
            Calculate Metrics
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-primary" />
              {getChange(currentMetrics?.total_donors, previousMetrics?.total_donors) !== null && (
                <Badge variant={getChange(currentMetrics?.total_donors, previousMetrics?.total_donors)! >= 0 ? 'default' : 'destructive'} className="gap-1">
                  {getChange(currentMetrics?.total_donors, previousMetrics?.total_donors)! >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(getChange(currentMetrics?.total_donors, previousMetrics?.total_donors)!).toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold mt-2">{currentMetrics?.total_donors || 0}</div>
            <p className="text-xs text-muted-foreground">Total Donors</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <UserPlus className="h-8 w-8 text-green-500" />
            </div>
            <div className="text-2xl font-bold mt-2">{currentMetrics?.new_donors || 0}</div>
            <p className="text-xs text-muted-foreground">New Donors</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-2xl font-bold mt-2">{currentMetrics?.repeat_donors || 0}</div>
            <p className="text-xs text-muted-foreground">Repeat Donors</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <UserMinus className="h-8 w-8 text-amber-500" />
            </div>
            <div className="text-2xl font-bold mt-2">{currentMetrics?.lapsed_donors || 0}</div>
            <p className="text-xs text-muted-foreground">Lapsed Donors</p>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Target className="h-8 w-8 text-primary" />
              {getChange(currentMetrics?.retention_rate || 0, previousMetrics?.retention_rate || 0) !== null && (
                <Badge variant={getChange(currentMetrics?.retention_rate || 0, previousMetrics?.retention_rate || 0)! >= 0 ? 'default' : 'destructive'} className="gap-1">
                  {getChange(currentMetrics?.retention_rate || 0, previousMetrics?.retention_rate || 0)! >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {Math.abs(getChange(currentMetrics?.retention_rate || 0, previousMetrics?.retention_rate || 0)!).toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="text-2xl font-bold mt-2">{(currentMetrics?.retention_rate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Retention Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Retention Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Retention Goal Progress
          </CardTitle>
          <CardDescription>Track progress toward your retention improvement goal</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Current: {(currentMetrics?.retention_rate || 0).toFixed(1)}%</span>
              <span>Goal: {((currentMetrics?.retention_rate || 0) + 5).toFixed(1)}% (+5%)</span>
            </div>
            <Progress value={Math.min(((currentMetrics?.retention_rate || 0) / ((currentMetrics?.retention_rate || 0) + 5)) * 100, 100)} className="h-4" />
            <p className="text-sm text-muted-foreground">
              {((currentMetrics?.retention_rate || 0) + 5 - (currentMetrics?.retention_rate || 0)).toFixed(1)} percentage points to reach your goal
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Retention Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Line type="monotone" dataKey="retention" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No data available. Click "Calculate Metrics" to generate.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Donor Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="period" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="new" fill="hsl(var(--chart-1))" name="New" />
                  <Bar dataKey="repeat" fill="hsl(var(--chart-2))" name="Repeat" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                <p>No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Retention Improvement Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Thank donors within 24 hours</h4>
              <p className="text-sm text-muted-foreground">Quick acknowledgment shows donors their gift matters and increases likelihood of repeat giving.</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Send quarterly impact updates</h4>
              <p className="text-sm text-muted-foreground">Show donors exactly how their contributions made a difference with concrete outcomes.</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Reach out to lapsed donors</h4>
              <p className="text-sm text-muted-foreground">A friendly "we miss you" message can re-engage donors who haven't given recently.</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Promote monthly giving</h4>
              <p className="text-sm text-muted-foreground">Monthly donors have higher lifetime value and are more likely to stay engaged long-term.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default RetentionAnalytics;
