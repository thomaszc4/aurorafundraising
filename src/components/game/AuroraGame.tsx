import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainScene } from '../../game/scenes/MainScene';

interface AuroraGameProps {
    playerId: string;
    campaignId: string;
    displayName: string;
    className?: string; // Allow custom styling for the container
}

export const AuroraGame: React.FC<AuroraGameProps> = ({ playerId, campaignId, displayName, className }) => {
    const gameRef = useRef<HTMLDivElement>(null);
    const gameInstanceRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameRef.current || gameInstanceRef.current) return;

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            parent: gameRef.current,
            width: 800,
            height: 600,
            backgroundColor: '#e0f7fa',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 }, // Top down, no gravity
                    debug: false,
                },
            },
            scene: [MainScene],
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            }
        };

        const game = new Phaser.Game(config);
        gameInstanceRef.current = game;

        // Start the scene with data
        game.scene.start('MainScene', { playerId, campaignId, displayName });

        return () => {
            // Cleanup
            game.destroy(true);
            gameInstanceRef.current = null;
        };
    }, [playerId, campaignId, displayName]);

    return (
        <div className={className}>
            <div
                ref={gameRef}
                className="rounded-xl overflow-hidden shadow-2xl border-4 border-white/20"
                style={{ width: '100%', height: '600px' }}
            />
            <div className="mt-2 text-center text-sm text-muted-foreground">
                Use Arrow Keys to Move • Chat coming soon
            </div>
        </div>
    );
};
