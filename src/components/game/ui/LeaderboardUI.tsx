import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LeaderboardEntry {
    id: string;
    display_name: string;
    score: number;
    avatar_seed?: string;
}

export const LeaderboardUI: React.FC = () => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetchLeaderboard();

        // Realtime Subscription
        const channel = supabase
            .channel('leaderboard_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'game_players' },
                () => {
                    // Simple re-fetch on any change for now
                    fetchLeaderboard();
                }
            )
            .subscribe();

        // External Trigger
        const handleOpen = () => setIsOpen(true);
        window.addEventListener('game-open-leaderboard', handleOpen);

        return () => {
            supabase.removeChannel(channel);
            window.removeEventListener('game-open-leaderboard', handleOpen);
        };
    }, []);

    const fetchLeaderboard = async () => {
        const { data } = await supabase
            .from('game_players' as any)
            .select('id, display_name, score, avatar_seed')
            .order('score', { ascending: false })
            .limit(10);

        if (data) {
            setEntries(data as any[]);
        }
    };

    if (!isOpen) {
        return (
            <div
                className="absolute top-20 right-4 bg-black/50 p-2 rounded-full cursor-pointer hover:bg-black/70 transition-colors pointer-events-auto z-50"
                onClick={() => setIsOpen(true)}
            >
                <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
        );
    }

    return (
        <div className="absolute top-20 right-4 w-64 bg-slate-900/90 border border-slate-700 rounded-lg shadow-xl overflow-hidden pointer-events-auto flex flex-col animate-in fade-in slide-in-from-right-10 z-50">
            <div className="flex items-center justify-between p-3 bg-slate-950/50 border-b border-slate-800">
                <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-slate-100 text-sm">Top Fundraisers</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white text-lg leading-none"
                >
                    &times;
                </button>
            </div>

            <ScrollArea className="h-64 p-2">
                <div className="space-y-1">
                    {entries.map((entry, index) => (
                        <div key={entry.id} className="flex items-center justify-between p-2 rounded bg-slate-800/50 text-sm">
                            <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold w-4 text-center ${index < 3 ? 'text-yellow-400' : 'text-slate-500'}`}>
                                    {index + 1}
                                </span>
                                <span className="text-slate-200 truncate max-w-[100px]">{entry.display_name}</span>
                            </div>
                            <span className="font-mono text-green-400 font-bold">{entry.score}</span>
                        </div>
                    ))}
                    {entries.length === 0 && (
                        <div className="text-center text-slate-500 py-4 text-xs">No entries yet</div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};
