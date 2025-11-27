import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { Vehicle } from '../entities/Vehicle';
import { Player } from '../entities/Player';
import { Tier } from '../types';
import {
  VehicleType,
  TIER_VEHICLE_MAP,
  VEHICLE_CONFIGS,
  TIER_CONFIGS,
  VEHICLE_INTERACTION,
  COLLISION_GROUPS,
} from '../constants';

/**
 * VehicleManager
 *
 * Handles all vehicle-related logic:
 * - Spawning vehicles (current and awaiting)
 * - Entering/exiting vehicles
 * - Tier progression system
 * - Vehicle cleanup
 */
export class VehicleManager {
  private scene: THREE.Scene;
  private getWorld: () => RAPIER.World | null;

  // Current vehicle state
  private vehicle: Vehicle | null = null;
  private isInVehicle: boolean = false;
  private vehicleSpawned: boolean = false;
  private currentVehicleTier: Tier | null = null;

  // Awaiting vehicle (next tier upgrade)
  private awaitingVehicle: Vehicle | null = null;
  private awaitingVehicleTier: Tier | null = null;
  private awaitingVehicleGlowTime: number = 0;
  private awaitingVehicleMaterials: THREE.MeshStandardMaterial[] = [];

  // Cleanup queue
  private vehiclesToCleanup: Array<{ vehicle: Vehicle; timer: number }> = [];

  // Pre-allocated vectors
  private readonly _tempSpawnTestPos: THREE.Vector3 = new THREE.Vector3();
  private readonly _tempSpawnDir: THREE.Vector3 = new THREE.Vector3();

  // Pre-allocated spawn offsets
  private readonly _spawnOffsets: THREE.Vector3[] = [
    new THREE.Vector3(5, 0, 0),
    new THREE.Vector3(-5, 0, 0),
    new THREE.Vector3(0, 0, 5),
    new THREE.Vector3(0, 0, -5),
    new THREE.Vector3(5, 0, 5),
    new THREE.Vector3(-5, 0, -5),
    new THREE.Vector3(5, 0, -5),
    new THREE.Vector3(-5, 0, 5),
  ];

  private readonly _exitOffsets: THREE.Vector3[] = [
    new THREE.Vector3(3, 0, 0),
    new THREE.Vector3(-3, 0, 0),
    new THREE.Vector3(0, 0, 3),
    new THREE.Vector3(0, 0, -3),
  ];

  // Pre-allocated Rapier rays
  private _horizontalRay: RAPIER.Ray | null = null;
  private _downRay: RAPIER.Ray | null = null;

  // Pre-calculated squared enter distance
  private readonly ENTER_DISTANCE_SQ = VEHICLE_INTERACTION.ENTER_DISTANCE * VEHICLE_INTERACTION.ENTER_DISTANCE;

  // Callbacks
  private onTierUnlocked: ((tierName: string) => void) | null = null;
  private onVehicleExit: ((vehiclePos: THREE.Vector3) => void) | null = null;
  private onCameraShake: ((intensity: number) => void) | null = null;

  constructor(scene: THREE.Scene, getWorld: () => RAPIER.World | null) {
    this.scene = scene;
    this.getWorld = getWorld;
  }

  setCallbacks(callbacks: {
    onTierUnlocked?: (tierName: string) => void;
    onVehicleExit?: (vehiclePos: THREE.Vector3) => void;
    onCameraShake?: (intensity: number) => void;
  }): void {
    this.onTierUnlocked = callbacks.onTierUnlocked || null;
    this.onVehicleExit = callbacks.onVehicleExit || null;
    this.onCameraShake = callbacks.onCameraShake || null;
  }

  // Getters
  getVehicle(): Vehicle | null { return this.vehicle; }
  getAwaitingVehicle(): Vehicle | null { return this.awaitingVehicle; }
  isPlayerInVehicle(): boolean { return this.isInVehicle; }
  isVehicleSpawned(): boolean { return this.vehicleSpawned; }
  getCurrentTier(): Tier | null { return this.currentVehicleTier; }

  getCurrentVehicleType(): VehicleType | null {
    if (!this.vehicleSpawned || !this.currentVehicleTier) return null;
    return TIER_VEHICLE_MAP[this.currentVehicleTier] || null;
  }

  /**
   * Spawn a vehicle for the given tier
   */
  spawnVehicle(tier: Tier, player: Player): void {
    if (!player || this.vehicleSpawned) return;

    const vehicleType = TIER_VEHICLE_MAP[tier];
    if (!vehicleType) return;

    const vehicleConfig = VEHICLE_CONFIGS[vehicleType];
    const world = this.getWorld();
    if (!world) return;

    const playerPos = player.getPosition();
    const spawnPos = this.findSafeVehicleSpawnPosition(playerPos);

    this.vehicle = new Vehicle(vehicleConfig);
    this.vehicle.createPhysicsBody(world, spawnPos);
    this.scene.add(this.vehicle);

    this.vehicle.setOnDestroyed(() => {
      this.exitVehicle(player);
    });

    this.vehicleSpawned = true;
    this.currentVehicleTier = tier;

    const tierConfig = TIER_CONFIGS[tier];
    this.onTierUnlocked?.(`${tierConfig.name.toUpperCase()} UNLOCKED!`);
  }

  /**
   * Spawn awaiting vehicle (next tier upgrade)
   */
  spawnAwaitingVehicle(tier: Tier, sourcePos: THREE.Vector3): void {
    if (this.awaitingVehicle) return;

    const vehicleType = TIER_VEHICLE_MAP[tier];
    if (!vehicleType) return;

    const vehicleConfig = VEHICLE_CONFIGS[vehicleType];
    const world = this.getWorld();
    if (!world) return;

    const spawnPos = this.findSafeVehicleSpawnPosition(sourcePos);

    this.awaitingVehicle = new Vehicle(vehicleConfig);
    this.awaitingVehicle.createPhysicsBody(world, spawnPos);
    this.scene.add(this.awaitingVehicle);

    this.awaitingVehicleTier = tier;
    this.awaitingVehicleGlowTime = 0;

    // Start the glow effect and cache materials
    this.setVehicleGlow(this.awaitingVehicle, 1.0, 0x00ffaa, true);

    const tierConfig = TIER_CONFIGS[tier];
    this.onTierUnlocked?.(`${tierConfig.name.toUpperCase()} UNLOCKED!`);
  }

  /**
   * Check if player should receive next tier vehicle based on score
   */
  checkTierProgression(player: Player, score: number): Tier | null {
    if (!player) return null;

    // Don't spawn awaiting vehicle if one already exists
    if (this.awaitingVehicle) return null;

    // Determine current effective tier
    const effectiveTier = this.isInVehicle ? this.currentVehicleTier :
                          this.vehicleSpawned ? this.currentVehicleTier : Tier.FOOT;

    // Check for next tier unlock
    let nextTier: Tier | null = null;

    if (effectiveTier === Tier.FOOT || effectiveTier === null) {
      if (score >= TIER_CONFIGS[Tier.BIKE].minScore) {
        nextTier = Tier.BIKE;
      }
    } else if (effectiveTier === Tier.BIKE) {
      if (score >= TIER_CONFIGS[Tier.MOTO].minScore) {
        nextTier = Tier.MOTO;
      }
    } else if (effectiveTier === Tier.MOTO) {
      if (score >= TIER_CONFIGS[Tier.SEDAN].minScore) {
        nextTier = Tier.SEDAN;
      }
    } else if (effectiveTier === Tier.SEDAN) {
      if (score >= TIER_CONFIGS[Tier.TRUCK].minScore) {
        nextTier = Tier.TRUCK;
      }
    }

    return nextTier;
  }

  /**
   * Enter the current vehicle
   */
  enterVehicle(player: Player): boolean {
    if (!player || !this.vehicle || this.isInVehicle) return false;

    const riderConfig = this.vehicle.getRiderConfig();

    if (riderConfig.hideRider) {
      player.setVisible(false);
    } else {
      player.setVisible(true);
      (this.vehicle as THREE.Group).add(player);
      (player as THREE.Group).position.set(0, riderConfig.offsetY, riderConfig.offsetZ);
      (player as THREE.Group).rotation.set(0, 0, 0);
      player.playSeatedAnimation();
    }

    this.isInVehicle = true;
    this.onCameraShake?.(1.0);

    return true;
  }

  /**
   * Exit the current vehicle
   */
  exitVehicle(player: Player): THREE.Vector3 | null {
    if (!this.vehicle || !player) return null;

    const vehiclePos = this.vehicle.getPosition().clone();
    const safePos = this.findSafeExitPosition(vehiclePos);

    if ((player as THREE.Group).parent === this.vehicle) {
      (this.vehicle as THREE.Group).remove(player);
      this.scene.add(player);
      this.scene.add(player.getBlobShadow());
    }

    player.setVisible(true);

    this.scene.remove(this.vehicle);
    this.vehicle.dispose();
    this.vehicle = null;

    this.isInVehicle = false;
    this.vehicleSpawned = false;
    this.currentVehicleTier = null;

    this.onCameraShake?.(2.0);
    this.onVehicleExit?.(vehiclePos);

    return safePos;
  }

  /**
   * Switch from current vehicle to awaiting vehicle
   */
  switchToAwaitingVehicle(player: Player): boolean {
    if (!this.awaitingVehicle || !player) return false;

    // Exit current vehicle if in one
    if (this.isInVehicle && this.vehicle) {
      if ((player as THREE.Group).parent === this.vehicle) {
        (this.vehicle as THREE.Group).remove(player);
        this.scene.add(player);
        this.scene.add(player.getBlobShadow());
      }
      player.setVisible(true);

      // Queue old vehicle for cleanup
      this.vehiclesToCleanup.push({ vehicle: this.vehicle, timer: 3.0 });
      this.vehicle = null;
      this.isInVehicle = false;
    }

    // Clear glow from awaiting vehicle
    this.setVehicleGlow(this.awaitingVehicle, 0, 0x000000);

    // Make awaiting vehicle the current vehicle
    this.vehicle = this.awaitingVehicle;
    this.currentVehicleTier = this.awaitingVehicleTier;
    this.vehicleSpawned = true;

    // Clear awaiting state
    this.awaitingVehicle = null;
    this.awaitingVehicleTier = null;
    this.awaitingVehicleGlowTime = 0;
    this.awaitingVehicleMaterials = [];

    // Enter the new vehicle
    this.enterVehicle(player);

    return true;
  }

  /**
   * Check if player is near the current vehicle
   */
  isPlayerNearVehicle(player: Player): boolean {
    if (!player || !this.vehicle) return false;

    const playerPos = player.getPosition();
    const vehiclePos = this.vehicle.getPosition();
    const distanceSq = playerPos.distanceToSquared(vehiclePos);

    return distanceSq < this.ENTER_DISTANCE_SQ;
  }

  /**
   * Check if player is near the awaiting vehicle
   */
  isPlayerNearAwaitingVehicle(player: Player): boolean {
    if (!player || !this.awaitingVehicle) return false;

    const playerPos = player.getPosition();
    const vehiclePos = this.awaitingVehicle.getPosition();
    const distanceSq = playerPos.distanceToSquared(vehiclePos);

    return distanceSq < this.ENTER_DISTANCE_SQ;
  }

  /**
   * Update per frame
   */
  update(dt: number): void {
    this.updateAwaitingVehicleGlow(dt);
    this.updateVehicleCleanup(dt);
  }

  /**
   * Update awaiting vehicle glow effect (pulsing animation)
   */
  private updateAwaitingVehicleGlow(dt: number): void {
    if (!this.awaitingVehicle || this.awaitingVehicleMaterials.length === 0) return;

    this.awaitingVehicleGlowTime += dt;

    // Pulsing glow: oscillate between 0.5 and 1.5 intensity
    const pulseSpeed = 3;
    const intensity = 0.8 + 0.5 * Math.sin(this.awaitingVehicleGlowTime * pulseSpeed * Math.PI * 2);

    for (const mat of this.awaitingVehicleMaterials) {
      mat.emissiveIntensity = intensity;
    }
  }

  /**
   * Update vehicles pending cleanup
   */
  private updateVehicleCleanup(dt: number): void {
    for (let i = this.vehiclesToCleanup.length - 1; i >= 0; i--) {
      const entry = this.vehiclesToCleanup[i];
      entry.timer -= dt;

      if (entry.timer <= 0) {
        this.scene.remove(entry.vehicle);
        entry.vehicle.dispose();
        this.vehiclesToCleanup.splice(i, 1);
      }
    }
  }

  /**
   * Set glow effect on a vehicle
   */
  private setVehicleGlow(vehicle: Vehicle, intensity: number, color: number, cacheForUpdates: boolean = false): void {
    if (cacheForUpdates) {
      this.awaitingVehicleMaterials = [];
    }

    (vehicle as THREE.Group).traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat.emissive) {
          mat.emissive.setHex(color);
          mat.emissiveIntensity = intensity;
          if (cacheForUpdates) {
            this.awaitingVehicleMaterials.push(mat);
          }
        }
      }
    });
  }

  /**
   * Find a safe position to spawn a vehicle
   */
  private findSafeVehicleSpawnPosition(playerPos: THREE.Vector3): THREE.Vector3 {
    const world = this.getWorld();
    if (!world) {
      this._tempSpawnTestPos.copy(playerPos).add(this._spawnOffsets[0]);
      return this._tempSpawnTestPos.clone();
    }

    const BUILDING_GROUP = COLLISION_GROUPS.BUILDING;
    const GROUND_GROUP = COLLISION_GROUPS.GROUND;

    if (!this._horizontalRay) {
      this._horizontalRay = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    }
    if (!this._downRay) {
      this._downRay = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 0, y: -1, z: 0 });
    }

    for (const offset of this._spawnOffsets) {
      this._tempSpawnTestPos.copy(playerPos).add(offset);
      this._tempSpawnDir.copy(offset).normalize();

      this._horizontalRay.origin.x = playerPos.x;
      this._horizontalRay.origin.y = playerPos.y + 1;
      this._horizontalRay.origin.z = playerPos.z;
      this._horizontalRay.dir.x = this._tempSpawnDir.x;
      this._horizontalRay.dir.y = 0;
      this._horizontalRay.dir.z = this._tempSpawnDir.z;

      const horizontalHit = world.castRay(this._horizontalRay, offset.length(), true);
      if (horizontalHit) {
        const hitGroups = horizontalHit.collider.collisionGroups() & 0xFFFF;
        if (hitGroups === BUILDING_GROUP) {
          continue;
        }
      }

      this._downRay.origin.x = this._tempSpawnTestPos.x;
      this._downRay.origin.y = this._tempSpawnTestPos.y + 10;
      this._downRay.origin.z = this._tempSpawnTestPos.z;

      const downHit = world.castRay(this._downRay, 15, true);
      if (downHit) {
        const hitGroups = downHit.collider.collisionGroups() & 0xFFFF;
        if (hitGroups === GROUND_GROUP) {
          return this._tempSpawnTestPos.clone();
        }
      }
    }

    return playerPos.clone();
  }

  /**
   * Find a safe position to exit a vehicle
   */
  private findSafeExitPosition(vehiclePos: THREE.Vector3): THREE.Vector3 {
    const world = this.getWorld();
    if (!world) return vehiclePos;

    const BUILDING_GROUP = COLLISION_GROUPS.BUILDING;

    if (!this._horizontalRay) {
      this._horizontalRay = new RAPIER.Ray({ x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 });
    }

    for (const offset of this._exitOffsets) {
      this._tempSpawnTestPos.copy(vehiclePos).add(offset);
      this._tempSpawnDir.copy(offset).normalize();

      this._horizontalRay.origin.x = vehiclePos.x;
      this._horizontalRay.origin.y = vehiclePos.y + 1;
      this._horizontalRay.origin.z = vehiclePos.z;
      this._horizontalRay.dir.x = this._tempSpawnDir.x;
      this._horizontalRay.dir.y = 0;
      this._horizontalRay.dir.z = this._tempSpawnDir.z;

      const hit = world.castRay(this._horizontalRay, offset.length(), true);
      if (hit) {
        const hitGroups = hit.collider.collisionGroups() & 0xFFFF;
        if (hitGroups === BUILDING_GROUP) {
          continue;
        }
      }

      return this._tempSpawnTestPos.clone();
    }

    return vehiclePos.clone();
  }

  /**
   * Debug: Spawn a specific vehicle type
   */
  debugSpawnVehicle(vehicleType: VehicleType | null, player: Player): void {
    if (this.isInVehicle) return;

    // Clean up current vehicle
    if (this.vehicle) {
      this.scene.remove(this.vehicle);
      this.vehicle.dispose();
      this.vehicle = null;
    }

    // Clean up awaiting vehicle
    if (this.awaitingVehicle) {
      this.scene.remove(this.awaitingVehicle);
      this.awaitingVehicle.dispose();
      this.awaitingVehicle = null;
      this.awaitingVehicleTier = null;
      this.awaitingVehicleGlowTime = 0;
      this.awaitingVehicleMaterials = [];
    }

    this.vehicleSpawned = false;
    this.currentVehicleTier = null;

    if (!vehicleType) return;

    let targetTier: Tier | undefined;
    if (vehicleType === VehicleType.BICYCLE) targetTier = Tier.BIKE;
    else if (vehicleType === VehicleType.MOTORBIKE) targetTier = Tier.MOTO;
    else if (vehicleType === VehicleType.SEDAN) targetTier = Tier.SEDAN;
    else if (vehicleType === VehicleType.TRUCK) targetTier = Tier.TRUCK;

    if (targetTier && player) {
      this.spawnVehicle(targetTier, player);
    }
  }

  /**
   * Clear all vehicles
   */
  clear(): void {
    if (this.vehicle) {
      this.scene.remove(this.vehicle);
      this.vehicle.dispose();
      this.vehicle = null;
    }

    if (this.awaitingVehicle) {
      this.scene.remove(this.awaitingVehicle);
      this.awaitingVehicle.dispose();
      this.awaitingVehicle = null;
    }

    for (const entry of this.vehiclesToCleanup) {
      this.scene.remove(entry.vehicle);
      entry.vehicle.dispose();
    }
    this.vehiclesToCleanup = [];

    this.isInVehicle = false;
    this.vehicleSpawned = false;
    this.currentVehicleTier = null;
    this.awaitingVehicleTier = null;
    this.awaitingVehicleGlowTime = 0;
    this.awaitingVehicleMaterials = [];
  }
}
