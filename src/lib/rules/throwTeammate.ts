import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { hasSkill } from '@/lib/models/Player'
import { PITCH_COLUMNS, PITCH_ROWS, isAdjacent, samePosition } from '@/lib/models/PitchCoordinates'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import {
  D8_DIRECTIONS,
  agilityTestChance,
  markersOnSquare,
  passOutcomeChances,
  passRange,
  scatterThree
} from '@/lib/rules/pass'
import type { BallLandingMap, PassOutcomeChances, PassRange } from '@/lib/rules/pass'
import { emptyGrid } from '@/lib/rules/tackleZones'
import { markingOpponents } from '@/lib/rules/tackleZones'

export interface ThrowTeammateLanding {
  /** Where the thrown player can come down (absolute probabilities). */
  map: BallLandingMap
  /** Lands on an empty square and passes the landing Agility test. */
  safeChance: number
  /** Lands on an empty square but fails the landing test and falls over. */
  proneChance: number
  /** Comes down on an occupied square (treated as a crash landing here). */
  onPlayerChance: number
  /** Thrown into the crowd. */
  crowdChance: number
}

export interface ThrowTeammateAssessment {
  canAttempt: boolean
  reason?: string
  /** Adjacent team-mates with Right Stuff; the first is assumed thrown. */
  candidates: FieldedPlayer[]
  thrownPlayer?: FieldedPlayer
  range: PassRange
  /** Total test modifier (range plus tackle zones on the thrower). */
  modifier: number
  /** Chance the thrower loses their activation to Really Stupid. */
  lostActivationChance: number
  /** True when a non-Really Stupid team-mate is adjacent to help. */
  activationAssisted: boolean
  /** Chance the thrown player is eaten (Always Hungry). */
  eatenChance: number
  /** Chance the team-mate squirms free and the throw is fumbled (Always Hungry). */
  hungryEscapeChance: number
  /** Distribution of the throw itself, given that it is attempted. */
  throwOutcome: PassOutcomeChances
  /** Absolute chance the thrown player is simply dropped (all fumbles). */
  fumbleDropChance: number
  landing: ThrowTeammateLanding
}

const NO_OUTCOME: PassOutcomeChances = {
  accurate: 0,
  inaccurate: 0,
  wildlyInaccurate: 0,
  fumble: 0
}

const EMPTY_LANDING: ThrowTeammateLanding = {
  map: { grid: emptyGrid(), outOfBounds: 0 },
  safeChance: 0,
  proneChance: 0,
  onPlayerChance: 0,
  crowdChance: 0
}

function cannot(
  reason: string,
  range: PassRange,
  candidates: FieldedPlayer[]
): ThrowTeammateAssessment {
  return {
    canAttempt: false,
    reason,
    candidates,
    range,
    modifier: 0,
    lostActivationChance: 0,
    activationAssisted: false,
    eatenChance: 0,
    hungryEscapeChance: 0,
    throwOutcome: NO_OUTCOME,
    fumbleDropChance: 0,
    landing: EMPTY_LANDING
  }
}

/**
 * Assess `thrower` throwing an adjacent Right Stuff team-mate at `target`.
 * A successful test is still only a "landing" throw: the thrown player
 * scatters three squares from the target before landing, exactly like an
 * inaccurate pass; a failed test deviates from the thrower. Landing on an
 * occupied square is approximated as a crash (no further bouncing).
 */
export function assessThrowTeammate(
  players: FieldedPlayer[],
  thrower: FieldedPlayer,
  target: PitchCoordinates
): ThrowTeammateAssessment {
  const range = passRange(thrower, target)
  const candidates = players.filter(
    (p) => p.team === thrower.team && p.id !== thrower.id && isAdjacent(p, thrower) && hasSkill(p, 'Right Stuff')
  )

  if (!hasSkill(thrower, 'Throw Team-mate')) {
    return cannot('The thrower needs the Throw Team-mate skill.', range, candidates)
  }
  if (candidates.length === 0) {
    return cannot('No adjacent team-mate with Right Stuff to throw.', range, candidates)
  }
  if (thrower.passing <= 0) {
    return cannot('This player cannot throw (PA –).', range, candidates)
  }
  if (range !== 'Hand-off' && range !== 'Quick Pass' && range !== 'Short Pass') {
    return cannot('Team-mates can only be thrown quick or short range.', range, candidates)
  }

  const thrownPlayer = candidates[0]
  // An adjacent hand-off distance still counts as a quick throw.
  const rangeModifier = range === 'Short Pass' ? -1 : 0
  const modifier = rangeModifier - markingOpponents(players, thrower).length
  // A TTM throw has no merely-inaccurate result: any non-fumble failure is
  // wildly inaccurate and deviates from the thrower.
  const base = passOutcomeChances(thrower.passing, modifier)
  const throwOutcome: PassOutcomeChances = {
    accurate: base.accurate,
    inaccurate: 0,
    wildlyInaccurate: base.wildlyInaccurate + base.inaccurate,
    fumble: base.fumble
  }

  const reallyStupid = hasSkill(thrower, 'Really Stupid')
  const activationAssisted =
    reallyStupid &&
    players.some(
      (p) =>
        p.team === thrower.team &&
        p.id !== thrower.id &&
        isAdjacent(p, thrower) &&
        !hasSkill(p, 'Really Stupid')
    )
  const lostActivationChance = reallyStupid ? (activationAssisted ? 1 / 6 : 3 / 6) : 0
  const activates = 1 - lostActivationChance

  const alwaysHungry = hasSkill(thrower, 'Always Hungry')
  const eatenChance = alwaysHungry ? activates * (1 / 36) : 0
  const hungryEscapeChance = alwaysHungry ? activates * (5 / 36) : 0
  const throwHappens = activates * (alwaysHungry ? 5 / 6 : 1)

  const fumbleDropChance = hungryEscapeChance + throwHappens * throwOutcome.fumble

  // Landing map: the thrown player is off the board during the flight.
  const others = players.filter((p) => p.id !== thrownPlayer.id)
  const grid = emptyGrid()
  let outOfBounds = 0
  const add = (row: number, column: number, probability: number) => {
    if (probability <= 0) return
    if (row >= 1 && row <= PITCH_ROWS && column >= 1 && column <= PITCH_COLUMNS) {
      grid[row - 1][column - 1] += probability
    } else {
      outOfBounds += probability
    }
  }

  scatterThree(target, throwHappens * throwOutcome.accurate, add)
  for (const [dr, dc] of D8_DIRECTIONS) {
    for (let distance = 1; distance <= 6; distance++) {
      add(
        thrower.row + dr * distance,
        thrower.column + dc * distance,
        (throwHappens * throwOutcome.wildlyInaccurate) / 48
      )
    }
  }

  let safeChance = 0
  let proneChance = 0
  let onPlayerChance = 0
  for (let row = 1; row <= PITCH_ROWS; row++) {
    for (let column = 1; column <= PITCH_COLUMNS; column++) {
      const probability = grid[row - 1][column - 1]
      if (probability <= 0) continue
      const square = { row, column }
      if (others.some((p) => samePosition(p, square))) {
        onPlayerChance += probability
        continue
      }
      const landChance = agilityTestChance(
        thrownPlayer.agility + markersOnSquare(others, square, thrownPlayer.team)
      )
      safeChance += probability * landChance
      proneChance += probability * (1 - landChance)
    }
  }

  return {
    canAttempt: true,
    candidates,
    thrownPlayer,
    range,
    modifier,
    lostActivationChance,
    activationAssisted,
    eatenChance,
    hungryEscapeChance,
    throwOutcome,
    fumbleDropChance,
    landing: {
      map: { grid, outOfBounds },
      safeChance,
      proneChance,
      onPlayerChance,
      crowdChance: outOfBounds
    }
  }
}
