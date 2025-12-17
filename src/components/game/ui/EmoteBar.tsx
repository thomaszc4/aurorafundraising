import React from 'react';
import { Button } from '@/components/ui/button';

export const EmoteBar: React.FC = () => {
    const sendEmote = (id: string) => {
        if ((window as any).GAME_NETWORK) {
            (window as any).GAME_NETWORK.sendEmote(id);
        }
    };

    return (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/40 rounded-full backdrop-blur pointer-events-auto z-50">
            <Button variant="ghost" size="icon" onClick={() => sendEmote('wave')} title="Wave">👋</Button>
            <Button variant="ghost" size="icon" onClick={() => sendEmote('heart')} title="Heart">❤️</Button>
            <Button variant="ghost" size="icon" onClick={() => sendEmote('fire')} title="Fire">🔥</Button>
            <Button variant="ghost" size="icon" onClick={() => sendEmote('smile')} title="Smile">😊</Button>
        </div>
    );
};
