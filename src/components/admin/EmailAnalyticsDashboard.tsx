import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { Mail, MousePointer, Eye, TrendingUp, Users, Clock, Target } from 'lucide-react';

interface EmailAnalyticsDashboardProps {
  campaignId: string;
}

interface EmailMetrics {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  uniqueOpens: number;
  uniqueClicks: number;
  openRate: number;
  clickRate: number;
  clickToOpenRate: number;
}

interface DailyMetrics {
  date: string;
  sent: number;
  opened: number;
  clicked: number;
}

interface VariantMetrics {
  variant: string;
  sent: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

export function EmailAnalyticsDashboard({ campaignId }: EmailAnalyticsDashboardProps) {
  const [metrics, setMetrics] = useState<EmailMetrics>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    uniqueOpens: 0,
    uniqueClicks: 0,
    openRate: 0,
    clickRate: 0,
    clickToOpenRate: 0,
  });
  const [dailyData, setDailyData] = useState<DailyMetrics[]>([]);
  const [variantData, setVariantData] = useState<VariantMetrics[]>([]);
  const [timeRange, setTimeRange] = useState('30');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [campaignId, timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      // Fetch email tracking data for donors in this campaign
      const { data: donors } = await supabase
        .from('donors')
        .select('id')
        .eq('campaign_id', campaignId);

      if (!donors || donors.length === 0) {
        setLoading(false);
        return;
      }

      const donorIds = donors.map(d => d.id);

      const { data: trackingData, error } = await supabase
        .from('email_tracking')
        .select('*')
        .in('donor_id', donorIds)
        .gte('sent_at', startDate.toISOString())
        .order('sent_at', { ascending: true });

      if (error) throw error;

      // Calculate overall metrics
      const totalSent = trackingData?.length || 0;
      const opened = trackingData?.filter(t => t.opened_at) || [];
      const clicked = trackingData?.filter(t => t.clicked_at) || [];
      
      const totalOpened = opened.reduce((sum, t) => sum + (t.open_count || 1), 0);
      const totalClicked = clicked.reduce((sum, t) => sum + (t.click_count || 1), 0);
      const uniqueOpens = opened.length;
      const uniqueClicks = clicked.length;

      setMetrics({
        totalSent,
        totalOpened,
        totalClicked,
        uniqueOpens,
        uniqueClicks,
        openRate: totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0,
        clickToOpenRate: uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0,
      });

      // Calculate daily metrics
      const dailyMap = new Map<string, DailyMetrics>();
      
      // Initialize all dates in range
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dailyMap.set(dateStr, { date: dateStr, sent: 0, opened: 0, clicked: 0 });
      }

      // Populate with actual data
      trackingData?.forEach(track => {
        if (track.sent_at) {
          const sentDate = track.sent_at.split('T')[0];
          const existing = dailyMap.get(sentDate);
          if (existing) {
            existing.sent++;
          }
        }
        if (track.opened_at) {
          const openDate = track.opened_at.split('T')[0];
          const existing = dailyMap.get(openDate);
          if (existing) {
            existing.opened++;
          }
        }
        if (track.clicked_at) {
          const clickDate = track.clicked_at.split('T')[0];
          const existing = dailyMap.get(clickDate);
          if (existing) {
            existing.clicked++;
          }
        }
      });

      setDailyData(Array.from(dailyMap.values()).slice(-parseInt(timeRange)));

      // Calculate variant metrics for A/B tests
      const variantMap = new Map<string, VariantMetrics>();
      trackingData?.forEach(track => {
        if (track.variant) {
          const existing = variantMap.get(track.variant) || {
            variant: track.variant.toUpperCase(),
            sent: 0,
            opened: 0,
            clicked: 0,
            openRate: 0,
            clickRate: 0,
          };
          existing.sent++;
          if (track.opened_at) existing.opened++;
          if (track.clicked_at) existing.clicked++;
          variantMap.set(track.variant, existing);
        }
      });

      // Calculate rates for variants
      variantMap.forEach(v => {
        v.openRate = v.sent > 0 ? (v.opened / v.sent) * 100 : 0;
        v.clickRate = v.sent > 0 ? (v.clicked / v.sent) * 100 : 0;
      });

      setVariantData(Array.from(variantMap.values()));
    } catch (error) {
      console.error('Error fetching email analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#10B981', '#F59E0B'];

  const pieData = [
    { name: 'Opened & Clicked', value: metrics.uniqueClicks },
    { name: 'Opened Only', value: metrics.uniqueOpens - metrics.uniqueClicks },
    { name: 'Not Opened', value: metrics.totalSent - metrics.uniqueOpens },
  ].filter(d => d.value > 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Email Analytics</h2>
            <p className="text-sm text-muted-foreground">Track engagement and optimize your emails</p>
          </div>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="14">Last 14 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Mail className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalSent}</p>
                <p className="text-xs text-muted-foreground">Emails Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.openRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Open Rate</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.uniqueOpens} unique opens
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <MousePointer className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.clickRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Click Rate</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.uniqueClicks} unique clicks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Target className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.clickToOpenRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Click-to-Open</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Engagement Trends</TabsTrigger>
          <TabsTrigger value="breakdown">Engagement Breakdown</TabsTrigger>
          {variantData.length > 0 && (
            <TabsTrigger value="ab-tests">A/B Test Results</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Daily Email Performance</CardTitle>
              <CardDescription>Opens and clicks over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sent" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                      name="Sent"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="opened" 
                      stackId="2"
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.4}
                      name="Opened"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="clicked" 
                      stackId="3"
                      stroke="#8B5CF6" 
                      fill="#8B5CF6"
                      fillOpacity={0.6}
                      name="Clicked"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Breakdown</CardTitle>
              <CardDescription>How recipients interact with your emails</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Opened & Clicked</span>
                      <Badge className="bg-green-500">{metrics.uniqueClicks}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Highly engaged recipients who opened and clicked a link
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Opened Only</span>
                      <Badge className="bg-blue-500">{metrics.uniqueOpens - metrics.uniqueClicks}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recipients who opened but didn't click any links
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50 border border-muted">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Not Opened</span>
                      <Badge variant="secondary">{metrics.totalSent - metrics.uniqueOpens}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Recipients who haven't opened the email yet
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {variantData.length > 0 && (
          <TabsContent value="ab-tests">
            <Card>
              <CardHeader>
                <CardTitle>A/B Test Performance</CardTitle>
                <CardDescription>Compare variant performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={variantData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <YAxis type="category" dataKey="variant" width={80} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Bar dataKey="openRate" fill="#10B981" name="Open Rate" />
                      <Bar dataKey="clickRate" fill="#8B5CF6" name="Click Rate" />
                      <Legend />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  {variantData.map((v, i) => (
                    <div key={v.variant} className={`p-4 rounded-lg border ${i === 0 ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'bg-purple-50/50 dark:bg-purple-950/20'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={i === 0 ? 'bg-blue-500' : 'bg-purple-500'}>
                          Variant {v.variant}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{v.sent} sent</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Open Rate</p>
                          <p className="text-lg font-bold">{v.openRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Click Rate</p>
                          <p className="text-lg font-bold">{v.clickRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Tips Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {metrics.openRate < 20 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">Improve Open Rates</p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Try more compelling subject lines. A/B test different approaches to see what resonates.
                </p>
              </div>
            )}
            {metrics.clickToOpenRate < 15 && metrics.uniqueOpens > 10 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">Boost Click-Through</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Make your call-to-action buttons more prominent and use action-oriented language.
                </p>
              </div>
            )}
            {metrics.openRate >= 20 && metrics.clickRate >= 3 && (
              <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <p className="font-medium text-green-800 dark:text-green-200 mb-1">Great Performance!</p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your emails are performing above industry average. Keep up the good work!
                </p>
              </div>
            )}
            <div className="p-4 bg-muted/50 rounded-lg">
              <p className="font-medium mb-1">Industry Benchmarks</p>
              <p className="text-sm text-muted-foreground">
                Nonprofit avg: 25% open rate, 2.5% click rate
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
