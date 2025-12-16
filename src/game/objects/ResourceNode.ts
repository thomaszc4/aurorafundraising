import Phaser from 'phaser';

export default class ResourceNode extends Phaser.GameObjects.Container {
    public resourceType: 'tree' | 'ice' | 'water';
    public amount: number;
    private interactorPrompt: Phaser.GameObjects.Text;
    private visual: Phaser.GameObjects.Shape | Phaser.GameObjects.Sprite | Phaser.GameObjects.Rectangle; // Updated Type

    constructor(scene: Phaser.Scene, x: number, y: number, type: 'tree' | 'ice' | 'water' = 'tree') {
        super(scene, x, y);
        this.resourceType = type;
        this.amount = 3; // Total resources in this node

        // Visual Representation
        // Visual Representation
        if (type === 'tree') {
            const tree = scene.add.sprite(0, -32, 'tree'); // Offset up so pivot is at base
            tree.setScale(3.0);
            this.add(tree);
        } else if (type === 'water') {
            const water = scene.add.rectangle(0, 0, 64, 64, 0x0000ff, 0.5); // Blue square
            this.add(water);
            // Assuming this node will be added to a physics group that collides with player
        } else {
            // Ice Crystal
            const ice = scene.add.sprite(0, 0, 'ice_crystal');
            ice.setScale(0.08);
            this.add(ice);
        }

        // Prompt (Hidden by default)
        this.interactorPrompt = scene.add.text(0, -50, 'E', {
            fontSize: '14px',
            backgroundColor: '#000000',
            color: '#ffffff',
            padding: { x: 4, y: 4 },
        }).setOrigin(0.5).setVisible(false);
        this.add(this.interactorPrompt);

        // Physics
        scene.physics.add.existing(this);
        const body = this.body as Phaser.Physics.Arcade.Body;
        body.setImmovable(true);
        // Make the hit box smaller than the visual so you can walk "behind" it slightly or get close
        body.setSize(80, 80);
        body.setOffset(-40, -40);
    }

    showPrompt() {
        this.interactorPrompt.setVisible(true);
        // Bobbing animation for prompt
        this.scene.tweens.add({
            targets: this.interactorPrompt,
            y: -55,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }

    hidePrompt() {
        this.interactorPrompt.setVisible(false);
        this.scene.tweens.killTweensOf(this.interactorPrompt);
        this.interactorPrompt.y = -50;
    }

    harvest(): { type: string, amount: number } | null {
        if (this.amount <= 0) return null;

        this.amount--;

        // JUICE: Shake & Flash
        this.scene.cameras.main.shake(100, 0.005);
        this.scene.tweens.add({
            targets: this,
            scale: (this as any).scale * 1.2,
            yoyo: true,
            duration: 50
        });

        // JUICE: Particles
        const particleColor = this.resourceType === 'tree' ? 0x8d6e63 : 0x80deea;
        const particles = this.scene.add.particles(this.x, this.y, 'snowflake', {
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            lifespan: 500,
            gravityY: 200,
            quantity: 5,
            tint: particleColor
        });
        particles.setDepth(200);
        this.scene.time.delayedCall(500, () => particles.destroy());

        if (this.amount <= 0) {
            this.destroy(); // Remove node when depleted
        } else {
            // Shake visual only if not destroyed
            this.scene.tweens.add({
                targets: this.visual,
                x: this.visual ? (this.visual as any).x + 5 : 5,
                yoyo: true,
                duration: 50,
                repeat: 2
            });
        }

        return {
            type: this.resourceType === 'tree' ? 'wood' : 'ice_shard',
            amount: 1
        };
    }
}
