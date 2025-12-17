import React, { useState } from 'react';
import { useEditorStore } from '@/stores/useEditorStore';
import { Dialogue, DialogueNode, DialogueOption } from '@/game/types/StoryTypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const DialogueEditor = () => {
    const dialogues = useEditorStore(s => s.project.dialogues);
    const addDialogue = useEditorStore(s => s.addDialogue);
    const updateDialogue = useEditorStore(s => s.updateDialogue);
    const removeDialogue = useEditorStore(s => s.removeDialogue);

    const [selectedDialogueId, setSelectedDialogueId] = useState<string | null>(null);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    const handleCreateDialogue = () => {
        const id = 'dialogue_' + crypto.randomUUID().slice(0, 8);
        const rootNodeId = 'node_start';
        const newDialogue: Dialogue = {
            id,
            npcId: 'npc_new',
            rootNodeId,
            nodes: {
                [rootNodeId]: {
                    id: rootNodeId,
                    text: 'Hello there!',
                    speaker: 'NPC',
                    options: []
                }
            }
        };
        addDialogue(newDialogue);
        setSelectedDialogueId(id);
        setSelectedNodeId(rootNodeId);
    };

    const selectedDialogue = dialogues.find(d => d.id === selectedDialogueId);
    const selectedNode = selectedDialogue && selectedNodeId ? selectedDialogue.nodes[selectedNodeId] : null;

    const updateSelectedNode = (updates: Partial<DialogueNode>) => {
        if (!selectedDialogue || !selectedNodeId) return;

        const newNodes = { ...selectedDialogue.nodes };
        newNodes[selectedNodeId] = { ...newNodes[selectedNodeId], ...updates };

        updateDialogue(selectedDialogue.id, { nodes: newNodes });
    };

    return (
        <div className="h-full flex text-slate-200">
            {/* Column 1: Dialogue List */}
            <div className="w-1/4 border-r border-slate-700 flex flex-col bg-slate-900/40">
                <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <span className="font-bold text-xs">Conversations</span>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCreateDialogue}>
                        <Plus className="w-4 h-4" />
                    </Button>
                </div>
                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {dialogues.map(d => (
                            <div
                                key={d.id}
                                onClick={() => { setSelectedDialogueId(d.id); setSelectedNodeId(d.rootNodeId); }}
                                className={cn(
                                    "p-2 rounded cursor-pointer text-xs truncate transition-colors",
                                    selectedDialogueId === d.id ? "bg-green-600 text-white" : "hover:bg-slate-800 text-slate-400"
                                )}
                            >
                                {d.id} <span className="text-slate-500">({d.npcId})</span>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Column 2: Node List */}
            <div className="w-1/4 border-r border-slate-700 flex flex-col bg-slate-900/20">
                {selectedDialogue ? (
                    <>
                        <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                            <div className="flex flex-col">
                                <span className="font-bold text-xs">Nodes</span>
                                <span className="text-[10px] text-slate-500">{selectedDialogue.id}</span>
                            </div>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-[10px] bg-slate-800 hover:bg-slate-700"
                                onClick={() => {
                                    const nodeId = 'node_' + crypto.randomUUID().slice(0, 4);
                                    const newNodes = { ...selectedDialogue.nodes };
                                    newNodes[nodeId] = {
                                        id: nodeId,
                                        text: '...',
                                        speaker: 'NPC',
                                        options: []
                                    };
                                    updateDialogue(selectedDialogue.id, { nodes: newNodes });
                                    setSelectedNodeId(nodeId);
                                }}
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                            <div className="space-y-1">
                                {Object.values(selectedDialogue.nodes).map(node => (
                                    <div
                                        key={node.id}
                                        onClick={() => setSelectedNodeId(node.id)}
                                        className={cn(
                                            "p-2 rounded cursor-pointer text-xs flex flex-col transition-colors border border-transparent",
                                            selectedNodeId === node.id ? "bg-slate-800 border-green-500/50 text-green-100" : "hover:bg-slate-800/50 text-slate-400",
                                            node.id === selectedDialogue.rootNodeId && "bg-green-950/20"
                                        )}
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-bold">{node.id}</span>
                                            {node.id === selectedDialogue.rootNodeId && <span className="text-[9px] uppercase bg-green-900/50 text-green-400 px-1 rounded">Root</span>}
                                        </div>
                                        <div className="truncate opacity-70 mt-1 italic">"{node.text}"</div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 text-xs p-4 text-center">Select conversation</div>
                )}
            </div>

            {/* Column 3: Inspector */}
            <div className="flex-1 flex flex-col bg-slate-900/30">
                {selectedNode ? (
                    <div className="h-full flex flex-col p-4">
                        <div className="mb-4">
                            <Label className="text-[10px] text-slate-500">Speaker</Label>
                            <Input
                                value={selectedNode.speaker}
                                onChange={(e) => updateSelectedNode({ speaker: e.target.value })}
                                className="h-8 bg-slate-950 border-slate-700 mb-2"
                            />

                            <Label className="text-[10px] text-slate-500">Dialogue Text</Label>
                            <Textarea
                                value={selectedNode.text}
                                onChange={(e) => updateSelectedNode({ text: e.target.value })}
                                className="bg-slate-950 border-slate-700 min-h-[80px]"
                            />
                        </div>

                        <div className="flex justify-between items-center border-b border-slate-800 pb-1 mb-2">
                            <Label className="text-xs text-slate-400">Player Options</Label>
                            <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 text-xs text-green-400 hover:text-green-300"
                                onClick={() => {
                                    const newOption: DialogueOption = { text: 'Next', nextNodeId: null };
                                    updateSelectedNode({ options: [...selectedNode.options, newOption] });
                                }}
                            >
                                <Plus className="w-3 h-3 mr-1" /> Option
                            </Button>
                        </div>

                        <div className="space-y-2 overflow-y-auto">
                            {selectedNode.options.map((opt, idx) => (
                                <div key={idx} className="bg-slate-950/50 p-2 rounded border border-slate-800 relative group">
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-1 right-1 h-4 w-4 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100"
                                        onClick={() => {
                                            const newOpts = [...selectedNode.options];
                                            newOpts.splice(idx, 1);
                                            updateSelectedNode({ options: newOpts });
                                        }}
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>

                                    <div className="grid gap-2">
                                        <Input
                                            value={opt.text}
                                            onChange={(e) => {
                                                const newOpts = [...selectedNode.options];
                                                newOpts[idx] = { ...opt, text: e.target.value };
                                                updateSelectedNode({ options: newOpts });
                                            }}
                                            className="h-7 text-xs bg-transparent border-slate-700"
                                            placeholder="Option Text (e.g. 'Yes')"
                                        />
                                        <div className="flex items-center gap-2">
                                            <ArrowRight className="w-3 h-3 text-slate-500" />
                                            <select
                                                value={opt.nextNodeId || ''}
                                                onChange={(e) => {
                                                    const newOpts = [...selectedNode.options];
                                                    newOpts[idx] = { ...opt, nextNodeId: e.target.value || null };
                                                    updateSelectedNode({ options: newOpts });
                                                }}
                                                className="h-7 flex-1 bg-slate-900 border border-slate-700 text-xs rounded px-2"
                                            >
                                                <option value="">(End Conversation)</option>
                                                {selectedDialogue && Object.values(selectedDialogue.nodes).map(n => (
                                                    <option key={n.id} value={n.id}>{n.id} - "{n.text.slice(0, 15)}..."</option>
                                                ))}
                                            </select>
                                        </div>
                                        <Input
                                            value={opt.actions?.[0] || ''}
                                            onChange={(e) => {
                                                const newOpts = [...selectedNode.options];
                                                // Simple single action support for now
                                                newOpts[idx] = { ...opt, actions: e.target.value ? [e.target.value] : [] };
                                                updateSelectedNode({ options: newOpts });
                                            }}
                                            className="h-6 text-[10px] bg-transparent border-slate-800 text-slate-500"
                                            placeholder="Action (e.g. set_flag:met_elder=true)"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-600 text-xs p-4 text-center">Select a node to edit</div>
                )}
            </div>
        </div>
    );
};
