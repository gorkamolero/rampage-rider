# Architecture

## Dual-Layer Structure

**Layer 1: 3D Game Engine** (`src/core/`)
- `Engine.ts` - Main orchestrator: Three.js scene, Rapier physics, Yuka AI, game loop
- `PhysicsWorld.ts` - Rapier wrapper: collision detection, rigid bodies, raycasting

**Layer 2: React UI** (`src/`)
- `App.tsx` - Game state (MENU, PLAYING, GAME_OVER)
- `components/GameCanvas.tsx` - Bridge between React and Engine
- `components/UI/` - Menu overlays and HUD

## Engine Initialization

```typescript
const engine = new Engine(canvas, width, height);
await engine.init(); // MUST await - Rapier WASM loads async
engine.setCallbacks(onStatsUpdate, onGameOver);
engine.start();
```

## Physics-Rendering Sync

Engine owns both Three.js scene AND Rapier world.
Pattern: Update Rapier → Copy transforms to Three.js meshes in `update()`

## Input Flow

React (keyboard/touch) → `InputState` → `Engine.handleInput()` → Engine reads in `update()`

## Camera

Orthographic at `(10, 25, 10)`, `frustumSize = 25`, smooth lerp follow.

## Collision Groups

```
GROUND (0x0001), PLAYER (0x0002), PEDESTRIAN (0x0004)
COP (0x0008), DEBRIS (0x0010), PROJECTILE (0x0020)
```

## Game State

Centralized in `Engine.ts` stats:
```typescript
{ kills, score, tier, combo, comboTimer, gameTime, health, killHistory }
```
Flow: `Engine.update()` → `callbacks.onStatsUpdate()` → React → UI

## File Organization

```
src/
├── core/           # Engine.ts, PhysicsWorld.ts
├── entities/       # Player, Pedestrian, Cop
├── systems/        # TierSystem, CombatSystem, SpawnSystem
├── rendering/      # MeshFactory, ParticleSystem, CameraController
├── components/     # React UI (GameCanvas.tsx, UI/)
├── types.ts
├── constants.ts
└── index.css       # Tailwind v4
```
