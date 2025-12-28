import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class Player {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private loader: GLTFLoader;
    public mesh: THREE.Group | null = null;
    private mixer: THREE.AnimationMixer | null = null;
    private actions: { [key: string]: THREE.AnimationAction } = {};
    private activeAction: THREE.AnimationAction | null = null;

    // Physics / Raycasting
    private terrain: THREE.Object3D | null = null;
    private raycaster = new THREE.Raycaster();
    private downVector = new THREE.Vector3(0, -1, 0);

    // Movement Constants
    private moveSpeed = 900; // 75% of 1200 (1.5x base)
    private acceleration = 4.0;
    private deceleration = 5.0;
    private rotateSpeed = 8.0;

    // Physics Constants
    private gravity = -2500; // Increased gravity for snappier feel with high jumps
    private jumpForce = 1200; // DOUBLED (was 600)

    // State
    public velocity = new THREE.Vector3(0, 0, 0);
    private verticalVelocity = 0;
    private input = { up: false, down: false, left: false, right: false, jump: false, camLeft: false, camRight: false, camUp: false, camDown: false };
    private yOffset = 0;
    private smoothedUp = new THREE.Vector3(0, 1, 0); // Store smoothed normal
    private cameraAngle = 0; // Current camera rotation angle
    private cameraDistance = 500;
    private cameraHeight = 400;

    constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
        this.scene = scene;
        this.camera = camera;
        this.loader = new GLTFLoader();

        this.setupInput();
    }

    public setTerrain(terrain: THREE.Object3D) {
        this.terrain = terrain;
    }

    private collidables: THREE.Object3D[] = [];
    public setCollidables(objects: THREE.Object3D[]) {
        this.collidables = objects;
    }

    private setupInput() {
        const onKey = (e: KeyboardEvent, down: boolean) => {
            switch (e.key.toLowerCase()) {
                case 'w': this.input.up = down; break;
                case 's': this.input.down = down; break;
                case 'a': this.input.left = down; break;
                case 'd': this.input.right = down; break;
                case ' ': this.input.jump = down; e.preventDefault(); break;
                // Camera Control
                case 'arrowleft': this.input.camLeft = down; e.preventDefault(); break;
                case 'arrowright': this.input.camRight = down; e.preventDefault(); break;
                case 'arrowup':
                    // console.log('ArrowUp Detected', down);
                    this.input.camUp = down;
                    e.preventDefault();
                    break;
                case 'arrowdown':
                    // console.log('ArrowDown Detected', down);
                    this.input.camDown = down;
                    e.preventDefault();
                    break;
            }
        };
        window.addEventListener('keydown', (e) => onKey(e, true));
        window.addEventListener('keyup', (e) => onKey(e, false));
    }

    public async load() {
        try {
            const gltf = await this.loader.loadAsync('/assets/3d/Penguin.glb');
            this.mesh = gltf.scene;

            // Shadows
            this.mesh.traverse((c) => {
                if ((c as THREE.Mesh).isMesh) {
                    c.castShadow = true;
                    c.receiveShadow = true;
                }
            });

            // Scale
            this.mesh.scale.set(1.5, 1.5, 1.5);

            // Compute Bounding Box for Offset
            const box = new THREE.Box3().setFromObject(this.mesh);
            const size = box.getSize(new THREE.Vector3());
            this.yOffset = size.y / 2;

            // Spawn Position
            this.mesh.position.set(1000, 200, -1000);

            this.scene.add(this.mesh);

            // Animations
            if (gltf.animations.length) {
                this.mixer = new THREE.AnimationMixer(this.mesh);
                gltf.animations.forEach(clip => {
                    const action = this.mixer!.clipAction(clip);
                    this.actions[clip.name] = action;
                });

                const walk = this.actions['Walk'] || this.actions[Object.keys(this.actions)[0]];
                if (walk) {
                    walk.play();
                    this.activeAction = walk;
                }
            }

        } catch (e) {
            console.error("Failed to load penguin", e);
        }
    }

    public update(delta: number) {
        if (!this.mesh) return;

        // 1. Determine Target Velocity from Input (Planar)
        // Rotate input vector by camera angle so "Up" is always "Away from Camera"
        const inputVector = new THREE.Vector3();
        if (this.input.up) inputVector.z = -1;
        if (this.input.down) inputVector.z = 1;
        if (this.input.left) inputVector.x = -1;
        if (this.input.right) inputVector.x = 1;

        if (inputVector.lengthSq() > 0) {
            inputVector.normalize().multiplyScalar(this.moveSpeed);
            // Rotate vector by camera angle
            inputVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.cameraAngle);
        }

        const targetV = inputVector;

        // 2. Smoothly Interpolate Velocity (Inertia)
        const accel = targetV.lengthSq() > 0 ? this.acceleration : this.deceleration;
        const factor = 1 - Math.exp(-accel * delta);
        this.velocity.lerp(targetV, factor);

        // Apply Planar Position with Separate Axis Collision (Sliding)

        // Apply Planar Position with Separate Axis Collision (Sliding)

        // Helper to get a tighter bounding box for obstacles
        const getObstacleBox = (obj: THREE.Object3D) => {
            const box = new THREE.Box3().setFromObject(obj);
            // Shrink obstacle box slightly (10%) to be forgiving
            const size = box.getSize(new THREE.Vector3());
            const shrinkX = size.x * 0.1;
            const shrinkZ = size.z * 0.1;
            box.min.x += shrinkX / 2;
            box.max.x -= shrinkX / 2;
            box.min.z += shrinkZ / 2;
            box.max.z -= shrinkZ / 2;
            return box;
        };

        // Helper to get Player "Core" Box (Feet/Center only)
        // This prevents "shoulder" snagging and allows smooth sliding
        const getPlayerCoreBox = (pos: THREE.Vector3) => {
            // Hardcode a reasonable player size based on the model (1.5 scale)
            // Model is approx 100 units wide? 
            // Let's define a fixed size box at the target position
            const width = 20; // Very thin core
            const depth = 20;
            const height = 100;

            const min = new THREE.Vector3(pos.x - width / 2, pos.y, pos.z - depth / 2);
            const max = new THREE.Vector3(pos.x + width / 2, pos.y + height, pos.z + depth / 2);
            return new THREE.Box3(min, max);
        };

        // 1. Try X movement
        const currentX = this.mesh.position.x;
        const nextX = currentX + this.velocity.x * delta;
        const testPosX = new THREE.Vector3(nextX, this.mesh.position.y, this.mesh.position.z);

        let collisionX = false;
        if (this.collidables.length > 0) {
            const playerBoxX = getPlayerCoreBox(testPosX);

            for (const obj of this.collidables) {
                const targetBox = getObstacleBox(obj);
                if (playerBoxX.intersectsBox(targetBox)) {
                    collisionX = true;
                    break;
                }
            }
        }

        if (!collisionX) {
            this.mesh.position.x = nextX;
        } else {
            this.velocity.x = 0;
            // Optional: push back slightly? No, sliding is enough if X stops but Z continues.
        }

        // 2. Try Z movement
        const currentZ = this.mesh.position.z;
        // Use the X we *actually* ended up at (current or next)
        const actualX = this.mesh.position.x;
        const nextZ = currentZ + this.velocity.z * delta;
        const testPosZ = new THREE.Vector3(actualX, this.mesh.position.y, nextZ);

        let collisionZ = false;
        if (this.collidables.length > 0) {
            const playerBoxZ = getPlayerCoreBox(testPosZ);

            for (const obj of this.collidables) {
                const targetBox = getObstacleBox(obj);
                if (playerBoxZ.intersectsBox(targetBox)) {
                    collisionZ = true;
                    break;
                }
            }
        }

        if (!collisionZ) {
            this.mesh.position.z = nextZ;
        } else {
            this.velocity.z = 0;
        }

        // 3. World Bounds
        const BOUNDS = 3950;
        this.mesh.position.x = Math.max(-BOUNDS, Math.min(BOUNDS, this.mesh.position.x));
        this.mesh.position.z = Math.max(-BOUNDS, Math.min(BOUNDS, this.mesh.position.z));

        // 4. Vertical Physics & Ground Smoothing
        let onGround = false;
        let groundHeight = -10000;
        let targetUp = new THREE.Vector3(0, 1, 0); // Default up

        // Check Ground Height
        if (this.terrain) {
            const origin = new THREE.Vector3(this.mesh.position.x, this.mesh.position.y + 100, this.mesh.position.z);
            this.raycaster.set(origin, this.downVector);
            const intersects = this.raycaster.intersectObject(this.terrain, true);

            if (intersects.length > 0) {
                const hit = intersects[0];
                groundHeight = hit.point.y + this.yOffset;
                if (hit.face) {
                    targetUp.copy(hit.face.normal).transformDirection(this.terrain.matrixWorld).normalize();
                }
            }
        }

        // Apply Smoothing to Up Vector
        this.smoothedUp.lerp(targetUp, delta * 5.0); // 5.0 = Smoothing speed

        // Apply Gravity
        this.verticalVelocity += this.gravity * delta;
        this.mesh.position.y += this.verticalVelocity * delta;

        // Ground Collision
        if (this.mesh.position.y <= groundHeight) {
            this.mesh.position.y = groundHeight;
            this.verticalVelocity = Math.max(0, this.verticalVelocity);
            onGround = true;
        }

        // Jump Input
        if (onGround && this.input.jump) {
            this.verticalVelocity = this.jumpForce;
            onGround = false;
        }

        // 5. Rotation Alignment
        const speed = this.velocity.length();
        if (speed > 10) {
            const lookTarget = this.mesh.position.clone().add(this.velocity);

            const dummy = this.mesh.clone();
            dummy.up.copy(this.smoothedUp); // Use SMOOTHED UP
            dummy.lookAt(lookTarget);
            const targetQuat = dummy.quaternion;

            const rotFactor = 1 - Math.exp(-this.rotateSpeed * delta);
            this.mesh.quaternion.slerp(targetQuat, rotFactor);
        }

        // 6. Animation Speed
        if (this.mixer && this.activeAction) {
            const targetScale = speed / (this.moveSpeed * 0.7); // Adjust normalization 
            this.activeAction.timeScale = THREE.MathUtils.lerp(this.activeAction.timeScale, Math.max(0.1, targetScale), delta * 5);
            if (speed < 5) this.activeAction.timeScale = 0;
            this.mixer.update(delta);
        }

        // Camera Rotation Input (Horizontal)
        if (this.input.camLeft) this.cameraAngle -= 2.0 * delta;
        if (this.input.camRight) this.cameraAngle += 2.0 * delta;

        // Camera Pitch Input (Vertical)
        // Adjust camera height based on input, clamped between 100 (low) and 1000 (high birds-eye)
        if (this.input.camUp) this.cameraHeight = Math.max(100, this.cameraHeight - 500 * delta); // Up arrow -> Lower camera -> Look Up
        if (this.input.camDown) this.cameraHeight = Math.min(1000, this.cameraHeight + 500 * delta); // Down arrow -> Higher camera -> Look Down

        // Camera Follow (Orbital)
        const offsetX = Math.sin(this.cameraAngle) * this.cameraDistance;
        const offsetZ = Math.cos(this.cameraAngle) * this.cameraDistance;

        const targetPos = this.mesh.position.clone().add(new THREE.Vector3(offsetX, this.cameraHeight, offsetZ));

        // Smooth Camera
        this.camera.position.lerp(targetPos, delta * 3);
        this.camera.lookAt(this.mesh.position.clone().add(new THREE.Vector3(0, 100, 0))); // Look slightly above feet (center of body)
    }
}
