import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DonationEvent {
    id: string;
    customer_name: string;
    total_amount: number;
    created_at: string;
    city?: string;
}

export function LiveDonationFeed({ campaignId }: { campaignId: string }) {
    const [donations, setDonations] = useState<DonationEvent[]>([]);

    useEffect(() => {
        // Fetch initial recent donations
        const fetchRecent = async () => {
            const { data } = await supabase
                .from('orders')
                .select('id, customer_name, total_amount, created_at')
                .eq('campaign_id', campaignId)
                .eq('status', 'completed')
                .order('created_at', { ascending: false })
                .limit(5);

            if (data) setDonations(data);
        };

        fetchRecent();

        // Subscribe to new donations
        const channel = supabase
            .channel('public-donations')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `campaign_id=eq.${campaignId}`
                },
                (payload) => {
                    const newDonation = payload.new as DonationEvent;
                    // Only show completed orders if logic allows, or optimistic updates
                    // Assuming inserted orders are completed or we filter status in real app
                    // For now, push it
                    setDonations(prev => [newDonation, ...prev].slice(0, 5));
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [campaignId]);

    if (donations.length === 0) return null;

    return (
        <Card className="border-none shadow-lg bg-white/50 backdrop-blur">
            <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    Recent Supporters
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <AnimatePresence>
                    {donations.map((donation) => (
                        <motion.div
                            key={donation.id}
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                                <Heart className="w-4 h-4 fill-current" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-foreground">
                                    {donation.customer_name || 'Anonymous Donor'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Donated ${donation.total_amount?.toLocaleString()}
                                </p>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(donation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
