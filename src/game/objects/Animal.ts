import Phaser from 'phaser';

export default class Animal extends Phaser.Physics.Arcade.Sprite {
    private moveEvent: Phaser.Time.TimerEvent | null = null;
    private animalType: string;
    private speed: number = 50;

    constructor(scene: Phaser.Scene, x: number, y: number, texture: string) {
        super(scene, x, y, texture);
        this.animalType = texture;

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(true);
        this.setBounce(0.2);
        this.setDrag(100);

        // Scale & Speed
        if (this.animalType === 'polar_bear') {
            this.setScale(0.08); // Reduced from 0.12
            this.speed = 90;
        } else if (this.animalType === 'wolf') {
            this.setScale(0.07); // Reduced from 0.2 -> ~1/3
            this.speed = 100;
        } else { // Penguin, Seal
            this.setScale(0.05); // Reduced from 0.15 -> 1/3
            this.speed = 40;
        }

        // Random movement loop for idle
        this.startWander();
    }

    public tamed: boolean = false;

    private startWander() {
        if (this.tamed) return; // Follow logic handled in MainScene or elsewhere

        if (this.moveEvent) this.moveEvent.destroy();
        this.moveEvent = this.scene.time.addEvent({
            delay: Phaser.Math.Between(2000, 5000),
            callback: this.wander,
            callbackScope: this,
            loop: true
        });
    }

    private wander() {
        if (!this.active) return;
        // Idle wander
        const moveX = Phaser.Math.Between(-this.speed, this.speed) * 0.5;
        const moveY = Phaser.Math.Between(-this.speed, this.speed) * 0.5;
        this.setVelocity(moveX, moveY);
        this.checkFlip(moveX);
    }

    private checkFlip(vx: number) {
        if (vx < 0) this.setFlipX(true);
        else if (vx > 0) this.setFlipX(false);
    }

    public updateLogic(player: Phaser.GameObjects.Container | Phaser.GameObjects.Sprite) {
        if (!this.active || !player) return;

        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        if (this.animalType === 'wolf' || this.animalType === 'polar_bear') {
            // Aggressive: Chase
            if (dist < 250) {
                if (this.moveEvent) { this.moveEvent.destroy(); this.moveEvent = null; } // Stop wandering
                this.scene.physics.moveToObject(this, player, this.speed * 1.5);
                this.checkFlip(this.body!.velocity.x);
            } else if (!this.moveEvent) {
                this.startWander(); // Go back to wandering
            }
        } else if (this.animalType === 'seal' || this.animalType === 'penguin') {
            // Passive: Flee
            if (dist < 150) {
                if (this.moveEvent) { this.moveEvent.destroy(); this.moveEvent = null; }
                // Move away
                const angle = Phaser.Math.Angle.Between(player.x, player.y, this.x, this.y);
                const vec = this.scene.physics.velocityFromRotation(angle, this.speed * 1.5);
                this.setVelocity(vec.x, vec.y);
                this.checkFlip(vec.x);
            } else if (!this.moveEvent) {
                this.startWander();
            }
        }
    }

    public interact() {
        this.setVelocity(0, 0);
        const msg = this.scene.add.text(this.x, this.y - 40, this.getSound(), {
            fontSize: '16px', color: '#ffffff', stroke: '#000000', strokeThickness: 3
        }).setOrigin(0.5);

        this.scene.tweens.add({
            targets: msg, y: this.y - 80, alpha: 0, duration: 1500, onComplete: () => msg.destroy()
        });
    }

    private getSound() {
        if (this.animalType === 'wolf') return "Awooo!";
        if (this.animalType === 'polar_bear') return "ROAR!";
        if (this.animalType === 'seal') return "Arf Arf!";
        return "Noot Noot!";
    }

    destroy(fromScene?: boolean) {
        if (this.moveEvent) this.moveEvent.destroy();
        super.destroy(fromScene);
    }
}
