import React, { useEffect } from 'react';
import { InventoryItem } from '@/game/types';
import { Tooltip } from './Tooltip';

interface HotbarProps {
    inventory: InventoryItem[];
    onUseItem: (itemName: string) => void;
}

export const Hotbar: React.FC<HotbarProps> = ({ inventory, onUseItem }) => {
    // Take first 4 items from inventory (excluding basic resources if they can't be "used" manually)
    // For now, just take the first 4 items
    const hotbarItems = inventory.slice(0, 4);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const key = e.key;
            if (['1', '2', '3', '4'].includes(key)) {
                const index = parseInt(key) - 1;
                if (hotbarItems[index]) {
                    onUseItem(hotbarItems[index].name);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hotbarItems, onUseItem]);

    return (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 flex gap-2 p-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl">
            {[0, 1, 2, 3].map((index) => {
                const item = hotbarItems[index];
                return (
                    <div key={index} className="relative group">
                        <Tooltip text={item?.name || 'Empty'} description={item ? `Quantity: ${item.count}` : 'Slot available'}>
                            <div className={`w-14 h-14 flex items-center justify-center rounded-lg border-2 transition-all duration-200 ${item
                                    ? 'bg-slate-800/80 border-slate-600 hover:border-cyan-400 hover:scale-105'
                                    : 'bg-slate-900/50 border-slate-800 border-dashed'
                                }`}>
                                {item ? (
                                    <div className="flex flex-col items-center">
                                        <span className="text-2xl">{item.icon}</span>
                                        <span className="absolute bottom-0 right-1 text-[10px] font-bold text-white bg-black/60 px-1 rounded">
                                            {item.count}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-slate-700 text-xs font-bold">-{index + 1}-</span>
                                )}
                            </div>
                        </Tooltip>
                        <div className="absolute -top-2 -left-2 w-5 h-5 bg-slate-700 border border-slate-600 rounded-md flex items-center justify-center text-[10px] font-bold text-slate-300 z-10">
                            {index + 1}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
