import type { Skill } from '@/lib/models/Skill'
import type { Team } from '@/lib/models/Team'

export type Player = {
  id: string
  number?: number
  strength: number
  agility: number
  passing: number
  armor: number
  skills: Skill[]
  team: Team
}
