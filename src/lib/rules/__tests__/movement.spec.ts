import { describe, it, expect } from 'vitest'
import {
  RUSH_CHANCE,
  assessMovePath,
  isValidMovePath,
  maxRushes,
  reachableSquares
} from '@/lib/rules/movement'
import { makePlayer } from './blocks.spec'

describe('maxRushes', () => {
  it('allows two rushes, three with Sprint', () => {
    expect(maxRushes(makePlayer('Offense', 10, 7))).toBe(2)
    expect(maxRushes(makePlayer('Offense', 10, 7, { skills: ['Sprint'] }))).toBe(3)
  })
})

describe('assessMovePath', () => {
  it('needs no rolls on an open run within MA', () => {
    const runner = makePlayer('Offense', 10, 7, { movement: 3 })
    const path = [
      { row: 11, column: 7 },
      { row: 12, column: 7 },
      { row: 13, column: 7 }
    ]
    const result = assessMovePath([runner], runner, path)
    expect(result.rushesUsed).toBe(0)
    expect(result.dodgesRequired).toBe(0)
    expect(result.successChance).toBe(1)
    expect(result.successChanceWithSkills).toBe(1)
  })

  it('marks squares beyond MA as rushes at 2+ each', () => {
    const runner = makePlayer('Offense', 10, 7, { movement: 2 })
    const path = [
      { row: 11, column: 7 },
      { row: 12, column: 7 },
      { row: 13, column: 7 },
      { row: 14, column: 7 }
    ]
    const result = assessMovePath([runner], runner, path)
    expect(result.steps.map((s) => s.rush)).toEqual([false, false, true, true])
    expect(result.rushesUsed).toBe(2)
    expect(result.successChance).toBeCloseTo(RUSH_CHANCE * RUSH_CHANCE)
  })

  it('requires a dodge when leaving a marked square, modified by destination markers', () => {
    const runner = makePlayer('Offense', 10, 7, { agility: 3 })
    const marker = makePlayer('Defense', 10, 8)
    // Step 1 leaves the marked square into (9, 7), still adjacent to the marker: 4+.
    // Step 2 leaves (9, 7), also marked, into an unmarked square: plain 3+.
    const path = [
      { row: 9, column: 7 },
      { row: 8, column: 7 }
    ]
    const result = assessMovePath([runner, marker], runner, path)
    expect(result.dodgesRequired).toBe(2)
    expect(result.steps[0].dodge?.target).toBe(4)
    expect(result.steps[1].dodge?.target).toBe(3)
    expect(result.successChance).toBeCloseTo((3 / 6) * (4 / 6))
  })

  it('uses the Dodge skill re-roll once across the path', () => {
    const runner = makePlayer('Offense', 10, 7, { agility: 4, skills: ['Dodge'] })
    const marker = makePlayer('Defense', 10, 8)
    // Single 4+ dodge away from the marker.
    const single = assessMovePath([runner, marker], runner, [{ row: 10, column: 6 }])
    expect(single.successChance).toBeCloseTo(0.5)
    expect(single.successChanceWithSkills).toBeCloseTo(0.75)

    // Two dodges in a row (AG 3): step 1 at 4+ (still adjacent to the marker),
    // step 2 at 3+. The Dodge re-roll covers only the first failure.
    const agThree = makePlayer('Offense', 10, 7, { agility: 3, skills: ['Dodge'] })
    const double = assessMovePath([agThree, marker], agThree, [
      { row: 9, column: 7 },
      { row: 8, column: 7 }
    ])
    expect(double.steps.every((s) => s.dodge)).toBe(true)
    const p1 = 3 / 6
    const p2 = 4 / 6
    // pass both + pass 1 / fail 2 / re-roll 2 + fail 1 / re-roll 1 / pass 2
    const expected = p1 * p2 + p1 * (1 - p2) * p2 + (1 - p1) * p1 * p2
    expect(double.successChanceWithSkills).toBeCloseTo(expected)
  })

  it('denies the Dodge re-roll when a Tackle player marks the square being left', () => {
    const runner = makePlayer('Offense', 10, 7, { agility: 4, skills: ['Dodge'] })
    const tackler = makePlayer('Defense', 10, 8, { skills: ['Tackle'] })
    const result = assessMovePath([runner, tackler], runner, [{ row: 10, column: 6 }])
    expect(result.successChanceWithSkills).toBeCloseTo(result.successChance)
  })

  it('applies Sure Feet to one failed rush', () => {
    const runner = makePlayer('Offense', 10, 7, { movement: 1, skills: ['Sure Feet'] })
    const path = [
      { row: 11, column: 7 },
      { row: 12, column: 7 } // rush
    ]
    const result = assessMovePath([runner], runner, path)
    expect(result.successChance).toBeCloseTo(RUSH_CHANCE)
    expect(result.successChanceWithSkills).toBeCloseTo(
      RUSH_CHANCE + (1 - RUSH_CHANCE) * RUSH_CHANCE
    )
  })

  it('combines a rush and a dodge on the same square', () => {
    const runner = makePlayer('Offense', 10, 7, { movement: 0, agility: 3 })
    const marker = makePlayer('Defense', 10, 8)
    const result = assessMovePath([runner, marker], runner, [{ row: 10, column: 6 }])
    expect(result.steps[0].rush).toBe(true)
    expect(result.steps[0].dodge?.target).toBe(3)
    expect(result.successChance).toBeCloseTo(RUSH_CHANCE * (4 / 6))
  })
})

describe('reachableSquares', () => {
  it('reaches every open square within MA at full certainty', () => {
    const runner = makePlayer('Offense', 10, 7, { movement: 2 })
    const grid = reachableSquares([runner], runner, runner, 0, 2)
    expect(grid[10][7]).toMatchObject({ steps: 1, rushes: 0, chance: 1 }) // (11, 8)
    expect(grid[7][6]).toMatchObject({ steps: 2, rushes: 0 }) // (8, 7), diagonals count as 1
    expect(grid[6][6]).toBeUndefined() // (7, 7) is 3 squares away
    expect(grid[9][6]).toBeUndefined() // own square is not a destination
  })

  it('marks squares beyond MA with the rushes and chance needed', () => {
    const runner = makePlayer('Offense', 10, 7, { movement: 1 })
    const grid = reachableSquares([runner], runner, runner, 0, 3)
    expect(grid[12][6]).toMatchObject({ steps: 3, rushes: 2 }) // (13, 7)
    expect(grid[12][6]?.chance).toBeCloseTo(RUSH_CHANCE * RUSH_CHANCE)
  })

  it('does not path through occupied squares', () => {
    const runner = makePlayer('Offense', 10, 1, { movement: 1 })
    // Wall off everything but one route along the sideline.
    const walls = [
      makePlayer('Offense', 9, 1),
      makePlayer('Offense', 9, 2),
      makePlayer('Offense', 10, 2),
      makePlayer('Offense', 11, 2)
    ]
    const grid = reachableSquares([runner, ...walls], runner, runner, 0, 1)
    expect(grid[10][0]).toMatchObject({ steps: 1, chance: 1 }) // (11, 1) is open
    expect(grid[9][1]).toBeUndefined() // (10, 2) occupied
  })

  it('routes around tackle zones when that gives a better chance', () => {
    const runner = makePlayer('Offense', 10, 7, { movement: 6, agility: 3 })
    const defender = makePlayer('Defense', 12, 7)
    const grid = reachableSquares([runner, defender], runner, runner, 0, 6)
    // (14, 7) is 4 direct steps but that means dodging out of the defender's
    // zones; a wider route never gets marked and needs no roll at all.
    expect(grid[13][6]?.chance).toBe(1)
    expect(grid[13][6]!.steps).toBeGreaterThan(4)
    const path = grid[13][6]!.path
    expect(isValidMovePath([runner, defender], runner, path)).toBe(true)
    expect(path[path.length - 1]).toEqual({ row: 14, column: 7 })
  })

  it('continues a planned path, counting steps already taken toward rushes', () => {
    const runner = makePlayer('Offense', 10, 7, { movement: 2 })
    const start = { row: 12, column: 7 } // pretend 2 steps already planned
    const grid = reachableSquares([runner], runner, start, 2, 4)
    expect(grid[12][6]).toMatchObject({ steps: 3, rushes: 1 }) // (13, 7)
    expect(grid[12][6]?.chance).toBeCloseTo(RUSH_CHANCE)
    expect(grid[12][6]?.path).toEqual([{ row: 13, column: 7 }])
  })
})

describe('isValidMovePath', () => {
  it('rejects non-adjacent steps and occupied squares', () => {
    const runner = makePlayer('Offense', 10, 7)
    const blocker = makePlayer('Defense', 11, 7)
    expect(isValidMovePath([runner, blocker], runner, [{ row: 12, column: 7 }])).toBe(false)
    expect(isValidMovePath([runner, blocker], runner, [{ row: 11, column: 7 }])).toBe(false)
    expect(
      isValidMovePath([runner, blocker], runner, [
        { row: 11, column: 8 },
        { row: 12, column: 8 }
      ])
    ).toBe(true)
  })
})
