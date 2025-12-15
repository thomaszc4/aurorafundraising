import React, { useState } from 'react';
import { X, Package, Hammer, Flame, ShoppingCart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface InventoryItem {
    id: string;
    type: string;
    name: string;
    count: number;
    icon?: string;
}

interface InventoryOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    inventory: InventoryItem[];
    onCraft: (item: string, cost: { name: string; count: number }[]) => boolean;
    onBuy: (item: string, cost: number) => boolean;
    onPlace: (item: string) => void;
}

export const InventoryOverlay: React.FC<InventoryOverlayProps> = ({ isOpen, onClose, inventory, onCraft, onBuy, onPlace }) => {
    const [activeTab, setActiveTab] = useState<'inventory' | 'crafting' | 'shop'>('inventory');
    const [selectedItem, setSelectedItem] = useState<number | null>(null);

    if (!isOpen) return null;

    const recipes = [
        {
            id: 'campfire',
            name: 'Campfire',
            icon: <Flame className="h-6 w-6 text-orange-500" />,
            description: "Warmth source. Saves you from freezing.",
            cost: [{ name: 'Pine Wood', count: 5 }]
        },
        {
            id: 'wall',
            name: 'Stone Wall',
            icon: <div className="h-6 w-6 bg-gray-500 rounded-sm"></div>,
            description: "A defensive structure.",
            cost: [{ name: 'Ice Shard', count: 2 }]
        }
    ];

    const shopItems = [
        {
            id: 'igloo_kit',
            name: 'Igloo Kit',
            icon: <div className="h-6 w-6 bg-white rounded-t-full border border-blue-200"></div>,
            description: "A cozy shelter. Significantly reduces cold.",
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

    const isPlaceable = (itemName: string) => {
        return ['Campfire', 'Stone Wall', 'Igloo Kit'].includes(itemName);
    };

    return (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-background/95 border border-white/20 p-6 rounded-2xl shadow-2xl w-[90%] max-w-lg h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex gap-2">
                        <button onClick={() => setActiveTab('inventory')} className={cn("flex items-center gap-2 px-3 py-1 rounded-lg transition-colors", activeTab === 'inventory' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5")}>
                            <Package className="h-5 w-5" />
                            <span className="font-bold hidden sm:inline">Inventory</span>
                        </button>
                        <button onClick={() => setActiveTab('crafting')} className={cn("flex items-center gap-2 px-3 py-1 rounded-lg transition-colors", activeTab === 'crafting' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5")}>
                            <Hammer className="h-5 w-5" />
                            <span className="font-bold hidden sm:inline">Crafting</span>
                        </button>
                        <button onClick={() => setActiveTab('shop')} className={cn("flex items-center gap-2 px-3 py-1 rounded-lg transition-colors", activeTab === 'shop' ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-white/5")}>
                            <ShoppingCart className="h-5 w-5" />
                            <span className="font-bold hidden sm:inline">Shop</span>
                        </button>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {activeTab === 'inventory' ? (
                        <div className="grid grid-cols-4 gap-4">
                            {Array.from({ length: 16 }).map((_, index) => {
                                const item = inventory[index];
                                const isSelected = selectedItem === index;
                                return (
                                    <div key={index} className="relative group">
                                        <div
                                            onClick={() => setSelectedItem(isSelected ? null : index)}
                                            className={cn(
                                                "aspect-square rounded-xl border-2 flex items-center justify-center relative transition-all",
                                                item
                                                    ? "bg-secondary/10 border-secondary/50 hover:bg-secondary/20 cursor-pointer"
                                                    : "bg-muted/20 border-white/5",
                                                isSelected && "ring-2 ring-primary border-primary"
                                            )}
                                        >
                                            {item ? (
                                                <>
                                                    <div className="text-2xl" role="img" aria-label={item.name}>{item.icon || '📦'}</div>
                                                    <div className="absolute bottom-1 right-1 text-xs font-bold bg-background/80 px-1 rounded-full min-w-[1.25rem] text-center border border-white/10">{item.count}</div>
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground/20 text-xs">{index + 1}</span>
                                            )}
                                        </div>
                                        {/* Quick Action Popup */}
                                        {item && isSelected && (
                                            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black/90 p-2 rounded-lg z-30 flex gap-2 w-max">
                                                {isPlaceable(item.name) && (
                                                    <Button size="sm" className="h-6 text-xs" onClick={() => onPlace(item.name)}>Place</Button>
                                                )}
                                                <Button size="sm" variant="secondary" className="h-6 text-xs">Drop</Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : activeTab === 'crafting' ? (
                        <div className="space-y-4">
                            {recipes.map(recipe => {
                                const craftable = canCraft(recipe.cost);
                                return (
                                    <div key={recipe.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-black/20 flex items-center justify-center border border-white/10">{recipe.icon}</div>
                                            <div>
                                                <h3 className="font-bold">{recipe.name}</h3>
                                                <p className="text-xs text-muted-foreground">{recipe.description}</p>
                                                <div className="flex gap-2 mt-1">
                                                    {recipe.cost.map(c => (
                                                        <span key={c.name} className={cn("text-xs font-medium px-1.5 py-0.5 rounded", (inventory.find(i => i.name === c.name)?.count || 0) >= c.count ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                                            {c.count} {c.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <Button onClick={() => onCraft(recipe.id, recipe.cost)} disabled={!craftable} variant={craftable ? "default" : "secondary"} className="gap-2">
                                            <Hammer className="h-4 w-4" /> Craft
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* SHOP TAB */}
                            {shopItems.map(item => {
                                const affordable = canBuy(item.cost);
                                return (
                                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-lg bg-black/20 flex items-center justify-center border border-white/10">{item.icon}</div>
                                            <div>
                                                <h3 className="font-bold">{item.name}</h3>
                                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <span className={cn("text-xs font-medium px-1.5 py-0.5 rounded", affordable ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                                        {item.cost} Ice Shards
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button onClick={() => onBuy(item.id, item.cost)} disabled={!affordable} variant={affordable ? "default" : "secondary"} className="gap-2">
                                            <ShoppingCart className="h-4 w-4" /> Buy
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
