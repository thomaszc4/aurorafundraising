import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Medal, Award, Star, TrendingUp } from 'lucide-react';

interface LeaderboardEntry {
  id: string;
  page_slug: string;
  total_raised: number;
  personal_goal: number | null;
  profiles: {
    full_name: string | null;
  } | null;
  campaigns: {
    name: string;
  } | null;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Award className="h-6 w-6 text-amber-600" />;
    default:
      return <Star className="h-5 w-5 text-muted-foreground" />;
  }
};

const getRankBadge = (rank: number) => {
  const baseClasses = "flex items-center justify-center w-10 h-10 rounded-full font-bold text-lg";
  switch (rank) {
    case 1:
      return `${baseClasses} bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30`;
    case 2:
      return `${baseClasses} bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg shadow-gray-400/30`;
    case 3:
      return `${baseClasses} bg-gradient-to-br from-amber-500 to-amber-700 text-white shadow-lg shadow-amber-500/30`;
    default:
      return `${baseClasses} bg-muted text-muted-foreground`;
  }
};

interface LeaderboardProps {
  limit?: number;
  campaignId?: string;
  showTitle?: boolean;
}

export function Leaderboard({ limit = 10, campaignId, showTitle = true }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [campaignId]);

  const fetchLeaderboard = async () => {
    try {
      let query = supabase
        .from('student_fundraisers')
        .select('id, page_slug, total_raised, personal_goal, profiles(full_name), campaigns(name)')
        .eq('is_active', true)
        .order('total_raised', { ascending: false })
        .limit(limit);

      if (campaignId) {
        query = query.eq('campaign_id', campaignId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setEntries((data as LeaderboardEntry[]) || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const maxRaised = entries.length > 0 ? Math.max(...entries.map(e => e.total_raised || 0)) : 0;

  if (loading) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 h-4 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (entries.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-6 text-center text-muted-foreground">
          No fundraisers yet. Be the first to start!
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
      {showTitle && (
        <CardHeader className="bg-gradient-to-r from-primary-blue/10 to-accent-purple/10 border-b border-border/50">
          <CardTitle className="flex items-center gap-3 text-foreground">
            <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600">
              <Trophy className="h-5 w-5 text-white" />
            </div>
            Top Fundraisers
            <TrendingUp className="h-4 w-4 text-accent-teal ml-auto" />
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className="p-0">
        <div className="divide-y divide-border/50">
          {entries.map((entry, index) => {
            const rank = index + 1;
            const progress = entry.personal_goal 
              ? Math.min((entry.total_raised / entry.personal_goal) * 100, 100)
              : 0;
            const relativeProgress = maxRaised > 0 
              ? (entry.total_raised / maxRaised) * 100 
              : 0;

            return (
              <div
                key={entry.id}
                className={`p-4 transition-colors hover:bg-muted/30 ${
                  rank <= 3 ? 'bg-gradient-to-r from-transparent to-muted/20' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Rank Badge */}
                  <div className={getRankBadge(rank)}>
                    {rank <= 3 ? getRankIcon(rank) : rank}
                  </div>

                  {/* Student Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={`/student/${entry.page_slug}`}
                        className="font-semibold text-foreground hover:text-primary-blue transition-colors truncate"
                      >
                        {entry.profiles?.full_name || 'Anonymous'}
                      </a>
                      {rank === 1 && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-yellow-500/20 text-yellow-600 rounded-full">
                          Leader
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {entry.campaigns?.name || 'Campaign'}
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="mt-2">
                      <Progress 
                        value={relativeProgress} 
                        className="h-2 bg-muted"
                      />
                    </div>
                  </div>

                  {/* Amount Raised */}
                  <div className="text-right">
                    <p className="font-bold text-lg text-foreground">
                      ${Number(entry.total_raised || 0).toLocaleString()}
                    </p>
                    {entry.personal_goal && (
                      <p className="text-xs text-muted-foreground">
                        {progress.toFixed(0)}% of ${Number(entry.personal_goal).toLocaleString()} goal
                      </p>
                    )}
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
