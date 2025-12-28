import React from 'react';
import { Heart, Thermometer, Award, Coins } from 'lucide-react';

interface PlayerStatsHUDProps {
    warmth: number;
    xp: number;
    level: number;
    shards: number;
}

export const PlayerStatsHUD: React.FC<PlayerStatsHUDProps> = ({ warmth, xp, level, shards }) => {
    const maxXp = level * 100;
    const xpPercent = (xp / maxXp) * 100;

    return (
        <div className="game-hud-panel absolute top-4 left-4 z-30 flex gap-4 pointer-events-none select-none">
            {/* Stats Panel Container */}
            <div className="bg-slate-950/85 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-3 shadow-2xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">

                {/* Character Portrait */}
                <div className="relative group">
                    <div className="w-16 h-16 rounded-xl border-2 border-slate-700 bg-slate-900 overflow-hidden shadow-inner relative z-10">
                        <img
                            src="/assets/game/penguin_portrait.png"
                            alt="Character"
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                        />
                    </div>
                    {/* Ring Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-tr from-cyan-500/20 to-transparent rounded-xl blur-sm -z-10"></div>
                    <div className="absolute -bottom-2 -left-2 bg-slate-950 border border-cyan-500/50 text-[10px] font-bold text-cyan-400 px-1.5 py-0.5 rounded shadow-lg z-20 font-mono">
                        LVL {level}
                    </div>
                </div>

                {/* Stats Bars container */}
                <div className="flex flex-col justify-center gap-2 min-w-[160px]">

                    {/* Warmth Bar (Prominent) */}
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warmth</span>
                            <span className={`text-[10px] font-mono font-bold ${warmth < 30 ? 'text-red-400 animate-pulse' : 'text-cyan-300'}`}>{Math.round(warmth)}%</span>
                        </div>
                        <div className="h-3 w-full bg-slate-900/80 rounded-full overflow-hidden border border-slate-700/50 shadow-inner relative">
                            {/* Bar */}
                            <div
                                className={`h-full transition-all duration-500 relative ${warmth < 30 ? 'bg-gradient-to-r from-red-600 to-red-400' : 'bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-300'
                                    }`}
                                style={{ width: `${warmth}%`, boxShadow: warmth > 30 ? '0 0 10px rgba(34,211,238,0.3)' : 'none' }}
                            >
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-white/30"></div>
                            </div>
                        </div>
                    </div>

                    {/* Resource/XP Ticker */}
                    <div className="flex items-center gap-3 mt-0.5">
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Coins className="w-3.5 h-3.5 text-yellow-400" />
                            <span className="font-mono text-cyan-100">{shards}</span>
                        </div>
                        <div className="w-[1px] h-3 bg-slate-700"></div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-300">
                            <Award className="w-3.5 h-3.5 text-purple-400" />
                            <div className="h-1.5 w-16 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div className="h-full bg-purple-500" style={{ width: `${xpPercent}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};
