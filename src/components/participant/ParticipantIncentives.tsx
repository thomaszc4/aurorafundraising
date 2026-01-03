import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Gift, Award, Trophy, Sparkles, Check, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { INCENTIVE_TIERS, IncentiveTier } from '@/config/incentiveTiers';
import { supabase } from '@/integrations/supabase/client';

interface RewardStat {
    itemsRequired: number;
    participantCount: number;
}

interface ParticipantIncentivesProps {
    itemsSold: number;
    campaignId: string;
}

export function ParticipantIncentives({ itemsSold, campaignId }: ParticipantIncentivesProps) {
    const [rewardStats, setRewardStats] = useState<RewardStat[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch participant stats for social proof
    useEffect(() => {
        const fetchRewardStats = async () => {
            if (!campaignId) return;

            try {
                // Fetch all participants for this campaign with items_sold
                const { data: participantsData } = await supabase
                    .from('participants')
                    .select('items_sold')
                    .eq('campaign_id', campaignId);

                const allItemsSold = (participantsData || []).map(p => p.items_sold || 0);

                // Calculate how many participants earned each reward tier
                const stats = INCENTIVE_TIERS.map(tier => ({
                    itemsRequired: tier.itemsRequired,
                    participantCount: allItemsSold.filter(items => items >= tier.itemsRequired).length
                }));

                setRewardStats(stats);
            } catch (error) {
                console.error('Error fetching reward stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRewardStats();
    }, [campaignId]);

    // Calculate which tier they're currently working towards
    const currentTierIndex = INCENTIVE_TIERS.findIndex(tier => itemsSold < tier.itemsRequired);
    const nextTier = currentTierIndex >= 0 ? INCENTIVE_TIERS[currentTierIndex] : null;

    // Calculate progress to next tier
    const previousTierItems = currentTierIndex > 0 ? INCENTIVE_TIERS[currentTierIndex - 1].itemsRequired : 0;
    const progressToNext = nextTier
        ? ((itemsSold - previousTierItems) / (nextTier.itemsRequired - previousTierItems)) * 100
        : 100;

    // Helper function to get participant count for a tier
    const getParticipantCount = (itemsRequired: number): number => {
        const stat = rewardStats.find(s => s.itemsRequired === itemsRequired);
        return stat?.participantCount || 0;
    };

    return (
        <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-background via-background to-primary/5">
            <CardHeader className="pb-4 bg-gradient-to-r from-primary/10 to-transparent">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary animate-pulse" />
                        Earn Amazing Rewards
                    </CardTitle>
                    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-bold text-sm">{itemsSold} items sold</span>
                    </div>
                </div>

                {/* Prize Structure Alert */}
                <div className="mt-4 p-4 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                            <Gift className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-sm text-emerald-900 dark:text-emerald-100 mb-1">
                                🎁 How Rewards Work
                            </p>
                            <p className="text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
                                <strong>You earn the HIGHEST prize tier you reach + a FREE t-shirt!</strong> Keep selling to unlock better rewards. The more you sell, the better your prize gets!
                            </p>
                        </div>
                    </div>
                </div>

                {nextTier && (
                    <div className="mt-4 p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-primary/20">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{nextTier.icon}</span>
                                <div>
                                    <p className="font-semibold text-sm">Next Reward: {nextTier.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {nextTier.itemsRequired - itemsSold} more items to go!
                                    </p>
                                </div>
                            </div>
                            <Award className="h-6 w-6 text-primary opacity-50" />
                        </div>
                        <Progress value={progressToNext} className="h-2 bg-muted" />
                    </div>
                )}
            </CardHeader>

            <CardContent className="pt-6">
                <div className="space-y-3">
                    {INCENTIVE_TIERS.map((tier, index) => {
                        const isEarned = itemsSold >= tier.itemsRequired;
                        const isNext = nextTier?.itemsRequired === tier.itemsRequired;
                        const progressValue = isEarned
                            ? 100
                            : isNext
                                ? progressToNext
                                : itemsSold > tier.itemsRequired
                                    ? 0
                                    : (itemsSold / tier.itemsRequired) * 100;

                        return (
                            <motion.div
                                key={tier.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn(
                                    "group relative rounded-xl border-2 transition-all duration-300 overflow-hidden",
                                    isEarned
                                        ? "bg-gradient-to-r " + tier.gradient + " border-transparent shadow-lg scale-[1.02]"
                                        : isNext
                                            ? "bg-primary/5 border-primary/30 shadow-md hover:shadow-lg hover:border-primary/50"
                                            : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border"
                                )}
                            >
                                {/* Glow effect for earned items */}
                                {isEarned && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                )}

                                <div className="relative p-4 flex items-center gap-4">
                                    {/* Icon */}
                                    <div className={cn(
                                        "flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center text-3xl transition-transform duration-300",
                                        isEarned
                                            ? "bg-white/90 dark:bg-black/20 scale-110 animate-pulse"
                                            : isNext
                                                ? "bg-primary/10 scale-105"
                                                : "bg-background/50"
                                    )}>
                                        {tier.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className={cn(
                                                "font-semibold text-sm truncate",
                                                isEarned ? "text-white dark:text-white" : "text-foreground"
                                            )}>
                                                {tier.name}
                                            </p>
                                            {isEarned && (
                                                <motion.div
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                                >
                                                    <Check className="h-4 w-4 text-white dark:text-white" />
                                                </motion.div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={cn(
                                                "text-xs font-bold px-2 py-0.5 rounded-full",
                                                isEarned
                                                    ? "bg-white/90 dark:bg-black/30 text-gray-900 dark:text-white"
                                                    : isNext
                                                        ? "bg-primary/20 text-primary"
                                                        : "bg-muted text-muted-foreground"
                                            )}>
                                                {tier.itemsRequired} items
                                            </span>

                                            {!isEarned && (
                                                <span className="text-xs text-muted-foreground">
                                                    {tier.itemsRequired - itemsSold} more needed
                                                </span>
                                            )}

                                            {/* Social Proof Counter */}
                                            {!loading && getParticipantCount(tier.itemsRequired) > 0 && (
                                                <span className={cn(
                                                    "text-xs flex items-center gap-1 px-2 py-0.5 rounded-full",
                                                    isEarned
                                                        ? "bg-white/80 dark:bg-black/20 text-gray-700 dark:text-gray-300"
                                                        : "bg-muted/80 text-muted-foreground"
                                                )}>
                                                    <Users className="h-3 w-3" />
                                                    {getParticipantCount(tier.itemsRequired)} earned
                                                </span>
                                            )}
                                        </div>

                                        {/* Progress bar for current/upcoming tiers */}
                                        {!isEarned && isNext && (
                                            <Progress
                                                value={progressValue}
                                                className="h-1.5 mt-2 bg-white/20 dark:bg-black/20"
                                            />
                                        )}
                                    </div>

                                    {/* Badge for earned items */}
                                    {isEarned && (
                                        <div className="flex-shrink-0">
                                            <div className="bg-white/90 dark:bg-black/30 px-3 py-1 rounded-full">
                                                <span className="text-xs font-bold text-gray-900 dark:text-white">EARNED</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Motivational footer */}
                <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-transparent rounded-xl border border-primary/20">
                    <div className="flex items-center gap-3">
                        <Gift className="h-5 w-5 text-primary" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold">Keep Selling to Unlock More!</p>
                            <p className="text-xs text-muted-foreground">
                                You've unlocked {INCENTIVE_TIERS.filter(t => itemsSold >= t.itemsRequired).length} of {INCENTIVE_TIERS.length} rewards
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
