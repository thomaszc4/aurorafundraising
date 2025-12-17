import React, { useEffect, useState } from 'react';
import { storyManager } from '@/game/systems/StoryManager';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const QuestJournal = () => {
    const [isOpen, setIsOpen] = useState(false);
    // Since storyManager activeQuests is a private map, we need a way to get state.
    // Ideally useEditorStore should hold runtime quests OR we subscribe to events to update local state.
    // For simplicity, let's assume we subscribe to events and fetch from a getActiveQuests method (that we might need to expose).
    // Or we can just use the store if we move runtime state there.
    // Current design: StoryManager has state.
    // Let's rely on an accessor in Manager or make it public for now.
    // I need to add `trackActiveQuests` hook or similar.
    // For now, I will add `getActiveQuests()` to StoryManager in a quick edit next.

    // Quick Hack: Local state mirroring
    const [quests, setQuests] = useState<any[]>([]);

    useEffect(() => {
        const toggle = (e: KeyboardEvent) => {
            if (e.code === 'KeyJ') setIsOpen(prev => !prev);
        };
        window.addEventListener('keydown', toggle);

        const updateQuests = () => {
            // We need to request quests from manager. 
            // I'll add a static getter or make activeQuests public.
            // Actually, let's use the window object hack for now if manager is global.
            // Or better, let's update StoryManager to expose `getAllQuests()`.

            // Assuming storyManager is imported
            // setQuests(storyManager.getAllQuests()); 

            // For now, let's dispatch a custom event 'request-quest-sync' and listen for response? 
            // Too complex. I will just access it if I modify manager to include a getter.

            // Placeholder:
            setQuests(Array.from((storyManager as any).activeQuests.values()));
        };

        window.addEventListener('quest-accepted', updateQuests);
        window.addEventListener('quest-updated', updateQuests);
        window.addEventListener('quest-completed', updateQuests);

        // Initial load
        updateQuests();

        return () => {
            window.removeEventListener('keydown', toggle);
            window.removeEventListener('quest-accepted', updateQuests);
            window.removeEventListener('quest-updated', updateQuests);
            window.removeEventListener('quest-completed', updateQuests);
        };
    }, []);

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none bg-black/60 backdrop-blur-sm">
            <div className="w-[600px] h-[700px] bg-amber-50 rounded-lg shadow-2xl flex flex-col pointer-events-auto border-4 border-amber-900/50 overflow-hidden font-serif text-amber-950">
                {/* Header */}
                <div className="bg-amber-900/10 p-6 border-b border-amber-900/20 flex items-center gap-3">
                    <Book className="w-8 h-8 text-amber-900" />
                    <h2 className="text-3xl font-bold tracking-tight">Journal</h2>
                    <div className="ml-auto text-sm text-amber-900/60 font-mono">Press 'J' to Close</div>
                </div>

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* List */}
                    <div className="w-1/3 border-r border-amber-900/10 bg-amber-900/5">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-2">
                                {quests.length === 0 && <div className="text-amber-900/40 text-sm italic">No active quests.</div>}
                                {quests.map(q => (
                                    <div key={q.id} className="font-bold text-lg p-2 rounded hover:bg-amber-900/10 cursor-pointer">
                                        {q.title}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Details */}
                    <div className="flex-1 p-6 overflow-y-auto">
                        {quests.map(q => (
                            <div key={q.id} className="mb-8">
                                <h3 className="text-2xl font-bold mb-2">{q.title}</h3>
                                <p className="text-amber-900/80 mb-6 italic">{q.description}</p>

                                <div className="space-y-3">
                                    {q.steps.map((step: any) => (
                                        <div key={step.id} className={cn("flex items-start gap-3", step.isCompleted ? "opacity-50" : "")}>
                                            {step.isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" /> : <Circle className="w-5 h-5 text-amber-900/40 mt-1" />}
                                            <div>
                                                <div className={cn("text-lg", step.isCompleted && "line-through")}>{step.description}</div>
                                                {step.type === 'collect' && (
                                                    <div className="text-sm text-amber-900/50">
                                                        Progress: {0} / {step.count || 1}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
