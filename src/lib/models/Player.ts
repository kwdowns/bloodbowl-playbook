import type { SkillName } from '@/lib/models/Skill'
import type { Team } from '@/lib/models/Team'

export type Player = {
  id: string
  number?: number
  name?: string
  movement: number
  strength: number
  /** Agility as a target number, e.g. 3 means the player passes an Agility test on a 3+. */
  agility: number
  /** Passing ability as a target number. 0 means the player cannot pass. */
  passing: number
  /** Armour value as a target number, e.g. 9 means armour is broken on a 9+. */
  armor: number
  skills: SkillName[]
  team: Team
}

export function hasSkill(player: Player, skill: SkillName): boolean {
  return player.skills.includes(skill)
}
