import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  ArrowLeft, Plus, Send, Image, BarChart3, 
  FileText, Calendar, Eye, Edit, Trash2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ImpactUpdate {
  id: string;
  title: string;
  story: string | null;
  stat_description: string | null;
  stat_value: string | null;
  image_url: string | null;
  sent_at: string | null;
  created_at: string;
}

interface ImpactUpdatesManagerProps {
  campaignId: string;
  onClose?: () => void;
}

export function ImpactUpdatesManager({ campaignId, onClose }: ImpactUpdatesManagerProps) {
  const { user } = useAuth();
  const [updates, setUpdates] = useState<ImpactUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<ImpactUpdate | null>(null);
  const [sending, setSending] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [statDescription, setStatDescription] = useState('');
  const [statValue, setStatValue] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    fetchUpdates();
  }, [campaignId]);

  const fetchUpdates = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('impact_updates')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching updates:', error);
    } else {
      setUpdates(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setTitle('');
    setStory('');
    setStatDescription('');
    setStatValue('');
    setImageUrl('');
    setSelectedUpdate(null);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      if (selectedUpdate) {
        await supabase
          .from('impact_updates')
          .update({
            title,
            story,
            stat_description: statDescription,
            stat_value: statValue,
            image_url: imageUrl
          })
          .eq('id', selectedUpdate.id);
        toast.success('Impact update saved');
      } else {
        await supabase.from('impact_updates').insert({
          campaign_id: campaignId,
          title,
          story,
          stat_description: statDescription,
          stat_value: statValue,
          image_url: imageUrl
        });
        toast.success('Impact update created');
      }

      fetchUpdates();
      setShowCreateDialog(false);
      resetForm();
    } catch (error) {
      console.error('Error saving update:', error);
      toast.error('Failed to save update');
    }
  };

  const handleEdit = (update: ImpactUpdate) => {
    setSelectedUpdate(update);
    setTitle(update.title);
    setStory(update.story || '');
    setStatDescription(update.stat_description || '');
    setStatValue(update.stat_value || '');
    setImageUrl(update.image_url || '');
    setShowCreateDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this impact update?')) return;

    try {
      await supabase.from('impact_updates').delete().eq('id', id);
      toast.success('Impact update deleted');
      fetchUpdates();
    } catch (error) {
      toast.error('Failed to delete update');
    }
  };

  const handleSendToAll = async (update: ImpactUpdate) => {
    setSending(true);
    try {
      // Get all donors for this campaign
      const { data: donors } = await supabase
        .from('donors')
        .select('id, name, email')
        .eq('campaign_id', campaignId);

      if (!donors || donors.length === 0) {
        toast.error('No donors to send to');
        setSending(false);
        return;
      }

      // Get the impact update email template
      const { data: templates } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_type', 'impact_update')
        .eq('is_system', true)
        .limit(1);

      const template = templates?.[0];

      let sentCount = 0;
      for (const donor of donors) {
        try {
          let body = template?.body || `Dear ${donor.name},\n\n${update.story}\n\nBy the numbers: ${update.stat_description}: ${update.stat_value}`;
          body = body.replace(/\{\{donor_name\}\}/g, donor.name);
          body = body.replace(/\{\{story\}\}/g, update.story || '');
          body = body.replace(/\{\{stat_description\}\}/g, update.stat_description || '');
          body = body.replace(/\{\{stat_value\}\}/g, update.stat_value || '');

          await supabase.functions.invoke('send-email', {
            body: {
              to: donor.email,
              subject: update.title,
              html: body.replace(/\n/g, '<br/>')
            }
          });

          // Log communication
          await supabase.from('donor_communications').insert({
            donor_id: donor.id,
            campaign_id: campaignId,
            communication_type: 'email',
            subject: update.title,
            content: body
          });

          sentCount++;
        } catch (err) {
          console.error(`Failed to send to ${donor.email}:`, err);
        }
      }

      // Mark as sent
      await supabase
        .from('impact_updates')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', update.id);

      toast.success(`Sent impact update to ${sentCount} donors`);
      fetchUpdates();
    } catch (error) {
      console.error('Error sending update:', error);
      toast.error('Failed to send impact update');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Loading impact updates...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold">Impact Updates</h2>
            <p className="text-muted-foreground">Share how donations make a difference</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setShowCreateDialog(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Update
        </Button>
      </div>

      {/* Tips Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Effective Impact Updates Include:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• <strong>One compelling story</strong> - A specific example of impact</li>
                <li>• <strong>One clear statistic</strong> - A number that shows progress</li>
                <li>• <strong>One photo</strong> - Visual proof of your work</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Updates List */}
      {updates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Impact Updates Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first impact update to share with donors</p>
            <Button onClick={() => setShowCreateDialog(true)}>Create Update</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {updates.map(update => (
            <Card key={update.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{update.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(update.created_at).toLocaleDateString()}
                      </span>
                      {update.sent_at ? (
                        <Badge variant="default" className="bg-green-500">Sent</Badge>
                      ) : (
                        <Badge variant="outline">Draft</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {update.image_url && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img src={update.image_url} alt="" className="w-full h-40 object-cover" />
                  </div>
                )}
                
                {update.story && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{update.story}</p>
                )}

                {update.stat_description && update.stat_value && (
                  <div className="p-3 bg-muted/50 rounded-lg mb-4">
                    <div className="text-2xl font-bold text-primary">{update.stat_value}</div>
                    <p className="text-sm text-muted-foreground">{update.stat_description}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(update)}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  {!update.sent_at && (
                    <Button 
                      size="sm" 
                      className="flex-1 gap-1" 
                      onClick={() => handleSendToAll(update)}
                      disabled={sending}
                    >
                      <Send className="h-4 w-4" />
                      {sending ? 'Sending...' : 'Send to All'}
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(update.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedUpdate ? 'Edit' : 'Create'} Impact Update</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g., See the difference you made this quarter!"
              />
            </div>

            <div className="space-y-2">
              <Label>Story</Label>
              <Textarea 
                value={story} 
                onChange={(e) => setStory(e.target.value)} 
                placeholder="Share a specific story about how donations helped..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Tell donors about a specific person or project their support enabled</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stat Description</Label>
                <Input 
                  value={statDescription} 
                  onChange={(e) => setStatDescription(e.target.value)} 
                  placeholder="e.g., Students supported"
                />
              </div>
              <div className="space-y-2">
                <Label>Stat Value</Label>
                <Input 
                  value={statValue} 
                  onChange={(e) => setStatValue(e.target.value)} 
                  placeholder="e.g., 150+"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image URL (optional)</Label>
              <Input 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">Add a photo that shows your impact</p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setShowCreateDialog(false); resetForm(); }}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {selectedUpdate ? 'Save Changes' : 'Create Update'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ImpactUpdatesManager;
