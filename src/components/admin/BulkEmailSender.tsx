import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Users, Tag, Eye, Mail, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';

interface Donor {
  id: string;
  name: string;
  email: string;
  total_donated: number;
  donation_count: number;
  segment: string;
  marketing_consent: boolean;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface BulkEmailSenderProps {
  campaignId: string;
  onClose?: () => void;
}

const MERGE_TAGS = [
  { tag: '{{donor_name}}', description: 'Donor\'s full name' },
  { tag: '{{first_name}}', description: 'Donor\'s first name' },
  { tag: '{{email}}', description: 'Donor\'s email address' },
  { tag: '{{total_donated}}', description: 'Total amount donated' },
  { tag: '{{donation_count}}', description: 'Number of donations' },
  { tag: '{{organization_name}}', description: 'Your organization name' },
  { tag: '{{campaign_name}}', description: 'Campaign name' },
  { tag: '{{unsubscribe_link}}', description: 'Unsubscribe link' },
  { tag: '{{preferences_link}}', description: 'Preferences link' },
];

export function BulkEmailSender({ campaignId, onClose }: BulkEmailSenderProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedDonors, setSelectedDonors] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [segment, setSegment] = useState('all');
  const [showPreview, setShowPreview] = useState(false);
  const [previewDonor, setPreviewDonor] = useState<Donor | null>(null);
  const [campaign, setCampaign] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    try {
      const [donorsRes, templatesRes, campaignRes] = await Promise.all([
        supabase
          .from('donors')
          .select('*')
          .eq('campaign_id', campaignId)
          .order('name'),
        supabase
          .from('email_templates')
          .select('*')
          .or(`campaign_id.eq.${campaignId},is_system.eq.true`),
        supabase
          .from('campaigns')
          .select('*')
          .eq('id', campaignId)
          .single()
      ]);

      if (donorsRes.data) setDonors(donorsRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data);
      if (campaignRes.data) setCampaign(campaignRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setContent(template.body);
    }
  };

  const insertMergeTag = (tag: string) => {
    setContent(prev => prev + tag);
  };

  const filteredDonors = donors.filter(donor => {
    // Only include donors with marketing consent
    if (!donor.marketing_consent) return false;
    if (segment === 'all') return true;
    return donor.segment === segment;
  });

  const toggleSelectAll = () => {
    if (selectedDonors.size === filteredDonors.length) {
      setSelectedDonors(new Set());
    } else {
      setSelectedDonors(new Set(filteredDonors.map(d => d.id)));
    }
  };

  const toggleDonor = (donorId: string) => {
    const newSelected = new Set(selectedDonors);
    if (newSelected.has(donorId)) {
      newSelected.delete(donorId);
    } else {
      newSelected.add(donorId);
    }
    setSelectedDonors(newSelected);
  };

  const replaceMergeTags = (text: string, donor: Donor): string => {
    const appUrl = window.location.origin;
    return text
      .replace(/{{donor_name}}/g, donor.name)
      .replace(/{{first_name}}/g, donor.name.split(' ')[0])
      .replace(/{{email}}/g, donor.email)
      .replace(/{{total_donated}}/g, `$${(donor.total_donated || 0).toFixed(2)}`)
      .replace(/{{donation_count}}/g, String(donor.donation_count || 0))
      .replace(/{{organization_name}}/g, campaign?.organization_name || 'Our Organization')
      .replace(/{{campaign_name}}/g, campaign?.name || 'Our Campaign')
      .replace(/{{unsubscribe_link}}/g, `${appUrl}/unsubscribe/${donor.id}`)
      .replace(/{{preferences_link}}/g, `${appUrl}/preferences/${donor.id}`);
  };

  const handlePreview = () => {
    const selectedDonorList = donors.filter(d => selectedDonors.has(d.id));
    if (selectedDonorList.length > 0) {
      setPreviewDonor(selectedDonorList[0]);
      setShowPreview(true);
    } else if (filteredDonors.length > 0) {
      setPreviewDonor(filteredDonors[0]);
      setShowPreview(true);
    }
  };

  const handleSend = async () => {
    if (selectedDonors.size === 0) {
      toast.error('Please select at least one donor');
      return;
    }

    if (!subject || !content) {
      toast.error('Please fill in subject and content');
      return;
    }

    setSending(true);
    const selectedDonorList = donors.filter(d => selectedDonors.has(d.id));
    let successCount = 0;
    let errorCount = 0;

    for (const donor of selectedDonorList) {
      try {
        const personalizedSubject = replaceMergeTags(subject, donor);
        const personalizedContent = replaceMergeTags(content, donor);

        const { error } = await supabase.functions.invoke('send-email', {
          body: {
            type: 'bulk_campaign',
            to: donor.email,
            donorId: donor.id,
            data: {
              subject: personalizedSubject,
              content: personalizedContent,
              donorName: donor.name,
            },
          },
        });

        if (error) throw error;

        // Log communication
        await supabase.from('donor_communications').insert({
          campaign_id: campaignId,
          donor_id: donor.id,
          communication_type: 'bulk_email',
          subject: personalizedSubject,
          content: personalizedContent,
          sent_at: new Date().toISOString(),
        });

        successCount++;
      } catch (error) {
        console.error(`Error sending to ${donor.email}:`, error);
        errorCount++;
      }
    }

    setSending(false);

    if (errorCount === 0) {
      toast.success(`Successfully sent ${successCount} emails`);
    } else {
      toast.warning(`Sent ${successCount} emails, ${errorCount} failed`);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const donorsWithConsent = donors.filter(d => d.marketing_consent).length;
  const donorsWithoutConsent = donors.length - donorsWithConsent;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bulk Email Sender</h2>
          <p className="text-muted-foreground">Send personalized emails to multiple donors</p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>Close</Button>
        )}
      </div>

      {/* Consent Notice */}
      <Card className="border-amber-500/50 bg-amber-500/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium text-amber-700 dark:text-amber-400">Marketing Consent Required</p>
              <p className="text-sm text-muted-foreground mt-1">
                Only donors who have opted in to marketing communications will receive emails.
                {donorsWithoutConsent > 0 && (
                  <span className="block mt-1">
                    {donorsWithConsent} donors have opted in, {donorsWithoutConsent} have not.
                  </span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Compose Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Compose Email
            </CardTitle>
            <CardDescription>
              Create your email with personalized merge tags
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Use Template</Label>
              <Select onValueChange={handleTemplateSelect}>
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
              <Label>Subject *</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Thank you for your support, {{first_name}}!"
              />
            </div>

            <div>
              <Label>Content *</Label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your email content with merge tags..."
                rows={10}
              />
            </div>

            {/* Merge Tags */}
            <div>
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Insert Merge Tag
              </Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {MERGE_TAGS.map(({ tag, description }) => (
                  <Button
                    key={tag}
                    variant="outline"
                    size="sm"
                    onClick={() => insertMergeTag(tag)}
                    title={description}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePreview} disabled={!subject || !content}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                onClick={handleSend}
                disabled={sending || selectedDonors.size === 0}
                className="flex-1"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending ? 'Sending...' : `Send to ${selectedDonors.size} Donor${selectedDonors.size !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Select Recipients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Recipients
            </CardTitle>
            <CardDescription>
              Choose donors to receive this email (only marketing opt-ins shown)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Filter by Segment</Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Opted-In Donors</SelectItem>
                  <SelectItem value="first_time">First-Time Donors</SelectItem>
                  <SelectItem value="recurring">Recurring Donors</SelectItem>
                  <SelectItem value="major">Major Donors</SelectItem>
                  <SelectItem value="lapsed">Lapsed Donors</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="selectAll"
                  checked={selectedDonors.size === filteredDonors.length && filteredDonors.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
                <Label htmlFor="selectAll">Select All ({filteredDonors.length})</Label>
              </div>
              <Badge variant="outline">
                {selectedDonors.size} selected
              </Badge>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-2">
              {filteredDonors.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No donors with marketing consent in this segment
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredDonors.map(donor => (
                    <div
                      key={donor.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selectedDonors.has(donor.id)}
                        onCheckedChange={() => toggleDonor(donor.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{donor.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{donor.email}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {donor.segment || 'first_time'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreview && previewDonor && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Email Preview</CardTitle>
            <CardDescription>
              Preview for: {previewDonor.name} ({previewDonor.email})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Subject</Label>
                <p className="font-medium">{replaceMergeTags(subject, previewDonor)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Content</Label>
                <div
                  className="mt-2 p-4 bg-muted rounded-lg prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(replaceMergeTags(content, previewDonor).replace(/\n/g, '<br>'))
                  }}
                />
              </div>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Close Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
