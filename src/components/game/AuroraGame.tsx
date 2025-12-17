import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { HubScene } from '../../game/scenes/HubScene';
import { InventorySidebar } from './InventorySidebar';
import { ChatUI } from './ChatUI';
import { supabase } from '@/integrations/supabase/client';
import { GameData, InventoryItem } from '@/game/types';
import { Loader2, Maximize2, Minimize2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEditorStore, LevelData } from '../../stores/useEditorStore';
import { PassportUI } from './ui/Passport';
import { MapDesignerUI } from './MapDesignerUI';
import { EditorScene } from '../../game/scenes/EditorScene';
import { EditorUI } from '../editor/EditorUI';
import { LeaderboardUI } from './ui/LeaderboardUI';
import { StoryLogUI } from './ui/StoryLogUI';
import { EmoteBar } from './ui/EmoteBar';
import { ChatInput } from './ui/ChatInput';
import { storyManager } from '../../game/systems/StoryManager';
import { DialogueOverlay } from './ui/DialogueOverlay';
import { QuestJournal } from './ui/QuestJournal';

interface AuroraGameProps {
    playerId: string;
    campaignId: string;
    displayName: string;
    className?: string;
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Game Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex h-screen w-full bg-slate-950 items-center justify-center flex-col text-white p-4">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold mb-2">Game Crashed</h1>
                    <p className="text-gray-400 mb-4 text-center max-w-md">Something went wrong. It's not your fault.</p>
                    <code className="bg-black/50 p-2 rounded text-xs mb-4 max-w-lg overflow-auto">
                        {this.state.error?.message}
                    </code>
                    <Button onClick={() => window.location.reload()}>Reload Page</Button>
                </div>
            );
        }
        return this.props.children;
    }
}

const DEFAULT_INVENTORY: InventoryItem[] = [
    { id: '1', type: 'resource', name: 'Ice Shard', count: 0, icon: '🧊' },
    { id: '2', type: 'resource', name: 'Pine Wood', count: 0, icon: '🌲' },
    { id: '3', type: 'tool', name: 'Pickaxe', count: 1, icon: '⛏️' }
];

export const AuroraGame: React.FC<AuroraGameProps> = ({ playerId, campaignId, displayName, className }) => {
    const gameRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [showPassport, setShowPassport] = useState(false);

    // Game State
    const [warmth, setWarmth] = useState(100);
    const [daysSurvived, setDaysSurvived] = useState(0);
    const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_INVENTORY);
    const [dbRecordId, setDbRecordId] = useState<string | null>(null);
    const [interactionTarget, setInteractionTarget] = useState<any>(null); // New Interaction State

    // Weather State
    const [weather, setWeather] = useState<{ isStorm: boolean, timeToNext: number }>({ isStorm: false, timeToNext: 60 });

    // Placement State
    const [pendingPlacement, setPendingPlacement] = useState<{ item: string, cost: { name: string, count: number }[] } | null>(null);

    // 1. Load Data Effect
    useEffect(() => {
        const loadGameData = async () => {
            try {
                const { data } = await supabase
                    .from('game_players' as any)
                    .select('*')
                    .eq('user_id', playerId)
                    .eq('campaign_id', campaignId)
                    .single();

                if (data) {
                    const gameData = (data as any).data as GameData;
                    if (gameData?.inventory) setInventory(gameData.inventory);
                    if (gameData?.stats?.warmth) setWarmth(gameData.stats.warmth);
                    if (gameData?.stats?.days_survived) setDaysSurvived(gameData.stats.days_survived);
                    setDbRecordId((data as any).id);
                } else {
                    const newGameData: GameData = { inventory: DEFAULT_INVENTORY, stats: { warmth: 100, days_survived: 0 } };
                    const { data: newData } = await supabase
                        .from('game_players' as any)
                        .insert({ user_id: playerId, campaign_id: campaignId, display_name: displayName, data: newGameData })
                        .select().single();
                    if (newData) setDbRecordId((newData as any).id);
                }
            } catch (err) {
                console.error("Failed to load game data", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (playerId && campaignId) {
            loadGameData();
        }
    }, [playerId, campaignId]);

    // 2. Auto-Save Effect
    useEffect(() => {
        if (!dbRecordId) return;
        const saveInterval = setInterval(async () => {
            const gameData: GameData = { inventory, stats: { warmth, days_survived: daysSurvived } };
            await supabase.from('game_players' as any).update({ data: gameData, last_seen: new Date().toISOString() }).eq('id', dbRecordId);
        }, 10000);
        return () => clearInterval(saveInterval);
    }, [dbRecordId, inventory, warmth]);

    // 3. Sync Inventory to Phaser
    useEffect(() => {
        if (!gameInstanceRef.current) return;
        const scene = gameInstanceRef.current.scene.getScene('HubScene') as any;
        if (scene && typeof scene.updateInventory === 'function') {
            scene.updateInventory(inventory);
        }
        window.dispatchEvent(new CustomEvent('game-inventory-sync', { detail: inventory }));
    }, [inventory]);

    const [hasWon, setHasWon] = useState(false);
    const handleCancelPlacement = () => setPendingPlacement(null);
    const handleWin = () => setHasWon(true);

    const [showMapDesigner, setShowMapDesigner] = useState(false);
    const [activeMode, setActiveMode] = useState<'play' | 'edit'>('play');

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F1') {
                setShowMapDesigner(prev => !prev);
                const scene = gameInstanceRef.current?.scene.getScene('HubScene') as any;
                if (scene?.toggleMapEditor) scene.toggleMapEditor();
            }
            if (e.key === 'F2') {
                setActiveMode(prev => prev === 'play' ? 'edit' : 'play');
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // 4. Event Listeners (Merged)
    useEffect(() => {
        // Weather
        const handleWeather = (e: Event) => {
            setWeather((e as CustomEvent).detail);
        };

        const handleInventoryAdd = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setInventory(prev => {
                let targetId = '';
                if (detail.type === 'wood') targetId = '2';
                else if (detail.type === 'ice_shard') targetId = '1';

                const exists = prev.find(p => p.id === targetId);
                if (exists) {
                    return prev.map(p => p.id === targetId ? { ...p, count: p.count + detail.amount } : p);
                }
                return prev;
            });
        };

        const handleStatUpdate = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            if (detail.warmth !== undefined) setWarmth(detail.warmth);
            if (detail.day !== undefined) setDaysSurvived(detail.day);
        };

        const handleXpChange = (e: Event) => {
            // Future UI updates
        };

        const handleConfirmPlacement = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setPendingPlacement(current => {
                if (current && current.item === detail.item) {
                    setInventory(prev => prev.map(i => {
                        const costItem = current.cost.find(c => c.name === i.name);
                        if (costItem) return { ...i, count: i.count - costItem.count };
                        return i;
                    }));
                    window.dispatchEvent(new CustomEvent('game-place-item', { detail: { item: detail.item, x: detail.x, y: detail.y } }));
                    return null;
                }
                return current;
            });
        };

        // Interaction Listeners
        const handleInteractionAvailable = (e: Event) => {
            const detail = (e as CustomEvent).detail;
            setInteractionTarget(detail.target);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'KeyE' && interactionTarget && interactionTarget.properties?.dialogueId) {
                storyManager.startDialogue(interactionTarget.properties.dialogueId);
            }
        };


        window.addEventListener('game-weather-update', handleWeather);
        window.addEventListener('game-inventory-add', handleInventoryAdd);
        window.addEventListener('game-stat-update', handleStatUpdate);
        window.addEventListener('game-confirm-placement', handleConfirmPlacement);
        window.addEventListener('game-cancel-placement', handleCancelPlacement);
        window.addEventListener('game-win', handleWin);
        window.addEventListener('xp-change', handleXpChange);
        window.addEventListener('game-interaction-available', handleInteractionAvailable);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('game-weather-update', handleWeather);
            window.removeEventListener('game-inventory-add', handleInventoryAdd);
            window.removeEventListener('game-stat-update', handleStatUpdate);
            window.removeEventListener('game-confirm-placement', handleConfirmPlacement);
            window.removeEventListener('game-cancel-placement', handleCancelPlacement);
            window.removeEventListener('game-win', handleWin);
            window.removeEventListener('xp-change', handleXpChange);
            window.removeEventListener('game-interaction-available', handleInteractionAvailable);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [interactionTarget]); // dependency for keydown closure

    // 5. Game Actions
    const handleBuy = (itemId: string, cost: number) => {
        const shardItem = inventory.find(i => i.name === 'Ice Shard');
        if (!shardItem || shardItem.count < cost) return false;

        const newInventory = [...inventory];
        const shardIndex = newInventory.findIndex(i => i.name === 'Ice Shard');
        if (shardIndex !== -1) newInventory[shardIndex].count -= cost;

        let itemName = '';
        let icon = '';
        if (itemId === 'igloo_kit') { itemName = 'Igloo Kit'; icon = '🏠'; }

        const itemIndex = newInventory.findIndex(i => i.name === itemName);
        if (itemIndex !== -1) newInventory[itemIndex].count += 1;
        else newInventory.push({ id: Math.random().toString(), type: 'structure', name: itemName, count: 1, icon });

        setInventory(newInventory);
        return true;
    };

    const handlePlace = (item: string) => {
        const invItem = inventory.find(i => i.name === item);
        if (!invItem || invItem.count <= 0) return;

        window.dispatchEvent(new CustomEvent('game-enter-placement', {
            detail: { item: item === 'Igloo Kit' ? 'igloo' : item.toLowerCase().replace(' ', '_') }
        }));

        setPendingPlacement({
            item: item === 'Igloo Kit' ? 'igloo' : item.toLowerCase().replace(' ', '_'),
            cost: [{ name: item, count: 1 }]
        });
    };

    const handleCraft = (itemId: string, cost: { name: string; count: number }[]) => {
        const hasResources = cost.every(c => {
            const item = inventory.find(i => i.name === c.name);
            return item && item.count >= c.count;
        });

        if (!hasResources) return false;

        if (itemId === 'campfire' || itemId === 'wall') {
            setPendingPlacement({ item: itemId, cost });
            window.dispatchEvent(new CustomEvent('game-enter-placement', { detail: { item: itemId } }));
            return true;
        }
        else if (itemId === 'coat') {
            const newInventory = [...inventory];
            cost.forEach(c => {
                const idx = newInventory.findIndex(i => i.name === c.name);
                if (idx !== -1) newInventory[idx].count -= c.count;
            });
            const coatIdx = newInventory.findIndex(i => i.name === 'Fur Coat');
            if (coatIdx !== -1) newInventory[coatIdx].count += 1;
            else newInventory.push({ id: Math.random().toString(), type: 'item', name: 'Fur Coat', count: 1, icon: '🧥' });

            setInventory(newInventory);
            return true;
        }

        return false;
    };

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => console.error("Error attempting to enable full-screen mode:", err));
            setIsFullScreen(true);
        } else {
            document.exitFullscreen();
            setIsFullScreen(false);
        }
    };

    const handleUpdateAppearance = (newAppearance: { archetype: string, gender: string }) => {
        if (!gameInstanceRef.current) return;
        const scene = gameInstanceRef.current.scene.getScene('HubScene') as any;
        if (scene && typeof scene.updatePlayerAppearance === 'function') {
            scene.updatePlayerAppearance(newAppearance);
        }
        setShowPassport(false);
    };

    // 6. Game Initialization
    useEffect(() => {
        if (isLoading || !gameRef.current || gameInstanceRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: gameRef.current,
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: '#dbe7eb',
            transparent: false,
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: activeMode === 'edit' ? [EditorScene] : [HubScene],
            pixelArt: false,
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        const game = new Phaser.Game(config);
        gameInstanceRef.current = game;
        (window as any).GAME = game;

        game.scene.start('HubScene', {
            playerId,
            campaignId,
            displayName,
            initialWarmth: warmth
        });

        return () => {
            game.destroy(true);
            gameInstanceRef.current = null;
        };
    }, [isLoading, playerId, campaignId, displayName, activeMode]);

    // DEBUG: Console Overlay (Skipped log override for brevity/stability in overwrite - functionality preserved if needed, but risky to re-inject. Omitting purely to reduce complexity errors.)

    // Logic Node processing
    const currentMap = useEditorStore(state => state.mapData);

    useEffect(() => {
        if (activeMode !== 'play' || !currentMap) return;

        const checkLogic = setInterval(() => {
            const game = gameInstanceRef.current;
            if (!game) return;

            let scene: any = game.scene.getScene('MainScene');
            if (!scene || !scene.player) scene = game.scene.getScene('HubScene');

            if (!scene || !scene.player) return;

            const px = scene.player.x;
            const py = scene.player.y;

            // Check triggers
            currentMap.logic.forEach(node => {
                if (px >= node.x && px <= node.x + node.width &&
                    py >= node.y && py <= node.y + node.height) {

                    if (node.condition && !storyManager.checkCondition(node.condition)) {
                        return;
                    }

                    if (node.type === 'trigger' && node.properties?.message) {
                        const lastTrigger = (window as any)[`trigger_${node.id}`];
                        const now = Date.now();
                        if (!lastTrigger || now - lastTrigger > 5000) {
                            toast(node.properties.message);
                            (window as any)[`trigger_${node.id}`] = now;
                        }
                    }

                    if (node.type === 'event' && node.properties?.action === 'open_leaderboard') {
                        const lastTrigger = (window as any)[`trigger_${node.id}`];
                        const now = Date.now();
                        if (!lastTrigger || now - lastTrigger > 2000) {
                            window.dispatchEvent(new Event('game-open-leaderboard'));
                            (window as any)[`trigger_${node.id}`] = now;
                        }
                    }
                }
            });

            // 3. Check Interactions (NPCs)
            let closestInteractable = null;
            if (activeMode === 'play') {
                currentMap.entities.forEach(ent => {
                    // Check range. Basic dist check.
                    if (ent.properties?.dialogueId) {
                        // Simple distance squared check? Or Phaser distance.
                        // Using simple math to avoid importing Phaser utility inside component if not imported.
                        // We imported Phaser.
                        const dist = Phaser.Math.Distance.Between(px, py, ent.x, ent.y);
                        if (dist < 64) { // 64px range
                            closestInteractable = ent;
                        }
                    }
                });
            }

            if (closestInteractable) {
                window.dispatchEvent(new CustomEvent('game-interaction-available', { detail: { target: closestInteractable } }));
            } else {
                window.dispatchEvent(new CustomEvent('game-interaction-available', { detail: { target: null } }));
            }

        }, 100);

        return () => clearInterval(checkLogic);
    }, [activeMode, currentMap]);

    return (
        <ErrorBoundary>
            <div ref={containerRef} className={`flex h-screen w-full overflow-hidden ${className || ''}`} style={{ backgroundColor: '#dbe7eb' }}>

                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900 text-white z-50">
                        <Loader2 className="w-10 h-10 animate-spin mb-4" />
                        <p>Loading Expedition...</p>
                    </div>
                )}

                {!isLoading && (
                    <>
                        {/* Multiplayer UI */}
                        <LeaderboardUI />
                        <StoryLogUI campaignId={campaignId} />
                        <DialogueOverlay />
                        <QuestJournal />

                        {/* Editor / Passport */}
                        {showPassport && (
                            <PassportUI
                                initialAppearance={{ archetype: 'alpinist', gender: 'm' }}
                                onSave={handleUpdateAppearance}
                                onClose={() => setShowPassport(false)}
                            />
                        )}

                        {/* Storm Warning */}
                        {weather.timeToNext < 10 && (
                            <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-orange-800/80 text-white px-4 py-1 rounded-lg border border-orange-500 z-20">
                                Storm approaching in {weather.timeToNext}s...
                            </div>
                        )}
                    </>
                )}


                {/* HUD: Warmth Bar */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end pointer-events-none">
                    <div className="w-48 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
                        <div className="flex justify-between text-xs text-white mb-1">
                            <span>Warmth</span>
                            <span>{Math.round(warmth)}%</span>
                        </div>
                        <div className="h-2 w-full bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${warmth < 30 ? 'bg-red-500' : 'bg-orange-400'}`}
                                style={{ width: `${warmth}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Bottom Tools */}
                <div className="absolute bottom-4 right-4 z-10 flex gap-2">
                    <Button variant="secondary" size="icon" onClick={() => setShowPassport(true)} className="bg-slate-800 text-white border-slate-600 hover:bg-slate-700" title="Edit Appearance">
                        <User className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon" onClick={toggleFullScreen}>
                        {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Inventory */}
                {!isLoading && activeMode === 'play' && (
                    <InventorySidebar inventory={inventory} onBuy={handleBuy} onCraft={handleCraft} onPlace={handlePlace} />
                )}

                {/* Chat */}
                {!isLoading && activeMode === 'play' && (
                    <>
                        <ChatUI campaignId={campaignId} playerName={displayName} />
                        <EmoteBar />
                    </>
                )}

                {/* Guide Text */}
                {pendingPlacement && (
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-2 rounded-full text-sm z-20 animate-pulse border border-green-500/50">
                        Placing {pendingPlacement.item}... Click to Build. Right Click to Cancel.
                    </div>
                )}

                {/* Interaction Prompt */}
                {activeMode === 'play' && interactionTarget && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-16 pointer-events-none z-30 flex flex-col items-center animate-in fade-in zoom-in duration-200">
                        <div className="bg-black/80 text-white px-3 py-1 rounded-t text-xs uppercase font-bold tracking-wider">Talk</div>
                        <div className="bg-white text-black h-8 w-8 flex items-center justify-center rounded-full font-bold border-2 border-black shadow-lg">E</div>
                    </div>
                )}

                {/* 2. Editor UI Overlay */}
                {!isLoading && activeMode === 'edit' && (
                    <EditorUI />
                )}
            </div>

            {/* Victory Screen */}
            {hasWon && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md text-white animate-in fade-in duration-1000">
                    <h1 className="text-6xl font-bold text-yellow-500 mb-4 animate-bounce">VICTORY!</h1>
                    <p className="text-2xl mb-8">Signal Fire Lit! Rescue is coming!</p>
                    <div className="flex gap-4">
                        <Button onClick={() => window.location.reload()}>Play Again</Button>
                    </div>
                </div>
            )}
        </ErrorBoundary >
    );
};
