# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

An interactive Blood Bowl (2020 edition rules) scenario tool: place players on a pitch, analyze block dice odds, and visualize tackle-zone control and dodge targets. Vue 3 (`<script setup>` + Composition API), Pinia, Tailwind CSS, Vite, TypeScript.

## Commands

```sh
npm run dev          # Vite dev server
npm run test:unit    # Vitest (watch mode by default)
npx vitest run       # run tests once
npx vitest run src/lib/rules/__tests__/blocks.spec.ts   # single file
npx vitest run -t 'gives two dice'                      # single test by name
npm run type-check   # vue-tsc
npm run build        # type-check + production build
npm run lint         # ESLint with --fix
```

## Architecture

Three layers, dependency direction strictly downward: components → Pinia store → rules/models.

- **`src/lib/models/`** — plain types and pitch constants. `Player` stats follow BB2020 conventions: `agility`/`passing`/`armor` are *target numbers* (3 means "succeeds on 3+"), not old-style ratings. `Team` is `'Offense' | 'Defense'`, rendered as red/blue in the UI. Skills are stored as `SkillName[]` string literals from `Skill.ts`. `FieldedPlayer = Player & PitchCoordinates`.
- **`src/lib/rules/`** — pure functions over `FieldedPlayer[]`, no Vue/Pinia imports; this is where all game math lives and where unit tests are (`__tests__/`). `blocks.ts` computes assists (Guard-aware) and dice count/chooser; `blockDice.ts` computes the probability distribution of the *applied* block result assuming the chooser picks the best die for their side — "best" is derived from `resultEffects()`, which factors in Block/Dodge/Tackle; `tackleZones.ts` builds per-square zone-count grids; `dodge.ts` computes dodge target numbers and re-roll odds.
- **`src/stores/playerStore.ts`** — single store owning the roster *and* UI state (selection, block target, overlay mode, placement template). All pitch click behavior is routed through `squareClicked()` (place / select / target-block / move); components don't implement interaction logic themselves. Derived analysis (`blockAnalysis`, `zones`) is exposed as computeds over the rules functions.
- **Components** — `GamePitch.vue` flattens the board into `SquareViewModel[]` (see `squareViewModel.ts`) so `PitchSquare.vue`/`PlayerToken.vue` stay dumb. Sidebar panels in `src/components/panels/` each read/write the store directly.

## Coordinate system (easy to get wrong)

- Pitch coordinates are **1-indexed**: `row` 1..26 runs end zone to end zone (length), `column` 1..15 across the width. Constants in `PitchCoordinates.ts`.
- Rule-layer grids (`PitchGrid`) are **0-indexed**: `grid[row - 1][column - 1]`.
- The pitch renders **landscape/transposed**: rows run left→right as display columns, columns run top→bottom. `GamePitch` iterates `column` outer / `row` inner to match CSS grid auto-placement. Square index in the DOM is `(column - 1) * 26 + (row - 1)`.

## Gotchas

- Model filenames are capitalized (`Player.ts`, `Team.ts`) and imports must match exactly — CI/Linux filesystems are case-sensitive.
- `vite.config.ts` sets `base: '/bloodbowl-playbook/'` in production for GitHub Pages (deploy workflow in `.github/workflow.yaml` runs on pushes to `main`); dev serves from `/`.
- Tailwind's `content` glob must keep the `vue` extension or all utility classes silently disappear from the build.
