import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { 
  Loader2, Users, Link2, Copy, QrCode, Search, 
  TrendingUp, Crown, Medal, Award, RefreshCw
} from 'lucide-react';

interface Participant {
  id: string;
  nickname: string;
  total_raised: number;
  items_sold: number;
  is_active: boolean;
  created_at: string;
}

interface JoinSettings {
  join_code: string;
  require_code: boolean;
  max_participants: number | null;
}

interface Campaign {
  id: string;
  name: string;
  program_size: number | null;
}

interface ParticipantManagerProps {
  campaignId?: string;
}

export function ParticipantManager({ campaignId }: ParticipantManagerProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>(campaignId || '');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [joinSettings, setJoinSettings] = useState<JoinSettings | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [campaignId, user]);

  useEffect(() => {
    if (selectedCampaign) {
      fetchParticipants(selectedCampaign);
      fetchJoinSettings(selectedCampaign);
    }
  }, [selectedCampaign]);

  const fetchData = async () => {
    if (!user) return;

    try {
      const { data: campaignsData } = await supabase
        .from('campaigns')
        .select('id, name, program_size')
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

  const fetchParticipants = async (campId: string) => {
    const { data } = await supabase
      .from('participants')
      .select('*')
      .eq('campaign_id', campId)
      .order('total_raised', { ascending: false });

    setParticipants(data || []);
  };

  const fetchJoinSettings = async (campId: string) => {
    let { data } = await supabase
      .from('campaign_join_settings')
      .select('*')
      .eq('campaign_id', campId)
      .single();

    if (!data) {
      // Create join settings if they don't exist
      const { data: newSettings } = await supabase
        .from('campaign_join_settings')
        .insert({ campaign_id: campId })
        .select()
        .single();
      
      data = newSettings;
    }

    setJoinSettings(data);
  };

  const copyJoinLink = () => {
    if (!joinSettings) return;
    const link = `${window.location.origin}/join/${joinSettings.join_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Join link copied!');
  };

  const copyJoinCode = () => {
    if (!joinSettings) return;
    navigator.clipboard.writeText(joinSettings.join_code);
    toast.success('Join code copied!');
  };

  const regenerateCode = async () => {
    if (!selectedCampaign) return;

    try {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { error } = await supabase
        .from('campaign_join_settings')
        .update({ join_code: newCode })
        .eq('campaign_id', selectedCampaign);

      if (error) throw error;
      
      setJoinSettings(prev => prev ? { ...prev, join_code: newCode } : null);
      toast.success('New join code generated!');
    } catch (err) {
      console.error('Error regenerating code:', err);
      toast.error('Failed to regenerate code');
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (index === 1) return <Medal className="h-4 w-4 text-gray-400" />;
    if (index === 2) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-xs text-muted-foreground">#{index + 1}</span>;
  };

  const filteredParticipants = participants.filter(p =>
    p.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRaised = participants.reduce((sum, p) => sum + (p.total_raised || 0), 0);
  const currentCampaign = campaigns.find(c => c.id === selectedCampaign);
  const expectedSize = currentCampaign?.program_size || 0;

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
          <label className="text-sm font-medium">Select Campaign</label>
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

      {/* Join Link Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Participant Join Link
          </CardTitle>
          <CardDescription>
            Share this link with your group - no emails needed!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {joinSettings && (
            <>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/join/${joinSettings.join_code}`}
                  className="font-mono text-sm"
                />
                <Button onClick={copyJoinLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Join Code:</span>
                  <Badge variant="outline" className="font-mono text-lg px-3 py-1">
                    {joinSettings.join_code}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={copyJoinCode}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={regenerateCode}>
                  <RefreshCw className="h-3 w-3 mr-2" />
                  New Code
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {participants.length}
                  {expectedSize > 0 && (
                    <span className="text-base font-normal text-muted-foreground">
                      /{expectedSize}
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">Participants Joined</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalRaised.toFixed(0)}</p>
                <p className="text-sm text-muted-foreground">Total Raised</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                <Crown className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {participants.length > 0 ? participants[0].nickname : '-'}
                </p>
                <p className="text-sm text-muted-foreground">Top Seller</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle>Participants</CardTitle>
              <CardDescription>
                Anonymous leaderboard - no personal info stored
              </CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by nickname..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="font-medium">No participants yet</p>
              <p className="text-sm mt-1">Share the join link to get started!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Rank</TableHead>
                  <TableHead>Nickname</TableHead>
                  <TableHead className="text-right">Raised</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant, index) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div className="w-6 flex justify-center">
                        {getRankIcon(index)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{participant.nickname}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${participant.total_raised?.toFixed(0) || 0}
                    </TableCell>
                    <TableCell className="text-right">
                      {participant.items_sold || 0}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground text-sm">
                      {new Date(participant.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
