import { Database } from '@/integrations/supabase/types';

export type GamePlayer = {
    id: string;
    campaign_id: string;
    student_fundraiser_id: string;
    display_name: string;
    avatar_seed?: string;
    tokens: number;
    x: number;
    y: number;
    score: number;
    inventory: Record<string, number>; // itemId -> count
    last_seen_at: string;
};

export type GameObject = {
    id: string;
    campaign_id: string;
    owner_id?: string;
    type: string; // 'igloo' | 'tree' | 'stove'
    x: number;
    y: number;
    data: any;
};

export interface ServerPlayerState {
    id: string;
    x: number;
    y: number;
    display_name: string;
}
