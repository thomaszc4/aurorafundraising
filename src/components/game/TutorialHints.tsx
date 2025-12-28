import React, { useEffect, useState } from 'react';
import { Lightbulb, ArrowRight } from 'lucide-react';

interface Hint {
    id: string;
    text: string;
    condition: () => boolean;
}

interface TutorialHintsProps {
    warmth: number;
    inventory: any[];
    isStorm: boolean;
}

export const TutorialHints: React.FC<TutorialHintsProps> = ({ warmth, inventory, isStorm }) => {
    const [currentHint, setCurrentHint] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState<Set<string>>(new Set());

    useEffect(() => {
        const checkHints = () => {
            if (warmth < 30 && !dismissed.has('low_warmth')) {
                setCurrentHint('Your warmth is low! Build a campfire 🪵🔥');
                return;
            }
            if (isStorm && !dismissed.has('storm_warning')) {
                setCurrentHint('A storm is active! Find shelter in an igloo or stay near a fire 🏠');
                return;
            }
            if (inventory.length === 0 && !dismissed.has('first_gather')) {
                setCurrentHint('Go gather some wood and stones to start crafting! 🌲');
                return;
            }

            setCurrentHint(null);
        };

        const interval = setInterval(checkHints, 5000);
        return () => clearInterval(interval);
    }, [warmth, inventory, isStorm, dismissed]);

    if (!currentHint) return null;

    const handleDismiss = () => {
        if (currentHint.includes('warmth')) setDismissed(prev => new Set(prev).add('low_warmth'));
        if (currentHint.includes('storm')) setDismissed(prev => new Set(prev).add('storm_warning'));
        if (currentHint.includes('gather')) setDismissed(prev => new Set(prev).add('first_gather'));
        setCurrentHint(null);
    };

    return (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-40 animate-bounce-in">
            <div className="bg-amber-500/90 border border-amber-300 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 text-amber-950 font-bold max-w-md">
                <div className="bg-amber-100 p-2 rounded-full">
                    <Lightbulb className="w-5 h-5 text-amber-600 animate-pulse" />
                </div>
                <div className="flex-1 text-sm leading-tight">
                    {currentHint}
                </div>
                <button
                    onClick={handleDismiss}
                    className="bg-amber-950/10 hover:bg-amber-950/20 p-1 rounded-full transition-colors"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};
