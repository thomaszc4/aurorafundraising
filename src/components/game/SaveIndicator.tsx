import React, { useEffect, useState } from 'react';
import { Cloud, Check, Loader2, AlertCircle } from 'lucide-react';

export const SaveIndicator: React.FC = () => {
    const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    useEffect(() => {
        const handleSaveStart = () => setStatus('saving');
        const handleSaveSuccess = () => {
            setStatus('saved');
            setTimeout(() => setStatus('idle'), 3000);
        };
        const handleSaveError = () => {
            setStatus('error');
            setTimeout(() => setStatus('idle'), 5000);
        };

        window.addEventListener('game-save-start', handleSaveStart);
        window.addEventListener('game-save-success', handleSaveSuccess);
        window.addEventListener('game-save-error', handleSaveError);

        return () => {
            window.removeEventListener('game-save-start', handleSaveStart);
            window.removeEventListener('game-save-success', handleSaveSuccess);
            window.removeEventListener('game-save-error', handleSaveError);
        };
    }, []);

    if (status === 'idle') return null;

    return (
        <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-sm border border-white/10 rounded-full animate-fade-in pointer-events-none">
            {status === 'saving' && (
                <>
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span className="text-[10px] font-bold text-cyan-400 tracking-wider uppercase">Syncing...</span>
                </>
            )}
            {status === 'saved' && (
                <>
                    <Check className="w-3.5 h-3.5 text-green-400 animate-bounce-in" />
                    <span className="text-[10px] font-bold text-green-400 tracking-wider uppercase">Saved</span>
                </>
            )}
            {status === 'error' && (
                <>
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-500 tracking-wider uppercase">Sync Failed</span>
                </>
            )}
        </div>
    );
};
