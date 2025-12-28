import * as THREE from 'three';
import { gameEvents } from '../EventBus';

export interface Interactable {
    position: THREE.Vector3;
    interactionRange: number;
    onInteract: () => void;
    getLabel: () => string; // e.g. "Talk to Captain Aurora"
    autoTrigger?: boolean;
}

export class InteractionManager {
    private interactables: Interactable[] = [];
    private activeInteractable: Interactable | null = null;
    private triggerLatched = false;

    public add(item: Interactable) {
        this.interactables.push(item);
    }

    public update(playerPosition: THREE.Vector3) {
        let closest: Interactable | null = null;
        let minDist = Infinity;

        for (const item of this.interactables) {
            const dist = playerPosition.distanceTo(item.position);
            if (dist < item.interactionRange) {
                if (dist < minDist) {
                    minDist = dist;
                    closest = item;
                }
            }
        }

        if (closest) {
            console.log(`Closest: ${closest.getLabel()}, Dist: ${minDist}, Latched: ${this.triggerLatched}`);
        }

        if (closest !== this.activeInteractable) {
            this.activeInteractable = closest;
            this.triggerLatched = false; // Reset latch when target changes
            console.log(`New Target: ${closest ? closest.getLabel() : 'None'}`);

            // Dispatch event to UI
            if (closest) {
                gameEvents.emit('interaction-available', { label: closest.getLabel() });
            } else {
                gameEvents.emit('interaction-unavailable');
            }
        }

        // Handle Auto-Trigger
        if (this.activeInteractable && this.activeInteractable.autoTrigger && !this.triggerLatched) {
            console.log("Auto-Triggering Interaction!");
            this.activeInteractable.onInteract();
            this.triggerLatched = true;
        }
    }

    public interact() {
        if (this.activeInteractable) {
            this.activeInteractable.onInteract();
        }
    }
}
