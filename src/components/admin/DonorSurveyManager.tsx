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
import { toast } from '@/hooks/use-toast';
import { ClipboardList, Send, Star, ThumbsUp, ThumbsDown, BarChart3, Copy, ExternalLink } from 'lucide-react';

interface Donor {
  id: string;
  name: string;
  email: string;
}

interface SurveyResponse {
  id: string;
  donor_id: string;
  satisfaction_rating: number | null;
  feedback: string | null;
  would_recommend: boolean | null;
  improvement_suggestions: string | null;
  preferred_update_frequency: string | null;
  created_at: string;
  donors?: {
    name: string;
    email: string;
  };
}

interface DonorSurveyManagerProps {
  campaignId: string;
  onClose?: () => void;
}

export function DonorSurveyManager({ campaignId, onClose }: DonorSurveyManagerProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [surveyLink, setSurveyLink] = useState('');

  useEffect(() => {
    fetchData();
    generateSurveyLink();
  }, [campaignId]);

  const generateSurveyLink = () => {
    const baseUrl = window.location.origin;
    setSurveyLink(`${baseUrl}/survey/${campaignId}`);
  };

  const fetchData = async () => {
    try {
      const [donorsRes, responsesRes] = await Promise.all([
        supabase
          .from('donors')
          .select('id, name, email')
          .eq('campaign_id', campaignId),
        supabase
          .from('donor_surveys')
          .select('*, donors(name, email)')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
      ]);

      if (donorsRes.error) throw donorsRes.error;
      if (responsesRes.error) throw responsesRes.error;

      setDonors(donorsRes.data || []);
      setResponses((responsesRes.data as SurveyResponse[]) || []);
    } catch (error) {
      console.error('Error fetching survey data:', error);
      toast({ title: 'Error loading survey data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendSurvey = async () => {
    if (selectedDonors.length === 0) {
      toast({ title: 'Please select at least one donor', variant: 'destructive' });
      return;
    }

    try {
      const selectedDonorEmails = donors
        .filter(d => selectedDonors.includes(d.id))
        .map(d => ({ email: d.email, name: d.name }));

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          recipients: selectedDonorEmails,
          subject: 'We value your feedback!',
          template: 'survey',
          surveyLink,
          campaignId
        }
      });

      if (error) throw error;

      toast({ title: `Survey sent to ${selectedDonors.length} donor(s)` });
      setSendDialogOpen(false);
      setSelectedDonors([]);
    } catch (error) {
      console.error('Error sending survey:', error);
      toast({ title: 'Failed to send survey', variant: 'destructive' });
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(surveyLink);
    toast({ title: 'Survey link copied to clipboard' });
  };

  const stats = {
    totalResponses: responses.length,
    avgSatisfaction: responses.length > 0
      ? (responses.reduce((sum, r) => sum + (r.satisfaction_rating || 0), 0) / responses.filter(r => r.satisfaction_rating).length).toFixed(1)
      : 'N/A',
    wouldRecommend: responses.filter(r => r.would_recommend === true).length,
    responseRate: donors.length > 0
      ? ((responses.length / donors.length) * 100).toFixed(0)
      : '0'
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
          <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Donor Surveys</h2>
            <p className="text-sm text-muted-foreground">Collect feedback and preferences</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={copyLink}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Send className="h-4 w-4 mr-2" />
                Send Survey
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Survey to Donors</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Select Donors</Label>
                  <div className="mt-2 max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                    {donors.map(donor => (
                      <label key={donor.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDonors.includes(donor.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDonors([...selectedDonors, donor.id]);
                            } else {
                              setSelectedDonors(selectedDonors.filter(id => id !== donor.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span className="font-medium">{donor.name}</span>
                        <span className="text-sm text-muted-foreground">{donor.email}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDonors(donors.map(d => d.id))}
                    >
                      Select All
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedDonors([])}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <Button onClick={handleSendSurvey} className="w-full">
                  Send to {selectedDonors.length} Donor(s)
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{stats.totalResponses}</p>
            <p className="text-sm text-muted-foreground">Total Responses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{stats.avgSatisfaction}</p>
            <p className="text-sm text-muted-foreground">Avg. Satisfaction</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ThumbsUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{stats.wouldRecommend}</p>
            <p className="text-sm text-muted-foreground">Would Recommend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">{stats.responseRate}%</p>
            <p className="text-sm text-muted-foreground">Response Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Responses</CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No survey responses yet</p>
              <p className="text-sm mt-2">Send surveys to start collecting feedback</p>
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map(response => (
                <Card key={response.id} className="bg-muted/30">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold">{response.donors?.name || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(response.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {response.satisfaction_rating && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {response.satisfaction_rating}/5
                          </Badge>
                        )}
                        {response.would_recommend !== null && (
                          response.would_recommend ? (
                            <Badge className="bg-green-500">
                              <ThumbsUp className="h-3 w-3 mr-1" />
                              Recommends
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <ThumbsDown className="h-3 w-3 mr-1" />
                              Wouldn't Recommend
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                    {response.feedback && (
                      <div className="mb-2">
                        <p className="text-sm font-medium">Feedback:</p>
                        <p className="text-sm text-muted-foreground">{response.feedback}</p>
                      </div>
                    )}
                    {response.improvement_suggestions && (
                      <div className="mb-2">
                        <p className="text-sm font-medium">Suggestions:</p>
                        <p className="text-sm text-muted-foreground">{response.improvement_suggestions}</p>
                      </div>
                    )}
                    {response.preferred_update_frequency && (
                      <Badge variant="secondary">
                        Prefers: {response.preferred_update_frequency}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
