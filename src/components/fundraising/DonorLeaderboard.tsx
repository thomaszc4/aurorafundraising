import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Crown, Star, Award, Sparkles } from 'lucide-react';

interface TopDonor {
  id: string;
  name: string;
  display_name: string | null;
  total_donated: number;
  donation_count: number;
  display_on_wall: boolean;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Crown className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Award className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Star className="h-6 w-6 text-amber-600" />;
    default:
      return <Heart className="h-5 w-5 text-pink-500" />;
  }
};

const getRankBadge = (rank: number) => {
  const baseClasses = "flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg";
  switch (rank) {
    case 1:
      return `${baseClasses} bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30`;
    case 2:
      return `${baseClasses} bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/30`;
    case 3:
      return `${baseClasses} bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/30`;
    default:
      return `${baseClasses} bg-gradient-to-br from-pink-400 to-pink-600 text-white`;
  }
};

const getDonorBadge = (totalDonated: number, donationCount: number) => {
  if (totalDonated >= 1000) return { label: 'Champion', color: 'bg-purple-500' };
  if (totalDonated >= 500) return { label: 'Hero', color: 'bg-blue-500' };
  if (totalDonated >= 250) return { label: 'Advocate', color: 'bg-green-500' };
  if (donationCount >= 5) return { label: 'Loyal', color: 'bg-orange-500' };
  return null;
};

interface DonorLeaderboardProps {
  campaignId?: string;
  limit?: number;
  showTitle?: boolean;
  variant?: 'card' | 'wall';
}

export function DonorLeaderboard({ 
  campaignId, 
  limit = 10, 
  showTitle = true,
  variant = 'card'
}: DonorLeaderboardProps) {
  const [donors, setDonors] = useState<TopDonor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopDonors();
  }, [campaignId]);

  const fetchTopDonors = async () => {
    try {
      let query = supabase
        .from('donors')
        .select('id, name, display_name, total_donated, donation_count, display_on_wall')
        .eq('display_on_wall', true)
        .gt('total_donated', 0)
        .order('total_donated', { ascending: false })
        .limit(limit);

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setDonors(data || []);
    } catch (error) {
      console.error('Error fetching top donors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted" />
                <div className="flex-1 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (donors.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            No donors on the recognition wall yet.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Donors who opt-in will be celebrated here!
          </p>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'wall') {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {donors.map((donor, index) => {
          const badge = getDonorBadge(donor.total_donated || 0, donor.donation_count || 0);
          const displayName = donor.display_name || donor.name;
          
          return (
            <Card 
              key={donor.id} 
              className={`border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden transition-all hover:scale-105 ${
                index < 3 ? 'ring-2 ring-yellow-500/30' : ''
              }`}
            >
              <CardContent className="p-4 text-center">
                <div className={`${getRankBadge(index + 1)} mx-auto mb-3`}>
                  {index < 3 ? getRankIcon(index + 1) : (index + 1)}
                </div>
                <h3 className="font-semibold text-foreground truncate">
                  {displayName}
                </h3>
                <p className="text-lg font-bold text-primary mt-1">
                  ${Number(donor.total_donated || 0).toLocaleString()}
                </p>
                {badge && (
                  <Badge className={`${badge.color} text-white mt-2`}>
                    {badge.label}
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {donor.donation_count || 0} donation{(donor.donation_count || 0) !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {showTitle && (
        <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-lg bg-gradient-to-br from-pink-400 to-purple-600">
              <Heart className="h-5 w-5 text-white" />
            </div>
            Donor Recognition Wall
            <Sparkles className="h-4 w-4 text-yellow-500 ml-auto" />
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {donors.map((donor, index) => {
            const rank = index + 1;
            const badge = getDonorBadge(donor.total_donated || 0, donor.donation_count || 0);
            const displayName = donor.display_name || donor.name;

            return (
              <div
                key={donor.id}
                className={`p-4 transition-colors hover:bg-muted/30 ${
                  rank <= 3 ? 'bg-gradient-to-r from-transparent to-muted/20' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={getRankBadge(rank)}>
                    {rank <= 3 ? getRankIcon(rank) : rank}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground truncate">
                        {displayName}
                      </span>
                      {badge && (
                        <Badge className={`${badge.color} text-white text-xs`}>
                          {badge.label}
                        </Badge>
                      )}
                      {rank === 1 && (
                        <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                          Top Donor
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {donor.donation_count || 0} donation{(donor.donation_count || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">
                      ${Number(donor.total_donated || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
