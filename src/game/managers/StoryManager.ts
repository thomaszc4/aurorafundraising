import { QuestSystem } from "../systems/QuestSystem";

export const DIALOGUE_DATA = {
    'captain_aurora': {
        'intro': [
            {
                text: "Ah, welcome! Talk to the Elder Penguin on the North Ridge to begin.",
                speaker: "Captain Aurora",
                portrait: "👩‍✈️",
                triggerQuest: 'map_riddle'
            }
        ],
        'quest_active': [
            { text: "Go on, the Elder is waiting.", speaker: "Captain Aurora", portrait: "👩‍✈️" }
        ],
        'quest_return': [
            {
                text: "You found it! The Artifact! You are a hero.",
                speaker: "Captain Aurora",
                portrait: "👩‍✈️",
                updateQuest: 'return_aurora'
            }
        ],
        'quest_complete': [
            { text: "Thank you for your help, Survivor.", speaker: "Captain Aurora", portrait: "👩‍✈️" }
        ]
    },
    'elder_penguin': {
        'intro': [
            {
                text: "Ho there! You seek the artifact? First, you must find the Builder Penguin in the West.",
                speaker: "Elder Penguin",
                portrait: "🐧",
                updateQuest: 'talk_elder'
            }
        ],
        'solved': [
            { text: "Find the Builder. He knows where the chest is.", speaker: "Elder Penguin", portrait: "🐧" }
        ]
    },
    'builder_penguin': {
        'intro': [
            { text: "The Elder sent you? The Chest is in the North East! Go!", speaker: "Builder Penguin", portrait: "👷", updateQuest: 'find_builder' }
        ],
        'has_shovel': [
            { text: "Go to the North East! The Chest is there.", speaker: "Builder Penguin", portrait: "👷" }
        ]
    },
    'chest': {
        'open': [
            { text: "You open the chest... Inside is the Ancient Artifact!", speaker: "Ancient Chest", portrait: "💎", updateQuest: 'find_chest' }
        ],
        'empty': [
            { text: "Empty.", speaker: "Ancient Chest", portrait: "📦" }
        ]
    },
    // Passive NPCs (Flavor text only now)
    'campfire': { 'intro': [{ text: "A warm fire.", speaker: "Campfire", portrait: "🔥" }] },
    'wind_shrine': { 'intro': [{ text: "The wind howls.", speaker: "Wind Shrine", portrait: "💨" }] },
    'dig_site': { 'intro': [{ text: "Just snow here.", speaker: "System", portrait: "❄️" }] }
};

export class StoryManager {
    public static getDialogue(npcId: string, _defaultState: string) {
        const quest = QuestSystem.getInstance().getActiveQuest();

        // Default state
        let state = 'intro';

        if (quest && quest.id === 'map_riddle') {
            const steps = quest.steps;
            const stepMap = new Map(steps.map(s => [s.id, s.completed]));

            if (npcId === 'captain_aurora') {
                if (stepMap.get('return_aurora')) state = 'quest_complete'; // Finished
                else if (stepMap.get('find_chest')) state = 'quest_return'; // Ready to turn in
                else state = 'quest_active'; // Waiting for you
            }
            else if (npcId === 'elder_penguin') {
                // Step 1: Talk to Elder
                if (!stepMap.get('talk_elder')) state = 'intro';
                else state = 'solved';
            }
            else if (npcId === 'builder_penguin') {
                // Step 2: Find Builder
                if (stepMap.get('talk_elder') && !stepMap.get('find_builder')) state = 'intro'; // Trigger completion
                else if (stepMap.get('find_builder')) state = 'has_shovel';
            }
            else if (npcId === 'chest') {
                // Step 3: Find Chest
                if (stepMap.get('find_builder') && !stepMap.get('find_chest')) state = 'open'; // Trigger completion
                else if (stepMap.get('find_chest')) state = 'empty';
            }
        }

        return (DIALOGUE_DATA as any)[npcId]?.[state] || (DIALOGUE_DATA as any)[npcId]?.['intro'] || [];
    }
}
