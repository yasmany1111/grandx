# Map Concept — Paradox-Style Layout

## Overview
- **Renderer:** `@react-three/fiber` + `three` with stylized lighting, flat provinces, and animated water wash.
- **Interaction:** Hover + selection wired through a Zustand store, surfacing data cards and sidebar intel.
- **Modes:** Political, terrain, supply, development, diplomacy — mapped to palettes per the `docs/game-plan.md` design pillars.
- **UI shell:** Top timeline bar, left map-mode rail, right province dossier, and bottom alert ticker to echo classic Paradox ergonomics.

## Current Scope
- Mock world (`mockWorld.ts`) seeds 8 provinces across three polities with adjacency for connective overlays.
- Map canvas batches province "blobs" with deterministic shapes and connection strokes to communicate chokepoints.
- HUD overlays (hover card, fog indicator, legend) demonstrate layering strategy for future metrics.
- Province panel highlights development tiering, supply capacity, and occupation state messaging.

## Follow-Ups
- Swap placeholder province meshes with processed TopoJSON buffers + shader-driven borders once data lands.
- Implement GPU picking buffer to replace per-mesh event handlers (will enable batch draws and high province counts).
- Introduce material variants for map modes (hatching for claims, contour lines for terrain) and state-based animation cues.
- Thread real simulation data into the HUD + panel (population strata, modifiers, construction queue) when systems exist.
- Profile Canvas performance with ≥1k provinces; consider instancing + custom shaders for color lookups.

## Testing & Validation
- Lint (`pnpm lint`) and build (`pnpm build`) once dependencies install locally (`pnpm install --no-frozen-lockfile`).
- Manual smoke: hover/selection, mode toggling, layout responsiveness ≥1280px width.

