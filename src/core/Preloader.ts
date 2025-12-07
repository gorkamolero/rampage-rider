import RAPIER from '@dimforge/rapier3d-compat';
import { AssetLoader } from './AssetLoader';

export interface LoadingState {
  progress: number; // 0-1
  phase: LoadingPhase;
  detail: string;
  itemsLoaded: number;
  itemsTotal: number;
}

export type LoadingPhase =
  | 'initializing'
  | 'physics'
  | 'models'
  | 'cloning-pedestrians'
  | 'cloning-cops'
  | 'cloning-vehicles'
  | 'complete';

const PHASE_LABELS: Record<LoadingPhase, string> = {
  'initializing': 'INITIALIZING...',
  'physics': 'LOADING PHYSICS ENGINE...',
  'models': 'LOADING MODELS...',
  'cloning-pedestrians': 'PREPARING CROWDS...',
  'cloning-cops': 'DEPLOYING UNITS...',
  'cloning-vehicles': 'FUELING VEHICLES...',
  'complete': 'READY!'
};

// Weight each phase by approximate time cost
const PHASE_WEIGHTS = {
  physics: 0.1,        // Rapier WASM is fast
  models: 0.6,         // Bulk of time is loading 40+ models
  cloning: 0.3         // Pre-cloning takes noticeable time
};

/**
 * Preloader - Loads heavy assets before the game starts with granular progress
 */
class Preloader {
  private static instance: Preloader;
  private rapierLoaded = false;
  private assetsLoaded = false;
  private rapierPromise: Promise<void> | null = null;
  private assetsPromise: Promise<void> | null = null;
  private progressListeners = new Set<(state: LoadingState) => void>();

  private currentState: LoadingState = {
    progress: 0,
    phase: 'initializing',
    detail: PHASE_LABELS['initializing'],
    itemsLoaded: 0,
    itemsTotal: 0
  };

  private constructor() {}

  static getInstance(): Preloader {
    if (!Preloader.instance) {
      Preloader.instance = new Preloader();
    }
    return Preloader.instance;
  }

  /**
   * Start preloading all heavy assets with granular progress tracking
   */
  async preloadAll(): Promise<void> {
    // Phase 1: Load Rapier WASM
    if (!this.rapierLoaded && !this.rapierPromise) {
      this.updateState({ phase: 'physics', detail: PHASE_LABELS['physics'] });
      this.rapierPromise = this.preloadRapier();
    }

    if (this.rapierPromise) {
      await this.rapierPromise;
    }

    // Phase 2: Load all models
    if (!this.assetsLoaded && !this.assetsPromise) {
      this.updateState({ phase: 'models', detail: PHASE_LABELS['models'] });
      this.assetsPromise = this.preloadAssets();
    }

    if (this.assetsPromise) {
      await this.assetsPromise;
    }

    // Complete
    this.updateState({
      phase: 'complete',
      detail: PHASE_LABELS['complete'],
      progress: 1
    });
  }

  /**
   * Preload Rapier WASM module
   */
  private async preloadRapier(): Promise<void> {
    if (this.rapierLoaded) return;

    await RAPIER.init();
    this.rapierLoaded = true;
    this.updateState({
      progress: PHASE_WEIGHTS.physics,
      detail: 'Physics engine ready'
    });
  }

  /**
   * Preload game assets (models, textures) with per-item progress
   */
  private async preloadAssets(): Promise<void> {
    if (this.assetsLoaded) return;

    const assetLoader = AssetLoader.getInstance();

    await assetLoader.preloadAll((loaded, total, currentAsset, subPhase) => {
      // Calculate progress within current phase
      let phaseProgress = 0;
      let phase: LoadingPhase = 'models';
      let detail = '';

      if (subPhase === 'loading') {
        phase = 'models';
        phaseProgress = (loaded / total) * PHASE_WEIGHTS.models;
        detail = currentAsset ? `Loading ${currentAsset}` : PHASE_LABELS['models'];
      } else if (subPhase === 'cloning-pedestrians') {
        phase = 'cloning-pedestrians';
        phaseProgress = PHASE_WEIGHTS.models + (loaded / total) * (PHASE_WEIGHTS.cloning * 0.5);
        detail = PHASE_LABELS['cloning-pedestrians'];
      } else if (subPhase === 'cloning-cops') {
        phase = 'cloning-cops';
        phaseProgress = PHASE_WEIGHTS.models + (PHASE_WEIGHTS.cloning * 0.5) + (loaded / total) * (PHASE_WEIGHTS.cloning * 0.25);
        detail = PHASE_LABELS['cloning-cops'];
      } else if (subPhase === 'cloning-vehicles') {
        phase = 'cloning-vehicles';
        phaseProgress = PHASE_WEIGHTS.models + (PHASE_WEIGHTS.cloning * 0.75) + (loaded / total) * (PHASE_WEIGHTS.cloning * 0.25);
        detail = PHASE_LABELS['cloning-vehicles'];
      }

      this.updateState({
        phase,
        progress: PHASE_WEIGHTS.physics + phaseProgress,
        detail,
        itemsLoaded: loaded,
        itemsTotal: total
      });
    });

    this.assetsLoaded = true;
  }

  private updateState(partial: Partial<LoadingState>): void {
    this.currentState = { ...this.currentState, ...partial };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.progressListeners.forEach(listener => {
      listener(this.currentState);
    });
  }

  addProgressListener(listener: (state: LoadingState) => void): () => void {
    this.progressListeners.add(listener);
    listener(this.currentState);
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  getProgress(): number {
    return this.currentState.progress;
  }

  getState(): LoadingState {
    return this.currentState;
  }

  isRapierReady(): boolean {
    return this.rapierLoaded;
  }

  isAssetsReady(): boolean {
    return this.assetsLoaded;
  }

  isReady(): boolean {
    return this.rapierLoaded && this.assetsLoaded;
  }
}

export const preloader = Preloader.getInstance();
