import { describe, expect, it } from 'vitest'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { decodePitchState, encodePitchState } from '@/lib/urlState'

const player = (overrides: Partial<FieldedPlayer> = {}): FieldedPlayer => ({
  id: 'test-id',
  team: 'Offense',
  number: 1,
  movement: 6,
  strength: 3,
  agility: 3,
  passing: 4,
  armor: 9,
  skills: [],
  row: 5,
  column: 8,
  ...overrides
})

const stripId = (p: FieldedPlayer) => ({ ...p, id: undefined })

describe('pitch URL state', () => {
  it('round-trips an empty pitch', () => {
    expect(decodePitchState(encodePitchState([]))).toEqual([])
  })

  it('round-trips players with stats, skills, and teams', () => {
    const players = [
      player({ skills: ['Block', 'Dodge', 'Always Hungry'] }),
      player({
        team: 'Defense',
        number: 3,
        row: 20,
        column: 15,
        movement: 4,
        strength: 5,
        agility: 4,
        passing: 0,
        armor: 10,
        skills: ['Guard']
      })
    ]
    const decoded = decodePitchState(encodePitchState(players))
    expect(decoded.map(stripId)).toEqual(players.map(stripId))
    expect(decoded[0].id).not.toBe(decoded[1].id)
  })

  it('round-trips names with spaces, dashes, and separators', () => {
    const players = [player({ name: 'Griff Ober-wald; the 3rd' })]
    expect(decodePitchState(encodePitchState(players))[0].name).toBe('Griff Ober-wald; the 3rd')
  })

  it('omits an unset name and number', () => {
    const decoded = decodePitchState(encodePitchState([player({ name: undefined, number: undefined })]))
    expect(decoded[0].name).toBeUndefined()
    expect(decoded[0].number).toBeUndefined()
  })

  it('drops malformed tokens but keeps valid ones', () => {
    const valid = encodePitchState([player()])
    expect(decodePitchState(`garbage;${valid};X1-2-3`).map(stripId)).toEqual(
      [player()].map(stripId)
    )
  })

  it('drops players off the pitch or stacked on the same square', () => {
    const offPitch = player({ row: 99 })
    const stacked = player({ team: 'Defense' })
    expect(decodePitchState(encodePitchState([player(), offPitch, stacked]))).toHaveLength(1)
  })
})
