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
    lastUpdate: number;
}

export class NetworkManager {
    private channel: RealtimeChannel | null = null;
    private scene: Phaser.Scene;
    private campaignId: string;
    private playerId: string;
    private playerName: string;

    // State
    public otherPlayers: Map<string, PlayerState> = new Map();
    private eventListeners: Map<string, Function[]> = new Map();

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
                presence: {
                    key: this.playerId,
                },
                broadcast: { self: false } // Don't receive own messages
            }
        });

        this.channel
            .on('presence', { event: 'sync' }, () => {
                this.handlePresenceSync();
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('Player joined', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('Player left', key);
                leftPresences.forEach((p: any) => {
                    this.emit('player_left', key); // key is userId
                    this.otherPlayers.delete(key);
                });
            })
            .on('broadcast', { event: 'player_move' }, (payload) => {
                this.handlePlayerMove(payload.payload);
            })
            .on('broadcast', { event: 'structure_placed' }, (payload) => {
                this.emit('structure_placed', payload.payload);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Connected to Game Channel');
                    this.emit('connected');
                    // Initial Presence Track
                    await this.trackPresence(0, 0);
                }
            });
    }

    private handlePresenceSync() {
        if (!this.channel) return;
        const state = this.channel.presenceState();

        // State is { userId: [ { payload } ] }
        Object.keys(state).forEach(userId => {
            if (userId === this.playerId) return;

            const preseceData = state[userId][0] as any;
            // Update or Add
            // We use presence mainly for "existence" and initial position. 
            // Real-time movement uses broadcast.
            if (!this.otherPlayers.has(userId)) {
                // New player discovered via presence
                this.handlePlayerMove({
                    id: userId,
                    x: preseceData.x || 0,
                    y: preseceData.y || 0,
                    name: preseceData.name || 'Unknown'
                });
            }
        });
    }

    private handlePlayerMove(data: { id: string, x: number, y: number, name: string, anim?: string, flipX?: boolean }) {
        if (data.id === this.playerId) return;

        // If we haven't seen them, add them
        if (!this.otherPlayers.has(data.id)) {
            this.emit('player_joined', data);
        }

        // Update state
        this.otherPlayers.set(data.id, {
            ...data,
            lastUpdate: Date.now()
        });
    }

    public async trackPresence(x: number, y: number) {
        if (this.channel) {
            await this.channel.track({
                user_id: this.playerId,
                x,
                y,
                name: this.playerName,
                online_at: new Date().toISOString()
            });
        }
    }

    public updatePlayerState(x: number, y: number, anim: string, flipX: boolean) {
        if (!this.channel) return;

        // Broadcast for high-frequency updates (movement)
        this.channel.send({
            type: 'broadcast',
            event: 'player_move',
            payload: {
                id: this.playerId,
                x,
                y,
                name: this.playerName,
                anim,
                flipX
            }
        });

        // Throttle Presence updates (expensive, saving server load)
        // Only update presence occasionally or on stop? 
        // For now, relies on broadcast for movement.
        // We might want to update presence periodically so late joiners get accurate pos.
    }

    public sendStructurePlace(type: string, x: number, y: number) {
        if (!this.channel) return;
        this.channel.send({
            type: 'broadcast',
            event: 'structure_placed',
            payload: { type, x, y, owner_id: this.playerId }
        });
    }

    // --- Event System ---
    public on(event: string, callback: Function) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event)?.push(callback);
    }

    public emit(event: string, data?: any) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            listeners.forEach(cb => cb(data));
        }
    }

    public disconnect() {
        if (this.channel) {
            supabase.removeChannel(this.channel);
            this.channel = null;
        }
    }
}
