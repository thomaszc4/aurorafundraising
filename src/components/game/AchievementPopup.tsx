import React, { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';
import { Achievement } from '@/game/systems/AchievementSystem';

export const AchievementPopup: React.FC = () => {
    const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleUnlock = (e: Event) => {
            const ach = (e as CustomEvent).detail as Achievement;
            setCurrentAchievement(ach);
            setIsVisible(true);

            // Auto-hide after 5 seconds
            setTimeout(() => {
                setIsVisible(false);
                setTimeout(() => setCurrentAchievement(null), 500);
            }, 5000);
        };

        window.addEventListener('game-achievement-unlocked', handleUnlock);
        return () => window.removeEventListener('game-achievement-unlocked', handleUnlock);
    }, []);

    if (!currentAchievement || !isVisible) return null;

    return (
        <div className="fixed top-20 right-4 z-[200] animate-bounce-in">
            <div className="bg-gradient-to-r from-yellow-600/90 to-amber-500/90 border-2 border-yellow-400 p-4 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.5)] flex items-center gap-4 min-w-[300px]">
                <div className="relative">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                        {currentAchievement.icon}
                    </div>
                    <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                        <Star className="w-3 h-3 text-yellow-900 fill-current" />
                    </div>
                </div>

                <div className="flex-1">
                    <div className="text-yellow-100 text-[10px] font-bold tracking-widest uppercase mb-0.5 flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        Achievement Unlocked
                    </div>
                    <div className="text-white font-black text-lg leading-tight tracking-tight">
                        {currentAchievement.title}
                    </div>
                    <div className="text-yellow-100/80 text-xs">
                        {currentAchievement.description}
                    </div>
                </div>
            </div>
        </div>
    );
};
