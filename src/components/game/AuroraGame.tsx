import React, { useEffect, useState, lazy, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import Game3D from '../../game/Game3D'; // The new Engine Wrapper
import { Loader2, LogOut } from 'lucide-react';
import { gameEvents } from '@/game/EventBus'; // Added

import { GameNotifications } from './GameNotifications';
// import { Lobby } from './Lobby';

import { ChatUI } from './ChatUI';
import { QuestLog } from './QuestLog';
import { DialogueOverlay } from './DialogueOverlay';

// Lazy load heavy components (kept for reference but unused in test mode)

interface AuroraGameProps {
    playerId: string;
    campaignId: string;
    displayName: string;
    className?: string;
}

export const AuroraGame: React.FC<AuroraGameProps> = ({ playerId, campaignId, displayName, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Minimal state for test
    const [isLoading, setIsLoading] = useState(false);

    // Stats (Warmth Removed by Request)
    // const [warmth, setWarmth] = useState(100);
    // const [xp, setXp] = useState(0);
    // const [level, setLevel] = useState(1);
    // const [shards, setShards] = useState(0);

    const [isPlaying, setIsPlaying] = useState(false); // Default to false (Launch Screen)

    // Game Event Listeners
    useEffect(() => {
        if (!isPlaying) return;
        return () => { };
    }, [isPlaying]);

    // Launch Screen (Replaces Lobby)
    if (!isPlaying) {
        return (
            <div className="w-full h-[600px] bg-slate-950 flex flex-col items-center justify-center rounded-xl overflow-hidden border border-slate-800 relative group cursor-pointer" onClick={() => setIsPlaying(true)}>
                <div className="absolute inset-0 bg-[url('/assets/game/frozen_lake.jpg')] bg-cover bg-center opacity-40 transition-opacity group-hover:opacity-60"></div>
                <div className="z-10 text-center space-y-4">
                    <h1 className="text-4xl font-black text-cyan-100 drop-shadow-lg tracking-wider font-mono">NORTH POLE EXPEDITION</h1>
                    <Button
                        size="lg"
                        className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-6 text-xl shadow-cyan-500/20 shadow-2xl scale-125 transition-transform group-hover:scale-110"
                    >
                        ENTER WORLD
                    </Button>
                </div>
            </div>
        );
    }

    // Fullscreen Portal Mode
    return createPortal(
        <div ref={containerRef} className="fixed inset-0 z-[100] flex h-screen w-screen bg-slate-950 overflow-hidden">

            <div className="flex-1 relative bg-black">
                {/* 3D Game Engine */}
                <div className="w-full h-full absolute inset-0">
                    <Game3D />
                </div>

                {/* Exit Button */}
                <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-4 left-4 z-50 rounded-full w-10 h-10 shadow-xl border border-white/20"
                    onClick={() => setIsPlaying(false)}
                    title="Exit Game"
                >
                    <LogOut className="h-4 w-4" />
                </Button>

                {/* Chat UI */}
                <ChatUI campaignId={campaignId} playerName={displayName} playerId={playerId} />

                {/* Stats HUD Removed */}
                {/* <PlayerStatsHUD ... /> */}

                <GameNotifications />

            </div>
        </div>,
        document.body
    );
};
