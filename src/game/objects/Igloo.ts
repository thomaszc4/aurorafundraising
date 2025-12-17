
import Phaser from 'phaser';

const DEPTH = {
    FLOOR: 10, // Above Snow(5) and Ripples(5)
    WALLS: 110,
    BLACKOUT: 200,
    ROOF: 300
};

export default class Igloo extends Phaser.GameObjects.Container {
    private roof!: Phaser.GameObjects.Graphics;
    private floor!: Phaser.GameObjects.Graphics;
    private blackout!: Phaser.GameObjects.Graphics; // Hides outside world when inside

    public wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
    public radius: number = 350; // 10x player size (approx)

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y);

        // 1. Setup Layering
        // Depths managed explicitly in scene.add

        // 2. Create Physics Group for Walls
        this.wallsGroup = scene.physics.add.staticGroup();

        // 3. Generate Geometry
        this.createFloor(scene);
        this.createWalls(scene);
        // this.createBlackout(scene); // The "Blindness" for outside - DISABLED FOR DEBUG
        this.createRoof(scene);

        // 4. Initial State
        this.roof.setAlpha(1);
        // this.blackout.setAlpha(0);

        // Store for cleanup
        this.setData('parts', [this.floor, this.roof, this.wallsGroup]);
    }

    private createFloor(scene: Phaser.Scene) {
        this.floor = scene.add.graphics();
        this.floor.fillStyle(0xddeeff, 1); // Packed snow/ice floor
        this.floor.fillCircle(0, 0, this.radius);
        this.floor.setDepth(DEPTH.FLOOR); // Below Player (100)
        this.floor.setPosition(this.x, this.y);
    }

    private createWalls(scene: Phaser.Scene) {
        // Generate walls with a random gap
        const wallThickness = 20;
        const segmentCount = 36; // Increased segments for smoother circular collision
        const anglePerSeg = 360 / segmentCount;

        // Random Door Index
        const doorIndex = Phaser.Math.Between(0, segmentCount - 1);

        for (let i = 0; i < segmentCount; i++) {
            if (i === doorIndex) continue; // Skip for door

            const angleRad = Phaser.Math.DegToRad(i * anglePerSeg);
            const dist = this.radius; // Place at radius

            // Calc center pos of wall segment
            const wx = this.x + Math.cos(angleRad) * dist;
            const wy = this.y + Math.sin(angleRad) * dist;

            // Create Visual Wall
            // We use a rectangle rotated to face center
            // Width = Circumference / Count roughly.
            // C = 2 * pi * 350 ~ 2200. / 12 ~ 180.
            // C = 2 * pi * 350 ~ 2200. / 36 ~ 60.
            const w = 65;
            const h = wallThickness;

            const wall = scene.add.rectangle(wx, wy, h, w, 0xaaaaee); // Rotated 90
            wall.setRotation(angleRad);
            wall.setDepth(DEPTH.WALLS);

            // Physics Body
            this.wallsGroup.add(wall);
            wall.setStrokeStyle(2, 0x8888cc);

            // Enable Body
            scene.physics.add.existing(wall, true);
            const body = wall.body as Phaser.Physics.Arcade.StaticBody;

            // Use circular collider to allow smooth movement through the door
            body.setCircle(32);
            body.setOffset(h / 2 - 32, w / 2 - 32);

        }
    }

    private createBlackout(scene: Phaser.Scene) {
        // Disabled for now as it was causing issues.
        // Future implementation should use a proper Vision Mask.
    }

    private createRoof(scene: Phaser.Scene) {
        this.roof = scene.add.graphics();
        this.roof.fillStyle(0xffffff, 1);
        this.roof.fillCircle(0, 0, this.radius + 20); // Slightly larger than walls
        // Texture/Shading
        this.roof.fillStyle(0xeeeeee, 1);
        this.roof.fillCircle(0, 0, this.radius - 50); // Dome curve effect

        this.roof.fillStyle(0xeeeeee, 1);
        this.roof.setDepth(DEPTH.ROOF); // Top layer
        this.roof.setPosition(this.x, this.y);
    }

    // Called by MainScene update loop
    update(time: number, delta: number) {
        // We'll need access to player from scene but loose coupling is hard. 
        // Pass player in? Or just use scene.player if public?
        // Ideally MainScene calls updateLogic(player).
    }

    updateLogic(player: Phaser.GameObjects.Container) {
        if (!this.active || !this.roof) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Transition Range
        const isInside = dist < this.radius - 20;

        if (isInside) {
            // Fade out Roof
            if (this.roof.alpha > 0) this.roof.setAlpha(Math.max(0, this.roof.alpha - 0.1));
            // Fade IN Blackout (Hide outside world)
            if (this.blackout && this.blackout.alpha < 1) this.blackout.setAlpha(Math.min(1, this.blackout.alpha + 0.1));
        } else {
            // Fade IN Roof
            if (this.roof.alpha < 1) this.roof.setAlpha(Math.min(1, this.roof.alpha + 0.1));
            // Fade OUT Blackout (Show world)
            if (this.blackout && this.blackout.alpha > 0) this.blackout.setAlpha(Math.max(0, this.blackout.alpha - 0.1));
        }
    }

    destroy(fromScene?: boolean) {
        const parts = this.getData('parts');
        if (parts) {
            this.floor.destroy();
            this.roof.destroy();
            if (this.blackout) this.blackout.destroy();
            this.wallsGroup.clear(true, true);
        }
        super.destroy(fromScene);
    }
}
