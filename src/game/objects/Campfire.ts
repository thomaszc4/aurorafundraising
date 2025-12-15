import Phaser from 'phaser';

export default class Campfire extends Phaser.GameObjects.Container {
    private visual: Phaser.GameObjects.Shape;
    private light: Phaser.GameObjects.Arc;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // Logs
        const log1 = scene.add.rectangle(0, 5, 20, 6, 0x5d4037).setRotation(0.2);
        const log2 = scene.add.rectangle(0, 5, 20, 6, 0x5d4037).setRotation(-0.2);

        // Fire (Animated simple shape)
        this.visual = scene.add.triangle(0, -5, 0, -15, 8, 5, -8, 5, 0xff5722);

        // Warmth Radius visual (subtle glow)
        this.light = scene.add.circle(0, 0, 80, 0xffa726, 0.2);

        this.add([log1, log2, this.light, this.visual]);

        // Physics
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
        body.setSize(20, 20);
        body.setOffset(-10, -10);

        // Animate Fire
        scene.tweens.add({
            targets: this.visual,
            scaleY: 1.2,
            scaleX: 1.1,
            y: -7,
            duration: 100,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Animate Light
        scene.tweens.add({
            targets: this.light,
            alpha: 0.3,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
}
