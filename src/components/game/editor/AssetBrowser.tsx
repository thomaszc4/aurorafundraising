import React from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { ScrollArea } from '@/components/ui/scroll-area';

const ASSETS = [
    { id: 'tree', name: 'Pine Tree', icon: '/assets/game/tree_mock.png' },
    { id: 'rock', name: 'Rock', icon: 'https://labs.phaser.io/assets/sprites/gem.png' }, // Placeholder
    { id: 'bush', name: 'Bush', icon: 'https://labs.phaser.io/assets/sprites/mushroom2.png' }, // Placeholder
    { id: 'npc', name: 'Villager', icon: 'https://labs.phaser.io/assets/sprites/phaser-dude.png' }, // Placeholder
];

export const AssetBrowser = () => {
    const selectedAsset = useEditorStore((state) => state.selectedAsset);
    const setAsset = useEditorStore((state) => state.setAsset);

    return (
        <div className="flex flex-col h-full bg-slate-900 border-l border-slate-700 w-64">
            <div className="p-3 border-b border-slate-700 font-bold text-slate-200">
                Asset Browser
            </div>
            <ScrollArea className="flex-1 p-2">
                <div className="grid grid-cols-2 gap-2">
                    {ASSETS.map((asset) => (
                        <button
                            key={asset.id}
                            onClick={() => setAsset(asset.id)}
                            className={`
                                flex flex-col items-center justify-center p-2 rounded 
                                border hover:bg-slate-800 transition-colors
                                ${selectedAsset === asset.id
                                    ? 'border-blue-500 bg-slate-800'
                                    : 'border-slate-700 bg-slate-900'}
                            `}
                        >
                            <img src={asset.icon} alt={asset.name} className="w-12 h-12 object-contain mb-2" />
                            <span className="text-xs text-slate-400">{asset.name}</span>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
