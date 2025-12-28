import React, { useEffect, useState } from 'react';
import { gameEvents } from '@/game/EventBus';
import { Map, Key, Snowflake, Flame } from 'lucide-react';

interface QuestItem {
    id: string;
    name: string;
    icon: React.ElementType;
    color: string;
    acquired: boolean;
}

export const QuestItemDisplay: React.FC = () => {
    // Hardcoded tracked items for this quest wizard
    const [items, setItems] = useState<QuestItem[]>([
        { id: 'frozen_map', name: 'Frozen Map', icon: Snowflake, color: 'text-cyan-300', acquired: false },
        { id: 'thawed_map', name: 'Ancient Map', icon: Map, color: 'text-amber-200', acquired: false },
        { id: 'ancient_key', name: 'Artifact Key', icon: Key, color: 'text-yellow-400', acquired: false },
        { id: 'eternal_flame', name: 'Eternal Flame', icon: Flame, color: 'text-orange-500', acquired: false },
    ]);

    useEffect(() => {
        // Listen for quest updates to unlock items (Simulated "Inventory Wizard")
        const handleUpdate = (e: any) => {
            const data = e.detail;
            // Logic to unlock items based on quest steps
            // This is a simplified "Wizard" that knows the quest flow
            if (data?.stepId === 'solve_riddle') unlockItem('frozen_map');
            if (data?.stepId === 'thaw_map') {
                removeItem('frozen_map');
                unlockItem('thawed_map');
            }
            if (data?.stepId === 'find_key') unlockItem('ancient_key');
        };

        const unlockItem = (id: string) => {
            setItems(prev => prev.map(item => item.id === id ? { ...item, acquired: true } : item));
        };
        const removeItem = (id: string) => {
            setItems(prev => prev.map(item => item.id === id ? { ...item, acquired: false } : item));
        }

        window.addEventListener('game-quest-update', handleUpdate);
        return () => window.removeEventListener('game-quest-update', handleUpdate);
    }, []);

    // Only render if we have at least one item
    if (!items.some(i => i.acquired)) return null;

    return (
        <div className="absolute top-24 left-4 z-10 flex flex-col gap-4 pointer-events-none">
            {items.filter(i => i.acquired).map((item) => (
                <div key={item.id} className="group relative flex items-center animate-in fade-in zoom-in duration-500">
                    {/* Glow Effect */}
                    <div className="absolute inset-0 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-all"></div>

                    {/* Icon Container */}
                    <div className={`
                        w-12 h-12 rounded-full 
                        bg-slate-900/80 backdrop-blur-md border border-white/10 
                        flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.5)]
                        group-hover:scale-110 transition-transform duration-300
                    `}>
                        <item.icon className={`w-6 h-6 ${item.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]`} />
                    </div>

                    {/* Label (Tooltip style) */}
                    <div className="absolute left-14 bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap uppercase tracking-wider">
                        {item.name}
                    </div>
                </div>
            ))}
        </div>
    );
};
