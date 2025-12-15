import Phaser from 'phaser';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import ResourceNode from '../objects/ResourceNode';
import Campfire from '../objects/Campfire';
import Igloo from '../objects/Igloo';
import Animal from '../objects/Animal';

export class MainScene extends Phaser.Scene {
    // Systems
    private player!: Phaser.GameObjects.Container;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private otherPlayers: Map<string, Phaser.GameObjects.Container> = new Map();
    private channel: RealtimeChannel | null = null;

    // State
    private playerId: string | null = null;
    private campaignId: string | null = null;
    private lastBroadcastTime = 0;
    private isConnected = false;
    private warmth = 100;
    private lastWarmthTick = 0;
    private gameTime = 0;
    private dayCount = 0;
    private tickTimer = 0;
    private lastX = 0;
    private lastY = 0;
    private readonly DAY_DURATION = 60000;
    private resources!: Phaser.GameObjects.Group;
    private builtObjects!: Phaser.GameObjects.Group;
    private animals!: Phaser.GameObjects.Group;
    private nearbyResource: ResourceNode | null = null;
    private playerInventory: any[] = [];

    // Weather
    private isStormActive: boolean = false;
    private stormTimer: number = 0;
    private nextStormTime: number = 300000; // First storm in 5 minutes
    private snowEmitter!: Phaser.GameObjects.Particles.ParticleEmitter;
    private stormOverlay!: Phaser.GameObjects.Rectangle;

    // Visuals
    private darknessOverlay!: Phaser.GameObjects.Rectangle;
    private coldOverlay!: Phaser.GameObjects.Rectangle;
    private playerSprite!: Phaser.GameObjects.Sprite;

    // Placement State
    private isPlacing = false;
    private placementItem: string | null = null;
    private placementGhost: Phaser.GameObjects.Rectangle | null = null;
    private validPlacement = false;

    // World & Fog
    private fogTexture!: Phaser.GameObjects.RenderTexture;
    private fogBrush!: Phaser.GameObjects.GameObject;

    // Mobile Controls
    private touchState = { up: false, down: false, left: false, right: false };

    constructor() {
        super({ key: 'MainScene' });
    }

    init(data: { playerId: string; campaignId: string; displayName: string; initialWarmth?: number }) {
        this.playerId = data.playerId;
        this.campaignId = data.campaignId;
        if (data.initialWarmth !== undefined) {
            this.warmth = data.initialWarmth;
        }
        // Progression Init
        this.xp = 0;
        this.level = 1;
        this.auroraShards = 0; // Load from DB later
    }

    // Properties
    public xp: number = 0;
    public level: number = 1;
    public auroraShards: number = 0;

    addXp(amount: number) {
        this.xp += amount;
        // Level Up Formula: 100 * level
        const nextLevelXp = this.level * 100;
        if (this.xp >= nextLevelXp) {
            this.level++;
            this.xp -= nextLevelXp;
            // Level Up Juice
            this.sound.play('ice_crystal', { volume: 0.5 }); // Placeholder sound
            const text = this.add.text(this.player.x, this.player.y - 50, 'LEVEL UP!', { fontSize: '24px', color: '#ffd700', stroke: '#000', strokeThickness: 4 });
            this.tweens.add({ targets: text, y: text.y - 50, alpha: 0, duration: 2000, onComplete: () => text.destroy() });

            window.dispatchEvent(new CustomEvent('level-up', { detail: { level: this.level } }));
        }
        window.dispatchEvent(new CustomEvent('xp-change', { detail: { xp: this.xp, level: this.level, maxXp: this.level * 100 } }));
    }

    preload() {
        // Phase 2 Assets (High Quality)
        this.load.image('snow_ground', '/assets/game/snow_ground_seamless_v2_1765704047104.png');
        this.load.image('tree', '/assets/game/pine_tree_small.png'); // New Transparent Tree
        this.load.image('ice_crystal', '/assets/game/ice_crystal_sprite_1765704033442.png');
        this.load.image('fog_noise', '/assets/fog_noise.png');

        // Animals
        this.load.image('penguin', '/assets/game/penguin.png');
        this.load.spritesheet('polar_bear', '/assets/game/polar_bear_high_res_1765704059746.png', { frameWidth: 64, frameHeight: 64 });
        this.load.image('wolf', '/assets/game/wolf.png');
        this.load.image('seal', '/assets/game/seal.png');
        this.load.image('fish', '/assets/game/fish.png');

        // Terrain
        this.load.image('water', '/assets/game/ice_crystal_sprite_1765704033442.png'); // Placeholder (Blue tint later)
    }

    create() {
        // 1. World & Background (Replaced Grid)
        this.physics.world.setBounds(0, 0, 4000, 4000);

        // Tiled Snow Background (Infinite Scroll)
        // Use the V2 texture directly
        const bg = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'snow_ground');
        bg.setOrigin(0, 0);
        bg.setScrollFactor(0);
        bg.setDepth(-100);

        // Store reference to update tilePosition
        (this as any).bg = bg;

        // Terrain Generation
        this.generateTerrain();

        // 2. Groups
        this.resources = this.add.group();
        this.builtObjects = this.add.group();
        this.animals = this.add.group();
        // ... (skipping spawning lines for brevity in this edit if possible, or just assume they remain)

        // ...

        // 9. Weather System
        // Storm Overlay (Darkening)
        // IMPORTANT: Create generic rectangle covering screen, fixed to camera
        this.stormOverlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000033, 0);
        this.stormOverlay.setOrigin(0, 0); // Important for rectangle to start at top-left of camera
        this.stormOverlay.setScrollFactor(0); // FIX: Stick to camera
        this.stormOverlay.setDepth(150);

        // 3. Spawning
        // Increased count and range to cover map
        for (let i = 0; i < 300; i++) {
            const x = Phaser.Math.Between(100, 3900);
            const y = Phaser.Math.Between(100, 3900);
            const type = Math.random() > 0.5 ? 'tree' : 'ice';
            const node = new ResourceNode(this, x, y, type as 'tree' | 'ice');
            this.resources.add(node);
            this.add.existing(node);
        }

        // Spawn Animals (More diverse)
        for (let i = 0; i < 40; i++) {
            const x = Phaser.Math.Between(100, 3900);
            const y = Phaser.Math.Between(100, 3900);
            const r = Math.random();
            let type = 'penguin';
            if (r > 0.85) type = 'polar_bear'; // 15% Bear
            else if (r > 0.7) type = 'wolf';   // 15% Wolf
            else if (r > 0.5) type = 'seal';   // 20% Seal
            // 50% Penguin

            const animal = new Animal(this, x, y, type);
            this.animals.add(animal);
        }

        // 4. Player
        // Start near center
        this.createLocalPlayer(Phaser.Math.Between(1800, 2200), Phaser.Math.Between(1800, 2200));

        // 5. Input
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();

            this.input.keyboard.on('keydown-I', () => {
                window.dispatchEvent(new CustomEvent('game-toggle-inventory'));
            });

            this.input.keyboard.on('keydown-E', () => {
                this.handleInteraction();
            });
        }

        // 6. Placement Listeners
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
                if (this.validPlacement) {
                    this.confirmPlacement();
                }
            } else if (this.isPlacing && pointer.rightButtonDown()) {
                this.cancelPlacement();
            }
        });

        // 7. Overlays
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        this.darknessOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000010);
        this.darknessOverlay.setScrollFactor(0);
        this.darknessOverlay.setDepth(100);
        this.darknessOverlay.setAlpha(0);

        this.coldOverlay = this.add.rectangle(width / 2, height / 2, width, height, 0x00aaff);
        this.coldOverlay.setScrollFactor(0);
        this.coldOverlay.setDepth(101);
        this.coldOverlay.setAlpha(0);

        // 8. Connect
        this.setupMultiplayer();
        this.loadStructures();

        window.addEventListener('game-inventory-sync', (e: Event) => {
            const detail = (e as CustomEvent).detail;
            this.updateInventory(detail);
        });

        // 9. Weather System
        // Storm Overlay (Darkening)
        // Storm Overlay (Darkening)
        this.stormOverlay = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000033, 0).setDepth(150);
        this.stormOverlay.setScrollFactor(0); // FIX: Stick to camera

        // Snow Particles
        const snowGraphics = this.make.graphics({ x: 0, y: 0 }, false);
        snowGraphics.fillStyle(0xffffff);
        snowGraphics.fillCircle(2, 2, 2);
        snowGraphics.generateTexture('snowflake', 4, 4);

        this.snowEmitter = this.add.particles(0, 0, 'snowflake', {
            x: { min: 0, max: 800 },
            y: 0,
            quantity: 2,
            lifespan: 2000,
            gravityY: 50,
            speedY: { min: 100, max: 200 },
            speedX: { min: -50, max: 50 },
            scale: { start: 0.5, end: 1 },
            alpha: { start: 0.8, end: 0 },
            emitting: false
        });
        this.snowEmitter.setScrollFactor(0); // Attach to screen? Or Camera? 
        // Better to attach to camera or keep it screen space. 
        // For simplicity, let's keep it screen space but we need to cover the viewport.
        // Actually, 'particles' manager needs to be in screen space or moving with camera.
        // Let's use setScrollFactor(0) and make it cover the screen size.
        this.snowEmitter.setPosition(0, -10);
        this.snowEmitter.setDepth(200);

        // Fog of War (Last, on top of everything except UI overlays)
        this.setupFogOfWar();
        this.updateFog();

        // Zoom Input
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom;
            // Limit zoom to prevent visual bugs
            const newZoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.5, 2.0);
            this.cameras.main.zoomTo(newZoom, 100);
        });

        // Collisions
        this.physics.add.collider(this.player, this.resources);
        this.physics.add.collider(this.player, this.builtObjects);

        // Animations
        if (!this.anims.exists('walk-down')) {
            this.anims.create({
                key: 'walk-down',
                frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'walk-left',
                frames: this.anims.generateFrameNumbers('player', { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'walk-right',
                frames: this.anims.generateFrameNumbers('player', { start: 8, end: 11 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'walk-up',
                frames: this.anims.generateFrameNumbers('player', { start: 12, end: 15 }),
                frameRate: 8,
                repeat: -1
            });
        }
    }

    createLocalPlayer(x: number, y: number) {
        this.player = this.add.container(x, y);

        // Use Sprite
        this.playerSprite = this.add.sprite(0, 0, 'player');
        this.playerSprite.setScale(0.2); // Adjust scale based on actual asset size
        this.playerSprite.setOrigin(0.5, 0.6); // Feet pivot

        const nameText = this.add.text(0, -40, 'You', { fontSize: '14px', color: '#000', align: 'center' }).setOrigin(0.5);

        this.player.add([this.playerSprite, nameText]);
        this.player.setDepth(100); // Ensure player is above ground and resources

        this.physics.add.existing(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setSize(24, 24);
        body.setOffset(-12, -12);

        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }

    createOtherPlayer(id: string, x: number, y: number, name: string) {
        if (this.otherPlayers.has(id)) return;
        const container = this.add.container(x, y);

        const sprite = this.add.sprite(0, 0, 'player');
        sprite.setScale(0.2);
        sprite.setOrigin(0.5, 0.6);
        sprite.setTint(0xaaaaff); // Tint other players slightly to distinguish?

        const nameText = this.add.text(0, -40, name || 'Player', { fontSize: '14px', color: '#000' }).setOrigin(0.5);
        container.add([sprite, nameText]);
        this.add.existing(container);
        this.otherPlayers.set(id, container);
    }

    // --- Core Logic ---

    generateTerrain() {
        for (let i = 0; i < 200; i++) {
            const x = Phaser.Math.Between(0, 4000);
            const y = Phaser.Math.Between(0, 4000);
            const size = Phaser.Math.Between(20, 60);
            if (Math.random() > 0.6) {
                this.add.ellipse(x, y, size * 2, size, 0xffffff, 0.4);
            }
        }
    }

    setupFogOfWar() {
        const width = 4000;
        const height = 4000;

        // Dark Blue/Grey Fog for "Night/Storm" feel
        this.fogTexture = this.make.renderTexture({ x: 0, y: 0, width, height });
        this.fogTexture.fill(0x1a2b3c, 1);
        this.fogTexture.setDepth(90);

        // Soft Brush
        const graphics = this.make.graphics({ x: 0, y: 0 }, false);
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillCircle(100, 100, 80);
        graphics.fillStyle(0xffffff, 0.4);
        graphics.fillCircle(100, 100, 100);
        graphics.fillStyle(0xffffff, 0.2);
        graphics.fillCircle(100, 100, 120);
        graphics.generateTexture('fogBrush', 250, 250);

        this.fogBrush = this.make.image({ x: 0, y: 0, key: 'fogBrush', add: false });
    }

    updateFog() {
        if (!this.fogTexture || !this.player || !this.fogBrush) return;
        this.fogTexture.erase(this.fogBrush, this.player.x - 100, this.player.y - 100);
    }

    // Placement Methods
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

        const color = this.validPlacement ? 0x00ff00 : 0xff0000;
        this.placementGhost.setFillStyle(color, 0.5);
    }

    confirmPlacement() {
        if (!this.placementGhost || !this.placementItem) return;

        window.dispatchEvent(new CustomEvent('game-confirm-placement', {
            detail: {
                item: this.placementItem,
                x: this.placementGhost.x,
                y: this.placementGhost.y
            }
        }));
        this.cancelPlacement();
    }

    cancelPlacement() {
        this.isPlacing = false;
        this.placementItem = null;
        if (this.placementGhost) {
            this.placementGhost.destroy();
            this.placementGhost = null;
        }
        window.dispatchEvent(new CustomEvent('game-cancel-placement'));
    }

    // Structure Persistence
    async loadStructures() {
        if (!this.campaignId) return;
        const { data } = await supabase
            .from('game_structures' as any)
            .select('*')
            .eq('campaign_id', this.campaignId);

        if (data) {
            data.forEach((s: any) => {
                this.spawnStructure(s.type, s.x, s.y, false);
            });
        }
    }

    update(time: number, delta: number) {
        try {
            if (!this.player) return;

            const { x, y } = this.player;

            // Player Movement
            // Speed affected by warmth. If warmth < 20, speed drops drastically.
            const baseSpeed = 200;
            let speedMod = 1.0;
            if (this.warmth < 20) speedMod = 0.4;
            else if (this.warmth < 50) speedMod = 0.7;

            const speed = baseSpeed * speedMod;
            const cursors = this.cursors;
            let vx = 0;
            let vy = 0;

            if (cursors.left.isDown) vx = -speed;
            else if (cursors.right.isDown) vx = speed;

            if (cursors.up.isDown) vy = -speed;
            else if (cursors.down.isDown) vy = speed;

            (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(vx, vy);

            // Animation
            const moved = vx !== 0 || vy !== 0;
            if (moved) {
                if (Math.abs(vx) > Math.abs(vy)) {
                    if (vx > 0) { this.playerSprite.play('walk-right', true); (this as any).lastDirection = 'right'; }
                    else { this.playerSprite.play('walk-left', true); (this as any).lastDirection = 'left'; }
                } else {
                    if (vy > 0) { this.playerSprite.play('walk-down', true); (this as any).lastDirection = 'down'; }
                    else { this.playerSprite.play('walk-up', true); (this as any).lastDirection = 'up'; }
                }
            } else {
                this.playerSprite.stop();
                // Idle frame based on last direction
                const dir = (this as any).lastDirection || 'down';
                let frame = 0;
                if (dir === 'left') frame = 4;
                else if (dir === 'right') frame = 8;
                else if (dir === 'up') frame = 12;
                this.playerSprite.setFrame(frame);
            }

            // Update Background Parallax
            if ((this as any).bg) {
                (this as any).bg.tilePositionX = this.cameras.main.scrollX;
                (this as any).bg.tilePositionY = this.cameras.main.scrollY;
            }

            // Camera Follow
            this.cameras.main.startFollow(this.player, true, 0.05, 0.05);

            // Fog Update
            this.updateFog();

            // Local State
            this.lastX = x;
            this.lastY = y;

            // Update Ghost
            if (this.input.activePointer) {
                this.updatePlacementGhost(this.input.activePointer);
            }

            // Weather Logic
            this.updateWeather(delta);

            // Warmth Logic
            // Determine if indoors (near Igloo or Fire)
            let nearFire = false;
            let tempWarmthSource: any = null;

            // Check Campfire
            const builtObjects = this.builtObjects.getChildren();
            builtObjects.forEach((obj: any) => {
                if (obj instanceof Campfire && obj.active) {
                    if (Phaser.Math.Distance.Between(x, y, obj.x, obj.y) < 100) {
                        nearFire = true;
                    }
                } else if (obj instanceof Igloo && obj.active) {
                    // Check if "inside" structure? For now, proximity.
                    if (Phaser.Math.Distance.Between(x, y, obj.x, obj.y) < 60) {
                        nearFire = true; // Igloo counts as shelter/warmth
                    }
                }
            });

            // Storm overrides warmth unless indoors
            // We'll treat Campfire as OUTDOOR warmth (destroyed by storm)
            // Igloo as INDOOR warmth (safe)

            if (this.tickTimer++ > 60) { // Every ~1s
                this.tickTimer = 0;

                if (this.isStormActive) {
                    // Harsh decay unless in Igloo
                    // TODO: Distinguish Igloo vs Campfire
                    if (nearFire) {
                        // Check if it's an Igloo specifically?
                        // For simplicity, if near ANY structure we give some protection, 
                        // but Campfires get destroyed in handleWeather.
                        this.warmth = Math.max(0, this.warmth - 1); // Still cold in storm, but survivable
                    } else {
                        this.warmth = Math.max(0, this.warmth - 5); // FREEZING
                    }
                } else {
                    if (nearFire) {
                        this.warmth = Math.min(100, this.warmth + 5);
                    } else {
                        const hasCoat = this.playerInventory.some(i => i.name === 'Fur Coat' && i.count > 0);
                        const decay = hasCoat ? 0.2 : 1;
                        this.warmth = Math.max(0, this.warmth - decay);
                    }
                }

                window.dispatchEvent(new CustomEvent('game-stat-update', {
                    detail: { warmth: this.warmth, day: Math.floor(Date.now() / 100000) } // Mock day
                }));

                // Check Death
                if (this.warmth <= 0) {
                    console.log("Frozen!");
                    // Respawn or Game Over logic?
                }
            }

            const freezeAlpha = (100 - this.warmth) / 100 * 0.8;
            if (this.coldOverlay) this.coldOverlay.setAlpha(freezeAlpha);

            // Update Animals
            this.animals.getChildren().forEach((child) => {
                (child as Animal).updateLogic(this.player);
            });

            // Multiplayer
            if (Math.abs(time - this.lastBroadcastTime) > 50 && this.isConnected && moved && this.channel) {
                this.channel.send({
                    type: 'broadcast',
                    event: 'player_move',
                    payload: { id: this.playerId, x: this.player.x, y: this.player.y, name: 'Player' }
                });
                this.lastBroadcastTime = time;
            }
        } catch (e) {
            console.error("MainScene Update Error:", e);
        }
    }

    handlePlayerMove(data: { id: string, x: number, y: number, name: string }) {
        if (data.id === this.playerId) return;
        const other = this.otherPlayers.get(data.id);
        if (other) other.setPosition(data.x, data.y);
        else this.createOtherPlayer(data.id, data.x, data.y, data.name);
    }

    setupMultiplayer() {
        if (!this.campaignId || !this.playerId) return;
        this.channel = supabase.channel(`game_${this.campaignId} `);
        this.channel
            .on('broadcast', { event: 'player_move' }, (payload) => this.handlePlayerMove(payload.payload))
            .on('broadcast', { event: 'structure_placed' }, (payload) => {
                const { type, x, y } = payload.payload;
                this.spawnStructure(type, x, y, false);
            })
            .subscribe((status) => { if (status === 'SUBSCRIBED') this.isConnected = true; });
    }

    async saveStructure(type: string, x: number, y: number) {
        if (!this.campaignId || !this.playerId) return;
        await supabase.from('game_structures' as any).insert({
            campaign_id: this.campaignId,
            owner_id: this.playerId,
            type: type,
            x: x,
            y: y,
            data: {}
        });
    }

    broadcastStructure(type: string, x: number, y: number) {
        if (this.isConnected) {
            this.channel?.send({
                type: 'broadcast',
                event: 'structure_placed',
                payload: { type, x, y, owner_id: this.playerId }
            });
        }
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
        } else if (item === 'signal_fire') {
            // WIN CONDITION
            const fire = this.add.sprite(posX, posY, 'campfire'); // Placeholder or reuse campfire
            fire.setTint(0xff0000);
            fire.setScale(2);
            this.add.existing(fire);

            // Big Fire Effect
            const particles = this.add.particles(posX, posY, 'snowflake', {
                speed: 100,
                scale: { start: 1, end: 0 },
                blendMode: 'ADD',
                lifespan: 1000,
                tint: 0xff4400
            });
            particles.setDepth(200);

            // Trigger Win
            window.dispatchEvent(new CustomEvent('game-win'));
        }

        if (save) {
            this.saveStructure(item, posX, posY);
            this.broadcastStructure(item, posX, posY);
        }
    }




    private handleInteraction() {
        // 1. Harvest Resources (Multi-harvest)
        if (this.resources) {
            const playerCenter = new Phaser.Math.Vector2(this.player.x, this.player.y);
            let harvestedAny = false;

            this.resources.getChildren().forEach((obj) => {
                const node = obj as ResourceNode;
                if (!node.active) return;

                const dist = playerCenter.distance(new Phaser.Math.Vector2(node.x, node.y));
                if (dist < 80) { // Increased range slightly
                    const result = node.harvest();
                    if (result) {
                        window.dispatchEvent(new CustomEvent('game-inventory-add', { detail: result }));
                        this.showFloatingText(this.player.x, this.player.y, `+ 1 ${result.type} `);
                        this.addXp(10); // PROGESSION: 10 XP per hit
                        harvestedAny = true;
                    }
                }
            });

            if (harvestedAny) return; // Prioritize harvesting
        }

        // Check Animals
        let nearestAnimal: Animal | null = null;
        let minDist = 100;

        this.animals.getChildren().forEach((child) => {
            const animal = child as Animal;
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, animal.x, animal.y);

            // TAMING (Wolf)
            if (dist < 100 && (animal as any).animalType === 'wolf' && !(animal as any).tamed) {
                // Tame Chance
                if (Math.random() > 0.5) {
                    (animal as any).tamed = true;
                    animal.setTint(0x00ff00);
                    this.showFloatingText(animal.x, animal.y, "Tamed!", '#00ff00');
                    // Simple Follow
                    this.time.addEvent({
                        delay: 500,
                        loop: true,
                        callback: () => {
                            if (!animal.active || !this.player.active) return;
                            const d = Phaser.Math.Distance.Between(animal.x, animal.y, this.player.x, this.player.y);
                            if (d > 100) this.physics.moveToObject(animal, this.player, 150);
                            else animal.setVelocity(0, 0);
                        }
                    });
                } else {
                    this.showFloatingText(animal.x, animal.y, "Failed...", '#ff0000');
                }
            } // End Taming check

            if (dist < minDist) {
                minDist = dist;
                nearestAnimal = animal;
            }
        }); // End forEach

        // FOG REVEAL
        if (this.fogTexture && this.player) {
            const brush = this.make.graphics({ x: 0, y: 0 }, false);
            brush.fillStyle(0xffffff, 1);
            brush.fillCircle(0, 0, 150); // Reveal Radius
            this.fogTexture.erase(brush, this.player.x, this.player.y);
            brush.destroy();
        }

        if (nearestAnimal) {
            (nearestAnimal as Animal).interact();
        }
    }

    private showFloatingText(x: number, y: number, msg: string, color: string = '#00aa00') {
        const text = this.add.text(x, y - 40, msg, { color: '#00aa00', fontSize: '16px', fontStyle: 'bold' }).setOrigin(0.5);
        this.tweens.add({ targets: text, y: text.y - 30, alpha: 0, duration: 1000, onComplete: () => text.destroy() });
    }

    private checkNearbyResources() {
        if (!this.player || !this.resources) return;
        let found = false;
        const playerCenter = new Phaser.Math.Vector2(this.player.x, this.player.y);

        this.resources.getChildren().forEach((obj) => {
            const node = obj as ResourceNode;
            const dist = playerCenter.distance(new Phaser.Math.Vector2(node.x, node.y));
            if (dist < 60 && node.active) {
                if (this.nearbyResource !== node) {
                    if (this.nearbyResource) this.nearbyResource.hidePrompt();
                    this.nearbyResource = node;
                    node.showPrompt();
                }
                found = true;
            } else {
                if (node === this.nearbyResource) node.hidePrompt();
            }
        });

        if (!found && this.nearbyResource) {
            if (this.nearbyResource.active) {
                this.nearbyResource.hidePrompt();
            }
            this.nearbyResource = null;
        }
    }

    updateInventory(inv: any[]) {
        this.playerInventory = inv;
    }

    updateWeather(delta: number) {
        this.stormTimer += delta;
        const timeToNext = this.nextStormTime - this.stormTimer;

        // UI Update for Timer
        if (this.tickTimer % 30 === 0) { // Optimize event emission
            window.dispatchEvent(new CustomEvent('game-weather-update', {
                detail: {
                    isStorm: this.isStormActive,
                    timeToNext: Math.max(0, Math.floor(timeToNext / 1000))
                }
            }));
        }

        if (!this.isStormActive && this.stormTimer > this.nextStormTime) {
            this.startStorm();
        } else if (this.isStormActive && this.stormTimer > this.nextStormTime) {
            this.endStorm();
        }
    }

    startStorm() {
        this.isStormActive = true;
        this.stormTimer = 0;
        this.nextStormTime = 20000; // Storm lasts 20s

        // VIsuals
        this.tweens.add({
            targets: this.stormOverlay,
            alpha: 0.6,
            duration: 2000
        });

        this.snowEmitter.emitting = true;
        this.snowEmitter.start();

        this.showFloatingText(this.player.x, this.player.y - 100, "STORM APPROACHING!");

        // Destroy Campfires
        this.builtObjects.getChildren().forEach((obj: any) => {
            if (obj instanceof Campfire) {
                obj.destroy(); // Simple local destroy for effect
            }
        });
    }

    endStorm() {
        this.isStormActive = false;
        this.stormTimer = 0;
        this.nextStormTime = 300000 + Math.random() * 180000; // Next storm in 5-8 mins

        // Visuals
        this.tweens.add({
            targets: this.stormOverlay,
            alpha: 0,
            duration: 2000
        });
        this.snowEmitter.stop();

        this.showFloatingText(this.player.x, this.player.y - 100, "The storm has passed.");
    }

    shutdown() {
        if (this.channel) supabase.removeChannel(this.channel);
    }
}
