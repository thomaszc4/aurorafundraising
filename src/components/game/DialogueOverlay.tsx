import React, { useEffect, useState } from 'react';
import { gameEvents } from '@/game/EventBus';

interface DialogueOption {
    label: string;
    action: string;
}

interface DialogueData {
    speaker: string;
    text: string;
    portrait?: string;
    options?: DialogueOption[];
}

export const DialogueOverlay: React.FC = () => {
    const [queue, setQueue] = useState<DialogueData[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        console.log("DialogueOverlay Mounted");
        const handleShow = (data: any) => {
            console.log("DialogueOverlay received game-show-dialogue", data);

            const newQueue = Array.isArray(data) ? data : [data];
            setQueue(newQueue as DialogueData[]);
            setCurrentIndex(0);
            setVisible(true);
        };

        const handleHide = () => {
            setVisible(false);
            setTimeout(() => {
                setQueue([]);
                setCurrentIndex(0);
            }, 300);
        };

        gameEvents.on('game-show-dialogue', handleShow);
        gameEvents.on('game-hide-dialogue', handleHide);

        const handleKeyDown = (e: KeyboardEvent) => {
            if (!visible) return;

            const currentLine = queue[currentIndex];
            // If options exist, force user to pick one.
            if (currentLine?.options && currentLine.options.length > 0) return;

            if (['e', 'enter', ' '].includes(e.key.toLowerCase())) {
                // Advance or Dismiss
                if (currentIndex < queue.length - 1) {
                    setCurrentIndex(prev => prev + 1);
                } else {
                    handleHide();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            gameEvents.off('game-show-dialogue', handleShow);
            gameEvents.off('game-hide-dialogue', handleHide);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [visible, queue, currentIndex]);

    const dismissOrAdvance = () => {
        const currentLine = queue[currentIndex];
        if (currentLine?.options && currentLine.options.length > 0) return;

        if (currentIndex < queue.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setVisible(false);
            setTimeout(() => {
                setQueue([]);
                setCurrentIndex(0);
            }, 300);
        }
    };

    const dialogue = queue[currentIndex];

    // Safety check: if visible is true but no dialogue, don't render (or render empty container)
    if (!dialogue) return null;

    return (
        <div
            className={`cursor-pointer fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 w-[90%] max-w-2xl transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            onClick={dismissOrAdvance}
        >
            <div className="bg-black/90 backdrop-blur-sm rounded-xl border border-cyan-500/30 p-4 flex gap-4 shadow-2xl hover:border-cyan-400/50 transition-colors">
                {/* Portrait */}
                {dialogue.portrait && (
                    <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-cyan-900 to-blue-900 flex items-center justify-center text-4xl border border-cyan-500/30 flex-shrink-0">
                        {dialogue.portrait}
                    </div>
                )}

                {/* Text */}
                <div className="flex-1 flex flex-col">
                    <span className="text-cyan-400 font-bold text-sm mb-1">{dialogue.speaker}</span>
                    <p className="text-white text-base leading-relaxed">{dialogue.text}</p>
                </div>
            </div>

            {/* Options or Continue */}
            <div className="flex flex-col gap-2 mt-4">
                {dialogue.options ? (
                    <div className="grid grid-cols-1 gap-2">
                        {dialogue.options.map((opt, i) => (
                            <button
                                key={i}
                                className="bg-cyan-900/50 hover:bg-cyan-700/80 border border-cyan-500/30 text-white py-2 px-4 rounded transition-colors text-left"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (opt.action === 'solve_riddle') {
                                        gameEvents.emit('game-show-dialogue', {
                                            speaker: "Elder Penguin",
                                            text: "Wisdom you have! The map is yours. Return to the Captain.",
                                            portrait: "🐧"
                                        });
                                        gameEvents.emit('quest-update', { stepId: 'solve_riddle' });
                                    } else if (opt.action === 'wrong_answer') {
                                        gameEvents.emit('game-show-dialogue', {
                                            speaker: "Elder Penguin",
                                            text: "That is incorrect! Try again.",
                                            portrait: "🐧",
                                            options: dialogue.options // loop back
                                        });
                                    }
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="text-center mt-2">
                        <span className="text-white/50 text-xs animate-pulse">Press E or Click to continue</span>
                    </div>
                )}
            </div>
        </div>
    );
};
