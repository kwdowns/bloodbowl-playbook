import { describe, it, expect } from 'vitest'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import type { SkillName } from '@/lib/models/Skill'
import type { Team } from '@/lib/models/Team'
import { assessBlock } from '@/lib/rules/blocks'

let nextId = 0
export function makePlayer(
  team: Team,
  row: number,
  column: number,
  overrides: Partial<Pick<FieldedPlayer, 'strength' | 'agility' | 'movement'>> & {
    skills?: SkillName[]
  } = {}
): FieldedPlayer {
  return {
    id: `player-${nextId++}`,
    movement: overrides.movement ?? 6,
    strength: overrides.strength ?? 3,
    agility: overrides.agility ?? 3,
    passing: 4,
    armor: 9,
    skills: overrides.skills ?? [],
    team,
    row,
    column
  }
}

describe('assessBlock', () => {
  it('gives one die on equal strength with no assists', () => {
    const attacker = makePlayer('Offense', 10, 7)
    const defender = makePlayer('Defense', 10, 8)
    const result = assessBlock([attacker, defender], attacker, defender)
    expect(result.diceCount).toBe(1)
    expect(result.chooser).toBe('attacker')
    expect(result.attackerStrength).toBe(3)
    expect(result.defenderStrength).toBe(3)
  })

  it('gives two dice to the stronger attacker', () => {
    const attacker = makePlayer('Offense', 10, 7, { strength: 4 })
    const defender = makePlayer('Defense', 10, 8)
    const result = assessBlock([attacker, defender], attacker, defender)
    expect(result.diceCount).toBe(2)
    expect(result.chooser).toBe('attacker')
  })

  it('gives three dice when attacker is more than double the defender', () => {
    const attacker = makePlayer('Offense', 10, 7, { strength: 5 })
    const defender = makePlayer('Defense', 10, 8, { strength: 2 })
    const result = assessBlock([attacker, defender], attacker, defender)
    expect(result.diceCount).toBe(3)
    expect(result.chooser).toBe('attacker')
  })

  it('lets the defender choose when the defender is stronger', () => {
    const attacker = makePlayer('Offense', 10, 7)
    const defender = makePlayer('Defense', 10, 8, { strength: 4 })
    const result = assessBlock([attacker, defender], attacker, defender)
    expect(result.diceCount).toBe(2)
    expect(result.chooser).toBe('defender')
  })

  it('counts an unmarked teammate adjacent to the defender as an offensive assist', () => {
    const attacker = makePlayer('Offense', 10, 7)
    const defender = makePlayer('Defense', 10, 8)
    const helper = makePlayer('Offense', 9, 8) // adjacent to defender, only marked by defender
    const result = assessBlock([attacker, defender, helper], attacker, defender)
    expect(result.offensiveAssists.map((p) => p.id)).toEqual([helper.id])
    expect(result.attackerStrength).toBe(4)
    expect(result.diceCount).toBe(2)
  })

  it('denies the assist when the helper is marked by another opponent', () => {
    const attacker = makePlayer('Offense', 10, 7)
    const defender = makePlayer('Defense', 10, 8)
    const helper = makePlayer('Offense', 9, 8)
    const spoiler = makePlayer('Defense', 8, 8) // marks the helper
    const result = assessBlock([attacker, defender, helper, spoiler], attacker, defender)
    expect(result.offensiveAssists).toHaveLength(0)
  })

  it('allows a marked helper with Guard to assist', () => {
    const attacker = makePlayer('Offense', 10, 7)
    const defender = makePlayer('Defense', 10, 8)
    const helper = makePlayer('Offense', 9, 8, { skills: ['Guard'] })
    const spoiler = makePlayer('Defense', 8, 8)
    const result = assessBlock([attacker, defender, helper, spoiler], attacker, defender)
    expect(result.offensiveAssists.map((p) => p.id)).toEqual([helper.id])
  })

  it('counts defensive assists symmetrically', () => {
    const attacker = makePlayer('Offense', 10, 7)
    const defender = makePlayer('Defense', 10, 8)
    const bodyguard = makePlayer('Defense', 11, 7) // adjacent to attacker, only marked by attacker
    const result = assessBlock([attacker, defender, bodyguard], attacker, defender)
    expect(result.defensiveAssists.map((p) => p.id)).toEqual([bodyguard.id])
    expect(result.defenderStrength).toBe(4)
    expect(result.chooser).toBe('defender')
  })

  it('rejects blocks between teammates and non-adjacent players', () => {
    const a = makePlayer('Offense', 10, 7)
    const teammate = makePlayer('Offense', 10, 8)
    const far = makePlayer('Defense', 20, 7)
    expect(() => assessBlock([a, teammate], a, teammate)).toThrow()
    expect(() => assessBlock([a, far], a, far)).toThrow()
  })
})
