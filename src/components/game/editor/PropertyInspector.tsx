import React from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Move, Maximize, RotateCw, Settings2 } from 'lucide-react';

export const PropertyInspector = () => {
    const selectedEntityIds = useEditorStore((state) => state.selectedEntityIds);
    const entities = useEditorStore((state) => state.mapData.entities);
    const activeLayer = useEditorStore((state) => state.activeLayer);
    const logicNodes = useEditorStore((state) => state.mapData.logic);

    // Actions
    const updateEntity = useEditorStore((state) => state.updateEntity);
    const removeEntity = useEditorStore((state) => state.removeEntity);
    const updateLogicNode = useEditorStore((state) => state.updateLogicNode);

    // Helpers
    const selectedEntity = entities.find(e => selectedEntityIds.includes(e.id));
    const selectedLogic = logicNodes.find(n => selectedEntityIds.includes(n.id));

    // 1. Logic Node Inspector
    if (activeLayer === 'logic' && selectedLogic) {
        return (
            <div className="w-64 bg-slate-900 border-l border-slate-700 flex flex-col h-full text-slate-200 pointer-events-auto">
                <div className="p-3 border-b border-slate-700 font-bold flex items-center gap-2">
                    <Settings2 className="w-4 h-4" /> Logic Node
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                        {/* Type */}
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Node Type</Label>
                            <select
                                value={selectedLogic.type}
                                onChange={(e) => updateLogicNode(selectedLogic.id, { type: e.target.value as any })}
                                className="w-full bg-slate-950 border border-slate-700 text-xs rounded p-1"
                            >
                                <option value="trigger">Trigger Area</option>
                                <option value="event">Event / Interaction</option>
                                <option value="spawn">Spawn Point</option>
                            </select>
                        </div>

                        {/* Properties */}
                        {selectedLogic.type === 'trigger' && (
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Event Message</Label>
                                <Input
                                    value={selectedLogic.properties?.message || ''}
                                    onChange={(e) => updateLogicNode(selectedLogic.id, { properties: { ...selectedLogic.properties, message: e.target.value } })}
                                    className="bg-slate-950 border-slate-700 h-8"
                                />
                            </div>
                        )}

                        {selectedLogic.type === 'event' && (
                            <div className="space-y-1">
                                <Label className="text-xs text-slate-500">Action</Label>
                                <select
                                    value={selectedLogic.properties?.action || ''}
                                    onChange={(e) => updateLogicNode(selectedLogic.id, { properties: { ...selectedLogic.properties, action: e.target.value } })}
                                    className="w-full bg-slate-950 border border-slate-700 text-xs rounded p-1"
                                >
                                    <option value="">Select Action...</option>
                                    <option value="open_leaderboard">Open Leaderboard</option>
                                    <option value="open_shop">Open Shop</option>
                                </select>
                            </div>
                        )}

                        {/* Condition (Optional) */}
                        <div className="space-y-1">
                            <Label className="text-xs text-slate-500">Condition (Optional)</Label>
                            <Input
                                value={selectedLogic.condition || ''}
                                onChange={(e) => updateLogicNode(selectedLogic.id, { condition: e.target.value })}
                                placeholder="e.g. flag:has_key"
                                className="bg-slate-950 border-slate-700 h-8"
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-800">
                            <div className="text-[10px] text-slate-500">ID: {selectedLogic.id}</div>
                        </div>
                    </div>
                </ScrollArea>
            </div>
        );
    }

    // 2. Entity Inspector
    if (!selectedEntity) {
        return (
            <div className="w-64 bg-slate-900 border-l border-slate-700 flex flex-col h-full items-center justify-center text-slate-500">
                <div className="text-sm">No Selection</div>
            </div>
        );
    }

    const handleChange = (field: string, value: number) => {
        updateEntity(selectedEntity.id, { [field]: value });
    };

    return (
        <div className="w-64 bg-slate-900 border-l border-slate-700 flex flex-col h-full text-slate-200 pointer-events-auto">
            <div className="p-3 border-b border-slate-700 font-bold flex items-center justify-between">
                <span>Inspector</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-400" onClick={() => removeEntity(selectedEntity.id)}>
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                    {/* Position */}
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-500 font-mono uppercase">Position</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <NumberInput label="X" value={selectedEntity.x} onChange={(v) => handleChange('x', v)} />
                            <NumberInput label="Y" value={selectedEntity.y} onChange={(v) => handleChange('y', v)} />
                        </div>
                    </div>

                    {/* Scale & Rotation */}
                    <div className="space-y-2">
                        <Label className="text-xs text-slate-500 font-mono uppercase">Transform</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="relative">
                                <Label className="absolute left-2 top-1.5 text-[10px] text-slate-600">S</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    className="pl-6 h-8 bg-slate-950 border-slate-800 text-xs"
                                    value={selectedEntity.scale}
                                    onChange={(e) => handleChange('scale', parseFloat(e.target.value))}
                                />
                            </div>
                            <div className="relative">
                                <Label className="absolute left-2 top-1.5 text-[10px] text-slate-600">R</Label>
                                <Input
                                    type="number"
                                    className="pl-6 h-8 bg-slate-950 border-slate-800 text-xs"
                                    value={selectedEntity.rotation}
                                    onChange={(e) => handleChange('rotation', parseFloat(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* NPC Properties */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                        <Label className="text-xs text-slate-500 font-mono uppercase">Entity Logic</Label>
                        <div className="space-y-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] text-slate-500">Dialogue ID</Label>
                                <Input
                                    value={selectedEntity.properties?.dialogueId || ''}
                                    onChange={(e) => updateEntity(selectedEntity.id, { properties: { ...selectedEntity.properties, dialogueId: e.target.value } })}
                                    className="bg-slate-950 border-slate-800 h-8 text-xs"
                                    placeholder="e.g. dialogue_intro"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <div className="text-[10px] text-slate-500">ID: {selectedEntity.id}</div>
                        <div className="text-[10px] text-slate-500">Type: {selectedEntity.type}</div>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
};

const NumberInput = ({ label, value, onChange, icon, step = 1 }: any) => (
    <div className="relative">
        <Label className="absolute left-2 top-1.5 text-[10px] text-slate-600">{label}</Label>
        <Input
            type="number"
            step={step}
            className="pl-6 h-8 bg-slate-950 border-slate-800 text-xs"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        {icon && <div className="absolute right-2 top-2 text-slate-500">{icon}</div>}
    </div>
);
