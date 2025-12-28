import React, { useEffect, useState } from 'react';

interface POI {
    id: string;
    x: number;
    y: number;
    type: 'npc' | 'quest' | 'structure' | 'resource';
}

export const Minimap: React.FC = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [pois, setPois] = useState<POI[]>([]);
    const WORLD_SIZE = 2000;

    useEffect(() => {
        const handlePos = (e: Event) => {
            const { x, y } = (e as CustomEvent).detail;
            setPosition({ x, y });
        };

        const handlePOI = (e: Event) => {
            const data = (e as CustomEvent).detail as POI[];
            setPois(data);
        };

        window.addEventListener('game-player-pos', handlePos);
        window.addEventListener('game-minimap-pois', handlePOI);
        return () => {
            window.removeEventListener('game-player-pos', handlePos);
            window.removeEventListener('game-minimap-pois', handlePOI);
        };
    }, []);

    const getPOIStyle = (type: POI['type']) => {
        switch (type) {
            case 'npc': return 'bg-yellow-400 w-2 h-2';
            case 'quest': return 'bg-purple-500 w-2 h-2 animate-pulse';
            case 'structure': return 'bg-orange-500 w-1.5 h-1.5';
            case 'resource': return 'bg-green-500 w-1 h-1 opacity-50';
            default: return 'bg-white w-1 h-1';
        }
    };

    return (
        <div className="absolute top-4 left-4 z-10 w-36 h-36 bg-black/60 rounded-lg border border-slate-600 backdrop-blur-sm overflow-hidden hidden md:block">
            <div className="relative w-full h-full">
                {/* Background Grid */}
                <div className="absolute inset-0 grid grid-cols-4 grid-rows-4 gap-px opacity-20">
                    {Array.from({ length: 16 }).map((_, i) => (
                        <div key={i} className="bg-slate-600" />
                    ))}
                </div>

                {/* Center / Spawn Marker */}
                <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 bg-yellow-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-50" />

                {/* POI Markers */}
                {pois.map(poi => (
                    <div
                        key={poi.id}
                        className={`absolute rounded-full ${getPOIStyle(poi.type)}`}
                        style={{
                            left: `${50 + (poi.x / WORLD_SIZE) * 100}%`,
                            top: `${50 + (poi.y / WORLD_SIZE) * 100}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    />
                ))}

                {/* Player Dot */}
                <div
                    className="absolute w-3 h-3 bg-cyan-400 rounded-full border-2 border-white shadow-[0_0_8px_cyan] z-10"
                    style={{
                        left: `${50 + (position.x / WORLD_SIZE) * 100}%`,
                        top: `${50 + (position.y / WORLD_SIZE) * 100}%`,
                        transform: 'translate(-50%, -50%)'
                    }}
                />

                {/* Direction Arrow (pointing north) */}
                <div
                    className="absolute w-0 h-0 border-l-[4px] border-r-[4px] border-b-[6px] border-l-transparent border-r-transparent border-b-cyan-400 z-20"
                    style={{
                        left: `${50 + (position.x / WORLD_SIZE) * 100}%`,
                        top: `${50 + (position.y / WORLD_SIZE) * 100 - 2}%`,
                        transform: 'translate(-50%, -100%)'
                    }}
                />
            </div>

            {/* Coordinates - Removed by user request */}
            {/* <div className="absolute bottom-1 right-2 text-[9px] text-slate-400 font-mono bg-black/50 px-1 rounded">
                {Math.round(position.x)}, {Math.round(position.y)}
            </div> */}

            {/* Legend */}
            <div className="absolute top-1 left-1 flex gap-1">
                <div className="flex items-center gap-0.5" title="NPCs">
                    <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                </div>
                <div className="flex items-center gap-0.5" title="Quest">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                </div>
            </div>
        </div>
    );
};
