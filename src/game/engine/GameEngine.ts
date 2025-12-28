import * as THREE from 'three';
import { World } from './World';
import { Player } from './Player';
import { InteractionManager } from './InteractionManager';
import { NPC } from './NPC';
import { gameEvents } from '../EventBus';
import { QuestSystem } from '../systems/QuestSystem';

import { NetworkManager } from '../network/NetworkManager';

export class GameEngine {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private clock: THREE.Clock;
    private requestID: number | null = null;
    private container: HTMLElement | null = null;

    // Subsystems
    public world: World;
    public player: Player;

    // Interactions
    private interactionManager: InteractionManager;
    private npcs: NPC[] = [];

    // Networking
    private networkManager: NetworkManager | null = null;
    private remoteMeshes: Map<string, THREE.Mesh> = new Map();

    constructor() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000033);
        this.scene.fog = new THREE.Fog(0x000033, 100, 10000); // 100 -> 10000

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 10, 10);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        this.clock = new THREE.Clock();

        // Initialize Subsystems
        this.world = new World(this.scene);
        this.player = new Player(this.scene, this.camera);

        this.interactionManager = new InteractionManager();

        // Setup Captain Aurora (Spawn near Player start)
        // Setup Captain Aurora (Spawn near Player start)
        const captain = new NPC('captain_aurora', 'Captain Aurora', 800, -800, this.scene, this.world.terrain!, null);
        this.npcs.push(captain);
        this.interactionManager.add(captain);

        // Setup Elder Penguin (North Ridge)
        // Setup Elder Penguin (North Ridge)
        // Color: Greyish Blue (0xaaddff)
        const elder = new NPC('elder_penguin', 'Elder Penguin', 0, -1500, this.scene, this.world.terrain!, 0xaaddff);
        this.npcs.push(elder);
        this.interactionManager.add(elder);

        // Setup Campfire (Near start for thawing)
        // Setup Campfire (Near start for thawing)
        // Model: Custom Campfire.glb
        const campfire = new NPC('campfire', 'Campfire', -500, -500, this.scene, this.world.terrain!, null, '/assets/3d/Campfire.glb');
        campfire.autoTrigger = false;
        this.npcs.push(campfire);
        this.interactionManager.add(campfire);

        // Setup Builder Penguin (West)
        // Setup Builder Penguin (West)
        // Color: Orange tint (0xffaa00)
        const builder = new NPC('builder_penguin', 'Builder Penguin', -1000, -200, this.scene, this.world.terrain!, 0xffaa00);
        builder.autoTrigger = false;
        this.npcs.push(builder);
        this.interactionManager.add(builder);

        // Setup Wind Shrine (Peak)
        // Setup Wind Shrine (Peak)
        // Placeholder: Use 'large_crystal.glb' as a mystical shrine
        const shrine = new NPC('wind_shrine', 'Old Shrine', 500, -2500, this.scene, this.world.terrain!, 0x888888, '/assets/3d/large_crystal.glb');
        shrine.autoTrigger = false;
        this.npcs.push(shrine);
        this.interactionManager.add(shrine);

        // Setup Dig Site (North East)
        // Setup Dig Site (North East)
        // Placeholder: Use 'Iceberg_2.glb' as a snow mound
        const digSite = new NPC('dig_site', 'Suspicious Snow', 1500, -1500, this.scene, this.world.terrain!, 0xffffff, '/assets/3d/Iceberg_2.glb');
        digSite.autoTrigger = false;
        this.npcs.push(digSite);
        this.interactionManager.add(digSite);

        // Setup Chest (Same as Dig Site initially, but maybe hidden? For now just place it)
        // Setup Chest (Same as Dig Site initially, but maybe hidden? For now just place it)
        // Setup Chest (Same as Dig Site initially, but maybe hidden? For now just place it)
        // Setup Chest (Same as Dig Site initially, but maybe hidden? For now just place it)
        // Placeholder: Use 'small_crystal.glb' as loot
        const chest = new NPC('chest', 'Ancient Chest', 1505, -1505, this.scene, this.world.terrain!, 0x996633, '/assets/3d/small_crystal.glb');
        chest.autoTrigger = false;
        this.npcs.push(chest);
        this.interactionManager.add(chest);

        // Input for Interaction
        window.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'e') {
                this.interactionManager.interact();
            }
        });

        // Quest Events
        gameEvents.on('quest-update', (data: any) => {
            console.log("Quest Update Event:", data);
            if (data.stepId) {
                QuestSystem.getInstance().updateStep(data.stepId);
            }
        });

        gameEvents.on('quest-start', (data: any) => {
            if (data.questId === 'map_riddle') {
                QuestSystem.getInstance().startMapRiddleQuest();
            }
        });
    }

    public async init(container: HTMLElement, userId?: string, username?: string) {
        this.container = container;
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);

        // Resize Listener
        window.addEventListener('resize', this.handleResize);

        // Load Content
        await this.world.load();

        // Link Terrain to Player for Raycasting
        if (this.world.terrain) {
            this.player.setTerrain(this.world.terrain);
            // Link to NPCs
            this.npcs.forEach(npc => npc.setTerrain(this.world.terrain!));

            // Re-initialize NPCs with terrain now that it's loaded (constructor passed null/undefined effectively)
            // Actually, we passed world.terrain in constructor but it was likely null.
            // NPC.setTerrain handles this.
        }

        // Initialize Network
        // Use provided ID or fallback to random
        const finalId = userId || 'player_' + Math.floor(Math.random() * 10000);
        this.networkManager = new NetworkManager(finalId);

        console.log(`Game Initialized for User: ${username || 'Visitor'} (${finalId})`);

        await this.player.load();


        // Load NPCs
        await Promise.all(this.npcs.map(npc => npc.load()));

        // Set Collidables for Player
        const collisionMeshes = this.npcs
            .map(npc => npc.mesh)
            .filter(mesh => mesh !== null) as THREE.Group[];
        this.player.setCollidables(collisionMeshes);

        // Start Loop
        this.start();
    }

    private start() {
        if (!this.requestID) {
            this.loop();
        }
    }

    private loop = () => {
        this.requestID = requestAnimationFrame(this.loop);

        const delta = this.clock.getDelta();

        // Update interactions
        this.player.update(delta);

        // Multiplayer Update
        if (this.networkManager && this.player.mesh) {
            const isMoving = this.player.velocity.length() > 0.1;
            this.networkManager.update(
                this.player.mesh.position.x,
                this.player.mesh.position.z,
                this.player.mesh.rotation.y,
                isMoving
            );

            // Sync Remote Players (Simple Box Representation for now)
            this.networkManager.remotePlayers.forEach((state, id) => {
                let mesh = this.remoteMeshes.get(id);
                if (!mesh) {
                    // Create simple avatar
                    const geometry = new THREE.BoxGeometry(20, 80, 20);
                    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Green for others
                    mesh = new THREE.Mesh(geometry, material);
                    mesh.position.y = 40; // Half height
                    this.scene.add(mesh);
                    this.remoteMeshes.set(id, mesh);
                }

                // Lerp Position
                mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, state.x, 0.1);
                mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, state.z, 0.1);
                mesh.rotation.y = state.rotation;
            });

            // Remove disconnected meshes
            // (Note: Ideally listen to events, but simple sweep works for demo)
            for (const [id, mesh] of this.remoteMeshes) {
                if (!this.networkManager.remotePlayers.has(id)) {
                    this.scene.remove(mesh);
                    this.remoteMeshes.delete(id);
                }
            }
        }

        // Update Interactions
        if (this.player.mesh) {
            this.interactionManager.update(this.player.mesh.position);

            // Warmth Logic (Simple Distance Check)
            const campfire = this.npcs.find(n => n.id === 'campfire');
            if (campfire && campfire.mesh) {
                const dist = this.player.mesh.position.distanceTo(campfire.mesh.position);
                if (dist < 300) { // Campfire Range
                    gameEvents.emit('warmth-update', { change: 5 * delta }); // Restore
                } else {
                    gameEvents.emit('warmth-update', { change: -1 * delta }); // Drain
                }
            }
        }

        this.renderer.render(this.scene, this.camera);
    };

    private handleResize = () => {
        if (!this.container) return;
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    };

    public dispose() {
        if (this.requestID) {
            cancelAnimationFrame(this.requestID);
        }
        window.removeEventListener('resize', this.handleResize);
        if (this.container && this.renderer.domElement) {
            this.container.removeChild(this.renderer.domElement);
        }
        this.renderer.dispose();
    }
}
