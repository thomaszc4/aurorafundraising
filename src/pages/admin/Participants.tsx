import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { StudentTaskManager } from '@/components/admin/StudentTaskManager';
import {
  Edit, ExternalLink, Plus, Trash2, Send, UserCheck, Clock,
  CheckCircle2, Mail, RefreshCw, Users, UserPlus
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
}

interface StudentInvitation {
  id: string;
  student_name: string;
  student_email: string;
  campaign_id: string;
  invitation_sent: boolean;
  invitation_sent_at: string | null;
  account_created: boolean;
  user_id: string | null;
  created_at: string;
  campaigns: {
    name: string;
  } | null;
}

interface StudentFundraiser {
  id: string;
  page_slug: string;
  personal_goal: number | null;
  total_raised: number | null;
  custom_message: string | null;
  is_active: boolean;
  campaign_id: string;
  student_id: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
  campaigns: {
    name: string;
  } | null;
}

export default function AdminParticipants() {
  const [invitations, setInvitations] = useState<StudentInvitation[]>([]);
  const [fundraisers, setFundraisers] = useState<StudentFundraiser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFundraiser, setEditingFundraiser] = useState<StudentFundraiser | null>(null);
  const [selectedFundraiserId, setSelectedFundraiserId] = useState<string | null>(null);
  const [sendingInvitation, setSendingInvitation] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    student_email: '',
    campaign_id: '',
    page_slug: '',
    personal_goal: '',
    custom_message: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [invitationsRes, fundraisersRes, campaignsRes] = await Promise.all([
        supabase
          .from('student_invitations')
          .select('*, campaigns(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('student_fundraisers')
          .select('*, profiles(full_name, email), campaigns(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('campaigns')
          .select('id, name')
          .in('status', ['active', 'draft']),
      ]);

      if (invitationsRes.error) throw invitationsRes.error;
      if (fundraisersRes.error) throw fundraisersRes.error;
      if (campaignsRes.error) throw campaignsRes.error;

      setInvitations((invitationsRes.data as StudentInvitation[]) || []);
      setFundraisers((fundraisersRes.data as StudentFundraiser[]) || []);
      setCampaigns(campaignsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvitation = async (invitation: StudentInvitation) => {
    setSendingInvitation(invitation.id);
    try {
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: invitation.student_email,
          subject: `You're invited to join ${invitation.campaigns?.name || 'a fundraiser'}!`,
          html: `
            <h1>Welcome to the Fundraiser!</h1>
            <p>Hi ${invitation.student_name},</p>
            <p>You've been invited to participate in <strong>${invitation.campaigns?.name || 'our fundraiser'}</strong>.</p>
            <p>Click the link below to create your account and start fundraising:</p>
            <p><a href="${window.location.origin}/auth?email=${encodeURIComponent(invitation.student_email)}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Create Account</a></p>
            <p>Best of luck!</p>
          `
        }
      });

      if (error) throw error;

      await supabase
        .from('student_invitations')
        .update({
          invitation_sent: true,
          invitation_sent_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

      toast.success(`Invitation sent to ${invitation.student_email}`);
      fetchData();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    } finally {
      setSendingInvitation(null);
    }
  };

  const handleBulkSendInvitations = async () => {
    const pendingInvitations = invitations.filter(i => !i.invitation_sent && !i.account_created);
    if (pendingInvitations.length === 0) {
      toast.info('No pending invitations to send');
      return;
    }

    toast.info(`Sending ${pendingInvitations.length} invitations...`);
    for (const invitation of pendingInvitations) {
      await handleSendInvitation(invitation);
    }
    toast.success('All invitations sent!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingFundraiser) {
        const { error } = await supabase
          .from('student_fundraisers')
          .update({
            page_slug: formData.page_slug,
            personal_goal: formData.personal_goal ? parseFloat(formData.personal_goal) : null,
            custom_message: formData.custom_message || null,
            is_active: formData.is_active,
            campaign_id: formData.campaign_id,
          })
          .eq('id', editingFundraiser.id);

        if (error) {
          // Handle unique violation for page_slug
          if (error.code === '23505' && error.message?.includes('page_slug')) {
            throw new Error('This Page URL is already taken. Please choose another one.');
          }
          throw error;
        }
        toast.success('Student fundraiser updated successfully');
      } else {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.student_email)
          .single();

        if (profileError || !profile) {
          toast.error('User not found with that email. Make sure they have an account first.');
          return;
        }

        // 1. Create the fundraiser
        const { error: fundraiserError } = await supabase
          .from('student_fundraisers')
          .insert({
            student_id: profile.id,
            campaign_id: formData.campaign_id,
            page_slug: formData.page_slug,
            personal_goal: formData.personal_goal ? parseFloat(formData.personal_goal) : null,
            custom_message: formData.custom_message || null,
            is_active: formData.is_active,
          });

        if (fundraiserError) {
          if (fundraiserError.code === '23505' && fundraiserError.message?.includes('page_slug')) {
            throw new Error('This Page URL is already taken. Please choose another one.');
          }
          throw fundraiserError;
        }

        // 2. Assign role (Non-blocking)
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert({
            user_id: profile.id,
            role: 'student',
          }, { onConflict: 'user_id,role' });

        if (roleError) {
          console.error('Error assigning student role:', roleError);
          // Don't throw, just warn
          toast.warning('Fundraiser created, but failed to assign "student" role. You may need to assign it manually.');
        } else {
          toast.success('Student fundraiser created successfully');
        }
      }

      setIsDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error('Error saving fundraiser:', error);
      toast.error(error.message || 'Failed to save fundraiser');
    }
  };

  const handleEdit = (fundraiser: StudentFundraiser) => {
    setEditingFundraiser(fundraiser);
    setFormData({
      student_email: fundraiser.profiles?.email || '',
      campaign_id: fundraiser.campaign_id,
      page_slug: fundraiser.page_slug,
      personal_goal: fundraiser.personal_goal?.toString() || '',
      custom_message: fundraiser.custom_message || '',
      is_active: fundraiser.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student fundraiser?')) return;

    try {
      const { error } = await supabase
        .from('student_fundraisers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Student fundraiser deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting fundraiser:', error);
      toast.error('Failed to delete fundraiser');
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invitation?')) return;

    try {
      const { error } = await supabase
        .from('student_invitations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Invitation deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting invitation:', error);
      toast.error('Failed to delete invitation');
    }
  };

  const resetForm = () => {
    setEditingFundraiser(null);
    setFormData({
      student_email: '',
      campaign_id: '',
      page_slug: '',
      personal_goal: '',
      custom_message: '',
      is_active: true,
    });
  };

  const getInvitationStatus = (invitation: StudentInvitation) => {
    if (invitation.account_created) {
      return { label: 'Active', color: 'bg-green-500/20 text-green-600', icon: CheckCircle2 };
    }
    if (invitation.invitation_sent) {
      return { label: 'Invited', color: 'bg-amber-500/20 text-amber-600', icon: Mail };
    }
    return { label: 'Pending', color: 'bg-muted text-muted-foreground', icon: Clock };
  };

  const pendingCount = invitations.filter(i => !i.invitation_sent && !i.account_created).length;
  const invitedCount = invitations.filter(i => i.invitation_sent && !i.account_created).length;
  const activeCount = invitations.filter(i => i.account_created).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded-xl"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Participants</h1>
            <p className="text-muted-foreground">Manage student invitations and active fundraisers</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingFundraiser ? 'Edit Fundraiser' : 'Add Student Fundraiser'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingFundraiser && (
                  <div className="space-y-2">
                    <Label htmlFor="student_email">Student Email *</Label>
                    <Input
                      id="student_email"
                      type="email"
                      value={formData.student_email}
                      onChange={(e) => setFormData({ ...formData, student_email: e.target.value })}
                      placeholder="student@email.com"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Student must have an existing account
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="campaign_id">Campaign *</Label>
                  <Select
                    value={formData.campaign_id}
                    onValueChange={(value) => setFormData({ ...formData, campaign_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map((campaign) => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page_slug">Page URL Slug *</Label>
                  <Input
                    id="page_slug"
                    value={formData.page_slug}
                    onChange={(e) => setFormData({ ...formData, page_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    placeholder="john-smith"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    URL: /student/{formData.page_slug || 'slug'}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="personal_goal">Personal Goal ($)</Label>
                  <Input
                    id="personal_goal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.personal_goal}
                    onChange={(e) => setFormData({ ...formData, personal_goal: e.target.value })}
                    placeholder="500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom_message">Custom Message</Label>
                  <Input
                    id="custom_message"
                    value={formData.custom_message}
                    onChange={(e) => setFormData({ ...formData, custom_message: e.target.value })}
                    placeholder="Help me reach my goal!"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingFundraiser ? 'Update Fundraiser' : 'Create Fundraiser'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{invitations.length}</p>
                  <p className="text-sm text-muted-foreground">Total Invited</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Mail className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{invitedCount}</p>
                  <p className="text-sm text-muted-foreground">Awaiting Signup</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCount}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="invitations" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="invitations" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Invitations
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="ml-1">{pendingCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="active" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Active Fundraisers
                <Badge variant="secondary" className="ml-1">{fundraisers.length}</Badge>
              </TabsTrigger>
            </TabsList>
            {pendingCount > 0 && (
              <Button variant="outline" onClick={handleBulkSendInvitations}>
                <Send className="h-4 w-4 mr-2" />
                Send All Pending ({pendingCount})
              </Button>
            )}
          </div>

          <TabsContent value="invitations">
            <Card>
              <CardHeader>
                <CardTitle>Student Invitations</CardTitle>
                <CardDescription>
                  Students added during campaign creation. Send invitations to get them started.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Invited</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No students invited yet. Add students through the campaign wizard.
                        </TableCell>
                      </TableRow>
                    ) : (
                      invitations.map((invitation) => {
                        const status = getInvitationStatus(invitation);
                        const StatusIcon = status.icon;
                        return (
                          <TableRow key={invitation.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{invitation.student_name}</p>
                                <p className="text-sm text-muted-foreground">{invitation.student_email}</p>
                              </div>
                            </TableCell>
                            <TableCell>{invitation.campaigns?.name || 'N/A'}</TableCell>
                            <TableCell>
                              <Badge variant="secondary" className={status.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {invitation.invitation_sent_at
                                ? format(new Date(invitation.invitation_sent_at), 'MMM d, yyyy')
                                : '-'
                              }
                            </TableCell>
                            <TableCell className="text-right">
                              {!invitation.account_created && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSendInvitation(invitation)}
                                  disabled={sendingInvitation === invitation.id}
                                >
                                  {sendingInvitation === invitation.id ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : invitation.invitation_sent ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-1" />
                                      Resend
                                    </>
                                  ) : (
                                    <>
                                      <Send className="h-4 w-4 mr-1" />
                                      Send
                                    </>
                                  )}
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteInvitation(invitation.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="active">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Fundraisers</CardTitle>
                    <CardDescription>
                      Students who have created their accounts and are actively fundraising.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Campaign</TableHead>
                          <TableHead>Raised</TableHead>
                          <TableHead>Goal</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fundraisers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                              No active fundraisers yet. Students will appear here after signing up.
                            </TableCell>
                          </TableRow>
                        ) : (
                          fundraisers.map((fundraiser) => (
                            <TableRow
                              key={fundraiser.id}
                              className={selectedFundraiserId === fundraiser.id ? 'bg-muted/50' : ''}
                              onClick={() => setSelectedFundraiserId(fundraiser.id)}
                              style={{ cursor: 'pointer' }}
                            >
                              <TableCell>
                                <div>
                                  <p className="font-medium">{fundraiser.profiles?.full_name || 'N/A'}</p>
                                  <p className="text-sm text-muted-foreground">{fundraiser.profiles?.email}</p>
                                </div>
                              </TableCell>
                              <TableCell>{fundraiser.campaigns?.name || 'N/A'}</TableCell>
                              <TableCell className="font-medium text-green-600">
                                ${Number(fundraiser.total_raised || 0).toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {fundraiser.personal_goal
                                  ? `$${Number(fundraiser.personal_goal).toFixed(0)}`
                                  : '-'
                                }
                              </TableCell>
                              <TableCell>
                                <Badge variant={fundraiser.is_active ? "default" : "secondary"}>
                                  {fundraiser.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <a
                                  href={`/student/${fundraiser.page_slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Button variant="ghost" size="icon">
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </a>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); handleEdit(fundraiser); }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); handleDelete(fundraiser.id); }}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              <div>
                <StudentTaskManager
                  studentFundraiserId={selectedFundraiserId}
                  studentName={fundraisers.find(f => f.id === selectedFundraiserId)?.profiles?.full_name || undefined}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
