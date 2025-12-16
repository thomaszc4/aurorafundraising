import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MainScene } from '../../game/scenes/MainScene';
import { InventorySidebar } from './InventorySidebar';
import { ChatUI } from './ChatUI';
import { supabase } from '@/integrations/supabase/client';
import { GameData, InventoryItem } from '@/game/types';
import { Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    const gameRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isFullScreen, setIsFullScreen] = useState(false);

    // Game State
    const [warmth, setWarmth] = useState(100);
    const [daysSurvived, setDaysSurvived] = useState(0);
    const [inventory, setInventory] = useState<InventoryItem[]>(DEFAULT_INVENTORY);
    const [dbRecordId, setDbRecordId] = useState<string | null>(null);

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
                    const newGameData: GameData = { inventory: DEFAULT_INVENTORY, stats: { warmth: 100 } };
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
        const scene = gameInstanceRef.current.scene.getScene('MainScene') as any;
        if (scene && scene.updateInventory) {
            scene.updateInventory(inventory);
        }
        window.dispatchEvent(new CustomEvent('game-inventory-sync', { detail: inventory }));
    }, [inventory]);

    const [hasWon, setHasWon] = useState(false);
    const handleCancelPlacement = () => setPendingPlacement(null);
    const handleWin = () => setHasWon(true);

    // 4. Event Listeners
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

        window.addEventListener('game-weather-update', handleWeather);
        window.addEventListener('game-inventory-add', handleInventoryAdd);
        window.addEventListener('game-stat-update', handleStatUpdate);
        window.addEventListener('game-confirm-placement', handleConfirmPlacement);
        window.addEventListener('game-cancel-placement', handleCancelPlacement);
        window.addEventListener('game-win', handleWin);
        window.addEventListener('xp-change', handleXpChange);

        return () => {
            window.removeEventListener('game-weather-update', handleWeather);
            window.removeEventListener('game-inventory-add', handleInventoryAdd);
            window.removeEventListener('game-stat-update', handleStatUpdate);
            window.removeEventListener('game-confirm-placement', handleConfirmPlacement);
            window.removeEventListener('game-cancel-placement', handleCancelPlacement);
            window.removeEventListener('game-win', handleWin);
            window.removeEventListener('xp-change', handleXpChange);
        };
    }, []);

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

        // If it's a placeable item, enter placement mode
        if (itemId === 'campfire' || itemId === 'wall') {
            setPendingPlacement({ item: itemId, cost });
            window.dispatchEvent(new CustomEvent('game-enter-placement', { detail: { item: itemId } }));
            return true;
        }
        // If it's a wearable like Coat
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

    // 6. Game Initialization
    useEffect(() => {
        if (isLoading || !gameRef.current || gameInstanceRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.CANVAS, // Fallback to Canvas to avoid WebGL errors on some devices
            parent: gameRef.current,
            width: '100%',
            height: '100%',
            backgroundColor: '#dbe7eb', // Snow background to hide loading/transparency
            pixelArt: true, // Critical for pixel art assets
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false,
                },
            },
            scene: [MainScene],
            scale: {
                mode: Phaser.Scale.RESIZE,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        const game = new Phaser.Game(config);
        gameInstanceRef.current = game;

        game.scene.start('MainScene', {
            playerId,
            campaignId,
            displayName,
            initialWarmth: warmth
        });

        return () => {
            game.destroy(true);
            gameInstanceRef.current = null;
        };
    }, [isLoading, playerId, campaignId, displayName]);

    return (
        <div ref={containerRef} className={`flex h-screen w-full bg-slate-950 overflow-hidden ${className || ''}`}>
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-white" />
                </div>
            )}

            {/* Left Sidebar */}
            <InventorySidebar
                inventory={inventory}
                onCraft={handleCraft}
                onBuy={handleBuy}
                onPlace={handlePlace}
            />

            {/* Chat UI */}
            <ChatUI campaignId={campaignId} playerName={displayName} />

            {/* Game Area */}
            <div className="flex-1 relative bg-black">
                <div ref={gameRef} className="w-full h-full" />

                {/* HUD: Weather Warning */}
                {weather.isStorm ? (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-900/80 text-white px-6 py-2 rounded-lg border border-red-500 animate-pulse z-20 flex items-center gap-2">
                        <span className="text-2xl">⚠️</span>
                        <div className="flex flex-col items-center">
                            <span className="font-bold text-lg">BLIZZARD ACTIVE</span>
                            <span className="text-sm">FIND SHELTER! FIRE EXTINGUISHED!</span>
                        </div>
                    </div>
                ) : weather.timeToNext < 10 ? (
                    <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-orange-800/80 text-white px-4 py-1 rounded-lg border border-orange-500 z-20">
                        Storm approaching in {weather.timeToNext}s...
                    </div>
                ) : null}

                {/* HUD: Warmth Bar */}
                <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                    <div className="w-48 bg-black/50 p-2 rounded-lg backdrop-blur-sm pointer-events-none">
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
                    <Button variant="secondary" size="icon" onClick={toggleFullScreen}>
                        {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Guide Text */}
                {pendingPlacement && (
                    <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-2 rounded-full text-sm z-20 animate-pulse border border-green-500/50">
                        Placing {pendingPlacement.item}... Click to Build. Right Click to Cancel.
                    </div>
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
        </div>
    );
};
