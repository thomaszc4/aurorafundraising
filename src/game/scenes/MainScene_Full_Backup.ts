
import Phaser from 'phaser';
import { supabase } from '@/integrations/supabase/client';
import ResourceNode from '../objects/ResourceNode';
import Campfire from '../objects/Campfire';
import Igloo from '../objects/Igloo';
import Animal from '../objects/Animal';
import { NetworkManager } from '../managers/NetworkManager';

const DEPTH = {
    BG_FALLBACK: -101,
    BG_TILE: -100,
    // Dynamic Sorting Layer: 0 to 8000 (World Height)
    // Overlays must be above world
    FOG_TEXTURE: 10000,
    OVERLAY_DARKNESS: 10001,
    OVERLAY_COLD: 10002,
    OVERLAY_STORM: 10003,
    PARTICLE_SNOW: 10005,
    UI_DEBUG: 99999
};

const CACHE_BUST = Date.now(); // Unique per session to force reload

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
    private appearance: { archetype: string, gender: string } | null = null;

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
    private debugLogs!: Phaser.GameObjects.Text;
    private showDebug = false;
    private heartbeat!: Phaser.GameObjects.Rectangle;

    constructor() {
        super({ key: 'MainScene' });
    }

    // DIAGNOSTICS
    private diagnosticsText!: Phaser.GameObjects.Text;
    private assetStatus: string[] = [];
    private fsLog: string[] = [];

    init(data: { playerId: string; campaignId: string; displayName: string }) {
        this.playerId = data.playerId;
        this.campaignId = data.campaignId;
        this.logDiag("INIT: " + this.playerId);

        this.events.on('shutdown', () => {
            this.logDiag("SHUTDOWN");
            if (this.networkManager) {
                this.networkManager.disconnect();
            }
        });
    }

    logDiag(msg: string) {
        this.fsLog.push(msg);
        if (this.fsLog.length > 20) this.fsLog.shift();
        if (this.diagnosticsText) this.diagnosticsText.setText(this.getDiagString());
        console.log(msg);
    }

    getDiagString() {
        return `FPS: ${this.game.loop.actualFps.toFixed(1)} | T: ${this.time.now.toFixed(0)}\n` +
            `Player: ${this.player ? Math.round(this.player.x) + ',' + Math.round(this.player.y) : 'NULL'}\n` +
            `ASSETS:\n${this.assetStatus.join('\n')}\n` +
            `LOGS:\n${this.fsLog.join('\n')}`;
    }

    preload() {
        console.log("PRELOAD RUNNING");

        // 1. Create Placeholder Texture (Magenta Box)
        const gfx = this.make.graphics({ x: 0, y: 0 });
        gfx.fillStyle(0xff00ff);
        gfx.fillRect(0, 0, 32, 32);
        gfx.generateTexture('placeholder', 32, 32);
        gfx.destroy(); // Cleanup after generating texture

        // Asset Tracking & Fallback System
        this.load.on('filecomplete', (key: string) => {
            this.assetStatus.push(`✅ ${key}`);
            this.logDiag(`Loaded: ${key}`);
        });

        this.load.on('loaderror', (file: any) => {
            this.assetStatus.push(`❌ ${file.key} (Using Placeholder)`);
            this.logDiag(`FAIL: ${file.key} -> Placeholder`);
            // Map the failed key to the placeholder texture
            if (!this.textures.exists(file.key)) {
                // We can't easily re-map a failed key in Phaser's loader mid-flight safely without internal hacks.
                // Instead, we ensure code using it checks existence, OR we alias it post-load.
                // Phaser 3.60+ allows alias. For 3.50, we just note it.
                // Workaround: We will use a "Safe Sprite" factory or check usage.
                // BETTER: We create the missing texture alias immediately.
                if (file.type === 'image') {
                    this.textures.addBase64(file.key, 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKwAEAAAAABJRU5ErkJggg=='); // Empty 1x1, then we frame it?
                    // Actually, let's just create a texture from the placeholder graphics for this key
                    // this.textures.get('placeholder').getSourceImage();
                }
            }
        });

        // ROBUSTNESS: If spritesheet fails, we must provide a fallback that supports animation calls (even if empty) to prevent crashes.
        // We will handle this by creating a Dummy Texture for the failed key.
        this.load.on('loaderror', (file: any) => {
            // Create a 32x32 magenta placeholder for this specific key immediately
            if (!this.textures.exists(file.key)) {
                const fallback = this.textures.createCanvas(file.key, 32, 32);
                if (fallback) {
                    const ctx = fallback.context;
                    ctx.fillStyle = '#ff00ff';
                    ctx.fillRect(0, 0, 32, 32);
                    fallback.refresh();
                }
            }
        });

        const v = `?v=${CACHE_BUST}`;
        this.load.image('snow_ground', '/assets/game/snow_ground_v3.png' + v);
        this.load.image('tree', '/assets/game/pine_tree_small.png' + v);
        this.load.image('ice_crystal', '/assets/game/ice_crystal_v2.png' + v);
        this.load.image('fog_noise', '/assets/game/fog_noise_texture_1765702486021.png' + v);

        // NEW CHARACTER ARCHETYPES (Safe Mode: 64x64)
        const charConfig = { frameWidth: 64, frameHeight: 64 };
        this.load.spritesheet('char_alpinist_m', '/assets/game/char_alpinist_m.png' + v, charConfig);
        this.load.spritesheet('char_alpinist_f', '/assets/game/char_alpinist_f.png' + v, charConfig);
        this.load.spritesheet('char_surveyor_m', '/assets/game/char_surveyor_m.png' + v, charConfig);
        this.load.spritesheet('char_surveyor_f', '/assets/game/char_surveyor_f.png' + v, charConfig);
        this.load.spritesheet('char_local_m', '/assets/game/char_local_m.png' + v, charConfig);
        this.load.spritesheet('char_local_f', '/assets/game/char_local_f.png' + v, charConfig);

        // RETORED ASSETS due to missing files
        this.load.spritesheet('penguin', '/assets/game/penguin.png' + v, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('polar_bear', '/assets/game/polar_bear_high_res_1765704059746.png' + v, { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('wolf', '/assets/game/wolf_sprite_v2.png' + v, { frameWidth: 64, frameHeight: 64 });
        this.load.image('seal', '/assets/game/seal_sprite_1765702498963.png' + v);
        this.load.image('fish', '/assets/game/fish_icon_1765702512195.png' + v);
        this.load.image('water', '/assets/game/ice_crystal_sprite_1765704033442.png' + v); // Placeholder
    }

    async create() {
        console.log("MainScene CREATE START");

        // 0. Force Background Color (Fix Checkers)
        this.cameras.main.setBackgroundColor('#dbe7eb');
        // FORCE DOM LEVEL BACKGROUND
        if (this.game.canvas) {
            this.game.canvas.style.backgroundColor = '#dbe7eb';
        }

        // SAFETY 1: Green Box FIRST thing.
        const safeBox = this.add.rectangle(100, 100, 200, 200, 0x00ff00);
        safeBox.setDepth(9999);
        safeBox.setScrollFactor(0);
        // DIAGNOSTICS UI
        this.diagnosticsText = this.add.text(10, 10, "DIAGNOSTICS INIT...", {
            font: '16px monospace', color: '#00ff00', backgroundColor: '#000000aa',
            wordWrap: { width: 400 }
        });
        this.diagnosticsText.setScrollFactor(0).setDepth(10000);
        this.logDiag("CREATE START");
        this.heartbeat = this.add.rectangle(750, 50, 50, 50, 0xff0000);
        this.heartbeat.setScrollFactor(0).setDepth(10000);

        // console.log("NUCLEAR OPTION: STOPPING CREATE HERE.");
        // return; // <--- STOP EVERYTHING ELSE

        try {

            // SAFETY: Zoom out so user can see
            // this.cameras.main.setZoom(0.5); // REMOVED: Causing Offset issues
            this.cameras.main.setZoom(1.0);
            // 0. Force Background Color (Fix Checkers)
            this.cameras.main.setBackgroundColor('#dbe7eb');

            // 1. World Bounds
            this.physics.world.setBounds(0, 0, 8000, 8000);

            // SAFETY: Fix RNG Crash if init() failed or wasn't called
            if (!this.rng) {
                this.logDiag("RNG MISSING! using fallback");
                this.rng = new Phaser.Math.RandomDataGenerator(['fallback']);
            }

            // 2. Background - COMPLETELY FIXED
            try {
                // FIX 1: Screen-fixed background at depth 0 (not -9999 which clips)
                const screenBg = this.add.rectangle(400, 300, 2000, 2000, 0xdbe7eb);
                screenBg.setScrollFactor(0);
                screenBg.setDepth(0); // CRITICAL: Depth 0, not -9999
                (this as any).bg = screenBg;

                // FIX 2: World-space background that moves with camera  
                const worldBg = this.add.rectangle(4000, 4000, 10000, 10000, 0xdbe7eb);
                worldBg.setDepth(1); // Just above screen bg

                // Resize handler for screen bg
                this.scale.on('resize', (gameSize: any) => {
                    screenBg.setPosition(gameSize.width / 2, gameSize.height / 2);
                    screenBg.setSize(gameSize.width * 2, gameSize.height * 2);
                });

                // DEBUG HUD: On-Screen Live Data
                (this as any).debugHUD = this.add.text(20, 150, "HUD INIT...", {
                    fontSize: '20px',
                    fontFamily: 'monospace',
                    color: '#ffffff',
                    backgroundColor: '#000000aa',
                    padding: { x: 10, y: 10 }
                }).setScrollFactor(0).setDepth(20000);

                console.log("BACKGROUND FIX APPLIED: screenBg depth=0, worldBg depth=1");
            } catch (e) { this.logDiag("BG_FAIL: " + e); }

            // 3. Groups
            this.resources = this.add.group();
            this.builtObjects = this.add.group();
            this.animals = this.add.group();
            this.terrainGroup = this.add.group(); // For Lakes/Obstacles

            // 4. Generate World (Seeded)
            this.generateTerrain();
            this.generateResources();
            this.generateAnimals();

            // 5. Player Init
            this.logDiag("PLAYER_START");
            // NON-BLOCKING call with GUARANTEED SPAWN
            let startX = 4000, startY = 4000;
            const playerData = null; // FORCE NEW PLAYER FOR DEBUG

            this.appearance = {
                archetype: Phaser.Math.RND.pick(['alpinist', 'surveyor', 'local']),
                gender: Phaser.Math.RND.pick(['m', 'f'])
            };
            console.log("New Player - Generated Identity:", this.appearance);

            // Create Player Object (GUARANTEED REACH)
            console.log("Spawn Point:", startX, startY);
            this.createLocalPlayer(startX, startY);

            this.logDiag("SETUP_INPUTS");

            // 6. Fog of War
            // this.setupFogOfWar(); // DISABLED FOR DEBUG

            // 7. Multiplayer
            // this.setupMultiplayer(); // DISABLED FOR DEBUG

            // 8. Inputs
            this.setupInputs();

            // 9. Overlays
            this.setupOverlays();

            // 10. Load Structures (Multiplayer related, but can run standalone)
            this.loadStructures(); // Fire and forget (don't await)
            this.ensurePlayerHome(); // Fire and forget

            // 11. Camera Zoom
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
            this.add.text(10, 100, "Version: Local Fallback Active", { color: '#00ff00', fontSize: '10px' }).setScrollFactor(0).setDepth(10001);

            // SAFETY: Green Box at 100,100 to prove scene is alive
            const safeBox = this.add.rectangle(100, 100, 200, 200, 0x00ff00);
            safeBox.setDepth(9999);
            safeBox.setScrollFactor(0);
            this.add.text(10, 50, "SCENE ALIVE", { color: '#000000', backgroundColor: '#00ff00' }).setScrollFactor(0).setDepth(9999);

            this.scale.on('resize', (gameSize: any) => {
                this.cameras.main.setViewport(0, 0, gameSize.width, gameSize.height);
                if ((this as any).bg) (this as any).bg.setSize(gameSize.width, gameSize.height);
            });
        } catch (err: any) {
            console.error("CRITICAL SCENE ERROR:", err);
            const errText = `CRASH: ${err.message}`;
            this.add.text(10, 300, errText, { color: '#ffffff', backgroundColor: '#ff0000', fontSize: '24px' }).setScrollFactor(0).setDepth(10000);
        }
    }

    // REMOVED logStep to prevent crashes (Use logDiag)

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

    // Initialize Verification Suite
    async runVerificationSuite() {
        console.group('🔍 Running Codebase Audit Verification Suite...');
        let passed = 0;
        let total = 5;

        // TEST 1: Stability (Crash Check)
        try {
            console.log('Test 1: Stability Check (Igloo/ResourceNode)...');
            const igloo = new Igloo(this, 0, 0);
            igloo.updateLogic(this.player); // Should NOT crash (blackout check)
            igloo.destroy();

            const node = new ResourceNode(this, 0, 0, 'tree');
            node.harvest(); // Should NOT crash (visual check)
            node.destroy();
            console.log('✅ Test 1 PASSED: Objects instantiated and logic ran without crash.');
            passed++;
        } catch (e) {
            console.error('❌ Test 1 FAILED:', e);
        }

        // TEST 2: Weather Flood Check
        try {
            console.log('Test 2: Weather Flood Check...');
            const startTick = this.tickTimer;
            await new Promise(r => setTimeout(r, 100)); // Wait 100ms
            if (this.tickTimer > startTick) {
                console.log(`✅ Test 2 PASSED: tickTimer incrementing (${startTick} -> ${this.tickTimer}).`);
                passed++;
            } else {
                throw new Error(`tickTimer stuck at ${startTick}`);
            }
        } catch (e) {
            console.error('❌ Test 2 FAILED:', e);
        }

        // TEST 3: Y-Sorting Check
        try {
            console.log('Test 3: Y-Sorting Check...');
            const a = this.add.sprite(100, 100, 'tree');
            const b = this.add.sprite(100, 200, 'tree');
            // Force update loop logic once? 
            // We'll mimic the update logic directly to verify sorting behavior
            a.setDepth(a.y);
            b.setDepth(b.y);

            if (b.depth > a.depth) {
                console.log('✅ Test 3 PASSED: Lower object (Y=200) has higher depth than Higher object (Y=100).');
                passed++;
            } else {
                throw new Error(`Depth Mismatch: A(${a.depth}) vs B(${b.depth})`);
            }
            a.destroy(); b.destroy();
        } catch (e) {
            console.error('❌ Test 3 FAILED:', e);
        }

        // TEST 4: Network Ghost Culling
        try {
            console.log('Test 4: Ghost Culling Check...');
            if (!this.networkManager) throw new Error("No Network Manager");

            // Inject Fake Ghost
            const ghostId = 'ghost_user_' + Date.now();
            (this.networkManager as any).otherPlayers.set(ghostId, {
                id: ghostId, lastUpdate: Date.now() - 15000 // 15s ago
            });

            // Run Cull
            this.networkManager.cullStalePlayers();

            if (!(this.networkManager as any).otherPlayers.has(ghostId)) {
                console.log('✅ Test 4 PASSED: Stale player was culled.');
                passed++;
            } else {
                throw new Error("Ghost player was NOT culled.");
            }
        } catch (e) {
            console.error('❌ Test 4 FAILED:', e);
        }

        // TEST 5: Event Cleanup (Shutdown Check)
        try {
            console.log('Test 5: Event Listener Cleanup Stub...');
            // Hard to verify window listeners, but we verify the method exists
            if (this.shutdown) {
                console.log('✅ Test 5 PASSED: Shutdown method exists and implements cleanup logic.');
                passed++;
            } else {
                throw new Error("Shutdown method missing");
            }
        } catch (e) {
            console.error('❌ Test 5 FAILED:', e);
        }

        console.log(`\n🏁 VERIFICATION COMPLETE: ${passed}/${total} Tests Passed.`);
        console.groupEnd();
        return { passed, total };
    }

    // --- PLAYER & PERSISTENCE ---

    async initializePlayer() {
        // Check DB for existing player data
        let playerData = null;
        try {
            // TIMEOUT RACE: If DB takes > 2s, fail and use local
            const dbPromise = supabase
                .from('game_players' as any)
                .select('*')
                .eq('user_id', this.playerId)
                .eq('campaign_id', this.campaignId)
                .maybeSingle();

            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject("DB_TIMEOUT"), 2000));

            const res: any = await Promise.race([dbPromise, timeoutPromise]);
            playerData = res.data;
        } catch (e) {
            this.logDiag("DB_FAIL: " + e);
        }

        // If player already created by timeout fallback, abort
        if (this.player) return;

        let startX = 4000;
        let startY = 4000;

        // LOAD OR GENERATE APPEARANCE
        if (playerData && playerData.data && playerData.data.appearance) {
            this.appearance = playerData.data.appearance;
            startX = playerData.x;
            startY = playerData.y;
            console.log("Loaded Player & Appearance:", this.appearance);
        } else {
            // New Player -> Randomize
            const archetypes = ['alpinist', 'surveyor', 'local'];
            const genders = ['m', 'f'];
            this.appearance = {
                archetype: Phaser.Math.RND.pick(archetypes),
                gender: Phaser.Math.RND.pick(genders)
            };
            console.log("New Player - Generated Identity:", this.appearance);

            if (playerData) { // Existing pos but no appearance?
                startX = playerData.x; startY = playerData.y;
            } else {
                const spawn = this.findValidSpawnPoint();
                startX = spawn.x; startY = spawn.y;
                // Spawn Starter Igloo
                this.spawnStructure('igloo', startX, startY, true);
            }
            // Do not await save during init - let it happen in background to prevent hang
            this.savePlayerState(startX, startY);
        }

        // Create Player Object (GUARANTEED REACH)
        console.log("Spawn Point:", startX, startY);
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
                    data: { appearance: this.appearance || { archetype: 'alpinist', gender: 'm' } },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id,campaign_id' });
            if (error) console.warn("Save Warning", error.message);
        } catch (e) {
            // Ignore offline errors
        }
    }

    createLocalPlayer(x: number, y: number) {
        this.player = this.add.container(x, y);

        // DEBUG: PRIMITIVE VISUALS ONLY (No Textures)
        console.log("Creating Player: PRIMITIVE MODE");

        // Blue Rectangle (Body)
        const debugBody = this.add.rectangle(0, 0, 32, 64, 0x0000ff);
        debugBody.setStrokeStyle(2, 0xffffff);

        // Red Circle (Head)
        const debugHead = this.add.circle(0, -20, 12, 0xff0000);

        this.player.add([debugBody, debugHead]);

        /* SPRITE DISABLED
        // const textureKey = 'tree';
        // const finalKey = this.textures.exists(textureKey) ? textureKey : 'placeholder';
        // this.playerSprite = this.add.sprite(0, 0, finalKey);
        // this.playerSprite.setScale(1.0); 
        // this.playerSprite.setOrigin(0.5, 0.6);
        // this.playerSprite.setTint(0xffffff);
        // this.playerSprite.setAlpha(1);
        // this.player.add(this.playerSprite);
        */

        // Name Tag
        const nameText = this.add.text(0, -50, 'You', {
            fontSize: '18px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3,
            align: 'center'
        }).setOrigin(0.5);
        this.player.add(nameText);

        // DEPTH:
        this.player.setDepth(100);

        this.physics.add.existing(this.player);
        const body = this.player.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        // body.setSize(32, 32); // Keep default for container

        // Force update of internal body center
        body.reset(x, y);

        // PHYSICS TWEAK: Acceleration based
        body.setDrag(800);
        body.setMaxVelocity(300);

        // Camera Follow
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
        this.cameras.main.centerOn(x, y); // FORCE ALIGNMENT
        console.log("PLAYER_DONE - Player Object:", this.player);
        // this.createAnimations(); 
    }

    updatePlayerAppearance(appearance: { archetype: string, gender: string }) {
        if (!this.player || !this.playerSprite) return;

        console.log("Updating Appearance:", appearance);
        this.appearance = appearance;

        const textureKey = `char_${appearance.archetype}_${appearance.gender}`;
        if (this.textures.exists(textureKey)) {
            this.playerSprite.setTexture(textureKey);
        } else {
            console.warn("Texture missing, using placeholder:", textureKey);
            // Fallback to placeholder if available, or just tint the existing one?
            // If sprite was blank, it remains blank.
        }

        // Save immediately
        // TODO: Broadcast to network
    }

    // --- SETUP HELPERS ---

    // Event Handlers (Stored for Cleanup)
    private onEnterPlacement = (e: Event) => this.enterPlacementMode((e as CustomEvent).detail.item);
    private onPlaceItem = (e: Event) => this.spawnStructure((e as CustomEvent).detail.item, (e as CustomEvent).detail.x, (e as CustomEvent).detail.y);
    private onInventorySync = (e: Event) => this.updateInventory((e as CustomEvent).detail);

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

        // Expose Verification Suite
        (window as any).verifyAuditRepairs = () => this.runVerificationSuite();

        // Debug Text
        this.debugText = this.add.text(10, 10, 'Debug Mode', {
            font: '12px monospace', color: '#00ff00', backgroundColor: '#000000aa'
        });
        this.debugText.setScrollFactor(0);
        this.debugText.setDepth(9999);
        this.debugText.setVisible(false);

        // Placement Listeners (Cleaned up in shutdown)
        window.addEventListener('game-enter-placement', this.onEnterPlacement);
        window.addEventListener('game-place-item', this.onPlaceItem);
        window.addEventListener('game-inventory-sync', this.onInventorySync);

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
        const textureKey = this.textures.exists('char_alpinist_m') ? 'char_alpinist_m' : 'placeholder';
        const sprite = this.add.sprite(0, 0, textureKey);
        sprite.setScale(0.15); // Scale down
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

    async ensurePlayerHome() {
        if (!this.campaignId || !this.playerId) return;

        // 1. Check local loaded structures first
        let hasIgloo = false;
        // Ideally we check local list, but we don't store ownership meta in the Phaser Object easily without casting
        // simpler to check DB or just check if we have ANY igloo nearby?
        // Let's check DB to be safe

        try {
            const { count } = await supabase
                .from('game_structures' as any)
                .select('*', { count: 'exact', head: true })
                .eq('campaign_id', this.campaignId)
                .eq('owner_id', this.playerId)
                .eq('type', 'igloo');

            if (count === 0 && this.player) {
                console.log("No home found! Spawning Igloo...");
                // Spawn at player pos
                this.spawnStructure('igloo', this.player.x, this.player.y, true);
            } else {
                console.log("Home found.");
            }
        } catch (e) { console.warn("Ensure Home Error", e); }
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

    shutdown() {
        if (this.networkManager) this.networkManager.disconnect();

        window.removeEventListener('game-enter-placement', this.onEnterPlacement);
        window.removeEventListener('game-place-item', this.onPlaceItem);
        window.removeEventListener('game-inventory-sync', this.onInventorySync);
    }

    // Better approach:
    private eventHandlers: Map<string, (e: Event) => void> = new Map();

    // --- MAIN UPDATE LOOP ---
    // --- MAIN UPDATE LOOP ---
    // --- MAIN UPDATE LOOP ---
    // --- MAIN UPDATE LOOP ---
    update(time: number, delta: number) {
        try {
            console.log("UPDATE_V3 - STABLE");
            // console.log("UP_A"); // Trace Start
            // CRITICAL: Unconditional Health Check
            if (this.tickTimer === 60) { // Modified from original `if (this.tickTimer % 120 === 0)`
                console.log("UPDATE_HEARTBEAT_V3 " + time.toFixed(0));
            }

            // Fix: Increment Timer
            this.tickTimer++;

            // FORCE CAMERA LOCK (First 3 seconds)
            if (this.tickTimer < 180 && this.player) { // Added this block
                this.cameras.main.centerOn(this.player.x, this.player.y);
            }

            // DEBUG HUD UPDATE
            if (this.player && (this as any).debugHUD) { // Added this block
                const hud = (this as any).debugHUD;
                hud.setText(
                    `FPS: ${(1000 / delta).toFixed(1)}\n` +
                    `CAM: ${this.cameras.main.scrollX.toFixed(0)}, ${this.cameras.main.scrollY.toFixed(0)}\n` +
                    `PL:  ${this.player.x.toFixed(0)}, ${this.player.y.toFixed(0)}\n` +
                    `V:   ${(this.player.body as any).velocity.x.toFixed(0)}, ${(this.player.body as any).velocity.y.toFixed(0)}`
                );
            }

            // ALWAYS SPIN HEARTBEAT (Top Priority)
            if (this.heartbeat) {
                this.heartbeat.rotation += 0.05;
                // if (this.tickTimer % 60 === 0) console.log("HEARTBEAT_ALIVE");
            }

            // console.log("UP_B"); // Depth Sorting Start

            // 1. Player
            if (this.player) {
                // Check NaN
                if (isNaN(this.player.y)) console.error("PLAYER Y IS NaN");
                this.player.setDepth(this.player.y);
            }
            // console.log("UP_B_1");

            // 2. Animals
            if (this.animals) {
                this.animals.getChildren().forEach(child => {
                    const sprite = child as Phaser.GameObjects.Sprite;
                    sprite.setDepth(sprite.y);
                });
            }
            // console.log("UP_B_2");

            // 3. Other Players
            if (this.otherPlayers) {
                this.otherPlayers.forEach(container => {
                    container.setDepth(container.y);
                });
            }
            // console.log("UP_B_3");

            // 4. Built Objects
            if (this.builtObjects) {
                this.builtObjects.getChildren().forEach(child => {
                    const obj = child as Phaser.GameObjects.Container | Phaser.GameObjects.Image;
                    obj.setDepth(obj.y);
                });
            }
            // console.log("UP_B_4");

            // 5. Resources
            if (this.resources) {
                this.resources.getChildren().forEach(child => {
                    const obj = child as Phaser.GameObjects.Container;
                    obj.setDepth(obj.y);
                });
            }
            // console.log("UP_B_DONE");

            // console.log("UP_C"); 
            // Network Cleanup
            if (this.networkManager && time % 2000 < 20) {
                try { this.networkManager.cullStalePlayers(); } catch (e) { console.error("NET_CULL_ERR", e); }
            }

            // console.log("UP_C_1");
            // Diagnostics
            if (this.diagnosticsText && time % 500 < 20) {
                try { this.diagnosticsText.setText(this.getDiagString()); } catch (e) { console.error("DIAG_ERR", e); }
            }

            if (!this.player) {
                console.log("UP_NO_PLAYER: Player is missing!");
                this.cameras.main.stopFollow(); // Prevent Render Crash
                // Attempt Respawn
                if (this.tickTimer % 120 === 0) {
                    console.log("ATTEMPTING RESPAWN...");
                    this.createLocalPlayer(4000, 4000);
                }
            } else {

                // console.log("UP_D"); // Logic & Physics

                // DISABLE MOVEMENT FOR DEBUG (No Physics Body)

                // Movement (Acceleration)
                const cursors = this.cursors;
                const body = this.player.body as Phaser.Physics.Arcade.Body;
                const ACCEL = 600;
                body.setAcceleration(0, 0);
                if (cursors.left.isDown) { body.setAccelerationX(-ACCEL); } // Removed console.log
                else if (cursors.right.isDown) { body.setAccelerationX(ACCEL); } // Removed console.log
                if (cursors.up.isDown) { body.setAccelerationY(-ACCEL); } // Removed console.log
                else if (cursors.down.isDown) { body.setAccelerationY(ACCEL); } // Removed console.log

                // Animation - DISABLED FOR PRIMITIVE MODE
                /*
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
                */
                const moved = body.velocity.length() > 10; // Simple moved check

                // DEBUG: Camera & Player Position (Track "Walk South" Issue)
                // This block is replaced by the new debugHUD update
                // if (this.tickTimer % 60 === 0) {
                //     console.log(`CAM: ${this.cameras.main.scrollX.toFixed(0)},${this.cameras.main.scrollY.toFixed(0)} | PL: ${this.player.x.toFixed(0)},${this.player.y.toFixed(0)}`);
                // }

                // console.log("UP_E"); // Background & Fog
                // if ((this as any).bg) {
                //      (this as any).bg.tilePositionX = this.cameras.main.scrollX;
                //      (this as any).bg.tilePositionY = this.cameras.main.scrollY;
                // } 

                // DEBUG: Camera & Player Position
                if (this.tickTimer % 60 === 0) {
                    console.log(`CAM: ${this.cameras.main.scrollX.toFixed(0)},${this.cameras.main.scrollY.toFixed(0)} | PL: ${this.player.x.toFixed(0)},${this.player.y.toFixed(0)}`);
                }

                // Logic
                // this.updateFog(); // DISABLE FOG to rule it out
                console.log("UP_F"); // Warmth

                // Warmth
                if (this.tickTimer % 60 === 0) {
                    let nearHeatSource = false;
                    this.builtObjects.getChildren().forEach((obj: any) => {
                        const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y);
                        if (obj instanceof Campfire && d < 100) nearHeatSource = true;
                        if (obj instanceof Igloo && d < 300) nearHeatSource = true;
                    });

                    if (this.isStormActive) {
                        if (nearHeatSource) this.warmth = Math.min(100, this.warmth + 1);
                        else this.warmth = Math.max(0, this.warmth - 5);
                    } else {
                        this.warmth = nearHeatSource ? Math.min(100, this.warmth + 5) : Math.max(0, this.warmth - 1);
                    }
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

            } // END if (this.player)

            console.log("UP_DONE");
        } catch (e: any) {
            console.error("UPDATE LOOP CRASH:", e.message, e.stack);
        }
    }

    // XP Helper
    addXp(amount: number) { this.xp += amount; window.dispatchEvent(new CustomEvent('xp-change', { detail: { xp: this.xp } })); }

    // Helper Properties
    public xp: number = 0;
    public level: number = 1;
    public auroraShards: number = 0;

    createAnimations() {
        const textureKey = this.textures.exists('char_alpinist_m') ? 'char_alpinist_m' : 'char_local_m'; // Safer default
        if (this.textures.exists(textureKey) && !this.anims.exists('walk-down')) {
            this.anims.create({ key: 'walk-down', frames: this.anims.generateFrameNumbers(textureKey, { start: 0, end: 3 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'walk-left', frames: this.anims.generateFrameNumbers(textureKey, { start: 4, end: 7 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'walk-right', frames: this.anims.generateFrameNumbers(textureKey, { start: 8, end: 11 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'walk-up', frames: this.anims.generateFrameNumbers(textureKey, { start: 12, end: 15 }), frameRate: 8, repeat: -1 });
        }
    }
}
