# UI System

## Tailwind CSS v4 + shadcn/ui

Uses **Tailwind v4** (NOT v3):
- Config via `@import "tailwindcss"` in CSS (no tailwind.config.js)
- Vite plugin: `@tailwindcss/vite`
- CSS variables in `src/index.css` using `@theme`

## 8bitcn Components

Registry: `https://www.8bitcn.com/r/{name}.json`

```bash
npx shadcn@latest add @8bitcn/health-bar
npx shadcn@latest add @8bitcn/button
```

Key components: `health-bar`, `mana-bar`, `progress`, `badge`, `dialog`, `kbd`

Full list: `docs/8bitcn-components.md`

## Path Aliases

```typescript
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
```

## Adding Components

1. Install from @8bitcn first (retro aesthetic)
2. Fallback: `npx shadcn@latest add component-name`
3. Import with @ alias
