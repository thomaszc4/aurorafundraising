import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
    Loader2, ShoppingBag, Gift, Check, Lock, AlertCircle,
    Gamepad2, Sparkles, Shirt, Smile, CreditCard, Ticket, Star
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { REWARD_CATALOG, RewardItem } from '@/config/incentiveTiers';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RewardsShopProps {
    participantId: string;
    itemsSold: number;
    campaignId: string;
}

export function RewardsShop({ participantId, itemsSold, campaignId }: RewardsShopProps) {
    const [pointsSpent, setPointsSpent] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<RewardItem | null>(null);
    const [redeeming, setRedeeming] = useState(false);

    // Points logic: 1 item = 2 points
    const totalPointsEarned = itemsSold * 2;
    const currentBalance = totalPointsEarned - pointsSpent;

    useEffect(() => {
        fetchRedemptionHistory();
    }, [participantId]);

    const fetchRedemptionHistory = async () => {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data, error } = await (supabase
                .from('rewards_redemptions' as any)
                .select('points_spent')
                .eq('participant_id', participantId)
                .neq('status', 'cancelled')) as any;

            if (error) throw error;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const totalSpent = (data || []).reduce((sum: number, r: any) => sum + r.points_spent, 0);
            setPointsSpent(totalSpent);
        } catch (error) {
            console.error('Error fetching redemptions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRedeemClick = (item: RewardItem) => {
        if (currentBalance < item.pointCost) {
            toast.error(`You need ${item.pointCost - currentBalance} more points!`, {
                description: 'Keep selling to unlock this reward.'
            });
            return;
        }
        setSelectedItem(item);
    };

    const confirmRedemption = async () => {
        if (!selectedItem) return;
        setRedeeming(true);

        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { error } = await (supabase
                .from('rewards_redemptions' as any)
                .insert({
                    participant_id: participantId,
                    reward_name: selectedItem.name,
                    points_spent: selectedItem.pointCost,
                    status: 'pending'
                }) as any);

            if (error) throw error;

            toast.success('Reward Redeemed!', {
                description: `${selectedItem.name} is on its way to the list!`
            });
            setPointsSpent(prev => prev + selectedItem.pointCost);
            setSelectedItem(null);
        } catch (error) {
            console.error('Redemption error:', error);
            toast.error('Redemption failed. Please try again.');
        } finally {
            setRedeeming(false);
        }
    };

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'Gaming & Tech':
                return { icon: Gamepad2, gradient: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50 text-blue-600' };
            case 'Beauty & Style':
                return { icon: Sparkles, gradient: 'from-pink-500 to-rose-500', bg: 'bg-pink-50 text-pink-600' };
            case 'Apparel':
                return { icon: Shirt, gradient: 'from-purple-500 to-violet-600', bg: 'bg-purple-50 text-purple-600' };
            case 'Lifestyle & Fun':
                return { icon: Smile, gradient: 'from-orange-400 to-amber-500', bg: 'bg-orange-50 text-orange-600' };
            case 'Gift Cards':
                return { icon: CreditCard, gradient: 'from-emerald-400 to-green-600', bg: 'bg-emerald-50 text-green-600' };
            case 'Experiences':
                return { icon: Ticket, gradient: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-50 text-cyan-600' };
            default:
                return { icon: Star, gradient: 'from-gray-400 to-slate-500', bg: 'bg-gray-50 text-gray-600' };
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Area with Glass Wallet */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/90 via-primary to-violet-600 text-white shadow-xl p-6 sm:p-8">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-48 w-48 rounded-full bg-black/10 blur-2xl"></div>

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Rewards Shop</h2>
                        <p className="text-primary-foreground/80 mt-1 max-w-md">
                            You've earned it! Redeem your points for exclusive prizes.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl shadow-inner">
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                            <Gift className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Available Balance</p>
                            <div className="flex items-baseline gap-1">
                                <motion.span
                                    key={currentBalance}
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-3xl font-extrabold"
                                >
                                    {currentBalance}
                                </motion.span>
                                <span className="text-sm font-medium opacity-80">pts</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shop Interface */}
            <Tabs defaultValue="10" className="w-full space-y-6">
                <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl py-2 -mx-4 px-4 border-b">
                    <ScrollArea className="w-full whitespace-nowrap">
                        <TabsList className="h-auto p-1 bg-muted/50 rounded-full gap-2 inline-flex">
                            {REWARD_CATALOG.map((tier) => (
                                <TabsTrigger
                                    key={tier.pointCost}
                                    value={tier.pointCost.toString()}
                                    className="rounded-full px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-md"
                                >
                                    {tier.pointCost} Pts
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        <ScrollBar orientation="horizontal" className="invisible" />
                    </ScrollArea>
                </div>

                <div className="min-h-[400px]">
                    <AnimatePresence mode="wait">
                        {REWARD_CATALOG.map((tier) => (
                            <TabsContent key={tier.pointCost} value={tier.pointCost.toString()} className="mt-0 focus-visible:outline-none">
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                                >
                                    {tier.items.map((item, index) => {
                                        const styles = getCategoryStyles(item.category);
                                        const isAffordable = currentBalance >= item.pointCost;
                                        const Icon = styles.icon;

                                        return (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                                className={cn(
                                                    "group relative flex flex-col rounded-3xl overflow-hidden transition-all duration-300",
                                                    "bg-white border border-border/50 shadow-sm",
                                                    isAffordable
                                                        ? "hover:shadow-2xl hover:-translate-y-1 hover:border-primary/30 cursor-pointer"
                                                        : "opacity-60 grayscale-[0.5]"
                                                )}
                                                onClick={() => handleRedeemClick(item)}
                                            >
                                                {/* Image / Icon Area */}
                                                <div className={cn(
                                                    "h-32 w-full flex items-center justify-center relative overflow-hidden",
                                                    `bg-gradient-to-br ${styles.gradient}`
                                                )}>
                                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />
                                                    <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300">
                                                        <Icon className="h-8 w-8 text-white" />
                                                    </div>

                                                    {isAffordable && (
                                                        <div className="absolute top-2 right-2">
                                                            <Badge className="bg-white/90 text-primary hover:bg-white border-0 shadow-sm">
                                                                GET IT
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="p-4 flex-1 flex flex-col">
                                                    <div className="mb-2">
                                                        <span className={cn(
                                                            "text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide",
                                                            styles.bg
                                                        )}>
                                                            {item.category}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-bold text-sm leading-tight text-foreground/90 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                                                        {item.name}
                                                    </h3>

                                                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/50">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs text-muted-foreground">Cost</span>
                                                            <span className="font-bold text-primary">{item.pointCost} pts</span>
                                                        </div>
                                                        {isAffordable ? (
                                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                                                <ShoppingBag className="h-4 w-4" />
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center text-xs font-medium text-orange-500 gap-1">
                                                                <Lock className="h-3 w-3" />
                                                                {item.pointCost - currentBalance} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </motion.div>
                            </TabsContent>
                        ))}
                    </AnimatePresence>
                </div>
            </Tabs>

            {/* Confirmation Dialog */}
            <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
                <DialogContent className="sm:max-w-md border-0 rounded-3xl overflow-hidden p-0">
                    <div className={cn(
                        "h-32 flex items-center justify-center",
                        selectedItem ? `bg-gradient-to-br ${getCategoryStyles(selectedItem.category).gradient}` : "bg-muted"
                    )}>
                        <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
                            <Gift className="h-8 w-8 text-white" />
                        </div>
                    </div>

                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-center">Redeem Reward?</DialogTitle>
                            <DialogDescription className="text-center pt-2">
                                You are about to exchange <span className="font-bold text-primary">{selectedItem?.pointCost} points</span> for:
                                <br />
                                <span className="text-lg font-bold text-foreground mt-2 block">{selectedItem?.name}</span>
                            </DialogDescription>
                        </DialogHeader>

                        <div className="bg-muted/50 rounded-xl p-4 my-6 flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">New Balance after redemption:</span>
                            <span className="font-bold text-foreground">
                                {currentBalance - (selectedItem?.pointCost || 0)} pts
                            </span>
                        </div>

                        <DialogFooter className="flex gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setSelectedItem(null)} className="rounded-xl flex-1">
                                Cancel
                            </Button>
                            <Button
                                onClick={confirmRedemption}
                                disabled={redeeming}
                                className="rounded-xl flex-1 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90 text-white border-0 shadow-lg"
                            >
                                {redeeming && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Confirm Exchange
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
