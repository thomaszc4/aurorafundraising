import React, { useState } from 'react';
import { Package, Hammer, ShoppingBag, Shield, Zap, Snowflake, Anchor, Lock, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { InventoryItem } from '@/game/types';

interface InventorySidebarProps {
    inventory: InventoryItem[];
    onCraft: (item: string, cost: { name: string; count: number }[]) => boolean;
    onBuy: (item: string, cost: number) => boolean;
    onPlace: (item: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export const InventorySidebar: React.FC<InventorySidebarProps> = ({ inventory, onCraft, onBuy, onPlace, isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'inventory' | 'crafting' | 'shop'>('inventory');

    const recipes = [
        {
            id: 'campfire',
            name: 'Campfire',
            icon: <Zap className="h-5 w-5 text-orange-400" />,
            description: "Essential warmth source. Prevents freezing.",
            cost: [{ name: 'Pine Wood', count: 5 }]
        },
        {
            id: 'wall',
            name: 'Ice Wall',
            icon: <Snowflake className="h-5 w-5 text-cyan-200" />,
            description: "Defensive barrier against wildlife.",
            cost: [{ name: 'Ice Shard', count: 2 }]
        },
        {
            id: 'coat',
            name: 'Thermal Coat',
            icon: <Shield className="h-5 w-5 text-amber-600" />,
            description: "Advanced insulation. Reduces cold buildup.",
            cost: [{ name: 'Pine Wood', count: 10 }, { name: 'Ice Shard', count: 5 }]
        },
        {
            id: 'signal_fire',
            name: 'Rescue Beacon',
            icon: <Anchor className="h-5 w-5 text-red-500 animate-pulse" />,
            description: "High-power signal. The ultimate goal.",
            cost: [{ name: 'Pine Wood', count: 50 }, { name: 'Ice Shard', count: 50 }]
        }
    ];

    const shopItems = [
        {
            id: 'igloo_kit',
            name: 'Igloo Fabricator',
            icon: <div className="h-5 w-5 bg-gradient-to-tr from-cyan-200 to-white rounded-t-full border border-cyan-400"></div>,
            description: "Deploys a permanent shelter.",
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
        <div className={cn(
            "absolute top-32 left-4 z-40 flex flex-col gap-2 perspective-1000 transition-all duration-500 ease-in-out transform",
            isOpen ? "translate-x-0 opacity-100" : "-translate-x-[200%] opacity-0 pointer-events-none"
        )}>

            {/* Main Survival Kit Panel */}
            <div className="w-[360px] bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[60vh] animate-in slide-in-from-left-8 fade-in duration-500 ease-out transition-all hover:border-cyan-500/50 hover:shadow-[0_0_60px_rgba(8,145,178,0.2)]">

                {/* Tech Header */}
                <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/50 border-b border-cyan-500/30 flex items-center justify-between relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_cyan]"></div>
                    <div className="absolute inset-0 bg-[url('/assets/grid.png')] opacity-10"></div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_15px_cyan] animate-[pulse_2s_infinite]"></div>
                        <div>
                            <h2 className="font-black text-white uppercase tracking-[0.2em] text-sm shadow-black drop-shadow-lg">Survival Kit</h2>
                            <div className="text-[10px] font-mono text-cyan-500/80 tracking-tighter">UNIT-734 // ACTIVATED</div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="relative z-10 text-cyan-500/50 hover:text-cyan-400 transition-colors bg-slate-800/50 p-1 rounded-full hover:bg-slate-700/50"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex p-1.5 gap-1.5 bg-black/40 border-b border-white/5">
                    <TabButton
                        active={activeTab === 'inventory'}
                        onClick={() => setActiveTab('inventory')}
                        icon={<Package className="w-4 h-4" />}
                        label="Backpack"
                    />
                    <TabButton
                        active={activeTab === 'crafting'}
                        onClick={() => setActiveTab('crafting')}
                        icon={<Hammer className="w-4 h-4" />}
                        label="Blueprints"
                    />
                    <TabButton
                        active={activeTab === 'shop'}
                        onClick={() => setActiveTab('shop')}
                        icon={<ShoppingBag className="w-4 h-4" />}
                        label="Supply Drop"
                    />
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar min-h-[400px] relative bg-gradient-to-b from-slate-950/50 to-transparent">

                    {/* Background Grid Accent */}
                    <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(8,145,178,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(8,145,178,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                    {/* BACKPACK TAB */}
                    {activeTab === 'inventory' && (
                        <div className="grid grid-cols-4 gap-3 relative z-10">
                            {/* Inventory Slots */}
                            {inventory.map((item, index) => (
                                <InventorySlot
                                    key={index}
                                    item={item}
                                    onPlace={onPlace}
                                />
                            ))}

                            {/* Empty Slots */}
                            {Array.from({ length: Math.max(0, 16 - inventory.length) }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square bg-slate-900/20 border border-dashed border-slate-800 rounded-xl"></div>
                            ))}
                        </div>
                    )}

                    {/* BLUEPRINTS TAB */}
                    {activeTab === 'crafting' && (
                        <div className="space-y-4 relative z-10">
                            {recipes.map(recipe => (
                                <RecipeCard
                                    key={recipe.id}
                                    recipe={recipe}
                                    canCraft={canCraft(recipe.cost)}
                                    inventory={inventory}
                                    onCraft={() => onCraft(recipe.id, recipe.cost)}
                                />
                            ))}
                        </div>
                    )}

                    {/* SUPPLIES TAB */}
                    {activeTab === 'shop' && (
                        <div className="space-y-4 relative z-10">
                            {shopItems.map(item => (
                                <ShopCard
                                    key={item.id}
                                    item={item}
                                    canBuy={canBuy(item.cost)}
                                    onBuy={() => onBuy(item.id, item.cost)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer Status */}
                <div className="p-2 bg-slate-950 border-t border-white/5 text-[10px] text-slate-500 font-mono text-center uppercase">
                    System Connected // {inventory.length} Items Loaded
                </div>
            </div>
        </div>
    );
};

// --- Sub Components ---

const TabButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all text-[11px] uppercase tracking-wider font-bold group relative overflow-hidden",
            active
                ? "bg-cyan-950/80 text-cyan-300 shadow-[inset_0_0_15px_rgba(8,145,178,0.2)] border border-cyan-500/40"
                : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
        )}
    >
        {active && <div className="absolute inset-0 bg-cyan-400/5 blur-md"></div>}
        <span className={cn("transition-transform group-hover:scale-110", active && "text-cyan-400")}>{icon}</span>
        <span className="relative z-10">{label}</span>
    </button>
);

const InventorySlot: React.FC<{ item: InventoryItem; onPlace: (name: string) => void }> = ({ item, onPlace }) => {
    const isPlaceable = ['Campfire', 'Igloo Fabricator', 'Ice Wall', 'Rescue Beacon'].includes(item.name);

    return (
        <div
            className={cn(
                "group relative aspect-square bg-slate-900/60 border border-slate-700/50 rounded-xl transition-all cursor-pointer overflow-hidden backdrop-blur-sm",
                "hover:border-cyan-400/60 hover:bg-slate-800 hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]",
                isPlaceable && "ring-1 ring-inset ring-transparent hover:ring-cyan-500/30"
            )}
            onClick={() => isPlaceable && onPlace(item.name)}
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-cyan-900/20 transition-all"></div>

            <div className="absolute inset-0 flex items-center justify-center z-10">
                <span className="text-3xl drop-shadow-2xl group-hover:scale-110 group-active:scale-95 transition-transform duration-300 ease-out filter group-hover:brightness-110">
                    {item.icon || '📦'}
                </span>
            </div>

            <div className="absolute top-1.5 right-1.5 z-20 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-slate-950/90 border border-white/10 rounded-md px-1 shadow-lg font-mono">
                {item.count}
            </div>

            {/* Tooltip */}
            <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-3 left-1/2 -translate-x-1/2 w-max max-w-[180px] bg-slate-950/95 border border-cyan-500/30 text-cyan-50 text-xs p-2.5 rounded-lg shadow-2xl pointer-events-none z-50 transition-all transform translate-y-2 group-hover:translate-y-0 backdrop-blur-xl">
                <div className="font-bold mb-1 text-cyan-300 uppercase tracking-wide text-[10px]">{item.name}</div>
                <div className="text-slate-400 text-[10px] leading-tight">
                    {isPlaceable ? "Click to Place in World" : "Resource Item"}
                </div>
                {/* Arrow */}
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-r border-b border-cyan-500/30 rotate-45"></div>
            </div>
        </div>
    );
};

const RecipeCard: React.FC<{ recipe: any; canCraft: boolean; inventory: InventoryItem[]; onCraft: () => void }> = ({ recipe, canCraft, inventory, onCraft }) => (
    <div className={cn(
        "group relative p-4 rounded-xl border transition-all duration-300 overflow-hidden",
        canCraft
            ? "bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-cyan-500/30 hover:border-cyan-400/60 hover:shadow-[0_0_20px_rgba(8,145,178,0.15)]"
            : "bg-slate-950/50 border-slate-800/50 opacity-80 hover:opacity-100"
    )}>
        {/* Glow Effect */}
        {canCraft && <div className="absolute -top-10 -right-10 w-20 h-20 bg-cyan-400/10 blur-3xl rounded-full group-hover:bg-cyan-400/20 transition-all"></div>}

        <div className="flex justify-between items-start mb-3 relative z-10">
            <div className="flex gap-4">
                <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center border shadow-inner transition-transform group-hover:scale-105",
                    canCraft ? "bg-slate-900 border-cyan-900/50" : "bg-slate-950 border-slate-800"
                )}>
                    {recipe.icon}
                </div>
                <div>
                    <h3 className={cn("font-bold text-sm", canCraft ? "text-white" : "text-slate-400")}>{recipe.name}</h3>
                    <p className="text-[11px] text-slate-500 leading-tight max-w-[180px] mt-0.5">{recipe.description}</p>
                </div>
            </div>
            {canCraft ? (
                <div className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_8px_cyan] animate-pulse mt-1"></div>
            ) : (
                <Lock className="w-4 h-4 text-slate-700 mt-1" />
            )}
        </div>

        <div className="space-y-3 relative z-10">
            {/* Cost Grid */}
            <div className="flex flex-wrap gap-2">
                {recipe.cost.map((c: any) => {
                    const has = (inventory.find(i => i.name === c.name)?.count || 0);
                    const enough = has >= c.count;
                    return (
                        <div key={c.name} className={cn(
                            "flex items-center gap-1.5 text-[10px] px-2 py-1 rounded border font-mono transition-colors",
                            enough
                                ? "bg-slate-900/80 text-slate-300 border-slate-700 group-hover:border-slate-600"
                                : "bg-red-950/20 text-red-400 border-red-900/30"
                        )}>
                            <div className={cn("w-1.5 h-1.5 rounded-full", enough ? "bg-cyan-500" : "bg-red-500")}></div>
                            <span>
                                <span className={enough ? "text-cyan-200" : "text-red-400"}>{has}</span>
                                <span className="text-slate-600 mx-0.5">/</span>
                                {c.count} {c.name.split(' ')[0]}
                            </span>
                        </div>
                    );
                })}
            </div>

            <Button
                onClick={onCraft}
                disabled={!canCraft}
                className={cn(
                    "w-full h-8 text-xs uppercase tracking-wider font-bold transition-all relative overflow-hidden",
                    canCraft
                        ? "bg-cyan-700 hover:bg-cyan-600 text-white border-none shadow-[0_2px_10px_rgba(8,145,178,0.3)]"
                        : "bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed"
                )}
            >
                {canCraft && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>}
                <span>{canCraft ? 'Fabricate' : 'Insufficient Resources'}</span>
            </Button>
        </div>
    </div>
);

const ShopCard: React.FC<{ item: any; canBuy: boolean; onBuy: () => void }> = ({ item, canBuy, onBuy }) => (
    <div className="group relative p-1 rounded-xl bg-gradient-to-b from-slate-800/50 to-slate-950/50 border border-slate-700 hover:border-cyan-500/40 transition-all hover:shadow-lg">
        <div className="bg-slate-950/80 rounded-lg p-3">
            <div className="flex gap-4 items-center">
                <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-indigo-950 to-slate-950 flex items-center justify-center border border-white/5 shadow-inner group-hover:scale-105 transition-transform">
                    {item.icon}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <div>
                            <h4 className="font-bold text-sm text-slate-100">{item.name}</h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
                <div className="px-3 py-1 rounded bg-slate-900 border border-cyan-900/30 text-xs font-mono text-cyan-400 flex items-center gap-1.5">
                    <span className="text-cyan-600">Cost:</span>
                    {item.cost} Shards
                </div>
                <Button
                    size="sm"
                    disabled={!canBuy}
                    onClick={onBuy}
                    className={cn(
                        "h-8 text-[10px] uppercase font-bold px-4",
                        canBuy ? "bg-cyan-600 text-white hover:bg-cyan-500" : "bg-slate-800 text-slate-500"
                    )}
                >
                    Order Drop
                </Button>
            </div>
        </div>
    </div>
);

