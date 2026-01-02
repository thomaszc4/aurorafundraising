import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface PlayerState {
    id: string;
    x: number;
    z: number;
    rotation: number;
    anim: string; // 'idle' | 'walk'
    lastUpdate: number;
}

export class NetworkManager {
    private channel: RealtimeChannel;
    private packetRate = 100; // ms between updates
    private lastPacketTime = 0;

    public remotePlayers: Map<string, PlayerState> = new Map();
    public onPlayerJoin: ((id: string) => void) | null = null;
    public onPlayerLeave: ((id: string) => void) | null = null;

    constructor(private playerId: string) {
        this.channel = supabase.channel('game_room_global');

        this.channel
            .on('presence', { event: 'sync' }, () => {
                const state = this.channel.presenceState<PlayerState>();

                // Diffing to detect joins/leaves could go here
                // For now, simpler: just map over state
                const currentIds = new Set<string>();

                for (const key in state) {
                    const presence = state[key][0]; // Take most recent
                    if (presence.id === this.playerId) continue; // Skip self

                    if (!this.remotePlayers.has(presence.id)) {
                        console.log("Player Joined:", presence.id);
                        if (this.onPlayerJoin) this.onPlayerJoin(presence.id);
                    }
                    this.remotePlayers.set(presence.id, presence);
                    currentIds.add(presence.id);
                }

                // Detect Leaves
                for (const [id] of this.remotePlayers) {
                    if (!currentIds.has(id)) {
                        console.log("Player Left:", id);
                        this.remotePlayers.delete(id);
                        if (this.onPlayerLeave) this.onPlayerLeave(id);
                    }
                }
            })
            .subscribe(status => {
                if (status === 'SUBSCRIBED') {
                    console.log("Generously Connected to Multiplayer Channel");
                }
            });
    }

    public update(x: number, z: number, rotation: number, isMoving: boolean) {
        const now = Date.now();
        if (now - this.lastPacketTime > this.packetRate) {
            this.lastPacketTime = now;

            const payload: PlayerState = {
                id: this.playerId,
                x,
                z,
                rotation,
                anim: isMoving ? 'walk' : 'idle',
                lastUpdate: now
            };

            this.channel.track(payload);
        }
    }

    public cleanup() {
        this.channel.unsubscribe();
    }
}
