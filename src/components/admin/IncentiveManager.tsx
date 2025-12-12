import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Loader2, Gift, Trophy, Users, Target, Plus, Trash2, Edit2, Save, X 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Incentive {
  id: string;
  name: string;
  description: string | null;
  incentive_type: 'individual' | 'competition' | 'group';
  threshold_amount: number | null;
  threshold_items: number | null;
  reward: string;
  is_active: boolean;
}

interface Campaign {
  id: string;
  name: string;
}

interface IncentiveManagerProps {
  campaignId?: string;
}

export function IncentiveManager({ campaignId }: IncentiveManagerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(campaignId || '');
  const [incentives, setIncentives] = useState<Incentive[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [incentiveType, setIncentiveType] = useState<'individual' | 'competition' | 'group'>('individual');
  const [thresholdAmount, setThresholdAmount] = useState('');
  const [thresholdItems, setThresholdItems] = useState('');
  const [reward, setReward] = useState('');

  useEffect(() => {
    fetchData();
  }, [campaignId, user]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchIncentives(selectedCampaign);
    }
  }, [selectedCampaign]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('id, name')
        .eq('organization_admin_id', user.id)
        .order('created_at', { ascending: false });

      setCampaigns(campaignsData || []);

      if (campaignId) {
        setSelectedCampaign(campaignId);
      } else if (campaignsData && campaignsData.length > 0 && !selectedCampaign) {
        setSelectedCampaign(campaignsData[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIncentives = async (campId: string) => {
    const { data } = await supabase
      .from('incentives')
      .select('*')
      .eq('campaign_id', campId)
      .order('created_at', { ascending: true });

    setIncentives((data as Incentive[]) || []);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setIncentiveType('individual');
    setThresholdAmount('');
    setThresholdItems('');
    setReward('');
    setEditingId(null);
  };

  const handleEdit = (incentive: Incentive) => {
    setName(incentive.name);
    setDescription(incentive.description || '');
    setIncentiveType(incentive.incentive_type);
    setThresholdAmount(incentive.threshold_amount?.toString() || '');
    setThresholdItems(incentive.threshold_items?.toString() || '');
    setReward(incentive.reward);
    setEditingId(incentive.id);
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !reward.trim()) {
      toast.error('Please fill in name and reward');
      return;
    }

    if (!selectedCampaign) {
      toast.error('Please select a campaign');
      return;
    }

    setSaving(true);

    try {
      const data = {
        campaign_id: selectedCampaign,
        name: name.trim(),
        description: description.trim() || null,
        incentive_type: incentiveType,
        threshold_amount: thresholdAmount ? parseFloat(thresholdAmount) : null,
        threshold_items: thresholdItems ? parseInt(thresholdItems) : null,
        reward: reward.trim(),
        is_active: true
      };

      if (editingId) {
        const { error } = await supabase
          .from('incentives')
          .update(data)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Incentive updated!');
      } else {
        const { error } = await supabase
          .from('incentives')
          .insert(data);

        if (error) throw error;
        toast.success('Incentive created!');
      }

      resetForm();
      setDialogOpen(false);
      fetchIncentives(selectedCampaign);
    } catch (err) {
      console.error('Error saving incentive:', err);
      toast.error('Failed to save incentive');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('incentives')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      
      setIncentives(prev => 
        prev.map(i => i.id === id ? { ...i, is_active: !currentState } : i)
      );
    } catch (err) {
      console.error('Error toggling incentive:', err);
      toast.error('Failed to update incentive');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('incentives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Incentive deleted');
      setIncentives(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('Error deleting incentive:', err);
      toast.error('Failed to delete incentive');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return <Target className="h-4 w-4" />;
      case 'competition': return <Trophy className="h-4 w-4" />;
      case 'group': return <Users className="h-4 w-4" />;
      default: return <Gift className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'individual': return <Badge variant="secondary">Individual</Badge>;
      case 'competition': return <Badge className="bg-yellow-500">Competition</Badge>;
      case 'group': return <Badge className="bg-blue-500">Group Goal</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Selector */}
      {!campaignId && campaigns.length > 1 && (
        <div className="space-y-2">
          <Label>Select Campaign</Label>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full p-2 border rounded-md bg-background"
          >
            {campaigns.map(camp => (
              <option key={camp.id} value={camp.id}>{camp.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Incentives & Challenges</h2>
          <p className="text-sm text-muted-foreground">
            Create fun challenges to motivate participants
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Incentive
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Incentive' : 'Create Incentive'}</DialogTitle>
              <DialogDescription>
                Set up a challenge or reward for your participants
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Incentive Type</Label>
                <Select value={incentiveType} onValueChange={(v: any) => setIncentiveType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Individual Goal (Sell $X, get reward)
                      </div>
                    </SelectItem>
                    <SelectItem value="competition">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4" />
                        Competition (Top seller wins)
                      </div>
                    </SelectItem>
                    <SelectItem value="group">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Group Goal (Everyone benefits)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Pizza Party Challenge"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the challenge..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              {incentiveType !== 'competition' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="thresholdAmount">Goal Amount ($)</Label>
                    <Input
                      id="thresholdAmount"
                      type="number"
                      placeholder="e.g., 50"
                      value={thresholdAmount}
                      onChange={(e) => setThresholdAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thresholdItems">Or # of Items</Label>
                    <Input
                      id="thresholdItems"
                      type="number"
                      placeholder="e.g., 10"
                      value={thresholdItems}
                      onChange={(e) => setThresholdItems(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reward">Reward</Label>
                <Input
                  id="reward"
                  placeholder="e.g., Gift card, Pizza party, Extra recess"
                  value={reward}
                  onChange={(e) => setReward(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Incentives List */}
      {incentives.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <h3 className="font-medium mb-2">No Incentives Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create challenges to motivate your participants!
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Incentive
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {incentives.map((incentive) => (
            <Card key={incentive.id} className={!incentive.is_active ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {getTypeIcon(incentive.incentive_type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium">{incentive.name}</h3>
                        {getTypeBadge(incentive.incentive_type)}
                      </div>
                      {incentive.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {incentive.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {incentive.threshold_amount && (
                          <span className="text-muted-foreground">
                            Goal: ${incentive.threshold_amount}
                          </span>
                        )}
                        {incentive.threshold_items && (
                          <span className="text-muted-foreground">
                            Goal: {incentive.threshold_items} items
                          </span>
                        )}
                        <span className="font-medium text-primary">
                          🎁 {incentive.reward}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={incentive.is_active}
                      onCheckedChange={() => toggleActive(incentive.id, incentive.is_active)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(incentive)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(incentive.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
