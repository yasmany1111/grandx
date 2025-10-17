# Repository Guidelines

## Project Structure & Module Organization
- Arrange `src/` by feature (`features/map/`, `features/economy/`) with colocated `components/`, `hooks/`, `types.ts`, and `__tests__/`.
- Keep shared primitives in `src/components/` and `src/lib/`; split heavy panels into subcomponent files to keep entry points focused.
- Docs stay in `docs/` (see `docs/game-plan.md`) and should evolve with shipped work.
- Serve-only assets belong in `public/`; ignore `dist/` outputs.
- Root configs (`tsconfig*`, `eslint.config.js`, `vite.config.ts`) are the blueprint for new tooling.

## Build, Test, and Development Commands
- `pnpm dev` — start the Vite dev server with hot reload.
- `pnpm build` — run project references then create the production bundle.
- `pnpm preview` — serve the last build for smoke tests.
- `pnpm lint` — run ESLint; keep the output clean.
- `pnpm biome` / `pnpm biome:fix` — quick syntax/style checks; use `:fix` before committing.

## TypeScript, Style & Component Standards
- Keep strict typing: avoid `any`, narrow unions with guards or `zod`, and declare return types on exported helpers.
- Enforce DRY: promote shared UI into reusable components, extract logic into hooks/utilities, and split subcomponents (`MapPanel/Header.tsx`) when JSX grows.
- Place feature-level shapes in `types.ts` (or `types/index.ts`) and re-export via the feature barrel for clarity.
- Structure Tailwind strings by layout → color → effects, centralize variants through `class-variance-authority`, and reuse palettes from `lib/`.
- Use PascalCase for components, camelCase for helpers, SCREAMING_SNAKE_CASE for constants, and keep tab indentation in `.tsx`/`.ts`.
- Name all files using kebab-case (e.g., `province-panel.tsx`), even for hooks and utilities.
- Never use `export default`; favor named exports for consistency and tree-shaking.

## Testing Guidelines
- Automated tests are pending; when adding coverage, use Vitest + React Testing Library, name files `<unit>.test.tsx`, and colocate them with the source.
- Document manual verification steps in PRs and capture edge-case screenshots for UI-heavy work until the suite stabilizes.
- Prioritize render smoke-tests for map panels and pure unit tests for simulation helpers once that layer arrives.

## Commit & Pull Request Guidelines
- Follow Conventional Commit prefixes (`feat:`, `fix:`, `chore:`, `docs:`) with imperative, ≤72-character subjects.
- PRs include a short summary, linked issues or task IDs, and verification evidence (`pnpm lint`, `pnpm build`, `pnpm preview` when relevant).
- Keep PRs focused; split sweeping map or simulation updates into reviewable slices and flag follow-up tasks.

## Agent Workflow Notes
- Treat `docs/game-plan.md` as the gameplay contract; align UI decisions and terminology with its latest revision.
- For map-layer changes, attach reference screenshots or short clips so reviewers can compare against the Paradox-style target quickly.
