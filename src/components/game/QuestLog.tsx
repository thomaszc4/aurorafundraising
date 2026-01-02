import React, { useEffect, useState } from 'react';
import { Scroll } from 'lucide-react';

interface QuestStep {
    description: string;
    currentAmount: number;
    targetAmount: number;
    completed: boolean;
}

interface Quest {
    title: string;
    steps: QuestStep[];
}

export const QuestLog: React.FC = () => {
    const [activeQuest, setActiveQuest] = useState<Quest | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Initial fetch
        // Note: QuestSystem assumes singleton usage, so we might need a getter if activeQuest is already set
        // Adding a slight delay to allow system to init or just listening for updates
    }, []);

    useEffect(() => {
        const handleUpdate = (e: Event) => {
            const quest = (e as CustomEvent).detail;
            setActiveQuest(quest);
            setIsVisible(!!quest);
        };

        const handleComplete = (e: Event) => {
            // Maybe show a special completion state before hiding?
            // For now just update
            const quest = (e as CustomEvent).detail;
            setActiveQuest(quest);
        };

        window.addEventListener('game-quest-update', handleUpdate);
        window.addEventListener('game-quest-complete', handleComplete);
        return () => {
            window.removeEventListener('game-quest-update', handleUpdate);
            window.removeEventListener('game-quest-complete', handleComplete);
        };
    }, []);

    if (!activeQuest) return null;

    return (
        <div
            data-testid="quest-log"
            className={`absolute top-24 right-4 z-10 w-72 
                        bg-slate-900/60 backdrop-blur-md border border-white/10 
                        rounded-xl p-5 text-white shadow-2xl 
                        transition-all duration-500 ease-out transform
                        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'}
            `}
        >
            {/* Header with Glow */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>

                <div className="p-2 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-400/30 shadow-[0_0_15px_-3px_rgba(6,182,212,0.3)]">
                    <Scroll className="text-cyan-300 w-5 h-5" />
                </div>

                <div className="flex-1">
                    <h3 className="font-bold text-sm text-cyan-50 tracking-wider uppercase drop-shadow-sm">{activeQuest.title}</h3>
                    <div className="text-[10px] font-mono text-cyan-400/80 leading-none mt-0.5">ACTIVE MISSION</div>
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-4">
                {activeQuest.steps.map((step, idx) => (
                    <div key={idx} className={`relative transition-all duration-300 ${step.completed ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
                        {/* Step Text */}
                        <div className="flex justify-between items-start mb-1.5 pl-1">
                            <span className={`text-xs font-medium leading-relaxed ${step.completed ? 'text-slate-400 line-through decoration-slate-500/50' : 'text-slate-200'}`}>
                                {step.description}
                            </span>
                        </div>

                        {/* Custom Progress Bar */}
                        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner relative">
                            {/* Background Pulse (Subtle) */}
                            {!step.completed && <div className="absolute inset-0 bg-cyan-500/10 animate-pulse"></div>}

                            {/* Fill */}
                            <div
                                className={`h-full transition-all duration-700 ease-out 
                                            ${step.completed ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-blue-400'}
                                            shadow-[0_0_10px_rgba(34,211,238,0.4)]
                                `}
                                style={{ width: `${(step.currentAmount / step.targetAmount) * 100}%` }}
                            />
                        </div>

                        {/* Counter */}
                        <div className="mt-1 flex justify-end">
                            <span className="text-[9px] font-mono text-cyan-300/60 bg-black/20 px-1.5 py-0.5 rounded">
                                {step.currentAmount} / {step.targetAmount}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

