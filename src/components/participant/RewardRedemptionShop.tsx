import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { REWARD_TIERS, RewardTier } from '@/config/incentiveTiers';
import { ShoppingCart, Sparkles, Award, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TShirtSizeSelector } from './TShirtSizeSelector';

interface RewardRedemptionShopProps {
    participantId: string;
    pointsBalance: number;
    tshirtClaimed: boolean;
    tshirtSize: string | null;
    onRedemption: () => void;
}

export function RewardRedemptionShop({
    participantId,
    pointsBalance,
    tshirtClaimed,
    tshirtSize,
    onRedemption
}: RewardRedemptionShopProps) {
    const [selectedReward, setSelectedReward] = useState<RewardTier | null>(null);
    const [redeeming, setRedeeming] = useState(false);
    const [showTShirtSelector, setShowTShirtSelector] = useState(false);

    const handleRedeemClick = (reward: RewardTier) => {
        // Special handling for free t-shirt
        if (reward.pointCost === 0) {
            if (tshirtClaimed) {
                toast.error('You have already claimed your free t-shirt!');
                return;
            }
            if (!tshirtSize) {
                setShowTShirtSelector(true);
                return;
            }
        }

        setSelectedReward(reward);
    };

    const confirmRedemption = async () => {
        if (!selectedReward) return;

        // Check if user has enough points
        if (selectedReward.pointCost > pointsBalance) {
            toast.error('Not enough points!');
            return;
        }

        setRedeeming(true);
        try {
            const { error } = await supabase
                .from('rewards_redemptions')
                .insert({
                    participant_id: participantId,
                    reward_name: selectedReward.name,
                    points_spent: selectedReward.pointCost,
                    status: 'pending'
                });

            if (error) throw error;

            // If it's the free t-shirt, mark as claimed
            if (selectedReward.pointCost === 0) {
                await supabase
                    .from('participants')
                    .update({ tshirt_claimed: true })
                    .eq('id', participantId);
            }

            toast.success(`${selectedReward.name} redeemed! Check with your organizer to collect it.`);
            setSelectedReward(null);
            onRedemption(); // Refresh participant data
        } catch (error) {
            console.error('Error redeeming reward:', error);
            toast.error('Failed to redeem reward');
        } finally {
            setRedeeming(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            Rewards Shop
                        </CardTitle>
                        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="font-bold">{pointsBalance} points</span>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                        Redeem your points for amazing rewards! Earn 1 point for every item you sell.
                    </p>
                </CardHeader>
                <CardContent className="space-y-3">
                    {REWARD_TIERS.map((reward, index) => {
                        const canAfford = pointsBalance >= reward.pointCost;
                        const isFreeShirt = reward.pointCost === 0;
                        const isDisabled = isFreeShirt && tshirtClaimed;

                        return (
                            <motion.div
                                key={reward.name}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={cn(
                                    "group relative rounded-xl border-2 transition-all duration-300 overflow-hidden",
                                    canAfford && !isDisabled
                                        ? "border-primary/30 hover:border-primary/50 hover:shadow-md"
                                        : "border-border/50 opacity-60"
                                )}
                            >
                                {/* Gradient accent bar */}
                                <div className={cn("h-1 bg-gradient-to-r", reward.gradient)} />

                                <div className="p-4 flex items-center gap-4">
                                    {/* Icon */}
                                    <div className={cn(
                                        "w-14 h-14 rounded-xl flex items-center justify-center text-3xl",
                                        canAfford && !isDisabled
                                            ? "bg-gradient-to-br from-primary/10 to-primary/5"
                                            : "bg-muted/50"
                                    )}>
                                        {reward.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <div>
                                                <p className="font-semibold text-sm leading-tight">
                                                    {reward.name}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {reward.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                            <Badge variant={canAfford && !isDisabled ? "default" : "secondary"} className="text-xs">
                                                {reward.pointCost === 0 ? 'FREE' : `${reward.pointCost} points`}
                                            </Badge>
                                            {isFreeShirt && tshirtClaimed && (
                                                <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-500/30">
                                                    <Check className="h-3 w-3 mr-1" />
                                                    Claimed
                                                </Badge>
                                            )}
                                            {isFreeShirt && tshirtSize && !tshirtClaimed && (
                                                <Badge variant="outline" className="text-xs">
                                                    Size: {tshirtSize}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Redeem Button */}
                                    <Button
                                        size="sm"
                                        onClick={() => handleRedeemClick(reward)}
                                        disabled={!canAfford || isDisabled}
                                        className="shrink-0"
                                    >
                                        {isDisabled ? 'Claimed' : 'Redeem'}
                                    </Button>
                                </div>
                            </motion.div>
                        );
                    })}

                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mt-4">
                        <div className="flex items-start gap-3">
                            <Award className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="text-sm space-y-1">
                                <p className="font-medium">How it works:</p>
                                <ul className="text-muted-foreground space-y-1 list-disc list-inside">
                                    <li>Earn 1 point for every item you sell</li>
                                    <li>Redeem points for rewards anytime</li>
                                    <li>Once redeemed, check with your organizer to collect</li>
                                    <li>Keep selling to earn more points!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={!!selectedReward} onOpenChange={() => setSelectedReward(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Redemption</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to redeem this reward?
                        </DialogDescription>
                    </DialogHeader>

                    {selectedReward && (
                        <div className="space-y-4 py-4">
                            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                                <div className="text-4xl">{selectedReward.icon}</div>
                                <div className="flex-1">
                                    <p className="font-semibold">{selectedReward.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedReward.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Cost</p>
                                    <p className="font-bold text-lg">{selectedReward.pointCost} points</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Balance After</p>
                                    <p className="font-bold text-lg">{pointsBalance - selectedReward.pointCost} points</p>
                                </div>
                            </div>

                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                                <p className="text-sm text-amber-900 dark:text-amber-100">
                                    <strong>Note:</strong> Once redeemed, you cannot undo this action. Contact your organizer to collect your reward.
                                </p>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedReward(null)} disabled={redeeming}>
                            Cancel
                        </Button>
                        <Button onClick={confirmRedemption} disabled={redeeming}>
                            {redeeming ? 'Redeeming...' : 'Confirm Redemption'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* T-Shirt Size Selector */}
            <TShirtSizeSelector
                isOpen={showTShirtSelector}
                onClose={() => setShowTShirtSelector(false)}
                participantId={participantId}
                onSizeSelected={() => {
                    onRedemption(); // Refresh to get updated t-shirt size
                    // Auto-redeem the free t-shirt after size selection
                    setTimeout(() => {
                        handleRedeemClick(REWARD_TIERS[0]); // First reward is free t-shirt
                    }, 500);
                }}
            />
        </>
    );
}
