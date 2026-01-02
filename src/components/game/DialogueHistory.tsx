import React, { useEffect, useState } from 'react';
import { gameEvents } from '@/game/EventBus';

interface DialogueData {
    speaker: string;
    text: string;
    portrait?: string;
    timestamp: number;
}

export const DialogueHistory: React.FC = () => {
    const [history, setHistory] = useState<DialogueData[]>([]);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleShow = (data: any) => {
            const entry: DialogueData = { ...data, timestamp: Date.now() };
            setHistory(prev => [entry, ...prev].slice(0, 5)); // Keep last 5
            setVisible(true);
        };

        gameEvents.on('game-show-dialogue', handleShow);
        return () => gameEvents.off('game-show-dialogue', handleShow);
    }, []);

    if (history.length === 0) return null;

    return (
        <div className="absolute left-4 bottom-32 w-80 flex flex-col gap-3 z-10 pointer-events-none perspective-[1000px]">
            {/* Header */}
            <div className="flex items-center gap-2 pl-1 mb-1 opacity-70">
                <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                <h3 className="text-[10px] font-bold text-cyan-300 uppercase tracking-[0.2em] drop-shadow-md">Comms Log</h3>
            </div>

            {history.map((entry, i) => (
                <div
                    key={entry.timestamp}
                    className={`
                        transform transition-all duration-500 origin-left
                        ${i === 0 ? 'scale-100 opacity-100 translate-x-0' : 'scale-95 opacity-60 -translate-x-2'}
                        bg-slate-900/40 backdrop-blur-sm border-l-2 
                        ${i === 0 ? 'border-cyan-400 bg-gradient-to-r from-cyan-900/30 to-transparent' : 'border-slate-600'}
                        p-3 rounded-r-lg shadow-lg
                    `}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`font-bold text-xs ${i === 0 ? 'text-cyan-200' : 'text-slate-400'}`}>
                            {entry.speaker}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500/80">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${i === 0 ? 'text-slate-100' : 'text-slate-400'}`}>
                        {entry.text}
                    </p>
                </div>
            ))}
        </div>
    );
};
