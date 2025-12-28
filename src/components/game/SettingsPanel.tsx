import React, { useEffect, useState } from 'react';
import { X, Settings, Volume2, VolumeX, Zap, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface GameSettings {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    enableParticles: boolean;
    enableScreenShake: boolean;
}

const DEFAULT_SETTINGS: GameSettings = {
    masterVolume: 80,
    musicVolume: 60,
    sfxVolume: 80,
    enableParticles: true,
    enableScreenShake: true,
};

export const SettingsPanel: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState<GameSettings>(() => {
        const saved = localStorage.getItem('aurora_game_settings');
        return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    });

    useEffect(() => {
        // Toggle with P key
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.altKey) {
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        // Save settings
        localStorage.setItem('aurora_game_settings', JSON.stringify(settings));
        // Broadcast to game
        window.dispatchEvent(new CustomEvent('game-settings-update', { detail: settings }));
    }, [settings]);

    const updateSetting = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (!isOpen) {
        return (
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 right-4 z-40 bg-black/50 hover:bg-black/70 text-white border border-white/20"
                onClick={() => setIsOpen(true)}
                title="Settings (P)"
            >
                <Settings className="w-5 h-5" />
            </Button>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 rounded-xl border border-cyan-500/30 p-6 max-w-md w-full mx-4 shadow-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
                        <Settings className="w-6 h-6" />
                        Settings
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Audio Section */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                        <Volume2 className="w-4 h-4" /> AUDIO
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="text-white text-sm w-20">Master</span>
                            <Slider
                                value={[settings.masterVolume]}
                                onValueChange={([v]) => updateSetting('masterVolume', v)}
                                max={100}
                                step={5}
                                className="flex-1"
                            />
                            <span className="text-white/60 text-xs w-8">{settings.masterVolume}%</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-white text-sm w-20">Music</span>
                            <Slider
                                value={[settings.musicVolume]}
                                onValueChange={([v]) => updateSetting('musicVolume', v)}
                                max={100}
                                step={5}
                                className="flex-1"
                            />
                            <span className="text-white/60 text-xs w-8">{settings.musicVolume}%</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-white text-sm w-20">SFX</span>
                            <Slider
                                value={[settings.sfxVolume]}
                                onValueChange={([v]) => updateSetting('sfxVolume', v)}
                                max={100}
                                step={5}
                                className="flex-1"
                            />
                            <span className="text-white/60 text-xs w-8">{settings.sfxVolume}%</span>
                        </div>
                    </div>
                </div>

                {/* Graphics Section */}
                <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                        <Monitor className="w-4 h-4" /> GRAPHICS
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <span className="text-white text-sm">Particle Effects</span>
                            </div>
                            <Switch
                                checked={settings.enableParticles}
                                onCheckedChange={(v) => updateSetting('enableParticles', v)}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📳</span>
                                <span className="text-white text-sm">Screen Shake</span>
                            </div>
                            <Switch
                                checked={settings.enableScreenShake}
                                onCheckedChange={(v) => updateSetting('enableScreenShake', v)}
                            />
                        </div>
                    </div>
                </div>

                {/* Reset Button */}
                <div className="border-t border-white/10 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setSettings(DEFAULT_SETTINGS)}
                    >
                        Reset to Defaults
                    </Button>
                </div>

                {/* Footer */}
                <div className="mt-4 text-center">
                    <span className="text-gray-500 text-xs">Press P to toggle settings</span>
                </div>
            </div>
        </div>
    );
};
