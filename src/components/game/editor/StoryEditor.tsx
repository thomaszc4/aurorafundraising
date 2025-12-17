import React, { useState } from 'react';
import { QuestEditor } from './story/QuestEditor';
import { DialogueEditor } from './story/DialogueEditor';
import { cn } from '@/lib/utils';
import { BookOpen, MessageSquare } from 'lucide-react';

export const StoryEditor = () => {
    const [activeTab, setActiveTab] = useState<'quests' | 'dialogue'>('quests');

    return (
        <div className="w-96 bg-slate-900 border-l border-slate-700 flex flex-col h-full text-slate-200 pointer-events-auto shadow-2xl">
            {/* Header Tabs */}
            <div className="flex bg-slate-950 border-b border-slate-700">
                <button
                    onClick={() => setActiveTab('quests')}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                        activeTab === 'quests' ? "text-blue-400 border-b-2 border-blue-400 bg-slate-900" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
                    )}
                >
                    <BookOpen className="w-4 h-4" /> Quests
                </button>
                <button
                    onClick={() => setActiveTab('dialogue')}
                    className={cn(
                        "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                        activeTab === 'dialogue' ? "text-green-400 border-b-2 border-green-400 bg-slate-900" : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/50"
                    )}
                >
                    <MessageSquare className="w-4 h-4" /> Dialogue
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'quests' ? <QuestEditor /> : <DialogueEditor />}
            </div>
        </div>
    );
};
