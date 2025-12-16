
import Phaser from 'phaser';
import { supabase } from '@/integrations/supabase/client';
import ResourceNode from '../objects/ResourceNode';
import Campfire from '../objects/Campfire';
import Igloo from '../objects/Igloo';
import Animal from '../objects/Animal';
import { NetworkManager } from '../managers/NetworkManager';

export class MainScene extends Phaser.Scene {
    // Systems
    private player!: Phaser.GameObjects.Container;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private otherPlayers: Map<string, Phaser.GameObjects.Container> = new Map();
    private networkManager!: NetworkManager;
    private rng!: Phaser.Math.RandomDataGenerator;

    // State
    private playerId: string | null = null;
    private campaignId: string | null = null;
    private isConnected = false;
    private warmth = 100;
    private gameTime = 0;
    private tickTimer = 0;
    private saveTimer = 0; // Autosave timer
    private lastBroadcastTime = 0;

    // Groups
    private resources!: Phaser.GameObjects.Group;
    private builtObjects!: Phaser.GameObjects.Group;
    private animals!: Phaser.GameObjects.Group;
    private terrainGroup!: Phaser.GameObjects.Group; // Collidable terrain (Water/Cliff)

    // Inventory
    private playerInventory: any[] = [];
    private nearbyResource: ResourceNode | null = null;

    // Weather
    private isStormActive: boolean = false;
    private stormTimer: number = 0;
    private nextStormTime: number = 300000;
    private snowEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private stormOverlay!: Phaser.GameObjects.Rectangle;

    // Visuals
    private darknessOverlay!: Phaser.GameObjects.Rectangle;
    private coldOverlay!: Phaser.GameObjects.Rectangle;
    private playerSprite!: Phaser.GameObjects.Sprite;

    // Placement
    private isPlacing = false;
    private placementItem: string | null = null;
    private placementGhost: Phaser.GameObjects.Rectangle | null = null;
    private validPlacement = false;

    // Fog
    private fogTexture!: Phaser.GameObjects.RenderTexture;
    private fogBrush!: Phaser.GameObjects.GameObject;
    private shroudOverlay!: Phaser.GameObjects.Rectangle;
    private visionGraphics!: Phaser.GameObjects.Graphics;

    // Debug
    private debugText!: Phaser.GameObjects.Text;
    private showDebug = false;

    constructor() {
        super({ key: 'MainScene' });
    }

    init(data: { playerId: string; campaignId: string; displayName: string }) {
        this.playerId = data.playerId;
        this.campaignId = data.campaignId;

        // SEEDED RNG for Deterministic World
        this.rng = new Phaser.Math.RandomDataGenerator([this.campaignId || 'default']);
    }

    preload() {
        this.load.image('snow_ground', '/assets/game/snow_ground_seamless_v2_1765704047104.png');
        this.load.image('tree', '/assets/game/pine_tree_small.png');
        this.load.image('ice_crystal', '/assets/game/ice_crystal_sprite_1765704033442.png');
        this.load.image('fog_noise', '/assets/game/fog_noise_texture_1765702486021.png');
        this.load.spritesheet('player', '/assets/game/player_spritesheet_1765701694127.png', { frameWidth: 256, frameHeight: 256 });
        this.load.spritesheet('penguin', '/assets/game/penguin_sprite_v2.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('polar_bear', '/assets/game/polar_bear_high_res_1765704059746.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('wolf', '/assets/game/wolf_sprite_v2.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('seal', '/assets/game/seal_sprite_1765702498963.png');
        this.load.image('fish', '/assets/game/fish_icon_1765702512195.png');
        this.load.image('water', '/assets/game/ice_crystal_sprite_1765704033442.png'); // Placeholder
    }

    async create() {
        // 1. World Bounds
        this.physics.world.setBounds(0, 0, 8000, 8000);

        // 2. Background
        const bg = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'snow_ground');
        bg.setOrigin(0, 0);
        bg.setScrollFactor(0);
        bg.setDepth(-100);
        (this as any).bg = bg;

        // 3. Groups
        this.resources = this.add.group();
        this.builtObjects = this.add.group();
        this.animals = this.add.group();
        this.terrainGroup = this.add.group(); // For Lakes/Obstacles

        // 4. Generate World (Seeded)
        this.generateTerrain();
        this.generateResources();
        this.generateAnimals();

        // 5. Player Init (Loading or Spawning)
        await this.initializePlayer();

        // 6. Setup Inputs
        this.setupInputs();

        // 7. Overlays
        this.setupOverlays();

        // 8. Multiplayer
        this.setupMultiplayer();
        this.loadStructures(); // Load existing buildings

        // 9. Fog (Visuals)
        this.setupFogOfWar();
        this.updateFog();

        // 10. Camera Zoom
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom;
            // Limit zoom to prevent visual bugs
            const newZoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.5, 2.0);
            this.cameras.main.zoomTo(newZoom, 100);
        });

        // 11. Collisions
        this.physics.add.collider(this.player, this.resources);
        this.physics.add.collider(this.player, this.builtObjects);

        console.log("MainScene Create Complete");
        this.add.text(10, 100, "Version: Local Fallback Active", { color: '#00ff00', fontSize: '10px' }).setScrollFactor(0).setDepth(2000);

        this.scale.on('resize', (gameSize: any) => {
            this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
            if ((this as any).bg) (this as any).bg.setSize(gameSize.width, gameSize.height);
        });
    }

    // --- GENERATION ---

    generateTerrain() {
        // Lakes/Ice Patches
        for (let i = 0; i < 200; i++) {
            const x = this.rng.between(200, 7800);
            const y = this.rng.between(200, 7800);
            const w = this.rng.between(100, 300);
            const h = this.rng.between(80, 200);

            // Visual
            // 60% chance to be "Water/Ice" (Blue), 40% Snow Mound (White)
            const isIce = this.rng.frac() > 0.4;
            if (isIce) {
                // Add to terrain group for collision check during spawn
                const lake = this.add.ellipse(x, y, w, h, 0xaaddff, 0.6);
                this.physics.add.existing(lake, true); // Static body
                this.terrainGroup.add(lake);
                (lake as any).isWater = true;
            } else {
                this.add.ellipse(x, y, w, h, 0xffffff, 0.3); // Decorative snow
            }
        }
    }

    generateResources() {
        for (let i = 0; i < 300; i++) {
            const x = this.rng.between(100, 7900);
            const y = this.rng.between(100, 7900);
            const type = this.rng.frac() > 0.5 ? 'tree' : 'ice';
            const node = new ResourceNode(this, x, y, type as 'tree' | 'ice');
            this.resources.add(node);
            this.add.existing(node);
        }
    }

    generateAnimals() {
        for (let i = 0; i < 50; i++) {
            const x = this.rng.between(100, 7900);
            const y = this.rng.between(100, 7900);
            const r = this.rng.frac();
            let type = 'penguin';
            if (r > 0.85) type = 'polar_bear';
            else if (r > 0.7) type = 'wolf';
            else if (r > 0.5) type = 'seal';

            const animal = new Animal(this, x, y, type);
            this.animals.add(animal);
        }
    }

    // --- PLAYER & PERSISTENCE ---

    async initializePlayer() {
        // Check DB for existing player data
        let playerData = null;
        try {
            const res = await supabase
                .from('game_players' as any)
                .select('*')
                .eq('user_id', this.playerId)
                .eq('campaign_id', this.campaignId)
                .maybeSingle();
            playerData = res.data;
        } catch (e) {
            console.warn("DB offline or error", e);
        }

        let startX = 4000;
        let startY = 4000;

        if (playerData) {
            startX = playerData.x;
            startY = playerData.y;
            console.log("Loaded Player:", startX, startY);
        } else {
            console.log("New Player - Creating Spawn...");
            const spawn = this.findValidSpawnPoint();
            startX = spawn.x;
            startY = spawn.y;
            await this.savePlayerState(startX, startY);

            // Spawn Starter Igloo
            this.spawnStructure('igloo', startX, startY, true);
        }

        // Create Player Object
        this.createLocalPlayer(startX, startY);
    }

    findValidSpawnPoint(): { x: number, y: number } {
        const tempTest = this.add.rectangle(0, 0, 200, 200, 0x000000, 0);
        this.physics.add.existing(tempTest);

        for (let i = 0; i < 20; i++) {
            const x = this.rng.between(500, 7500);
            const y = this.rng.between(500, 7500);
            tempTest.setPosition(x, y);

            const overlapTerrain = this.physics.overlap(tempTest, this.terrainGroup);
            const overlapRes = this.physics.overlap(tempTest, this.resources);

            if (!overlapTerrain && !overlapRes) {
                tempTest.destroy();
                return { x, y };
            }
        }
        tempTest.destroy();
        return { x: 4000, y: 4000 };
    }

    async savePlayerState(x: number, y: number) {
        if (!this.playerId || !this.campaignId) return;
        try {
            const { error } = await supabase
                .from('game_players' as any)
                .upsert({
                    user_id: this.playerId,
                    campaign_id: this.campaignId,
                    x: x,
                    y: y,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,campaign_id' });
            if (error) console.warn("Save Warning", error.message);
        } catch (e) {
            // Ignore offline errors
        }
    }

    createLocalPlayer(x: number, y: number) {
        this.player = this.add.container(x, y);
        this.playerSprite = this.add.sprite(0, 0, 'player');
        this.playerSprite.setScale(0.25);
        this.playerSprite.setOrigin(0.5, 0.6);
        const nameText = this.add.text(0, -40, 'You', { fontSize: '14px', color: '#000', align: 'center' }).setOrigin(0.5);

        this.player.add([this.playerSprite, nameText]);
        this.player.setDepth(100);

        this.physics.add.existing(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setSize(32, 32);
        body.setOffset(-16, -16);

        // PHYSICS TWEAK: Acceleration based
        body.setDrag(800);
        body.setMaxVelocity(300);

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.createAnimations();
    }

    // --- SETUP HELPERS ---

    setupInputs() {
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();

            this.input.keyboard.on('keydown-I', () => {
                window.dispatchEvent(new CustomEvent('game-toggle-inventory'));
            });

            this.input.keyboard.on('keydown-E', () => {
                this.handleInteraction();
            });

            // DEBUG MODE TOGGLE (F3)
            this.input.keyboard.on('keydown-F3', (event: KeyboardEvent) => {
                event.preventDefault();
                this.showDebug = !this.showDebug;
                if (this.showDebug) {
                    this.physics.world.createDebugGraphic();
                    this.debugText.setVisible(true);
                } else {
                    this.physics.world.debugGraphic.destroy();
                    this.debugText.setVisible(false);
                }
            });
        }

        // Debug Text
        this.debugText = this.add.text(10, 10, 'Debug Mode', {
            font: '12px monospace', color: '#00ff00', backgroundColor: '#000000aa'
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(9999);
        this.debugText.setVisible(false);

        // Placement Listeners
        window.addEventListener('game-enter-placement', (e: Event) => {
            const detail = (e as CustomEvent).detail;
            this.enterPlacementMode(detail.item);
        });

        window.addEventListener('game-place-item', (e: Event) => {
            const detail = (e as CustomEvent).detail;
            this.spawnStructure(detail.item, detail.x, detail.y);
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (this.isPlacing) {
                this.updatePlacementGhost(pointer);
            }
        });

        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (this.isPlacing && pointer.leftButtonDown()) {
                if (this.validPlacement) this.confirmPlacement();
            } else if (this.isPlacing && pointer.rightButtonDown()) {
                this.cancelPlacement();
            }
        });

        window.addEventListener('game-inventory-sync', (e: Event) => {
            const detail = (e as CustomEvent).detail;
            this.updateInventory(detail);
        });
    }

    setupOverlays() {
        const viewportW = this.cameras.main.width;
        const viewportH = this.cameras.main.height;
        const overlaySize = Math.max(viewportW, viewportH) * 4;

        this.darknessOverlay = this.add.rectangle(viewportW / 2, viewportH / 2, overlaySize, overlaySize, 0x000010);
        this.darknessOverlay.setScrollFactor(0);
        this.darknessOverlay.setDepth(100);
        this.darknessOverlay.setAlpha(0);

        this.coldOverlay = this.add.rectangle(viewportW / 2, viewportH / 2, overlaySize, overlaySize, 0x00aaff);
        this.coldOverlay.setScrollFactor(0);
        this.coldOverlay.setDepth(101);
        this.coldOverlay.setAlpha(0);

        this.stormOverlay = this.add.rectangle(viewportW / 2, viewportH / 2, overlaySize, overlaySize, 0x000033, 0).setDepth(150);
        this.stormOverlay.setScrollFactor(0);

        // Snow Particles
        const snowGraphics = this.make.graphics({ x: 0, y: 0 }, false);
        snowGraphics.fillStyle(0xffffff);
        snowGraphics.fillCircle(2, 2, 2);
        snowGraphics.generateTexture('snowflake', 4, 4);

        this.snowEmitter = this.add.particles(0, 0, 'snowflake', {
            x: { min: 0, max: 800 }, y: 0, quantity: 2, lifespan: 2000,
            gravityY: 50, speedY: { min: 100, max: 200 }, speedX: { min: -50, max: 50 },
            scale: { start: 0.5, end: 1 }, alpha: { start: 0.8, end: 0 }, emitting: false
        });
        this.snowEmitter.setScrollFactor(0);
        this.snowEmitter.setPosition(0, -10);
        this.snowEmitter.setDepth(200);
    }

    // --- FOG ---
    setupFogOfWar() {
        const width = 8000;
        const height = 8000;
        this.fogTexture = this.make.renderTexture({ x: 0, y: 0, width, height });
        const cloudTile = this.make.tileSprite({ x: 0, y: 0, width: width, height: height, key: 'fog_noise' }, false);
        cloudTile.setAlpha(1);
        cloudTile.setTint(0x8899aa);
        this.fogTexture.draw(cloudTile, 0, 0);
        this.fogTexture.setDepth(90);
        this.fogTexture.setVisible(true);
        cloudTile.destroy();

        this.shroudOverlay = this.add.rectangle(4000, 4000, 8000, 8000, 0x000000, 0.5);
        this.shroudOverlay.setDepth(89);
        this.visionGraphics = this.make.graphics({ x: 0, y: 0 }, false);
        const mask = this.visionGraphics.createGeometryMask();
        mask.setInvertAlpha(true);
        this.shroudOverlay.setMask(mask);

        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        graphics.fillStyle(0xffffff, 0.2); graphics.fillCircle(250, 250, 200);
        graphics.fillStyle(0xffffff, 0.5); graphics.fillCircle(250, 250, 180);
        graphics.fillStyle(0xffffff, 1); graphics.fillCircle(250, 250, 150);
        graphics.generateTexture('fogBrush', 500, 500);
        this.fogBrush = this.make.image({ x: 0, y: 0, key: 'fogBrush', add: false });
    }

    updateFog() {
        if (!this.fogTexture || !this.player || !this.fogBrush) return;
        this.fogTexture.erase(this.fogBrush, this.player.x - 250, this.player.y - 250);
        if (this.visionGraphics) {
            this.visionGraphics.clear();
            this.visionGraphics.fillStyle(0xffffff, 1);
            this.visionGraphics.fillCircle(this.player.x, this.player.y, 350);
        }
        this.updateEntityVisibility();
    }

    updateEntityVisibility() {
        const VISION_RADIUS = 350;
        this.animals.getChildren().forEach(child => {
            const animal = child as Phaser.GameObjects.Sprite;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, animal.x, animal.y);
            animal.setVisible(dist <= VISION_RADIUS);
            (animal as any).active = (dist <= VISION_RADIUS);
        });
        this.otherPlayers.forEach((container) => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, container.x, container.y);
            container.setVisible(dist <= VISION_RADIUS);
        });
    }

    // --- MULTIPLAYER ---
    setupMultiplayer() {
        if (!this.campaignId || !this.playerId) return;
        this.networkManager = new NetworkManager(this, this.campaignId, this.playerId, 'Player');
        this.networkManager.on('connected', () => this.isConnected = true);
        this.networkManager.on('player_joined', (data: any) => this.createOtherPlayer(data.id, data.x, data.y, data.name));
        this.networkManager.on('player_left', (id: string) => {
            if (this.otherPlayers.has(id)) {
                this.otherPlayers.get(id)?.destroy();
                this.otherPlayers.delete(id);
            }
        });
        this.networkManager.on('structure_placed', (data: any) => this.spawnStructure(data.type, data.x, data.y, false));
        this.networkManager.connect();
    }

    updateNetworkState(time: number, moved: boolean, x: number, y: number, anim: string, flipX: boolean) {
        if (Math.abs(time - this.lastBroadcastTime) > 50 && this.isConnected && moved) {
            this.networkManager.updatePlayerState(x, y, anim, flipX);
            this.lastBroadcastTime = time;
        }
        this.networkManager.otherPlayers.forEach((state, id) => {
            if (!this.otherPlayers.has(id)) {
                this.createOtherPlayer(id, state.x, state.y, state.name);
            }
            const container = this.otherPlayers.get(id);
            if (container) {
                const t = 0.3;
                container.x = Phaser.Math.Linear(container.x, state.x, t);
                container.y = Phaser.Math.Linear(container.y, state.y, t);
                const sprite = container.getAt(0) as Phaser.GameObjects.Sprite;
                if (sprite && state.anim && sprite.anims.currentAnim?.key !== state.anim && this.anims.exists(state.anim)) {
                    sprite.play(state.anim, true);
                } else if (sprite && !state.anim) {
                    sprite.stop(); sprite.setFrame(0);
                }
            }
        });
    }

    createOtherPlayer(id: string, x: number, y: number, name: string) {
        if (this.otherPlayers.has(id)) return;
        const container = this.add.container(x, y);
        const sprite = this.add.sprite(0, 0, 'player');
        sprite.setScale(0.25);
        sprite.setOrigin(0.5, 0.6);
        sprite.setTint(0xaaaaff);
        const nameText = this.add.text(0, -40, name || 'Player', { fontSize: '14px', color: '#000' }).setOrigin(0.5);
        container.add([sprite, nameText]);
        this.add.existing(container);
        this.otherPlayers.set(id, container);
    }

    // --- PLACEMENT / INTERACTION ---
    enterPlacementMode(item: string) {
        if (this.isPlacing) return;
        this.isPlacing = true;
        this.placementItem = item;
        const size = item === 'wall' ? 32 : 64;
        this.placementGhost = this.add.rectangle(0, 0, size, size, 0x00ff00, 0.5);
        this.placementGhost.setDepth(200);
    }

    updatePlacementGhost(pointer: Phaser.Input.Pointer) {
        if (!this.placementGhost) return;
        const x = Math.floor(pointer.worldX / 32) * 32 + 16;
        const y = Math.floor(pointer.worldY / 32) * 32 + 16;
        this.placementGhost.setPosition(x, y);
        const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, x, y);
        this.validPlacement = dist < 200;
        this.placementGhost.setFillStyle(this.validPlacement ? 0x00ff00 : 0xff0000, 0.5);
    }

    confirmPlacement() {
        if (!this.placementGhost || !this.placementItem) return;
        window.dispatchEvent(new CustomEvent('game-confirm-placement', { detail: { item: this.placementItem, x: this.placementGhost.x, y: this.placementGhost.y } }));
        this.cancelPlacement();
    }

    cancelPlacement() {
        this.isPlacing = false;
        this.placementItem = null;
        if (this.placementGhost) { this.placementGhost.destroy(); this.placementGhost = null; }
        window.dispatchEvent(new CustomEvent('game-cancel-placement'));
    }

    async loadStructures() {
        if (!this.campaignId) return;
        const { data } = await supabase.from('game_structures' as any).select('*').eq('campaign_id', this.campaignId);
        if (data) {
            data.forEach((s: any) => this.spawnStructure(s.type, s.x, s.y, false));
        }
    }

    async saveStructure(type: string, x: number, y: number) {
        if (!this.campaignId || !this.playerId) return;
        try {
            await supabase.from('game_structures' as any).insert({
                campaign_id: this.campaignId, owner_id: this.playerId, type: type, x: x, y: y, data: {}
            });
        } catch (e) { console.warn("Save Structure Error", e); }
    }

    broadcastStructure(type: string, x: number, y: number) {
        if (this.isConnected && this.networkManager) this.networkManager.sendStructurePlace(type, x, y);
    }

    spawnStructure(item: string, x?: number, y?: number, save: boolean = true) {
        const posX = x ?? this.player.x;
        const posY = y ?? this.player.y;
        if (item === 'campfire') {
            const campfire = new Campfire(this, posX, posY);
            this.builtObjects.add(campfire);
            this.add.existing(campfire);
            this.physics.add.collider(this.player, campfire);
        } else if (item === 'wall') {
            const wall = this.add.rectangle(posX, posY, 32, 32, 0x555555);
            this.physics.add.existing(wall, true);
            this.builtObjects.add(wall);
            this.physics.add.collider(this.player, wall);
        } else if (item === 'igloo') {
            const igloo = new Igloo(this, posX, posY);
            this.builtObjects.add(igloo);
            this.add.existing(igloo);
            // Collision with Walls
            this.physics.add.collider(this.player, igloo.wallsGroup);
        } else if (item === 'signal_fire') {
            const fire = this.add.sprite(posX, posY, 'campfire');
            fire.setTint(0xff0000); fire.setScale(2); this.add.existing(fire);
            window.dispatchEvent(new CustomEvent('game-win'));
        }
        if (save) {
            this.saveStructure(item, posX, posY);
            this.broadcastStructure(item, posX, posY);
        }
    }

    private handleInteraction() {
        // Harvest
        let harvestedAny = false;
        if (this.resources) {
            const playerCenter = new Phaser.Math.Vector2(this.player.x, this.player.y);
            this.resources.getChildren().forEach((obj) => {
                const node = obj as ResourceNode;
                if (!node.active) return;
                const dist = playerCenter.distance(new Phaser.Math.Vector2(node.x, node.y));
                if (dist < 80) {
                    const result = node.harvest();
                    if (result) {
                        window.dispatchEvent(new CustomEvent('game-inventory-add', { detail: result }));
                        this.showFloatingText(this.player.x, this.player.y, `+ 1 ${result.type} `);
                        this.addXp(10); harvestedAny = true;
                    }
                }
            });
        }
        if (harvestedAny) return;

        // Animals
        this.animals.getChildren().forEach((child) => {
            const animal = child as Animal;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, animal.x, animal.y);
            if (dist < 100 && (animal as any).animalType === 'wolf' && !(animal as any).tamed) {
                if (Math.random() > 0.5) {
                    (animal as any).tamed = true; animal.setTint(0x00ff00); this.showFloatingText(animal.x, animal.y, "Tamed!", '#00ff00');
                    this.time.addEvent({
                        delay: 500, loop: true, callback: () => {
                            if (!animal.active || !this.player.active) return;
                            const d = Phaser.Math.Distance.Between(animal.x, animal.y, this.player.x, this.player.y);
                            if (d > 100) this.physics.moveToObject(animal, this.player, 150); else animal.setVelocity(0, 0);
                        }
                    });
                } else this.showFloatingText(animal.x, animal.y, "Failed...", '#ff0000');
            }
            if (dist < 100) (animal as Animal).interact();
        });
    }

    private showFloatingText(x: number, y: number, msg: string, color: string = '#00aa00') {
        const text = this.add.text(x, y - 40, msg, { color: color, fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
        this.tweens.add({ targets: text, y: text.y - 30, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
    }

    updateInventory(inv: any[]) { this.playerInventory = inv; }

    updateWeather(delta: number) {
        this.stormTimer += delta;
        const timeToNext = this.nextStormTime - this.stormTimer;
        if (this.tickTimer % 30 === 0) {
            window.dispatchEvent(new CustomEvent('game-weather-update', { detail: { isStorm: this.isStormActive, timeToNext: Math.max(0, Math.floor(timeToNext / 1000)) } }));
        }
        if (!this.isStormActive && this.stormTimer > this.nextStormTime) this.startStorm();
        else if (this.isStormActive && this.stormTimer > this.nextStormTime) this.endStorm();
    }

    startStorm() {
        this.isStormActive = true; this.stormTimer = 0; this.nextStormTime = 20000;
        this.tweens.add({ targets: this.stormOverlay, alpha: 0.6, duration: 2000 });
        this.snowEmitter.emitting = true; this.snowEmitter.start();
        this.showFloatingText(this.player.x, this.player.y - 100, "STORM APPROACHING!");
        this.builtObjects.getChildren().forEach((obj: any) => { if (obj instanceof Campfire) obj.destroy(); });
    }

    endStorm() {
        this.isStormActive = false; this.stormTimer = 0; this.nextStormTime = 300000 + Math.random() * 180000;
        this.tweens.add({ targets: this.stormOverlay, alpha: 0, duration: 2000 });
        this.snowEmitter.stop();
        this.showFloatingText(this.player.x, this.player.y - 100, "The storm has passed.");
    }

    shutdown() { if (this.networkManager) this.networkManager.disconnect(); }

    // --- MAIN UPDATE LOOP ---
    update(time: number, delta: number) {
        try {
            if (!this.player) return;

            // Auto Save
            this.saveTimer += delta;
            if (this.saveTimer > 10000) { this.saveTimer = 0; this.savePlayerState(this.player.x, this.player.y); }

            // Movement (Acceleration)
            const cursors = this.cursors;
            const body = this.player.body as Phaser.Physics.Arcade.Body;
            const ACCEL = 600;
            body.setAcceleration(0, 0);
            if (cursors.left.isDown) body.setAccelerationX(-ACCEL);
            else if (cursors.right.isDown) body.setAccelerationX(ACCEL);
            if (cursors.up.isDown) body.setAccelerationY(-ACCEL);
            else if (cursors.down.isDown) body.setAccelerationY(ACCEL);

            // Animation
            const vel = body.velocity;
            const moved = vel.length() > 10;
            let currentAnim = '';
            if (moved) {
                if (Math.abs(vel.x) > Math.abs(vel.y)) {
                    if (vel.x > 0) { this.playerSprite.play('walk-right', true); (this as any).lastDirection = 'right'; currentAnim = 'walk-right'; }
                    else { this.playerSprite.play('walk-left', true); (this as any).lastDirection = 'left'; currentAnim = 'walk-left'; }
                } else {
                    if (vel.y > 0) { this.playerSprite.play('walk-down', true); (this as any).lastDirection = 'down'; currentAnim = 'walk-down'; }
                    else { this.playerSprite.play('walk-up', true); (this as any).lastDirection = 'up'; currentAnim = 'walk-up'; }
                }
            } else {
                this.playerSprite.stop();
                const dir = (this as any).lastDirection || 'down';
                let frame = 0;
                if (dir === 'left') frame = 4; else if (dir === 'right') frame = 8; else if (dir === 'up') frame = 12;
                this.playerSprite.setFrame(frame);
            }
            (this as any).currentAnim = currentAnim;

            // Background
            if ((this as any).bg) {
                (this as any).bg.tilePositionX = this.cameras.main.scrollX;
                (this as any).bg.tilePositionY = this.cameras.main.scrollY;
            }

            // Logic
            this.updateFog();
            this.updateWeather(delta);

            // Warmth
            if (this.tickTimer++ > 60) {
                this.tickTimer = 0;
                let nearFire = false;
                this.builtObjects.getChildren().forEach((obj: any) => {
                    const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y);
                    if (d < 100) nearFire = true;
                });
                if (this.isStormActive) this.warmth = Math.max(0, this.warmth - (nearFire ? 1 : 5));
                else this.warmth = nearFire ? Math.min(100, this.warmth + 5) : Math.max(0, this.warmth - 1);
                window.dispatchEvent(new CustomEvent('game-stat-update', { detail: { warmth: this.warmth } }));
                const freezeAlpha = (100 - this.warmth) / 100 * 0.8;
                if (this.coldOverlay) this.coldOverlay.setAlpha(freezeAlpha);
            }

            // Multiplayer Sync
            if (this.networkManager) this.updateNetworkState(time, moved, this.player.x, this.player.y, (this as any).currentAnim || '', false);

            // Update Ghost
            if (this.input.activePointer && this.isPlacing) {
                this.updatePlacementGhost(this.input.activePointer);
            }

            // Igloo Logic (Visibility)
            this.builtObjects.getChildren().forEach((obj: any) => {
                if (obj instanceof Igloo) {
                    obj.updateLogic(this.player);
                }
            });

        } catch (e) {
            console.error(e);
        }
    }

    // XP Helper
    addXp(amount: number) { this.xp += amount; window.dispatchEvent(new CustomEvent('xp-change', { detail: { xp: this.xp } })); }

    // Helper Properties
    public xp: number = 0;
    public level: number = 1;
    public auroraShards: number = 0;

    createAnimations() {
        if (!this.anims.exists('walk-down')) {
            this.anims.create({ key: 'walk-down', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'walk-left', frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'walk-right', frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'walk-up', frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }), frameRate: 8, repeat: -1 });
        }
    }
}
