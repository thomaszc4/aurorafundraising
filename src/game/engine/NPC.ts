import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Interactable } from './InteractionManager';
import { gameEvents } from '../EventBus';
import { StoryManager } from '../managers/StoryManager';

export class NPC implements Interactable {
    public id: string;
    public position: THREE.Vector3;
    public interactionRange = 500;
    public autoTrigger = true;

    private scene: THREE.Scene;
    private loader: GLTFLoader;
    public mesh: THREE.Group | null = null;
    private npcId: string;
    private name: string;
    private terrain: THREE.Object3D | null = null;
    private yOffset = 0;
    private color: number | null = null;
    private modelPath: string = '/assets/3d/Penguin.glb';

    constructor(id: string, name: string, x: number, z: number, scene: THREE.Scene, terrain: THREE.Object3D, color: number | null = null, modelPath: string = '/assets/3d/Penguin.glb') {
        this.id = id;
        this.npcId = id;
        this.name = name;
        this.position = new THREE.Vector3(x, 5000, z);
        this.scene = scene;
        this.terrain = terrain;
        this.color = color;
        this.modelPath = modelPath;
        this.loader = new GLTFLoader();
    }

    public setTerrain(terrain: THREE.Object3D) {
        this.terrain = terrain;
    }

    public async load() {
        console.log(`[NPC] Starting load for ${this.name} using path: ${this.modelPath}`);
        return new Promise<void>((resolve, reject) => {
            this.loader.load(
                this.modelPath,
                (gltf) => {
                    console.log(`[NPC] Successfully loaded mesh for ${this.name}`);
                    this.mesh = gltf.scene;

                    // Apply Color to Penguin Body if set
                    if (this.color !== null) {
                        this.mesh.traverse((child) => {
                            if ((child as THREE.Mesh).isMesh) {
                                const mesh = child as THREE.Mesh;
                                if (mesh.material) {
                                    mesh.material = (mesh.material as THREE.Material).clone();
                                    (mesh.material as THREE.MeshStandardMaterial).color.setHex(this.color!);
                                }
                            }
                        });
                    }

                    // Tweak scale based on ID
                    if (this.id === 'elder_penguin') {
                        this.mesh.scale.set(2.5, 2.5, 2.5);
                    } else if (this.id === 'campfire' || this.id === 'wind_shrine') {
                        // FORCE verify scaling for campfire/shrine. User requested 5x bigger than before.
                        console.log(`[NPC] Scaling ${this.name} to 50.0 (Colossal)`);
                        this.mesh.scale.set(50.0, 50.0, 50.0);
                    } else {
                        this.mesh.scale.set(1.5, 1.5, 1.5);
                    }

                    // Shadows
                    this.mesh.traverse((c) => {
                        if ((c as THREE.Mesh).isMesh) {
                            c.castShadow = true;
                            c.receiveShadow = true;
                        }
                    });

                    // Add to Scene at 0,0,0 first to calculate local offset
                    this.mesh.position.set(0, 0, 0);
                    this.scene.add(this.mesh);

                    // Ground Snap Offset Calculation
                    // Calculate offset relative to model origin
                    const box = new THREE.Box3().setFromObject(this.mesh);
                    this.yOffset = -box.min.y;

                    console.log(`[NPC] ${this.name} Local Offset calculated: ${this.yOffset} (Grid min Y: ${box.min.y})`);

                    // Now move towards sky for raycasting
                    this.mesh.position.copy(this.position); // Moves to y=5000
                    this.mesh.updateMatrixWorld(); // Ensure world matrix is updated

                    if (this.terrain) {
                        this.terrain.updateMatrixWorld(true);
                        const raycaster = new THREE.Raycaster();
                        raycaster.set(this.position, new THREE.Vector3(0, -1, 0));
                        const intersects = raycaster.intersectObject(this.terrain, true);
                        if (intersects.length > 0) {
                            console.log(`[NPC] ${this.name} GROUNDED at y=${intersects[0].point.y} (offset: ${this.yOffset})`);
                            this.position.y = intersects[0].point.y + this.yOffset;
                            this.mesh.position.y = this.position.y;
                        } else {
                            console.warn(`[NPC] ${this.name} FAILED to find ground! Defaulting to y=100.`);
                            this.position.y = 100; // Lift them up so we can see them falling/floating instead of buried
                            this.mesh.position.y = 100;
                        }
                    } else {
                        console.error(`[NPC] ${this.name} has NO TERRAIN reference!`);
                    }

                    console.log(`[NPC] ${this.name} Final Position: ${this.position.x}, ${this.position.y}, ${this.position.z}`);
                    resolve();
                },
                undefined,
                (error) => {
                    console.error(`Error loading NPC ${this.name}:`, error);
                    resolve();
                }
            );
        });
    }

    public update(playerPos: THREE.Vector3) {
        if (this.mesh) {
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
        }
    }

    public getLabel() {
        return this.name;
    }

    public onInteract() {
        console.log(`Interacting with ${this.name}`);

        const dialogueData = StoryManager.getDialogue(this.id, 'intro');

        if (dialogueData) {
            // Send the raw data (it might be an array or a single object)
            // The DialogueOverlay now handles both, effectively supporting multi-line convos.

            // We need to inspect the first line (or the object) to trigger generic events
            const firstLine = Array.isArray(dialogueData) ? dialogueData[0] : dialogueData;

            if (firstLine.triggerQuest) {
                gameEvents.emit('quest-start', { questId: firstLine.triggerQuest });
            }

            if (firstLine.updateQuest) {
                gameEvents.emit('quest-update', { stepId: firstLine.updateQuest });
            }

            gameEvents.emit('game-show-dialogue', dialogueData);
        } else {
            const DIALOGUE = {
                speaker: this.name,
                text: "...",
                portrait: "🗣️"
            };
            gameEvents.emit('game-show-dialogue', DIALOGUE);
        }
    }
}
