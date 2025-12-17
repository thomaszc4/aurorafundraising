export interface InventoryItem {
    id: string;
    type: 'resource' | 'tool' | 'quest_item' | 'structure' | 'item';
    name: string;
    count: number;
    icon: string;
    description?: string;
}

export interface PlayerStats {
    warmth: number;
    days_survived: number;
    health?: number;
}

export interface GameData {
    inventory: InventoryItem[];
    stats: PlayerStats;
    appearance?: {
        archetype: 'alpinist' | 'surveyor' | 'local';
        gender: 'm' | 'f';
    };
    // New RPG Fields (Local Cache)
    personal_skills?: string[];
    contribution_score?: number;
}

// --- NEW RPG TYPES ---

export interface LogEntry {
    id: string;
    text: string;
    author: string; // Player Name
    timestamp: number;
    type: 'info' | 'quest' | 'chat';
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    required_level: number; // 0-10
    funding_gate?: number; // 0.25, 0.5, etc.
    is_completed: boolean;
    objectives: { id: string, text: string, completed: boolean }[];
    reward_skill?: string;
}

export interface CampaignState {
    campaign_id: string;
    current_quest_index: number;
    unlocked_skills: string[];
    global_inventory: InventoryItem[];
    quest_log: LogEntry[];
    total_raised: number;
    goal_amount?: number; // Fetched from campaign trigger?
}
