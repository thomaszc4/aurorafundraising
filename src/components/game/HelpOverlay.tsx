import React, { useEffect, useState } from 'react';
import { X, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const HelpOverlay: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [hasSeenHelp, setHasSeenHelp] = useState(false);

    useEffect(() => {
        // Show on first visit
        const seen = localStorage.getItem('aurora_help_seen');
        if (!seen) {
            setIsOpen(true);
            localStorage.setItem('aurora_help_seen', 'true');
        }
        setHasSeenHelp(!!seen);

        // Toggle with H key
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.altKey) {
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    const controls = [
        { key: 'W A S D', action: 'Move character' },
        { key: 'Arrow Keys', action: 'Move character (alt)' },
        { key: 'E', action: 'Interact / Gather' },
        { key: 'I', action: 'Toggle Inventory' },
        { key: 'H', action: 'Toggle this help' },
        { key: 'Esc', action: 'Cancel / Close' },
    ];

    const tips = [
        '🔥 Build campfires to stay warm!',
        '🏠 Igloos protect you during storms.',
        '❄️ Storms extinguish campfires - find shelter!',
        '🐧 Talk to NPCs for quests and rewards.',
        '🎯 Light the Signal Fire to win!',
    ];

    if (!isOpen) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 right-16 z-40 bg-black/50 hover:bg-black/70 text-white border border-white/20"
                onClick={() => setIsOpen(true)}
                title="Help (H)"
            >
                <Keyboard className="w-5 h-5" />
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 rounded-xl border border-cyan-500/30 p-6 max-w-lg w-full mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                        <Keyboard className="w-6 h-6" />
                        Controls & Help
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Controls Grid */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                    {controls.map(c => (
                        <div key={c.key} className="flex items-center gap-3 bg-black/30 rounded-lg px-3 py-2">
                            <kbd className="bg-slate-700 px-2 py-1 rounded text-xs font-mono text-cyan-300 min-w-[60px] text-center">
                                {c.key}
                            </kbd>
                            <span className="text-white text-sm">{c.action}</span>
                        </div>
                    ))}
                </div>

                {/* Tips */}
                <div className="border-t border-white/10 pt-4">
                    <h3 className="text-sm font-semibold text-gray-400 mb-3">SURVIVAL TIPS</h3>
                    <ul className="space-y-2">
                        {tips.map((tip, i) => (
                            <li key={i} className="text-white/80 text-sm">{tip}</li>
                        ))}
                    </ul>
                </div>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <span className="text-gray-500 text-xs">Press H to toggle this menu anytime</span>
                </div>
            </div>
        </div>
    );
};
