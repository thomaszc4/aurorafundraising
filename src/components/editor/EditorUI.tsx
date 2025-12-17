import React from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { Button } from '@/components/ui/button';
import { MousePointer2, Paintbrush, Stamp, Eraser, Save, Play, Grid3X3 } from 'lucide-react';

export const EditorUI = () => {
    const { activeTool, setTool, isGridEnabled, toggleGrid } = useEditorStore();

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
            {/* TOP BAR */}
            <div className="pointer-events-auto h-12 bg-slate-900 border-b border-slate-700 flex items-center px-4 justify-between">
                <div className="text-white font-bold">AURORA BUILDER v1.0</div>
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={toggleGrid} className={isGridEnabled ? 'bg-slate-700' : ''}>
                        <Grid3X3 className="w-4 h-4 mr-2" /> Grid
                    </Button>
                    <Button variant="default" size="sm">
                        <Save className="w-4 h-4 mr-2" /> Save Map
                    </Button>
                    <Button variant="outline" size="sm" className="bg-green-600 text-white hover:bg-green-700 border-none">
                        <Play className="w-4 h-4 mr-2" /> Test
                    </Button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* LEFT TOOLBAR */}
                <div className="pointer-events-auto w-14 bg-slate-900 border-r border-slate-700 flex flex-col items-center py-4 gap-2">
                    <ToolButton icon={<MousePointer2 />} active={activeTool === 'select'} onClick={() => setTool('select')} />
                    <ToolButton icon={<Paintbrush />} active={activeTool === 'brush'} onClick={() => setTool('brush')} />
                    <ToolButton icon={<Stamp />} active={activeTool === 'stamp'} onClick={() => setTool('stamp')} />
                    <ToolButton icon={<Eraser />} active={activeTool === 'eraser'} onClick={() => setTool('eraser')} />
                </div>

                {/* MAIN VIEWPORT (Transparent to see Phaser) */}
                <div className="flex-1 relative">
                    {/* CENTER OVERLAY (e.g. crosshair, warnings) */}
                </div>

                {/* RIGHT PROPERTIES */}
                <div className="pointer-events-auto w-64 bg-slate-900 border-l border-slate-700 p-4">
                    <h3 className="text-slate-400 text-xs font-bold mb-4">PROPERTIES</h3>
                    <div className="text-slate-500 text-sm">Nothing selected</div>
                </div>
            </div>

            {/* BOTTOM ASSET BROWSER */}
            <div className="pointer-events-auto h-48 bg-slate-900 border-t border-slate-700 flex flex-col">
                <div className="h-8 bg-slate-800 flex items-center px-2 gap-2 text-xs">
                    <button className="px-3 py-1 bg-slate-700 text-white rounded-t">Nature</button>
                    <button className="px-3 py-1 text-slate-400 hover:text-white">Structures</button>
                    <button className="px-3 py-1 text-slate-400 hover:text-white">Logic</button>
                </div>
                <div className="flex-1 p-2 grid grid-cols-8 gap-2 overflow-y-auto">
                    {/* Mock Assets */}
                    {['Tree', 'Rock', 'Ice', 'Bush', 'Log', 'Wall', 'Door', 'NPC'].map(i => (
                        <div key={i} className="aspect-square bg-slate-800 hover:bg-slate-700 rounded flex items-center justify-center border border-slate-700 cursor-pointer">
                            <span className="text-[10px] text-slate-300">{i}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ToolButton = ({ icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) => (
    <Button
        variant={active ? 'default' : 'ghost'}
        size="icon"
        onClick={onClick}
        className={active ? 'bg-blue-600' : 'text-slate-400 hover:text-white'}
    >
        {React.cloneElement(icon, { className: "w-5 h-5" })}
    </Button>
);
