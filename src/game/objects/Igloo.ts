
import Phaser from 'phaser';

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
        this.createBlackout(scene); // The "Blindness" for outside
        this.createRoof(scene);

        // 4. Initial State
        this.roof.setAlpha(1);
        this.blackout.setAlpha(0);

        // Store for cleanup
        this.setData('parts', [this.floor, this.roof, this.blackout, this.wallsGroup]);
    }

    private createFloor(scene: Phaser.Scene) {
        this.floor = scene.add.graphics();
        this.floor.fillStyle(0xddeeff, 1); // Packed snow/ice floor
        this.floor.fillCircle(0, 0, this.radius);
        this.floor.setDepth(5); // Below Player (100)
        this.floor.setPosition(this.x, this.y);
    }

    private createWalls(scene: Phaser.Scene) {
        // Generate walls with a random gap
        const wallThickness = 20;
        const segmentCount = 12; // 12 segments for a rough circle
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
            const w = 185;
            const h = wallThickness;

            const wall = scene.add.rectangle(wx, wy, h, w, 0xaaaaee); // Rotated 90
            wall.setRotation(angleRad);
            wall.setDepth(110); // slightly above player to show "depth"? Or blocking view? 
            // Actually, walls usually block player sprite if player is "behind" them?
            // Top-down simplified: Walls can be below roof (300) but above floor (5).
            // Player is 100.
            // Let's make walls 110 so they overlay player feet if player walks into them.

            // Physics Body
            this.wallsGroup.add(wall);

            wall.setStrokeStyle(2, 0x8888cc);

            // Enable Body
            scene.physics.add.existing(wall, true);
        }
    }

    private createBlackout(scene: Phaser.Scene) {
        // A massive black rectangle covering the world
        // Masked to SHOW the Igloo Interior (Inverted Mask)
        // Oops, we want to HIDE the world.
        // So we draw a black rectangle everywhere EXCEPT a hole in the middle.

        this.blackout = scene.add.graphics();
        this.blackout.fillStyle(0x000000, 1);
        this.blackout.fillRect(-4000, -4000, 8000, 8000); // Huge rect relative to center

        // Punch a hole
        // Graphics masking is tricky. Easiest is to use an inverted GeometryMask on the Scene?
        // Or simpler: Draw a "Hollow Rectangle" using path logic?
        // Phaser Graphics supports holes in fills if using beginPath/arc/rect logic correctly.

        // Let's use Geometry Mask approach on the GRAPHICS itself? No.
        // Let's try "Big Rect with Hole" path.
        this.blackout.clear();
        this.blackout.fillStyle(0x000000, 1);

        // Draw the outer rectangle (huge)
        this.blackout.beginPath();
        // Clockwise outer
        this.blackout.moveTo(-4000, -4000);
        this.blackout.lineTo(4000, -4000);
        this.blackout.lineTo(4000, 4000);
        this.blackout.lineTo(-4000, 4000);
        this.blackout.closePath();

        // Counter-clockwise inner (Hole)
        this.blackout.arc(0, 0, this.radius + 5, 0, Math.PI * 2, true);
        this.blackout.closePath();

        this.blackout.fillPath();

        this.blackout.setDepth(200); // Above Player/Walls, Below Roof
        this.blackout.setPosition(this.x, this.y);
    }

    private createRoof(scene: Phaser.Scene) {
        this.roof = scene.add.graphics();
        this.roof.fillStyle(0xffffff, 1);
        this.roof.fillCircle(0, 0, this.radius + 20); // Slightly larger than walls
        // Texture/Shading
        this.roof.fillStyle(0xeeeeee, 1);
        this.roof.fillCircle(0, 0, this.radius - 50); // Dome curve effect

        this.roof.setDepth(300); // Top layer
        this.roof.setPosition(this.x, this.y);
    }

    updateLogic(player: Phaser.GameObjects.Container) {
        if (!this.active) return;
        const dist = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);

        // Transition Range
        const isInside = dist < this.radius - 20;

        if (isInside) {
            // Fade out Roof
            if (this.roof.alpha > 0) this.roof.setAlpha(this.roof.alpha - 0.1);
            // Fade IN Blackout (Hide outside world)
            if (this.blackout.alpha < 1) this.blackout.setAlpha(this.blackout.alpha + 0.1);
        } else {
            // Fade IN Roof
            if (this.roof.alpha < 1) this.roof.setAlpha(this.roof.alpha + 0.1);
            // Fade OUT Blackout (Show world)
            if (this.blackout.alpha > 0) this.blackout.setAlpha(this.blackout.alpha - 0.1);
        }
    }

    destroy(fromScene?: boolean) {
        const parts = this.getData('parts');
        if (parts) {
            this.floor.destroy();
            this.roof.destroy();
            this.blackout.destroy();
            this.wallsGroup.clear(true, true);
        }
        super.destroy(fromScene);
    }
}
