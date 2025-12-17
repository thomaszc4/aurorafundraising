import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, BookOpen } from 'lucide-react';

interface LogEntry {
    id: string;
    type: string;
    message: string;
    data?: any;
    created_at: string;
}

export const StoryLogUI: React.FC<{ campaignId: string }> = ({ campaignId }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isOpen, setIsOpen] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchLogs();

        const channel = supabase
            .channel(`campaign_log_${campaignId}`)
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'campaign_events', filter: `campaign_id=eq.${campaignId}` },
                (payload) => {
                    const newLog = payload.new as LogEntry;
                    setLogs(prev => [newLog, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [campaignId]);

    const fetchLogs = async () => {
        const { data } = await supabase
            .from('campaign_events')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            setLogs(data as any[]);
        }
    };

    if (!isOpen) {
        return (
            <div
                className="absolute bottom-4 left-4 bg-black/50 p-2 rounded-full cursor-pointer hover:bg-black/70 transition-colors pointer-events-auto"
                onClick={() => setIsOpen(true)}
            >
                <BookOpen className="w-6 h-6 text-blue-400" />
            </div>
        );
    }

    return (
        <div className="absolute bottom-4 left-4 w-80 bg-slate-900/90 border border-slate-700 rounded-lg shadow-xl overflow-hidden pointer-events-auto flex flex-col flex-col-reverse animate-in fade-in slide-in-from-left-10" style={{ maxHeight: '300px' }}>
            <div className="flex items-center justify-between p-2 bg-slate-950/50 border-t border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-slate-100 text-sm">Campaign Log</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="text-slate-400 hover:text-white text-lg leading-none"
                >
                    &minus;
                </button>
            </div>

            <ScrollArea className="flex-1 p-2">
                <div className="space-y-2 flex flex-col-reverse">
                    {logs.map((log) => (
                        <div key={log.id} className={`p-2 rounded text-xs border-l-2 ${getLogStyle(log.type)}`}>
                            <div className="font-bold opacity-80 mb-0.5 uppercase text-[10px]">{log.type.replace('_', ' ')}</div>
                            <div className="text-white">{log.message}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{new Date(log.created_at).toLocaleTimeString()}</div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="text-center text-slate-500 py-4 text-xs">Quiet on the island...</div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};

function getLogStyle(type: string) {
    switch (type) {
        case 'milestone_unlocked': return 'bg-yellow-900/20 border-yellow-500';
        case 'quest_complete': return 'bg-green-900/20 border-green-500';
        case 'danger': return 'bg-red-900/20 border-red-500';
        default: return 'bg-slate-800/50 border-slate-500';
    }
}
