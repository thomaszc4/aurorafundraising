import { Quest, Dialogue, DialogueNode } from '../types/StoryTypes';

export class StoryManager {
    // Flags
    private flags: Map<string, boolean> = new Map();
    private values: Map<string, number> = new Map();

    // Data Store (Loaded from JSON/DB)
    private questsBound: Map<string, Quest> = new Map();
    private dialoguesBound: Map<string, Dialogue> = new Map();

    // Runtime State
    public activeQuests: Map<string, Quest> = new Map();
    private completedQuests: Set<string> = new Set();
    private currentDialogue: Dialogue | null = null;
    private currentNode: DialogueNode | null = null;

    constructor() {
        // Load initial state if needed
    }

    // --- FLAGS ---
    setFlag(id: string, value: boolean) {
        this.flags.set(id, value);
        console.log(`[Story] Flag set: ${id} = ${value}`);
        window.dispatchEvent(new CustomEvent('story-flag-change', { detail: { id, value } }));
        this.checkQuestProgress('flag', id);
    }

    getFlag(id: string): boolean {
        return this.flags.get(id) || false;
    }

    setValue(id: string, value: number) {
        this.values.set(id, value);
    }

    getValue(id: string): number {
        return this.values.get(id) || 0;
    }

    // --- CONDITION ---
    checkCondition(condition: string): boolean {
        if (!condition) return true;
        if (condition.startsWith('flag:')) return this.getFlag(condition.replace('flag:', ''));
        if (condition.startsWith('!flag:')) return !this.getFlag(condition.replace('!flag:', ''));
        return true;
    }

    // --- QUESTS ---
    registerQuest(quest: Quest) {
        this.questsBound.set(quest.id, quest);
    }

    acceptQuest(questId: string) {
        if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) return;
        const quest = this.questsBound.get(questId);
        if (!quest) return;

        // Deep copy for runtime state
        const instance = JSON.parse(JSON.stringify(quest));
        this.activeQuests.set(questId, instance);
        console.log(`[Story] Accepted Quest: ${quest.title}`);
        window.dispatchEvent(new CustomEvent('quest-accepted', { detail: { questId } }));
    }

    completeQuest(questId: string) {
        if (!this.activeQuests.has(questId)) return;
        this.activeQuests.delete(questId);
        this.completedQuests.add(questId);
        console.log(`[Story] Completed Quest: ${questId}`);
        window.dispatchEvent(new CustomEvent('quest-completed', { detail: { questId } }));

        // Grant Rewards Logic Here
    }

    checkQuestProgress(stepType: string, targetId: string) {
        this.activeQuests.forEach(quest => {
            let updated = false;
            quest.steps.forEach(step => {
                if (!step.isCompleted && step.type === stepType && step.target === targetId) {
                    step.isCompleted = true;
                    updated = true;
                }
            });

            if (updated) {
                // Check if all completed
                if (quest.steps.every(s => s.isCompleted)) {
                    this.completeQuest(quest.id);
                } else {
                    window.dispatchEvent(new CustomEvent('quest-updated', { detail: { questId: quest.id } }));
                }
            }
        });
    }

    // --- DIALOGUE ---
    registerDialogue(dialogue: Dialogue) {
        this.dialoguesBound.set(dialogue.id, dialogue);
    }

    startDialogue(dialogueId: string) {
        const dialogue = this.dialoguesBound.get(dialogueId);
        if (!dialogue) return;

        this.currentDialogue = dialogue;
        this.currentNode = dialogue.nodes[dialogue.rootNodeId];
        window.dispatchEvent(new CustomEvent('dialogue-start', {
            detail: {
                text: this.currentNode.text,
                speaker: this.currentNode.speaker,
                options: this.currentNode.options
            }
        }));
    }

    selectOption(index: number) {
        if (!this.currentDialogue || !this.currentNode) return;
        const option = this.currentNode.options[index];
        if (!option) return;

        // Execute Actions
        if (option.actions) {
            option.actions.forEach(act => {
                if (act.startsWith('set_flag:')) {
                    const [key, val] = act.replace('set_flag:', '').split('=');
                    this.setFlag(key, val === 'true');
                }
            });
        }

        // Advance
        if (option.nextNodeId) {
            this.currentNode = this.currentDialogue.nodes[option.nextNodeId];
            window.dispatchEvent(new CustomEvent('dialogue-next', {
                detail: {
                    text: this.currentNode.text,
                    speaker: this.currentNode.speaker,
                    options: this.currentNode.options
                }
            }));
        } else {
            this.endDialogue();
        }
    }

    endDialogue() {
        this.currentDialogue = null;
        this.currentNode = null;
        window.dispatchEvent(new CustomEvent('dialogue-end'));
    }
}

export const storyManager = new StoryManager();
