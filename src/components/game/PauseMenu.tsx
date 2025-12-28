import React, { useEffect, useState } from 'react';
import { Play, Settings, Keyboard, LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PauseMenuProps {
    isOpen: boolean;
    onResume: () => void;
    onSettings: () => void;
    onHelp: () => void;
    onQuit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
    isOpen,
    onResume,
    onSettings,
    onHelp,
    onQuit
}) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onResume();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onResume]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900/90 border border-cyan-500/30 p-8 rounded-2xl shadow-2xl max-w-sm w-full mx-4 flex flex-col gap-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-3xl font-black text-white tracking-tighter italic">PAUSED</h2>
                    <Button variant="ghost" size="icon" onClick={onResume} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </Button>
                </div>

                <Button
                    variant="default"
                    size="lg"
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-14 text-lg gap-3"
                    onClick={onResume}
                >
                    <Play className="w-6 h-6 fill-current" />
                    RESUME GAME
                </Button>

                <div className="grid grid-cols-2 gap-3">
                    <Button
                        variant="secondary"
                        className="bg-slate-800 hover:bg-slate-700 text-white gap-2 h-12"
                        onClick={onSettings}
                    >
                        <Settings className="w-5 h-5" />
                        Settings
                    </Button>
                    <Button
                        variant="secondary"
                        className="bg-slate-800 hover:bg-slate-700 text-white gap-2 h-12"
                        onClick={onHelp}
                    >
                        <Keyboard className="w-5 h-5" />
                        Help
                    </Button>
                </div>

                <Button
                    variant="destructive"
                    className="mt-4 gap-2 h-12 font-bold"
                    onClick={onQuit}
                >
                    <LogOut className="w-5 h-5" />
                    QUIT TO MENU
                </Button>

                <div className="mt-6 text-center">
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-widest">Aurora Fundraising Game</p>
                </div>
            </div>
        </div>
    );
};
