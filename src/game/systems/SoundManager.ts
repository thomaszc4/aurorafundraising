import Phaser from 'phaser';

export class SoundManager {
    private static instance: SoundManager;
    private scene!: Phaser.Scene;
    private music: Phaser.Sound.BaseSound | null = null;
    private enabled = true;

    private constructor() { }

    public static getInstance(): SoundManager {
        if (!SoundManager.instance) {
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }

    public init(scene: Phaser.Scene) {
        this.scene = scene;
    }

    public loadAssets(scene: Phaser.Scene) {
        // Load placeholders
        scene.load.audio('bgm_wind', '/assets/audio/wind_ambience.mp3'); // Placeholder path
        scene.load.audio('sfx_step', '/assets/audio/step_snow.mp3');
        scene.load.audio('sfx_craft', '/assets/audio/craft.mp3');
        scene.load.audio('sfx_level', '/assets/audio/levelup.mp3');
    }

    public playBGM(key: string) {
        if (!this.enabled) return;
        if (this.music) this.music.stop();

        // Check if sound exists
        if (this.scene.cache.audio.exists(key)) {
            this.music = this.scene.sound.add(key, { loop: true, volume: 0.5 });
            this.music.play();
        }
    }

    public playSFX(key: string, config?: Phaser.Types.Sound.SoundConfig) {
        if (!this.enabled) return;
        if (this.scene.cache.audio.exists(key)) {
            this.scene.sound.play(key, config);
        }
    }

    public toggleMute() {
        this.enabled = !this.enabled;
        if (!this.enabled && this.music) this.music.pause();
        if (this.enabled && this.music) this.music.resume();
        return this.enabled;
    }
}
