# Grand Strategy React Game — Project Plan

## 1) Vision & Scope
**Goal:** A Paradox-style, pausable real-time grand strategy game (Victoria/EU vibes) in the browser. Focus on macro: economy, diplomacy, warfare, tech/ideas, and dynamic events over centuries/decades.

**Non-goals (v1):** 3D unit models, naval pathfinding over global bathymetry, multiplayer desync recovery tooling, advanced mod loader UI.

**Design pillars:**
- **Readable map-first UI** with layered information (political, terrain, trade, supply).
- **Deep but deterministic simulation** (seeded RNG, reproducible saves, easy replay).
- **Data-driven content** (JSON + schemas) for modding and rapid iteration.
- **Smooth performance** on mid-range laptops (60 FPS render target, ≤20 Hz sim ticks).

---

## 2) Tech Stack (Recommended)
- **Language:** TypeScript
- **App framework:** React + Vite
- **UI state:** Zustand (or Redux Toolkit if you prefer explicit reducers)
- **Simulation architecture:** ECS (e.g., `bitecs`) + fixed-step loop in a **Web Worker** using **Comlink**
- **Renderer (map & effects):** **Three.js** via **react-three-fiber (R3F)**
- **Text rendering:** SDF/MSDF text (e.g., `troika-three-text`) for crisp labels
- **2D overlays/markers:** either R3F planes or a separate Canvas 2D layer (for HUD)
- **Pathfinding/graphs:** `graphology` for province graphs; Dijkstra/A*; custom heuristics
- **Data tooling:** `mapshaper`, `topojson`, QGIS (provinces/regions), `geojson-vt` if tiling needed
- **Build & quality:** ESLint, Prettier, Vitest/Jest, Playwright for E2E
- **Persistence:** IndexedDB (idb) + save compression (lz4/fflate)
- **Localization:** i18next + ICU message format

**Why Three.js/R3F over web map libs?** Paradox-style maps aren’t slippy GIS maps; they’re **art-directed**: custom borders, relief lighting, water shaders, province color lookups, fog-of-war. Three.js gives full control for **stylized political/terrain modes**, animated coastlines, and shader-driven effects. (See §4 for style implementation.)

**Alternatives (when they make sense):**
- **PixiJS** (2D WebGL): simpler than 3D; great for sprite-heavy UI; fewer shader capabilities out-of-the-box.
- **MapLibre GL** (vector tiles): fast to prototype if you already have GIS data; harder to reach Paradox look & deterministic projection; tiling adds complexity you likely don’t need.

---

## 3) Map Data Pipeline
**Goal:** Deterministic provinces with adjacency for movement, war, trade, and labels.

**Data model:**
- `Province`: id, polygon(s), centroid, area, neighbors[], terrain, region, ownerTag, controllerTag, supplyLimit, populationStats (by pop type), buildings[], resources[]
- `Country`: tag, color, gov, acceptedCultures[], primaryCulture, techs[], ideas[], stability, treasury, manpower
- `Region/State`: grouping of provinces for administration/economy
- `Graph`: province adjacency (undirected), borders as edge paths

**Authoring workflows (pick one):**
1. **Vector-first (recommended):** Draw provinces in QGIS/Illustrator → export GeoJSON → `mapshaper` (topology simplification/cleaning) → **TopoJSON** for compact storage + adjacency → custom preprocessor to emit:
   - province mesh buffers
   - border paths → SDF atlas (for glowing/outlined borders)
   - adjacency list for movement
2. **Bitmap-first (classic Paradox-ish):** Paint index-colored province map → vectorize (`potrace`/custom) → same as above. Easier to author, harder to maintain crisp borders at multiple zooms.

**Projection:** Static (e.g., Plate Carrée, Robinson, Winkel Tripel). Deterministic and avoids tile reprojection jitter.

**Tiling:** For huge polygon counts, pre-slice into screen-space-friendly chunks or use `geojson-vt` and build instanced meshes per tile. For most indie scales, a single optimized mesh per layer is fine.

---

## 4) Achieving the Paradox-Style Map (Visual Recipe)
**Layers & effects:**
- **Terrain base:** pre-baked height/normal maps + subtle tri-planar normal mapping in a fragment shader for soft relief.
- **Water:** screen-space animated normal maps; shoreline foam via distance field from coastline; world-space UVs for slow drift.
- **Province fill:** country-color lookup via a 1×N **palette texture** indexed by `ownerTag` (instanced or attribute-driven). Occupation/claims/cores rendered as **hatching** (screen-space repeating pattern) blended atop fill.
- **Borders:** render polygon edges to an SDF texture offline → in shader, draw crisp multi-width borders with inner/outer glows; different styles for country/state/province.
- **Fog of war:** height-based + faction-visibility stencil; vignette in screen corners for vibe.
- **Labels:** MSDF text with halo (outline) and dynamic size by zoom; curved along major features using path-text for rivers/coasts (optional).
- **Map modes:** toggle material uniforms & layer visibility; reuse geometry.

**Interaction:**
- Hover/selection via **GPU picking**: render provinces to an offscreen ID buffer → read pixel under cursor to get province id. Fast and exact.
- Camera: R3F controls with zoom-to-cursor; clamp zoom ranges; zoom snaps adjust label density.

---

## 5) Architecture Overview
**Separation of concerns:**
- **Renderer thread (UI):** React (components, HUD, windows), R3F (map), input, animations.
- **Simulation thread (Worker):** ECS systems run on fixed Δt (e.g., 50 ms). All sim state **immutable per tick**; messages diffed to UI.
- **Bridge:** Comlink RPC; UI sends commands (player actions), Worker returns state diffs & notifications (tick complete, events).

**Determinism essentials:**
- Single **seeded PRNG** (`seedrandom` or xoroshiro128+) in Worker.
- No Date.now/random in UI; all RNG through sim.
- Fixed-point or rational numbers for economy-sensitive math; or carefully clamped floats.
- Record **command queue** with timestamps for replays and desync checks.

---

## 6) Core Systems (MVP-first)
1. **Time & Tick**
   - Pausable real-time with speed multipliers (0, 0.5, 1, 2, 4).
   - Scheduler for periodic updates (daily/monthly). Monthly aggregation keeps perf predictable.

2. **Economy (MVP)**
   - Goods, provinces produce via buildings (input → output, workforce, throughput modifiers).
   - Local markets form into **regional markets**; prices via supply/demand clearing each month.
   - Trade routes: capacity (infrastructure), tariffs, convoy need (if sea), price diffusion.

3. **Population & Society (optional early, deep later)**
   - Pops: size, strata, culture, religion, literacy, wealth; consumption → needs → standard of living.
   - Migration, promotion/demotion, interest groups → politics.

4. **Diplomacy**
   - Relations, opinion, trust, infamy/threat, truces, alliances, guarantees, subjects.
   - Crises/plays system as structured negotiation (escalation with demands & backing).

5. **Warfare**
   - Province graph movement with supply limits & attrition.
   - Combat: frontage, phases, terrain modifiers, morale/organization, general traits.
   - War score from battles, occupations, goals.

6. **Technology/Ideas**
   - Tree or card-draw journal; unlock buildings, modifiers, CBs.

7. **Events & Decisions**
   - Data-driven events (trigger → options → effects list). Deterministic RNG roll gates.
   - Journal/mission system for soft guidance.

8. **AI**
   - **Utility AI** (scored actions) for country-level choices; GOAP for war planning.
   - Strategic layers: economy, diplomacy, military; each proposes actions with scores.
   - Heuristics read from JSON to tune behavior without shipping code changes.

---

## 7) Data & Modding
- All entities defined in **JSON** with JSON Schema validation.
- Hot-reloadable data in dev; soft reload in prod (no full refresh).
- Declarative **effects language** (`add_modifier`, `set_owner`, `spawn_event`, etc.).
- Localization files per key in ICU format; pluralization rules honored.
- Save files: snapshot + recent command log for replay/resync.

---

## 8) UI/UX Plan
- **Shell:** Top bar (date/time, speed, resources), **Outliner** (armies, constructions, diplomacy), **Message feed** with filters, **Sidebar panel** for selected entity.
- **Province panel:** owner/controller, pops, buildings, modifiers, supply, construction queue.
- **Map mode toolbar:** political, terrain, development, markets, supply, diplomatic relations, wars.
- **Tooltip system:** rich, delay-tuned, with breakdowns (hovering a number shows formula).
- **Command feedback:** every action enqueues a visible order with ETA; errors explain “why not”.
- **Accessibility:** colorblind-safe palette, remappable keys, readable font sizes, reduced motion setting.

---

## 9) Multiplayer (v2+)
- Deterministic **lockstep**: clients simulate; only player commands over network.
- Host as authority for OOS checks; periodic state hash compare; fast-forward resync on mismatch.
- NAT traversal or lightweight relay server.

---

## 10) Testing & Quality
- **Unit tests** for systems (economy clearing, combat resolution, event triggers).
- **Property-based tests** (e.g., no negative stockpiles after month close).
- **Golden tests** for event chains & AI openings.
- **Performance budgets:**
  - Render: ≤ 6 ms/frame on mid laptops; draw calls < 2k; triangles < 2M.
  - Sim: ≤ 20 ms for monthly tick on 2k provinces.
- **Profiling:** Web Vitals, React Profiler, Spector.js for WebGL.

---

## 11) Productionizing & Telemetry
- Feature flags and experiment toggles.
- Crash reporting (Sentry) and anonymized gameplay metrics (opt-in dev builds).
- Versioned save compatibility; simple migrator.

---

## 12) Milestones (Execution Plan)
**Phase 0 — Foundations (1–2 weeks)**
- Repo setup, CI, TypeScript config, lint/test, Vite, basic shell.
- R3F scene with camera; Web Worker wired with Comlink; seeded RNG; deterministic harness.

**Phase 1 — Map MVP (2–4 weeks)**
- Import 500–1,500 province TopoJSON; build province mesh; GPU picking.
- Country coloring, borders SDF, labels, simple terrain base, fog toggle.

**Phase 2 — Time & Economy Skeleton (3–5 weeks)**
- Fixed-step loop; daily→monthly scheduler.
- Goods, buildings, simple regional market; price clearing; construction queue.

**Phase 3 — Diplomacy & War (4–6 weeks)**
- Relations, treaties, CBs; war/peace flow; occupation; movement & combat MVP; supply & attrition.

**Phase 4 — Events/Tech/Journal (3–5 weeks)**
- Event pipeline & UI; decisions; tech/ideas gating production and CBs.

**Phase 5 — AI & UX polish (4–8 weeks)**
- Utility AI for economy/diplomacy/war; message settings; map modes; performance passes.

**Phase 6 — Content & Balance (ongoing)**
- More goods, buildings, events, ideas; achievement scaffolding.

(*Adjust durations to team size; run vertical slices end-to-end at each phase.*)

---

## 13) Best Practices (Cheat Sheet)
- **Keep sim off the React thread.** UI stays snappy; Worker owns truth.
- **Determinism first.** Ban non-deterministic APIs from sim; one RNG.
- **Data-driven everything.** Events, modifiers, AI weights in JSON, not code.
- **Map as the primary UI.** Numbers live in tooltips/panels, not overlays cluttering the map.
- **Profile early.** If a system is O(N²), redesign before adding content.
- **Autosaves & ironman-ready.** Regular save rotation; checksum displayed for desync hunting.

---

## 14) Implementation Notes (Code Sketches)
**Fixed-step loop (Worker):**
```ts
const TICK_MS = 50; // 20 Hz
let acc = 0, last = performance.now();
function frame(now = performance.now()){
  acc += now - last; last = now;
  while(acc >= TICK_MS){
    runSystems(TICK_MS/1000);
    acc -= TICK_MS;
  }
  postMessage({ type: 'tick', dt: TICK_MS, diff: exportDiff() });
  setTimeout(frame, 0);
}
```

**GPU picking (R3F):** render ID buffer (one draw) → `gl.readPixels(x,y,1,1,RGBA,UNSIGNED_BYTE,buf)` → decode id.

**Province color via palette texture:** province attribute `ownerIndex` → fragment shader samples `sampler2D palette` at `vec2((ownerIndex+0.5)/N, 0.5)`.

---

## 15) Map / Graphics Library Recommendation (TL;DR)
**Pick:** **Three.js with react-three-fiber** + custom shaders, `troika-three-text`, and your own province/border pipeline.
- **Pros:** Unlimited styling to match Paradox look; performant; great ecosystem; works perfectly in React.
- **Cons:** More initial work than MapLibre; you own the shader pipeline.

**If you prefer 2D:** **PixiJS + pixi-viewport** is a solid alternative; easier text & sprites, still fast for 10–50k shapes.

**If GIS-first:** **MapLibre GL** with custom vector tiles, but expect compromises for the Paradox aesthetic.

---

## 16) Next Steps (Concrete To‑Dos)
- Decide projection & art direction (screenshots, color palette, border styles).
- Build a tiny “vertical slice”: 100 provinces, political mode only, selection + country coloring + daily tick.
- Lock determinism contract and save format before adding more systems.
- Stand up JSON schemas for data and a micro tool to validate packs on import.
- Draft your **Map Style Bible** (borders, glows, water, labels) to keep the look consistent.

