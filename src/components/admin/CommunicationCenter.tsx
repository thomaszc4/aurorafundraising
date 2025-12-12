import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  Loader2, Send, MessageSquare, Users, Clock, Trash2 
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Message {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface CommunicationCenterProps {
  campaignId?: string;
}

export function CommunicationCenter({ campaignId }: CommunicationCenterProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(campaignId || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [campaignId, user]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchMessages(selectedCampaign);
      fetchParticipantCount(selectedCampaign);
    }
  }, [selectedCampaign]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Fetch campaigns for this admin
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

  const fetchMessages = async (campId: string) => {
    const { data } = await supabase
      .from('participant_messages')
      .select('*')
      .eq('campaign_id', campId)
      .order('created_at', { ascending: false });

    setMessages(data || []);
  };

  const fetchParticipantCount = async (campId: string) => {
    const { count } = await supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campId)
      .eq('is_active', true);

    setParticipantCount(count || 0);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!selectedCampaign) {
      toast.error('Please select a campaign');
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase
        .from('participant_messages')
        .insert({
          campaign_id: selectedCampaign,
          title: title.trim(),
          content: content.trim(),
          sent_by: user?.id
        });

      if (error) throw error;

      toast.success(`Message sent to ${participantCount} participants!`);
      setTitle('');
      setContent('');
      fetchMessages(selectedCampaign);
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('participant_messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      toast.success('Message deleted');
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');
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
      {/* Campaign Selector (if not passed as prop) */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Message */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Message
            </CardTitle>
            <CardDescription>
              Broadcast a message to all {participantCount} participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Great job this week!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={sending}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Message</Label>
                <Textarea
                  id="content"
                  placeholder="Write your message to the participants..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  disabled={sending}
                />
              </div>

              <Button type="submit" className="w-full" disabled={sending || participantCount === 0}>
                {sending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send to {participantCount} Participants
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Message History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Message History
            </CardTitle>
            <CardDescription>
              Previous messages sent to participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No messages sent yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {messages.map((message) => (
                  <div key={message.id} className="p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{message.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {message.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the message from participant dashboards.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(message.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
