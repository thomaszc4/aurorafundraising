import Phaser from 'phaser';

export interface QuestStep {
    id: string;
    description: string;
    targetAmount: number;
    currentAmount: number;
    completed: boolean;
}

export interface Quest {
    id: string;
    title: string;
    description: string;
    steps: QuestStep[];
    completed: boolean;
    rewards: {
        shards: number;
        items: { name: string; count: number }[];
    };
}

export class QuestSystem {
    private static instance: QuestSystem;
    private quests: Map<string, Quest> = new Map();
    private activeQuestId: string | null = null;

    private constructor() { }

    public static getInstance(): QuestSystem {
        if (!QuestSystem.instance) {
            QuestSystem.instance = new QuestSystem();
        }
        return QuestSystem.instance;
    }

    public startQuest(quest: Quest) {
        if (this.quests.has(quest.id)) return;
        this.quests.set(quest.id, quest);
        this.activeQuestId = quest.id;
        this.emitUpdate();
        console.log(`Quest Started: ${quest.title}`);
    }

    public updateStep(stepId: string, amount: number = 1) {
        if (!this.activeQuestId) return;
        const quest = this.quests.get(this.activeQuestId);
        if (!quest || quest.completed) return;

        const step = quest.steps.find(s => s.id === stepId);
        if (step && !step.completed) {
            step.currentAmount = Math.min(step.currentAmount + amount, step.targetAmount);
            if (step.currentAmount >= step.targetAmount) {
                step.completed = true;
                console.log(`Step Completed: ${step.description}`);
            }
            this.checkQuestCompletion(quest);
            this.emitUpdate();
        }
    }

    private checkQuestCompletion(quest: Quest) {
        if (quest.steps.every(s => s.completed)) {
            quest.completed = true;
            this.activeQuestId = null;
            console.log(`Quest Completed: ${quest.title}`);
            window.dispatchEvent(new CustomEvent('game-quest-complete', { detail: quest }));
        }
    }

    private emitUpdate() {
        const quest = this.activeQuestId ? this.quests.get(this.activeQuestId) : null;
        window.dispatchEvent(new CustomEvent('game-quest-update', { detail: quest }));
    }

    public getActiveQuest(): Quest | null {
        return this.activeQuestId ? this.quests.get(this.activeQuestId)! : null;
    }

    public getCurrentStep(): QuestStep | null {
        const quest = this.getActiveQuest();
        if (!quest) return null;
        return quest.steps.find(s => !s.completed) || null;
    }

    public generateDailyQuest(): Quest {
        const templates = [
            { id: 'daily_gather_wood', title: 'Woodcutter', desc: 'Gather 10 Pine Wood', stepId: 'gather_wood', target: 10, reward: 25 },
            { id: 'daily_gather_ice', title: 'Ice Collector', desc: 'Gather 10 Ice Shards', stepId: 'gather_ice', target: 10, reward: 25 },
            { id: 'daily_survive', title: 'Survivor', desc: 'Survive for 5 minutes', stepId: 'survive_time', target: 300, reward: 50 },
            { id: 'daily_build', title: 'Builder', desc: 'Build 2 Structures', stepId: 'build_structure', target: 2, reward: 30 },
        ];

        const template = templates[Math.floor(Math.random() * templates.length)];
        const date = new Date().toISOString().split('T')[0];

        return {
            id: `${template.id}_${date}`,
            title: `Daily: ${template.title}`,
            description: template.desc,
            completed: false,
            steps: [
                { id: template.stepId, description: template.desc, targetAmount: template.target, currentAmount: 0, completed: false }
            ],
            rewards: { shards: template.reward, items: [] }
        };
    }

    public startDailyQuest() {
        const dailyKey = `daily_quest_${new Date().toISOString().split('T')[0]}`;
        if (localStorage.getItem(dailyKey)) {
            console.log('Daily quest already completed today.');
            return;
        }
        const quest = this.generateDailyQuest();
        this.startQuest(quest);
    }

    public completeDailyQuest(questId: string) {
        const dailyKey = `daily_quest_${new Date().toISOString().split('T')[0]}`;
        localStorage.setItem(dailyKey, 'true');
    }

    public startMapRiddleQuest() {
        const quest: Quest = {
            id: 'map_riddle',
            title: 'Expedition to the North',
            description: 'A simplified journey to save the penguins.',
            steps: [
                { id: 'talk_elder', description: 'Speak to the Elder Penguin on the North Ridge', targetAmount: 1, currentAmount: 0, completed: false },
                { id: 'find_builder', description: 'Find the Builder Penguin in the West', targetAmount: 1, currentAmount: 0, completed: false },
                { id: 'find_chest', description: 'Locate the Ancient Chest (North East)', targetAmount: 1, currentAmount: 0, completed: false },
                { id: 'return_aurora', description: 'Return to Captain Aurora', targetAmount: 1, currentAmount: 0, completed: false }
            ],
            completed: false,
            rewards: { shards: 500, items: [{ name: 'Ancient Artifact', count: 1 }] }
        };
        this.startQuest(quest);
    }
}
