import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Mountain, Trees, Waves } from 'lucide-react';

export const MapDesignerUI = () => {
    const [activeTool, setActiveTool] = useState<string | null>(null);

    const selectTool = (tool: string) => {
        setActiveTool(tool);
        window.dispatchEvent(new CustomEvent('map-editor-tool', { detail: tool }));
    };

    const handleExport = () => {
        window.dispatchEvent(new CustomEvent('map-editor-export'));
    };

    return (
        <div className="absolute top-4 left-4 z-50 bg-black/80 p-2 rounded-lg text-white flex flex-col gap-2 border border-blue-500">
            <h3 className="text-xs font-bold text-blue-300 mb-1">MAP DESIGNER (F1)</h3>

            <div className="flex gap-2">
                <Button
                    variant={activeTool === 'cliff' ? "default" : "secondary"}
                    size="icon" onClick={() => selectTool('cliff')} title="Place Cliff"
                >
                    <Mountain className="h-4 w-4" />
                </Button>
                <Button
                    variant={activeTool === 'river' ? "default" : "secondary"}
                    size="icon" onClick={() => selectTool('river')} title="Place River Node"
                >
                    <Waves className="h-4 w-4" />
                </Button>
                <Button
                    variant={activeTool === 'tree' ? "default" : "secondary"}
                    size="icon" onClick={() => selectTool('tree')} title="Place Tree"
                >
                    <Trees className="h-4 w-4" />
                </Button>
            </div>

            <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={handleExport}>
                <Download className="h-3 w-3 mr-1" /> Export Map
            </Button>

            <div className="text-[10px] text-gray-400 max-w-[150px]">
                Left Click: Place<br />
                Right Click: Remove<br />
                WASD: Move Camera
            </div>
        </div>
    );
};
