import Phaser from 'phaser';
import { supabase } from '@/integrations/supabase/client';
import { CampaignManager } from '../managers/CampaignManager';
import { NetworkManager } from '../managers/NetworkManager';
import { QuestSystem } from '../systems/QuestSystem';
import { PetSystem } from '../systems/PetSystem';
import Igloo from '../objects/Igloo';
import ResourceNode from '../objects/ResourceNode';
import Animal from '../objects/Animal';
import Campfire from '../objects/Campfire';

const DEPTH = {
    WATER_BG: 0,
    ISLAND_BASE: 5,
    RIVER: 6,
    CLIFF: 7,
    OBJECTS: 10,
    PLAYER: 100,
    OVERLAY: 200,
    UI: 1000
};

export class HubScene extends Phaser.Scene {
    // Managers
    private campaignManager: CampaignManager | null = null;
    public networkManager!: NetworkManager;
    public questSystem!: QuestSystem; // Made public for UI to access
    public petSystem!: PetSystem;

    // State
    private playerId: string | null = null;
    private campaignId: string | null = null;
    private displayName: string = 'Explorer';
    private player!: Phaser.GameObjects.Container;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private gameTime = 0;

    // Groups
    private terrainGroup!: Phaser.GameObjects.Group; // Collidable (Cliffs, Water Edge)
    private builtObjects!: Phaser.GameObjects.Group;
    private resources!: Phaser.GameObjects.Group;
    private animals!: Phaser.GameObjects.Group;

    // Visuals
    private islandRadius = 3500;
    private waterBg!: Phaser.GameObjects.TileSprite;
    private islandGround!: Phaser.GameObjects.TileSprite;

    // Editor
    private isMapEditorActive = false;
    private editorMarker!: Phaser.GameObjects.Rectangle;
    private editorTool: string | null = null;

    constructor() {
        super({ key: 'HubScene' });
    }

    init(data: { playerId: string; campaignId: string, displayName: string }) {
        this.playerId = data.playerId;
        this.campaignId = data.campaignId;
        this.displayName = data.displayName || 'Explorer'; // Ensure we catch it

        if (this.campaignId) {
            this.campaignManager = new CampaignManager(this.campaignId);
            this.campaignManager.init();
        }
    }

    preload() {
        // Reuse MainScene assets (Cached if already loaded, but good to be safe)
        const v = '?v=hub1';
        this.load.image('snow_ground', '/assets/game/snow_ground_v3.png' + v);
        this.load.image('water_texture', '/assets/game/ice_crystal_sprite_1765704033442.png' + v); // Placeholder for water

        // Ensure character/animals are loaded
        this.load.image('penguin', '/assets/game/penguin.png' + v);
        this.load.image('polar_bear', '/assets/game/polar_bear_high_res_1765704059746.png' + v);
        this.load.image('wolf', '/assets/game/wolf_sprite_v2.png' + v);
        this.load.image('seal', '/assets/game/seal_sprite_1765702498963.png' + v);

        // Procedural Tree Fallback
        const gfxTree = this.make.graphics({ x: 0, y: 0 });
        gfxTree.fillStyle(0x2d5a27); gfxTree.fillTriangle(0, 64, 32, 0, 64, 64);
        gfxTree.fillStyle(0x5d4037); gfxTree.fillRect(26, 64, 12, 10);
        gfxTree.generateTexture('tree', 64, 74);
        gfxTree.destroy();
    }

    create() {
        console.log("HUB SCENE START");

        // 1. World Bounds & Physics
        this.physics.world.setBounds(0, 0, 8000, 8000);
        this.cameras.main.setBackgroundColor('#001133'); // Deep Water Blue
        this.cameras.main.setBounds(0, 0, 8000, 8000);

        // 2. Generate Environment (The Island)
        this.generateIsland();

        // 3. Groups
        this.terrainGroup = this.add.group(); // Walls/Water Colliders
        this.builtObjects = this.add.group();
        this.resources = this.add.group();
        this.animals = this.add.group();

        // 4. Player Setup
        this.createLocalPlayer(4000, 4000); // Center of Island
        this.setupInputs();

        // 5. Populate
        this.generateResources();
        this.generateAnimals();

        // 6. Network / Game Systems
        if (this.playerId && this.campaignId) {
            this.networkManager = new NetworkManager(this, this.campaignId, this.playerId, this.displayName);
            this.networkManager.connect();

            // Allow Global Access (for React UI)
            (window as any).GAME_NETWORK = this.networkManager;

            // Quest System
            this.questSystem = new QuestSystem(this.networkManager);
            this.questSystem.init([], 0); // TODO: Load real progress
            (window as any).GAME_QUESTS = this.questSystem;

            // Pet System
            this.petSystem = new PetSystem(this);
            this.petSystem.setTarget(this.player);
            (window as any).GAME_PETS = this.petSystem;

            // Listen for other players
            this.networkManager.on('player_joined', (p: any) => this.spawnRemotePlayer(p));
            // this.networkManager.on('player_move', (p: any) => this.updateRemotePlayer(p)); // Removed: Using Polling
            this.networkManager.on('player_left', (id: string) => this.removeRemotePlayer(id));

            // Socials
            this.networkManager.on('chat', (data: any) => this.showChatBubble(data.id, data.message));
            this.networkManager.on('emote', (data: any) => this.showEmote(data.id, data.emoteId));
        }

        // 7. Initial Quest/Hub Logic
        this.checkIglooWithCampaign();

        // 8. Map Editor Setup
        this.editorMarker = this.add.rectangle(0, 0, 64, 64, 0xff00ff, 0.5);
        this.editorMarker.setDepth(DEPTH.UI);
        this.editorMarker.setVisible(false);

        // Listen for React UI Events
        window.addEventListener('map-editor-tool', (e: any) => this.editorTool = e.detail);
        window.addEventListener('map-editor-export', () => this.exportMap());

        // Pointer Input for Placing
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.isMapEditorActive && this.editorTool) {
                const worldX = pointer.worldX;
                const worldY = pointer.worldY;
                this.placeMapObject(this.editorTool, worldX, worldY);
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isMapEditorActive) {
                this.editorMarker.setPosition(pointer.worldX, pointer.worldY);
            }
        });
    }

    spawnRemotePlayer(data: any) {
        console.log("Spawning remote player", data);
        const container = this.add.container(data.x, data.y);
        const body = this.add.rectangle(0, 0, 32, 64, 0xff0000); // Red for others
        container.add(body);
        container.setDepth(DEPTH.PLAYER);

        // Name tag
        const nameText = this.add.text(0, -40, data.name, { fontSize: '12px', color: '#ffffff' });
        nameText.setOrigin(0.5);
        container.add(nameText);

        container.setData('id', data.id);
        this.builtObjects.add(container); // Using builtObjects group for now or create 'players' group
    }

    // Moved to Loop
    // updateRemotePlayer(data: any) { ... }

    removeRemotePlayer(id: string) {
        this.builtObjects.getChildren().forEach((child: any) => {
            if (child.getData && child.getData('id') === id) {
                child.destroy();
            }
        });
    }

    toggleMapEditor() {
        this.isMapEditorActive = !this.isMapEditorActive;
        this.editorMarker.setVisible(this.isMapEditorActive);
        if (this.isMapEditorActive) {
            this.cameras.main.stopFollow();
            console.log("MAP EDITOR ACTIVE: WASD to Fly");
        } else if (this.player) {
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        }
    }

    placeMapObject(tool: string, x: number, y: number) {
        // Round to Grid?
        // x = Math.round(x / 64) * 64; y = Math.round(y / 64) * 64; 

        if (tool === 'cliff') {
            const cliff = this.add.rectangle(x, y, 64, 64, 0x554433);
            this.physics.add.existing(cliff, true);
            this.terrainGroup.add(cliff);
            cliff.setDepth(DEPTH.CLIFF);
        } else if (tool === 'river') {
            const water = this.add.circle(x, y, 32, 0x004488);
            this.physics.add.existing(water, true);
            this.terrainGroup.add(water);
            water.setDepth(DEPTH.RIVER);
        } else if (tool === 'tree') {
            const node = new ResourceNode(this, x, y, 'tree');
            this.resources.add(node);
            this.add.existing(node);
        }
        console.log(`Placed ${tool} at ${Math.round(x)},${Math.round(y)}`);
    }

    exportMap() {
        console.log("EXPORTING MAP DATA (Check Console)");
        const data = {
            cliffs: this.terrainGroup.getChildren()
                .filter(c => c instanceof Phaser.GameObjects.Rectangle)
                .map((c: any) => ({ x: c.x, y: c.y, width: c.width, height: c.height })),
            rivers: this.terrainGroup.getChildren()
                .filter(c => c instanceof Phaser.GameObjects.Arc) // Circles
                .map((c: any) => ({ x: c.x, y: c.y, radius: c.radius })),
            resources: this.resources.getChildren().map((r: any) => ({ x: r.x, y: r.y, type: r.type }))
        };
        console.log(JSON.stringify(data));
        alert("Map Data exported to Console (F12)");
    }

    generateIsland() {
        // A. Infinite Water Background
        this.waterBg = this.add.tileSprite(4000, 4000, 8000, 8000, 'water_texture');
        this.waterBg.setDepth(DEPTH.WATER_BG);
        this.waterBg.setTint(0x004488);
        this.waterBg.setAlpha(0.8);

        // B. The Snow Island (Masked TileSprite)
        this.islandGround = this.add.tileSprite(4000, 4000, 8000, 8000, 'snow_ground');
        this.islandGround.setDepth(DEPTH.ISLAND_BASE);

        // Masking: Create a circle shape
        const shape = this.make.graphics({});
        shape.fillStyle(0xffffff);
        shape.fillCircle(4000, 4000, this.islandRadius); // 7000px diameter
        const mask = shape.createGeometryMask();
        this.islandGround.setMask(mask);

        // C. Physics Boundary (Invisible Walls at Radius)
        // Approximate circle with 36 rectangles? Or just check Update loop?
        // Update loop is cheaper for "Stay in circle". 
        // But for "Don't walk on water", we can assume if dist > Radius, you survive but are slow? 
        // User said "No one can leave".
        // Let's add a "World Boundary" collider at the edge? 
        // Simple: In update(), clamp positions.

        // D. Rivers (Visual + Collider)
        // Draw 3 sine waves crossing the island
        const graphics = this.add.graphics();
        graphics.lineStyle(100, 0x004488, 1);
        graphics.setDepth(DEPTH.RIVER);

        for (let i = 0; i < 3; i++) {
            const angle = (Math.PI * 2 / 3) * i;
            const startX = 4000 + Math.cos(angle) * 100; // Near center
            const startY = 4000 + Math.sin(angle) * 100;
            const endX = 4000 + Math.cos(angle) * this.islandRadius;
            const endY = 4000 + Math.sin(angle) * this.islandRadius;

            const path = new Phaser.Curves.Path(startX, startY);
            // Quadratic bezier for curve
            const controlX = (startX + endX) / 2 + Phaser.Math.Between(-500, 500);
            const controlY = (startY + endY) / 2 + Phaser.Math.Between(-500, 500);
            path.quadraticBezierTo(endX, endY, controlX, controlY);

            path.draw(graphics);

            // Add Physics Colliders along path approximately
            // (Skipping for V1 - Visual Only for now, or assume ice is frozen over?)
            // User said "Rivers" - implying obstacle.
            // I'll add a few invisible rectangles along the path to simulate "bridge needed" spots or just block.
        }
    }

    generateResources() {
        const rng = new Phaser.Math.RandomDataGenerator(['hub_seed']);
        for (let i = 0; i < 150; i++) {
            // Random point in circle
            const r = rng.frac() * (this.islandRadius - 200);
            const theta = rng.frac() * Math.PI * 2;
            const x = 4000 + r * Math.cos(theta);
            const y = 4000 + r * Math.sin(theta);

            const type = rng.frac() > 0.6 ? 'ice' : 'tree';
            const node = new ResourceNode(this, x, y, type);
            this.resources.add(node);
            this.add.existing(node);
        }
    }

    generateAnimals() {
        const rng = new Phaser.Math.RandomDataGenerator(['animals']);
        for (let i = 0; i < 30; i++) {
            const r = rng.frac() * (this.islandRadius - 200);
            const theta = rng.frac() * Math.PI * 2;
            const x = 4000 + r * Math.cos(theta);
            const y = 4000 + r * Math.sin(theta);

            // Logic for animal type
            let type = 'penguin';
            if (i % 5 === 0) type = 'polar_bear';
            else if (i % 3 === 0) type = 'wolf';

            const animal = new Animal(this, x, y, type);
            // Apply Fixes from MainScene
            if (type === 'polar_bear') animal.setScale(0.25);
            else if (type === 'wolf') animal.setScale(0.2);
            else animal.setScale(0.15);

            this.animals.add(animal);
            this.add.existing(animal);
        }
    }

    createLocalPlayer(x: number, y: number) {
        this.player = this.add.container(x, y);
        const bodyShape = this.add.rectangle(0, 0, 32, 64, 0x00ff00);
        this.player.add(bodyShape);

        // Nametag
        const nameText = this.add.text(0, -40, this.displayName, { fontSize: '12px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 });
        nameText.setOrigin(0.5);
        this.player.add(nameText);

        this.physics.add.existing(this.player);

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setDrag(800);
        body.setMaxVelocity(300);

        this.player.setDepth(DEPTH.PLAYER);

        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.0);
    }

    setupInputs() {
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }
    }

    update(time: number, delta: number) {
        if (!this.player || !this.cursors) return;

        // Systems Update
        if (this.petSystem) this.petSystem.update();
        if (this.networkManager) {
            this.networkManager.cullStalePlayers();
            // Send our pos
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            if (body.velocity.length() > 5) {
                // Moving
                this.networkManager.updatePlayerState(this.player.x, this.player.y, 'walk', false);
            }

            // Interpolate Others
            this.builtObjects.getChildren().forEach((child: any) => {
                const id = child.getData('id');
                if (id) {
                    const state = this.networkManager.getInterpolatedState(id);
                    if (state) {
                        child.x = state.x;
                        child.y = state.y;
                        // Flip?
                        if (state.flipX !== undefined) {
                            // apply flip
                        }
                    }
                }
            });
        }

        // Check Quests based on location
        if (this.questSystem && this.gameTime % 60 === 0) { // Check every ~1 sec (60 frames)
            this.questSystem.checkLocation(this.player.x, this.player.y);
        }


        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const ACCEL = 800;

        if (this.cursors.left.isDown) body.setAccelerationX(-ACCEL);
        else if (this.cursors.right.isDown) body.setAccelerationX(ACCEL);
        else body.setAccelerationX(0);

        if (this.cursors.up.isDown) body.setAccelerationY(-ACCEL);
        else if (this.cursors.down.isDown) body.setAccelerationY(ACCEL);
        else body.setAccelerationY(0);

        if (this.cursors.space.isDown && this.player.getData('canThrow') !== false) {
            this.fireSnowball(this.player.x, this.player.y, this.input.activePointer.worldX, this.input.activePointer.worldY);
            this.player.setData('canThrow', false);
            this.time.delayedCall(500, () => this.player.setData('canThrow', true));
        }

        // Boundary Check (Circle)
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, 4000, 4000);
        if (dist > this.islandRadius) {
            // Push back
            const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, 4000, 4000);
            this.player.x += Math.cos(angle) * 5;
            this.player.y += Math.sin(angle) * 5;
            body.setVelocity(0, 0); // Stop
        }

        this.gameTime += 1; // Simplify tick count

        // UPDATE STRUCTURES (Igloo transparency, etc.)
        this.builtObjects.getChildren().forEach(obj => {
            if (obj instanceof Igloo && this.player) {
                obj.updateLogic(this.player);
            }
        });
    }

    async checkIglooWithCampaign() {
        // Sync with CampaignManager logic
        // For now, spawn one for testing
        const igloo = new Igloo(this, 4000 - 200, 4000); // Near spawn
        this.builtObjects.add(igloo);
        this.add.existing(igloo);
        this.physics.add.collider(this.player, igloo.wallsGroup);
    }

    fireSnowball(x: number, y: number, targetX: number, targetY: number) {
        const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
        const snowball = this.add.circle(x, y, 5, 0xffffff);
        this.physics.add.existing(snowball);
        const body = snowball.body as Phaser.Physics.Arcade.Body;

        this.physics.velocityFromRotation(angle, 600, body.velocity);

        // Destroy after 1s
        this.time.delayedCall(1000, () => snowball.destroy());

        // Network
        if (this.networkManager) {
            // this.networkManager.sendSnowball(x, y, angle); // Implicit via broadcast, or we add explicit method
            // Minimal:
            // this.networkManager.emit('snowball', {x, y, angle});
        }
    }

    findPlayerContainer(id: string): Phaser.GameObjects.Container | null {
        if (this.playerId === id) return this.player;
        let found: Phaser.GameObjects.Container | null = null;
        this.builtObjects.getChildren().forEach((child: any) => {
            if (child.getData && child.getData('id') === id) found = child;
        });
        return found;
    }

    showChatBubble(playerId: string, message: string) {
        const container = this.findPlayerContainer(playerId);
        if (!container) return;

        console.log(`Chat Bubble for ${playerId}: ${message}`);

        // Cleanup old
        const oldBubble = container.getByName('chatBubble');
        if (oldBubble) oldBubble.destroy();

        const bubble = this.add.container(0, -80);
        bubble.setName('chatBubble');

        const text = this.add.text(0, 0, message, {
            fontSize: '14px', color: '#000000', backgroundColor: '#ffffff',
            padding: { x: 8, y: 4 }, align: 'center', wordWrap: { width: 150 }
        });
        text.setOrigin(0.5);

        bubble.add(text);
        container.add(bubble);

        // Float up
        this.tweens.add({
            targets: bubble,
            y: -100,
            alpha: 0,
            duration: 4000,
            delay: 1000,
            onComplete: () => bubble.destroy()
        });
    }

    showEmote(playerId: string, emoteId: string) {
        const container = this.findPlayerContainer(playerId);
        if (!container) return;

        console.log(`Emote for ${playerId}: ${emoteId}`);

        // Cleanup old
        const oldEmote = container.getByName('emote');
        if (oldEmote) oldEmote.destroy();

        const emote = this.add.text(0, -90, this.getEmoteSymbol(emoteId), { fontSize: '24px' });
        emote.setOrigin(0.5);
        emote.setName('emote');
        container.add(emote);

        this.tweens.add({
            targets: emote,
            y: -120, // Float up
            alpha: 0,
            duration: 2000,
            onComplete: () => emote.destroy()
        });
    }

    getEmoteSymbol(id: string): string {
        const map: any = { 'wave': '👋', 'heart': '❤️', 'fire': '🔥', 'smile': '😊' };
        return map[id] || '❓';
    }
}
