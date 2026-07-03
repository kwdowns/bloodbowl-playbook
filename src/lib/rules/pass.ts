import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { hasSkill } from '@/lib/models/Player'
import { isAdjacent, isOnPitch, samePosition } from '@/lib/models/PitchCoordinates'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import type { Team } from '@/lib/models/Team'
import { emptyGrid } from '@/lib/rules/tackleZones'
import type { PitchGrid } from '@/lib/rules/tackleZones'
import { markingOpponents } from '@/lib/rules/tackleZones'

export type PassRange =
  | 'Hand-off'
  | 'Quick Pass'
  | 'Short Pass'
  | 'Long Pass'
  | 'Long Bomb'
  | 'Out of Range'

/** Passing Ability test modifier for each throwable range band. */
export const PASS_RANGE_MODIFIERS: Partial<Record<PassRange, number>> = {
  'Quick Pass': 0,
  'Short Pass': -1,
  'Long Pass': -2,
  'Long Bomb': -3
}

/**
 * Passing range chart, indexed [|Δrow|][|Δcolumn|] with the thrower at the
 * top-left corner (both axes are interchangeable — the chart is symmetric).
 * Q = Quick Pass, S = Short Pass, L = Long Pass, B = Long Bomb,
 * - = out of range. Leagues that use a different chart can edit this table.
 */
export const RANGE_CHART = [
  '-QQQSSSLLLLBBB',
  'QQQQSSSLLLBBBB',
  'QQQSSSSLLLBBBB',
  'QQSSSSSLLLBBB-',
  'SSSSSSLLLLBBB-',
  'SSSSSLLLLBBBB-',
  'SSSSLLLLLBBB--',
  'LLLLLLLLBBBB--',
  'LLLLLLLBBBB---',
  'LLLLLBBBBB----',
  'LBBBBBBBB-----',
  'BBBBBBBB------',
  'BBBBBB--------',
  'BBB-----------'
] as const

const CHART_BANDS: Record<string, PassRange> = {
  Q: 'Quick Pass',
  S: 'Short Pass',
  L: 'Long Pass',
  B: 'Long Bomb'
}

/**
 * Range band between two squares, read off the range chart by the throw
 * vector's two components. An adjacent square is a hand-off.
 */
export function passRange(from: PitchCoordinates, to: PitchCoordinates): PassRange {
  if (samePosition(from, to)) return 'Out of Range'
  if (isAdjacent(from, to)) return 'Hand-off'
  const cell = RANGE_CHART[Math.abs(to.row - from.row)]?.[Math.abs(to.column - from.column)]
  return CHART_BANDS[cell ?? '-'] ?? 'Out of Range'
}

export interface PassOutcomeChances {
  accurate: number
  inaccurate: number
  wildlyInaccurate: number
  fumble: number
}

/**
 * Outcome distribution of a single Passing Ability test.
 * A natural 1 is always a fumble and a natural 6 always succeeds; otherwise
 * the modified result is accurate at `target`+, wildly inaccurate at 1 or
 * less, and inaccurate in between.
 */
export function passOutcomeChances(target: number, modifier: number): PassOutcomeChances {
  const chances: PassOutcomeChances = { accurate: 0, inaccurate: 0, wildlyInaccurate: 0, fumble: 0 }
  for (let die = 1; die <= 6; die++) {
    if (die === 1) chances.fumble += 1 / 6
    else if (die === 6) chances.accurate += 1 / 6
    else {
      const final = die + modifier
      if (final >= target) chances.accurate += 1 / 6
      else if (final <= 1) chances.wildlyInaccurate += 1 / 6
      else chances.inaccurate += 1 / 6
    }
  }
  return chances
}

/** Distribution when any failed test is re-rolled once (e.g. the Pass skill). */
export function withPassReroll(base: PassOutcomeChances): PassOutcomeChances {
  const failed = 1 - base.accurate
  return {
    accurate: base.accurate + failed * base.accurate,
    inaccurate: failed * base.inaccurate,
    wildlyInaccurate: failed * base.wildlyInaccurate,
    fumble: failed * base.fumble
  }
}

/** Chance of passing an agility-style test needing `target`+ (clamped to 2..6). */
export function agilityTestChance(target: number): number {
  return (7 - Math.min(6, Math.max(2, target))) / 6
}

/** Opposing tackle zones on a square, from the perspective of `team`. */
export function markersOnSquare(
  players: FieldedPlayer[],
  square: PitchCoordinates,
  team: Team
): number {
  return players.filter((other) => other.team !== team && isAdjacent(other, square)).length
}

/**
 * Every square the pass travels over: a supercover line walk from the centre
 * of the thrower's square to the centre of the target square. When the line
 * passes exactly through a corner, both adjacent squares count (the ruler
 * has width). The thrower's and target's own squares are excluded.
 */
export function passingLaneSquares(
  from: PitchCoordinates,
  to: PitchCoordinates
): PitchCoordinates[] {
  const result: PitchCoordinates[] = []
  const push = (row: number, column: number) => {
    if (!samePosition({ row, column }, from) && !samePosition({ row, column }, to)) {
      result.push({ row, column })
    }
  }

  let row = from.row
  let column = from.column
  const rowStep = Math.sign(to.row - from.row)
  const columnStep = Math.sign(to.column - from.column)
  const dRow = Math.abs(to.row - from.row)
  const dColumn = Math.abs(to.column - from.column)
  const ddRow = 2 * dRow
  const ddColumn = 2 * dColumn

  if (dRow >= dColumn) {
    let error = dRow
    let errorPrev = dRow
    for (let i = 0; i < dRow; i++) {
      row += rowStep
      error += ddColumn
      if (error > ddRow) {
        column += columnStep
        error -= ddRow
        if (error + errorPrev < ddRow) push(row, column - columnStep)
        else if (error + errorPrev > ddRow) push(row - rowStep, column)
        else {
          push(row, column - columnStep)
          push(row - rowStep, column)
        }
      }
      push(row, column)
      errorPrev = error
    }
  } else {
    let error = dColumn
    let errorPrev = dColumn
    for (let i = 0; i < dColumn; i++) {
      column += columnStep
      error += ddRow
      if (error > ddColumn) {
        row += rowStep
        error -= ddColumn
        if (error + errorPrev < ddColumn) push(row - rowStep, column)
        else if (error + errorPrev > ddColumn) push(row, column - columnStep)
        else {
          push(row - rowStep, column)
          push(row, column - columnStep)
        }
      }
      push(row, column)
      errorPrev = error
    }
  }
  return result
}

export interface InterferenceAssessment {
  interferer: FieldedPlayer
  /** D6 target for the deflection Agility test (-1 flat, -1 per marker), clamped 2..6. */
  deflectTarget: number
  /** Chance a deflection attempt succeeds, given the pass is thrown. */
  deflectChance: number
  /** Chance a successful deflection is converted into an interception. */
  convertChance: number
  /** Absolute chance the pass is deflected (possible on any non-fumbled throw). */
  deflectionChance: number
  /** Absolute chance of a full interception — a turnover. */
  interceptionChance: number
}

export interface CatchAssessment {
  catcher: FieldedPlayer
  markers: number
  /** Effective target on a D6, clamped to 2..6. */
  target: number
  successChance: number
  /** Success chance using the Catch skill re-roll, when the catcher has it. */
  withRerollChance?: number
}

export interface PassAssessment {
  range: PassRange
  isHandOff: boolean
  canAttempt: boolean
  /** Why the throw cannot be attempted, when it cannot. */
  reason?: string
  throwerMarkers: number
  /** Total test modifier (range plus tackle zones on the thrower). */
  modifier: number
  outcome: PassOutcomeChances
  /** Outcome using the Pass skill re-roll, when the thrower has it. */
  outcomeWithReroll?: PassOutcomeChances
  /** Set when a standing team-mate occupies the target square. */
  catch?: CatchAssessment
  /** Best-placed opponent in the passing lane, when one exists (never for hand-offs). */
  interference?: InterferenceAssessment
  /** Accurate, not deflected, and caught — using available skill re-rolls. */
  completionChance?: number
}

const CANNOT_ATTEMPT: PassOutcomeChances = {
  accurate: 0,
  inaccurate: 0,
  wildlyInaccurate: 0,
  fumble: 0
}

/** Assess `thrower` passing (or handing off) the ball to `target`. */
export function assessPass(
  players: FieldedPlayer[],
  thrower: FieldedPlayer,
  target: PitchCoordinates
): PassAssessment {
  const range = passRange(thrower, target)
  const isHandOff = range === 'Hand-off'
  const throwerMarkers = markingOpponents(players, thrower).length

  const assessment: PassAssessment = {
    range,
    isHandOff,
    canAttempt: true,
    throwerMarkers,
    modifier: 0,
    outcome: { ...CANNOT_ATTEMPT, accurate: 1 }
  }

  if (range === 'Out of Range') {
    return { ...assessment, canAttempt: false, reason: 'Out of range.', outcome: CANNOT_ATTEMPT }
  }

  if (!isHandOff) {
    if (thrower.passing <= 0) {
      return {
        ...assessment,
        canAttempt: false,
        reason: 'This player cannot pass (PA –).',
        outcome: CANNOT_ATTEMPT
      }
    }
    assessment.modifier = (PASS_RANGE_MODIFIERS[range] ?? 0) - throwerMarkers
    assessment.outcome = passOutcomeChances(thrower.passing, assessment.modifier)
    if (hasSkill(thrower, 'Pass')) {
      assessment.outcomeWithReroll = withPassReroll(assessment.outcome)
    }
  }

  // Passing interference: one opponent in the passing lane may attempt to
  // deflect any non-fumbled throw. The defence picks its best-placed player.
  if (!isHandOff) {
    const lane = passingLaneSquares(thrower, target)
    let best: InterferenceAssessment | undefined
    for (const defender of players) {
      if (defender.team === thrower.team) continue
      if (!lane.some((square) => samePosition(defender, square))) continue
      const markers = markersOnSquare(players, defender, defender.team)
      const deflectTarget = Math.min(6, Math.max(2, defender.agility + 1 + markers))
      const deflectChance = agilityTestChance(defender.agility + 1 + markers)
      let convertChance = agilityTestChance(defender.agility + 1 + markers)
      if (hasSkill(defender, 'Catch')) convertChance = 1 - Math.pow(1 - convertChance, 2)
      if (
        !best ||
        deflectChance > best.deflectChance ||
        (deflectChance === best.deflectChance && convertChance > best.convertChance)
      ) {
        const notFumbled = 1 - (assessment.outcomeWithReroll ?? assessment.outcome).fumble
        best = {
          interferer: defender,
          deflectTarget,
          deflectChance,
          convertChance,
          deflectionChance: notFumbled * deflectChance,
          interceptionChance: notFumbled * deflectChance * convertChance
        }
      }
    }
    assessment.interference = best
  }

  const occupant = players.find((p) => samePosition(p, target))
  if (occupant && occupant.team === thrower.team && occupant.id !== thrower.id) {
    const markers = markersOnSquare(players, target, occupant.team)
    const target6 = Math.min(6, Math.max(2, occupant.agility + markers))
    const catchAssessment: CatchAssessment = {
      catcher: occupant,
      markers,
      target: target6,
      successChance: agilityTestChance(occupant.agility + markers)
    }
    if (hasSkill(occupant, 'Catch')) {
      catchAssessment.withRerollChance = 1 - Math.pow(1 - catchAssessment.successChance, 2)
    }
    assessment.catch = catchAssessment
    const accurate = (assessment.outcomeWithReroll ?? assessment.outcome).accurate
    const notDeflected = 1 - (assessment.interference?.deflectChance ?? 0)
    assessment.completionChance =
      accurate * notDeflected * (catchAssessment.withRerollChance ?? catchAssessment.successChance)
  }

  return assessment
}

export interface BallLandingMap {
  /** Probability that the ball (or thrown player) comes to rest on each square. */
  grid: PitchGrid
  /** Probability of ending up off the pitch (throw-in / crowd). */
  outOfBounds: number
}

/** The eight D8 scatter/bounce directions. */
export const D8_DIRECTIONS: readonly (readonly [number, number])[] = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1]
]

type AddProbability = (row: number, column: number, probability: number) => void

/**
 * Walk the three chained D8 scatters of an inaccurate throw from `start`,
 * stopping early at the pitch edge (throw-in).
 */
export function scatterThree(start: PitchCoordinates, weight: number, add: AddProbability): void {
  const walk = (row: number, column: number, depth: number, probability: number) => {
    if (!isOnPitch({ row, column }) || depth === 3) {
      add(row, column, probability)
      return
    }
    for (const [dr, dc] of D8_DIRECTIONS) walk(row + dr, column + dc, depth + 1, probability / 8)
  }
  if (weight > 0) walk(start.row, start.column, 0, weight)
}

/**
 * Where the ball can end up when the pass is not completed: inaccurate
 * scatter from the target, wildly inaccurate deviation from the thrower,
 * fumble bounce from the thrower, and the bounce of an accurate but
 * uncaught ball. A completed catch is excluded.
 */
export function ballLandingMap(
  thrower: PitchCoordinates,
  target: PitchCoordinates,
  assessment: PassAssessment
): BallLandingMap {
  const grid = emptyGrid()
  let outOfBounds = 0
  const add: AddProbability = (row, column, probability) => {
    if (probability <= 0) return
    if (isOnPitch({ row, column })) grid[row - 1][column - 1] += probability
    else outOfBounds += probability
  }

  const outcome = assessment.outcomeWithReroll ?? assessment.outcome
  const interference = assessment.interference
  // Any non-fumbled throw can be deflected; the remaining outcomes shrink.
  const notDeflected = 1 - (interference?.deflectChance ?? 0)

  scatterThree(target, outcome.inaccurate * notDeflected, add)

  for (const [dr, dc] of D8_DIRECTIONS) {
    for (let distance = 1; distance <= 6; distance++) {
      add(
        thrower.row + dr * distance,
        thrower.column + dc * distance,
        (outcome.wildlyInaccurate * notDeflected) / 48
      )
    }
  }

  for (const [dr, dc] of D8_DIRECTIONS) {
    add(thrower.row + dr, thrower.column + dc, outcome.fumble / 8)
  }

  if (interference) {
    // Deflected but not converted to an interception: bounce from the deflector.
    const looseDeflection = interference.deflectionChance - interference.interceptionChance
    for (const [dr, dc] of D8_DIRECTIONS) {
      add(
        interference.interferer.row + dr,
        interference.interferer.column + dc,
        looseDeflection / 8
      )
    }
  }

  const catchChance = assessment.catch
    ? (assessment.catch.withRerollChance ?? assessment.catch.successChance)
    : 0
  const dropped = outcome.accurate * notDeflected * (1 - catchChance)
  for (const [dr, dc] of D8_DIRECTIONS) {
    add(target.row + dr, target.column + dc, dropped / 8)
  }

  return { grid, outOfBounds }
}
