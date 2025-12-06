/**
 * AudioManager - Central audio system for Rampage Rider
 *
 * Follows the Manager pattern used throughout the codebase:
 * - Instantiated in Engine.init()
 * - update(dt) called every frame
 * - dispose() for cleanup
 *
 * Uses Web Audio API for low-latency game audio with:
 * - Sound pooling for frequently played sounds
 * - Spatial audio support (3D positioning)
 * - Dynamic music system with crossfading
 * - Volume ducking for impact moments
 */

import * as THREE from 'three';
import { SoundId, SOUND_CONFIG, SoundCategory } from './sounds';

// Pool size for frequently played sounds
const POOL_SIZE = 8;

interface PooledSound {
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  isPlaying: boolean;
}

interface PlayingSound {
  id: string;
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  startTime: number;
  loop: boolean;
}

interface MusicTrack {
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
  isPlaying: boolean;
}

export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private uiGain: GainNode | null = null;

  // Audio buffers loaded from files
  private buffers: Map<SoundId, AudioBuffer> = new Map();

  // Sound pools for frequently played sounds (kills, hits, etc.)
  private soundPools: Map<SoundId, PooledSound[]> = new Map();
  private poolIndices: Map<SoundId, number> = new Map();

  // Currently playing sounds (for stopping/fading)
  private playingSounds: Map<string, PlayingSound> = new Map();

  // Music system
  private currentMusic: MusicTrack | null = null;
  private nextMusic: MusicTrack | null = null;
  private musicCrossfadeTime = 0;
  private musicCrossfadeDuration = 1.0;

  // Engine loops (vehicle engines, sirens)
  private engineLoops: Map<string, PlayingSound> = new Map();

  // Volume settings
  private masterVolume = 1.0;
  private sfxVolume = 1.0;
  private musicVolume = 0.7;
  private uiVolume = 1.0;

  // Ducking (lower music during impacts)
  private duckingLevel = 1.0;
  private duckingTarget = 1.0;
  private duckingSpeed = 4.0;

  // State
  private isInitialized = false;
  private isMuted = false;
  private listenerPosition = new THREE.Vector3();

  // Pre-allocated temps
  private readonly _tempVector = new THREE.Vector3();

  constructor() {
    // AudioContext created on first user interaction
  }

  /**
   * Initialize the audio system. Must be called after user interaction
   * (browser autoplay policy requires user gesture).
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create audio context
      this.context = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Create gain node hierarchy
      // Master -> [SFX, Music, UI]
      this.masterGain = this.context.createGain();
      this.masterGain.connect(this.context.destination);

      this.sfxGain = this.context.createGain();
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.context.createGain();
      this.musicGain.connect(this.masterGain);

      this.uiGain = this.context.createGain();
      this.uiGain.connect(this.masterGain);

      // Set initial volumes
      this.updateVolumes();

      this.isInitialized = true;
      // AudioManager initialized
    } catch (error) {
      console.error('[AudioManager] Failed to initialize:', error);
    }
  }

  /**
   * Resume audio context if suspended (required after tab switch, etc.)
   */
  async resume(): Promise<void> {
    if (this.context?.state === 'suspended') {
      await this.context.resume();
    }
  }

  /**
   * Load a sound from a URL
   */
  async loadSound(id: SoundId, url: string): Promise<void> {
    if (!this.context) {
      console.warn('[AudioManager] Cannot load sound - not initialized');
      return;
    }

    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(id, audioBuffer);

      // Create pool for pooled sounds
      const config = SOUND_CONFIG[id];
      if (config?.pooled) {
        this.createSoundPool(id);
      }
    } catch (error) {
      console.warn(`[AudioManager] Failed to load sound ${id}:`, error);
    }
  }

  /**
   * Create a pool of sound instances for frequently played sounds
   */
  private createSoundPool(id: SoundId): void {
    if (!this.context || !this.sfxGain) return;

    const pool: PooledSound[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      const gainNode = this.context.createGain();
      gainNode.connect(this.sfxGain);
      pool.push({
        source: null,
        gainNode,
        isPlaying: false,
      });
    }
    this.soundPools.set(id, pool);
    this.poolIndices.set(id, 0);
  }

  /**
   * Play a sound effect
   */
  play(
    id: SoundId,
    options: {
      volume?: number;
      pitch?: number; // Playback rate multiplier
      pan?: number; // -1 (left) to 1 (right)
      position?: THREE.Vector3; // For 3D spatial audio
      loop?: boolean;
      instanceId?: string; // For stopping specific instances
      maxDuration?: number; // Max playback duration in seconds (auto-stop after)
    } = {}
  ): string | null {
    if (!this.context || !this.isInitialized || this.isMuted) return null;

    const buffer = this.buffers.get(id);
    if (!buffer) {
      // Sound not loaded - this is expected, we're using placeholder calls
      // console.warn(`[AudioManager] Sound not loaded: ${id}`);
      return null;
    }

    const config = SOUND_CONFIG[id];
    const volume = (options.volume ?? 1.0) * (config?.volume ?? 1.0);
    const pitch = (options.pitch ?? 1.0) * (config?.pitch ?? 1.0);

    // Use pool for pooled sounds
    if (config?.pooled && this.soundPools.has(id)) {
      return this.playPooled(id, volume, pitch);
    }

    // Regular sound playback
    return this.playDirect(id, buffer, { ...options, volume, pitch });
  }

  /**
   * Play from sound pool (for frequently triggered sounds)
   */
  private playPooled(id: SoundId, volume: number, pitch: number): string | null {
    if (!this.context) return null;

    const pool = this.soundPools.get(id);
    if (!pool) return null;

    const index = this.poolIndices.get(id) ?? 0;
    const pooled = pool[index];

    // Stop previous sound in this slot
    if (pooled.source) {
      try {
        pooled.source.stop();
      } catch {
        // Already stopped
      }
    }

    // Create new source
    const buffer = this.buffers.get(id);
    if (!buffer) return null;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = pitch;
    source.connect(pooled.gainNode);

    pooled.gainNode.gain.value = volume;
    pooled.source = source;
    pooled.isPlaying = true;

    source.onended = () => {
      pooled.isPlaying = false;
    };

    source.start();

    // Advance pool index
    this.poolIndices.set(id, (index + 1) % POOL_SIZE);

    return `${id}_pool_${index}`;
  }

  /**
   * Direct sound playback (non-pooled)
   */
  private playDirect(
    id: SoundId,
    buffer: AudioBuffer,
    options: {
      volume?: number;
      pitch?: number;
      pan?: number;
      position?: THREE.Vector3;
      loop?: boolean;
      instanceId?: string;
      maxDuration?: number;
    }
  ): string | null {
    if (!this.context || !this.sfxGain) return null;

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = options.loop ?? false;
    source.playbackRate.value = options.pitch ?? 1.0;

    const gainNode = this.context.createGain();
    gainNode.gain.value = options.volume ?? 1.0;

    // Panning
    if (options.pan !== undefined) {
      const panner = this.context.createStereoPanner();
      panner.pan.value = options.pan;
      source.connect(panner);
      panner.connect(gainNode);
    } else {
      source.connect(gainNode);
    }

    // Get the appropriate output gain based on sound category
    const config = SOUND_CONFIG[id];
    const outputGain = this.getOutputGain(config?.category);
    gainNode.connect(outputGain);

    const instanceId = options.instanceId ?? `${id}_${Date.now()}_${Math.random()}`;

    const playing: PlayingSound = {
      id: instanceId,
      source,
      gainNode,
      startTime: this.context.currentTime,
      loop: options.loop ?? false,
    };

    this.playingSounds.set(instanceId, playing);

    source.onended = () => {
      this.playingSounds.delete(instanceId);
    };

    // Start with optional max duration limit
    if (options.maxDuration !== undefined) {
      source.start(0, 0, options.maxDuration);
    } else {
      source.start();
    }

    return instanceId;
  }

  /**
   * Get the appropriate output gain node for a sound category
   */
  private getOutputGain(category?: SoundCategory): GainNode {
    switch (category) {
      case 'music':
        return this.musicGain!;
      case 'ui':
        return this.uiGain!;
      default:
        return this.sfxGain!;
    }
  }

  /**
   * Stop a specific sound instance
   */
  stop(instanceId: string, fadeTime = 0): void {
    const playing = this.playingSounds.get(instanceId);
    if (!playing) return;

    if (fadeTime > 0 && this.context) {
      playing.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeTime);
      setTimeout(() => {
        try {
          playing.source.stop();
        } catch {
          // Already stopped
        }
        this.playingSounds.delete(instanceId);
      }, fadeTime * 1000);
    } else {
      try {
        playing.source.stop();
      } catch {
        // Already stopped
      }
      this.playingSounds.delete(instanceId);
    }
  }

  /**
   * Stop all sounds with a given base ID
   */
  stopAll(baseId: SoundId): void {
    for (const [instanceId] of this.playingSounds) {
      if (instanceId.startsWith(baseId)) {
        this.stop(instanceId);
      }
    }
  }

  // ============================================
  // MUSIC SYSTEM
  // ============================================

  /**
   * Play music track with optional crossfade
   */
  playMusic(id: SoundId, crossfade = true): void {
    if (!this.context || !this.musicGain) return;

    const buffer = this.buffers.get(id);
    if (!buffer) {
      console.warn(`[AudioManager] Music not loaded: ${id}`);
      return;
    }

    // Stop any pending crossfade
    if (this.nextMusic) {
      try {
        this.nextMusic.source?.stop();
      } catch {
        // Already stopped
      }
      this.nextMusic = null;
      this.musicCrossfadeTime = 0;
    }

    const source = this.context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gainNode = this.context.createGain();
    gainNode.connect(this.musicGain);

    if (crossfade && this.currentMusic?.isPlaying) {
      // Start new track at 0 volume, will fade in
      gainNode.gain.value = 0;
      this.nextMusic = { source, gainNode, isPlaying: true };
      this.musicCrossfadeTime = this.musicCrossfadeDuration;
    } else {
      // Stop current music immediately if not crossfading
      if (this.currentMusic?.isPlaying) {
        try {
          this.currentMusic.source?.stop();
        } catch {
          // Already stopped
        }
        this.currentMusic.isPlaying = false;
      }
      gainNode.gain.value = 1;
      this.currentMusic = { source, gainNode, isPlaying: true };
    }

    source.connect(gainNode);
    source.start();
  }

  /**
   * Stop current music with optional fade
   */
  stopMusic(fadeTime = 1.0): void {
    if (!this.currentMusic || !this.context) return;

    const music = this.currentMusic;
    music.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + fadeTime);

    setTimeout(() => {
      try {
        music.source?.stop();
      } catch {
        // Already stopped
      }
      music.isPlaying = false;
    }, fadeTime * 1000);

    this.currentMusic = null;
  }

  // ============================================
  // ENGINE LOOPS (Vehicles, Sirens)
  // ============================================

  /**
   * Start an engine loop sound
   */
  startEngineLoop(entityId: string, soundId: SoundId, volume = 1.0): void {
    if (this.engineLoops.has(entityId)) return;

    const instanceId = this.play(soundId, { loop: true, volume, instanceId: `engine_${entityId}` });
    if (instanceId) {
      const playing = this.playingSounds.get(instanceId);
      if (playing) {
        this.engineLoops.set(entityId, playing);
      }
    }
  }

  /**
   * Update engine loop pitch based on speed
   */
  updateEngineLoop(entityId: string, speed: number, maxSpeed: number): void {
    const loop = this.engineLoops.get(entityId);
    if (!loop) return;

    // Map speed to pitch (0.8 at idle, 1.5 at max speed)
    const normalizedSpeed = Math.min(speed / maxSpeed, 1);
    const pitch = 0.8 + normalizedSpeed * 0.7;
    loop.source.playbackRate.value = pitch;
  }

  /**
   * Stop an engine loop
   */
  stopEngineLoop(entityId: string, fadeTime = 0.3): void {
    const loop = this.engineLoops.get(entityId);
    if (!loop) return;

    this.stop(loop.id, fadeTime);
    this.engineLoops.delete(entityId);
  }

  // ============================================
  // AUDIO DUCKING
  // ============================================

  /**
   * Duck the music volume temporarily (for impacts, tier unlocks, etc.)
   */
  duck(amount = 0.3, duration = 0.5): void {
    this.duckingTarget = amount;
    setTimeout(() => {
      this.duckingTarget = 1.0;
    }, duration * 1000);
  }

  // ============================================
  // UPDATE LOOP
  // ============================================

  /**
   * Called every frame from Engine.update()
   */
  update(dt: number): void {
    if (!this.isInitialized) return;

    // Update music crossfade
    if (this.musicCrossfadeTime > 0 && this.currentMusic && this.nextMusic) {
      this.musicCrossfadeTime -= dt;
      const progress = 1 - this.musicCrossfadeTime / this.musicCrossfadeDuration;

      this.currentMusic.gainNode.gain.value = 1 - progress;
      this.nextMusic.gainNode.gain.value = progress;

      if (this.musicCrossfadeTime <= 0) {
        try {
          this.currentMusic.source?.stop();
        } catch {
          // Already stopped
        }
        this.currentMusic = this.nextMusic;
        this.nextMusic = null;
      }
    }

    // Update ducking
    if (this.duckingLevel !== this.duckingTarget) {
      const diff = this.duckingTarget - this.duckingLevel;
      const step = this.duckingSpeed * dt;
      if (Math.abs(diff) < step) {
        this.duckingLevel = this.duckingTarget;
      } else {
        this.duckingLevel += Math.sign(diff) * step;
      }
      this.musicGain!.gain.value = this.musicVolume * this.duckingLevel;
    }
  }

  // ============================================
  // VOLUME CONTROLS
  // ============================================

  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  setUiVolume(volume: number): void {
    this.uiVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
  }

  private updateVolumes(): void {
    if (this.masterGain) this.masterGain.gain.value = this.isMuted ? 0 : this.masterVolume;
    if (this.sfxGain) this.sfxGain.gain.value = this.sfxVolume;
    if (this.musicGain) this.musicGain.gain.value = this.musicVolume * this.duckingLevel;
    if (this.uiGain) this.uiGain.gain.value = this.uiVolume;
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
    this.updateVolumes();
  }

  toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  // ============================================
  // LISTENER POSITION (for 3D audio)
  // ============================================

  setListenerPosition(position: THREE.Vector3): void {
    this.listenerPosition.copy(position);
    // Note: Full 3D audio would use AudioListener/PannerNode
    // For now we just track position for future spatial audio
  }

  // ============================================
  // CLEANUP
  // ============================================

  dispose(): void {
    // Stop all sounds
    for (const [id] of this.playingSounds) {
      this.stop(id);
    }
    for (const [id] of this.engineLoops) {
      this.stopEngineLoop(id);
    }

    // Stop music
    this.stopMusic(0);

    // Close context
    if (this.context) {
      this.context.close();
      this.context = null;
    }

    this.buffers.clear();
    this.soundPools.clear();
    this.playingSounds.clear();
    this.engineLoops.clear();
    this.isInitialized = false;

    // AudioManager disposed
  }
}

// Singleton instance
export const audioManager = new AudioManager();
