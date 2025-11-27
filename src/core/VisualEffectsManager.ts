import * as THREE from 'three';

/**
 * VisualEffectsManager
 *
 * Handles visual effects:
 * - Camera shake
 * - Escape flash (taser escape)
 * - Explosion effects with shockwave
 */
export class VisualEffectsManager {
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  // Camera shake
  private cameraShakeIntensity: number = 0;
  private cameraShakeDecay: number = 5;
  private cameraBasePosition: THREE.Vector3 = new THREE.Vector3();
  private cameraBaseQuaternion: THREE.Quaternion = new THREE.Quaternion();

  // Escape flash effect
  private escapeFlashSprite: THREE.Sprite | null = null;
  private escapeFlashLife: number = 0;

  // Explosion effect
  private explosionSprite: THREE.Sprite | null = null;
  private explosionLife: number = 0;
  private shockwaveRing: THREE.Mesh | null = null;
  private shockwaveLife: number = 0;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
  }

  /**
   * Trigger camera shake
   */
  shakeCamera(intensity: number = 0.3): void {
    this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, intensity);
  }

  /**
   * Get current shake intensity (for external use)
   */
  getShakeIntensity(): number {
    return this.cameraShakeIntensity;
  }

  /**
   * Update camera shake effect
   */
  updateCameraShake(dt: number): void {
    if (this.cameraShakeIntensity > 0) {
      // Store base transform before applying shake
      this.cameraBasePosition.copy(this.camera.position);
      this.cameraBaseQuaternion.copy(this.camera.quaternion);

      // Apply random offset
      const shakeX = (Math.random() - 0.5) * this.cameraShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.cameraShakeIntensity;
      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;

      // Decay shake
      this.cameraShakeIntensity = Math.max(0, this.cameraShakeIntensity - this.cameraShakeDecay * dt);

      // Restore base transform after render (caller should call restoreCameraAfterShake)
    }
  }

  /**
   * Restore camera position after shake (call after render)
   */
  restoreCameraAfterShake(): void {
    if (this.cameraShakeIntensity > 0 || this.cameraBasePosition.lengthSq() > 0) {
      this.camera.position.copy(this.cameraBasePosition);
      this.camera.quaternion.copy(this.cameraBaseQuaternion);
    }
  }

  /**
   * Show a cartoonish flash effect at position during taser escape
   */
  showEscapeFlash(position: THREE.Vector3): void {
    // Create or reuse flash sprite
    if (!this.escapeFlashSprite) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      // Draw a cartoonish starburst/flash pattern
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 128, 128);

      // Radial gradient for glow
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255, 255, 100, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 255, 200, 0.9)');
      gradient.addColorStop(0.4, 'rgba(255, 200, 50, 0.7)');
      gradient.addColorStop(0.7, 'rgba(255, 150, 0, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();

      // Add starburst rays for cartoonish effect
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      const rays = 8;
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI * 2;
        const innerRadius = 20;
        const outerRadius = 55;
        ctx.beginPath();
        ctx.moveTo(64 + Math.cos(angle) * innerRadius, 64 + Math.sin(angle) * innerRadius);
        ctx.lineTo(64 + Math.cos(angle) * outerRadius, 64 + Math.sin(angle) * outerRadius);
        ctx.stroke();
      }

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      this.escapeFlashSprite = new THREE.Sprite(material);
      this.escapeFlashSprite.scale.set(3, 3, 1);
      this.scene.add(this.escapeFlashSprite);
    }

    // Position flash
    this.escapeFlashSprite.position.set(position.x, position.y + 1, position.z);
    this.escapeFlashSprite.visible = true;

    // Randomize rotation for variety
    this.escapeFlashSprite.material.rotation = Math.random() * Math.PI * 2;

    // Set life for fade out
    this.escapeFlashLife = 0.15; // 150ms flash
  }

  /**
   * Update escape flash effect
   */
  private updateEscapeFlash(dt: number): void {
    if (this.escapeFlashLife > 0 && this.escapeFlashSprite) {
      this.escapeFlashLife -= dt;
      const alpha = Math.max(0, this.escapeFlashLife / 0.15);
      this.escapeFlashSprite.material.opacity = alpha;
      // Scale up as it fades
      const scale = 3 + (1 - alpha) * 2;
      this.escapeFlashSprite.scale.set(scale, scale, 1);

      if (this.escapeFlashLife <= 0) {
        this.escapeFlashSprite.visible = false;
      }
    }
  }

  /**
   * Show big explosion effect when player escapes taser
   */
  showTaserEscapeExplosion(position: THREE.Vector3): void {
    // Create explosion sprite (bright flash)
    if (!this.explosionSprite) {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;

      // Big radial gradient explosion
      const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.2, 'rgba(255, 255, 150, 1)');
      gradient.addColorStop(0.4, 'rgba(255, 200, 50, 0.8)');
      gradient.addColorStop(0.6, 'rgba(255, 100, 0, 0.5)');
      gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(64, 64, 64, 0, Math.PI * 2);
      ctx.fill();

      const texture = new THREE.CanvasTexture(canvas);
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      this.explosionSprite = new THREE.Sprite(material);
      this.scene.add(this.explosionSprite);
    }

    // Create shockwave ring
    if (!this.shockwaveRing) {
      const ringGeometry = new THREE.RingGeometry(0.5, 1, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      });
      this.shockwaveRing = new THREE.Mesh(ringGeometry, ringMaterial);
      this.shockwaveRing.rotation.x = -Math.PI / 2; // Lay flat
      this.scene.add(this.shockwaveRing);
    }

    // Position and activate explosion
    this.explosionSprite.position.set(position.x, position.y + 1, position.z);
    this.explosionSprite.scale.set(2, 2, 1);
    this.explosionSprite.visible = true;
    this.explosionSprite.material.opacity = 1;
    this.explosionLife = 0.4;

    // Position and activate shockwave
    this.shockwaveRing.position.set(position.x, 0.1, position.z);
    this.shockwaveRing.scale.set(1, 1, 1);
    this.shockwaveRing.visible = true;
    (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = 0.8;
    this.shockwaveLife = 0.5;
  }

  /**
   * Update explosion and shockwave effects
   */
  private updateExplosionEffects(dt: number): void {
    // Update explosion sprite
    if (this.explosionLife > 0 && this.explosionSprite) {
      this.explosionLife -= dt;
      const progress = 1 - (this.explosionLife / 0.4);
      this.explosionSprite.material.opacity = 1 - progress;
      const scale = 2 + progress * 10; // Expand from 2 to 12
      this.explosionSprite.scale.set(scale, scale, 1);

      if (this.explosionLife <= 0) {
        this.explosionSprite.visible = false;
      }
    }

    // Update shockwave ring
    if (this.shockwaveLife > 0 && this.shockwaveRing) {
      this.shockwaveLife -= dt;
      const progress = 1 - (this.shockwaveLife / 0.5);
      (this.shockwaveRing.material as THREE.MeshBasicMaterial).opacity = 0.8 * (1 - progress);
      const scale = 1 + progress * 16; // Expand from 1 to 17
      this.shockwaveRing.scale.set(scale, scale, 1);

      if (this.shockwaveLife <= 0) {
        this.shockwaveRing.visible = false;
      }
    }
  }

  /**
   * Update all visual effects
   */
  update(dt: number): void {
    this.updateEscapeFlash(dt);
    this.updateExplosionEffects(dt);
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    if (this.escapeFlashSprite) {
      this.scene.remove(this.escapeFlashSprite);
      this.escapeFlashSprite.material.dispose();
      if (this.escapeFlashSprite.material.map) {
        this.escapeFlashSprite.material.map.dispose();
      }
      this.escapeFlashSprite = null;
    }

    if (this.explosionSprite) {
      this.scene.remove(this.explosionSprite);
      this.explosionSprite.material.dispose();
      if (this.explosionSprite.material.map) {
        this.explosionSprite.material.map.dispose();
      }
      this.explosionSprite = null;
    }

    if (this.shockwaveRing) {
      this.scene.remove(this.shockwaveRing);
      (this.shockwaveRing.material as THREE.MeshBasicMaterial).dispose();
      this.shockwaveRing.geometry.dispose();
      this.shockwaveRing = null;
    }
  }
}
