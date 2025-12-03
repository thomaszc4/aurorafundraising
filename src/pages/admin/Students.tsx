import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Edit, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  name: string;
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

export default function AdminStudents() {
  const [fundraisers, setFundraisers] = useState<StudentFundraiser[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFundraiser, setEditingFundraiser] = useState<StudentFundraiser | null>(null);
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
      const [fundraisersRes, campaignsRes] = await Promise.all([
        supabase
          .from('student_fundraisers')
          .select('*, profiles(full_name, email), campaigns(name)')
          .order('created_at', { ascending: false }),
        supabase
          .from('campaigns')
          .select('id, name')
          .eq('status', 'active'),
      ]);

      if (fundraisersRes.error) throw fundraisersRes.error;
      if (campaignsRes.error) throw campaignsRes.error;

      setFundraisers((fundraisersRes.data as StudentFundraiser[]) || []);
      setCampaigns(campaignsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingFundraiser) {
        // Update existing fundraiser
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
        
        if (error) throw error;
        toast.success('Student fundraiser updated successfully');
      } else {
        // Find user by email
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', formData.student_email)
          .single();
        
        if (profileError || !profile) {
          toast.error('User not found with that email. Make sure they have an account first.');
          return;
        }

        // Create new fundraiser
        const { error } = await supabase
          .from('student_fundraisers')
          .insert({
            student_id: profile.id,
            campaign_id: formData.campaign_id,
            page_slug: formData.page_slug,
            personal_goal: formData.personal_goal ? parseFloat(formData.personal_goal) : null,
            custom_message: formData.custom_message || null,
            is_active: formData.is_active,
          });
        
        if (error) throw error;

        // Add student role
        await supabase
          .from('user_roles')
          .upsert({
            user_id: profile.id,
            role: 'student',
          }, { onConflict: 'user_id,role' });

        toast.success('Student fundraiser created successfully');
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

  if (loading) {
    return (
      <Layout>
        <div className="container-wide py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded-xl"></div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-wide py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Student Fundraisers</h1>
            <p className="text-muted-foreground">Manage student fundraising pages</p>
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

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Page</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fundraisers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No student fundraisers yet. Add your first student to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  fundraisers.map((fundraiser) => (
                    <TableRow key={fundraiser.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{fundraiser.profiles?.full_name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">{fundraiser.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{fundraiser.campaigns?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <a 
                          href={`/student/${fundraiser.page_slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary-blue hover:underline"
                        >
                          {fundraiser.page_slug}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${Number(fundraiser.total_raised || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {fundraiser.personal_goal 
                          ? `$${Number(fundraiser.personal_goal).toFixed(2)}`
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          fundraiser.is_active 
                            ? 'bg-accent-teal/20 text-accent-teal' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {fundraiser.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(fundraiser)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(fundraiser.id)}>
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
    </Layout>
  );
}
