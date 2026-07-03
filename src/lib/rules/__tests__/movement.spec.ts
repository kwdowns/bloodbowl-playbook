import { describe, it, expect } from 'vitest'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import {
  MAX_RUSHES,
  RUSH_CHANCE,
  assessMovePath,
  movementGrid,
  pathTo
} from '@/lib/rules/movement'
import { makePlayer } from './blocks.spec'

function at(grid: ReturnType<typeof movementGrid>, position: PitchCoordinates) {
  return grid[position.row - 1][position.column - 1]
}

describe('movementGrid', () => {
  it('reaches every square within MA plus rushes on an empty pitch', () => {
    const runner = makePlayer('Offense', 13, 8) // MA 6
    const grid = movementGrid([runner], runner, [])

    // Unobstructed, the shortest-route distance is the Chebyshev distance.
    expect(at(grid, { row: 13, column: 14 })?.distance).toBe(6)
    expect(at(grid, { row: 13, column: 14 })?.rushesNeeded).toBe(0)
    expect(at(grid, { row: 6, column: 8 })?.rushesNeeded).toBe(1)
    expect(at(grid, { row: 5, column: 8 })?.rushesNeeded).toBe(2)
    expect(at(grid, { row: 4, column: 8 })).toBeUndefined() // 9 squares away
    expect(at(grid, { row: 13, column: 8 })).toBeUndefined() // own square
  })

  it('has full chance within MA and one rush roll per square beyond it', () => {
    const runner = makePlayer('Offense', 13, 8)
    const grid = movementGrid([runner], runner, [])
    expect(at(grid, { row: 13, column: 14 })?.chance).toBe(1)
    expect(at(grid, { row: 6, column: 8 })?.chance).toBeCloseTo(RUSH_CHANCE)
    expect(at(grid, { row: 5, column: 8 })?.chance).toBeCloseTo(RUSH_CHANCE * RUSH_CHANCE)
  })

  it('excludes occupied squares and routes around blockers', () => {
    const runner = makePlayer('Offense', 10, 7)
    const wall = [
      makePlayer('Offense', 9, 8),
      makePlayer('Offense', 10, 8),
      makePlayer('Offense', 11, 8)
    ]
    const grid = movementGrid([runner, ...wall], runner, [])
    expect(at(grid, { row: 10, column: 8 })).toBeUndefined()
    // The square just past the wall takes a detour around its end.
    expect(at(grid, { row: 10, column: 9 })?.distance).toBe(4)
  })

  it('accounts for dodges when scoring routes', () => {
    const runner = makePlayer('Offense', 10, 7, { agility: 3 })
    const marker = makePlayer('Defense', 10, 8)
    const grid = movementGrid([runner, marker], runner, [])
    // Step 1 leaves the marked square into open ground: 3+, then free running.
    expect(at(grid, { row: 10, column: 5 })?.chance).toBeCloseTo(4 / 6)
    // Staying adjacent to the marker makes the dodge a 4+.
    expect(at(grid, { row: 9, column: 7 })?.chance).toBeCloseTo(3 / 6)
  })

  it('continues from the end of an existing path and charges rushes for used movement', () => {
    const runner = makePlayer('Offense', 13, 8)
    const path: PitchCoordinates[] = [
      { row: 12, column: 8 },
      { row: 11, column: 8 },
      { row: 10, column: 8 },
      { row: 9, column: 8 },
      { row: 8, column: 8 }
    ]
    const grid = movementGrid([runner], runner, path)
    expect(at(grid, { row: 7, column: 8 })?.rushesNeeded).toBe(0) // 6th step
    expect(at(grid, { row: 6, column: 8 })?.rushesNeeded).toBe(1) // 7th step
    expect(at(grid, { row: 4, column: 8 })).toBeUndefined() // 9th step
  })

  it('returns an empty grid when all movement is used', () => {
    const runner = makePlayer('Offense', 13, 8)
    const path = Array.from({ length: runner.movement + MAX_RUSHES }, (_, i) => ({
      row: 13,
      column: 8 - Math.floor((i + 1) / 3) // any 8 squares; contiguity is not checked here
    }))
    const grid = movementGrid([runner], runner, path)
    expect(grid.flat().every((square) => square === undefined)).toBe(true)
  })
})

describe('pathTo', () => {
  it('reconstructs a contiguous shortest route to the target', () => {
    const runner = makePlayer('Offense', 10, 7)
    const grid = movementGrid([runner], runner, [])
    const route = pathTo(grid, { row: 14, column: 10 })
    expect(route).toHaveLength(4)
    expect(route[3]).toEqual({ row: 14, column: 10 })
    let previous: PitchCoordinates = runner
    for (const square of route) {
      expect(Math.abs(square.row - previous.row)).toBeLessThanOrEqual(1)
      expect(Math.abs(square.column - previous.column)).toBeLessThanOrEqual(1)
      previous = square
    }
  })

  it('returns an empty route for unreachable squares', () => {
    const runner = makePlayer('Offense', 10, 7)
    const grid = movementGrid([runner], runner, [])
    expect(pathTo(grid, { row: 26, column: 15 })).toEqual([])
  })
})

describe('assessMovePath', () => {
  it('needs no rolls for an unmarked walk within MA', () => {
    const runner = makePlayer('Offense', 10, 7)
    const path = [
      { row: 10, column: 8 },
      { row: 10, column: 9 }
    ]
    const result = assessMovePath([runner], runner, path)
    expect(result.successChance).toBe(1)
    expect(result.normalSteps).toBe(2)
    expect(result.rushSteps).toBe(0)
    expect(result.steps.every((step) => !step.isRush && !step.dodge)).toBe(true)
  })

  it('marks steps beyond MA as rushes at 2+ each', () => {
    const runner = makePlayer('Offense', 13, 8) // MA 6
    const path = Array.from({ length: 8 }, (_, i) => ({ row: 13 - (i + 1), column: 8 }))
    const result = assessMovePath([runner], runner, path)
    expect(result.normalSteps).toBe(6)
    expect(result.rushSteps).toBe(2)
    expect(result.steps[5].isRush).toBe(false)
    expect(result.steps[6].isRush).toBe(true)
    expect(result.steps[7].isRush).toBe(true)
    expect(result.successChance).toBeCloseTo(RUSH_CHANCE * RUSH_CHANCE)
  })

  it('requires a dodge when leaving a marked square mid-path', () => {
    const runner = makePlayer('Offense', 10, 7, { agility: 3 })
    const marker = makePlayer('Defense', 10, 9)
    // Step 1 into the marker's zone is free; step 2 leaves it and dodges out.
    const path = [
      { row: 10, column: 8 },
      { row: 11, column: 7 }
    ]
    const result = assessMovePath([runner, marker], runner, path)
    expect(result.steps[0].dodge).toBeUndefined()
    expect(result.steps[1].dodge?.target).toBe(3)
    expect(result.successChance).toBeCloseTo(4 / 6)
  })

  it('applies the single Dodge skill re-roll to the combined chance', () => {
    const dodger = makePlayer('Offense', 10, 7, { agility: 3, skills: ['Dodge'] })
    const marker = makePlayer('Defense', 10, 8)
    const single = assessMovePath([dodger, marker], dodger, [{ row: 10, column: 6 }])
    expect(single.successChance).toBeCloseTo(4 / 6)
    expect(single.withDodgeRerollChance).toBeCloseTo(1 - Math.pow(1 - 4 / 6, 2))

    // Two dodges but only one re-roll: p*p + 2*(1-p)*p*p covers using it on either failure.
    const markers = [makePlayer('Defense', 10, 8), makePlayer('Defense', 10, 5)]
    const twoDodges = assessMovePath([dodger, ...markers], dodger, [
      { row: 10, column: 6 },
      { row: 11, column: 5 }
    ])
    const p1 = twoDodges.steps[0].dodge!.successChance
    const p2 = twoDodges.steps[1].dodge!.successChance
    expect(twoDodges.withDodgeRerollChance).toBeCloseTo(
      p1 * p2 + (1 - p1) * p1 * p2 + p1 * (1 - p2) * p2
    )
  })

  it('offers no re-roll improvement when Tackle denies it', () => {
    const dodger = makePlayer('Offense', 10, 7, { agility: 3, skills: ['Dodge'] })
    const tackler = makePlayer('Defense', 10, 8, { skills: ['Tackle'] })
    const result = assessMovePath([dodger, tackler], dodger, [{ row: 10, column: 6 }])
    expect(result.withDodgeRerollChance).toBeUndefined()
  })
})
