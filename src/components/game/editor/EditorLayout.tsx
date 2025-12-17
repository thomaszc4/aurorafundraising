import React from 'react';
import { AssetBrowser } from './AssetBrowser';
import { ToolBar } from './ToolBar';
import { PropertyInspector } from './PropertyInspector';
import { TerrainPalette } from './TerrainPalette';
import { useEditorStore } from '@/stores/useEditorStore';
import { StoryEditor } from './StoryEditor';
import { Layers, Box, Settings2, Book } from 'lucide-react';

export const EditorLayout = () => {
    const activeLayer = useEditorStore(s => s.activeLayer);

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
            {/* Top Bar */}
            <div className="pointer-events-auto w-full">
                <ToolBar />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex justify-between overflow-hidden">
                {/* Left Panel: Layers */}
                <div className="w-12 bg-slate-900/80 border-r border-slate-700 pointer-events-auto flex flex-col items-center py-2 gap-2">
                    <LayerBtn layer="terrain" icon={<Layers className="w-5 h-5" />} />
                    <LayerBtn layer="objects" icon={<Box className="w-5 h-5" />} />
                    <LayerBtn layer="logic" icon={<Settings2 className="w-5 h-5" />} />
                    <div className="w-8 h-[1px] bg-slate-700 my-1" />
                    <LayerBtn layer="story" icon={<Book className="w-5 h-5" />} />
                </div>

                {/* Right Panel */}
                <div className="pointer-events-auto h-full flex border-l border-slate-700 bg-slate-900/90 backdrop-blur-md">
                    <SidebarContent />
                </div>
            </div>

            {/* Status Bar */}
            <div className="h-6 bg-slate-950 text-slate-500 text-[10px] px-2 flex items-center pointer-events-auto gap-4">
                <span>Ready</span>
            </div>
        </div>
    );
};

const SidebarContent = () => {
    const activeTool = useEditorStore(s => s.activeTool);
    const activeLayer = useEditorStore(s => s.activeLayer);

    if (activeLayer === 'story') {
        return <StoryEditor />;
    }

    if (activeTool === 'brush') {
        return <TerrainPalette />;
    }

    return (
        <>
            <AssetBrowser />
            <PropertyInspector />
        </>
    );
};

const LayerBtn = ({ layer, icon }: { layer: 'terrain' | 'objects' | 'logic' | 'story', icon: React.ReactNode }) => {
    const activeLayer = useEditorStore(s => s.activeLayer);
    const setLayer = useEditorStore(s => s.setLayer);

    return (
        <button
            onClick={() => setLayer(layer)}
            className={`p-2 rounded transition-colors ${activeLayer === layer ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'}`}
        >
            {icon}
        </button>
    );
};
