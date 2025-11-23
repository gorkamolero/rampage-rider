import * as THREE from 'three';
// We are importing these to satisfy the spec, though in this "visuals-first" step 
// we are using Three.js basics for movement to ensure the characters render correctly first.
import { GameState, Tier, EntityType, InputState } from '../types';
import { TIER_CONFIGS, COLORS, WORLD_WIDTH } from '../constants';

// Internal types for the engine
interface Entity {
  id: number;
  type: EntityType;
  mesh: THREE.Group; // Changed to Group to hold parts
  velocity: THREE.Vector3;
  health: number;
  active: boolean;
  radius: number;
  tier?: Tier; // For player
  behavior?: 'idle' | 'flee' | 'chase';
  // Animation props
  animParts?: {
    group: THREE.Group;
    body?: THREE.Object3D;
    head?: THREE.Object3D;
    armL?: THREE.Object3D;
    armR?: THREE.Object3D;
    legL?: THREE.Object3D;
    legR?: THREE.Object3D;
    wheels?: THREE.Object3D[];
  };
  walkOffset: number;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
}

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private entities: Entity[] = [];
  private particles: Particle[] = [];
  private player: Entity | null = null;
  private groundChunks: THREE.Group[] = [];
  private animationId: number | null = null;
  private lastTime: number = 0;
  
  // Game State
  public state: GameState = GameState.MENU;
  public stats = {
    kills: 0,
    score: 0,
    health: 0,
    tier: Tier.FOOT,
    combo: 0,
    comboTimer: 0,
    gameTime: 0,
  };

  private callbacks: {
    onStatsUpdate?: (stats: any) => void;
    onGameOver?: (stats: any) => void;
  } = {};

  private input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    action: false,
    mount: false,
  };

  private nextEntityId = 1;
  private worldSpeed = 0;
  private shakeIntensity = 0;

  // Reusable materials
  private matPedestrian: THREE.MeshLambertMaterial;
  private matCop: THREE.MeshLambertMaterial;
  private matPlayer: THREE.MeshLambertMaterial;
  private matSkin: THREE.MeshLambertMaterial;
  private matDark: THREE.MeshLambertMaterial;

  constructor(canvas: HTMLCanvasElement, width: number, height: number) {
    // Scene Setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1a);
    this.scene.fog = new THREE.Fog(0x1a1a1a, 20, 60);

    // Init Materials
    this.matPedestrian = new THREE.MeshLambertMaterial({ color: COLORS.PEDESTRIAN });
    this.matCop = new THREE.MeshLambertMaterial({ color: COLORS.COP });
    this.matPlayer = new THREE.MeshLambertMaterial({ color: TIER_CONFIGS[Tier.FOOT].color });
    this.matSkin = new THREE.MeshLambertMaterial({ color: 0xffccaa }); // Skin tone
    this.matDark = new THREE.MeshLambertMaterial({ color: 0x333333 }); // Tires/details

    // Camera Setup (Orthographic for top-down arcade feel)
    const aspect = width / height;
    const frustumSize = 35;
    this.camera = new THREE.OrthographicCamera(
      (frustumSize * aspect) / -2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      frustumSize / -2,
      1,
      1000
    );
    
    // Isometric-ish view
    // Positioned so that looking at (0,0,0) creates the isometric angle
    this.camera.position.set(20, 40, 20); 
    this.camera.lookAt(0, 0, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
    dirLight.position.set(-20, 50, -20);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -40;
    dirLight.shadow.camera.right = 40;
    dirLight.shadow.camera.top = 40;
    dirLight.shadow.camera.bottom = -40;
    this.scene.add(dirLight);

    // Init World
    this.initGround();
  }

  public setCallbacks(
    onStatsUpdate: (stats: any) => void, 
    onGameOver: (stats: any) => void
  ) {
    this.callbacks.onStatsUpdate = onStatsUpdate;
    this.callbacks.onGameOver = onGameOver;
  }

  public handleInput(input: InputState) {
    this.input = input;
  }

  public resize(width: number, height: number) {
    const aspect = width / height;
    const frustumSize = 35;
    this.camera.left = (frustumSize * aspect) / -2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = frustumSize / -2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public start() {
    if (this.state === GameState.PLAYING) return;
    
    this.state = GameState.PLAYING;
    this.resetGame();
    this.lastTime = performance.now();
    this.animate();
  }

  public stop() {
    this.state = GameState.PAUSED;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private resetGame() {
    // Clear entities
    this.entities.forEach(e => this.scene.remove(e.mesh));
    this.entities = [];
    this.particles.forEach(p => this.scene.remove(p.mesh));
    this.particles = [];

    // Reset stats
    this.stats = {
      kills: 0,
      score: 0,
      health: 100,
      tier: Tier.FOOT,
      combo: 0,
      comboTimer: 0,
      gameTime: 0,
    };

    // Spawn Player
    this.spawnPlayer(Tier.FOOT);

    // Reset Camera
    this.camera.position.set(20, 40, 20);
    this.camera.lookAt(0, 0, 0);
  }

  // --- Procedural Character Generation ---

  private createLimb(width: number, height: number, depth: number, material: THREE.Material, x: number, y: number, z: number) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometry.translate(0, -height / 2, 0); // Pivot at top
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    const group = new THREE.Group();
    group.add(mesh);
    group.position.set(x, y, z);
    return { group, mesh };
  }

  private createHumanoidMesh(type: EntityType, color: number): { mesh: THREE.Group, animParts: any } {
    const group = new THREE.Group();
    const material = type === EntityType.PLAYER ? this.matPlayer : 
                     type === EntityType.COP ? this.matCop : 
                     this.matPedestrian;

    // Scale constants
    const S = 0.8; // Global scale

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.5 * S, 0.6 * S, 0.3 * S);
    const torso = new THREE.Mesh(torsoGeo, material);
    torso.position.y = 1.0 * S; // Hip height
    torso.castShadow = true;
    torso.receiveShadow = true;
    group.add(torso);

    // 2. Head
    const headGeo = new THREE.BoxGeometry(0.3 * S, 0.3 * S, 0.3 * S);
    const head = new THREE.Mesh(headGeo, this.matSkin);
    head.position.y = 0.5 * S; // Relative to torso
    head.castShadow = true;
    torso.add(head); // Child of torso

    // 3. Legs
    const legW = 0.18 * S;
    const legH = 0.7 * S;
    const legD = 0.2 * S;
    
    const legL = this.createLimb(legW, legH, legD, this.matDark, -0.15 * S, 0.7 * S, 0);
    const legR = this.createLimb(legW, legH, legD, this.matDark, 0.15 * S, 0.7 * S, 0);
    
    group.add(legL.group);
    group.add(legR.group);

    // 4. Arms
    const armW = 0.15 * S;
    const armH = 0.6 * S;
    const armD = 0.15 * S;

    const armL = this.createLimb(armW, armH, armD, material, -0.32 * S, 0.25 * S, 0);
    const armR = this.createLimb(armW, armH, armD, material, 0.32 * S, 0.25 * S, 0);
    
    torso.add(armL.group);
    torso.add(armR.group);

    // Weapon for player
    if (type === EntityType.PLAYER) {
      const knifeGeo = new THREE.BoxGeometry(0.05, 0.4, 0.1);
      const knife = new THREE.Mesh(knifeGeo, new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.8 }));
      knife.position.set(0, -0.4 * S, 0.15 * S);
      knife.rotation.x = Math.PI / 2;
      armR.group.children[0].add(knife);
    }

    return {
      mesh: group,
      animParts: {
        group,
        body: torso,
        head,
        armL: armL.group,
        armR: armR.group,
        legL: legL.group,
        legR: legR.group
      }
    };
  }

  private createVehicleMesh(tier: Tier): { mesh: THREE.Group, animParts: any } {
    const group = new THREE.Group();
    const color = TIER_CONFIGS[tier].color;
    const material = new THREE.MeshLambertMaterial({ color });
    
    // Simple car body
    const bodyGeo = new THREE.BoxGeometry(1.2, 0.5, 2.0);
    const body = new THREE.Mesh(bodyGeo, material);
    body.position.y = 0.5;
    body.castShadow = true;
    group.add(body);

    // Cabin
    const cabinGeo = new THREE.BoxGeometry(1.0, 0.4, 1.0);
    const cabin = new THREE.Mesh(cabinGeo, new THREE.MeshLambertMaterial({ color: 0x111111 }));
    cabin.position.set(0, 0.45, -0.2);
    body.add(cabin);

    // Wheels
    const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = this.matDark;
    
    const wheels: THREE.Object3D[] = [];
    const positions = [
      [-0.6, -0.2, 0.7], [0.6, -0.2, 0.7], // Front
      [-0.6, -0.2, -0.7], [0.6, -0.2, -0.7] // Back
    ];

    positions.forEach(pos => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.position.set(pos[0], pos[1], pos[2]);
      w.castShadow = true;
      body.add(w);
      wheels.push(w);
    });

    return {
      mesh: group,
      animParts: {
        group,
        wheels
      }
    };
  }

  private spawnPlayer(tier: Tier) {
    let visual;
    if (tier === Tier.FOOT) {
      visual = this.createHumanoidMesh(EntityType.PLAYER, 0xffaa00);
    } else {
      visual = this.createVehicleMesh(tier);
    }

    this.scene.add(visual.mesh);
    visual.mesh.position.set(0, 0, 0);

    this.player = {
      id: 0,
      type: EntityType.PLAYER,
      mesh: visual.mesh,
      velocity: new THREE.Vector3(),
      health: TIER_CONFIGS[tier].maxHealth,
      active: true,
      radius: 0.5,
      tier: tier,
      animParts: visual.animParts,
      walkOffset: 0
    };
    
    // Update stats
    this.stats.health = this.player.health;
    this.stats.tier = tier;
  }

  private spawnEntity(type: EntityType) {
    let visual;
    let radius = 0.4;
    let hp = 1;
    let speed = 0;
    
    if (type === EntityType.PEDESTRIAN) {
      visual = this.createHumanoidMesh(EntityType.PEDESTRIAN, COLORS.PEDESTRIAN);
      speed = 1 + Math.random();
    } else if (type === EntityType.COP) {
      visual = this.createHumanoidMesh(EntityType.COP, COLORS.COP);
      hp = 3;
      speed = 3 + Math.random();
    } else {
        return;
    }

    // Spawn ahead of player
    const spawnX = (Math.random() - 0.5) * (WORLD_WIDTH - 2);
    const spawnZ = (this.player?.mesh.position.z || 0) - 25 - Math.random() * 20; // Spawn ahead (negative Z)

    visual.mesh.position.set(spawnX, 0, spawnZ);
    visual.mesh.rotation.y = Math.random() * Math.PI * 2;
    this.scene.add(visual.mesh);

    this.entities.push({
      id: this.nextEntityId++,
      type,
      mesh: visual.mesh,
      velocity: new THREE.Vector3(0, 0, speed), // Base forward velocity
      health: hp,
      active: true,
      radius,
      behavior: type === EntityType.COP ? 'chase' : 'idle',
      animParts: visual.animParts,
      walkOffset: Math.random() * 100
    });
  }

  // --- Animation Loop ---

  private animate = () => {
    if (this.state !== GameState.PLAYING) return;

    this.animationId = requestAnimationFrame(this.animate);

    const now = performance.now();
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.updateGameLogic(dt);
    this.renderer.render(this.scene, this.camera);
  };

  private updateGameLogic(dt: number) {
    if (!this.player || !this.player.active) return;

    this.stats.gameTime += dt;
    this.stats.comboTimer = Math.max(0, this.stats.comboTimer - dt);
    if (this.stats.comboTimer === 0) this.stats.combo = 0;

    // 1. Player Movement
    const speed = 8 * TIER_CONFIGS[this.player.tier || Tier.FOOT].speedMultiplier;
    const moveDir = new THREE.Vector3();

    if (this.input.up) moveDir.z -= 1;
    if (this.input.down) moveDir.z += 1;
    if (this.input.left) moveDir.x -= 1;
    if (this.input.right) moveDir.x += 1;

    if (moveDir.length() > 0) {
      moveDir.normalize();
      this.player.velocity.copy(moveDir).multiplyScalar(speed);
      
      // Rotate player to face movement
      const targetRotation = Math.atan2(moveDir.x, moveDir.z) + Math.PI; // +PI to face away from camera
      // Smooth rotation
      let rotDiff = targetRotation - this.player.mesh.rotation.y;
      while (rotDiff > Math.PI) rotDiff -= Math.PI * 2;
      while (rotDiff < -Math.PI) rotDiff += Math.PI * 2;
      this.player.mesh.rotation.y += rotDiff * 10 * dt;
    } else {
      this.player.velocity.set(0, 0, 0); // Instant stop for tight controls
    }

    // Apply Velocity
    this.player.mesh.position.addScaledVector(this.player.velocity, dt);

    // Bounds
    this.player.mesh.position.x = Math.max(-WORLD_WIDTH/2, Math.min(WORLD_WIDTH/2, this.player.mesh.position.x));

    // Camera Follow - Centered on player
    // Maintain the initial isometric offset (20, 40, 20) relative to player position
    const targetX = this.player.mesh.position.x + 20;
    const targetZ = this.player.mesh.position.z + 20;

    // Smooth lerp
    this.camera.position.x += (targetX - this.camera.position.x) * 5 * dt;
    this.camera.position.z += (targetZ - this.camera.position.z) * 5 * dt;

    // 2. Animate Player Limbs
    this.animateEntity(this.player, dt);

    // 3. Update Entities
    // Spawn Logic
    if (Math.random() < 0.05) {
        this.spawnEntity(Math.random() > 0.9 ? EntityType.COP : EntityType.PEDESTRIAN);
    }

    // Entity Loop
    for (let i = this.entities.length - 1; i >= 0; i--) {
      const ent = this.entities[i];
      
      // AI Logic (Simple)
      if (ent.behavior === 'chase') {
        const toPlayer = new THREE.Vector3().subVectors(this.player.mesh.position, ent.mesh.position);
        toPlayer.normalize();
        ent.velocity.addScaledVector(toPlayer, 10 * dt);
        ent.velocity.clampLength(0, 5); // Max speed
        ent.mesh.lookAt(this.player.mesh.position);
      } else {
         // Wander/Run forward
         // ent.mesh.position.z += 2 * dt; 
      }
      
      ent.mesh.position.addScaledVector(ent.velocity, dt);
      this.animateEntity(ent, dt);

      // Collision with Player
      const dist = ent.mesh.position.distanceTo(this.player.mesh.position);
      if (dist < (this.player.radius + ent.radius)) {
         // Interaction
         if (this.player.tier !== Tier.FOOT || this.input.action) {
             // KILL
             this.killEntity(i);
         } else {
             // OUCH
             this.player.health -= 5;
             this.shakeIntensity = 0.5;
             // Knockback
             const push = new THREE.Vector3().subVectors(this.player.mesh.position, ent.mesh.position).normalize().multiplyScalar(5);
             this.player.mesh.position.add(push);
             
             if (this.player.health <= 0) {
                 this.handleGameOver();
             }
         }
      }

      // Cleanup distant
      if (ent.mesh.position.z > this.camera.position.z + 10) {
        this.scene.remove(ent.mesh);
        this.entities.splice(i, 1);
      }
    }

    // 4. Ground Scrolling (Procedural)
    this.updateGround();

    // 5. Update Callbacks
    if (this.callbacks.onStatsUpdate) {
        this.stats.health = this.player.health;
        this.callbacks.onStatsUpdate({...this.stats});
    }

    // 6. Shake
    if (this.shakeIntensity > 0) {
        const rx = (Math.random() - 0.5) * this.shakeIntensity;
        const ry = (Math.random() - 0.5) * this.shakeIntensity;
        this.camera.position.x += rx;
        this.camera.position.z += ry;
        this.shakeIntensity *= 0.9;
    }
  }

  private animateEntity(ent: Entity, dt: number) {
    if (!ent.animParts) return;

    // Movement speed for animation freq
    const speed = ent.velocity.length();
    const isMoving = speed > 0.1;
    
    ent.walkOffset += dt * speed * 5;

    // Humanoid Animation
    if (ent.animParts.legL && ent.animParts.legR && ent.animParts.armL && ent.animParts.armR) {
        if (isMoving) {
            const angle = Math.sin(ent.walkOffset);
            ent.animParts.legL.rotation.x = angle * 0.8;
            ent.animParts.legR.rotation.x = -angle * 0.8;
            ent.animParts.armL.rotation.x = -angle * 0.6;
            ent.animParts.armR.rotation.x = angle * 0.6;
        } else {
            // Reset to idle
            ent.animParts.legL.rotation.x = THREE.MathUtils.lerp(ent.animParts.legL.rotation.x, 0, dt * 10);
            ent.animParts.legR.rotation.x = THREE.MathUtils.lerp(ent.animParts.legR.rotation.x, 0, dt * 10);
            ent.animParts.armL.rotation.x = THREE.MathUtils.lerp(ent.animParts.armL.rotation.x, 0, dt * 10);
            ent.animParts.armR.rotation.x = THREE.MathUtils.lerp(ent.animParts.armR.rotation.x, 0, dt * 10);
        }
        
        // Attack Animation override
        if (ent === this.player && this.input.action && ent.animParts.armR) {
            ent.animParts.armR.rotation.x = -Math.PI / 2; // Arm forward
            // Swing effect could go here
        }
    }

    // Vehicle Animation (Wheels)
    if (ent.animParts.wheels) {
        ent.animParts.wheels.forEach(w => {
            w.rotation.x += speed * dt;
        });
    }
  }

  private killEntity(index: number) {
      const ent = this.entities[index];
      this.scene.remove(ent.mesh);
      this.entities.splice(index, 1);
      
      // FX
      this.stats.kills++;
      this.stats.score += 100 * (1 + this.stats.combo * 0.1);
      this.stats.combo++;
      this.stats.comboTimer = 3.0;
      this.stats.health = Math.min(this.stats.health + 5, 100); // Heal
      this.shakeIntensity = 0.2;
      
      // Simple particle explosion
      // (TODO: particle system implementation)
  }

  private handleGameOver() {
      this.state = GameState.GAME_OVER;
      if (this.callbacks.onGameOver) {
          this.callbacks.onGameOver({...this.stats});
      }
  }

  private initGround() {
    for (let i = 0; i < 5; i++) {
        this.addGroundChunk(-i * 40);
    }
  }

  private addGroundChunk(zPos: number) {
      const group = new THREE.Group();
      
      // Road
      const roadGeo = new THREE.PlaneGeometry(WORLD_WIDTH, 40);
      const roadMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
      const road = new THREE.Mesh(roadGeo, roadMat);
      road.rotation.x = -Math.PI / 2;
      road.receiveShadow = true;
      group.add(road);

      // Sidewalks
      const sideGeo = new THREE.PlaneGeometry(5, 40);
      const sideMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
      
      const leftWalk = new THREE.Mesh(sideGeo, sideMat);
      leftWalk.rotation.x = -Math.PI / 2;
      leftWalk.position.set(-WORLD_WIDTH/2 + 2.5, 0.1, 0);
      leftWalk.receiveShadow = true;
      group.add(leftWalk);

      const rightWalk = new THREE.Mesh(sideGeo, sideMat);
      rightWalk.rotation.x = -Math.PI / 2;
      rightWalk.position.set(WORLD_WIDTH/2 - 2.5, 0.1, 0);
      rightWalk.receiveShadow = true;
      group.add(rightWalk);

      // Buildings (Simple boxes)
      const bMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
      for (let i=0; i<3; i++) {
          const h = 5 + Math.random() * 15;
          const w = 5 + Math.random() * 5;
          const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), bMat);
          b.position.set(
              (Math.random() > 0.5 ? 1 : -1) * (WORLD_WIDTH/2 + w/2),
              h/2,
              (Math.random() - 0.5) * 30
          );
          b.castShadow = true;
          b.receiveShadow = true;
          group.add(b);
      }

      group.position.z = zPos;
      this.scene.add(group);
      this.groundChunks.push(group);
  }

  private updateGround() {
      if (!this.player) return;
      
      const playerZ = this.player.mesh.position.z;
      
      // Remove behind
      if (this.groundChunks[0].position.z > playerZ + 40) {
          const chunk = this.groundChunks.shift();
          if (chunk) {
              this.scene.remove(chunk);
              
              // Add new ahead
              const lastZ = this.groundChunks[this.groundChunks.length - 1].position.z;
              this.addGroundChunk(lastZ - 40);
          }
      }
  }
}