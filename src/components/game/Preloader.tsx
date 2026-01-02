import React, { useEffect, useState } from 'react';

interface PreloaderProps {
    onComplete: () => void;
    minDisplayTime?: number;
}

export const Preloader: React.FC<PreloaderProps> = ({ onComplete, minDisplayTime = 2000 }) => {
    const [progress, setProgress] = useState(0);
    const [tip, setTip] = useState('');

    const tips = [
        "Stay near campfires to keep warm!",
        "Collect wood and ice to craft items.",
        "Watch out for blizzards - find shelter!",
        "Talk to NPCs for quests and rewards.",
        "Build an Igloo to survive the storm.",
        "Light the Signal Fire to win!"
    ];

    useEffect(() => {
        setTip(tips[Math.floor(Math.random() * tips.length)]);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + Math.random() * 15;
            });
        }, 200);

        const timer = setTimeout(() => {
            onComplete();
        }, minDisplayTime);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900">
            {/* Snowflake animation (CSS) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute text-white/20 animate-fall"
                        style={{
                            left: `${Math.random() * 100}%`,
                            animationDelay: `${Math.random() * 5}s`,
                            animationDuration: `${5 + Math.random() * 5}s`,
                            fontSize: `${10 + Math.random() * 20}px`
                        }}
                    >
                        ❄
                    </div>
                ))}
            </div>

            {/* Logo */}
            <h1 className="text-5xl font-bold text-cyan-400 mb-8 drop-shadow-lg animate-pulse">
                Aurora Survival
            </h1>

            {/* Progress Bar */}
            <div className="w-64 h-3 bg-slate-700 rounded-full overflow-hidden mb-4">
                <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                />
            </div>

            <p className="text-white/60 text-sm mb-8">Loading assets...</p>

            {/* Tip */}
            <div className="bg-black/30 px-6 py-3 rounded-lg border border-white/10 max-w-md text-center">
                <p className="text-cyan-300 text-sm">💡 {tip}</p>
            </div>
        </div>
    );
};
