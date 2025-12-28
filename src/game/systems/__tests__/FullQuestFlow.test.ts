import { QuestSystem } from '../QuestSystem';
import { gameEvents } from '../../EventBus';

describe('QuestSystem Full Flow Verification', () => {
    let questSystem: QuestSystem;

    beforeEach(() => {
        // Reset singleton if possible or just get instance
        questSystem = QuestSystem.getInstance();
        // Reset state manually if needed, or assume fresh run per test file in some runners.
        // For this simple test, we'll just drive it forward.
    });

    test('Simplified 4-Step Quest Flow', () => {
        // 1. Start Quest
        questSystem.startMapRiddleQuest();
        expect(questSystem.getActiveQuest()?.id).toBe('map_riddle');
        expect(questSystem.getCurrentStep()?.id).toBe('talk_elder');

        // 2. Speak to Elder (Step 1)
        questSystem.updateStep('talk_elder');
        expect(questSystem.getCurrentStep()?.id).toBe('find_builder');

        // 3. Find Builder (Step 2)
        questSystem.updateStep('find_builder');
        expect(questSystem.getCurrentStep()?.id).toBe('find_chest');

        // 4. Find Chest (Step 3)
        questSystem.updateStep('find_chest');
        expect(questSystem.getCurrentStep()?.id).toBe('return_aurora');

        // 5. Return to Aurora (Step 4)
        questSystem.updateStep('return_aurora');

        // Quest Should be Complete
        expect(questSystem.getActiveQuest()).toBeNull();
    });
});
