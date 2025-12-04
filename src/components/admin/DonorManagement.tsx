import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Users, Search, Mail, Phone, Heart, TrendingUp, 
  Clock, CheckCircle2, Send, FileText, BarChart3, UserPlus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Donor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  segment: string;
  total_donated: number;
  donation_count: number;
  first_donation_at: string | null;
  last_donation_at: string | null;
  communication_preference: string;
  is_thanked: boolean;
  thanked_at: string | null;
  notes: string | null;
}

interface DonorTask {
  id: string;
  donor_id: string;
  task_type: string;
  due_date: string;
  is_completed: boolean;
  donor?: Donor;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  template_type: string;
  is_system: boolean;
}

interface DonorManagementProps {
  campaignId: string;
  onClose?: () => void;
}

const segmentColors: Record<string, string> = {
  first_time: 'bg-blue-100 text-blue-800',
  recurring: 'bg-green-100 text-green-800',
  lapsed: 'bg-amber-100 text-amber-800',
  major: 'bg-purple-100 text-purple-800',
  business: 'bg-indigo-100 text-indigo-800'
};

export function DonorManagement({ campaignId, onClose }: DonorManagementProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [donorTasks, setDonorTasks] = useState<DonorTask[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [selectedDonor, setSelectedDonor] = useState<Donor | null>(null);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  useEffect(() => {
    fetchData();
  }, [campaignId]);

  const fetchData = async () => {
    setLoading(true);
    const [donorsRes, tasksRes, templatesRes] = await Promise.all([
      supabase.from('donors').select('*').eq('campaign_id', campaignId).order('last_donation_at', { ascending: false }),
      supabase.from('donor_tasks').select('*').eq('campaign_id', campaignId).eq('is_completed', false).order('due_date'),
      supabase.from('email_templates').select('*').or(`campaign_id.eq.${campaignId},is_system.eq.true`)
    ]);

    if (donorsRes.data) setDonors(donorsRes.data as Donor[]);
    if (tasksRes.data) setDonorTasks(tasksRes.data as DonorTask[]);
    if (templatesRes.data) setTemplates(templatesRes.data as EmailTemplate[]);
    setLoading(false);
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template && selectedDonor) {
      let subject = template.subject;
      let body = template.body;
      
      subject = subject.replace(/\{\{donor_name\}\}/g, selectedDonor.name);
      body = body.replace(/\{\{donor_name\}\}/g, selectedDonor.name);
      body = body.replace(/\{\{amount\}\}/g, selectedDonor.total_donated.toString());
      
      setEmailSubject(subject);
      setEmailBody(body);
    }
  };

  const handleSendEmail = async () => {
    if (!selectedDonor) return;
    
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: selectedDonor.email,
          subject: emailSubject,
          html: emailBody.replace(/\n/g, '<br/>')
        }
      });

      if (error) throw error;

      await supabase.from('donor_communications').insert({
        donor_id: selectedDonor.id,
        campaign_id: campaignId,
        template_id: selectedTemplate || null,
        communication_type: 'email',
        subject: emailSubject,
        content: emailBody
      });

      if (!selectedDonor.is_thanked && selectedTemplate && templates.find(t => t.id === selectedTemplate)?.template_type.includes('thank')) {
        await supabase.from('donors').update({ is_thanked: true, thanked_at: new Date().toISOString() }).eq('id', selectedDonor.id);
      }

      toast.success('Email sent successfully');
      setShowEmailDialog(false);
      fetchData();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email');
    }
  };

  const completeTask = async (taskId: string) => {
    await supabase.from('donor_tasks').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
    toast.success('Task completed');
    fetchData();
  };

  const filteredDonors = donors.filter(donor => {
    const matchesSearch = donor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donor.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSegment = segmentFilter === 'all' || donor.segment === segmentFilter;
    return matchesSearch && matchesSegment;
  });

  const stats = {
    total: donors.length,
    firstTime: donors.filter(d => d.segment === 'first_time').length,
    recurring: donors.filter(d => d.segment === 'recurring').length,
    unthanked: donors.filter(d => !d.is_thanked).length,
    pendingTasks: donorTasks.length
  };

  if (loading) {
    return <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Loading donor data...</p></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Donor Management</h2>
          <p className="text-muted-foreground">Track, engage, and thank your supporters</p>
        </div>
        {onClose && <Button variant="outline" onClick={onClose}>Close</Button>}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-6 text-center"><Users className="h-8 w-8 mx-auto text-primary mb-2" /><div className="text-2xl font-bold">{stats.total}</div><p className="text-xs text-muted-foreground">Total Donors</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><UserPlus className="h-8 w-8 mx-auto text-blue-500 mb-2" /><div className="text-2xl font-bold">{stats.firstTime}</div><p className="text-xs text-muted-foreground">First-Time</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" /><div className="text-2xl font-bold">{stats.recurring}</div><p className="text-xs text-muted-foreground">Recurring</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Heart className="h-8 w-8 mx-auto text-red-500 mb-2" /><div className="text-2xl font-bold">{stats.unthanked}</div><p className="text-xs text-muted-foreground">Need Thanks</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><Clock className="h-8 w-8 mx-auto text-amber-500 mb-2" /><div className="text-2xl font-bold">{stats.pendingTasks}</div><p className="text-xs text-muted-foreground">Pending Tasks</p></CardContent></Card>
      </div>

      <Tabs defaultValue="donors">
        <TabsList>
          <TabsTrigger value="donors" className="gap-2"><Users className="h-4 w-4" />Donors</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2"><CheckCircle2 className="h-4 w-4" />Tasks</TabsTrigger>
          <TabsTrigger value="templates" className="gap-2"><FileText className="h-4 w-4" />Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="donors" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search donors..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Segments" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Segments</SelectItem>
                    <SelectItem value="first_time">First-Time</SelectItem>
                    <SelectItem value="recurring">Recurring</SelectItem>
                    <SelectItem value="lapsed">Lapsed</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Donations</TableHead>
                    <TableHead>Thanked</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDonors.map(donor => (
                    <TableRow key={donor.id}>
                      <TableCell>
                        <div><div className="font-medium">{donor.name}</div><div className="text-sm text-muted-foreground">{donor.email}</div></div>
                      </TableCell>
                      <TableCell><Badge className={cn('capitalize', segmentColors[donor.segment])}>{donor.segment.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="font-medium">${donor.total_donated.toFixed(2)}</TableCell>
                      <TableCell>{donor.donation_count}</TableCell>
                      <TableCell>{donor.is_thanked ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <Clock className="h-5 w-5 text-amber-500" />}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => { setSelectedDonor(donor); setShowEmailDialog(true); }}>
                          <Mail className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Pending Donor Tasks</CardTitle><CardDescription>Follow-up actions for donor engagement</CardDescription></CardHeader>
            <CardContent>
              {donorTasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending tasks</p>
              ) : (
                <div className="space-y-3">
                  {donorTasks.map(task => {
                    const donor = donors.find(d => d.id === task.donor_id);
                    return (
                      <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium capitalize">{task.task_type.replace('_', ' ')}</div>
                          <div className="text-sm text-muted-foreground">{donor?.name} • Due {new Date(task.due_date).toLocaleDateString()}</div>
                        </div>
                        <Button size="sm" onClick={() => completeTask(task.id)}>Complete</Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Email Templates</CardTitle><CardDescription>Pre-built templates for donor communication</CardDescription></CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {templates.map(template => (
                  <div key={template.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{template.name}</h4>
                      {template.is_system && <Badge variant="secondary">System</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{template.subject}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Send Email to {selectedDonor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger><SelectValue placeholder="Select a template..." /></SelectTrigger>
                <SelectContent>
                  {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={emailBody} onChange={(e) => setEmailBody(e.target.value)} rows={10} />
            </div>
            <Button onClick={handleSendEmail} className="w-full gap-2"><Send className="h-4 w-4" />Send Email</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DonorManagement;
