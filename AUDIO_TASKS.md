# Audio System Implementation Tasks

## Overview
Complete audio system for Rampage Rider. Architecture is complete, placeholder audio calls are integrated throughout the codebase. This document tracks all remaining work.

---

## Phase 1: Core Audio System [COMPLETE]
- [x] AudioManager class with Web Audio API
- [x] Sound pooling for frequently played sounds
- [x] Music system with crossfading
- [x] Engine loop system for vehicles/sirens
- [x] Volume ducking for impacts
- [x] Sound manifest (SoundId enum with 100+ sounds)
- [x] GameAudio helper with semantic methods

---

## Phase 2: Engine Integration [COMPLETE]
- [x] Import gameAudio in Engine.ts
- [x] Initialize audio in Engine.init()
- [x] Call gameAudio.update(dt) in game loop
- [x] Vehicle enter/exit audio
- [x] Tier unlock fanfare
- [x] Attack sounds (knife, bicycle, motorbike blast)
- [x] Kill sounds with combo scaling
- [x] Rampage mode enter/exit + music transitions
- [x] Combo milestone announcements
- [x] Combo lost sound
- [x] Game over sequence

---

## Phase 3: Additional Engine Audio [TODO]

### Player Damage & Taser
- [ ] Player hit sound when taking damage (playPlayerHit)
- [ ] Taser fire sound from cop
- [ ] Taser hit sound when stunned
- [ ] Taser loop while being tased
- [ ] Taser escape button press sounds (rising pitch)
- [ ] Taser escape success sound

### Cop Sounds
- [ ] Cop spawn alert sound
- [ ] Cop punch sound
- [ ] Cop death sound (separate from generic kill)
- [ ] Gunshot from cops (2+ wanted stars)
- [ ] Bullet whiz near-miss sound

### Cop Vehicle Sounds
- [ ] Siren loop for cop cars
- [ ] Cop car engine loop
- [ ] Cop car ram impact
- [ ] Cop car destroy sound
- [ ] Motorbike cop engine loop
- [ ] Motorbike cop ram sound
- [ ] Bike cop pedaling sound

### Pedestrian Sounds
- [ ] Pedestrian scream on death
- [ ] Pedestrian panic gasp/yelp
- [ ] Body thud when hitting ground

### Roadkill & Building Destruction
- [ ] Roadkill impact sounds (scaled by vehicle tier)
- [ ] Building destruction crash (truck only)

---

## Phase 4: UI Audio Integration [TODO]

### Menu Sounds
- [ ] UI click for buttons
- [ ] UI hover sound
- [ ] Menu open/close sounds
- [ ] Start game confirmation sound
- [ ] Game over stats reveal sounds

### Notification Sounds
- [ ] Kill notification pop
- [ ] Alert notification (tased, rampage)
- [ ] Prompt notification (enter vehicle)

### HUD Sounds
- [ ] Score tick/increment
- [ ] Points popup sound
- [ ] Heat increase warning
- [ ] Wanted star increase/decrease

---

## Phase 5: Ambient Audio [TODO]
- [ ] City ambient loop (during normal gameplay)
- [ ] Crowd ambient chatter
- [ ] Wind loop (during rampage or high speed)
- [ ] Ancestor whispers (random during rampage)

---

## Phase 6: Music Tracks Needed [TODO]

### Required Tracks
1. **MUSIC_MENU** - Menu/title screen music
2. **MUSIC_GAMEPLAY** - Main gameplay loop
3. **MUSIC_RAMPAGE** - Intense rampage mode variant
4. **MUSIC_GAME_OVER** - Defeat/game over music

### Music Integration Points
- [x] Menu music on game load
- [x] Gameplay music on game start
- [x] Rampage music transition at combo 10
- [x] Return to gameplay music on rampage exit
- [x] Game over music on death

---

## Phase 7: Sound Effect Files Needed [TODO]

### Player Movement (5 files)
- [ ] footstep_run.mp3 - Running footstep
- [ ] footstep_walk.mp3 - Walking footstep
- [ ] jump.mp3 - Jump start
- [ ] land.mp3 - Normal landing
- [ ] land_hard.mp3 - Heavy landing

### Player Attacks (5 files)
- [ ] knife_whoosh.mp3 - Knife swing
- [ ] knife_hit.mp3 - Knife connect with pedestrian
- [ ] knife_hit_cop.mp3 - Knife connect with cop
- [ ] punch_whoosh.mp3 - Punch swing
- [ ] punch_hit.mp3 - Punch connect

### Bicycle (4 files)
- [ ] bicycle_pedal.mp3 - Pedaling loop
- [ ] bicycle_bell.mp3 - Bell ring
- [ ] bicycle_slash.mp3 - Slash attack
- [ ] bicycle_hit.mp3 - Slash hit

### Motorbike (4 files)
- [ ] motorbike_engine.mp3 - Engine loop
- [ ] motorbike_rev.mp3 - Revving
- [ ] motorbike_shoot.mp3 - Drive-by shot
- [ ] motorbike_blast.mp3 - Blast attack explosion

### Sedan (4 files)
- [ ] sedan_engine.mp3 - Engine loop
- [ ] sedan_horn.mp3 - Horn
- [ ] sedan_skid.mp3 - Tire skid
- [ ] sedan_impact.mp3 - Collision

### Truck (4 files)
- [ ] truck_engine.mp3 - Deep engine loop
- [ ] truck_horn.mp3 - Air horn
- [ ] truck_impact.mp3 - Heavy collision
- [ ] building_destroy.mp3 - Building crash

### Vehicle General (6 files)
- [ ] vehicle_enter.mp3 - Mount vehicle
- [ ] vehicle_exit.mp3 - Dismount
- [ ] vehicle_damage.mp3 - Take damage
- [ ] vehicle_destroy.mp3 - Explosion
- [ ] tier_unlock.mp3 - Unlock chime
- [ ] tier_unlock_fanfare.mp3 - Fanfare

### Kill Sounds (7 files)
- [ ] kill_splat.mp3 - Wet splat
- [ ] kill_crunch.mp3 - Bone crunch
- [ ] kill_squish.mp3 - Soft squish
- [ ] roadkill.mp3 - Vehicle roadkill
- [ ] multi_kill.mp3 - Multi-kill bonus
- [ ] body_thud.mp3 - Body hitting ground
- [ ] blood_splatter.mp3 - Blood spray

### Cop Enemy (10 files)
- [ ] cop_spawn.mp3 - Cop appears
- [ ] cop_alert.mp3 - Alert shout
- [ ] cop_punch.mp3 - Punch attack
- [ ] cop_death.mp3 - Death cry
- [ ] taser_fire.mp3 - Taser discharge
- [ ] taser_hit.mp3 - Taser hit player
- [ ] taser_loop.mp3 - Being tased loop
- [ ] taser_escape.mp3 - Break free
- [ ] gunshot.mp3 - Pistol shot
- [ ] bullet_whiz.mp3 - Near miss

### Cop Vehicles (8 files)
- [ ] siren_loop.mp3 - Police siren
- [ ] siren_wail.mp3 - Short wail
- [ ] cop_car_engine.mp3 - Car engine loop
- [ ] cop_car_ram.mp3 - Ram impact
- [ ] cop_car_destroy.mp3 - Wreck explosion
- [ ] motorbike_cop_engine.mp3 - Moto engine
- [ ] motorbike_cop_ram.mp3 - Ram attack
- [ ] bike_cop_pedal.mp3 - Pedaling loop

### Pedestrians (3 files)
- [ ] pedestrian_scream.mp3 - Death scream
- [ ] pedestrian_panic.mp3 - Panic yelp
- [ ] crowd_ambient.mp3 - Ambient chatter

### Combo & Scoring (12 files)
- [ ] combo_increment.mp3 - Kill combo tick
- [ ] combo_milestone_5.mp3 - Killing Spree
- [ ] combo_milestone_10.mp3 - Rampage
- [ ] combo_milestone_15.mp3 - Unstoppable
- [ ] combo_milestone_20.mp3 - Godlike
- [ ] combo_milestone_30.mp3 - Massacre
- [ ] combo_milestone_50.mp3 - Legendary
- [ ] combo_lost.mp3 - Combo break
- [ ] score_tick.mp3 - Score increment
- [ ] points_popup.mp3 - Points appear

### Rampage Mode (5 files)
- [ ] rampage_enter.mp3 - Enter rampage
- [ ] rampage_loop.mp3 - Ambient chaos
- [ ] rampage_exit.mp3 - Exit rampage
- [ ] rampage_heartbeat.mp3 - Heartbeat loop
- [ ] ancestor_whisper.mp3 - Ghost whispers

### Heat & Wanted (5 files)
- [ ] heat_increase.mp3 - Heat rising
- [ ] wanted_star_up.mp3 - Star gained
- [ ] wanted_star_down.mp3 - Star lost
- [ ] pursuit_start.mp3 - Chase begins
- [ ] pursuit_end.mp3 - Chase ends

### Player Damage (4 files)
- [ ] player_hit.mp3 - Take damage
- [ ] player_hurt.mp3 - Pain grunt
- [ ] player_death.mp3 - Death sound
- [ ] game_over.mp3 - Game over sting

### UI Sounds (8 files)
- [ ] ui_click.mp3 - Button click
- [ ] ui_hover.mp3 - Hover sound
- [ ] ui_confirm.mp3 - Confirm action
- [ ] ui_cancel.mp3 - Cancel action
- [ ] ui_notification.mp3 - Notification pop
- [ ] ui_alert.mp3 - Alert sound
- [ ] menu_open.mp3 - Menu opens
- [ ] menu_close.mp3 - Menu closes

### Music (4 files)
- [ ] music_menu.mp3 - Menu music
- [ ] music_gameplay.mp3 - Gameplay loop
- [ ] music_rampage.mp3 - Rampage music
- [ ] music_game_over.mp3 - Game over music

### Ambient (2 files)
- [ ] ambient_city.mp3 - City sounds
- [ ] wind_loop.mp3 - Wind sound

---

## File Locations

### Audio System Code
- `src/audio/AudioManager.ts` - Core audio engine
- `src/audio/GameAudio.ts` - Game-specific audio API
- `src/audio/sounds.ts` - Sound registry and configs
- `src/audio/index.ts` - Module exports

### Integration Points
- `src/core/Engine.ts` - Main game integration
- `src/components/ui/Menus.tsx` - UI sound integration (TODO)
- `src/components/ui/NotificationSystem.tsx` - Notification sounds (TODO)
- `src/entities/*.ts` - Entity-specific sounds (TODO)

### Audio Files (to be created)
- `public/audio/sfx/` - Sound effects
- `public/audio/music/` - Music tracks
- `public/audio/ambient/` - Ambient loops

---

## Priority Order

1. **High Priority** - Core gameplay feel
   - Kill sounds
   - Attack whooshes
   - Combo milestones
   - Vehicle engines
   - Rampage enter/exit

2. **Medium Priority** - Polish
   - Cop sounds (spawn, attacks, death)
   - UI sounds
   - Taser mechanics
   - Pedestrian screams

3. **Lower Priority** - Atmosphere
   - Ambient loops
   - Music tracks
   - Subtle UI sounds
   - Environmental sounds

---

## Notes

- All sound IDs are defined in `src/audio/sounds.ts`
- Sound configs include volume, pitch, pitch variation, and pooling settings
- Pooled sounds are reused for performance (kills, hits, footsteps)
- Music crossfades automatically between tracks
- Ducking system lowers music during big impacts
- Engine loops pitch-shift based on vehicle speed
