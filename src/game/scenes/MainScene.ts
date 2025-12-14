import Phaser from 'phaser';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export class MainScene extends Phaser.Scene {
    private player!: Phaser.GameObjects.Container;
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private otherPlayers: Map<string, Phaser.GameObjects.Container> = new Map();
    private channel: RealtimeChannel | null = null;
    private playerId: string | null = null;
    private campaignId: string | null = null;
    private lastBroadcastTime = 0;
    private isConnected = false;

    constructor() {
        super({ key: 'MainScene' });
    }

    init(data: { playerId: string; campaignId: string; displayName: string }) {
        this.playerId = data.playerId;
        this.campaignId = data.campaignId;
    }

    preload() {
        // Load assets here (placeholders for now)
        // this.load.image('snow', '/assets/snow_tile.png');
    }

    create() {
        // 1. Create Map (Infinite snow for now)
        this.add.grid(0, 0, 2000, 2000, 32, 32, 0xffffff, 0, 0xdddddd, 1);
        this.cameras.main.setBackgroundColor('#e0f7fa'); // Light icy blue

        // 2. Create Local Player
        this.createLocalPlayer();

        // 3. Setup Controls
        if (this.input.keyboard) {
            this.cursors = this.input.keyboard.createCursorKeys();
        }

        // 4. Setup Camera
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(-1000, -1000, 2000, 2000);

        // 5. Connect to Supabase Realtime
        this.setupMultiplayer();
    }

    private createLocalPlayer() {
        const container = this.add.container(400, 300);

        // Avatar (Circle)
        const circle = this.add.circle(0, 0, 16, 0x2196f3); // Primary Blue
        container.add(circle);

        // Name Tag
        const text = this.add.text(0, -25, 'Me', {
            fontSize: '12px',
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5);
        container.add(text);

        this.player = container;

        // Physics
        this.physics.add.existing(container);
        const body = container.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
    }

    private createOtherPlayer(id: string, x: number, y: number, name: string) {
        if (this.otherPlayers.has(id)) return;

        const container = this.add.container(x, y);
        const circle = this.add.circle(0, 0, 16, 0xff5722); // Orange for others
        const text = this.add.text(0, -25, name, {
            fontSize: '12px',
            color: '#000000',
            align: 'center'
        }).setOrigin(0.5);

        container.add([circle, text]);
        this.add.existing(container);

        this.otherPlayers.set(id, container);
    }

    private setupMultiplayer() {
        if (!this.campaignId || !this.playerId) return;

        this.channel = supabase.channel(`game:${this.campaignId}`, {
            config: {
                broadcast: { self: false }
            }
        });

        this.channel
            .on('broadcast', { event: 'player_move' }, (payload) => {
                this.handlePlayerMove(payload.payload);
            })
            .on('presence', { event: 'sync' }, () => {
                // Handle presence sync if needed
                const state = this.channel?.presenceState();
                // console.log('Presence sync:', state);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    this.isConnected = true;
                    // Track presence
                    await this.channel?.track({
                        id: this.playerId,
                        x: this.player.x,
                        y: this.player.y
                    });
                }
            });
    }

    private handlePlayerMove(data: { id: string; x: number; y: number; name: string }) {
        if (data.id === this.playerId) return;

        let other = this.otherPlayers.get(data.id);
        if (!other) {
            this.createOtherPlayer(data.id, data.x, data.y, data.name);
            other = this.otherPlayers.get(data.id);
        }

        if (other) {
            // Interpolation could go here, for now just teleport
            this.tweens.add({
                targets: other,
                x: data.x,
                y: data.y,
                duration: 100, // Smooth out updates slightly
            });
        }
    }

    update(time: number, delta: number) {
        if (!this.cursors || !this.player) return;

        const body = this.player.body as Phaser.Physics.Arcade.Body;
        const speed = 200;

        body.setVelocity(0);

        let moved = false;

        if (this.cursors.left.isDown) {
            body.setVelocityX(-speed);
            moved = true;
        } else if (this.cursors.right.isDown) {
            body.setVelocityX(speed);
            moved = true;
        }

        if (this.cursors.up.isDown) {
            body.setVelocityY(-speed);
            moved = true;
        } else if (this.cursors.down.isDown) {
            body.setVelocityY(speed);
            moved = true;
        }

        // Broadcast movement (throttled to 100ms)
        if (moved && this.isConnected && time > this.lastBroadcastTime + 100) {
            this.channel?.send({
                type: 'broadcast',
                event: 'player_move',
                payload: {
                    id: this.playerId,
                    x: this.player.x,
                    y: this.player.y,
                    name: 'Player' // Optimally pass display name
                }
            });
            this.lastBroadcastTime = time;
        }
    }

    shutdown() {
        if (this.channel) {
            supabase.removeChannel(this.channel);
        }
    }
}
