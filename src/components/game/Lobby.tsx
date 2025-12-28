import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { GameData } from '@/game/types';

interface LobbyProps {
    playerId: string;
    campaignId: string;
    displayName: string;
    currentData: GameData | null;
    onReady: (data: GameData) => void;
}

export const Lobby: React.FC<LobbyProps> = ({ playerId, campaignId, displayName, currentData, onReady }) => {
    const [color, setColor] = useState(currentData?.appearance?.color || 0xffffff);

    const colors = [
        { label: 'White', value: 0xffffff },
        { label: 'Red', value: 0xff4444 },
        { label: 'Blue', value: 0x4444ff },
        { label: 'Green', value: 0x44ff44 },
        { label: 'Yellow', value: 0xffff44 },
        { label: 'Purple', value: 0xff44ff },
    ];

    const handleStart = async () => {
        const newData: GameData = {
            ...(currentData || { inventory: [], stats: { warmth: 100 } }),
            appearance: { color }
        };

        // Save to DB
        await supabase
            .from('game_players' as any)
            .update({ data: newData })
            .eq('user_id', playerId)
            .eq('campaign_id', campaignId);

        onReady(newData);
    };

    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 text-white backdrop-blur-md">
            <h1 className="text-4xl font-bold mb-8 text-cyan-400">Character Customization</h1>

            <div className="flex gap-8 mb-8">
                {/* Preview */}
                <div className="w-64 h-64 bg-slate-800 rounded-lg flex items-center justify-center border-2 border-slate-600 relative">
                    <span className="text-xs absolute top-2 left-2 text-slate-400">Preview</span>
                    <div
                        className="w-32 h-32 bg-white rounded-full shadow-lg"
                        style={{ backgroundColor: '#' + color.toString(16).padStart(6, '0') }}
                    >
                        {/* Simple CSS Face representation */}
                        <div className="w-full h-full relative">
                            <div className="absolute top-10 left-8 w-4 h-4 bg-black rounded-full" />
                            <div className="absolute top-10 right-8 w-4 h-4 bg-black rounded-full" />
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-xl font-semibold">Choose Color</h2>
                    <div className="grid grid-cols-3 gap-2">
                        {colors.map(c => (
                            <button
                                key={c.value}
                                onClick={() => setColor(c.value)}
                                className={`w-12 h-12 rounded-full border-4 transition-all ${color === c.value ? 'border-white scale-110' : 'border-transparent'}`}
                                style={{ backgroundColor: '#' + c.value.toString(16).padStart(6, '0') }}
                                title={c.label}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <Button onClick={handleStart} size="lg" className="w-64 text-lg bg-cyan-600 hover:bg-cyan-500">
                Enter World
            </Button>
        </div>
    );
};
