import { describe, it, expect } from 'vitest'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import type { SkillName } from '@/lib/models/Skill'
import type { Team } from '@/lib/models/Team'
import {
  RANGE_CHART,
  assessPass,
  ballLandingMap,
  passOutcomeChances,
  passRange,
  passingLaneSquares,
  withPassReroll
} from '@/lib/rules/pass'

let nextId = 0

function makePlayer(
  team: Team,
  row: number,
  column: number,
  overrides: Partial<Pick<FieldedPlayer, 'agility' | 'passing'>> & { skills?: SkillName[] } = {}
): FieldedPlayer {
  return {
    id: `pass-player-${nextId++}`,
    movement: 6,
    strength: 3,
    agility: overrides.agility ?? 3,
    passing: overrides.passing ?? 4,
    armor: 9,
    skills: overrides.skills ?? [],
    team,
    row,
    column
  }
}

describe('passRange', () => {
  it('classifies distances into range bands', () => {
    const from = { row: 13, column: 8 }
    expect(passRange(from, { row: 14, column: 9 })).toBe('Hand-off')
    expect(passRange(from, { row: 16, column: 8 })).toBe('Quick Pass')
    expect(passRange(from, { row: 19, column: 8 })).toBe('Short Pass')
    expect(passRange(from, { row: 22, column: 8 })).toBe('Long Pass')
    expect(passRange(from, { row: 26, column: 8 })).toBe('Long Bomb')
    expect(passRange(from, { row: 26, column: 15 })).toBe('Out of Range')
    expect(passRange(from, from)).toBe('Out of Range')
  })

  it('reads the two throw-vector components off the range chart', () => {
    const from = { row: 1, column: 1 }
    // 3 up / 1 across is still a quick pass; 3/2 and 3/3 fall into short.
    expect(passRange(from, { row: 4, column: 2 })).toBe('Quick Pass')
    expect(passRange(from, { row: 4, column: 3 })).toBe('Short Pass')
    expect(passRange(from, { row: 4, column: 4 })).toBe('Short Pass')
    // A straight 10 is a long pass, but 10 with 1 across needs a long bomb.
    expect(passRange(from, { row: 11, column: 1 })).toBe('Long Pass')
    expect(passRange(from, { row: 11, column: 2 })).toBe('Long Bomb')
    // The chart is symmetric in its two components.
    for (let dr = 0; dr < RANGE_CHART.length; dr++) {
      for (let dc = 0; dc < RANGE_CHART.length; dc++) {
        expect(RANGE_CHART[dr][dc]).toBe(RANGE_CHART[dc][dr])
      }
    }
  })
})

describe('passingLaneSquares', () => {
  it('covers the squares between thrower and target on a straight throw', () => {
    const lane = passingLaneSquares({ row: 10, column: 7 }, { row: 14, column: 7 })
    expect(lane).toEqual([
      { row: 11, column: 7 },
      { row: 12, column: 7 },
      { row: 13, column: 7 }
    ])
  })

  it('includes both squares when the line passes exactly through a corner', () => {
    const lane = passingLaneSquares({ row: 10, column: 7 }, { row: 12, column: 9 })
    expect(lane).toContainEqual({ row: 11, column: 8 })
    expect(lane).toContainEqual({ row: 11, column: 7 })
    expect(lane).toContainEqual({ row: 10, column: 8 })
  })

  it('walks an oblique lane without gaps and excludes the endpoints', () => {
    const from = { row: 5, column: 5 }
    const to = { row: 10, column: 7 }
    const lane = passingLaneSquares(from, to)
    expect(lane).not.toContainEqual(from)
    expect(lane).not.toContainEqual(to)
    expect(lane).toContainEqual({ row: 7, column: 6 })
    expect(lane.length).toBeGreaterThanOrEqual(4)
  })
})

describe('passOutcomeChances', () => {
  it('computes an unmodified PA 4+ quick pass', () => {
    const outcome = passOutcomeChances(4, 0)
    // 4, 5 and the natural 6 are accurate; 1 is a fumble; 2-3 inaccurate.
    expect(outcome.accurate).toBeCloseTo(3 / 6)
    expect(outcome.inaccurate).toBeCloseTo(2 / 6)
    expect(outcome.wildlyInaccurate).toBe(0)
    expect(outcome.fumble).toBeCloseTo(1 / 6)
  })

  it('always fumbles a natural 1 and hits on a natural 6, regardless of modifiers', () => {
    const outcome = passOutcomeChances(2, -5)
    expect(outcome.accurate).toBeCloseTo(1 / 6) // natural 6 only
    expect(outcome.fumble).toBeCloseTo(1 / 6) // natural 1 only
    expect(outcome.wildlyInaccurate).toBeCloseTo(4 / 6) // everything else modifies to <= 1
  })

  it('sums to 1', () => {
    const outcome = passOutcomeChances(3, -2)
    const total =
      outcome.accurate + outcome.inaccurate + outcome.wildlyInaccurate + outcome.fumble
    expect(total).toBeCloseTo(1)
  })
})

describe('withPassReroll', () => {
  it('re-rolls any failed result once', () => {
    const base = passOutcomeChances(4, 0)
    const rerolled = withPassReroll(base)
    expect(rerolled.accurate).toBeCloseTo(0.5 + 0.5 * 0.5)
    expect(rerolled.fumble).toBeCloseTo(0.5 * (1 / 6))
    const total =
      rerolled.accurate + rerolled.inaccurate + rerolled.wildlyInaccurate + rerolled.fumble
    expect(total).toBeCloseTo(1)
  })
})

describe('assessPass', () => {
  it('treats an adjacent target as an automatic hand-off with a normal catch', () => {
    const thrower = makePlayer('Offense', 10, 7)
    const catcher = makePlayer('Offense', 11, 7, { agility: 3 })
    const assessment = assessPass([thrower, catcher], thrower, catcher)
    expect(assessment.isHandOff).toBe(true)
    expect(assessment.outcome.accurate).toBe(1)
    expect(assessment.catch?.successChance).toBeCloseTo(4 / 6)
    expect(assessment.completionChance).toBeCloseTo(4 / 6)
  })

  it('applies range and marking modifiers to the thrower', () => {
    const thrower = makePlayer('Offense', 10, 7, { passing: 3 })
    const marker = makePlayer('Defense', 10, 8)
    const catcher = makePlayer('Offense', 15, 7)
    // Distance 5 -> Short Pass (-1), plus one marker (-1).
    const assessment = assessPass([thrower, marker, catcher], thrower, catcher)
    expect(assessment.range).toBe('Short Pass')
    expect(assessment.modifier).toBe(-2)
    // Accurate on modified >= 3: die 5 (5-2=3) and the natural 6.
    expect(assessment.outcome.accurate).toBeCloseTo(2 / 6)
  })

  it('penalizes a marked catcher and applies the Catch re-roll', () => {
    const thrower = makePlayer('Offense', 10, 7)
    const catcher = makePlayer('Offense', 15, 7, { agility: 3, skills: ['Catch'] })
    const marker = makePlayer('Defense', 15, 8)
    const assessment = assessPass([thrower, marker, catcher], thrower, catcher)
    expect(assessment.catch?.target).toBe(4)
    expect(assessment.catch?.successChance).toBeCloseTo(3 / 6)
    expect(assessment.catch?.withRerollChance).toBeCloseTo(1 - 0.5 * 0.5)
  })

  it('lets the best-placed opponent in the lane attempt interference', () => {
    const thrower = makePlayer('Offense', 10, 7)
    const catcher = makePlayer('Offense', 15, 7)
    const weakDefender = makePlayer('Defense', 12, 7, { agility: 4 })
    const strongDefender = makePlayer('Defense', 13, 7, { agility: 2 })
    const bystander = makePlayer('Defense', 12, 10, { agility: 1 })
    const players = [thrower, catcher, weakDefender, strongDefender, bystander]

    const assessment = assessPass(players, thrower, catcher)
    expect(assessment.interference?.interferer.id).toBe(strongDefender.id)
    // AG 2+ with the flat -1: deflects on 3+.
    expect(assessment.interference?.deflectTarget).toBe(3)
    expect(assessment.interference?.deflectChance).toBeCloseTo(4 / 6)

    const notFumbled = 1 - assessment.outcome.fumble
    expect(assessment.interference?.deflectionChance).toBeCloseTo(notFumbled * (4 / 6))
    expect(assessment.interference?.interceptionChance).toBeCloseTo(
      notFumbled * (4 / 6) * (4 / 6)
    )
    // Completion shrinks by the deflection chance.
    const accurate = assessment.outcome.accurate
    const catchChance = assessment.catch!.successChance
    expect(assessment.completionChance).toBeCloseTo(accurate * (1 - 4 / 6) * catchChance)
  })

  it('does not allow interference against a hand-off', () => {
    const thrower = makePlayer('Offense', 10, 7)
    const catcher = makePlayer('Offense', 11, 8)
    const defender = makePlayer('Defense', 11, 7)
    const assessment = assessPass([thrower, catcher, defender], thrower, catcher)
    expect(assessment.isHandOff).toBe(true)
    expect(assessment.interference).toBeUndefined()
  })

  it('cannot attempt out-of-range or PA – throws', () => {
    const thrower = makePlayer('Offense', 1, 1)
    const outOfRange = assessPass([thrower], thrower, { row: 26, column: 15 })
    expect(outOfRange.canAttempt).toBe(false)

    const noPa = makePlayer('Offense', 10, 7, { passing: 0 })
    const cannot = assessPass([noPa], noPa, { row: 14, column: 7 })
    expect(cannot.canAttempt).toBe(false)
  })
})

describe('ballLandingMap', () => {
  it('accounts for every way the pass fails to be caught', () => {
    const thrower = makePlayer('Offense', 10, 7)
    const catcher = makePlayer('Offense', 15, 7)
    const assessment = assessPass([thrower, catcher], thrower, catcher)
    const map = ballLandingMap(thrower, catcher, assessment)

    let total = map.outOfBounds
    for (const row of map.grid) for (const p of row) total += p
    const caught = assessment.completionChance ?? 0
    expect(total).toBeCloseTo(1 - caught)
  })

  it('conserves probability when an interferer is in the lane', () => {
    const thrower = makePlayer('Offense', 10, 7)
    const catcher = makePlayer('Offense', 15, 7)
    const defender = makePlayer('Defense', 13, 7, { agility: 2 })
    const assessment = assessPass([thrower, catcher, defender], thrower, catcher)
    const map = ballLandingMap(thrower, catcher, assessment)

    let total = map.outOfBounds
    for (const row of map.grid) for (const p of row) total += p
    const caught = assessment.completionChance ?? 0
    const intercepted = assessment.interference?.interceptionChance ?? 0
    expect(total).toBeCloseTo(1 - caught - intercepted)
  })

  it('bounces an accurate pass to an empty square', () => {
    const thrower = makePlayer('Offense', 10, 7)
    const target = { row: 13, column: 7 }
    const assessment = assessPass([thrower], thrower, target)
    const map = ballLandingMap(thrower, target, assessment)
    // Each of the 8 squares around the target gets an equal share of the
    // accurate-but-uncaught bounce.
    expect(map.grid[13][6]).toBeGreaterThan(0)
    let total = map.outOfBounds
    for (const row of map.grid) for (const p of row) total += p
    expect(total).toBeCloseTo(1)
  })
})
