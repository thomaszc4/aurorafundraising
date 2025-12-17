import React, { useState } from 'react';
import { Package, Hammer, Flame, ShoppingCart, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { InventoryItem } from '@/game/types';

interface InventorySidebarProps {
    inventory: InventoryItem[];
    onCraft: (item: string, cost: { name: string; count: number }[]) => boolean;
    onBuy: (item: string, cost: number) => boolean;
    onPlace: (item: string) => void;
}

export const InventorySidebar: React.FC<InventorySidebarProps> = ({ inventory, onCraft, onBuy, onPlace }) => {
    const [activeTab, setActiveTab] = useState<'inventory' | 'crafting' | 'shop'>('inventory');

    const recipes = [
        {
            id: 'campfire',
            name: 'Campfire',
            icon: <Flame className="h-5 w-5 text-orange-500" />,
            description: "Warmth source.",
            cost: [{ name: 'Pine Wood', count: 5 }]
        },
        {
            id: 'wall',
            name: 'Stone Wall',
            icon: <div className="h-5 w-5 bg-gray-500 rounded-sm"></div>,
            description: "Defense.",
            cost: [{ name: 'Ice Shard', count: 2 }]
        },
        {
            id: 'coat',
            name: 'Fur Coat',
            icon: <Shield className="h-5 w-5 text-amber-700" />,
            description: "Reduces cold.",
            cost: [{ name: 'Pine Wood', count: 10 }, { name: 'Ice Shard', count: 5 }]
        },
        {
            id: 'signal_fire',
            name: 'Signal Fire',
            icon: <Flame className="h-5 w-5 text-red-600 animate-pulse" />,
            description: "Rescue Beacon (Win Game).",
            cost: [{ name: 'Pine Wood', count: 50 }, { name: 'Ice Shard', count: 50 }]
        }
    ];

    const shopItems = [
        {
            id: 'igloo_kit',
            name: 'Igloo Kit',
            icon: <div className="h-5 w-5 bg-white rounded-t-full border border-blue-200"></div>,
            description: "Cozy shelter.",
            cost: 50
        }
    ];

    const canCraft = (cost: { name: string; count: number }[]) => {
        return cost.every(c => {
            const item = inventory.find(i => i.name === c.name);
            return item && item.count >= c.count;
        });
    };

    const canBuy = (cost: number) => {
        const shards = inventory.find(i => i.name === 'Ice Shard');
        return (shards?.count || 0) >= cost;
    };

    return (
        <div className="w-80 h-full bg-background/95 border-r border-border flex flex-col shadow-xl z-10">
            <div className="p-4 border-b border-border bg-muted/20">
                <h2 className="font-bold text-lg mb-4">Survival Kit</h2>
                <div className="flex gap-1 bg-muted p-1 rounded-lg">
                    <button onClick={() => setActiveTab('inventory')} className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition-all", activeTab === 'inventory' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50")}>
                        <Package className="h-4 w-4" />
                    </button>
                    <button onClick={() => setActiveTab('crafting')} className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition-all", activeTab === 'crafting' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50")}>
                        <Hammer className="h-4 w-4" />
                    </button>
                    <button onClick={() => setActiveTab('shop')} className={cn("flex-1 flex items-center justify-center gap-2 py-1.5 text-sm font-medium rounded-md transition-all", activeTab === 'shop' ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-background/50")}>
                        <ShoppingCart className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {activeTab === 'inventory' ? (
                    <div className="grid grid-cols-4 gap-2">
                        {/* Display inventory slots */}
                        {inventory.map((item, index) => (
                            <div key={index}
                                role="button"
                                tabIndex={0}
                                className="aspect-square bg-secondary/10 border border-border rounded-md flex flex-col items-center justify-center relative group cursor-pointer hover:bg-secondary/20 transition-colors focus:ring-2 focus:ring-ring focus:outline-none"
                                onClick={() => {
                                    if (item.name === 'Campfire' || item.name === 'Igloo Kit' || item.name === 'Stone Wall') {
                                        onPlace(item.name);
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        if (item.name === 'Campfire' || item.name === 'Igloo Kit' || item.name === 'Stone Wall') {
                                            onPlace(item.name);
                                        }
                                    }
                                }}
                            >
                                <div className="text-xl">{item.icon || '📦'}</div>
                                <div className="absolute bottom-0 right-0 text-[10px] font-bold bg-background/80 px-1 rounded-tl-md">{item.count}</div>
                                <div className="absolute inset-0 bg-black/80 text-white text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md text-center p-1">
                                    {item.name}
                                </div>
                            </div>
                        ))}
                        {/* Empty slots filler */}
                        {Array.from({ length: Math.max(0, 20 - inventory.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="aspect-square bg-muted/10 border border-border/50 rounded-md"></div>
                        ))}
                    </div>
                ) : activeTab === 'crafting' ? (
                    <div className="space-y-3">
                        {recipes.map(recipe => {
                            const craftable = canCraft(recipe.cost);
                            return (
                                <div key={recipe.id} className="p-3 rounded-lg border border-border bg-card">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">{recipe.icon}</div>
                                            <div>
                                                <div className="font-semibold text-sm">{recipe.name}</div>
                                                <div className="text-xs text-muted-foreground">{recipe.description}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-wrap gap-1">
                                            {recipe.cost.map(c => (
                                                <span key={c.name} className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", (inventory.find(i => i.name === c.name)?.count || 0) >= c.count ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200")}>
                                                    {c.count} {c.name}
                                                </span>
                                            ))}
                                        </div>
                                        <Button size="sm" className="h-7 text-xs" disabled={!craftable} onClick={() => onCraft(recipe.id, recipe.cost)}>Craft</Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {shopItems.map(item => {
                            const affordable = canBuy(item.cost);
                            return (
                                <div key={item.id} className="p-3 rounded-lg border border-border bg-card">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">{item.icon}</div>
                                            <div>
                                                <div className="font-semibold text-sm">{item.name}</div>
                                                <div className="text-xs text-muted-foreground">{item.description}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full border", affordable ? "bg-green-500/10 text-green-600 border-green-200" : "bg-red-500/10 text-red-600 border-red-200")}>
                                            {item.cost} Ice Shards
                                        </span>
                                        <Button size="sm" className="h-7 text-xs" disabled={!affordable} onClick={() => onBuy(item.id, item.cost)}>Buy</Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
