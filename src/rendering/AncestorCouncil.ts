import * as THREE from 'three';
import { AssetLoader } from '../core/AssetLoader';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

/**
 * AncestorCouncil
 *
 * 9 ghostly figures that appear during Rampage mode, circling around the player.
 * They follow the player like a spectral council, tied to their position.
 */

// Spiral configuration
const SPIRAL_CONFIG = {
  COUNT: 120,                   // Total number of ancestors (more = closer together along spiral)
  INNER_RADIUS: 4,              // Closest to player (meters)
  OUTER_RADIUS: 28,             // Farthest from player (meters)
  ROTATION_SPEED: 0.4,          // Radians per second
  GHOST_OPACITY: 0.6,
  GHOST_EMISSIVE: new THREE.Color(0.8, 0.2, 0.2), // Red glow
  GHOST_COLOR: new THREE.Color(0.9, 0.9, 1.0),    // Pale white-blue
};

/**
 * 8 distinct ancestor models - cycled through the spiral (1,2,3,4,5,6,7,8,1,2,3,4,5,6,7,8...)
 * Custom princess/royalty ghost models with optimized meshes and 256x256 textures.
 * The ghostly material is applied automatically (pale white-blue + red emissive glow)
 */
const ANCESTOR_MODELS = [
  '/assets/ancestors/ancestor_1.glb',  // Sunlit Smile - golden dress
  '/assets/ancestors/ancestor_2.glb',  // Emerald Elegance
  '/assets/ancestors/ancestor_3.glb',  // Emerald Elegance variant
  '/assets/ancestors/ancestor_4.glb',  // Princess Serenity
  '/assets/ancestors/ancestor_5.glb',  // Princess in Red
  '/assets/ancestors/ancestor_6.glb',  // Regal Relaxation
  '/assets/ancestors/ancestor_7.glb',  // Princess of the Polygon
  '/assets/ancestors/ancestor_8.glb',  // Golden Serenity
];

// Spiral configuration
const ARM_SPACING = 3; // Fixed distance between spiral arms (meters)

/**
 * Calculate spiral position for index i
 * Uses Fermat spiral for equal radial spacing between arms
 */
function getSpiralPosition(
  index: number,
  totalCount: number,
  innerRadius: number,
  outerRadius: number,
  rotationOffset: number = 0
): { x: number; z: number; angle: number } {
  // Normalized position (0 to 1)
  const t = index / (totalCount - 1);

  // Linear radius from inner to outer
  const radius = innerRadius + t * (outerRadius - innerRadius);

  // Angle based on radius to maintain constant arm spacing
  // Each full turn adds ARM_SPACING to radius, so angle = (radius - innerRadius) / ARM_SPACING * 2π
  const angle = ((radius - innerRadius) / ARM_SPACING) * Math.PI * 2 + rotationOffset;

  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
    angle: angle + Math.PI, // Face inward
  };
}

interface Ancestor {
  mesh: THREE.Group;
  spiralIndex: number; // Position in spiral (0 to COUNT-1)
  originalMaterials: THREE.Material[]; // Store originals for disposal
  ghostMaterials: THREE.MeshStandardMaterial[]; // Cache for fast opacity updates
  // Random flicker state
  flickerPhase: number; // Unique phase offset for each ancestor
  flickerSpeed: number; // Unique speed for each ancestor
}

export class AncestorCouncil {
  private scene: THREE.Scene;
  private ancestors: Ancestor[] = [];
  private isActive = false;
  private targetOpacity = 0;
  private currentOpacity = 0;

  // Spiral rotation
  private spiralRotation = 0;

  // Player position tracking
  private playerPosition = new THREE.Vector3();
  private lastPlayerPosition = new THREE.Vector3();

  // Dynamic radius expansion when moving
  private radiusExpansion = 0; // 0 = contracted, 1 = expanded
  private readonly EXPANSION_AMOUNT = 3; // Extra meters when moving

  // Debug visualization - line through spiral path (renderOrder >= 999 survives rampage)
  private debugLine: THREE.Line | null = null;
  private debugLineGeometry: THREE.BufferGeometry | null = null;

  // Animation time for flickering
  private animTime = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Pre-load ancestor models - call during game init
   */
  async preload(): Promise<void> {
    const assetLoader = AssetLoader.getInstance();

    // Pre-load all unique models
    const uniqueModels = new Map<string, ReturnType<typeof assetLoader.getModel>>();
    for (const path of ANCESTOR_MODELS) {
      if (!uniqueModels.has(path)) {
        uniqueModels.set(path, assetLoader.getModel(path));
      }
    }

    // Create COUNT ancestors, randomly selecting models for variety
    for (let i = 0; i < SPIRAL_CONFIG.COUNT; i++) {
      const modelIndex = Math.floor(Math.random() * ANCESTOR_MODELS.length);
      const path = ANCESTOR_MODELS[modelIndex];
      const gltf = uniqueModels.get(path);

      if (!gltf) {
        console.warn(`[AncestorCouncil] Model not found: ${path}`);
        continue;
      }

      // Clone the model
      const mesh = SkeletonUtils.clone(gltf.scene) as THREE.Group;

      // Scale ancestors - they're ~1 unit, pedestrians are ~3.3 units
      // Ancestors stay lying down as ghostly reclining figures
      mesh.scale.setScalar(1.8);

      const originalMaterials: THREE.Material[] = [];
      const ghostMaterials: THREE.MeshStandardMaterial[] = [];

      // Apply semi-ghostly material (50% original color + 50% ghost effect)
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const materials = Array.isArray(child.material) ? child.material : [child.material];

          materials.forEach((mat, idx) => {
            originalMaterials.push(mat);

            // Clone original material and add ghost effect
            if (mat instanceof THREE.MeshStandardMaterial) {
              const ghostMat = mat.clone();
              // Blend original color with ghost color (50/50)
              ghostMat.color.lerp(SPIRAL_CONFIG.GHOST_COLOR, 0.5);
              // Add subtle red emissive glow
              ghostMat.emissive = SPIRAL_CONFIG.GHOST_EMISSIVE.clone();
              ghostMat.emissiveIntensity = 0.25;
              ghostMat.transparent = true;
              ghostMat.opacity = 0;
              ghostMat.side = THREE.DoubleSide;
              ghostMat.depthWrite = false;

              // Cache for fast updates
              ghostMaterials.push(ghostMat);

              if (Array.isArray(child.material)) {
                child.material[idx] = ghostMat;
              } else {
                child.material = ghostMat;
              }
            }
          });
        }
      });

      mesh.visible = false;
      // Must be >= 999 on ALL children to survive setEnvironmentVisible(false)
      mesh.traverse((child) => {
        child.renderOrder = 1000;
      });
      this.scene.add(mesh);

      this.ancestors.push({
        mesh,
        spiralIndex: i,
        originalMaterials,
        ghostMaterials,
        // Random flicker parameters for each ancestor
        flickerPhase: Math.random() * Math.PI * 2,
        flickerSpeed: 0.5 + Math.random() * 1.5, // 0.5 to 2.0 Hz
      });
    }

    // Create debug line to visualize spiral path
    this.createDebugLine();
  }

  // Shader uniforms for animated ghost spiral
  private spiralTime = 0;
  private spiralMaterial: THREE.ShaderMaterial | null = null;

  /**
   * Create animated ghostly spiral line
   */
  private createDebugLine(): void {
    // Create initial curve points (more points = smoother curve)
    const points: THREE.Vector3[] = [];
    const numPoints = 300;
    const radialRange = SPIRAL_CONFIG.OUTER_RADIUS - SPIRAL_CONFIG.INNER_RADIUS;

    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const radius = SPIRAL_CONFIG.INNER_RADIUS + t * radialRange;
      // Match the ancestor spiral: angle based on radius for constant arm spacing
      const angle = ((radius - SPIRAL_CONFIG.INNER_RADIUS) / ARM_SPACING) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0.5,
        Math.sin(angle) * radius
      ));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    this.debugLineGeometry = new THREE.TubeGeometry(curve, 300, 0.04, 8, false);

    // Custom shader for animated ghostly effect
    this.spiralMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(0.9, 0.85, 1.0) },
        glowColor: { value: new THREE.Color(0.8, 0.2, 0.3) },
        opacity: { value: 0.35 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 glowColor;
        uniform float opacity;
        varying vec2 vUv;
        varying vec3 vPosition;

        // Simple noise function
        float noise(float x) {
          return fract(sin(x * 12.9898) * 43758.5453);
        }

        void main() {
          // Flowing waves along the spiral
          float wave1 = sin(vUv.x * 20.0 - time * 3.0) * 0.5 + 0.5;
          float wave2 = sin(vUv.x * 35.0 + time * 2.0) * 0.5 + 0.5;
          float wave3 = sin(vUv.x * 8.0 - time * 1.5) * 0.5 + 0.5;

          // Combine waves for ghostly pulsing
          float pulse = wave1 * 0.4 + wave2 * 0.3 + wave3 * 0.3;

          // Add some sparkle/flicker
          float flicker = noise(vUv.x * 100.0 + time * 10.0);
          float sparkle = step(0.97, flicker) * 0.5;

          // Mix colors based on pulse
          vec3 color = mix(baseColor, glowColor, pulse * 0.6);

          // Final opacity with pulse and sparkle
          float finalOpacity = opacity * (0.5 + pulse * 0.5) + sparkle;

          // Fade at edges of tube
          float edgeFade = 1.0 - abs(vUv.y - 0.5) * 2.0;
          finalOpacity *= edgeFade;

          gl_FragColor = vec4(color, finalOpacity);
        }
      `,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.debugLine = new THREE.Mesh(this.debugLineGeometry, this.spiralMaterial) as unknown as THREE.Line;
    this.debugLine.visible = false;
    this.debugLine.renderOrder = 999;
    this.scene.add(this.debugLine);
  }

  /**
   * Show ancestors (rampage mode enter)
   */
  enter(): void {
    if (this.isActive) return;
    this.isActive = true;
    this.targetOpacity = SPIRAL_CONFIG.GHOST_OPACITY;
    this.currentOpacity = SPIRAL_CONFIG.GHOST_OPACITY; // Start visible immediately

    for (const ancestor of this.ancestors) {
      ancestor.mesh.visible = true;
      // Use cached materials for fast opacity update
      for (const mat of ancestor.ghostMaterials) {
        mat.opacity = SPIRAL_CONFIG.GHOST_OPACITY;
      }
    }

    // Show debug line
    if (this.debugLine) {
      this.debugLine.visible = true;
    }
  }

  /**
   * Hide ancestors (rampage mode exit)
   */
  exit(): void {
    if (!this.isActive) return;
    this.isActive = false;
    this.targetOpacity = 0;

    // Hide debug line
    if (this.debugLine) {
      this.debugLine.visible = false;
    }
  }

  /**
   * Update ancestor positions and opacity
   */
  update(dt: number, playerPosition: THREE.Vector3, isMoving: boolean): void {
    // Update animation time for flickering
    this.animTime += dt;
    this.playerPosition.copy(playerPosition);

    // Target based on input state: moving = expanded, stopped = contracted
    const target = isMoving ? 1 : 0;

    // Animate toward target (same speed both ways)
    const speed = 3.0;
    if (this.radiusExpansion < target) {
      this.radiusExpansion = Math.min(target, this.radiusExpansion + dt * speed);
    } else if (this.radiusExpansion > target) {
      this.radiusExpansion = Math.max(target, this.radiusExpansion - dt * speed);
    }

    // Ease-in-out for smooth motion
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const easedExpansion = easeInOut(this.radiusExpansion);

    // Smooth opacity transition
    const lerpSpeed = this.isActive ? 4.0 : 2.0;
    this.currentOpacity += (this.targetOpacity - this.currentOpacity) * Math.min(1, dt * lerpSpeed);

    // Hide when fully faded
    if (!this.isActive && this.currentOpacity < 0.01) {
      for (const ancestor of this.ancestors) {
        ancestor.mesh.visible = false;
      }
      return;
    }

    // Rotate the spiral
    this.spiralRotation += dt * SPIRAL_CONFIG.ROTATION_SPEED;

    // Calculate expanded radii using eased value
    const expansion = easedExpansion * this.EXPANSION_AMOUNT;
    const innerRadius = SPIRAL_CONFIG.INNER_RADIUS + expansion;
    const outerRadius = SPIRAL_CONFIG.OUTER_RADIUS + expansion;

    // Update each ancestor position using spiral math
    for (const ancestor of this.ancestors) {
      const pos = getSpiralPosition(
        ancestor.spiralIndex,
        SPIRAL_CONFIG.COUNT,
        innerRadius,
        outerRadius,
        this.spiralRotation
      );

      // Position in spiral around player
      ancestor.mesh.position.set(
        this.playerPosition.x + pos.x,
        0, // Ground level
        this.playerPosition.z + pos.z
      );

      // Calculate flicker: oscillates between 0.5 and 1.0 of base opacity
      const flicker = 0.5 + 0.5 * Math.sin(this.animTime * ancestor.flickerSpeed * Math.PI * 2 + ancestor.flickerPhase);
      const finalOpacity = this.currentOpacity * (0.5 + flicker * 0.5);

      // Use cached materials for fast opacity update (no traverse needed)
      for (const mat of ancestor.ghostMaterials) {
        mat.opacity = finalOpacity;
      }
    }

    // Update debug line positions
    this.updateDebugLine(expansion, dt);
  }

  /**
   * Update debug tube position (follows player, rotates, and scales with expansion)
   */
  private updateDebugLine(expansion: number, dt: number): void {
    if (!this.debugLine) return;

    // Update shader time for animation
    this.spiralTime += dt;
    if (this.spiralMaterial) {
      this.spiralMaterial.uniforms.time.value = this.spiralTime;
    }

    // Move tube to player position and rotate with spiral
    this.debugLine.position.set(this.playerPosition.x, 0, this.playerPosition.z);
    this.debugLine.rotation.y = this.spiralRotation;

    // Scale to match ancestor expansion
    const baseAvgRadius = (SPIRAL_CONFIG.INNER_RADIUS + SPIRAL_CONFIG.OUTER_RADIUS) / 2;
    const scale = 1 + expansion / baseAvgRadius;
    this.debugLine.scale.set(scale, 1, scale);
  }

  /**
   * Check if council is active
   */
  isCouncilActive(): boolean {
    return this.isActive;
  }

  /**
   * Dispose all resources
   */
  dispose(): void {
    for (const ancestor of this.ancestors) {
      this.scene.remove(ancestor.mesh);

      // Dispose cached ghost materials (faster than traversing)
      for (const mat of ancestor.ghostMaterials) {
        mat.dispose();
      }

      // Dispose original materials
      for (const mat of ancestor.originalMaterials) {
        mat.dispose();
      }

      // Dispose any geometries in the mesh
      ancestor.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          child.geometry.dispose();
        }
      });
    }

    // Dispose debug line
    if (this.debugLine) {
      this.scene.remove(this.debugLine);
      this.debugLineGeometry?.dispose();
      (this.debugLine.material as THREE.Material).dispose();
      this.debugLine = null;
      this.debugLineGeometry = null;
    }

    // Dispose spiral material
    if (this.spiralMaterial) {
      this.spiralMaterial.dispose();
      this.spiralMaterial = null;
    }

    this.ancestors = [];
  }
}
