import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingBag, X } from 'lucide-react';

interface ShopProps {
    isOpen: boolean;
    onClose: () => void;
    shards: number;
    onBuy: (id: string, cost: number) => boolean;
}

const SHOP_ITEMS = [
    { id: 'igloo_kit', name: 'Igloo Kit', icon: '🏠', cost: 50, desc: 'Instant shelter from the storm.' },
    { id: 'coat', name: 'Fur Coat', icon: '🧥', cost: 30, desc: 'Reduces warmth decay.' },
    { id: 'snow_boots', name: 'Snow Boots', icon: '👢', cost: 20, desc: 'Move faster on snow.' },
    { id: 'golden_campfire', name: 'Golden Campfire', icon: '🔥', cost: 100, desc: 'Eternal fire.' },
    { id: 'penguin_pet', name: 'Pet Penguin', icon: '🐧', cost: 200, desc: 'A loyal friend.' },
];

export const Shop: React.FC<ShopProps> = ({ isOpen, onClose, shards, onBuy }) => {
    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="text-yellow-400" />
                        <h2 className="text-xl font-bold text-white">Survivor Shop</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="text-slate-400" />
                    </Button>
                </div>

                <div className="p-2 bg-slate-800/50 text-center">
                    <span className="text-sm text-slate-300">Balance: </span>
                    <span className="text-lg font-bold text-cyan-400">{shards} Shards</span>
                </div>

                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {SHOP_ITEMS.map(item => (
                            <div key={item.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">{item.icon}</div>
                                    <div>
                                        <div className="font-bold text-white">{item.name}</div>
                                        <div className="text-xs text-slate-400">{item.desc}</div>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className={`${shards >= item.cost ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-slate-700 text-slate-500'}`}
                                    disabled={shards < item.cost}
                                    onClick={() => onBuy(item.id, item.cost)}
                                >
                                    {item.cost} 🧊
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};
