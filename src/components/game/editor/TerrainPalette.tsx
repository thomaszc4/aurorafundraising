import React from 'react';
import { useEditorStore } from '@/stores/useEditorStore';

const TILES = [
    { id: 1, name: 'Snow', color: '#ffffff' },
    { id: 2, name: 'Ice', color: '#a5f2f3' },
    { id: 3, name: 'Water', color: '#004488' },
    { id: 4, name: 'Deep Water', color: '#002244' },
];

export const TerrainPalette = () => {
    const activeTile = useEditorStore((state) => state.activeTile);
    const setTile = useEditorStore((state) => state.setTile);

    return (
        <div className="w-64 bg-slate-900 border-l border-slate-700 flex flex-col h-full text-slate-200">
            <div className="p-3 border-b border-slate-700 font-bold">
                Terrain Stamps
            </div>

            <div className="p-3 grid grid-cols-2 gap-2">
                {TILES.map((tile) => (
                    <button
                        key={tile.id}
                        onClick={() => setTile(tile.id)}
                        className={`
                            flex flex-col items-center p-2 rounded border transition-all
                            ${activeTile === tile.id
                                ? 'border-blue-500 bg-slate-800 ring-2 ring-blue-500/50'
                                : 'border-slate-700 bg-slate-950 hover:bg-slate-800'}
                        `}
                    >
                        {/* Preview "Swatch" */}
                        <div
                            className="w-12 h-12 rounded shadow-inner mb-2 border border-slate-600"
                            style={{ backgroundColor: tile.color }}
                        />
                        <span className="text-xs font-medium text-slate-400">{tile.name}</span>
                    </button>
                ))}
            </div>

            <div className="p-4 mt-auto text-[10px] text-slate-500 text-center">
                Select a tile then Paint (Click/Drag)
            </div>
        </div>
    );
};
