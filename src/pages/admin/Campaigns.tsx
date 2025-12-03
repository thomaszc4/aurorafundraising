import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Edit, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { CreateCampaignWizard } from '@/components/admin/CreateCampaignWizard';
import { useNavigate } from 'react-router-dom';

interface Campaign {
  id: string;
  name: string;
  organization_name: string;
  description: string | null;
  goal_amount: number | null;
  start_date: string | null;
  end_date: string | null;
  fundraiser_type: string;
  student_count?: number;
}

export default function AdminCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch student counts
      const { data: students } = await supabase
        .from('student_invitations')
        .select('campaign_id');

      const campaignsWithCounts = (data || []).map(campaign => ({
        ...campaign,
        student_count: students?.filter(s => s.campaign_id === campaign.id).length || 0,
      }));

      setCampaigns(campaignsWithCounts);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (campaign: Campaign) => {
    setEditingCampaign(campaign);
    setIsWizardOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign? This will also delete all associated students.')) return;
    
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Campaign deleted successfully');
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
    }
  };

  const getCampaignStatus = (campaign: Campaign) => {
    if (!campaign.start_date || !campaign.end_date) return 'draft';
    const now = new Date();
    const start = new Date(campaign.start_date);
    const end = new Date(campaign.end_date);
    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'active';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-accent-teal/20 text-accent-teal';
      case 'completed':
        return 'bg-primary-blue/20 text-primary-blue';
      case 'upcoming':
        return 'bg-amber-500/20 text-amber-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getFundraiserTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      product: 'bg-primary/20 text-primary',
      walkathon: 'bg-accent-teal/20 text-accent-teal',
      readathon: 'bg-amber-500/20 text-amber-600',
      jogathon: 'bg-green-500/20 text-green-600',
      other_athon: 'bg-purple-500/20 text-purple-600',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
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
            <h1 className="text-4xl font-bold text-foreground mb-2">Fundraisers</h1>
            <p className="text-muted-foreground">Create and manage fundraising campaigns</p>
          </div>
          <Button onClick={() => {
            setEditingCampaign(null);
            setIsWizardOpen(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            New Fundraiser
          </Button>
        </div>

        <Dialog open={isWizardOpen} onOpenChange={(open) => {
          setIsWizardOpen(open);
          if (!open) setEditingCampaign(null);
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <CreateCampaignWizard
              editingCampaign={editingCampaign}
              onComplete={() => {
                setIsWizardOpen(false);
                setEditingCampaign(null);
                fetchCampaigns();
              }}
              onCancel={() => {
                setIsWizardOpen(false);
                setEditingCampaign(null);
              }}
            />
          </DialogContent>
        </Dialog>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Goal</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No fundraisers yet. Create your first fundraiser to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((campaign) => {
                    const status = getCampaignStatus(campaign);
                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="font-medium">{campaign.name}</TableCell>
                        <TableCell>{campaign.organization_name}</TableCell>
                        <TableCell>
                          <Badge className={getFundraiserTypeBadge(campaign.fundraiser_type)}>
                            {campaign.fundraiser_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {campaign.student_count}
                          </div>
                        </TableCell>
                        <TableCell>
                          {campaign.goal_amount ? `$${Number(campaign.goal_amount).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          {campaign.start_date 
                            ? `${new Date(campaign.start_date).toLocaleDateString()} - ${campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'Ongoing'}`
                            : 'Not set'
                          }
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(campaign)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(campaign.id)}>
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
      </div>
    </Layout>
  );
}
