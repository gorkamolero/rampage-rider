# Rampage Rider Performance Analysis & Optimization Plan

## 1. Memory Leaks

### Findings
*   **`AudioManager.ts`**:
    *   The `AudioManager` creates `AudioBufferSourceNode`s which are "fire and forget" in `playDirect`. While standard for Web Audio, rapid-fire sounds (machine guns, crowd screams) can accumulate garbage if not strictly managed.
    *   `playingSounds` map grows indefinitely if `onended` callbacks don't fire reliably (e.g., tab backgrounding).
*   **`CopManager.ts` & `CrowdManager.ts`**:
    *   Entities are pooled (`copPool`, `pedestrianPool`), which is good.
    *   However, `cop.dispose()` and `pedestrian.destroy()` are called when clearing, but the *pooled* entities might retain references to Three.js objects if not carefully reset.
    *   **Major Issue**: In `Cop.ts`, `this.mixer` is stopped but `uncacheRoot` is only called in `dispose()`. If a cop is returned to the pool and reused, the old mixer might be lingering or a new one created without cleaning the old one properly during `reset()`.
*   **`Engine.ts`**:
    *   `vehiclesToCleanup` array manages deferred destruction. If the game state resets rapidly, this array might not be cleared, leading to detached vehicle meshes in the scene.

### Fixes
*   **Audio**: Implement a "force sweep" in `AudioManager.update()` every 60 frames to verify `playingSounds` map against actual `source.context.currentTime` and remove stale entries.
*   **Pooling**: Ensure `reset()` methods in Entity classes (Cop, Pedestrian) fully reset *all* state, including potentially re-creating or resetting the AnimationMixer properly, rather than creating new ones on top of old ones.
*   **Cleanup**: In `Engine.resetGame()`, explicitly clear `vehiclesToCleanup` and immediately dispose of their contents.

## 2. Per-Frame Allocations (GC Pressure)

### Findings
*   **`CopManager.ts`**:
    *   **Critical**: `getCopData()` creates a new object literal `{ position, health, maxHealth }` *for every active cop, every frame*. This is a massive generator of garbage for the UI to digest.
    *   `damageInRadius` uses `this._killPositionPool`, which is good, but `damageInRadius` itself returns a *new object* `{ kills, positions }` every call.
*   **`CrowdManager.ts`**:
    *   Similar to CopManager, `damageInRadius`, `damageInBox`, `blastInRadius` all return new objects `{ kills, positions }` on every call (and these are called per-frame during attacks).
    *   `update` loop calculates `distanceToPlayerSq` inside the loop.
*   **`Engine.ts`**:
    *   `_healthBarResult` is pre-allocated but `this.cops.getCopData()` (called inside `update`) allocates the objects filling it.
    *   `attackTrackingFrames` logic creates many small temporary objects/closures if logging is active.

### Fixes
*   **Data Structures**: Implement a reusable "Result Object" pattern for manager methods. Instead of returning `{...}`, pass a reusable object to the method to be filled.
*   **UI Data**: In `CopManager`, utilize a `_copDataPool` (array of reusable objects) for `getCopData`. Only update the properties of existing objects in the pool instead of `push`ing new literals.
*   **Math**: Verify all Vector3 operations in `update` loops utilize `copy()`, `add()`, `sub()` into pre-allocated `_temp` vectors (The code already does this well in many places, e.g., `_tempPosition` in Entities, but consistency is key).

## 3. Mobile-Specific Issues

### Findings
*   **Entity Counts**:
    *   `CrowdManager` default `maxPedestrians` is 60 (surging to 100). On mobile, 100 animated skeletal meshes with physics is very heavy.
    *   `CopManager` spawns up to 3 active cops. This is low, but combined with pedestrians, the draw call count rises.
*   **Physics**:
    *   Rapier is running every frame. On mobile, if FPS drops, physics stepping might spiral.
    *   `KinematicCharacterHelper` uses `computeColliderMovement` which is computationally expensive for 60+ entities.
*   **Rendering**:
    *   `InstancedBlobShadows` is good for performance.
    *   However, `Pedestrian.ts` logic for "Festive Behavior" adds 6 mugs + lantern + string lights *per table*. If many tables are visible, vertex count spikes.

### Fixes
*   **LOD (Level of Detail)**:
    *   Aggressively throttle AnimationMixer updates. `Engine.ts` has `ANIMATION_LOD_DISTANCE_SQ` but it should be tighter on mobile (e.g., 10 units instead of 15/25).
    *   Stop physics calculations for far-away pedestrians entirely, not just animations.
*   **Caps**: Detect mobile user agent (or use screen width heuristic) to cap `maxPedestrians` to 30 and `SURGE_MAX` to 50.
*   **Simplification**: Disable "Festive Decorations" (lanterns/string lights) on mobile or reduce their geometry complexity.

## 4. Performance Bottlenecks

### Findings
*   **`Engine.ts` Update Loop**:
    *   `this.crowd.update` and `this.cops.update` iterate over all entities.
    *   Inside `Pedestrian.update`, `this.characterController.computeColliderMovement` is called every frame. This is the single most expensive physics operation per entity.
*   **`Cop.ts` AI**:
    *   Uses `YUKA.SeekBehavior`. While efficient, syncing Yuka <-> Three.js <-> Rapier every frame for every entity adds up.
*   **Audio**:
    *   `gameAudio.updateTableCrowdDistance` calculates distance to *every* table every frame.

### Fixes
*   **Physics Throttling**:
    *   Only update `computeColliderMovement` for pedestrians within X meters of the player. Far away pedestrians can use simple `setNextKinematicTranslation` (teleporting) or even stop moving.
*   **Time-Slicing**:
    *   Update AI/Physics for only 50% of the crowd on even frames, and the other 50% on odd frames. They will move at half-rate but interpolate positions visually.
*   **Spatial Audio**:
    *   Update ambient sound distances (tables) only once every 10-15 frames, not every frame.

## Action Plan (Prioritized)

1.  **Refactor `CopManager.getCopData`**: Eliminate the per-frame array allocation.
2.  **Optimize `CrowdManager` Physics**: Implement distance-based throttling for `computeColliderMovement`.
3.  **Mobile Config**: Add a `IS_MOBILE` constant to scale down pedestrian counts and particle effects.
4.  **Audio Cleanup**: Add garbage collection sweep to `AudioManager`.
