import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './engine/GameEngine';
import { Loader } from 'lucide-react';
import { DialogueOverlay } from '@/components/game/DialogueOverlay';
import { QuestLog } from '@/components/game/QuestLog';
import { DialogueHistory } from '@/components/game/DialogueHistory';
import { QuestItemDisplay } from '@/components/game/QuestItemDisplay';

const Game3D: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showJournal, setShowJournal] = useState(false);

    useEffect(() => {
        if (!mountRef.current) return;

        // Init Engine
        const engine = new GameEngine();
        engineRef.current = engine;

        const start = async () => {
            setIsLoading(true);
            await engine.init(mountRef.current!);
            setIsLoading(false);
        };

        start();

        return () => {
            engine.dispose();
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50 text-white flex-col gap-4">
                    <Loader className="w-12 h-12 animate-spin text-cyan-400" />
                    <div className="text-xl font-vt323 tracking-widest">LOADING NORTH POLE...</div>
                </div>
            )}
            <div ref={mountRef} style={{ width: '100%', height: '100%' }} />
            <DialogueOverlay />

            {/* Journal Toggle Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    console.log("Toggle Journal Clicked");
                    setShowJournal(!showJournal);
                }}
                className="absolute top-4 right-4 z-[100] p-3 bg-black/40 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/10 transition-all group cursor-pointer pointer-events-auto"
                title="Toggle Journal"
            >
                <div className="w-6 h-6 text-cyan-300 group-hover:text-white transition-colors">
                    📖
                </div>
            </button>

            {/* Journal Area (Always mounted to catch events/preserve history, toggled via CSS) */}
            <div className={`transition-opacity duration-300 ${showJournal ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <QuestLog />
                <DialogueHistory />
            </div>

            {/* Always show Inventory Wizard */}
            <QuestItemDisplay />
        </div>
    );
};

export default Game3D;
