import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { AssetLoader } from '../core/AssetLoader';
import { AnimationHelper } from '../utils/AnimationHelper';

/**
 * Car config constants
 */
const CAR_CONFIG = {
  SPEED: 15, // Much faster than player sprint (7)
  MAX_HEALTH: 100,
  TURN_SPEED: 5, // Radians per second for rotation
  // Collider dimensions (half-extents)
  COLLIDER_WIDTH: 1.0,
  COLLIDER_HEIGHT: 0.5,
  COLLIDER_LENGTH: 2.0,
  // Collision groups
  COLLISION_GROUPS: {
    GROUND: 0x0001,
    BUILDING: 0x0040,
    VEHICLE: 0x0080,
  },
} as const;

/**
 * Car - Driveable vehicle entity
 * Unlocked at 10 kills, instantly kills pedestrians on contact
 * Only damaged by cop gunfire, explodes when health reaches 0
 */
export class Car extends THREE.Group {
  // Physics
  private rigidBody: RAPIER.RigidBody | null = null;
  private world: RAPIER.World | null = null;
  private collider: RAPIER.Collider | null = null;
  private characterController: RAPIER.KinematicCharacterController | null = null;

  // Visual
  private modelContainer: THREE.Group;
  private modelLoaded: boolean = false;

  // State
  private health: number = CAR_CONFIG.MAX_HEALTH;
  private maxHealth: number = CAR_CONFIG.MAX_HEALTH;
  private speed: number = CAR_CONFIG.SPEED;
  private isDestroyed: boolean = false;

  // Movement collision filter (only collide with GROUND and BUILDING, pass through cops/peds)
  private movementCollisionFilter: number =
    (CAR_CONFIG.COLLISION_GROUPS.GROUND | CAR_CONFIG.COLLISION_GROUPS.BUILDING) << 16 |
    CAR_CONFIG.COLLISION_GROUPS.VEHICLE;

  // Input state
  private input = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  // Callbacks
  private onDestroyedCallback: (() => void) | null = null;

  constructor() {
    super();

    // Model container
    this.modelContainer = new THREE.Group();
    this.modelContainer.position.y = 0; // Car sits on ground
    (this as THREE.Group).add(this.modelContainer);

    // Load car model
    this.loadModel();
  }

  /**
   * Load the car GLTF model from cache
   */
  private async loadModel(): Promise<void> {
    const modelPath = '/assets/vehicles/car.glb';

    try {
      const assetLoader = AssetLoader.getInstance();
      const cachedGltf = assetLoader.getModel(modelPath);

      if (!cachedGltf) {
        console.error(`[Car] Model not in cache: ${modelPath}`);
        this.createFallbackMesh();
        return;
      }

      // Clone the model scene
      const model = cachedGltf.scene.clone();

      // Setup shadows
      AnimationHelper.setupShadows(model);

      // Scale and position the model appropriately
      // The Sketchfab model may need adjustment
      model.scale.set(0.5, 0.5, 0.5); // Adjust based on model size
      model.rotation.y = Math.PI; // Face forward

      this.modelContainer.add(model);
      this.modelLoaded = true;

      console.log('[Car] Model loaded successfully');
    } catch (error) {
      console.error('[Car] Failed to load car model:', error);
      this.createFallbackMesh();
    }
  }

  /**
   * Create fallback box mesh when model loading fails
   */
  private createFallbackMesh(): void {
    const geometry = new THREE.BoxGeometry(
      CAR_CONFIG.COLLIDER_WIDTH * 2,
      CAR_CONFIG.COLLIDER_HEIGHT * 2,
      CAR_CONFIG.COLLIDER_LENGTH * 2
    );
    const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const fallbackMesh = new THREE.Mesh(geometry, material);
    fallbackMesh.castShadow = true;
    fallbackMesh.position.y = CAR_CONFIG.COLLIDER_HEIGHT;
    this.modelContainer.add(fallbackMesh);
    this.modelLoaded = true;
    console.log('[Car] Using fallback mesh');
  }

  /**
   * Create Rapier physics body
   */
  createPhysicsBody(world: RAPIER.World, position: THREE.Vector3): void {
    this.world = world;

    // Create kinematic position-based body (same as Player)
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y, position.z);

    this.rigidBody = world.createRigidBody(bodyDesc);

    // Create box collider for car
    // Membership: 0x0080 (VEHICLE group)
    // Filter: 0x0045 (can collide with GROUND=0x0001, PEDESTRIAN=0x0004, BUILDING=0x0040)
    const colliderDesc = RAPIER.ColliderDesc.cuboid(
      CAR_CONFIG.COLLIDER_WIDTH,
      CAR_CONFIG.COLLIDER_HEIGHT,
      CAR_CONFIG.COLLIDER_LENGTH
    ).setCollisionGroups(0x00450080); // Filter=0x0045, Membership=0x0080

    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    // Create character controller for collision handling
    this.characterController = world.createCharacterController(0.01);
    this.characterController.enableAutostep(0.3, 0.1, true);
    this.characterController.enableSnapToGround(0.3);

    // Sync visual position
    (this as THREE.Group).position.copy(position);

    console.log('[Car] Physics body created at', position);
  }

  /**
   * Spawn car at position
   */
  spawn(position: THREE.Vector3): void {
    if (this.rigidBody) {
      this.rigidBody.setTranslation(
        { x: position.x, y: position.y, z: position.z },
        true
      );
    }
    (this as THREE.Group).position.copy(position);
    this.health = this.maxHealth;
    this.isDestroyed = false;
  }

  /**
   * Handle keyboard input
   */
  handleInput(inputState: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    sprint?: boolean;
    jump?: boolean;
    attack?: boolean;
  }): void {
    // Only care about movement keys, ignore sprint/jump/attack
    this.input.up = inputState.up;
    this.input.down = inputState.down;
    this.input.left = inputState.left;
    this.input.right = inputState.right;
  }

  /**
   * Get movement direction (camera-relative, same as Player)
   */
  private getMovementDirection(): THREE.Vector3 {
    let x = 0;
    let z = 0;

    if (this.input.up) z -= 1;
    if (this.input.down) z += 1;
    if (this.input.left) x -= 1;
    if (this.input.right) x += 1;

    const dir = new THREE.Vector3(x, 0, z);
    return dir.length() > 0 ? dir.normalize() : dir;
  }

  /**
   * Update car movement
   */
  update(deltaTime: number): void {
    if (!this.rigidBody || this.isDestroyed) return;

    const translation = this.rigidBody.translation();
    const moveVector = this.getMovementDirection();
    const isMoving = moveVector.length() > 0;

    // Calculate velocity
    const velocity = moveVector.clone().multiplyScalar(this.speed);

    // Rotate car to face movement direction (smooth rotation)
    if (isMoving) {
      const targetAngle = Math.atan2(moveVector.x, moveVector.z);
      const currentRotation = (this as THREE.Group).rotation.y;
      const maxRotation = CAR_CONFIG.TURN_SPEED * deltaTime;

      // Calculate shortest rotation direction
      let angleDiff = targetAngle - currentRotation;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Apply rotation (clamped to max rotation speed)
      const rotationChange = Math.max(-maxRotation, Math.min(maxRotation, angleDiff));
      (this as THREE.Group).rotation.y += rotationChange;
    }

    // Use character controller to compute movement with collisions
    if (this.characterController && this.collider) {
      const desiredMovement = {
        x: velocity.x * deltaTime,
        y: -0.1 * deltaTime, // Small downward force to stay grounded
        z: velocity.z * deltaTime,
      };

      // Compute movement accounting for obstacles (only GROUND and BUILDING, pass through cops/peds)
      this.characterController.computeColliderMovement(
        this.collider,
        desiredMovement,
        undefined, // filterFlags
        this.movementCollisionFilter // Only collide with ground and buildings
      );

      // Get corrected movement
      const correctedMovement = this.characterController.computedMovement();

      // Apply to rigid body
      const newPosition = {
        x: translation.x + correctedMovement.x,
        y: Math.max(0.5, translation.y + correctedMovement.y), // Keep above ground
        z: translation.z + correctedMovement.z,
      };

      this.rigidBody.setNextKinematicTranslation(newPosition);

      // Sync visual position
      (this as THREE.Group).position.set(newPosition.x, newPosition.y, newPosition.z);
    }
  }

  /**
   * Take damage (from cop gunfire)
   */
  takeDamage(amount: number): void {
    if (this.isDestroyed) return;

    this.health = Math.max(0, this.health - amount);
    console.log(`[Car] Took ${amount} damage, health: ${this.health}/${this.maxHealth}`);

    // Flash red when hit
    this.flashDamage();

    // Check for destruction
    if (this.health <= 0) {
      this.explode();
    }
  }

  /**
   * Flash red when damaged
   */
  private flashDamage(): void {
    this.modelContainer.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        const originalEmissive = mat.emissive.getHex();
        mat.emissive.setHex(0xff0000);
        mat.emissiveIntensity = 0.8;

        // Reset after 100ms
        setTimeout(() => {
          mat.emissive.setHex(originalEmissive);
          mat.emissiveIntensity = 0;
        }, 100);
      }
    });
  }

  /**
   * Explode the car
   */
  private explode(): void {
    if (this.isDestroyed) return;

    this.isDestroyed = true;
    console.log('[Car] EXPLODED!');

    // Visual explosion effect - scale up briefly then hide
    const originalScale = this.modelContainer.scale.clone();
    this.modelContainer.scale.multiplyScalar(1.5);

    // Flash white
    this.modelContainer.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        mat.emissive.setHex(0xffff00);
        mat.emissiveIntensity = 2;
      }
    });

    // After brief delay, call destroyed callback
    setTimeout(() => {
      this.modelContainer.scale.copy(originalScale);
      this.modelContainer.visible = false;

      if (this.onDestroyedCallback) {
        this.onDestroyedCallback();
      }
    }, 200);
  }

  /**
   * Get car position
   */
  getPosition(): THREE.Vector3 {
    return (this as THREE.Group).position.clone();
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Get max health
   */
  getMaxHealth(): number {
    return this.maxHealth;
  }

  /**
   * Check if car is destroyed
   */
  isDestroyedState(): boolean {
    return this.isDestroyed;
  }

  /**
   * Set destroyed callback
   */
  setOnDestroyed(callback: () => void): void {
    this.onDestroyedCallback = callback;
  }

  /**
   * Cleanup physics body and mesh
   */
  dispose(): void {
    if (this.rigidBody && this.world) {
      this.world.removeRigidBody(this.rigidBody);
      this.rigidBody = null;
    }

    // Cleanup model
    this.modelContainer.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });

    console.log('[Car] Disposed');
  }
}
