# Repository Guidelines

## Project Structure & Module Organization
- Vite + React (TypeScript) entry in `src/index.tsx`; `src/App.tsx` drives game state and UI overlay.
- Game logic split by concern: `src/core` (engine, physics, AI manager), `src/entities` (Player, Cop, Pedestrian models), `src/managers` (crowd/cop coordination), `src/rendering` (decals, particles), and `src/lib/utils.ts` helpers.
- UI lives in `src/components` with `ui/` primitives and `GameCanvas` for the Three.js scene; shared enums/types live in `src/types.ts` and `src/constants.ts`.
- Assets load from `public/assets/**`; GLTF paths are centralized in `src/core/AssetLoader.ts`. Reference docs/specs in `docs/` and root `*_SPEC.md` files for behaviors and animations.

## Build, Test, and Development Commands
- `npm install` — install dependencies (use Node 18+).
- `npm run dev` — start Vite dev server; use `--host` when testing on devices.
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve the built bundle locally to sanity-check release output.

## Coding Style & Naming Conventions
- TypeScript with React 19; favor functional components and hooks. Two-space indentation, single quotes, and trailing semicolons match existing files.
- Components and classes use `PascalCase`; hooks start with `use*`; utility functions use `camelCase`.
- Prefer `@/` alias for imports; keep UI classes inline with Tailwind v4 and theme tokens defined in `src/index.css`. Reuse primitives in `src/components/ui/` before adding new styles.
- Keep gameplay constants and enums in `src/constants.ts` or `src/types.ts` instead of scattering literals.

## Testing Guidelines
- No automated test suite yet; perform manual playthroughs covering menu → play → game over, attack combos, and pedestrian collisions on every change.
- Before opening a PR, run `npm run build` to catch bundling issues. If adding tests, colocate `*.test.ts(x)` near sources and prefer Vitest + React Testing Library.

## Commit & Pull Request Guidelines
- Follow existing Conventional-style prefixes: `feat:`, `fix:`, `tune:`, `docs:`. Keep commits focused on one change set.
- PRs should include: a short summary, linked issue/spec, reproduction or playtest steps, and media (screenshots or brief clips) for UI/gameplay changes. Call out any new assets (paths, sizes) and config edits.

## Assets & Configuration Tips
- Store new binaries in `public/assets/` (or existing `animation-pack/` / `kaykit-*` folders) and keep filenames stable for caching. Update `src/core/AssetLoader.ts` when paths change.
- Tailwind theme is defined inline in `src/index.css`; adjust tokens there rather than scattering custom colors/styles.***
