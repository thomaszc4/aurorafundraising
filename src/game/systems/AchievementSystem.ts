export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    targetValue: number;
    currentValue: number;
    unlocked: boolean;
    category: 'gather' | 'survival' | 'social' | 'fundraising';
}

const ACHIEVEMENTS_STORAGE_KEY = 'aurora_game_achievements';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
    { id: 'gather_10', title: 'Beginner Gatherer', description: 'Gather 10 resources', icon: '🪵', targetValue: 10, currentValue: 0, unlocked: false, category: 'gather' },
    { id: 'gather_100', title: 'Master Harvester', description: 'Gather 100 resources', icon: '⛏️', targetValue: 100, currentValue: 0, unlocked: false, category: 'gather' },
    { id: 'survive_1', title: 'Survivor', description: 'Survive your first storm', icon: '❄️', targetValue: 1, currentValue: 0, unlocked: false, category: 'survival' },
    { id: 'shards_50', title: 'Shard Seeker', description: 'Collect 50 Ice Shards', icon: '💎', targetValue: 50, currentValue: 0, unlocked: false, category: 'fundraising' },
];

export class AchievementSystem {
    private static instance: AchievementSystem;
    private achievements: Achievement[] = [];

    private constructor() {
        this.loadAchievements();
    }

    public static getInstance(): AchievementSystem {
        if (!AchievementSystem.instance) {
            AchievementSystem.instance = new AchievementSystem();
        }
        return AchievementSystem.instance;
    }

    private loadAchievements() {
        const saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
        if (saved) {
            this.achievements = JSON.parse(saved);
        } else {
            this.achievements = [...DEFAULT_ACHIEVEMENTS];
            this.saveAchievements();
        }
    }

    private saveAchievements() {
        localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(this.achievements));
    }

    public trackProgress(categoryId: string, amount: number = 1) {
        let changed = false;
        this.achievements = this.achievements.map(ach => {
            if (!ach.unlocked && ach.id.startsWith(categoryId)) {
                ach.currentValue += amount;
                if (ach.currentValue >= ach.targetValue) {
                    ach.unlocked = true;
                    ach.currentValue = ach.targetValue;
                    this.notifyAchievement(ach);
                }
                changed = true;
            }
            return ach;
        });

        if (changed) this.saveAchievements();
    }

    private notifyAchievement(achievement: Achievement) {
        window.dispatchEvent(new CustomEvent('game-achievement-unlocked', { detail: achievement }));
        // Also a general notification
        window.dispatchEvent(new CustomEvent('game-notification', {
            detail: {
                message: `Achievement Unlocked: ${achievement.title}`,
                type: 'success'
            }
        }));
    }

    public getAchievements(): Achievement[] {
        return this.achievements;
    }
}
