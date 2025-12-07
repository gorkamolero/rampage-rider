# Audio Files Needed for Rampage Rider

All files should be placed in `public/audio/` with the following structure.

---

## Directory Structure

```
public/audio/
├── sfx/
│   ├── player/
│   ├── attacks/
│   ├── vehicles/
│   ├── kills/
│   ├── cops/
│   ├── pedestrians/
│   ├── combo/
│   ├── rampage/
│   ├── damage/
│   └── ui/
├── music/
└── ambient/
```

---

## SFX - Player Movement (5 files)

| File | Path | Description |
|------|------|-------------|
| `footstep_run.mp3` | `sfx/player/footstep_run.mp3` | Running footstep (pooled, plays frequently) |
| `footstep_walk.mp3` | `sfx/player/footstep_walk.mp3` | Walking footstep (slower pace) |
| `jump.mp3` | `sfx/player/jump.mp3` | Jump launch sound |
| `land.mp3` | `sfx/player/land.mp3` | Normal landing |
| `land_hard.mp3` | `sfx/player/land_hard.mp3` | Heavy/hard landing |

---

## SFX - Player Attacks (5 files)

| File | Path | Description |
|------|------|-------------|
| `knife_whoosh.mp3` | `sfx/attacks/knife_whoosh.mp3` | Knife swing whoosh (pooled) |
| `knife_hit.mp3` | `sfx/attacks/knife_hit.mp3` | Knife hitting pedestrian (pooled) |
| `knife_hit_cop.mp3` | `sfx/attacks/knife_hit_cop.mp3` | Knife hitting cop - meatier sound (pooled) |
| `punch_whoosh.mp3` | `sfx/attacks/punch_whoosh.mp3` | Punch swing (pooled) |
| `punch_hit.mp3` | `sfx/attacks/punch_hit.mp3` | Punch connect (pooled) |

---

## SFX - Bicycle (4 files)

| File | Path | Description |
|------|------|-------------|
| `bicycle_pedal.mp3` | `sfx/vehicles/bicycle_pedal.mp3` | Pedaling loop (loopable) |
| `bicycle_bell.mp3` | `sfx/vehicles/bicycle_bell.mp3` | Bicycle bell ding |
| `bicycle_slash.mp3` | `sfx/attacks/bicycle_slash.mp3` | Bicycle slash attack (pooled) |
| `bicycle_hit.mp3` | `sfx/attacks/bicycle_hit.mp3` | Bicycle slash hit (pooled) |

---

## SFX - Motorbike (4 files)

| File | Path | Description |
|------|------|-------------|
| `motorbike_engine.mp3` | `sfx/vehicles/motorbike_engine.mp3` | Engine loop (loopable, pitch shifts with speed) |
| `motorbike_rev.mp3` | `sfx/vehicles/motorbike_rev.mp3` | Engine rev up |
| `motorbike_shoot.mp3` | `sfx/attacks/motorbike_shoot.mp3` | Drive-by gunshot (pooled) |
| `motorbike_blast.mp3` | `sfx/attacks/motorbike_blast.mp3` | Blast attack explosion |

---

## SFX - Sedan (4 files)

| File | Path | Description |
|------|------|-------------|
| `sedan_engine.mp3` | `sfx/vehicles/sedan_engine.mp3` | Car engine loop (loopable) |
| `sedan_horn.mp3` | `sfx/vehicles/sedan_horn.mp3` | Car horn |
| `sedan_skid.mp3` | `sfx/vehicles/sedan_skid.mp3` | Tire skid/screech |
| `sedan_impact.mp3` | `sfx/vehicles/sedan_impact.mp3` | Car collision impact (pooled) |

---

## SFX - Truck (4 files)

| File | Path | Description |
|------|------|-------------|
| `truck_engine.mp3` | `sfx/vehicles/truck_engine.mp3` | Deep diesel engine loop (loopable) |
| `truck_horn.mp3` | `sfx/vehicles/truck_horn.mp3` | Air horn blast |
| `truck_impact.mp3` | `sfx/vehicles/truck_impact.mp3` | Heavy collision impact (pooled) |
| `building_destroy.mp3` | `sfx/vehicles/building_destroy.mp3` | Building destruction crash |

---

## SFX - Vehicle General (6 files)

| File | Path | Description |
|------|------|-------------|
| `vehicle_enter.mp3` | `sfx/vehicles/vehicle_enter.mp3` | Mount/enter vehicle |
| `vehicle_exit.mp3` | `sfx/vehicles/vehicle_exit.mp3` | Dismount vehicle |
| `vehicle_damage.mp3` | `sfx/vehicles/vehicle_damage.mp3` | Vehicle takes damage (pooled) |
| `vehicle_destroy.mp3` | `sfx/vehicles/vehicle_destroy.mp3` | Vehicle explosion/destruction |
| `tier_unlock.mp3` | `sfx/vehicles/tier_unlock.mp3` | Tier unlock chime |
| `tier_unlock_fanfare.mp3` | `sfx/vehicles/tier_unlock_fanfare.mp3` | Tier unlock fanfare/stinger |

---

## SFX - Kill Sounds (7 files)

| File | Path | Description |
|------|------|-------------|
| `kill_splat.mp3` | `sfx/kills/kill_splat.mp3` | Wet splat sound (pooled) |
| `kill_crunch.mp3` | `sfx/kills/kill_crunch.mp3` | Bone crunch (pooled) |
| `kill_squish.mp3` | `sfx/kills/kill_squish.mp3` | Soft squish (pooled) |
| `roadkill.mp3` | `sfx/kills/roadkill.mp3` | Vehicle roadkill impact (pooled) |
| `multi_kill.mp3` | `sfx/kills/multi_kill.mp3` | Multi-kill bonus sound |
| `body_thud.mp3` | `sfx/kills/body_thud.mp3` | Body hitting ground (pooled) |
| `blood_splatter.mp3` | `sfx/kills/blood_splatter.mp3` | Blood spray sound (pooled) |

---

## SFX - Cop Enemies (10 files)

| File | Path | Description |
|------|------|-------------|
| `cop_spawn.mp3` | `sfx/cops/cop_spawn.mp3` | Cop appears/spawns |
| `cop_alert.mp3` | `sfx/cops/cop_alert.mp3` | Cop alert shout |
| `cop_punch.mp3` | `sfx/cops/cop_punch.mp3` | Cop punch attack (pooled) |
| `cop_death.mp3` | `sfx/cops/cop_death.mp3` | Cop death cry (pooled) |
| `taser_fire.mp3` | `sfx/cops/taser_fire.mp3` | Taser discharge |
| `taser_hit.mp3` | `sfx/cops/taser_hit.mp3` | Taser hitting player |
| `taser_loop.mp3` | `sfx/cops/taser_loop.mp3` | Being tased electrical loop (loopable) |
| `taser_escape.mp3` | `sfx/cops/taser_escape.mp3` | Breaking free from taser |
| `gunshot.mp3` | `sfx/cops/gunshot.mp3` | Pistol shot (pooled) |
| `bullet_whiz.mp3` | `sfx/cops/bullet_whiz.mp3` | Bullet near miss (pooled) |

---

## SFX - Cop Vehicles (8 files)

| File | Path | Description |
|------|------|-------------|
| `siren_loop.mp3` | `sfx/cops/siren_loop.mp3` | Police siren (loopable) |
| `siren_wail.mp3` | `sfx/cops/siren_wail.mp3` | Short siren wail burst |
| `cop_car_engine.mp3` | `sfx/cops/cop_car_engine.mp3` | Cop car engine loop (loopable) |
| `cop_car_ram.mp3` | `sfx/cops/cop_car_ram.mp3` | Cop car ram impact |
| `cop_car_destroy.mp3` | `sfx/cops/cop_car_destroy.mp3` | Cop car destruction |
| `motorbike_cop_engine.mp3` | `sfx/cops/motorbike_cop_engine.mp3` | Motorbike cop engine (loopable) |
| `motorbike_cop_ram.mp3` | `sfx/cops/motorbike_cop_ram.mp3` | Motorbike cop ram attack |
| `bike_cop_pedal.mp3` | `sfx/cops/bike_cop_pedal.mp3` | Bike cop pedaling (loopable) |

---

## SFX - Pedestrians (3 files)

| File | Path | Description |
|------|------|-------------|
| `pedestrian_scream.mp3` | `sfx/pedestrians/pedestrian_scream.mp3` | Death scream (pooled) |
| `pedestrian_panic.mp3` | `sfx/pedestrians/pedestrian_panic.mp3` | Panic yelp/gasp (pooled) |
| `crowd_ambient.mp3` | `sfx/pedestrians/crowd_ambient.mp3` | Ambient crowd chatter (loopable) |

---

## SFX - Combo & Scoring (10 files)

| File | Path | Description |
|------|------|-------------|
| `combo_increment.mp3` | `sfx/combo/combo_increment.mp3` | Kill added to combo (pooled) |
| `combo_milestone_5.mp3` | `sfx/combo/combo_milestone_5.mp3` | "KILLING SPREE!" (5 combo) |
| `combo_milestone_10.mp3` | `sfx/combo/combo_milestone_10.mp3` | "RAMPAGE!" (10 combo) |
| `combo_milestone_15.mp3` | `sfx/combo/combo_milestone_15.mp3` | "UNSTOPPABLE!" (15 combo) |
| `combo_milestone_20.mp3` | `sfx/combo/combo_milestone_20.mp3` | "GODLIKE!" (20 combo) |
| `combo_milestone_30.mp3` | `sfx/combo/combo_milestone_30.mp3` | "MASSACRE!" (30 combo) |
| `combo_milestone_50.mp3` | `sfx/combo/combo_milestone_50.mp3` | "LEGENDARY!" (50 combo) |
| `combo_lost.mp3` | `sfx/combo/combo_lost.mp3` | Combo break/lost sound |
| `score_tick.mp3` | `sfx/combo/score_tick.mp3` | Score increment tick (pooled) |
| `points_popup.mp3` | `sfx/combo/points_popup.mp3` | Points appearing (pooled) |

---

## SFX - Rampage Mode (5 files)

| File | Path | Description |
|------|------|-------------|
| `rampage_enter.mp3` | `sfx/rampage/rampage_enter.mp3` | Enter rampage dimension - dramatic |
| `rampage_loop.mp3` | `sfx/rampage/rampage_loop.mp3` | Ambient chaos loop (loopable) |
| `rampage_exit.mp3` | `sfx/rampage/rampage_exit.mp3` | Exit rampage - reality returns |
| `rampage_heartbeat.mp3` | `sfx/rampage/rampage_heartbeat.mp3` | Heartbeat loop (loopable) |
| `ancestor_whisper.mp3` | `sfx/rampage/ancestor_whisper.mp3` | Ghost whispers (pooled) |

---

## SFX - Heat & Wanted (5 files)

| File | Path | Description |
|------|------|-------------|
| `heat_increase.mp3` | `sfx/combo/heat_increase.mp3` | Heat level rising |
| `wanted_star_up.mp3` | `sfx/combo/wanted_star_up.mp3` | Wanted star gained |
| `wanted_star_down.mp3` | `sfx/combo/wanted_star_down.mp3` | Wanted star lost |
| `pursuit_start.mp3` | `sfx/combo/pursuit_start.mp3` | Cops start chasing |
| `pursuit_end.mp3` | `sfx/combo/pursuit_end.mp3` | Lost the cops |

---

## SFX - Player Damage (4 files)

| File | Path | Description |
|------|------|-------------|
| `player_hit.mp3` | `sfx/damage/player_hit.mp3` | Player takes damage (pooled) |
| `player_hurt.mp3` | `sfx/damage/player_hurt.mp3` | Pain grunt |
| `player_death.mp3` | `sfx/damage/player_death.mp3` | Death sound |
| `game_over.mp3` | `sfx/damage/game_over.mp3` | Game over sting |

---

## SFX - UI Sounds (8 files)

| File | Path | Description |
|------|------|-------------|
| `ui_click.mp3` | `sfx/ui/ui_click.mp3` | Button click |
| `ui_hover.mp3` | `sfx/ui/ui_hover.mp3` | Button hover |
| `ui_confirm.mp3` | `sfx/ui/ui_confirm.mp3` | Confirm action |
| `ui_cancel.mp3` | `sfx/ui/ui_cancel.mp3` | Cancel action |
| `ui_notification.mp3` | `sfx/ui/ui_notification.mp3` | Notification pop |
| `ui_alert.mp3` | `sfx/ui/ui_alert.mp3` | Alert/warning sound |
| `menu_open.mp3` | `sfx/ui/menu_open.mp3` | Menu opens |
| `menu_close.mp3` | `sfx/ui/menu_close.mp3` | Menu closes |

---

## Music (4 files)

| File | Path | Description |
|------|------|-------------|
| `music_menu.mp3` | `music/music_menu.mp3` | Menu/title screen music (loopable) |
| `music_gameplay.mp3` | `music/music_gameplay.mp3` | Main gameplay loop (loopable) |
| `music_rampage.mp3` | `music/music_rampage.mp3` | Intense rampage music (loopable) |
| `music_game_over.mp3` | `music/music_game_over.mp3` | Game over/defeat music |

---

## Ambient (2 files)

| File | Path | Description |
|------|------|-------------|
| `ambient_city.mp3` | `ambient/ambient_city.mp3` | City ambient sounds (loopable) |
| `wind_loop.mp3` | `ambient/wind_loop.mp3` | Wind sound for speed (loopable) |

---

## Summary

| Category | Count |
|----------|-------|
| Player Movement | 5 |
| Player Attacks | 5 |
| Bicycle | 4 |
| Motorbike | 4 |
| Sedan | 4 |
| Truck | 4 |
| Vehicle General | 6 |
| Kill Sounds | 7 |
| Cop Enemies | 10 |
| Cop Vehicles | 8 |
| Pedestrians | 3 |
| Combo & Scoring | 10 |
| Rampage Mode | 5 |
| Heat & Wanted | 5 |
| Player Damage | 4 |
| UI Sounds | 8 |
| Music | 4 |
| Ambient | 2 |
| **TOTAL** | **98 files** |

---

## Audio Specifications

### Format
- **Format**: MP3 (recommended) or OGG
- **Sample Rate**: 44.1kHz
- **Bit Rate**: 128-192kbps for SFX, 192-256kbps for music

### Duration Guidelines
- **Footsteps**: 0.1-0.3s
- **Attack whooshes**: 0.2-0.4s
- **Hit sounds**: 0.1-0.3s
- **Kill sounds**: 0.2-0.5s
- **Loops**: 2-10s (seamless loop point)
- **Music**: 60-180s (seamless loop)
- **Fanfares/Stingers**: 1-3s
- **UI clicks**: 0.05-0.15s

### Notes on Pooled Sounds
Sounds marked as "pooled" play very frequently (multiple times per second during combat). These should:
- Be short (under 0.5s)
- Have clean attack/release
- Work well when overlapped
- Have slight pitch variation built into the system

### Notes on Loops
Sounds marked as "loopable" should:
- Have seamless loop points
- No obvious start/end artifacts
- Consistent volume throughout
