import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class World {
    private scene: THREE.Scene;
    public terrain: THREE.Object3D | null = null;
    private loader: GLTFLoader;

    constructor(scene: THREE.Scene) {
        this.scene = scene;
        this.loader = new GLTFLoader();
    }

    public async load() {
        // Lights
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 1);
        sun.position.set(100, 200, 100);
        sun.castShadow = true;
        // Increase Shadow Range for larger map
        sun.shadow.mapSize.width = 4096; // Higher resolution
        sun.shadow.mapSize.height = 4096;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 5000;
        const d = 4000; // Large shadow range
        sun.shadow.camera.left = -d;
        sun.shadow.camera.right = d;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = -d;
        this.scene.add(sun);

        // Shadow Plane (Sea level)
        const planeGeo = new THREE.PlaneGeometry(20000, 20000);
        const planeMat = new THREE.ShadowMaterial({ opacity: 0.3 });
        const plane = new THREE.Mesh(planeGeo, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.1;
        plane.receiveShadow = true;
        this.scene.add(plane);

        // Load Terrain
        try {
            const gltf = await this.loader.loadAsync('/assets/3d/terrain/Low-poly landscape.glb');
            const model = gltf.scene;

            // Shadows
            model.traverse((child) => {
                if ((child as THREE.Mesh).isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Auto-Center & Scale Logic
            // 1. Reset
            model.position.set(0, 0, 0);
            model.scale.set(1, 1, 1);

            // 2. Measure
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // 3. Center
            model.position.x -= center.x;
            model.position.z -= center.z; // Center on X/Z plane
            model.position.y -= box.min.y; // Align bottom to 0
            model.position.y -= 2; // Slight sink

            // 4. Scale to 8000 (10x larger)
            const maxDim = Math.max(size.x, size.z);
            if (maxDim > 0) {
                const targetSize = 8000;
                const scale = targetSize / maxDim;
                model.scale.multiplyScalar(scale);
            }

            model.userData.isStatic = true;
            this.scene.add(model);
            this.terrain = model; // Expose for physics
            console.log("Terrain Loaded");

        } catch (e) {
            console.error("Failed to load terrain", e);
            // Fallback Green Plane
            const fallbackGeo = new THREE.PlaneGeometry(8000, 8000);
            const fallbackMat = new THREE.MeshStandardMaterial({ color: 'green' });
            const fallback = new THREE.Mesh(fallbackGeo, fallbackMat);
            fallback.rotation.x = -Math.PI / 2;
            this.scene.add(fallback);
            this.terrain = fallback;
        }
    }
}
