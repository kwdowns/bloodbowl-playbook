import { describe, it, expect } from 'vitest'
import { PITCH_COLUMNS, PITCH_ROWS } from '@/lib/models/PitchCoordinates'
import { assessDodge } from '@/lib/rules/dodge'
import { controlMaps, tackleZoneGrid } from '@/lib/rules/tackleZones'
import { makePlayer } from './blocks.spec'

describe('tackleZoneGrid', () => {
  it('marks the eight squares around a player', () => {
    const player = makePlayer('Offense', 10, 7)
    const grid = tackleZoneGrid([player], 'Offense')
    let marked = 0
    for (let row = 0; row < PITCH_ROWS; row++) {
      for (let column = 0; column < PITCH_COLUMNS; column++) {
        marked += grid[row][column]
      }
    }
    expect(marked).toBe(8)
    expect(grid[9][6]).toBe(0) // player's own square
    expect(grid[8][6]).toBe(1)
    expect(grid[10][7]).toBe(1)
  })

  it('clips tackle zones at the pitch edge and stacks overlapping zones', () => {
    const corner = makePlayer('Offense', 1, 1)
    const grid = tackleZoneGrid([corner], 'Offense')
    let marked = 0
    for (const row of grid) for (const value of row) marked += value
    expect(marked).toBe(3)

    const pair = [makePlayer('Offense', 10, 7), makePlayer('Offense', 10, 9)]
    const stacked = tackleZoneGrid(pair, 'Offense')
    expect(stacked[9][7]).toBe(2) // square between them
  })

  it('computes net control as offense minus defense', () => {
    const players = [makePlayer('Offense', 10, 7), makePlayer('Defense', 10, 9)]
    const { net } = controlMaps(players)
    expect(net[9][7]).toBe(0) // contested square between them
    expect(net[9][5]).toBe(1)
    expect(net[9][9]).toBe(-1)
  })
})

describe('assessDodge', () => {
  it('requires no roll when the player is unmarked', () => {
    const runner = makePlayer('Offense', 10, 7)
    const result = assessDodge([runner], runner, { row: 10, column: 8 })
    expect(result.required).toBe(false)
    expect(result.successChance).toBe(1)
  })

  it('uses agility modified by tackle zones on the destination', () => {
    const runner = makePlayer('Offense', 10, 7, { agility: 3 })
    const marker = makePlayer('Defense', 10, 8)
    // Moving to (9, 7) keeps the runner adjacent to the marker: AG 3 + 1 zone = 4+.
    const result = assessDodge([runner, marker], runner, { row: 9, column: 7 })
    expect(result.required).toBe(true)
    expect(result.destinationMarkers).toBe(1)
    expect(result.target).toBe(4)
    expect(result.successChance).toBeCloseTo(3 / 6)

    // Moving away from all zones: plain 3+.
    const away = assessDodge([runner, marker], runner, { row: 10, column: 6 })
    expect(away.target).toBe(3)
    expect(away.successChance).toBeCloseTo(4 / 6)
  })

  it('clamps the target so a 6 always succeeds and a 1 always fails', () => {
    const runner = makePlayer('Offense', 10, 7, { agility: 5 })
    const markers = [
      makePlayer('Defense', 10, 8),
      makePlayer('Defense', 9, 8),
      makePlayer('Defense', 11, 8)
    ]
    const result = assessDodge([runner, ...markers], runner, { row: 10, column: 6 })
    expect(result.target).toBeLessThanOrEqual(6)
    expect(result.successChance).toBeGreaterThanOrEqual(1 / 6)

    const nimble = makePlayer('Offense', 10, 7, { agility: 1 })
    const easy = assessDodge([nimble, markers[0]], nimble, { row: 10, column: 6 })
    expect(easy.target).toBe(2)
    expect(easy.successChance).toBeCloseTo(5 / 6)
  })

  it('offers the Dodge re-roll unless a marker has Tackle', () => {
    const dodger = makePlayer('Offense', 10, 7, { agility: 3, skills: ['Dodge'] })
    const marker = makePlayer('Defense', 10, 8)
    const result = assessDodge([dodger, marker], dodger, { row: 10, column: 6 })
    expect(result.withRerollChance).toBeCloseTo(1 - Math.pow(1 - 4 / 6, 2))

    const tackler = makePlayer('Defense', 10, 8, { skills: ['Tackle'] })
    const denied = assessDodge([dodger, tackler], dodger, { row: 10, column: 6 })
    expect(denied.withRerollChance).toBeUndefined()
  })
})
