# Thin Chess — Project Status

_Last updated: {{today}}_

## 1) Overview
Thin Chess is a minimalist 1×12 chess variant presented on a single column of squares. Pieces: king (±1), rook (any distance), knight (±2 jump). Kings cannot move into check. This repo aims to provide a lightweight, installable, offline‑capable web app (GitHub Pages or Vercel) with an interactive board, a perfect‑play solver for the current rules, and a simple position editor.

## 2) Goals (MVP)
- **Playable UI**: touch/mouse friendly 1×12 board with legal‑move highlighting and move execution.
- **Correct rules**: legal move generation; king cannot move into check; checkmate/stalemate detection; repetition treated as draw in the solver.
- **Built‑in solver**: tri‑valued outcome (WIN/LOSS/DRAW) for side‑to‑move with a principal variation and an approximate ply bound; small transposition table.
- **Position I/O**: human‑readable position code (`w/b + k/r/n`, `x` for empty; 12 cells top→bottom; side as `:w`/`:b`). Load/save via UI field and clipboard.
- **PWA**: installable with offline cache (manifest + service worker). Works fully offline after first load.
- **Hosting**: static build deployable to GitHub Pages (project pages) with a minimal CI workflow.

## 3) Stretch Goals (post‑MVP)
- URL share (`?pos=`) with compressed state.
- Endgame tablebase cache in `localStorage` for instant evaluations.
- Opening trainer mode with generated puzzles from solved trees.
- Sounds, haptics, and theme toggle (high‑contrast option).

## 4) Non‑Goals (for now)
- Networked multiplayer, engines beyond the defined rules, or AI outside of the exact solver.
- Arbitrary piece types, en passant, castling, pawns, promotions, 2D boards.

## 5) Rules (source of truth for engine)
- **Board**: 1 file of 12 ranks (indexed 1..12 top→bottom).
- **Pieces**: `k`, `r`, `n` with side `w`/`b`.
- **Moves**: `k` moves ±1; `n` jumps ±2 (leaper; color‑bound); `r` slides any distance ±1 direction. All captures by displacement. Rooks cannot jump over pieces. Knights ignore intervening squares. Kings may not move into check.
- **Game end**: no legal moves → if in check = **checkmate**; else **stalemate** (draw).
- **Repetition**: any cycle discovered by the solver is scored **draw**.

## 6) Position Encoding
- 12 comma‑separated tokens, top→bottom. Token set: `x` for empty; otherwise `[wb][krn]`.
- Append the side to move as `:w` or `:b`.
- Example (default start): `bk,br,bn,br,bn,x,x,wn,wr,wn,wr,wk:w`.

## 7) MVP Deliverables
- **`index.html`** single‑page app _or_ **Vite+TS** project (whichever is fastest for the agent).
- **Engine**: move generator, legality filter, terminal detection, attack map, encode/decode.
- **Solver**: depth‑first negamax or tri‑valued solver with transposition table and cycle detection.
- **UI**: board rendering, selection/targets, move execution, undo/redo, swap side, solve/best‑move buttons, position editor.
- **PWA**: manifest + service worker (precache static assets) using a simple plugin or hand‑rolled SW.
- **CI**: GitHub Actions workflow to build and publish to Pages.

## 8) Architecture Sketch
- `engine.ts` — types, encode/decode, legal move gen, checks, apply.
- `solver.ts` — `solve(pos) -> {res, depth, best}` with TT and cycle draw.
- `ui.tsx` / `App.tsx` — state, history, handlers, rendering.
- `pwa` — manifest + SW (vite plugin or workbox‑lite).

## 9) Definition of Done
- Local dev server runs; basic lint passes.
- All rule examples and edge cases covered (king can’t step into check; correct stalemate/mate).
- Solver returns consistent results across reloads.
- App is installable and works offline after first visit.
- Deployed at `https://<user>.github.io/<repo>/` and loads without console errors.

---

# Coding Agent Prompt

> System/Task: Plan and implement the Thin Chess MVP for GitHub Pages using a minimal stack. Read `PROJECT_STATUS.md` first and follow it as the single source of truth for rules and goals.

**Instructions**
1. **Read** this file (`PROJECT_STATUS.md`) and extract: rules, position encoding, MVP deliverables, and Definition of Done.
2. **Plan** a lightweight implementation targeted at **GitHub Pages** (project pages). Prefer a small Vite + TypeScript + vanilla CSS/Tailwind setup; you may also use a single‑file `index.html` if it materially reduces complexity while still meeting PWA requirements.
3. **Produce** the following artifacts:
   - Source files for engine (`engine.ts`) and solver (`solver.ts`).
   - UI app (`index.html` + `src/App.tsx` or a single‑file app) that renders a 1×12 board, supports selection/targets/movement, shows side to move, and provides buttons: **Undo**, **Redo**, **Reset**, **Swap Side**, **Best Move**, **Solve**.
   - Position Editor with load/copy using the specified encoding.
   - PWA manifest and service worker that precaches the app for offline use.
   - GitHub Actions workflow that builds and publishes to **Pages** under a project subpath (set the correct `base`/asset paths).
4. **Conform** strictly to the rules in Section 5 and the encoding in Section 6. Treat repetition in the search path as draw.
5. **Keep it small**: no server, no external backend, no heavy UI kits. Only dependencies allowed: build tooling, Tailwind (optional), and a tiny icon set if needed.
6. **Verify** Definition of Done items locally (dev server + basic test script for tricky move legality and mate/stalemate cases).
7. **Output** a final summary listing files created, how to run locally, and how the GitHub Pages deployment is configured.

**Acceptance Criteria**
- Running `npm i && npm run build` creates a static bundle that works offline and passes basic smoke tests.
- Pushing to `main` deploys to `https://<USER>.github.io/<REPO>/` via the included workflow.
- Solver returns tri‑state results and provides a best move for non‑terminal positions.
- UI is responsive, keyboard/touch friendly, and shows legal targets clearly.

**Nice‑to‑Have (do only if time remains after MVP)**
- URL query import/export for positions (compressed if feasible).

---

**Notes for Contributor(s)**
- Keep code readable; prefer small pure functions; no reflection/dynamic eval.
- Add a small `tests/` script (node) to probe legality edge cases: blocked rook rays, king adjacency, repetition draw behavior.
- If Pages base path is non‑root, ensure the app’s asset URLs use the configured `base`. If using Vite, parameterize via `GH_PAGES=true` env in the build script.

