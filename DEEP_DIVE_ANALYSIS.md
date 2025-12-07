# Rampage Rider: Deep Dive Performance Analysis

## Executive Summary

The "stutter/stuck" behavior on mobile after prolonged play is symptomatic of **Garbage Collection (GC) Pauses** and **Thermal Throttling**.

1.  **GC Pauses**: Caused by "Death by 1000 Allocations." While individual allocations are small, the cumulative effect of creating temporary objects in `update()` loops (especially during combat with particles/decals) fills the heap. The browser's GC wakes up, pauses the main thread to clean up, causing a stutter.
2.  **Thermal Throttling**: Continuous heavy physics calculations (`computeColliderMovement` for 60+ entities) keep the CPU pegged. On mobile, this leads to heat, causing the OS to throttle CPU speed, degrading performance over time.

---

## 1. Critical Allocation Hotspots (GC Pressure)

These areas generate garbage *every frame* or *every attack*, leading to periodic freezes.

### A. `CopManager.getCopData` (High Severity)
*   **Location**: `src/managers/CopManager.ts`
*   **Issue**: Called every 3 frames by `Engine.ts` for UI. It allocates a new `Array` and new object literals `{ position, health, maxHealth }` for every active cop.
*   **Impact**: ~5-10KB of garbage per second. Trivial on desktop, deadly on mobile GC.
*   **Fix**: Implement a `_copDataPool` (reusable array of objects). Update properties in-place.

### B. `ParticleEmitter` (Medium Severity)
*   **Location**: `src/rendering/ParticleSystem.ts`
*   **Issue**: `emitBlood` and `emitDebris` manage particle lifecycle by `push`ing new object literals into the `this.particles` array.
*   **Impact**: Combat generates hundreds of particles. Each spawn creates a JS object. Each death creates "array hole" or requires splicing.
*   **Fix**: Use a "Struct of Arrays" pattern (separate `Float32Array`s for life, velocityX, velocityY, etc.) or a fixed-size pool of reusable particle objects.

### C. `BloodDecalSystem` (Medium Severity)
*   **Location**: `src/rendering/BloodDecalSystem.ts`
*   **Issue**: `decals.push({...})` allocates objects. `removeOldestDecal` uses `decals.slice(...)`, which allocates a *new array* every time a decal expires.
*   **Fix**: Use a Ring Buffer (circular array) for `decals`. Never `slice`, just move the `head` index pointer.

### D. Combat Result Objects (Low-Medium Severity)
*   **Location**: `CrowdManager.ts`, `CopManager.ts` methods (`damageInRadius`, `blastInRadius`, etc.)
*   **Issue**: These methods return a fresh object `{ kills: number, positions: Vector3[] }` every call. During a Rampage, these are called frequently.
*   **Fix**: Pass a reusable `result` object into these methods to be filled, rather than returning a new one.

---

## 2. CPU Bottlenecks (Thermal Throttling)

### A. Physics: `computeColliderMovement`
*   **Location**: `src/entities/Pedestrian.ts` (line ~450)
*   **Issue**: Every pedestrian (up to 60-100) calls `characterController.computeColliderMovement()` every single frame. This is a complex ray-casting/shape-sweep operation in Rapier (WASM).
*   **Impact**: High constant CPU load.
*   **Fix**:
    1.  **LOD (Level of Detail)**: If a pedestrian is > 20m from player, skip collision checks and just use simple movement.
    2.  **Time-Slicing**: Update physics for even-indexed pedestrians on frame N, odd-indexed on frame N+1.

### B. Animation Updates
*   **Location**: `Engine.ts` loop calling `pedestrian.update()`
*   **Issue**: Skeletal animation bone matrix updates are CPU heavy.
*   **Fix**: The code already has `ANIMATION_LOD_DISTANCE_SQ` (625 = 25m). Ensure this is working and consider reducing it to 15m (225 sq) for mobile.

---

## 3. Memory Leaks (Progressive Slowdown)

### A. Audio Cleanup
*   **Location**: `src/audio/AudioManager.ts`
*   **Issue**: `playingSounds` map tracks active sound nodes. If an `onended` event is missed (browser tab throttled), these entries persist forever.
*   **Fix**: Add a `garbageCollect()` method in `AudioManager` that runs every ~5 seconds to cross-check `context.currentTime` against expected sound duration and force-remove stale entries.

### B. Entity Pooling Hygiene
*   **Location**: `Cop.ts`, `Pedestrian.ts`
*   **Issue**: When returning to pool, `dispose()` is often called on the *instance* being removed from scene, but we must ensure `reset()` re-initializes the `AnimationMixer` correctly without leaking the old action cache.
*   **Fix**: Verify `mixer.stopAllAction()` and `mixer.uncacheRoot(root)` are called before re-using a mixer or creating a new one.

---

## 4. Recommendations for Immediate Action

1.  **Refactor `CopManager` Data**: Switch `getCopData` to use pooling. (Low effort, high impact).
2.  **Optimize Decal/Particle Systems**: Remove `push`/`slice` patterns. (Medium effort, high stability gain).
3. **Throttle Physics**: Implement distance-based checks for `computeColliderMovement` in `Pedestrian.ts`. (Medium effort, massive CPU save).

## 5. Additional Mobile-Critical Findings

### A. `AncestorCouncil` GC & Draw Calls
*   **Location**: `src/rendering/AncestorCouncil.ts`
*   **Issue**: 
    *   `getSpiralPosition` allocates a new result object `{x, z, angle}` for *every* ancestor (120) *every* frame.
    *   `SPIRAL_CONFIG.COUNT` is 120. Each ancestor is a `SkeletonUtils.clone` with unique materials. This results in 120 extra draw calls and hundreds of materials, saturating mobile GPU bandwidth.
    *   Debug tube geometry is updated every frame even when invisible.
*   **Fix**: 
    *   Use a pre-allocated buffer/array for spiral positions.
    *   Reduce count on mobile (e.g., 24) or use InstancedMesh.
    *   Disable debug line creation unless in debug mode.

### B. `Cop` Bullet Churn
*   **Location**: `src/entities/Cop.ts`
*   **Issue**: `createBulletProjectile` allocates a `new THREE.Mesh` and clones the target vector for every single shot. `removeBulletProjectile` just drops the reference. In a firefight, this creates significant GC pressure.
*   **Fix**: Pool a single bullet mesh per Cop instance (toggle visibility) and reuse target vectors.

### C. Physics Timestep Desync
*   **Location**: `src/core/PhysicsWorld.ts`
*   **Issue**: `step(deltaTime)` clamps the dt but calls `world.step()` which typically uses a fixed internal timestep (1/60). On mobile, if frame rates dip or fluctuate, the physics simulation will desync from wall-clock time, causing jitter (visuals lagging behind or snapping).
*   **Fix**: Explicitly set `world.timestep = _clampedDt` before stepping, or implement a proper accumulator-based substep loop.

### D. Eager Audio Loading
*   **Location**: `src/audio/GameAudio.ts`
*   **Issue**: `loadAllSounds` fetches and decodes *every* sound file at startup. On mobile, this spikes memory usage and delays TTI (Time to Interactive).
*   **Fix**: Implement lazy loading for non-critical categories or stream music tracks instead of decoding them fully into memory.

### E. Crowd Surge Cap
*   **Location**: `src/managers/CrowdManager.ts`
*   **Issue**: `SURGE_MAX` allows up to 100 pedestrians. This is too high for average mobile CPUs.
*   **Fix**: Introduce a `IS_MOBILE` flag to cap `baseMaxPedestrians` and `SURGE_MAX` to lower limits (e.g., 30/50).

