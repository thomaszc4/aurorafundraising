import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Send, Trash2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ScheduledEmail {
  id: string;
  subject: string;
  content: string;
  recipient_segment: string;
  scheduled_for: string;
  status: string;
  created_at: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailSchedulerProps {
  campaignId: string;
  onClose?: () => void;
}

const OPTIMAL_SEND_TIMES = [
  { label: 'Tuesday 10:00 AM', value: 'tue-10', dayOffset: (new Date().getDay() <= 2 ? 2 - new Date().getDay() : 9 - new Date().getDay()), hour: 10 },
  { label: 'Thursday 2:00 PM', value: 'thu-14', dayOffset: (new Date().getDay() <= 4 ? 4 - new Date().getDay() : 11 - new Date().getDay()), hour: 14 },
  { label: 'Wednesday 9:00 AM', value: 'wed-9', dayOffset: (new Date().getDay() <= 3 ? 3 - new Date().getDay() : 10 - new Date().getDay()), hour: 9 },
];

export function EmailScheduler({ campaignId, onClose }: EmailSchedulerProps) {
  const [scheduledEmails, setScheduledEmails] = useState<ScheduledEmail[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [segment, setSegment] = useState('all');
  const [scheduledFor, setScheduledFor] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    try {
      const [emailsRes, templatesRes] = await Promise.all([
        supabase
          .from('scheduled_emails')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('scheduled_for', { ascending: true }),
        supabase
          .from('email_templates')
          .select('*')
          .or(`campaign_id.eq.${campaignId},is_system.eq.true`)
      ]);

      if (emailsRes.data) setScheduledEmails(emailsRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.body);
    }
  };

  const handleOptimalTime = (timeOption: typeof OPTIMAL_SEND_TIMES[0]) => {
    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + timeOption.dayOffset);
    targetDate.setHours(timeOption.hour, 0, 0, 0);
    setScheduledFor(targetDate.toISOString().slice(0, 16));
  };

  const handleSchedule = async () => {
    if (!subject || !content || !scheduledFor) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase.from('scheduled_emails').insert({
        campaign_id: campaignId,
        subject,
        content,
        recipient_segment: segment,
        scheduled_for: new Date(scheduledFor).toISOString(),
        template_id: selectedTemplate || null,
      });

      if (error) throw error;

      toast.success('Email scheduled successfully');
      setSubject('');
      setContent('');
      setScheduledFor('');
      setSelectedTemplate('');
      fetchData();
    } catch (error) {
      console.error('Error scheduling email:', error);
      toast.error('Failed to schedule email');
    }
  };

  const handleCancel = async (emailId: string) => {
    try {
      const { error } = await supabase
        .from('scheduled_emails')
        .update({ status: 'cancelled' })
        .eq('id', emailId);

      if (error) throw error;

      toast.success('Scheduled email cancelled');
      fetchData();
    } catch (error) {
      console.error('Error cancelling email:', error);
      toast.error('Failed to cancel email');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      scheduled: 'default',
      sent: 'secondary',
      cancelled: 'destructive',
      failed: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Email Scheduler</h2>
        {onClose && (
          <Button variant="outline" onClick={onClose}>Close</Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Schedule New Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Schedule New Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Use Template</label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Subject *</label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject line"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Content *</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Email content (HTML supported)"
                rows={6}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Recipient Segment</label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Donors</SelectItem>
                  <SelectItem value="first_time">First-Time Donors</SelectItem>
                  <SelectItem value="recurring">Recurring Donors</SelectItem>
                  <SelectItem value="major">Major Donors</SelectItem>
                  <SelectItem value="lapsed">Lapsed Donors</SelectItem>
                  <SelectItem value="marketing_consent">Marketing Opt-In</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Schedule For *</label>
              <Input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Optimal Send Times</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {OPTIMAL_SEND_TIMES.map(time => (
                  <Button
                    key={time.value}
                    variant="outline"
                    size="sm"
                    onClick={() => handleOptimalTime(time)}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    {time.label}
                  </Button>
                ))}
              </div>
            </div>

            <Button onClick={handleSchedule} className="w-full">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Email
            </Button>
          </CardContent>
        </Card>

        {/* Scheduled Emails List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Scheduled Emails
            </CardTitle>
          </CardHeader>
          <CardContent>
            {scheduledEmails.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No emails scheduled yet
              </p>
            ) : (
              <div className="space-y-3">
                {scheduledEmails.map(email => (
                  <div
                    key={email.id}
                    className="p-3 border rounded-lg space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium truncate">{email.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(email.scheduled_for), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                      {getStatusBadge(email.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {email.recipient_segment}
                      </Badge>
                      {email.status === 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancel(email.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
