import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TShirtStats {
    size: string;
    count: number;
}

interface ParticipantSize {
    nickname: string;
    tshirt_size: string;
    items_sold: number;
    tshirt_claimed: boolean;
}

export function AdminTShirtReport({ campaignId }: { campaignId?: string }) {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<TShirtStats[]>([]);
    const [participants, setParticipants] = useState<ParticipantSize[]>([]);

    useEffect(() => {
        fetchData();
    }, [campaignId]);

    const fetchData = async () => {
        try {
            let query = supabase
                .from('participants')
                .select('nickname, tshirt_size, items_sold, tshirt_claimed')
                .not('tshirt_size', 'is', null);

            if (campaignId) {
                query = query.eq('campaign_id', campaignId);
            }

            const { data, error } = await query;

            if (error) throw error;

            setParticipants(data);

            // Aggregate stats
            const counts: Record<string, number> = {};
            data.forEach(p => {
                if (p.tshirt_size) {
                    counts[p.tshirt_size] = (counts[p.tshirt_size] || 0) + 1;
                }
            });

            const statsArray = Object.entries(counts)
                .map(([size, count]) => ({ size, count }))
                .sort((a, b) => {
                    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
                    return sizes.indexOf(a.size) - sizes.indexOf(b.size);
                });

            setStats(statsArray);
        } catch (error) {
            console.error('Error fetching t-shirt data:', error);
            toast.error('Failed to load t-shirt report');
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        const headers = ['Nickname', 'Size', 'Items Sold', 'Claimed'];
        const rows = participants.map(p => [
            p.nickname,
            p.tshirt_size,
            p.items_sold,
            p.tshirt_claimed ? 'Yes' : 'No'
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tshirt-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">T-Shirt Size Report</h3>
                <Button onClick={downloadCSV} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                {/* Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Size Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {stats.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No sizes selected yet.</p>
                            ) : (
                                stats.map((stat) => (
                                    <div key={stat.size} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                                        <span className="font-semibold">{stat.size}</span>
                                        <span className="bg-primary/10 px-2 py-0.5 rounded-full text-xs font-medium">
                                            {stat.count}
                                        </span>
                                    </div>
                                ))
                            )}
                            {stats.length > 0 && (
                                <div className="flex justify-between items-center text-sm font-bold pt-2 border-t">
                                    <span>Total</span>
                                    <span>{stats.reduce((acc, curr) => acc + curr.count, 0)}</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            These are the t-shirt sizes selected by participants.
                            Only participants who have explicitly selected a size via the Rewards Shop are shown here.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
