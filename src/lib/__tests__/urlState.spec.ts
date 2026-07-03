import { describe, expect, it } from 'vitest'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import {
  decodePitchState,
  decodeViewState,
  emptyViewState,
  encodePitchState,
  encodeViewState
} from '@/lib/urlState'
import type { ViewState } from '@/lib/urlState'

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

describe('view URL state', () => {
  const view = (overrides: Partial<ViewState> = {}): ViewState => ({
    ...emptyViewState(),
    ...overrides
  })

  it('encodes an empty view as an empty string', () => {
    expect(encodeViewState(view())).toBe('')
    expect(decodeViewState('')).toEqual(view())
  })

  it('round-trips a block setup with an overlay', () => {
    const state = view({ selectedIndex: 0, blockTargetIndex: 3, overlay: 'net' })
    expect(decodeViewState(encodeViewState(state))).toEqual(state)
  })

  it('round-trips a pass setup with a pinned target and scatter', () => {
    const state = view({
      selectedIndex: 2,
      mode: 'pass',
      passTarget: { row: 12, column: 7 },
      showScatter: true
    })
    expect(decodeViewState(encodeViewState(state))).toEqual(state)
  })

  it('round-trips a throw team-mate setup', () => {
    const state = view({ selectedIndex: 1, mode: 'throwTeammate', passTarget: { row: 20, column: 3 } })
    expect(decodeViewState(encodeViewState(state))).toEqual(state)
  })

  it('round-trips a move plan with rushes and a path', () => {
    const state = view({
      selectedIndex: 4,
      mode: 'move',
      plannedRushes: 1,
      movePath: [
        { row: 5, column: 8 },
        { row: 6, column: 9 },
        { row: 7, column: 9 }
      ]
    })
    expect(decodeViewState(encodeViewState(state))).toEqual(state)
  })

  it('omits fields irrelevant to the active mode', () => {
    const encoded = encodeViewState(
      view({
        selectedIndex: 0,
        mode: 'move',
        blockTargetIndex: 2,
        passTarget: { row: 5, column: 5 },
        showScatter: true,
        movePath: [{ row: 5, column: 9 }],
        plannedRushes: 2
      })
    )
    expect(decodeViewState(encoded)).toEqual(
      view({ selectedIndex: 0, mode: 'move', movePath: [{ row: 5, column: 9 }], plannedRushes: 2 })
    )
  })

  it('omits everything selection-dependent without a selection', () => {
    const encoded = encodeViewState(
      view({ blockTargetIndex: 1, mode: 'pass', overlay: 'dodge', showScatter: true })
    )
    expect(decodeViewState(encoded)).toEqual(view({ overlay: 'dodge' }))
  })

  it('drops malformed tokens but keeps valid ones', () => {
    expect(decodeViewState('s1_bx_mz_t99.99_w5.8.6_garbage_od')).toEqual(
      view({ selectedIndex: 1, overlay: 'defense' })
    )
  })
})
