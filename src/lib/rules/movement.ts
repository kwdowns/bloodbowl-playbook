import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { hasSkill } from '@/lib/models/Player'
import type { Player } from '@/lib/models/Player'
import {
  PITCH_COLUMNS,
  PITCH_ROWS,
  isAdjacent,
  isOnPitch,
  samePosition
} from '@/lib/models/PitchCoordinates'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import { assessDodge } from '@/lib/rules/dodge'
import type { DodgeAssessment } from '@/lib/rules/dodge'

/** Each square moved beyond MA is a Rush: it fails (player falls over) on a D6 roll of 1. */
export const RUSH_TARGET = 2
export const RUSH_CHANCE = (7 - RUSH_TARGET) / 6

/** How many Rushes the player may attempt in one activation. */
export function maxRushes(player: Player): number {
  return hasSkill(player, 'Sprint') ? 3 : 2
}

export interface MoveStep {
  from: PitchCoordinates
  to: PitchCoordinates
  /** 1-based number of squares moved so far, including this one. */
  stepNumber: number
  /** True when this square is beyond the player's MA and needs a Rush. */
  rush: boolean
  /** Present when leaving `from` requires a Dodge test. */
  dodge?: DodgeAssessment
  /** Chance this single step succeeds, without any re-rolls. */
  chance: number
}

export interface MovePathAssessment {
  steps: MoveStep[]
  rushesUsed: number
  dodgesRequired: number
  /** Chance the whole path succeeds without re-rolls. */
  successChance: number
  /**
   * Chance the whole path succeeds using the Dodge and Sure Feet skill
   * re-rolls the player has (each usable once per turn); equals
   * `successChance` when neither applies.
   */
  successChanceWithSkills: number
}

/**
 * Assess a single square of movement. `stepNumber` counts every square moved
 * this activation (1-based), so squares past the player's MA become Rushes.
 */
export function assessMoveStep(
  players: FieldedPlayer[],
  mover: FieldedPlayer,
  from: PitchCoordinates,
  to: PitchCoordinates,
  stepNumber: number
): MoveStep {
  const rush = stepNumber > mover.movement
  const dodgeAssessment = assessDodge(players, mover, to, from)
  const dodge = dodgeAssessment.required ? dodgeAssessment : undefined
  const chance = (rush ? RUSH_CHANCE : 1) * (dodge?.successChance ?? 1)
  return { from, to, stepNumber, rush, dodge, chance }
}

/** Assess a full planned path (each entry one square, starting adjacent to the mover). */
export function assessMovePath(
  players: FieldedPlayer[],
  mover: FieldedPlayer,
  path: PitchCoordinates[]
): MovePathAssessment {
  const steps: MoveStep[] = []
  let from: PitchCoordinates = { row: mover.row, column: mover.column }
  path.forEach((to, index) => {
    steps.push(assessMoveStep(players, mover, from, to, index + 1))
    from = to
  })
  return {
    steps,
    rushesUsed: steps.filter((step) => step.rush).length,
    dodgesRequired: steps.filter((step) => step.dodge).length,
    successChance: steps.reduce((product, step) => product * step.chance, 1),
    successChanceWithSkills: pathChanceWithSkills(steps, hasSkill(mover, 'Sure Feet'))
  }
}

interface RollTest {
  chance: number
  rerollKind?: 'dodge' | 'rush'
}

/**
 * Exact chance of completing every test in sequence when the first failed
 * Dodge / Rush may be re-rolled once via the matching skill. Any unre-rolled
 * failure ends the move (the player falls over).
 */
function pathChanceWithSkills(steps: MoveStep[], sureFeet: boolean): number {
  const tests: RollTest[] = []
  for (const step of steps) {
    if (step.rush) tests.push({ chance: RUSH_CHANCE, rerollKind: sureFeet ? 'rush' : undefined })
    if (step.dodge) {
      tests.push({
        chance: step.dodge.successChance,
        // assessDodge only offers withRerollChance when the player has Dodge
        // and no Tackle marker denies it.
        rerollKind: step.dodge.withRerollChance !== undefined ? 'dodge' : undefined
      })
    }
  }

  function chanceFrom(index: number, dodgeReroll: boolean, rushReroll: boolean): number {
    if (index === tests.length) return 1
    const test = tests[index]
    let chance = test.chance * chanceFrom(index + 1, dodgeReroll, rushReroll)
    const canReroll =
      (test.rerollKind === 'dodge' && dodgeReroll) || (test.rerollKind === 'rush' && rushReroll)
    if (canReroll) {
      chance +=
        (1 - test.chance) *
        test.chance *
        chanceFrom(index + 1, dodgeReroll && test.rerollKind !== 'dodge', rushReroll && test.rerollKind !== 'rush')
    }
    return chance
  }

  return chanceFrom(0, true, true)
}

export interface ReachableSquare {
  /** Total squares moved from the player's starting square, planned steps included. */
  steps: number
  /** Rushes needed on the best route. */
  rushes: number
  /** Success chance of the best route's remaining steps, without re-rolls. */
  chance: number
  /** Best-chance continuation from the search start (exclusive) to this square. */
  path: PitchCoordinates[]
}

/** Indexed `[row - 1][column - 1]`, like PitchGrid. */
export type ReachabilityGrid = (ReachableSquare | undefined)[][]

const NEIGHBOR_OFFSETS = [-1, 0, 1]
  .flatMap((dr) => [-1, 0, 1].map((dc) => ({ dr, dc })))
  .filter(({ dr, dc }) => dr !== 0 || dc !== 0)

/**
 * Best route to every square reachable from `start` when `stepsTaken` squares
 * of movement are already spent and at most `stepLimit` may be spent in total.
 * "Best" maximizes the no-re-roll success chance, breaking ties on fewer squares.
 */
export function reachableSquares(
  players: FieldedPlayer[],
  mover: FieldedPlayer,
  start: PitchCoordinates,
  stepsTaken: number,
  stepLimit: number
): ReachabilityGrid {
  const occupied = new Set(
    players.filter((p) => p.id !== mover.id).map((p) => `${p.row},${p.column}`)
  )
  const best: ReachabilityGrid = Array.from({ length: PITCH_ROWS }, () =>
    new Array<ReachableSquare | undefined>(PITCH_COLUMNS).fill(undefined)
  )

  interface Frontier {
    position: PitchCoordinates
    chance: number
    path: PitchCoordinates[]
  }
  let frontier = new Map<string, Frontier>([
    [`${start.row},${start.column}`, { position: start, chance: 1, path: [] }]
  ])

  for (let step = stepsTaken + 1; step <= stepLimit && frontier.size > 0; step++) {
    const next = new Map<string, Frontier>()
    for (const entry of frontier.values()) {
      for (const { dr, dc } of NEIGHBOR_OFFSETS) {
        const to = { row: entry.position.row + dr, column: entry.position.column + dc }
        const key = `${to.row},${to.column}`
        if (!isOnPitch(to) || occupied.has(key)) continue
        const stepChance = assessMoveStep(players, mover, entry.position, to, step).chance
        const chance = entry.chance * stepChance
        const candidate: Frontier = { position: to, chance, path: [...entry.path, to] }
        const existing = next.get(key)
        if (!existing || chance > existing.chance) next.set(key, candidate)

        // Record the overall best route to this square. Earlier (fewer-step)
        // routes win ties because they are seen first.
        const reached = best[to.row - 1][to.column - 1]
        if ((!reached || chance > reached.chance + 1e-12) && !samePosition(to, start)) {
          best[to.row - 1][to.column - 1] = {
            steps: step,
            rushes: Math.max(0, step - mover.movement),
            chance,
            path: candidate.path
          }
        }
      }
    }
    frontier = next
  }

  return best
}

/** True when each path entry is on the pitch, unoccupied, and adjacent to the previous square. */
export function isValidMovePath(
  players: FieldedPlayer[],
  mover: FieldedPlayer,
  path: PitchCoordinates[]
): boolean {
  let from: PitchCoordinates = { row: mover.row, column: mover.column }
  for (const square of path) {
    if (!isOnPitch(square) || !isAdjacent(from, square)) return false
    if (players.some((p) => p.id !== mover.id && samePosition(p, square))) return false
    from = square
  }
  return true
}
