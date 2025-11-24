import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d-compat';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as YUKA from 'yuka';

/**
 * Cop Entity
 *
 * Police officer that:
 * - Chases player using Yuka seek behavior
 * - Slightly faster than player walk speed
 * - Deals contact damage
 * - Can be killed by player attacks
 */
export class Cop extends THREE.Group {
  private rigidBody: RAPIER.RigidBody;
  private collider: RAPIER.Collider;
  private world: RAPIER.World;
  private mixer: THREE.AnimationMixer | null = null;
  private animations: THREE.AnimationClip[] = [];
  private currentAnimation: string = 'Idle';
  private modelLoaded: boolean = false;

  // Yuka AI
  private yukaVehicle: YUKA.Vehicle;
  private yukaEntityManager: YUKA.EntityManager;

  // State
  private isDead: boolean = false;
  private health: number = 1;
  private chaseSpeed: number = 9.0; // Much faster than player

  constructor(
    position: THREE.Vector3,
    world: RAPIER.World,
    entityManager: YUKA.EntityManager
  ) {
    super();

    this.yukaEntityManager = entityManager;
    this.world = world;

    // Create Yuka vehicle for AI steering
    this.yukaVehicle = new YUKA.Vehicle();
    this.yukaVehicle.position.copy(position);
    this.yukaVehicle.maxSpeed = this.chaseSpeed;
    this.yukaVehicle.maxForce = 10.0; // High force for fast acceleration
    this.yukaVehicle.updateOrientation = false;

    // Add to Yuka entity manager
    this.yukaEntityManager.add(this.yukaVehicle);

    // Create Rapier physics body
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y, position.z);
    this.rigidBody = world.createRigidBody(bodyDesc);

    // Create capsule collider with cop-to-cop collision
    // Membership: COP (0x0008)
    // Filter: GROUND (0x0001) + COP (0x0008) = 0x0009
    // Format: (filter << 16) | membership
    const membership = 0x0008; // COP group
    const filter = 0x0001 | 0x0008; // Collide with GROUND and other COPS
    const collisionGroups = (filter << 16) | membership;

    const colliderDesc = RAPIER.ColliderDesc.capsule(0.3, 0.3)
      .setCollisionGroups(collisionGroups)
      .setTranslation(0, 0.6, 0);
    this.collider = world.createCollider(colliderDesc, this.rigidBody);

    // Load police character model
    this.loadModel();

    console.log('[Cop] Created at', position);
  }

  /**
   * Load cop character model
   */
  private async loadModel(): Promise<void> {
    const loader = new GLTFLoader();

    // 80% male, 20% female distribution
    const isFemale = Math.random() < 0.2;
    const maleTypes = ['BlueSoldier_Male', 'Soldier_Male'];
    const femaleTypes = ['BlueSoldier_Female', 'Soldier_Female'];

    const copTypes = isFemale ? femaleTypes : maleTypes;
    const randomCop = copTypes[Math.floor(Math.random() * copTypes.length)];

    console.log('[Cop] Spawning', isFemale ? 'female' : 'male', 'cop:', randomCop);

    try {
      const gltf = await loader.loadAsync(`/assets/pedestrians/${randomCop}.gltf`);

      // European skin tone range (lighter to darker)
      const skinTones = [
        0xF5D0B8, // Very light peachy
        0xE8B196, // Light peachy tan
        0xDDA886, // Medium peachy
        0xD5A27A, // Light tan
        0xCCA070, // Medium tan
      ];

      // Pick random skin tone for this cop
      const randomSkinTone = skinTones[Math.floor(Math.random() * skinTones.length)];

      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = true;

          if (child.material) {
            const mat = child.material as THREE.MeshStandardMaterial;

            // Apply skin tone
            if (mat.name?.startsWith('Skin')) {
              mat.color.setHex(randomSkinTone);
            }

            // Tint cop uniform bright police blue
            if (mat.name?.startsWith('Main')) {
              mat.color.set(0x0066ff); // Bright police blue
            }

            // Tint helmet/gear dark navy
            if (mat.name?.startsWith('Helmet') || mat.name?.startsWith('Black') || mat.name?.startsWith('Grey')) {
              mat.color.set(0x001a4d); // Dark navy/black
            }
          }
        }
      });

      (this as THREE.Group).add(gltf.scene);

      // Setup animations
      this.mixer = new THREE.AnimationMixer(gltf.scene);
      this.mixer.timeScale = 1.5;
      this.animations = gltf.animations;

      this.playAnimation('Run', 0.3);
      this.modelLoaded = true;

      console.log('[Cop] Model loaded with', this.animations.length, 'animations');
    } catch (error) {
      console.error('[Cop] Failed to load model:', error);

      // Fallback: blue capsule
      const geometry = new THREE.CapsuleGeometry(0.3, 0.6, 8, 16);
      const material = new THREE.MeshPhongMaterial({ color: 0x0044cc });
      const fallbackMesh = new THREE.Mesh(geometry, material);
      fallbackMesh.castShadow = true;
      fallbackMesh.position.y = 0.6;
      this.add(fallbackMesh);
      this.modelLoaded = true;
    }
  }

  /**
   * Play animation by name
   */
  private playAnimation(clipName: string, fadeIn: number): void {
    if (!this.mixer || this.animations.length === 0) return;

    const clip = THREE.AnimationClip.findByName(this.animations, clipName);
    if (!clip) {
      console.warn(`[Cop] Animation '${clipName}' not found`);
      return;
    }

    this.mixer.stopAllAction();
    const action = this.mixer.clipAction(clip);
    action.fadeIn(fadeIn);
    action.play();

    this.currentAnimation = clipName;
  }

  /**
   * Set chase target (player position)
   */
  setChaseTarget(target: THREE.Vector3): void {
    if (this.isDead) return;

    // Clear existing behaviors
    this.yukaVehicle.steering.clear();

    // Flatten target to 2D to prevent vertical movement
    const flatTarget = new YUKA.Vector3(target.x, 0, target.z);

    // Chase player
    const seekBehavior = new YUKA.SeekBehavior(flatTarget);
    seekBehavior.weight = 0.8;
    this.yukaVehicle.steering.add(seekBehavior);

    // Separate from other cops to prevent overlapping
    const separationBehavior = new YUKA.SeparationBehavior();
    separationBehavior.weight = 1.5; // Strong separation
    this.yukaVehicle.steering.add(separationBehavior);

    // Add obstacle avoidance
    const obstacleBehavior = new YUKA.ObstacleAvoidanceBehavior();
    obstacleBehavior.weight = 0.3;
    this.yukaVehicle.steering.add(obstacleBehavior);
  }

  /**
   * Take damage
   */
  takeDamage(amount: number): void {
    if (this.isDead) return;

    this.health -= amount;

    if (this.health <= 0) {
      this.die();
    }
  }

  /**
   * Die
   */
  private die(): void {
    this.isDead = true;
    this.yukaVehicle.maxSpeed = 0;
    this.yukaVehicle.steering.clear();

    if (this.mixer && this.animations.length > 0) {
      this.playAnimation('Death', 0.1);
    }

    // Fade out and remove after delay
    setTimeout(() => {
      this.visible = false;
    }, 2000);
  }

  /**
   * Update cop AI and animation
   */
  update(deltaTime: number): void {
    if (!this.modelLoaded) return;

    // Update animation mixer
    if (this.mixer) {
      this.mixer.update(deltaTime);
    }

    if (this.isDead) return;

    // Get current and desired positions
    const currentPos = this.rigidBody.translation();
    const desiredX = this.yukaVehicle.position.x;
    const desiredZ = this.yukaVehicle.position.z;

    // Calculate movement delta
    const deltaX = desiredX - currentPos.x;
    const deltaZ = desiredZ - currentPos.z;
    const movement = { x: deltaX, y: 0.0, z: deltaZ };

    // Use Rapier's collision-aware movement (character controller style)
    // Compute corrected movement that doesn't penetrate other colliders
    const correctedMovement = this.world.computeColliderMovement(
      this.collider,
      movement,
      undefined, // Query filter groups (use collider's own)
      undefined  // Query filter (none)
    );

    // Apply corrected movement
    const newX = currentPos.x + correctedMovement.x;
    const newZ = currentPos.z + correctedMovement.z;
    const newPosition = new THREE.Vector3(newX, 0, newZ);

    // Update physics body
    this.rigidBody.setNextKinematicTranslation(newPosition);

    // Sync Three.js
    (this as THREE.Group).position.copy(newPosition);

    // Update Yuka position to match actual (corrected) position
    this.yukaVehicle.position.set(newX, 0, newZ);

    // Sync rotation
    if (this.yukaVehicle.velocity.length() > 0.1) {
      const angle = Math.atan2(this.yukaVehicle.velocity.x, this.yukaVehicle.velocity.z);
      (this as THREE.Group).rotation.y = angle;
    }

    // Update animation based on movement
    const speed = this.yukaVehicle.velocity.length();
    if (speed > 0.5) {
      if (this.currentAnimation !== 'Run') {
        this.playAnimation('Run', 0.1);
      }
    } else {
      if (this.currentAnimation !== 'Idle') {
        this.playAnimation('Idle', 0.2);
      }
    }
  }

  /**
   * Cleanup
   */
  dispose(): void {
    this.yukaEntityManager.remove(this.yukaVehicle);
  }

  /**
   * Check if cop is dead
   */
  isDeadState(): boolean {
    return this.isDead;
  }

  /**
   * Get Yuka vehicle for AI manager
   */
  getYukaVehicle(): YUKA.Vehicle {
    return this.yukaVehicle;
  }
}
