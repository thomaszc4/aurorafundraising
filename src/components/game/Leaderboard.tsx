import React, { useEffect, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface LeaderboardProps {
    isOpen: boolean;
    onClose: () => void;
    campaignId: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose, campaignId }) => {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            const fetchLeaderboard = async () => {
                const { data } = await supabase
                    .from('game_players' as any)
                    .select('display_name, data')
                    .eq('campaign_id', campaignId)
                    .order('last_seen', { ascending: false }) // ideally order by data->stats->days_survived but requires jsonb query or updated column
                    .limit(20);

                if (data) {
                    const sorted = data.map((p: any) => ({
                        name: p.display_name,
                        days: p.data?.stats?.days_survived || 0,
                        warmth: p.data?.stats?.warmth || 0
                    })).sort((a: any, b: any) => b.days - a.days);
                    setEntries(sorted);
                }
                setLoading(false);
            };
            fetchLeaderboard();
        }
    }, [isOpen, campaignId]);

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[70vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                    <div className="flex items-center gap-2">
                        <Trophy className="text-yellow-500" />
                        <h2 className="text-xl font-bold text-white">Top Survivors</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="text-slate-400" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                    {loading ? (
                        <div className="text-center text-slate-400">Loading...</div>
                    ) : (
                        <div className="space-y-2">
                            {entries.map((entry, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-800/50 p-2 rounded border border-slate-700/50">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold w-6 text-center ${idx < 3 ? 'text-yellow-400' : 'text-slate-500'}`}>
                                            #{idx + 1}
                                        </span>
                                        <span className="text-white font-medium">{entry.name}</span>
                                    </div>
                                    <div className="text-cyan-400 font-mono text-sm">
                                        {entry.days} Days
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </div>
        </div>
    );
};
