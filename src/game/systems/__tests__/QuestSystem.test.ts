import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuestSystem, Quest } from '../QuestSystem';

describe('QuestSystem', () => {
    let questSystem: QuestSystem;

    beforeEach(() => {
        // Reset singleton for each test
        (QuestSystem as any).instance = null;
        questSystem = QuestSystem.getInstance();
    });

    describe('Singleton Pattern', () => {
        it('returns the same instance', () => {
            const instance1 = QuestSystem.getInstance();
            const instance2 = QuestSystem.getInstance();
            expect(instance1).toBe(instance2);
        });
    });

    describe('startQuest', () => {
        it('starts a new quest successfully', () => {
            const quest: Quest = {
                id: 'test_quest',
                title: 'Test Quest',
                description: 'A test quest',
                completed: false,
                steps: [
                    { id: 'step1', description: 'Step 1', targetAmount: 1, currentAmount: 0, completed: false }
                ],
                rewards: { shards: 10, items: [] }
            };

            questSystem.startQuest(quest);
            expect(questSystem.getActiveQuest()).toEqual(quest);
        });

        it('does not start duplicate quests', () => {
            const quest: Quest = {
                id: 'test_quest',
                title: 'Test Quest',
                description: 'A test quest',
                completed: false,
                steps: [],
                rewards: { shards: 10, items: [] }
            };

            questSystem.startQuest(quest);
            questSystem.startQuest(quest); // Try to start again
            expect(questSystem.getActiveQuest()?.id).toBe('test_quest');
        });
    });

    describe('updateStep', () => {
        it('updates step progress correctly', () => {
            const quest: Quest = {
                id: 'test_quest',
                title: 'Test Quest',
                description: 'A test quest',
                completed: false,
                steps: [
                    { id: 'step1', description: 'Collect 3 items', targetAmount: 3, currentAmount: 0, completed: false }
                ],
                rewards: { shards: 10, items: [] }
            };

            questSystem.startQuest(quest);
            questSystem.updateStep('step1', 1);

            const activeQuest = questSystem.getActiveQuest();
            expect(activeQuest?.steps[0].currentAmount).toBe(1);
            expect(activeQuest?.steps[0].completed).toBe(false);
        });

        it('marks step as completed when target reached', () => {
            const quest: Quest = {
                id: 'test_quest',
                title: 'Test Quest',
                description: 'A test quest',
                completed: false,
                steps: [
                    { id: 'step1', description: 'Collect 2 items', targetAmount: 2, currentAmount: 0, completed: false },
                    { id: 'step2', description: 'Another step', targetAmount: 5, currentAmount: 0, completed: false }
                ],
                rewards: { shards: 10, items: [] }
            };

            questSystem.startQuest(quest);
            questSystem.updateStep('step1', 2);

            const activeQuest = questSystem.getActiveQuest();
            expect(activeQuest?.steps[0].completed).toBe(true);
        });

        it('does not exceed target amount', () => {
            const quest: Quest = {
                id: 'test_quest',
                title: 'Test Quest',
                description: 'A test quest',
                completed: false,
                steps: [
                    { id: 'step1', description: 'Collect 2 items', targetAmount: 2, currentAmount: 0, completed: false },
                    { id: 'step2', description: 'Step 2', targetAmount: 5, currentAmount: 0, completed: false }
                ],
                rewards: { shards: 10, items: [] }
            };

            questSystem.startQuest(quest);
            questSystem.updateStep('step1', 10);

            const activeQuest = questSystem.getActiveQuest();
            expect(activeQuest?.steps[0].currentAmount).toBe(2);
        });
    });

    describe('Quest Completion', () => {
        it('completes quest when all steps are done', () => {
            const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

            const quest: Quest = {
                id: 'test_quest',
                title: 'Test Quest',
                description: 'A test quest',
                completed: false,
                steps: [
                    { id: 'step1', description: 'Step 1', targetAmount: 1, currentAmount: 0, completed: false }
                ],
                rewards: { shards: 10, items: [] }
            };

            questSystem.startQuest(quest);
            questSystem.updateStep('step1', 1);

            // Quest should be completed and active quest should be null
            expect(questSystem.getActiveQuest()).toBeNull();

            // Check that completion event was fired
            expect(dispatchSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'game-quest-complete'
                })
            );

            dispatchSpy.mockRestore();
        });
    });

    describe('Daily Quest', () => {
        it('generates a daily quest with correct structure', () => {
            const dailyQuest = questSystem.generateDailyQuest();

            expect(dailyQuest.id).toContain('daily_');
            expect(dailyQuest.title).toContain('Daily:');
            expect(dailyQuest.steps.length).toBe(1);
            expect(dailyQuest.rewards.shards).toBeGreaterThan(0);
        });
    });
});
