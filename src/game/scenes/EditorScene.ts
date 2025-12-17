import Phaser from 'phaser';
import { useEditorStore } from '@/stores/useEditorStore';

export class EditorScene extends Phaser.Scene {
    // Core
    private grid!: Phaser.GameObjects.Grid;
    private marker!: Phaser.GameObjects.Graphics;
    private unsubscribe!: () => void;

    // Tilemap
    private tilemap!: Phaser.Tilemaps.Tilemap;
    private tileLayer!: Phaser.Tilemaps.TilemapLayer;

    // Logic Nodes
    private logicMap: Map<string, Phaser.GameObjects.Graphics> = new Map();
    private logicTextMap: Map<string, Phaser.GameObjects.Text> = new Map();
    private isCreatingLogic = false;
    private logicStartPoint: Phaser.Math.Vector2 | null = null;
    private ghostLogicBox!: Phaser.GameObjects.Graphics;

    // Entities
    private entityMap: Map<string, Phaser.GameObjects.Image> = new Map();
    private selectionBox!: Phaser.GameObjects.Graphics;

    // State Mirrors
    private activeTool = useEditorStore.getState().activeTool;
    private activeLayer = useEditorStore.getState().activeLayer;
    private activeTile = useEditorStore.getState().activeTile;
    private gridSize = useEditorStore.getState().gridSize;
    private isGridEnabled = useEditorStore.getState().isGridEnabled;
    private entities = useEditorStore.getState().mapData.entities;
    private logicNodes = useEditorStore.getState().mapData.logic;
    private selectedEntityIds = useEditorStore.getState().selectedEntityIds;

    // Interaction State
    private isDragging = false;
    private dragTargetId: string | null = null;
    private isPainting = false;

    // View
    private controls!: Phaser.Cameras.Controls.SmoothedKeyControl;

    constructor() {
        super({ key: 'EditorScene' });
    }

    preload() {
        // Load Editor-specific assets
        const v = '?v=editor_v4';

        // TILESHEET
        if (!this.textures.exists('tilesheet')) {
            const gfx = this.make.graphics({ x: 0, y: 0 });
            // 1. Snow
            gfx.fillStyle(0xffffff); gfx.fillRect(0, 0, 64, 64);
            // 2. Ice
            gfx.fillStyle(0xa5f2f3); gfx.fillRect(64, 0, 64, 64);
            // 3. Water
            gfx.fillStyle(0x004488); gfx.fillRect(128, 0, 64, 64);
            // 4. Deep Water
            gfx.fillStyle(0x002244); gfx.fillRect(192, 0, 64, 64);
            gfx.generateTexture('tilesheet', 256, 64);
        }

        // Object Icons
        this.load.image('tree', '/assets/game/tree_mock.png' + v);
        this.load.image('rock', 'https://labs.phaser.io/assets/sprites/gem.png');
        this.load.image('plaque', 'https://labs.phaser.io/assets/sprites/scroll.png'); // Placeholder for Donor Plaque
    }

    create() {
        console.log("EDITOR SCENE STARTED");
        this.cameras.main.setBackgroundColor('#1a1a1a');

        // 1. Tilemap (Base Layer)
        this.createTilemap();

        // 2. Grid & World
        this.createGrid();

        // 3. Input
        this.setupInput();

        // 4. Camera Controls
        this.setupCamera();

        // 5. Marker & Selection
        this.marker = this.add.graphics();
        this.selectionBox = this.add.graphics();
        this.ghostLogicBox = this.add.graphics(); // New: Ghost box for logic creation
        this.updateMarker();

        // 6. Store Subscription
        this.unsubscribe = useEditorStore.subscribe((state) => {
            if (this.gridSize !== state.gridSize || this.isGridEnabled !== state.isGridEnabled) {
                this.gridSize = state.gridSize;
                this.isGridEnabled = state.isGridEnabled;
                this.updateGrid();
            }
            this.activeTool = state.activeTool;
            this.activeLayer = state.activeLayer; // Track layer changes
            this.activeTile = state.activeTile;

            // Sync Nodes
            if (this.entities !== state.mapData.entities) {
                this.entities = state.mapData.entities;
                this.syncEntities();
            }

            if (this.logicNodes !== state.mapData.logic) {
                this.logicNodes = state.mapData.logic;
                this.syncLogicNodes();
            }

            // Sync Selection
            if (this.selectedEntityIds !== state.selectedEntityIds) {
                this.selectedEntityIds = state.selectedEntityIds;
                this.updateSelectionBox();
            }

            this.updateMarker();
        });

        // Initial Sync
        this.syncEntities();
        this.syncLogicNodes();
        this.updateSelectionBox();
    }

    createTilemap() {
        // Create a blank map
        // 64x64 tiles of 64px = 4096px
        this.tilemap = this.make.tilemap({
            tileWidth: 64,
            tileHeight: 64,
            width: 125, // 8000 / 64 roughly
            height: 125
        });

        const tileset = this.tilemap.addTilesetImage('tilesheet', 'tilesheet', 64, 64);
        if (tileset) {
            this.tileLayer = this.tilemap.createBlankLayer('Ground', tileset)!;
            // Fill with Snow (Index 0 is usually empty in Tiled, but here 0 is first tile)
            // Phaser indexes: 0=first tile if not using Tiled. 
            // Actually, usually -1 is empty. 0 is first tile.
            this.tileLayer.fill(0);
            this.tileLayer.setDepth(-200);
        }
    }

    syncEntities() {
        const currentIds = new Set(this.entities.map(e => e.id));

        // Remove deleted
        for (const [id, sprite] of this.entityMap) {
            if (!currentIds.has(id)) {
                sprite.destroy();
                this.entityMap.delete(id);
            }
        }

        // Add/Update
        this.entities.forEach(entity => {
            let sprite = this.entityMap.get(entity.id);
            if (!sprite) {
                sprite = this.add.image(entity.x, entity.y, entity.type);
                sprite.setOrigin(0.5, 0.5); // Center origin is better for rotation
                sprite.setInteractive();
                sprite.setData('id', entity.id);
                this.entityMap.set(entity.id, sprite);
            }
            // Update Props
            sprite.setPosition(entity.x, entity.y);
            sprite.setScale(entity.scale);
            sprite.setRotation(entity.rotation);
        });
    }

    syncLogicNodes() {
        const currentIds = new Set(this.logicNodes.map(n => n.id));

        // Cleanup
        for (const [id, gfx] of this.logicMap) {
            if (!currentIds.has(id)) {
                gfx.destroy();
                this.logicMap.delete(id);
                this.logicTextMap.get(id)?.destroy();
                this.logicTextMap.delete(id);
            }
        }

        // Render
        this.logicNodes.forEach(node => {
            let gfx = this.logicMap.get(node.id);
            if (!gfx) {
                gfx = this.add.graphics();
                // Interactive Hit Area
                const hitArea = new Phaser.Geom.Rectangle(0, 0, node.width, node.height);
                gfx.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
                gfx.setData('id', node.id);
                gfx.setData('isLogic', true); // Tag as logic

                this.logicMap.set(node.id, gfx);

                const txt = this.add.text(node.x, node.y, node.type, { fontSize: '10px', color: '#ffff00', backgroundColor: '#000000' });
                this.logicTextMap.set(node.id, txt);
            }

            gfx.clear();
            gfx.setPosition(node.x, node.y);

            // Draw Yellow Box (Transparent)
            gfx.fillStyle(0xffff00, 0.3);
            gfx.fillRect(0, 0, node.width, node.height);
            gfx.lineStyle(2, 0xffff00, 1);
            gfx.strokeRect(0, 0, node.width, node.height);

            // Update Text
            const txt = this.logicTextMap.get(node.id);
            if (txt) txt.setPosition(node.x, node.y);
        });
    }

    updateSelectionBox() {
        this.selectionBox.clear();
        if (this.selectedEntityIds.length === 0) return;

        this.selectionBox.lineStyle(2, 0x00ffff, 1);

        const id = this.selectedEntityIds[0];

        // Check Entity Map
        const sprite = this.entityMap.get(id);
        if (sprite) {
            const bounds = sprite.getBounds();
            this.selectionBox.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            return;
        }

        // Check Logic Map
        const logic = this.logicMap.get(id);
        if (logic) {
            // Logic nodes draw their own selection style usually, but we can highlight
            this.selectionBox.lineStyle(2, 0xff00ff, 1); // Magenta for logic
            // Logic graphics position is top-left, but getBounds might be worldwide
            // logic is drawn at (x,y) with size (w,h)
            // Using simple rect since we know props
            const node = this.logicNodes.find(n => n.id === id);
            if (node) {
                this.selectionBox.strokeRect(node.x, node.y, node.width, node.height);
            }
        }
    }

    setupCamera() {
        const cursors = this.input.keyboard.createCursorKeys();
        const controlConfig = {
            camera: this.cameras.main,
            left: cursors.left,
            right: cursors.right,
            up: cursors.up,
            down: cursors.down,
            zoomIn: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
            zoomOut: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
            acceleration: 0.06,
            drag: 0.0005,
            maxSpeed: 1.0
        };
        this.controls = new Phaser.Cameras.Controls.SmoothedKeyControl(controlConfig);

        // Mouse Wheel Zoom
        this.input.on('wheel', (pointer: any, gameObjects: any, deltaX: number, deltaY: number) => {
            const zoom = this.cameras.main.zoom;
            const newZoom = Phaser.Math.Clamp(zoom - deltaY * 0.001, 0.1, 8);
            this.cameras.main.setZoom(newZoom);
        });

        // Right Click Pan
        this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
            if (!p.isDown) return;
            if (p.button === 2) {
                this.cameras.main.scrollX -= (p.x - p.prevPosition.x) / this.cameras.main.zoom;
                this.cameras.main.scrollY -= (p.y - p.prevPosition.y) / this.cameras.main.zoom;
            }
        });

        // Disable Context Menu
        this.input.mouse.disableContextMenu();
    }

    createGrid() {
        // Clear old if exists
        if (this.grid) this.grid.destroy();

        if (!this.isGridEnabled) return;

        const width = 8000;
        const height = 8000;

        this.grid = this.add.grid(
            0, 0,
            width, height,
            this.gridSize, this.gridSize,
            0x000000, 0, 0xffffff, 0.1
        );
        this.grid.setOrigin(0, 0); // Top-left origin for easier math
        this.grid.setDepth(-100);
    }

    updateGrid() {
        this.createGrid();
        this.updateMarker();
    }

    updateMarker() {
        this.marker.clear();
        if (this.activeTool === 'select') return;

        this.marker.lineStyle(2, 0x00ff00, 1);
        this.marker.strokeRect(0, 0, this.gridSize, this.gridSize);
    }

    setupInput() {
        this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            if (pointer.button === 0) { // Left Click
                this.handleLeftClick(pointer);
            }
        });

        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

            // Dragging Logic
            if (this.isDragging && this.dragTargetId) {
                if (this.activeLayer === 'logic') {
                    // Dragging Logic Node
                    const node = this.logicMap.get(this.dragTargetId);
                    if (node) {
                        const snapX = Math.floor(worldPoint.x / this.gridSize) * this.gridSize;
                        const snapY = Math.floor(worldPoint.y / this.gridSize) * this.gridSize;
                        node.setPosition(snapX, snapY);
                        const txt = this.logicTextMap.get(this.dragTargetId);
                        if (txt) txt.setPosition(snapX, snapY);
                        this.updateSelectionBox();
                    }
                } else {
                    // Dragging Entity
                    const snapX = Math.floor(worldPoint.x / this.gridSize) * this.gridSize + (this.gridSize / 2);
                    const snapY = Math.floor(worldPoint.y / this.gridSize) * this.gridSize + (this.gridSize / 2);
                    const sprite = this.entityMap.get(this.dragTargetId);
                    if (sprite) sprite.setPosition(snapX, snapY);
                    this.updateSelectionBox();
                }
            }

            // Logic Creation Ghost
            if (this.isCreatingLogic && this.logicStartPoint) {
                const currentX = worldPoint.x;
                const currentY = worldPoint.y;
                const width = currentX - this.logicStartPoint.x;
                const height = currentY - this.logicStartPoint.y;

                this.ghostLogicBox.clear();
                this.ghostLogicBox.fillStyle(0xffff00, 0.2);
                this.ghostLogicBox.fillRect(this.logicStartPoint.x, this.logicStartPoint.y, width, height);
            }

            // Painting Logic
            if (this.activeTool === 'brush' && pointer.isDown && this.activeLayer === 'terrain') {
                this.paintTile(worldPoint.x, worldPoint.y);
            }

            // Finish Creating Logic Node
            if (this.isCreatingLogic && this.logicStartPoint && !pointer.isDown) { // Check !pointer.isDown to ensure it's on pointerup
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const width = Math.abs(worldPoint.x - this.logicStartPoint.x);
                const height = Math.abs(worldPoint.y - this.logicStartPoint.y);

                if (width > 10 && height > 10) {
                    useEditorStore.getState().addLogicNode({
                        id: crypto.randomUUID(),
                        type: 'trigger',
                        x: Math.min(this.logicStartPoint.x, worldPoint.x),
                        y: Math.min(this.logicStartPoint.y, worldPoint.y),
                        width, height,
                        properties: { message: 'Enter Message...' }
                    });
                }

                this.isCreatingLogic = false;
                this.logicStartPoint = null;
                this.ghostLogicBox.clear();
            }
        });

        this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
            if (this.isDragging && this.dragTargetId) {
                if (this.activeLayer === 'logic') {
                    const node = this.logicMap.get(this.dragTargetId);
                    if (node) {
                        useEditorStore.getState().updateLogicNode(this.dragTargetId, { x: node.x, y: node.y });
                    }
                } else {
                    const sprite = this.entityMap.get(this.dragTargetId);
                    if (sprite) {
                        useEditorStore.getState().updateEntity(this.dragTargetId, { x: sprite.x, y: sprite.y });
                    }
                }
                this.isDragging = false;
                this.dragTargetId = null;
            }
            // Handle logic node creation on pointerup
            if (this.isCreatingLogic && this.logicStartPoint) {
                const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
                const width = Math.abs(worldPoint.x - this.logicStartPoint.x);
                const height = Math.abs(worldPoint.y - this.logicStartPoint.y);

                if (width > 10 && height > 10) {
                    useEditorStore.getState().addLogicNode({
                        id: crypto.randomUUID(),
                        type: 'trigger',
                        x: Math.min(this.logicStartPoint.x, worldPoint.x),
                        y: Math.min(this.logicStartPoint.y, worldPoint.y),
                        width, height,
                        properties: { message: 'Enter Message...' }
                    });
                }

                this.isCreatingLogic = false;
                this.logicStartPoint = null;
                this.ghostLogicBox.clear();
            }
        });
    }

    handleLeftClick(pointer: Phaser.Input.Pointer) {
        const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

        // 1. Logic Layer Creation/Selection
        if (this.activeLayer === 'logic') {
            // Check if selecting existing logic node
            const clickedObjects = this.input.hitTestPointer(pointer);
            const clickedNode = clickedObjects.find(obj => obj instanceof Phaser.GameObjects.Graphics && obj.getData('isLogic'));

            if (clickedNode) {
                const id = clickedNode.getData('id');
                useEditorStore.getState().setSelectedEntityIds([id]); // Reusing same selection array for ID
                this.isDragging = true;
                this.dragTargetId = id;
                return;
            }

            // Else start creating new one if tool allows
            if (this.activeTool === 'select') { // Assuming 'select' tool is used for drawing new logic nodes
                this.isCreatingLogic = true;
                this.logicStartPoint = new Phaser.Math.Vector2(
                    Math.floor(worldPoint.x / this.gridSize) * this.gridSize,
                    Math.floor(worldPoint.y / this.gridSize) * this.gridSize
                );
            }
            return; // Crucial to return here to prevent falling through to entity/terrain logic
        }

        // Original entity/terrain/stamp logic
        if (this.activeTool === 'select') {
            // Check if clicked ON an entity
            const clickedObjects = this.input.hitTestPointer(pointer);
            const clickedEntity = clickedObjects.find(obj => obj instanceof Phaser.GameObjects.Image);

            if (clickedEntity) {
                const id = clickedEntity.getData('id');
                useEditorStore.getState().setSelectedEntityIds([id]);
                this.isDragging = true;
                this.dragTargetId = id;
                console.log("Selected:", id); // Keep this line from original
            } else {
                useEditorStore.getState().setSelectedEntityIds([]);
            }
        } else if (this.activeTool === 'brush') {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.paintTile(worldPoint.x, worldPoint.y);
        } else if (this.activeTool === 'stamp') {
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            const snapX = Math.floor(worldPoint.x / this.gridSize) * this.gridSize + (this.gridSize / 2);
            const snapY = Math.floor(worldPoint.y / this.gridSize) * this.gridSize + (this.gridSize / 2);

            const assetId = useEditorStore.getState().selectedAsset;
            if (assetId) {
                useEditorStore.getState().addEntity({
                    id: crypto.randomUUID(),
                    type: assetId,
                    x: snapX, y: snapY,
                    scale: 1, rotation: 0,
                    properties: {}
                });
            }
        }
    }

    paintTile(worldX: number, worldY: number) {
        if (!this.tileLayer) return;

        // Convert world to tile
        const tileX = this.tileLayer.worldToTileX(worldX);
        const tileY = this.tileLayer.worldToTileY(worldY);

        // Active Tile ID (0-based index)
        // Palette IDs are 1..4, so activeTile - 1
        const tileIndex = this.activeTile - 1;

        this.tileLayer.putTileAt(tileIndex, tileX, tileY);
    }

    update(time: number, delta: number) {
        this.controls.update(delta);

        const p = this.input.activePointer;
        const worldPoint = this.cameras.main.getWorldPoint(p.x, p.y);

        // Snap Marker
        if (this.activeTool !== 'select') {
            const snapX = Math.floor(worldPoint.x / this.gridSize) * this.gridSize;
            const snapY = Math.floor(worldPoint.y / this.gridSize) * this.gridSize;
            this.marker.setPosition(snapX, snapY);
        }
    }

    shutdown() {
        if (this.unsubscribe) this.unsubscribe();
    }
}
