import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { FlaskConical, Play, Pause, Trophy, Mail, BarChart3, Plus, CheckCircle } from 'lucide-react';

interface ABTest {
  id: string;
  name: string;
  status: string;
  variant_a_subject: string;
  variant_b_subject: string;
  winner: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface TestResults {
  variant_a: { sent: number; opened: number; clicked: number };
  variant_b: { sent: number; opened: number; clicked: number };
}

interface EmailABTestingProps {
  campaignId: string;
  onClose?: () => void;
}

export function EmailABTesting({ campaignId, onClose }: EmailABTestingProps) {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResults>>({});
  
  const [newTest, setNewTest] = useState({
    name: '',
    variant_a_subject: '',
    variant_b_subject: '',
    variant_a_body: '',
    variant_b_body: ''
  });

  useEffect(() => {
    fetchTests();
  }, [campaignId]);

  const fetchTests = async () => {
    try {
      const { data, error } = await supabase
        .from('email_ab_tests')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTests((data as ABTest[]) || []);
      
      // Fetch results for running/completed tests
      for (const test of (data || [])) {
        if (test.status !== 'draft') {
          await fetchTestResults(test.id);
        }
      }
    } catch (error) {
      console.error('Error fetching A/B tests:', error);
      toast({ title: 'Error loading A/B tests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTestResults = async (testId: string) => {
    try {
      const { data, error } = await supabase
        .from('email_tracking')
        .select('variant, opened_at, clicked_at')
        .eq('ab_test_id', testId);

      if (error) throw error;

      const results: TestResults = {
        variant_a: { sent: 0, opened: 0, clicked: 0 },
        variant_b: { sent: 0, opened: 0, clicked: 0 }
      };

      (data || []).forEach(track => {
        const variant = track.variant === 'a' ? 'variant_a' : 'variant_b';
        results[variant].sent++;
        if (track.opened_at) results[variant].opened++;
        if (track.clicked_at) results[variant].clicked++;
      });

      setTestResults(prev => ({ ...prev, [testId]: results }));
    } catch (error) {
      console.error('Error fetching test results:', error);
    }
  };

  const handleCreateTest = async () => {
    if (!newTest.name || !newTest.variant_a_subject || !newTest.variant_b_subject) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('email_ab_tests')
        .insert({
          campaign_id: campaignId,
          name: newTest.name,
          variant_a_subject: newTest.variant_a_subject,
          variant_b_subject: newTest.variant_b_subject,
          status: 'draft'
        });

      if (error) throw error;

      toast({ title: 'A/B test created successfully' });
      setCreateDialogOpen(false);
      setNewTest({ name: '', variant_a_subject: '', variant_b_subject: '', variant_a_body: '', variant_b_body: '' });
      fetchTests();
    } catch (error) {
      console.error('Error creating A/B test:', error);
      toast({ title: 'Failed to create test', variant: 'destructive' });
    }
  };

  const handleStartTest = async (test: ABTest) => {
    try {
      const { error } = await supabase
        .from('email_ab_tests')
        .update({ 
          status: 'running',
          started_at: new Date().toISOString()
        })
        .eq('id', test.id);

      if (error) throw error;

      toast({ title: 'A/B test started' });
      fetchTests();
    } catch (error) {
      console.error('Error starting test:', error);
      toast({ title: 'Failed to start test', variant: 'destructive' });
    }
  };

  const handleCompleteTest = async (test: ABTest, winner: 'a' | 'b') => {
    try {
      const { error } = await supabase
        .from('email_ab_tests')
        .update({ 
          status: 'completed',
          winner,
          completed_at: new Date().toISOString()
        })
        .eq('id', test.id);

      if (error) throw error;

      toast({ title: `Test completed. Variant ${winner.toUpperCase()} wins!` });
      fetchTests();
    } catch (error) {
      console.error('Error completing test:', error);
      toast({ title: 'Failed to complete test', variant: 'destructive' });
    }
  };

  const getOpenRate = (results: TestResults, variant: 'variant_a' | 'variant_b') => {
    if (results[variant].sent === 0) return 0;
    return (results[variant].opened / results[variant].sent) * 100;
  };

  const getClickRate = (results: TestResults, variant: 'variant_a' | 'variant_b') => {
    if (results[variant].sent === 0) return 0;
    return (results[variant].clicked / results[variant].sent) * 100;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      case 'completed':
        return <Badge className="bg-green-500">Completed</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-32 bg-muted rounded" />
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600">
            <FlaskConical className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Email A/B Testing</h2>
            <p className="text-sm text-muted-foreground">Optimize your email engagement</p>
          </div>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create A/B Test</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Test Name</Label>
                <Input
                  value={newTest.name}
                  onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                  placeholder="e.g., Thank You Email Subject Test"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3 p-4 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-500">Variant A</Badge>
                  </div>
                  <div>
                    <Label>Subject Line</Label>
                    <Input
                      value={newTest.variant_a_subject}
                      onChange={(e) => setNewTest({ ...newTest, variant_a_subject: e.target.value })}
                      placeholder="Thank you for your donation!"
                    />
                  </div>
                  <div>
                    <Label>Preview Text (optional)</Label>
                    <Textarea
                      value={newTest.variant_a_body}
                      onChange={(e) => setNewTest({ ...newTest, variant_a_body: e.target.value })}
                      placeholder="Your gift makes a difference..."
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="space-y-3 p-4 border rounded-lg bg-purple-50/50 dark:bg-purple-950/20">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-purple-500">Variant B</Badge>
                  </div>
                  <div>
                    <Label>Subject Line</Label>
                    <Input
                      value={newTest.variant_b_subject}
                      onChange={(e) => setNewTest({ ...newTest, variant_b_subject: e.target.value })}
                      placeholder="You just changed a child's life!"
                    />
                  </div>
                  <div>
                    <Label>Preview Text (optional)</Label>
                    <Textarea
                      value={newTest.variant_b_body}
                      onChange={(e) => setNewTest({ ...newTest, variant_b_body: e.target.value })}
                      placeholder="See the impact you've made..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              <Button onClick={handleCreateTest} className="w-full">
                Create Test
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tests List */}
      {tests.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FlaskConical className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No A/B tests yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Create your first test to optimize email performance
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {tests.map(test => {
            const results = testResults[test.id];
            
            return (
              <Card key={test.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      {getStatusBadge(test.status)}
                      {test.winner && (
                        <Badge className="bg-yellow-500">
                          <Trophy className="h-3 w-3 mr-1" />
                          Winner: {test.winner.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {test.status === 'draft' && (
                        <Button size="sm" onClick={() => handleStartTest(test)}>
                          <Play className="h-4 w-4 mr-1" />
                          Start
                        </Button>
                      )}
                      {test.status === 'running' && results && (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCompleteTest(test, 'a')}
                          >
                            A Wins
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCompleteTest(test, 'b')}
                          >
                            B Wins
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Variant A */}
                    <div className={`p-4 border rounded-lg ${test.winner === 'a' ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' : 'bg-muted/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-blue-500">Variant A</Badge>
                        {test.winner === 'a' && <Trophy className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <p className="font-medium mb-3">{test.variant_a_subject}</p>
                      
                      {results && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sent:</span>
                            <span>{results.variant_a.sent}</span>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">Open Rate:</span>
                              <span>{getOpenRate(results, 'variant_a').toFixed(1)}%</span>
                            </div>
                            <Progress value={getOpenRate(results, 'variant_a')} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">Click Rate:</span>
                              <span>{getClickRate(results, 'variant_a').toFixed(1)}%</span>
                            </div>
                            <Progress value={getClickRate(results, 'variant_a')} className="h-2" />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Variant B */}
                    <div className={`p-4 border rounded-lg ${test.winner === 'b' ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20' : 'bg-muted/30'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-purple-500">Variant B</Badge>
                        {test.winner === 'b' && <Trophy className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <p className="font-medium mb-3">{test.variant_b_subject}</p>
                      
                      {results && (
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Sent:</span>
                            <span>{results.variant_b.sent}</span>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">Open Rate:</span>
                              <span>{getOpenRate(results, 'variant_b').toFixed(1)}%</span>
                            </div>
                            <Progress value={getOpenRate(results, 'variant_b')} className="h-2" />
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-muted-foreground">Click Rate:</span>
                              <span>{getClickRate(results, 'variant_b').toFixed(1)}%</span>
                            </div>
                            <Progress value={getClickRate(results, 'variant_b')} className="h-2" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-4">
                    Created {new Date(test.created_at).toLocaleDateString()}
                    {test.started_at && ` • Started ${new Date(test.started_at).toLocaleDateString()}`}
                    {test.completed_at && ` • Completed ${new Date(test.completed_at).toLocaleDateString()}`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
