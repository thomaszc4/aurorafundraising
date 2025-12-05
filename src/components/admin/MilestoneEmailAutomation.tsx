import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, Mail, Target, Gift, Star, PartyPopper, 
  Plus, Edit2, Trash2, Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MilestoneRule {
  id: string;
  name: string;
  description: string;
  trigger_type: 'amount' | 'orders' | 'percentage' | 'rank';
  trigger_value: number;
  email_subject: string;
  email_template: string;
  is_active: boolean;
  icon: string;
}

interface MilestoneEmailAutomationProps {
  campaignId: string;
  goalAmount?: number;
}

const DEFAULT_MILESTONES: Omit<MilestoneRule, 'id'>[] = [
  {
    name: 'First Sale',
    description: 'Celebrate when a student makes their first sale',
    trigger_type: 'orders',
    trigger_value: 1,
    email_subject: '🎉 Congratulations on your first sale!',
    email_template: 'You did it! Your first sale is in the books. Keep up the great work!',
    is_active: true,
    icon: 'star'
  },
  {
    name: '$50 Milestone',
    description: 'Reached $50 in total sales',
    trigger_type: 'amount',
    trigger_value: 50,
    email_subject: '🏆 You hit $50!',
    email_template: 'Amazing! You\'ve raised $50 for your fundraiser. You\'re making a real difference!',
    is_active: true,
    icon: 'trophy'
  },
  {
    name: '$100 Milestone',
    description: 'Reached $100 in total sales',
    trigger_type: 'amount',
    trigger_value: 100,
    email_subject: '💯 $100 Club!',
    email_template: 'Incredible achievement! You\'ve reached the $100 milestone. Your dedication is paying off!',
    is_active: true,
    icon: 'gift'
  },
  {
    name: '50% of Goal',
    description: 'Reached halfway to personal goal',
    trigger_type: 'percentage',
    trigger_value: 50,
    email_subject: '🎯 Halfway there!',
    email_template: 'You\'re 50% of the way to your goal! Keep pushing - you can do this!',
    is_active: true,
    icon: 'target'
  },
  {
    name: 'Goal Reached',
    description: 'Student reached their personal goal',
    trigger_type: 'percentage',
    trigger_value: 100,
    email_subject: '🎊 GOAL REACHED!',
    email_template: 'YOU DID IT! You\'ve reached your fundraising goal! This is an incredible accomplishment!',
    is_active: true,
    icon: 'party'
  },
  {
    name: 'Top 3 Fundraiser',
    description: 'Student is in the top 3 fundraisers',
    trigger_type: 'rank',
    trigger_value: 3,
    email_subject: '⭐ You\'re a Top Fundraiser!',
    email_template: 'You\'re currently one of the top fundraisers! Keep up the amazing work!',
    is_active: false,
    icon: 'star'
  },
];

const ICONS: Record<string, React.ReactNode> = {
  star: <Star className="h-5 w-5" />,
  trophy: <Trophy className="h-5 w-5" />,
  gift: <Gift className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
  party: <PartyPopper className="h-5 w-5" />,
};

export function MilestoneEmailAutomation({ campaignId, goalAmount }: MilestoneEmailAutomationProps) {
  const [milestones, setMilestones] = useState<MilestoneRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneRule | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state for editing
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger_type: 'amount' as MilestoneRule['trigger_type'],
    trigger_value: 0,
    email_subject: '',
    email_template: '',
    icon: 'star'
  });

  useEffect(() => {
    // Load milestones from localStorage or use defaults
    const stored = localStorage.getItem(`milestones_${campaignId}`);
    if (stored) {
      setMilestones(JSON.parse(stored));
    } else {
      const defaultWithIds = DEFAULT_MILESTONES.map((m, idx) => ({
        ...m,
        id: `milestone-${idx}`
      }));
      setMilestones(defaultWithIds);
    }
    setLoading(false);
  }, [campaignId]);

  const saveMilestones = (updated: MilestoneRule[]) => {
    setMilestones(updated);
    localStorage.setItem(`milestones_${campaignId}`, JSON.stringify(updated));
  };

  const toggleMilestone = (id: string) => {
    const updated = milestones.map(m => 
      m.id === id ? { ...m, is_active: !m.is_active } : m
    );
    saveMilestones(updated);
    const milestone = milestones.find(m => m.id === id);
    toast.success(`${milestone?.name} ${milestone?.is_active ? 'disabled' : 'enabled'}`);
  };

  const handleEdit = (milestone: MilestoneRule) => {
    setEditingMilestone(milestone);
    setFormData({
      name: milestone.name,
      description: milestone.description,
      trigger_type: milestone.trigger_type,
      trigger_value: milestone.trigger_value,
      email_subject: milestone.email_subject,
      email_template: milestone.email_template,
      icon: milestone.icon
    });
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter a milestone name');
      return;
    }

    if (editingMilestone) {
      const updated = milestones.map(m => 
        m.id === editingMilestone.id ? { ...m, ...formData } : m
      );
      saveMilestones(updated);
      toast.success('Milestone updated');
    } else {
      const newMilestone: MilestoneRule = {
        id: `milestone-${Date.now()}`,
        ...formData,
        is_active: true
      };
      saveMilestones([...milestones, newMilestone]);
      toast.success('Milestone created');
    }

    setIsDialogOpen(false);
    setEditingMilestone(null);
    setFormData({
      name: '',
      description: '',
      trigger_type: 'amount',
      trigger_value: 0,
      email_subject: '',
      email_template: '',
      icon: 'star'
    });
  };

  const handleDelete = (id: string) => {
    const updated = milestones.filter(m => m.id !== id);
    saveMilestones(updated);
    toast.success('Milestone deleted');
  };

  const getTriggerLabel = (type: string, value: number) => {
    switch (type) {
      case 'amount': return `$${value} raised`;
      case 'orders': return `${value} order${value !== 1 ? 's' : ''}`;
      case 'percentage': return `${value}% of goal`;
      case 'rank': return `Top ${value}`;
      default: return '';
    }
  };

  const checkAndSendMilestoneEmails = async () => {
    try {
      // Get all student fundraisers with their totals
      const { data: students } = await supabase
        .from('student_fundraisers')
        .select(`
          id,
          student_id,
          total_raised,
          personal_goal,
          profiles:student_id (
            email,
            full_name
          )
        `)
        .eq('campaign_id', campaignId)
        .eq('is_active', true);

      if (!students || students.length === 0) {
        toast.error('No active students found');
        return;
      }

      // Get order counts per student
      const studentIds = students.map(s => s.id);
      const { data: orders } = await supabase
        .from('orders')
        .select('student_fundraiser_id')
        .in('student_fundraiser_id', studentIds)
        .eq('status', 'completed');

      const orderCounts: Record<string, number> = {};
      orders?.forEach(o => {
        orderCounts[o.student_fundraiser_id] = (orderCounts[o.student_fundraiser_id] || 0) + 1;
      });

      let emailsSent = 0;
      const activeMilestones = milestones.filter(m => m.is_active);

      for (const student of students) {
        const profile = student.profiles as any;
        if (!profile?.email) continue;

        const totalRaised = Number(student.total_raised || 0);
        const personalGoal = Number(student.personal_goal || goalAmount || 100);
        const orderCount = orderCounts[student.id] || 0;
        const percentage = personalGoal > 0 ? (totalRaised / personalGoal) * 100 : 0;

        for (const milestone of activeMilestones) {
          let triggered = false;

          switch (milestone.trigger_type) {
            case 'amount':
              triggered = totalRaised >= milestone.trigger_value;
              break;
            case 'orders':
              triggered = orderCount >= milestone.trigger_value;
              break;
            case 'percentage':
              triggered = percentage >= milestone.trigger_value;
              break;
          }

          if (triggered) {
            // In production, you'd check if email was already sent and use the edge function
            console.log(`Would send "${milestone.name}" email to ${profile.email}`);
            emailsSent++;
          }
        }
      }

      toast.success(`Checked ${students.length} students, ${emailsSent} milestone emails would be sent`);
    } catch (error) {
      console.error('Error checking milestones:', error);
      toast.error('Failed to check milestones');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading milestones...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Milestone Email Automation</h2>
          <p className="text-muted-foreground">Automatically celebrate student achievements</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={checkAndSendMilestoneEmails}>
            <Zap className="h-4 w-4 mr-2" />
            Check Milestones
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingMilestone(null);
                setFormData({
                  name: '',
                  description: '',
                  trigger_type: 'amount',
                  trigger_value: 0,
                  email_subject: '',
                  email_template: '',
                  icon: 'star'
                });
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Milestone
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingMilestone ? 'Edit Milestone' : 'Create Milestone'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                      placeholder="Milestone name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Icon</Label>
                    <Select 
                      value={formData.icon} 
                      onValueChange={(v) => setFormData(f => ({ ...f, icon: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ICONS).map(([key, icon]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              {icon} {key}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    placeholder="Brief description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Trigger Type</Label>
                    <Select 
                      value={formData.trigger_type} 
                      onValueChange={(v: MilestoneRule['trigger_type']) => setFormData(f => ({ ...f, trigger_type: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">Amount Raised</SelectItem>
                        <SelectItem value="orders">Order Count</SelectItem>
                        <SelectItem value="percentage">Goal Percentage</SelectItem>
                        <SelectItem value="rank">Leaderboard Rank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Trigger Value</Label>
                    <Input
                      type="number"
                      value={formData.trigger_value}
                      onChange={(e) => setFormData(f => ({ ...f, trigger_value: Number(e.target.value) }))}
                      placeholder="Value"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email Subject</Label>
                  <Input
                    value={formData.email_subject}
                    onChange={(e) => setFormData(f => ({ ...f, email_subject: e.target.value }))}
                    placeholder="Email subject line"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email Template</Label>
                  <Textarea
                    value={formData.email_template}
                    onChange={(e) => setFormData(f => ({ ...f, email_template: e.target.value }))}
                    placeholder="Email body content"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleSave}>
                    {editingMilestone ? 'Save Changes' : 'Create Milestone'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Active Count */}
      <div className="flex gap-4">
        <Badge variant="secondary" className="text-sm">
          {milestones.filter(m => m.is_active).length} active
        </Badge>
        <Badge variant="outline" className="text-sm">
          {milestones.length} total milestones
        </Badge>
      </div>

      {/* Milestones Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {milestones.map(milestone => (
          <Card 
            key={milestone.id}
            className={cn(
              "transition-all",
              milestone.is_active ? "border-primary/30" : "opacity-60"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center",
                    milestone.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    {ICONS[milestone.icon] || <Star className="h-5 w-5" />}
                  </div>
                  <div>
                    <CardTitle className="text-base">{milestone.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {getTriggerLabel(milestone.trigger_type, milestone.trigger_value)}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={milestone.is_active}
                  onCheckedChange={() => toggleMilestone(milestone.id)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{milestone.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <Mail className="h-3 w-3" />
                {milestone.email_subject}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEdit(milestone)}
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(milestone.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle>How Milestone Emails Work</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Set Triggers</h4>
              <p className="text-sm text-muted-foreground">Define conditions like amount raised, orders completed, or goal percentage</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Automatic Check</h4>
              <p className="text-sm text-muted-foreground">System monitors student progress and triggers emails when milestones are reached</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-medium mb-1">Celebrate Success</h4>
              <p className="text-sm text-muted-foreground">Students receive personalized congratulatory emails to keep them motivated</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
