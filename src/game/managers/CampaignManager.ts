import { supabase } from '@/integrations/supabase/client';
import { CampaignState, Quest, LogEntry, InventoryItem } from '../types';
import Phaser from 'phaser';

export class CampaignManager extends Phaser.Events.EventEmitter {
    private campaignId: string;
    private state: CampaignState | null = null;
    private subscription: any = null;

    // QUEST DATA (Hardcoded for now, ideal for Phase 4)
    private quests: Quest[] = [
        { id: 'q1', title: 'Tutorial', description: 'Learn to move', required_level: 0, is_completed: false, objectives: [] },
        { id: 'q2', title: 'Gathering', description: 'Collect Wood', required_level: 1, is_completed: false, objectives: [] },
        { id: 'q3', title: 'The First Gate', description: 'Reach 25% Goal', required_level: 2, funding_gate: 0.25, is_completed: false, objectives: [] },
        // ... more
    ];

    constructor(campaignId: string) {
        super();
        this.campaignId = campaignId;
    }

    async init() {
        // 1. Fetch Initial State
        const { data, error } = await supabase
            .from('campaign_state')
            .select('*')
            .eq('campaign_id', this.campaignId)
            .maybeSingle();

        if (error) console.error("Campaign Load Error", error);

        if (data) {
            this.state = data as CampaignState;
        } else {
            // Create if missing (Lazy Init)
            const newState: CampaignState = {
                campaign_id: this.campaignId,
                current_quest_index: 0,
                unlocked_skills: [],
                global_inventory: [],
                quest_log: [],
                total_raised: 0
            };
            await supabase.from('campaign_state').insert(newState);
            this.state = newState;
        }

        // 2. Subscribe to Updates
        this.subscription = supabase
            .channel(`campaign_${this.campaignId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campaign_state', filter: `campaign_id=eq.${this.campaignId}` },
                (payload) => {
                    this.state = payload.new as CampaignState;
                    this.emit('state_updated', this.state);
                })
            .subscribe();

        console.log("CampaignManager Initialized", this.state);
    }

    // --- GETTERS ---
    getState() { return this.state; }

    getCurrentQuest(): Quest | null {
        if (!this.state) return null;
        const idx = this.state.current_quest_index;
        return this.quests[idx] || null;
    }

    // --- LOGIC ---

    checkGateStatus(questIndex: number): { locked: boolean, reason?: string } {
        if (!this.state) return { locked: true, reason: "Loading..." };

        const targetQuest = this.quests[questIndex];
        if (!targetQuest) return { locked: true, reason: "Invalid Quest" };

        // 1. Sequential Check
        if (questIndex > this.state.current_quest_index + 1) {
            return { locked: true, reason: "Complete previous quests first." };
        }

        // 2. Funding Gate Check
        if (targetQuest.funding_gate) {
            // Assume goal is 10000 for now if missing, or fetch from elsewhere
            const goal = this.state.goal_amount || 10000;
            const required = goal * targetQuest.funding_gate;
            if (this.state.total_raised < required) {
                return {
                    locked: true,
                    reason: `Fundraising Gate: Need ${targetQuest.funding_gate * 100}% ($${required}) - Current: $${this.state.total_raised}`
                };
            }
        }

        return { locked: false };
    }

    async addLog(text: string, author: string) {
        if (!this.state) return;
        const newLog: LogEntry = {
            id: Date.now().toString(),
            text, author, timestamp: Date.now(), type: 'info'
        };
        const updatedLogs = [...this.state.quest_log, newLog].slice(-50); // Keep last 50

        // Optimistic Update
        this.state.quest_log = updatedLogs;
        this.emit('state_updated', this.state);

        await supabase.from('campaign_state')
            .update({ quest_log: updatedLogs })
            .eq('campaign_id', this.campaignId);
    }

    destroy() {
        if (this.subscription) supabase.removeChannel(this.subscription);
    }
}
