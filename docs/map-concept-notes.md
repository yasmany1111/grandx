# Map Concept — Paradox-Style Layout

## Overview
- **Renderer:** Leaflet (`react-leaflet`) with a custom CRS and gradient backdrops, rendering province GeoJSON for a stylized political map.
- **Interaction:** Hover + selection wired through a Zustand store, surfacing data cards and sidebar intel.
- **Modes:** Political, terrain, supply, development, diplomacy — mapped to palettes per the `docs/game-plan.md` design pillars.
- **UI shell:** Top timeline bar, left map-mode rail, right province dossier, and bottom alert ticker to echo classic Paradox ergonomics.
- **World layout:** Leaflet renders combined `world-geojson` country polygons (Western Europe slice) to give us production-quality borders without hand authoring.

## Current Scope
- Mock world (`mock-world.ts`) seeds 13 provinces across three polities plus an offshore isle, with clean shared borders for overlays.
- Map canvas now renders GeoJSON directly from the dataset using the default Leaflet projection; styling layers adapt based on the active map mode.
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
