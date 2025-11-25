import * as THREE from 'three';
import { AssetLoader } from '../core/AssetLoader';

/**
 * PedestrianGeometryCache
 *
 * Caches and shares geometries between pedestrians of the same type.
 * Instead of cloning geometries with SkeletonUtils, we share the same
 * BufferGeometry instances across all pedestrians of the same character type.
 *
 * Benefits:
 * - Reduces memory usage (~150k triangles → shared references)
 * - Faster pedestrian spawning (no geometry cloning)
 * - Better CPU cache locality
 *
 * Note: Each pedestrian still has its own skeleton/mixer for independent animations.
 */
export class PedestrianGeometryCache {
  private static instance: PedestrianGeometryCache | null = null;

  // Cache: characterType → {geometry, materialTemplates}
  private cache: Map<string, {
    geometries: THREE.BufferGeometry[];
    materials: THREE.Material[];
    skeleton: THREE.Skeleton;
    animations: THREE.AnimationClip[];
    boneCount: number;
  }> = new Map();

  private constructor() {}

  static getInstance(): PedestrianGeometryCache {
    if (!PedestrianGeometryCache.instance) {
      PedestrianGeometryCache.instance = new PedestrianGeometryCache();
    }
    return PedestrianGeometryCache.instance;
  }

  /**
   * Load and cache a character type's geometry/skeleton
   */
  loadCharacterType(characterType: string): boolean {
    if (this.cache.has(characterType)) {
      return true; // Already cached
    }

    const assetLoader = AssetLoader.getInstance();
    const gltf = assetLoader.getModel(`/assets/pedestrians/${characterType}.gltf`);

    if (!gltf) {
      console.error(`[PedestrianGeometryCache] Model not loaded: ${characterType}`);
      return false;
    }

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    let skeleton: THREE.Skeleton | null = null;
    let boneCount = 0;

    // Extract geometries, materials, and skeleton from the GLTF
    gltf.scene.traverse((node) => {
      if (node instanceof THREE.SkinnedMesh) {
        // Cache the geometry (shared across all instances)
        geometries.push(node.geometry);

        // Cache material templates (will be cloned per instance for skin tones)
        if (Array.isArray(node.material)) {
          materials.push(...node.material);
        } else {
          materials.push(node.material);
        }

        // Cache skeleton structure (will be cloned per instance)
        if (!skeleton) {
          skeleton = node.skeleton;
          boneCount = skeleton.bones.length;
        }
      }
    });

    if (!skeleton || geometries.length === 0) {
      console.error(`[PedestrianGeometryCache] No skeleton/geometry found for: ${characterType}`);
      return false;
    }

    // Store in cache
    this.cache.set(characterType, {
      geometries,
      materials,
      skeleton,
      animations: gltf.animations,
      boneCount
    });

    console.log(`[PedestrianGeometryCache] Cached ${characterType}: ${boneCount} bones, ${geometries.length} meshes`);

    return true;
  }

  /**
   * Get cached data for a character type
   */
  getCachedCharacter(characterType: string) {
    return this.cache.get(characterType);
  }

  /**
   * Check if all cached characters have the same bone count
   * (validates assumption that they share the same skeleton)
   */
  validateSkeletonCompatibility(): {valid: boolean; boneCounts: Map<string, number>} {
    const boneCounts = new Map<string, number>();
    let firstBoneCount: number | null = null;
    let allMatch = true;

    for (const [type, data] of this.cache.entries()) {
      boneCounts.set(type, data.boneCount);

      if (firstBoneCount === null) {
        firstBoneCount = data.boneCount;
      } else if (firstBoneCount !== data.boneCount) {
        allMatch = false;
        console.warn(`[PedestrianGeometryCache] Bone count mismatch: ${type} has ${data.boneCount} bones, expected ${firstBoneCount}`);
      }
    }

    return { valid: allMatch, boneCounts };
  }

  /**
   * Get statistics about cached geometries
   */
  getStats() {
    const stats = {
      characterTypes: this.cache.size,
      totalGeometries: 0,
      totalMaterials: 0,
      boneCount: 0
    };

    for (const data of this.cache.values()) {
      stats.totalGeometries += data.geometries.length;
      stats.totalMaterials += data.materials.length;
      stats.boneCount = data.boneCount; // Assuming all same
    }

    return stats;
  }

  /**
   * Clear cache (for cleanup)
   */
  clear(): void {
    // Don't dispose geometries/materials - they're owned by AssetLoader
    this.cache.clear();
  }
}
