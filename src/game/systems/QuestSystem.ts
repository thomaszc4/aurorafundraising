import { supabase } from '@/integrations/supabase/client';
// ... imports

export class QuestSystem {
    private networkManager: NetworkManager;
    private activeQuests: Map<string, Quest> = new Map();
    private completedQuestIds: Set<string> = new Set();
    private isReady: boolean = false;

    // Fundraising State Cache
    private currentFundraisingTotal: number = 0;

    constructor(networkManager: NetworkManager) {
        this.networkManager = networkManager;
    }

    public async init(savedQuests: any[], totalRaised: number) {
        this.currentFundraisingTotal = totalRaised;

        await this.loadDefinitions();

        // Restore progress (TODO: Apply savedQuests to the definitions)
        // For now, we assume savedQuests are just IDs or simple objects we need to map.

        this.isReady = true;

        // Listen to events
        this.networkManager.on('fundraising_update', (data: any) => {
            this.updateFundraising(data.total_raised);
        });
    }

    private async loadDefinitions() {
        const { data, error } = await supabase.from('quest_definitions').select('*');

        if (data && data.length > 0) {
            console.log(`Loaded ${data.length} quests from DB.`);
            data.forEach((def: any) => {
                this.addQuest({
                    id: def.id,
                    title: def.title,
                    description: def.description,
                    steps: def.steps, // Assumes JSON matches interface
                    rewards: def.rewards,
                    isComplete: false,
                    isUnlocked: def.id === 'q_arrival', // Start with first quest unlocked
                    // logic for chaining needs to be handled (unlock next when current completes)
                    nextQuestId: def.next_quest_id
                } as any);
            });

            // Re-evaluate fundraising goals with loaded quests
            if (this.currentFundraisingTotal > 0) {
                this.checkQuests('FUNDRAISING_GOAL', this.currentFundraisingTotal);
            }
        } else {
            console.log("Using Fallback Quests");
            this.registerDefaultQuests();
        }
    }

    private registerDefaultQuests() {
        // Quest 1: The Arrival
        this.addQuest({
            id: 'q_arrival',
            title: 'The Arrival',
            description: 'Welcome to the island. Check in with the Base Camp.',
            isUnlocked: true,
            isComplete: false,
            steps: [
                {
                    id: 'visit_base',
                    description: 'Go to the center of the camp (4000, 4000)',
                    conditionType: 'LOCATION_VISIT',
                    targetValue: { x: 4000, y: 4000, radius: 200 },
                    currentValue: 0,
                    isComplete: false
                }
            ],
            rewards: [{ type: 'xp', value: 'xp', amount: 50 }]
        });
        // ... (Keep other hardcoded quests abbreviated or fully present if needed for fallback)
        // Quest 2
        this.addQuest({
            id: 'q_build_shelter',
            title: 'Build Shelter',
            description: 'It is getting cold. Gather wood to help build a fire.',
            isUnlocked: false, // Originally true, but let's chain them? No, kept as true for fallback simplicity.
            isComplete: false,
            steps: [{
                id: 'collect_wood',
                description: 'Collect 5 Pine Wood',
                conditionType: 'ITEM_COLLECT',
                targetValue: { itemId: 'pine_wood', count: 5 }, // specific ID
                currentValue: 0,
                isComplete: false
            }],
            rewards: [{ type: 'tokens', value: 'tokens', amount: 100 }]
        });

        // Quest 3: Community Goal (The Bridge)
        this.addQuest({
            id: 'q_bridge_fund',
            title: 'Build the Bridge',
            description: 'The community must raise $5000 to repair the bridge.',
            isUnlocked: true,
            isComplete: false,
            steps: [
                {
                    id: 'fund_5000',
                    description: 'Campaign Total: $5000',
                    conditionType: 'FUNDRAISING_GOAL',
                    targetValue: 5000,
                    currentValue: this.currentFundraisingTotal,
                    isComplete: this.currentFundraisingTotal >= 5000
                }
            ],
            rewards: [{ type: 'item', value: 'Bridge Access Key', amount: 1 }]
        });
    }

    private addQuest(quest: Quest) {
        this.activeQuests.set(quest.id, quest);
    }

    public updateFundraising(newTotal: number) {
        this.currentFundraisingTotal = newTotal;
        this.checkQuests('FUNDRAISING_GOAL', newTotal);
    }

    public checkInventory(inventory: InventoryItem[]) {
        this.checkQuests('ITEM_COLLECT', inventory);
    }

    public checkLocation(x: number, y: number) {
        this.activeQuests.forEach(quest => {
            if (quest.isComplete) return;

            quest.steps.forEach(step => {
                if (!step.isComplete && step.conditionType === 'LOCATION_VISIT') {
                    const target = step.targetValue as { x: number, y: number, radius: number };
                    const dist = Math.sqrt(Math.pow(x - target.x, 2) + Math.pow(y - target.y, 2));
                    if (dist <= target.radius) {
                        this.completeStep(quest, step);
                    }
                }
            });
        });
    }

    private checkQuests(type: QuestConditionType, value: any) {
        this.activeQuests.forEach(quest => {
            if (quest.isComplete) return;

            quest.steps.forEach(step => {
                if (!step.isComplete && step.conditionType === type) {
                    if (type === 'FUNDRAISING_GOAL') {
                        step.currentValue = value;
                        if (value >= step.targetValue) {
                            this.completeStep(quest, step);
                        }
                    } else if (type === 'ITEM_COLLECT') {
                        const inventory = value as InventoryItem[];
                        const target = step.targetValue as { itemId: string, count: number };
                        const item = inventory.find(i => i.id === target.itemId);
                        const currentCount = item ? item.count : 0;
                        step.currentValue = currentCount;

                        if (currentCount >= target.count) {
                            this.completeStep(quest, step);
                        }
                    }
                }
            });
        });
    }

    private completeStep(quest: Quest, step: QuestStep) {
        step.isComplete = true;
        console.log(`Quest Step Complete: ${step.description}`);

        // Check if quest is done
        if (quest.steps.every(s => s.isComplete)) {
            this.completeQuest(quest);
        } else {
            // Notify UI of update
            window.dispatchEvent(new CustomEvent('quest-update', { detail: quest }));
        }
    }

    private completeQuest(quest: Quest) {
        quest.isComplete = true;
        this.completedQuestIds.add(quest.id);
        console.log(`QUEST COMPLETE: ${quest.title}`);

        // Give Rewards
        // Emit Event
        window.dispatchEvent(new CustomEvent('quest-complete', { detail: quest }));

        // TODO: Persist to DB via Supabase
    }

    public getActiveQuests() {
        return Array.from(this.activeQuests.values()).filter(q => q.isUnlocked && !q.isComplete);
    }
}
