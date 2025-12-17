import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import Phaser from 'phaser';

export interface PlayerState {
    id: string;
    x: number;
    y: number;
    name: string;
    anim?: string;
    flipX?: boolean;
    timestamp: number;
}

export class NetworkManager {
    private channel: RealtimeChannel | null = null;
    private scene: Phaser.Scene;
    private campaignId: string;
    private playerId: string;
    private playerName: string;

    // State Buffer: Map<UserId, Array<State>>
    // We store a history of states to interpolate between.
    private stateBuffer: Map<string, PlayerState[]> = new Map();

    // Event System
    private eventListeners: Map<string, Function[]> = new Map();

    // Throttling
    private lastBroadcastTime: number = 0;
    private readonly BROADCAST_RATE = 100; // 10Hz (100ms) - Server Tick Rate
    private readonly INTERPOLATION_DELAY = 100; // Render 100ms in the past

    // Connection Health
    private lastHeartbeat: number = Date.now();
    private reconnectInterval: any = null;

    constructor(scene: Phaser.Scene, campaignId: string, playerId: string, playerName: string) {
        this.scene = scene;
        this.campaignId = campaignId;
        this.playerId = playerId;
        this.playerName = playerName;
    }

    public connect() {
        if (this.channel) return;

        // Subscribe to presence in this campaign's channel
        this.channel = supabase.channel(`game_${this.campaignId}`, {
            config: {
                presence: { key: this.playerId },
                broadcast: { self: false } // Don't receive own messages
            }
        });

        this.channel
            .on('presence', { event: 'sync' }, () => this.handlePresenceSync())
            .on('presence', { event: 'join' }, ({ key, newPresences }) => { /* Optional: Log joins */ })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                this.emit('player_left', key);
                this.stateBuffer.delete(key);
            })
            .on('broadcast', { event: 'player_move' }, (payload) => this.handlePlayerMove(payload.payload))
            .on('broadcast', { event: 'structure_placed' }, (payload) => this.emit('structure_placed', payload.payload))
            .on('broadcast', { event: 'fundraising_update' }, (payload) => this.emit('fundraising_update', payload.payload))
            .on('broadcast', { event: 'quest_progress' }, (payload) => this.emit('quest_progress', payload.payload))
            .on('broadcast', { event: 'emote' }, (payload) => this.emit('emote', payload.payload))
            .on('broadcast', { event: 'chat' }, (payload) => this.emit('chat', payload.payload))
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Connected to Game Channel');
                    this.emit('connected');
                    await this.trackPresence(0, 0);
                    this.startHeartbeat();
                } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
                    this.scheduleReconnect();
                }
            });
    }

    // --- State Buffer & Interpolation ---

    private handlePlayerMove(data: any) {
        if (data.id === this.playerId) return;

        // 1. Initialize buffer if new
        if (!this.stateBuffer.has(data.id)) {
            this.stateBuffer.set(data.id, []);
            this.emit('player_joined', data); // Notify scene to spawn container
        }

        // 2. Add new state to buffer
        const buffer = this.stateBuffer.get(data.id)!;
        const newState: PlayerState = {
            id: data.id,
            x: data.x,
            y: data.y,
            name: data.name,
            anim: data.anim,
            flipX: data.flipX,
            timestamp: Date.now()
        };

        // Keep last 10 updates ~1 second of history
        buffer.push(newState);
        if (buffer.length > 20) buffer.shift();
    }

    public getInterpolatedState(userId: string): PlayerState | null {
        const buffer = this.stateBuffer.get(userId);
        if (!buffer || buffer.length === 0) return null;

        // If only 1 update, return it (snap)
        if (buffer.length === 1) return buffer[0];

        // Render Time = Now - Delay
        const renderTime = Date.now() - this.INTERPOLATION_DELAY;

        // Find the two states surrounding renderTime
        // [Older] ... [Target] ... [Newer]
        // We want: stateA.timestamp <= renderTime <= stateB.timestamp

        let stateA = buffer[0];
        let stateB = buffer[1];

        // Iterate backwards to find the newest pair that fits
        for (let i = buffer.length - 1; i >= 1; i--) {
            const t0 = buffer[i - 1].timestamp;
            const t1 = buffer[i].timestamp;
            if (renderTime >= t0 && renderTime <= t1) {
                stateA = buffer[i - 1];
                stateB = buffer[i];
                break;
            }
        }

        // If renderTime is newer than our newest state, extrapolation (or just clamp to newest)
        if (renderTime > buffer[buffer.length - 1].timestamp) {
            return buffer[buffer.length - 1];
        }
        // If renderTime is older than our oldest, clamp to oldest
        if (renderTime < buffer[0].timestamp) {
            return buffer[0];
        }

        // Interpolate
        const delta = stateB.timestamp - stateA.timestamp;
        const progress = (renderTime - stateA.timestamp) / delta;

        // Linear Lerp
        const x = stateA.x + (stateB.x - stateA.x) * progress;
        const y = stateA.y + (stateB.y - stateA.y) * progress;

        return {
            id: userId,
            x,
            y,
            name: stateB.name, // Use newest name/anim
            anim: stateB.anim, // Could interpolate anims? keep simple for now
            flipX: stateB.flipX,
            timestamp: renderTime
        };
    }

    // --- Resilience ---

    private startHeartbeat() {
        setInterval(() => {
            this.cullStalePlayers();
        }, 2000);
    }

    private scheduleReconnect() {
        console.warn("Connection lost. Reconnecting in 2s...");
        setTimeout(() => {
            console.log("Reconnecting...");
            this.disconnect();
            this.connect();
        }, 2000);
    }

    public cullStalePlayers() {
        const now = Date.now();
        this.stateBuffer.forEach((buffer, id) => {
            const lastUpdate = buffer[buffer.length - 1].timestamp;
            if (now - lastUpdate > 10000) { // 10s timeout
                this.emit('player_left', id);
                this.stateBuffer.delete(id);
            }
        });
    }

    // --- Outbound ---

    public updatePlayerState(x: number, y: number, anim: string, flipX: boolean) {
        if (!this.channel) return;
        const now = Date.now();
        if (now - this.lastBroadcastTime < this.BROADCAST_RATE) return;

        this.lastBroadcastTime = now;
        this.channel.send({
            type: 'broadcast',
            event: 'player_move',
            payload: { id: this.playerId, x, y, name: this.playerName, anim, flipX }
        });
    }

    public sendEmote(emoteId: string) {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'emote',
            payload: { id: this.playerId, emoteId }
        });
    }

    public sendChat(message: string) {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'chat',
            payload: { id: this.playerId, name: this.playerName, message }
        });
    }

    public sendStructurePlace(type: string, x: number, y: number) {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'structure_placed',
            payload: { type, x, y, owner_id: this.playerId }
        });
    }

    private async trackPresence(x: number, y: number) {
        if (this.channel) {
            await this.channel.track({
                user_id: this.playerId,
                x, y, name: this.playerName,
                online_at: new Date().toISOString()
            });
        }
    }

    private handlePresenceSync() {
        if (!this.channel) return;
        const state = this.channel.presenceState();
        Object.keys(state).forEach(userId => {
            if (userId === this.playerId) return;
            // For interpolation, existence is enough.
            // Move updates will populate buffer.
            // We can optionally inject an initial state if buffer is empty
            if (!this.stateBuffer.has(userId)) {
                const presence = state[userId][0] as any;
                this.handlePlayerMove({
                    id: userId,
                    x: presence.x,
                    y: presence.y,
                    name: presence.name || 'Unknown',
                    timestamp: Date.now()
                });
            }
        });
    }

    // --- Event System ---
    public on(event: string, callback: Function) {
        if (!this.eventListeners.has(event)) this.eventListeners.set(event, []);
        this.eventListeners.get(event)?.push(callback);
    }

    public emit(event: string, data?: any) {
        this.eventListeners.get(event)?.forEach(cb => cb(data));
    }

    public disconnect() {
        if (this.channel) {
            supabase.removeChannel(this.channel);
            this.channel = null;
        }
    }
}


