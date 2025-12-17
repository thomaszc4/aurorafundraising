import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DialogueOption } from '@/game/types/StoryTypes';
import { storyManager } from '@/game/systems/StoryManager';
import { motion, AnimatePresence } from 'framer-motion';

export const DialogueOverlay = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [text, setText] = useState('');
    const [speaker, setSpeaker] = useState('NPC');
    const [options, setOptions] = useState<DialogueOption[]>([]);

    useEffect(() => {
        const handleStart = (e: any) => {
            setIsOpen(true);
            setText(e.detail.text);
            // Speaker is currently hardcoded in manager or needs to be passed
            // For now, manager passes text/options. We might need to update manager to pass speaker.
            // But let's assume default for now or parse from text if we change format.
            // Actually, DialogueNode has `speaker`. Manager dispatch event needs to include it.
            // Let's update manager later or safeguard here. A quick fix is to check the detail.
            setSpeaker(e.detail.speaker || 'Unknown');
            setOptions(e.detail.options || []);
        };

        const handleNext = (e: any) => {
            setText(e.detail.text);
            setSpeaker(e.detail.speaker || 'Unknown');
            setOptions(e.detail.options || []);
        };

        const handleEnd = () => {
            setIsOpen(false);
        };

        window.addEventListener('dialogue-start', handleStart);
        window.addEventListener('dialogue-next', handleNext);
        window.addEventListener('dialogue-end', handleEnd);

        return () => {
            window.removeEventListener('dialogue-start', handleStart);
            window.removeEventListener('dialogue-next', handleNext);
            window.removeEventListener('dialogue-end', handleEnd);
        };
    }, []);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="absolute inset-0 z-50 flex items-end justify-center pointer-events-none pb-12">
                <motion.div
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 50, opacity: 0 }}
                    className="w-[800px] bg-slate-950/90 border border-slate-700 rounded-lg shadow-2xl overflow-hidden pointer-events-auto flex flex-col"
                >
                    {/* Speaker Header */}
                    <div className="bg-slate-900/50 px-6 py-2 border-b border-slate-800">
                        <span className="font-bold text-lg text-blue-400">{speaker}</span>
                    </div>

                    {/* Dialogue Text */}
                    <div className="p-6 text-xl text-slate-100 min-h-[120px] font-serif leading-relaxed">
                        {text}
                    </div>

                    {/* Options */}
                    <div className="p-4 bg-slate-900/30 flex flex-col gap-2">
                        {options.map((opt, idx) => (
                            <Button
                                key={idx}
                                variant="secondary"
                                className="w-full justify-start text-left normal-case text-lg hover:bg-blue-900/30 hover:text-blue-200 transition-colors"
                                onClick={() => storyManager.selectOption(idx)}
                            >
                                <span className="mr-2 text-blue-500">▶</span> {opt.text}
                            </Button>
                        ))}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
