import React, { useState } from 'react';
import { Smile, ThumbsUp, Heart, HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const EmoteMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const emotes = [
        { id: 'smile', icon: '😊', label: 'Smile' },
        { id: 'thumbs_up', icon: '👍', label: 'Like' },
        { id: 'heart', icon: '❤️', label: 'Love' },
        { id: 'wave', icon: '👋', label: 'Wave' },
        { id: 'help', icon: '🆘', label: 'Help' },
    ];

    const sendEmote = (emote: string) => {
        window.dispatchEvent(new CustomEvent('game-trigger-emote', { detail: { emote } }));
        setIsOpen(false);
    };

    return (
        <div className="absolute bottom-24 right-4 z-40">
            {isOpen ? (
                <div className="bg-black/80 backdrop-blur-sm rounded-lg p-2 flex flex-col gap-2 border border-white/20 animate-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-white uppercase font-bold">Emotes</span>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {emotes.map(e => (
                            <button
                                key={e.id}
                                onClick={() => sendEmote(e.icon)}
                                className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded hover:scale-110 transition-transform text-xl"
                                title={e.label}
                            >
                                {e.icon}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                <Button
                    variant="ghost"
                    size="icon"
                    className="bg-black/50 hover:bg-black/70 rounded-full text-white border border-white/20 h-10 w-10"
                    onClick={() => setIsOpen(true)}
                    title="Emotes"
                >
                    <Smile size={20} />
                </Button>
            )}
        </div>
    );
};
