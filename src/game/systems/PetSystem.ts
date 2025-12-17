import Phaser from 'phaser';

export type PetType = 'penguin' | 'polar_bear' | 'wolf' | 'seal';

export interface PetConfig {
    type: PetType;
    name: string;
    isUnlocked: boolean;
}

export class PetSystem {
    private scene: Phaser.Scene;
    private activePet: Phaser.GameObjects.Sprite | null = null;
    private activePetType: PetType | null = null;
    private target: Phaser.GameObjects.Container | null = null;

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public setTarget(target: Phaser.GameObjects.Container) {
        this.target = target;
    }

    public summonPet(type: PetType, name: string) {
        if (this.activePet) {
            this.activePet.destroy();
        }

        this.activePetType = type;

        // Spawn near player
        const x = this.target ? this.target.x + 50 : 4000;
        const y = this.target ? this.target.y + 50 : 4000;

        this.activePet = this.scene.add.sprite(x, y, type);
        this.activePet.setScale(type === 'polar_bear' ? 0.2 : 0.15);
        this.activePet.setDepth(90); // Just below player

        // Add nametag
        // (Simplified for now, just the sprite)

        console.log(`Summoned pet: ${name} (${type})`);
    }

    public update() {
        if (!this.activePet || !this.target) return;

        // Follow Logic
        const dist = Phaser.Math.Distance.Between(this.activePet.x, this.activePet.y, this.target.x, this.target.y);

        if (dist > 80) {
            const speed = 150; // Slower than player
            const angle = Phaser.Math.Angle.Between(this.activePet.x, this.activePet.y, this.target.x, this.target.y);

            this.activePet.x += Math.cos(angle) * (speed * 0.016); // Approx delta check (16ms)
            this.activePet.y += Math.sin(angle) * (speed * 0.016);

            // Flip
            this.activePet.setFlipX(Math.cos(angle) < 0);
        }
    }

    public dismissPet() {
        if (this.activePet) {
            this.activePet.destroy();
            this.activePet = null;
        }
    }
}
