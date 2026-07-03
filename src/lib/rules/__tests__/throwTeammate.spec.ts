import { describe, it, expect } from 'vitest'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import type { SkillName } from '@/lib/models/Skill'
import type { Team } from '@/lib/models/Team'
import { assessThrowTeammate } from '@/lib/rules/throwTeammate'

let nextId = 0

function makePlayer(
  team: Team,
  row: number,
  column: number,
  overrides: Partial<Pick<FieldedPlayer, 'agility' | 'passing'>> & { skills?: SkillName[] } = {}
): FieldedPlayer {
  return {
    id: `ttm-player-${nextId++}`,
    movement: 6,
    strength: 5,
    agility: overrides.agility ?? 3,
    passing: overrides.passing ?? 4,
    armor: 9,
    skills: overrides.skills ?? [],
    team,
    row,
    column
  }
}

const troll = (skills: SkillName[] = ['Throw Team-mate']) =>
  makePlayer('Offense', 10, 7, { passing: 4, skills })
const snotling = () => makePlayer('Offense', 10, 8, { agility: 3, skills: ['Right Stuff'] })

describe('assessThrowTeammate', () => {
  it('requires the Throw Team-mate skill and an adjacent Right Stuff team-mate', () => {
    const target = { row: 13, column: 7 }

    const noSkill = makePlayer('Offense', 10, 7)
    expect(assessThrowTeammate([noSkill, snotling()], noSkill, target).canAttempt).toBe(false)

    const thrower = troll()
    expect(assessThrowTeammate([thrower], thrower, target).canAttempt).toBe(false)

    const ok = assessThrowTeammate([thrower, snotling()], thrower, target)
    expect(ok.canAttempt).toBe(true)
    expect(ok.thrownPlayer?.skills).toContain('Right Stuff')
  })

  it('only allows quick and short range throws', () => {
    const thrower = troll()
    const players = [thrower, snotling()]
    expect(assessThrowTeammate(players, thrower, { row: 13, column: 7 }).canAttempt).toBe(true)
    expect(assessThrowTeammate(players, thrower, { row: 16, column: 7 }).canAttempt).toBe(true)
    expect(assessThrowTeammate(players, thrower, { row: 19, column: 7 }).canAttempt).toBe(false)
  })

  it('folds merely-inaccurate results into wildly inaccurate', () => {
    const thrower = troll()
    const assessment = assessThrowTeammate([thrower, snotling()], thrower, { row: 13, column: 7 })
    expect(assessment.throwOutcome.inaccurate).toBe(0)
    // PA 4+, quick throw: accurate 3/6, fumble 1/6, everything else wild.
    expect(assessment.throwOutcome.accurate).toBeCloseTo(3 / 6)
    expect(assessment.throwOutcome.wildlyInaccurate).toBeCloseTo(2 / 6)
    expect(assessment.throwOutcome.fumble).toBeCloseTo(1 / 6)
  })

  it('applies Really Stupid, assisted by the adjacent team-mate', () => {
    const thrower = troll(['Throw Team-mate', 'Really Stupid'])
    const assessment = assessThrowTeammate([thrower, snotling()], thrower, { row: 13, column: 7 })
    // The snotling itself is adjacent and not Really Stupid, so it assists.
    expect(assessment.activationAssisted).toBe(true)
    expect(assessment.lostActivationChance).toBeCloseTo(1 / 6)
  })

  it('applies Always Hungry eat and escape chances', () => {
    const thrower = troll(['Throw Team-mate', 'Always Hungry'])
    const assessment = assessThrowTeammate([thrower, snotling()], thrower, { row: 13, column: 7 })
    expect(assessment.eatenChance).toBeCloseTo(1 / 36)
    expect(assessment.hungryEscapeChance).toBeCloseTo(5 / 36)
    // The escape fumble is added on top of ordinary throw fumbles.
    expect(assessment.fumbleDropChance).toBeCloseTo(5 / 36 + (5 / 6) * (1 / 6))
  })

  it('conserves probability across all outcomes', () => {
    const thrower = troll(['Throw Team-mate', 'Really Stupid', 'Always Hungry'])
    const assessment = assessThrowTeammate([thrower, snotling()], thrower, { row: 13, column: 7 })
    const { landing } = assessment
    const total =
      assessment.lostActivationChance +
      assessment.eatenChance +
      assessment.fumbleDropChance +
      landing.safeChance +
      landing.proneChance +
      landing.onPlayerChance +
      landing.crowdChance
    expect(total).toBeCloseTo(1)
  })
})
