# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GrandX is a React-based interactive map application built with Vite, TypeScript, and Tailwind CSS. The application displays a world map with provinces/territories that can be visualized in different modes (political, terrain, supply, development, diplomacy). It uses Leaflet for map rendering and processes GeoJSON data from the `world-geojson` package. The project aims for a Paradox-style grand strategy game aesthetic.

## Development Commands

**This project uses pnpm as the package manager.**

```bash
# Start development server with hot reload
pnpm dev

# Build for production (runs TypeScript project references + Vite build)
pnpm build

# Preview production build for smoke tests
pnpm preview

# Lint with ESLint
pnpm lint

# Format/lint with Biome
pnpm biome

# Auto-fix with Biome (run before committing)
pnpm biome:fix
```

## Architecture

### State Management

The application uses Zustand for global state management. The primary store is located at:
- `src/features/map/hooks/use-map-interaction.ts` - manages map mode, selected/hovered provinces

### Feature-Based Structure

The codebase follows a feature-based organization pattern where each feature colocates its components, hooks, types, and tests:

```
src/
├── features/map/          # Map feature module
│   ├── components/        # Map-related React components
│   ├── hooks/            # Map-specific Zustand stores and hooks
│   ├── lib/              # Map utilities (colors, projections, GeoJSON processing)
│   ├── data/             # Mock data and GeoJSON processing (mock-world.ts)
│   ├── types.ts          # Map-related TypeScript types
│   └── __tests__/        # Feature-level tests (when added)
├── components/ui/        # Reusable UI components (shadcn/ui based)
├── lib/                  # Shared utilities (cn() for className merging)
├── hooks/                # Shared React hooks
├── types/                # Global TypeScript type definitions
└── docs/                 # Documentation (see docs/game-plan.md)
```

**Module Organization Guidelines:**
- Colocate feature-specific code in `features/[feature-name]/` with `components/`, `hooks/`, `lib/`, `types.ts`, and `__tests__/`
- Keep shared primitives in `src/components/` and `src/lib/`
- When panels grow large, split them into subcomponents (e.g., `MapPanel/Header.tsx`, `MapPanel/Content.tsx`)
- Feature types go in `types.ts` (or `types/index.ts`) and should be re-exported via the feature barrel
- Documentation lives in `docs/` — **treat `docs/game-plan.md` as the gameplay contract** for UI decisions and terminology
- Serve-only assets belong in `public/`; ignore `dist/` outputs

### Key Data Flow

1. **GeoJSON Processing**: The `src/features/map/data/mock-world.ts` file eagerly loads GeoJSON files from `world-geojson` package using Vite's `import.meta.glob()` and transforms them into Province/Country/Region data structures.

2. **Province Data**: Each province includes properties like id, name, centroid, polygon coordinates, owner/controller tags, terrain type, development level, supply limit, and population.

3. **Map Rendering**: The `MapCanvas` component uses react-leaflet to render provinces as GeoJSON layers. Province styling is computed based on the current map mode.

4. **Interactive State**: User interactions (hover, click) update the Zustand store, triggering re-renders of relevant components like `ProvincePanel`, `MapHud`, and visual highlights on the map.

### Map Modes

Five distinct map modes are supported, each visualizing different province attributes:
- **Political**: Shows country ownership and borders
- **Terrain**: Displays terrain types (plains, forest, mountain, desert, coast)
- **Supply**: Visualizes supply limits and logistics capacity
- **Development**: Shows economic development levels
- **Diplomacy**: Displays diplomatic relations and claims

Map mode colors are computed in `src/features/map/lib/map-colors.ts` based on province properties and the active mode.

### Component Layout

The `MapShell` component defines the spatial layout of all UI elements:
- `MapCanvas`: Full-screen map rendering layer
- `MapTopBar`: Centered at top
- `MapHud`: Top-left corner
- `MapModeToolbar` + `MapLegend`: Left side, vertically centered
- `ProvincePanel`: Right side, vertically centered
- `MapEventFeed`: Bottom center

All UI overlays use absolute positioning with z-index layering.

## UI Components

The project uses shadcn/ui components (Radix UI primitives with Tailwind styling). All UI components are in `src/components/ui/` and follow the shadcn/ui patterns:
- Use `cn()` utility from `src/lib/utils.ts` for className merging
- Styled with Tailwind CSS v4 (using `@tailwindcss/vite` plugin)
- Support dark mode via `next-themes`

## Styling

- Tailwind CSS v4 with Vite plugin (`@tailwindcss/vite`)
- Custom animations from `tw-animate-css`
- Leaflet CSS must be imported in `main.tsx`
- Path alias `@/*` maps to `src/*` (configured in vite.config.ts and tsconfig.app.json)

**Tailwind Class Organization:**
- Structure className strings by: **layout → color → effects**
- Centralize variants using `class-variance-authority` (CVA)
- Reuse color palettes from `lib/` utilities where possible

## TypeScript Configuration

- Strict mode enabled with additional checks (noUnusedLocals, noUnusedParameters)
- Uses React 19 with JSX transform
- Two tsconfig files: `tsconfig.app.json` (app code) and `tsconfig.node.json` (build config)
- Path alias: `@/*` → `./src/*`

**Strict Typing Requirements:**
- Avoid `any` at all costs
- Narrow unions with type guards or use `zod` for runtime validation
- Declare explicit return types on all exported helpers
- Keep feature-level types in `types.ts` and re-export via feature barrel

## Code Style & Conventions

**Naming Conventions:**
- **Components**: PascalCase (e.g., `MapCanvas`, `ProvincePanel`)
- **Helpers/functions**: camelCase (e.g., `getProvinceFill`, `deriveTerrain`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `MAP_MODES`, `DEFAULT_MAP_MODE`)
- **Files**: kebab-case for ALL files, including components and hooks (e.g., `province-panel.tsx`, `use-map-interaction.ts`)

**Module Exports:**
- **NEVER use `export default`** — always use named exports for consistency and tree-shaking
- Example: `export const MapCanvas = () => { ... }` NOT `export default MapCanvas`

**Code Organization:**
- **DRY Principle**: Promote shared UI into reusable components, extract logic into hooks/utilities
- Split large components into subcomponents (e.g., `MapPanel/Header.tsx`) when JSX grows
- Extract complex logic into dedicated utilities in `lib/` or `hooks/`

**Formatting:**
- Use tab indentation in `.tsx` and `.ts` files
- Single quotes for strings (enforced by Biome)
- Run `pnpm biome:fix` before committing

## Code Quality

The project uses both ESLint and Biome:
- **ESLint**: TypeScript, React Hooks, and React Refresh rules — keep output clean with `pnpm lint`
- **Biome**: Preferred for formatting and linting (single quotes, tab indentation)
  - Several accessibility rules are disabled in biome.json
  - Run `pnpm biome:fix` to auto-fix issues before committing

When making code changes, prefer running `pnpm biome:fix` to ensure consistency.

## Commit & Pull Request Guidelines

**Commit Messages:**
- Follow Conventional Commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, etc.
- Use imperative mood with ≤72 character subject line
- Examples:
  - `feat: add supply mode visualization to map`
  - `fix: correct province border rendering on zoom`
  - `chore: update dependencies`
  - `docs: update game-plan with economy system`

**Pull Requests:**
- Include a short summary of changes
- Link to related issues or task IDs
- Provide verification evidence: confirm `pnpm lint`, `pnpm build`, and `pnpm preview` succeed
- Keep PRs focused — split large map or simulation updates into reviewable slices
- Flag follow-up tasks in PR description

## Working with Map Changes

When making changes to map rendering or visualization:
- Attach reference screenshots or short clips to PRs for visual comparison
- Align UI decisions with the Paradox-style grand strategy aesthetic
- Ensure changes are consistent with terminology and design described in `docs/game-plan.md`
