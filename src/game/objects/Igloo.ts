
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
        // this.createBlackout(scene); // The "Blindness" for outside - DISABLED FOR DEBUG
        this.createRoof(scene);

        // 4. Initial State
        this.roof.setAlpha(1);
        // this.blackout.setAlpha(0);

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
            wall.setDepth(110);

            // Physics Body
            this.wallsGroup.add(wall);
            wall.setStrokeStyle(2, 0x8888cc);

            // Enable Body
            // FIX: Arcade Physics doesn't support rotated bodies. Long rects become big squares blocking the door.
            // Solution: Use a small circle for physics at the center of the wall segment.
            // The segment visual is long, but the collision will be a "pillar" at the center.
            // Better: Use MULTIPLE small invisible circles if we needed a solid wall, but for a ring,
            // let's try setting the body size to be smaller than the visual length?
            // Actually, setting it to a Circle is best.
            scene.physics.add.existing(wall, true);
            const body = wall.body as Phaser.Physics.Arcade.StaticBody;

            // Make the body a circle centered on the wall segment
            // This prevents "corners" from sticking out and blocking the door gap.
            // Radius ~ half width? w is length ~185. h is thickness ~20.
            // We want it to be thin?
            // Arcade physics circles are always centered (unless offset). 
            // Let's just make the physics body a small blocking circle at the center of the segment.
            // This might leave "gaps" you can walk through if the segments are far apart.
            // But our segments are close.
            // Let's make the body a circle of radius = wall length / 4?

            // Alternative: The user wants "hit boxes match shape".
            // Since we can't rotate rects, we should probably stick to circles.
            body.setCircle(30); // 30 radius = 60 diam.
            // This will make "pillars" of collision.
            // We might need MORE segments if we want a solid wall.
            // But let's check current count: 12 segments.
            // Radius 350. Circumference ~2200. Seg length = 185.
            // 60 diam circle leaves 125 gap? That's too permeable.

            // Let's just make the body a square of size 50,50?
            // Or Keep it default but `setSize` to be smaller?

            // Problem: If we shrink the body, players walk through walls.
            // If we don't, they block the door.

            // BEST FIX: Don't use the VISUAL wall as the physics body.
            // Create invisible physics circles along the path.
            // But strictly answering "hit boxes match shape" in Arcade is hard.
            // Let's simple try sizing the body to be a square at the center that doesn't rotate?
            body.setSize(40, 40);
            body.setOffset((h - 40) / 2, (w - 40) / 2); // Centering is tricky with rotation visual offset.
            // Actually, for a Rectangle, setSize works on unrotated dimensions.
            // Visual: h=20, w=185.
            // If we set size 40,40, it's a small box.

            // Let's try `setCircle(wallLength/2)`? No that's huge.
            // Let's Try: circular body radius 32.
            body.setCircle(32);
            body.setOffset(h / 2 - 32, w / 2 - 32);
            // 12 segments * 64px coverage = 768px covered.
            // Circumference 2200.
            // This will have holes.

            // Fine, let's bump segment count to 24 (double it) and use smaller circles.
            // This creates a nice "beaded necklace" collider which IS circular.

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
            // if (this.blackout.alpha < 1) this.blackout.setAlpha(this.blackout.alpha + 0.1);
        } else {
            // Fade IN Roof
            if (this.roof.alpha < 1) this.roof.setAlpha(this.roof.alpha + 0.1);
            // Fade OUT Blackout (Show world)
            // if (this.blackout.alpha > 0) this.blackout.setAlpha(this.blackout.alpha - 0.1);
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
