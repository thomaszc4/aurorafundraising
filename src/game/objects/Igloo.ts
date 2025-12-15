import Phaser from 'phaser';

export default class Igloo extends Phaser.GameObjects.Container {
    private roof: Phaser.GameObjects.Graphics;
    private floor: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // Floor (Interior)
        this.floor = scene.add.graphics();
        this.floor.fillStyle(0xeeeeee, 1);
        this.floor.fillCircle(0, 0, 50);
        // Floor should be below player. Player Z is usually 0 if added first?
        // We should set depths strictly in MainScene.
        // Let's assume MainScene handles depths, or we set relative depths if possible.
        // Container depth applies to whole container.
        // Items INSIDE container are relative.
        // BUT we need Player (outside container) to be BETWEEN Floor and Roof.
        // Thus, Floor and Roof cannot be in the same Container if Player is not.

        // PROBLEM:
        // If Igloo is a Container, its children are drawn together at Container's depth.
        // We can't sandwich the player in between children of a Container unless Player is a child.

        // SOLUTION:
        // Draw Floor and Roof as separate objects in the Scene, managing them here.
        // Igloo class manages them but 'this' (Container) might just hold the Logic/Hitbox.
        // OR: Add Player TO the Igloo Container when they enter? (Complex parenting).

        // Simpler Solution:
        // Set Floor Depth = 5.
        // Set Player Depth = 10 (MainScene).
        // Set Roof Depth = 20.
        // The Igloo Container itself? It might just group them logically.
        // Usage: `scene.add.existing(igloo)` adds the container visuals.
        // If I add graphics directly to scene:

        this.floor.setDepth(5);
        scene.add.existing(this.floor); // Add to scene, not 'this' container

        this.roof = scene.add.graphics();
        this.roof.fillStyle(0xffffff, 1);
        this.roof.lineStyle(2, 0xbbbbbb);
        this.roof.strokeCircle(0, 0, 50);
        this.roof.fillCircle(0, 0, 50);
        this.roof.setDepth(20);
        scene.add.existing(this.roof);

        // Doorway visual (Entrance)
        const door = scene.add.rectangle(0, 50, 20, 10, 0x555555);
        door.setDepth(5);
        scene.add.existing(door);

        // Make 'this' container position sync?
        // Actually, if we add them to Scene, they don't move with 'this'.
        // We should just use 'this' as the anchor.
        // When 'this' moves, we move them.
        // For static buildings, it's fine.

        // Positioning
        this.floor.setPosition(x, y);
        this.roof.setPosition(x, y);
        door.setPosition(x, y + 45);

        // Store references for cleanup
        this.setData('parts', [this.floor, this.roof, door]);
    }

    updateLogic(player: Phaser.GameObjects.Container) {
        if (!this.active) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Fading Logic
        if (dist < 50) {
            this.roof.alpha = Phaser.Math.Clamp(this.roof.alpha - 0.05, 0.1, 1);
        } else {
            this.roof.alpha = Phaser.Math.Clamp(this.roof.alpha + 0.05, 0.1, 1);
        }
    }

    destroy(fromScene?: boolean) {
        const parts = this.getData('parts');
        if (parts) parts.forEach((p: any) => p.destroy());
        super.destroy(fromScene);
    }
}
