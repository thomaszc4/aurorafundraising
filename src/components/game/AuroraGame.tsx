import React, { useEffect, useState, lazy } from 'react';
// import Phaser from 'phaser'; // REMOVED
import { Button } from '@/components/ui/button';
import Game3D from '../../game/Game3D'; // The new Engine Wrapper
import { Loader2 } from 'lucide-react';
import { InventoryItem } from '@/game/types';
import { gameEvents } from '@/game/EventBus'; // Added
import { toast } from 'sonner'; // Added

import { InventorySidebar } from './InventorySidebar';
import { Hotbar } from './Hotbar';
import { PlayerStatsHUD } from './PlayerStatsHUD';
import { TutorialHints } from './TutorialHints';
import { GameNotifications } from './GameNotifications';
import { Lobby } from './Lobby';

import { ChatUI } from './ChatUI';
import { QuestLog } from './QuestLog';
import { Minimap } from './Minimap';
import { SettingsPanel } from './SettingsPanel';
import { PauseMenu } from './PauseMenu';
import { HelpOverlay } from './HelpOverlay';
import { DialogueOverlay } from './DialogueOverlay';

// Lazy load heavy components (kept for reference but unused in test mode)
const Shop = lazy(() => import('./Shop').then(m => ({ default: m.Shop })));
const Leaderboard = lazy(() => import('./Leaderboard').then(m => ({ default: m.Leaderboard })));

interface AuroraGameProps {
    playerId: string;
    campaignId: string;
    displayName: string;
    className?: string;
}

const DEFAULT_INVENTORY: InventoryItem[] = [
    { id: '1', type: 'resource', name: 'Ice Shard', count: 0, icon: '🧊' },
    { id: '2', type: 'resource', name: 'Pine Wood', count: 0, icon: '🌲' },
    { id: '3', type: 'tool', name: 'Pickaxe', count: 1, icon: '⛏️' }
];

export const AuroraGame: React.FC<AuroraGameProps> = ({ playerId, campaignId, displayName, className }) => {
    // const gameRef = useRef<HTMLDivElement>(null); // No longer needed
    // const gameInstanceRef = useRef<Phaser.Game | null>(null); // No longer needed
    const containerRef = useRef<HTMLDivElement>(null);

    // Minimal state for test
    const [isLoading, setIsLoading] = useState(false);
    const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_INVENTORY);
    const [warmth, setWarmth] = useState(100);
    const [xp, setXp] = useState(0);
    const [level, setLevel] = useState(1);
    const [shards, setShards] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Placeholder handlers
    const handleCraft = (itemId: string, cost: any) => { console.log("Craft", itemId); return true; };
    const handleBuy = (itemId: string, cost: number) => { console.log("Buy", itemId); return true; };
    const handlePlace = (item: string) => console.log("Place", item);
    const handleUseItem = (item: string) => console.log("Use", item);

    // Pause Logic (Simplified for now)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsPaused(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // TODO: Connect Pause state to GameEngine inside Game3D if needed

    const [isPlaying, setIsPlaying] = useState(false); // New state to track if game started
    const [isInventoryOpen, setIsInventoryOpen] = useState(false); // Toggle state

    // Game Event Listeners (Sync Engine -> UI)
    useEffect(() => {
        if (!isPlaying) return;

        const handleWarmth = (data: any) => {
            setWarmth(prev => {
                const next = prev + data.change;
                return Math.max(0, Math.min(100, next));
            });
        };

        const handleQuestComplete = (data: any) => {
            // Give rewards based on quest triggers (Simple hardcoded rewards for demo)
            if (data.stepId === 'find_chest') {
                setInventory(prev => {
                    const exists = prev.find(i => i.id === 'artifact');
                    if (exists) return prev;
                    return [...prev, { id: 'artifact', type: 'item', name: 'Ancient Artifact', count: 1, icon: '🏺' }];
                });
                toast.success("Item Found: Ancient Artifact!");
            }
        };

        gameEvents.on('warmth-update', handleWarmth);
        gameEvents.on('quest-update', handleQuestComplete);

        return () => {
            gameEvents.off('warmth-update', handleWarmth);
            gameEvents.off('quest-update', handleQuestComplete);
        };
    }, [isPlaying]);

    // Keybinds
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'i' && !e.ctrlKey && !e.altKey && isPlaying) {
                setIsInventoryOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying]);

    // Phaser Initialization Logic REMOVED
    // Game3D handles its own initialization internally via GameEngine.

    // Handle Lobby Start
    if (!isPlaying) {
        return (
            <div className="w-full h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Lobby
                        playerId={playerId}
                        campaignId={campaignId}
                        displayName={displayName}
                        currentData={{ inventory: [], stats: { warmth: 100 } } as any}
                        onReady={() => setIsPlaying(true)}
                    />
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className={`flex h-screen w-full bg-slate-950 overflow-hidden ${className || ''}`}>
            {/* Left Sidebar (Now Toggleable) */}
            <InventorySidebar
                inventory={inventory}
                onCraft={handleCraft}
                onBuy={handleBuy}
                onPlace={handlePlace}
                isOpen={isInventoryOpen}
                onClose={() => setIsInventoryOpen(false)}
            />

            <div className="flex-1 relative bg-black">
                {/* 3D Game Engine */}
                <div className="w-full h-full absolute inset-0">
                    <Game3D />
                </div>

                {/* Chat UI */}
                <ChatUI campaignId={campaignId} playerName={displayName} playerId={playerId} />

                <ChatUI campaignId={campaignId} playerName={displayName} playerId={playerId} />

                {/* QuestLog moved to Game3D */}
                {/* <Minimap /> Removed by user request */}

                <PlayerStatsHUD warmth={warmth} xp={xp} level={level} shards={shards} />
                <GameNotifications />
                <GameNotifications />
                <HelpOverlay />
                <GameNotifications />
                <HelpOverlay />
                {/* DialogueOverlay moved to Game3D */}
                <SettingsPanel />

                <Hotbar inventory={inventory} onUseItem={handleUseItem} />
                <Button
                    className="fixed top-4 right-28 z-40 rounded-full w-10 h-10 bg-slate-900/80 border border-cyan-500/50 hover:bg-cyan-900/50 hover:border-cyan-400 hover:scale-105 transition-all shadow-xl p-0 flex items-center justify-center"
                    onClick={() => setIsInventoryOpen(prev => !prev)}
                    title="Toggle Backpack (I)"
                >
                    <span className="text-lg">🎒</span>
                </Button>

                <TutorialHints warmth={warmth} inventory={inventory} isStorm={false} />

                <PauseMenu
                    isOpen={isPaused}
                    onResume={() => setIsPaused(false)}
                    onSettings={() => { setIsPaused(false); }}
                    onHelp={() => { setIsPaused(false); }}
                    onQuit={() => window.location.reload()}
                />
            </div>
        </div>
    );
};
