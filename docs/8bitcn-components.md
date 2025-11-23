# 8bitcn Component Library Reference

**Registry**: `@8bitcn` → `https://www.8bitcn.com/r/{name}.json`

**Style**: Retro 8-bit/pixel-art styled React components with light/dark theme support

## Installation
```bash
npx shadcn@latest add @8bitcn/component-name
```

---

## Available Components

### 🎮 Gaming-Specific Components

| Component | Usage for Rampage Rider | Priority |
|-----------|------------------------|----------|
| **Health Bar** | Player HP display | ⭐⭐⭐ High |
| **Enemy Health** | Cop HP when targeting | ⭐⭐ Medium |
| **Mana Bar** | Heat meter visualization | ⭐⭐⭐ High |
| **Progress** | Combo meter, tier unlock progress | ⭐⭐⭐ High |
| **Item** 🆕 | Pickup/power-up display | ⭐⭐ Medium |
| **Spinner** 🆕 | Loading physics engine | ⭐ Low |

### 🎨 UI Controls

| Component | Usage | Priority |
|-----------|-------|----------|
| **Button** | Menus, actions | ⭐⭐⭐ High |
| **Card** | Stats panels, menus | ⭐⭐⭐ High |
| **Badge** | Kill count, tier indicator | ⭐⭐⭐ High |
| **Dialog** | Tier unlock popups | ⭐⭐⭐ High |
| **Toast** | Kill streak notifications | ⭐⭐ Medium |
| **Kbd** 🆕 | Control hints (WASD, Space) | ⭐⭐ Medium |
| **Alert** | Game over, warnings | ⭐⭐ Medium |
| **Alert Dialog** | Confirm restart, etc. | ⭐ Low |

### 📊 Data Display

| Component | Usage | Priority |
|-----------|-------|----------|
| **Table** | High score leaderboard | ⭐⭐ Medium |
| **Chart** | Stats visualization (game over) | ⭐ Low |
| **Avatar** | Player tier icon | ⭐ Low |
| **Skeleton** | Loading states | ⭐ Low |

### 🎛️ Form & Input

| Component | Usage | Priority |
|-----------|-------|----------|
| **Slider** | Audio settings, sensitivity | ⭐⭐ Medium |
| **Switch** | Toggle options (sound, particles) | ⭐⭐ Medium |
| **Checkbox** | Settings checkboxes | ⭐ Low |
| **Radio Group** | Difficulty selection | ⭐ Low |
| **Select** | Dropdown menus | ⭐ Low |
| **Input** | Name entry for leaderboard | ⭐ Low |
| **Textarea** | (Not needed) | ❌ None |

### 🧭 Navigation

| Component | Usage | Priority |
|-----------|-------|----------|
| **Tabs** | Settings categories | ⭐⭐ Medium |
| **Breadcrumb** | (Not needed) | ❌ None |
| **Navigation Menu** | (Not needed) | ❌ None |
| **Menubar** | (Not needed) | ❌ None |
| **Pagination** | Leaderboard pages | ⭐ Low |
| **Sidebar** | (Not needed) | ❌ None |

### 🎭 Overlays & Modals

| Component | Usage | Priority |
|-----------|-------|----------|
| **Dialog** | Tier unlock, mod selection | ⭐⭐⭐ High |
| **Drawer** | Settings panel (mobile) | ⭐⭐ Medium |
| **Sheet** | Alternative to Drawer | ⭐ Low |
| **Popover** | Tooltips, info bubbles | ⭐ Low |
| **Hover Card** | Tier preview on hover | ⭐ Low |
| **Tooltip** | Button hints | ⭐⭐ Medium |
| **Context Menu** | (Not needed) | ❌ None |
| **Dropdown Menu** | Options menu | ⭐ Low |

### 🎨 Visual & Layout

| Component | Usage | Priority |
|-----------|-------|----------|
| **Separator** | Visual dividers | ⭐⭐ Medium |
| **Scroll Area** | Long content (credits) | ⭐ Low |
| **Carousel** | Tier showcase | ⭐ Low |
| **Collapsible** | Expandable sections | ⭐ Low |
| **Resizable** | (Not needed) | ❌ None |
| **Empty** 🆕 | Empty state displays | ⭐ Low |

### 🌓 Theme & Special

| Component | Usage | Priority |
|-----------|-------|----------|
| **Theme Selector** 🆕 | Light/dark mode toggle | ⭐ Low |
| **Retro Switcher** 🆕 | Style variant selector | ⭐ Low |
| **Toggle** | Binary options | ⭐ Low |
| **Toggle Group** | Mutually exclusive options | ⭐ Low |

### 📅 Date & Time (Not Needed)

| Component | Usage | Priority |
|-----------|-------|----------|
| **Calendar** | (Not needed) | ❌ None |
| **Date Picker** | (Not needed) | ❌ None |

### 🔧 Utility

| Component | Usage | Priority |
|-----------|-------|----------|
| **Label** | Form labels | ⭐ Low |
| **Input OTP** | (Not needed) | ❌ None |
| **Combo Box** | Searchable select | ⭐ Low |
| **Command** | Command palette | ❌ None |

---

## Recommended Installation Order

### Phase 1: Essential Game UI
```bash
npx shadcn@latest add @8bitcn/button
npx shadcn@latest add @8bitcn/card
npx shadcn@latest add @8bitcn/health-bar
npx shadcn@latest add @8bitcn/mana-bar
npx shadcn@latest add @8bitcn/progress
npx shadcn@latest add @8bitcn/badge
npx shadcn@latest add @8bitcn/dialog
```

### Phase 2: Enhanced UX
```bash
npx shadcn@latest add @8bitcn/toast
npx shadcn@latest add @8bitcn/kbd
npx shadcn@latest add @8bitcn/separator
npx shadcn@latest add @8bitcn/tooltip
npx shadcn@latest add @8bitcn/alert
```

### Phase 3: Settings & Menus
```bash
npx shadcn@latest add @8bitcn/slider
npx shadcn@latest add @8bitcn/switch
npx shadcn@latest add @8bitcn/tabs
npx shadcn@latest add @8bitcn/drawer
```

### Phase 4: Polish & Extra Features
```bash
npx shadcn@latest add @8bitcn/table
npx shadcn@latest add @8bitcn/enemy-health
npx shadcn@latest add @8bitcn/item
npx shadcn@latest add @8bitcn/spinner
```

---

## Component Usage Examples for Rampage Rider

### HUD Overlay
```tsx
import { HealthBar } from "@/components/ui/health-bar"
import { ManaBar } from "@/components/ui/mana-bar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

<div className="hud">
  <HealthBar value={stats.health} max={100} />
  <ManaBar value={stats.heat} max={100} label="HEAT" />
  <Badge variant="destructive">Kills: {stats.kills}</Badge>
  <Progress value={(stats.kills / nextMilestone) * 100} />
</div>
```

### Main Menu
```tsx
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

<Card className="menu-card">
  <CardHeader>
    <CardTitle>RAMPAGE RIDER</CardTitle>
  </CardHeader>
  <CardContent>
    <Button size="lg" onClick={startGame}>START GAME</Button>
    <Button variant="outline">SETTINGS</Button>
  </CardContent>
</Card>
```

### Tier Unlock Dialog
```tsx
import { Dialog } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

<Dialog open={showUnlock}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>TIER UNLOCKED!</DialogTitle>
      <DialogDescription>
        You've reached <Badge>{tierName}</Badge>
      </DialogDescription>
    </DialogHeader>
    {/* Mod selection UI */}
  </DialogContent>
</Dialog>
```

### Kill Streak Toast
```tsx
import { toast } from "@/hooks/use-toast"

toast({
  title: "COMBO x5!",
  description: "Kill streak active",
  variant: "default",
})
```

### Control Hints
```tsx
import { Kbd } from "@/components/ui/kbd"

<div className="controls">
  <Kbd>W</Kbd><Kbd>A</Kbd><Kbd>S</Kbd><Kbd>D</Kbd> Move
  <Kbd>Space</Kbd> Attack
</div>
```

---

## Notes

- All components support **light** and **dark** themes automatically
- Components have **retro/8-bit pixel-art styling** built-in
- Perfect aesthetic match for a video game like Rampage Rider
- Components are **accessible** (ARIA labels, keyboard navigation)
- Built on **Radix UI primitives** (same as shadcn/ui)

## Documentation

- Full docs: https://www.8bitcn.com/docs/components
- Individual component pages: https://www.8bitcn.com/docs/components/{component-name}
