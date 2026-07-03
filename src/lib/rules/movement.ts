import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { hasSkill } from '@/lib/models/Player'
import { PITCH_COLUMNS, PITCH_ROWS, isOnPitch } from '@/lib/models/PitchCoordinates'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import { assessDodge } from '@/lib/rules/dodge'
import type { DodgeAssessment } from '@/lib/rules/dodge'

/** Extra squares a player may Rush (Go For It) after their Movement Allowance is spent. */
export const MAX_RUSHES = 2
/** A Rush roll succeeds on a 2+. */
export const RUSH_TARGET = 2
export const RUSH_CHANCE = (7 - RUSH_TARGET) / 6

export interface MoveStep {
  from: PitchCoordinates
  to: PitchCoordinates
  /** 1-based position of this step within the player's whole move. */
  stepNumber: number
  /** True when this step is beyond the player's MA and needs a Rush roll. */
  isRush: boolean
  /** Dodge test for leaving `from`; undefined when no dodge is required there. */
  dodge?: DodgeAssessment
  /** Chance this single step succeeds, without any re-rolls. */
  chance: number
}

export interface MovePathAssessment {
  steps: MoveStep[]
  /** Steps paid from Movement Allowance. */
  normalSteps: number
  /** Steps taken as Rushes, beyond Movement Allowance. */
  rushSteps: number
  /** Chance every roll on the path succeeds, with no re-rolls. */
  successChance: number
  /**
   * Chance the path succeeds when the single per-turn Dodge skill re-roll is
   * spent on the first failed dodge it may legally re-roll. Only present when
   * the re-roll actually improves the odds.
   */
  withDodgeRerollChance?: number
}

export interface ReachableSquare {
  row: number
  column: number
  /** Steps from the current path end (shortest-route distance). */
  distance: number
  /** Total squares moved this activation, counting the already-chosen path. */
  totalSteps: number
  /** Rush rolls needed over the whole move to end on this square. */
  rushesNeeded: number
  /** Chance of surviving the remaining steps to this square via the best shortest route, no re-rolls. */
  chance: number
  /** Euclidean length of the route; ties on chance prefer straighter (shorter) routes. */
  length: number
  /** Previous square on that best route. */
  previous: PitchCoordinates
}

/** Reachable squares indexed [row - 1][column - 1]; undefined where the player cannot go. */
export type MovementGrid = (ReachableSquare | undefined)[][]

function buildStep(
  players: FieldedPlayer[],
  player: FieldedPlayer,
  from: PitchCoordinates,
  to: PitchCoordinates,
  stepNumber: number
): MoveStep {
  const isRush = stepNumber > player.movement
  // assessDodge reads the mover's position, so evaluate a copy standing on `from`.
  const dodge = assessDodge(players, { ...player, row: from.row, column: from.column }, to)
  const step: MoveStep = {
    from,
    to,
    stepNumber,
    isRush,
    chance: (isRush ? RUSH_CHANCE : 1) * (dodge.required ? dodge.successChance : 1)
  }
  if (dodge.required) step.dodge = dodge
  return step
}

/**
 * Assess the rolls needed for `player` to walk `path` (successive adjacent
 * squares, starting from the square adjacent to their current position).
 */
export function assessMovePath(
  players: FieldedPlayer[],
  player: FieldedPlayer,
  path: PitchCoordinates[]
): MovePathAssessment {
  const steps: MoveStep[] = []
  let from: PitchCoordinates = { row: player.row, column: player.column }
  path.forEach((to, index) => {
    steps.push(buildStep(players, player, from, to, index + 1))
    from = to
  })

  let successChance = 1
  for (const step of steps) successChance *= step.chance

  const assessment: MovePathAssessment = {
    steps,
    normalSteps: Math.min(steps.length, player.movement),
    rushSteps: Math.max(0, steps.length - player.movement),
    successChance
  }

  if (hasSkill(player, 'Dodge')) {
    // The Dodge skill re-roll is once per turn, so walk the path backwards
    // tracking success odds with and without the re-roll still in hand.
    let withReroll = 1
    let withoutReroll = 1
    for (let i = steps.length - 1; i >= 0; i--) {
      const step = steps[i]
      const rush = step.isRush ? RUSH_CHANCE : 1
      const dodgeChance = step.dodge ? step.dodge.successChance : 1
      const rerollable = Boolean(step.dodge?.withRerollChance)
      withReroll =
        rush *
        (dodgeChance * withReroll +
          (rerollable ? (1 - dodgeChance) * dodgeChance * withoutReroll : 0))
      withoutReroll *= rush * dodgeChance
    }
    if (withReroll > successChance) assessment.withDodgeRerollChance = withReroll
  }

  return assessment
}

/**
 * All squares the player can still reach, continuing from the end of the
 * already-chosen `path`. A breadth-first search finds the shortest route to
 * each square; among equally short routes the one with the best success
 * chance wins and is recorded via `previous` for `pathTo` to reconstruct.
 */
export function movementGrid(
  players: FieldedPlayer[],
  player: FieldedPlayer,
  path: PitchCoordinates[]
): MovementGrid {
  const grid: MovementGrid = Array.from({ length: PITCH_ROWS }, () =>
    new Array<ReachableSquare | undefined>(PITCH_COLUMNS).fill(undefined)
  )
  const stepsUsed = path.length
  const budget = player.movement + MAX_RUSHES - stepsUsed
  if (budget <= 0) return grid

  const start = stepsUsed ? path[stepsUsed - 1] : { row: player.row, column: player.column }

  const occupied = new Set<string>()
  for (const other of players) {
    if (other.id !== player.id) occupied.add(`${other.row},${other.column}`)
  }

  const visited = new Set<string>([`${start.row},${start.column}`])
  let frontier: { position: PitchCoordinates; chance: number; length: number }[] = [
    { position: start, chance: 1, length: 0 }
  ]

  for (let distance = 1; distance <= budget && frontier.length; distance++) {
    const stepNumber = stepsUsed + distance
    const ring = new Map<string, ReachableSquare>()

    for (const node of frontier) {
      for (let row = node.position.row - 1; row <= node.position.row + 1; row++) {
        for (let column = node.position.column - 1; column <= node.position.column + 1; column++) {
          if (row === node.position.row && column === node.position.column) continue
          if (!isOnPitch({ row, column })) continue
          const key = `${row},${column}`
          if (visited.has(key) || occupied.has(key)) continue

          const step = buildStep(players, player, node.position, { row, column }, stepNumber)
          const chance = node.chance * step.chance
          const length =
            node.length + Math.hypot(row - node.position.row, column - node.position.column)
          const existing = ring.get(key)
          if (
            existing &&
            (existing.chance > chance ||
              (existing.chance === chance && existing.length <= length))
          )
            continue
          ring.set(key, {
            row,
            column,
            distance,
            totalSteps: stepNumber,
            rushesNeeded: Math.max(0, stepNumber - player.movement),
            chance,
            length,
            previous: node.position
          })
        }
      }
    }

    frontier = []
    for (const entry of ring.values()) {
      visited.add(`${entry.row},${entry.column}`)
      grid[entry.row - 1][entry.column - 1] = entry
      frontier.push({
        position: { row: entry.row, column: entry.column },
        chance: entry.chance,
        length: entry.length
      })
    }
  }

  return grid
}

/**
 * Reconstruct the best route recorded in `grid` from the search start to
 * `target`, exclusive of the start square. Empty when the target is
 * unreachable.
 */
export function pathTo(grid: MovementGrid, target: PitchCoordinates): PitchCoordinates[] {
  const result: PitchCoordinates[] = []
  let entry = grid[target.row - 1]?.[target.column - 1]
  while (entry) {
    result.unshift({ row: entry.row, column: entry.column })
    if (entry.distance === 1) break
    entry = grid[entry.previous.row - 1][entry.previous.column - 1]
  }
  return result
}
