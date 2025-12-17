import { create } from 'zustand';
import { Quest, Dialogue } from '@/game/types/StoryTypes';

export interface LevelData {
    id: string;
    name: string;
    width: number;
    height: number;
    layers: Layer[];
    entities: Entity[];
    logic: LogicNode[];
}

export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    data: number[][]; // for tile layers
}

export interface Layer {
    id: string;
    name: string;
    visible: boolean;
    locked: boolean;
    data: number[][]; // For tilemaps
}

export interface Entity {
    id: string;
    x: number;
    y: number;
    type: string;
    properties: Record<string, any>;
    scale: number;
    rotation: number;
}

export interface LogicNode {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'trigger' | 'spawn' | 'event';
    properties: Record<string, any>; // e.g., target_map_id, message, etc.
    condition?: string; // e.g. "flag:met_elder"
}

export interface ProjectData {
    quests: Quest[];
    dialogues: Dialogue[];
}

interface EditorState {
    activeTool: 'select' | 'brush' | 'stamp' | 'eraser' | 'path';
    activeLayer: 'terrain' | 'objects' | 'logic' | 'story';

    activeTile: number; // Index of tile to paint

    // Tool Settings
    brushSize: number;
    brushIntensity: number; // 0-1 for opacity or softness
    gridSize: number;
    isGridEnabled: boolean;

    // Selection
    selectedAsset: string | null; // ID of asset to paint
    selectedEntityIds: string[]; // IDs of selected objects on map

    // Map Data
    mapData: LevelData;

    // Actions
    setTool: (tool: EditorState['activeTool']) => void;
    setLayer: (layer: EditorState['activeLayer']) => void;
    setAsset: (assetId: string) => void;
    setTile: (tileId: number) => void;
    setSelectedEntityIds: (ids: string[]) => void;
    toggleGrid: () => void;
    setGridSize: (size: number) => void;
    setBrushSize: (size: number) => void;

    // Map Actions
    addEntity: (entity: Entity) => void;
    removeEntity: (id: string) => void;
    updateEntity: (id: string, updates: Partial<Entity>) => void;
    updateTileLayer: (layerId: string, data: number[][]) => void;

    // Persistence
    setMapData: (data: LevelData) => void;
    setMapName: (name: string) => void;

    // Logic Actions
    addLogicNode: (node: LogicNode) => void;
    removeLogicNode: (id: string) => void;
    updateLogicNode: (id: string, updates: Partial<LogicNode>) => void;

    // Project Actions
    project: ProjectData;
    addQuest: (quest: Quest) => void;
    updateQuest: (id: string, updates: Partial<Quest>) => void;
    removeQuest: (id: string) => void;

    addDialogue: (dialogue: Dialogue) => void;
    updateDialogue: (id: string, updates: Partial<Dialogue>) => void;
    removeDialogue: (id: string) => void;
}

// Helper to generate a blank snow map
const generateSnowMap = (width: number, height: number): LevelData => {
    const snowLayer: number[][] = [];
    for (let y = 0; y < height; y++) {
        const row: number[] = [];
        for (let x = 0; x < width; x++) {
            row.push(1); // ID 1 = Snow
        }
        snowLayer.push(row);
    }

    return {
        id: 'new-map',
        name: 'New Map',
        width,
        height,
        layers: [
            { id: 'ground', name: 'Ground', visible: true, locked: false, data: snowLayer }
        ],
        entities: [],
        logic: []
    };
};

const DEFAULT_MAP = generateSnowMap(64, 64);

export const useEditorStore = create<EditorState>((set) => ({
    activeTool: 'select',
    activeLayer: 'objects',
    activeTile: 1, // Default to Snow

    brushSize: 1,
    brushIntensity: 1.0,
    gridSize: 64,
    isGridEnabled: true,

    selectedAsset: null,
    selectedEntityIds: [],
    mapData: DEFAULT_MAP,

    setTool: (tool) => set({ activeTool: tool }),
    setLayer: (layer) => set({ activeLayer: layer }),
    setAsset: (asset) => set({ selectedAsset: asset, activeTool: 'stamp' }), // Auto-switch to stamp
    setTile: (tile) => set({ activeTile: tile, activeTool: 'brush' }), // Auto-switch to brush
    setSelectedEntityIds: (ids) => set({ selectedEntityIds: ids }),

    toggleGrid: () => set((state) => ({ isGridEnabled: !state.isGridEnabled })),
    setGridSize: (size) => set({ gridSize: size }),
    setBrushSize: (size) => set({ brushSize: size }),

    addEntity: (entity) => set((state) => ({
        mapData: {
            ...state.mapData,
            entities: [...state.mapData.entities, entity]
        }
    })),

    removeEntity: (id) => set((state) => ({
        mapData: {
            ...state.mapData,
            entities: state.mapData.entities.filter(e => e.id !== id)
        },
        selectedEntityIds: state.selectedEntityIds.filter(sid => sid !== id)
    })),

    updateEntity: (id, updates) => set((state) => ({
        mapData: {
            ...state.mapData,
            entities: state.mapData.entities.map(e =>
                e.id === id ? { ...e, ...updates } : e
            )
        }
    })),

    updateTileLayer: (layerId, data) => set((state) => ({
        mapData: {
            ...state.mapData,
            layers: state.mapData.layers.map(l =>
                l.id === layerId ? { ...l, data } : l
            )
        }
    })),

    setMapData: (data) => set({
        mapData: data,
        selectedEntityIds: [] // Clear selection on load
    }),

    setMapName: (name) => set((state) => ({
        mapData: { ...state.mapData, name }
    })),

    addLogicNode: (node) => set((state) => ({
        mapData: {
            ...state.mapData,
            logic: [...state.mapData.logic, node]
        }
    })),

    removeLogicNode: (id) => set((state) => ({
        mapData: {
            ...state.mapData,
            logic: state.mapData.logic.filter(n => n.id !== id)
        },
        selectedEntityIds: state.selectedEntityIds.filter(sid => sid !== id)
    })),

    updateLogicNode: (id, updates) => set((state) => ({
        mapData: {
            ...state.mapData,
            logic: state.mapData.logic.map(n =>
                n.id === id ? { ...n, ...updates } : n
            )
        }
    })),

    // Project Data
    project: { quests: [], dialogues: [] },

    addQuest: (quest) => set((state) => ({
        project: { ...state.project, quests: [...state.project.quests, quest] }
    })),
    updateQuest: (id, updates) => set((state) => ({
        project: {
            ...state.project,
            quests: state.project.quests.map(q => q.id === id ? { ...q, ...updates } : q)
        }
    })),
    removeQuest: (id) => set((state) => ({
        project: {
            ...state.project,
            quests: state.project.quests.filter(q => q.id !== id)
        }
    })),

    addDialogue: (dialogue) => set((state) => ({
        project: { ...state.project, dialogues: [...state.project.dialogues, dialogue] }
    })),
    updateDialogue: (id, updates) => set((state) => ({
        project: {
            ...state.project,
            dialogues: state.project.dialogues.map(d => d.id === id ? { ...d, ...updates } : d)
        }
    })),
    removeDialogue: (id) => set((state) => ({
        project: {
            ...state.project,
            dialogues: state.project.dialogues.filter(d => d.id !== id)
        }
    })),
}));
