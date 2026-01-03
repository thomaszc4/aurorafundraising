import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Sparkles, Info, ShoppingBag, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REWARD_TIERS } from '@/config/incentiveTiers';
import { AdminRedemptionManager } from './AdminRedemptionManager';
import { AdminTShirtReport } from './AdminTShirtReport';

interface IncentiveManagerProps {
  campaignId?: string;
}

export function IncentiveManager({ campaignId }: IncentiveManagerProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Rewards System
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage rewards, view redemptions, and track t-shirt sizes
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Reward Tiers</TabsTrigger>
          <TabsTrigger value="redemptions" className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Redemptions
          </TabsTrigger>
          <TabsTrigger value="tshirts" className="flex items-center gap-2">
            <Shirt className="h-4 w-4" />
            T-Shirt Report
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Reward Tiers Overview */}
        <TabsContent value="overview" className="space-y-6">
          {/* Info Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm space-y-1">
                  <p className="font-medium">Points System: 1 Item Sold = 1 Point</p>
                  <p className="text-muted-foreground">
                    Participants earn points for every item sold and can redeem them for rewards in the shop.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rewards Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {REWARD_TIERS.map((tier, index) => (
              <Card
                key={tier.name + tier.pointCost}
                className={cn(
                  "overflow-hidden transition-all duration-300 hover:shadow-lg",
                  "border-2 hover:border-primary/30"
                )}
              >
                <div className={cn(
                  "h-1 bg-gradient-to-r",
                  tier.gradient
                )} />
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
                      "bg-gradient-to-br from-background to-muted"
                    )}>
                      {tier.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base">{tier.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {tier.pointCost} points
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {tier.category?.replace('_', ' ') || 'Reward'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground pt-0 pb-4">
                  {tier.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Manage Redemptions */}
        <TabsContent value="redemptions">
          <AdminRedemptionManager campaignId={campaignId} />
        </TabsContent>

        {/* Tab 3: T-Shirt Report */}
        <TabsContent value="tshirts">
          <AdminTShirtReport campaignId={campaignId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

