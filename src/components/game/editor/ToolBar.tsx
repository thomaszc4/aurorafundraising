import React from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { Button } from '@/components/ui/button';
import { MousePointer2, Brush, Stamp, Eraser, Grid3X3, Save, FolderOpen } from 'lucide-react';
import { LoadMapModal } from './LoadMapModal';
import { MapService } from '@/services/MapService';
import { toast } from 'sonner';

export const ToolBar = () => {
    const activeTool = useEditorStore((state) => state.activeTool);
    const setTool = useEditorStore((state) => state.setTool);
    const isGridEnabled = useEditorStore((state) => state.isGridEnabled);
    const toggleGrid = useEditorStore((state) => state.toggleGrid);
    const mapData = useEditorStore((state) => state.mapData);
    const setMapData = useEditorStore((state) => state.setMapData);

    const handleSave = async () => {
        try {
            const id = await MapService.saveMap(mapData);
            if (mapData.id === 'new-map') {
                // Update store with real ID so next save is an update
                setMapData({ ...mapData, id });
            }
            toast.success("Map saved successfully!");
        } catch (e) {
            console.error(e);
            toast.error("Failed to save map.");
        }
    };

    return (
        <div className="bg-slate-900 border-b border-slate-700 p-2 flex items-center gap-4 shadow-lg pointer-events-auto">
            <div className="font-bold text-white tracking-widest px-2 border-r border-slate-700">
                EDITOR
            </div>

            {/* Tools */}
            <div className="flex gap-1 border-r border-slate-700 pr-4">
                <ToolBtn icon={<MousePointer2 size={18} />} active={activeTool === 'select'} onClick={() => setTool('select')} label="Select" />
                <ToolBtn icon={<Brush size={18} />} active={activeTool === 'brush'} onClick={() => setTool('brush')} label="Paint" />
                <ToolBtn icon={<Stamp size={18} />} active={activeTool === 'stamp'} onClick={() => setTool('stamp')} label="Stamp" />
                <ToolBtn icon={<Eraser size={18} />} active={activeTool === 'eraser'} onClick={() => setTool('eraser')} label="Erase" />
            </div>

            {/* Grid */}
            <div className="flex gap-1 border-r border-slate-700 pr-4">
                <ToolBtn icon={<Grid3X3 size={18} />} active={isGridEnabled} onClick={toggleGrid} label="Grid" />
            </div>

            {/* Persistence */}
            <div className="flex gap-1 ml-auto">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" onClick={handleSave} title="Save Map">
                    <Save size={18} />
                </Button>

                <LoadMapModal>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white" title="Load Map">
                        <FolderOpen size={18} />
                    </Button>
                </LoadMapModal>
            </div>
        </div>
    );
};

const ToolBtn = ({ icon, active, onClick, label }: any) => (
    <Button
        variant={active ? 'default' : 'ghost'}
        size="icon"
        className={`h-8 w-8 ${active ? 'bg-blue-600 hover:bg-blue-700' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        onClick={onClick}
        title={label}
    >
        {icon}
    </Button>
);
