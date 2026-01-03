import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Check, Clock, X, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface Redemption {
    id: string;
    participant_id: string;
    reward_name: string;
    points_spent: number;
    redeemed_at: string;
    status: 'pending' | 'fulfilled' | 'cancelled';
    participants: {
        nickname: string;
        items_sold: number;
    };
}

export function AdminRedemptionManager({ campaignId }: { campaignId?: string }) {
    const [loading, setLoading] = useState(true);
    const [redemptions, setRedemptions] = useState<Redemption[]>([]);
    const [filter, setFilter] = useState('pending');
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchRedemptions();
    }, [campaignId]);

    const fetchRedemptions = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('rewards_redemptions')
                .select(`
          *,
          participants (
            nickname,
            items_sold,
            campaign_id
          )
        `)
                .order('redeemed_at', { ascending: false });

            const { data, error } = await query;

            if (error) throw error;

            // Filter by campaign if needed (client-side filtering because of the join)
            // Or server side if we deeply nested the filter, but client side is easier for now
            let formattedData = data as unknown as Redemption[];

            if (campaignId) {
                // @ts-ignore
                formattedData = formattedData.filter(r => r.participants?.campaign_id === campaignId);
            }

            setRedemptions(formattedData);
        } catch (error) {
            console.error('Error fetching redemptions:', error);
            toast.error('Failed to load redemptions');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('rewards_redemptions')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) throw error;

            toast.success(`Redemption marked as ${newStatus}`);
            fetchRedemptions(); // Refresh list
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Failed to update status');
        }
    };

    const filteredRedemptions = redemptions.filter(r => {
        const matchesStatus = filter === 'all' || r.status === filter;
        const matchesSearch = r.participants?.nickname?.toLowerCase().includes(search.toLowerCase()) ||
            r.reward_name.toLowerCase().includes(search.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center gap-4">
                <Tabs value={filter} onValueChange={setFilter} className="w-full max-w-md">
                    <TabsList>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="fulfilled">Fulfilled</TabsTrigger>
                        <TabsTrigger value="all">All History</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search participant or reward..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="grid gap-3">
                {filteredRedemptions.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg bg-muted/20">
                        <p className="text-muted-foreground">No redemptions found matching your criteria.</p>
                    </div>
                ) : (
                    filteredRedemptions.map((redemption) => (
                        <Card key={redemption.id} className="overflow-hidden">
                            <div className="p-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${redemption.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                                            redemption.status === 'fulfilled' ? 'bg-green-100 text-green-600' :
                                                'bg-red-100 text-red-600'
                                        }`}>
                                        {redemption.status === 'pending' && <Clock className="h-5 w-5" />}
                                        {redemption.status === 'fulfilled' && <Check className="h-5 w-5" />}
                                        {redemption.status === 'cancelled' && <X className="h-5 w-5" />}
                                    </div>

                                    <div>
                                        <p className="font-semibold">{redemption.reward_name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            by <span className="text-foreground font-medium">{redemption.participants?.nickname || 'Unknown'}</span> • {new Date(redemption.redeemed_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Badge variant="outline">
                                        {redemption.points_spent} pts
                                    </Badge>

                                    {redemption.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => updateStatus(redemption.id, 'cancelled')}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => updateStatus(redemption.id, 'fulfilled')}
                                            >
                                                Mark Fulfilled
                                            </Button>
                                        </div>
                                    )}

                                    {redemption.status !== 'pending' && (
                                        <Badge variant={redemption.status === 'fulfilled' ? 'default' : 'destructive'}>
                                            {redemption.status.toUpperCase()}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
