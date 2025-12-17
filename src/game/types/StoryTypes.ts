export interface Quest {
    id: string;
    title: string;
    description: string;
    prerequisites: string[]; // List of Quest IDs or Flags required
    steps: QuestStep[];
    rewards: QuestReward[];
}

export interface QuestStep {
    id: string;
    description: string;
    type: 'flag' | 'collect' | 'visit';
    target: string; // flag_name, item_id, or region_id
    count?: number; // For collection
    isCompleted?: boolean; // Runtime state
}

export interface QuestReward {
    type: 'xp' | 'item' | 'unlock';
    target: string;
    amount?: number;
}

export interface Dialogue {
    id: string;
    npcId: string;
    rootNodeId: string;
    nodes: Record<string, DialogueNode>;
}

export interface DialogueNode {
    id: string;
    text: string;
    speaker: string; // 'Player' or NPC Name
    options: DialogueOption[];
}

export interface DialogueOption {
    text: string;
    nextNodeId: string | null; // null = end conversation
    conditions?: string[]; // e.g. "flag:has_met_elder"
    actions?: string[]; // e.g. "set_flag:quest_started"
}
