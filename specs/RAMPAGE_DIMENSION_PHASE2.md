# Rampage Dimension - Phase 2: The Juice

Base effect is working. Now we make it FEEL right.

---

## 1. SLOW MOTION

**The Fantasy:** You've transcended time. The world crawls while you move at full speed.

### What Slows Down (30% speed)
- Pedestrians - movement AND animations
- Cops - movement AND animations
- All enemy types (bike cops, moto cops, car cops)
- Blood particles
- Debris particles

### What Stays Full Speed
- Player movement
- Player animations
- Player attacks
- Combo timer
- UI updates

### Implementation

Add `timeScale` to Engine:

```typescript
// Engine.ts
private rampageTimeScale = 1.0;
private readonly RAMPAGE_SLOW_MO = 0.3; // 30% speed

// When entering rampage dimension:
this.rampageTimeScale = this.RAMPAGE_SLOW_MO;

// When exiting:
this.rampageTimeScale = 1.0;

// In update loop - apply to entities:
const entityDt = dt * this.rampageTimeScale;

// Pedestrians
for (const ped of this.crowd.pedestrians) {
  ped.update(entityDt);  // Slow
}

// Cops
this.copManager.update(entityDt);  // Slow

// Player - always full speed
this.player.update(dt);  // Full speed
```

### Animation Speed

Mixers need time scale too:
```typescript
// In Pedestrian/Cop classes
this.mixer.timeScale = timeScale; // 0.3 during rampage
```

### The Feel

You're a bullet. They're in molasses. Every attack feels like you're carving through frozen time.

---

## 2. ENERGY MOTES (Ambient Particles)

**The Fantasy:** The void is alive with power. Glowing embers drift around you. Some pass through your body.

### Visual

- Small glowing spheres (soft-edged sprites)
- Color: Red-orange `0xff4444` to `0xff6600`
- Size: 0.15 - 0.35 units
- Additive blending (glows against gray void)
- Count: 40-50 active at once

### Behavior

```typescript
interface EnergyMote {
  sprite: THREE.Sprite;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  wobblePhase: number;
  wobbleSpeed: number;
  baseY: number;
}
```

**Spawning:**
- Spawn in ring around player (radius 10-20 units)
- Random height between 0.5 and 3 units
- Initial velocity: slow drift toward random direction (2-4 units/sec)

**Movement:**
- Drift in initial direction
- Vertical wobble: `y = baseY + sin(wobblePhase) * 0.3`
- Wobble phase increases over time
- Some motes drift TOWARD player (pass through feeling)

**Lifecycle:**
- Lifespan: 2-4 seconds
- Fade in over first 0.3s
- Fade out over last 0.5s
- Respawn at new position when dead

### Constants

```typescript
ENERGY_MOTES: {
  COUNT: 45,
  SPAWN_RADIUS_MIN: 10,
  SPAWN_RADIUS_MAX: 20,
  SPAWN_HEIGHT_MIN: 0.5,
  SPAWN_HEIGHT_MAX: 3.0,
  DRIFT_SPEED_MIN: 2,
  DRIFT_SPEED_MAX: 4,
  WOBBLE_AMPLITUDE: 0.3,
  WOBBLE_SPEED_MIN: 1.5,
  WOBBLE_SPEED_MAX: 3.0,
  LIFE_MIN: 2.0,
  LIFE_MAX: 4.0,
  SIZE_MIN: 0.15,
  SIZE_MAX: 0.35,
  COLOR_INNER: 0xff4444,
  COLOR_OUTER: 0xff6600,
}
```

### Texture

Create soft circle texture (or use existing particle texture):
```typescript
// Soft radial gradient - bright center, transparent edge
const canvas = document.createElement('canvas');
canvas.width = 64;
canvas.height = 64;
const ctx = canvas.getContext('2d');
const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
gradient.addColorStop(0.3, 'rgba(255, 200, 150, 0.8)');
gradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 64, 64);
```

---

## 3. DYNAMIC RAYS (Enhancement)

Current rays rotate slowly and pulse opacity. Make them feel AGGRESSIVE.

### Faster Rotation

```typescript
RAY_ROTATION_SPEED: 0.5,  // Was 0.1 - 5x faster
```

### Per-Ray Pulse Phasing

Each ray pulses at a different phase - creates "breathing" effect:

```typescript
// Instead of uniform opacity, vary per-ray
for (let i = 0; i < RAY_COUNT; i++) {
  const phaseOffset = (i / RAY_COUNT) * Math.PI * 2;
  const rayPulse = Math.sin(this.rayPulsePhase + phaseOffset);
  // Apply to ray opacity or scale
}
```

This requires either:
- A. Separate meshes per ray (more draw calls)
- B. Vertex colors/attributes (single mesh, shader reads attribute)
- C. Custom shader with uniform array

Recommend B or C for performance.

### Random Burst Flashes

Occasionally one ray segment flashes brighter:

```typescript
private flashRayIndex = -1;
private flashTimer = 0;

// In update:
if (this.flashTimer > 0) {
  this.flashTimer -= dt;
} else if (Math.random() < 0.015) { // ~1.5% per frame
  this.flashRayIndex = Math.floor(Math.random() * RAY_COUNT);
  this.flashTimer = 0.12; // 120ms flash
}

// Apply 2x brightness to flashRayIndex
```

---

## 4. HIT-STOP ON ENTRY

**The Fantasy:** Time STOPS for a split second when you ascend. The universe holds its breath.

### Sequence

```
Frame 0:      Combo hits 10
Frame 0-3:    FREEZE everything (50ms at 60fps)
Frame 3:      White screen flash (one frame)
Frame 3-20:   Environment snaps away, effects begin
```

### Implementation

```typescript
// Engine.ts
private hitStopTimer = 0;
private hitStopDuration = 0.05; // 50ms

enterRampageDimension(): void {
  this.hitStopTimer = this.hitStopDuration;
  // Flash effect - could be CSS overlay or Three.js plane
  this.triggerScreenFlash();
}

// In update loop, at the TOP:
if (this.hitStopTimer > 0) {
  this.hitStopTimer -= dt;
  return; // Skip ALL updates - time is frozen
}
```

### Screen Flash

Quick white overlay:
```typescript
// CSS approach (simpler):
.screen-flash {
  position: fixed;
  inset: 0;
  background: white;
  pointer-events: none;
  animation: flash 0.1s ease-out forwards;
}

@keyframes flash {
  0% { opacity: 0.8; }
  100% { opacity: 0; }
}
```

Or Three.js fullscreen quad that fades out.

---

## 5. RAYS FROM PLAYER (Position Fix)

Rays should emanate from PLAYER, not screen center.

```typescript
// In RampageDimension.update():
positionRaysForCamera(camera: THREE.Camera, playerPosition: THREE.Vector3): void {
  // Position at player, not camera
  this.radialRays.position.copy(playerPosition);
  this.radialRays.position.y = 0.1; // Just above ground
  
  // Rays lie flat on ground plane, spreading outward
  this.radialRays.rotation.x = -Math.PI / 2; // Face up
}
```

Need to pass player position into RampageDimension.update().

---

## Priority Order

1. **Slow Motion** - Biggest gameplay feel impact
2. **Energy Motes** - Makes void feel alive  
3. **Hit-Stop Entry** - Sells the moment of transformation
4. **Dynamic Rays** - Polish on existing effect
5. **Rays from Player** - Spatial correctness

---

## Performance Notes

| Feature | Cost | Notes |
|---------|------|-------|
| Slow-mo | ~0ms | Just dt multiplication |
| Motes | ~1ms | 45 sprites, simple update |
| Hit-stop | ~0ms | Skips frame entirely |
| Dynamic rays | ~0.2ms | Uniform updates |
| **Total new** | **~1.2ms** | Well within budget |

---

## Success Criteria

- [ ] Enemies and pedestrians visibly in slow-motion
- [ ] Player moving at full speed (contrast is obvious)
- [ ] Glowing motes drifting through the void
- [ ] Some motes pass through/near player
- [ ] Hit-stop freeze when entering dimension
- [ ] Screen flash on entry
- [ ] Rays feel energetic, not lazy
- [ ] Still 60fps
- [ ] The power fantasy is COMPLETE
