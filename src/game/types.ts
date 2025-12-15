import { Database } from '@/integrations/supabase/types';

export interface InventoryItem {
    id: string;
    name: string;
    count: number;
    type: string;
    icon?: string;
}

export interface GameStats {
    warmth: number;
    days_survived?: number;
}

export interface GameData {
    inventory: InventoryItem[];
    stats: GameStats;
}

export type GamePlayer = {
    id: string;
    user_id: string;
    campaign_id: string;
    display_name: string;
    data: GameData;
    last_seen: string;
    created_at: string;
};

export interface GameStructure {
    id: string;
    campaign_id: string;
    owner_id: string;
    type: string;
    x: number;
    y: number;
    data: Record<string, any>;
}

export interface ServerPlayerState {
    id: string;
    x: number;
    y: number;
    name: string;
}
