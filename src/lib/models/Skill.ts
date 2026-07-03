export type SkillName = 'Block' | 'Dodge' | 'Guard' | 'Tackle' | 'Mighty Blow'

export type Skill = {
  name: SkillName
  description: string
  category: string
}

export const SKILLS: Record<SkillName, Skill> = {
  Block: {
    name: 'Block',
    description: 'This player is not Knocked Down by a Both Down result.',
    category: 'General'
  },
  Dodge: {
    name: 'Dodge',
    description:
      'Once per turn, re-roll a failed Dodge test. Also ignores Defender Stumbles (treated as a Push) unless the attacker has Tackle.',
    category: 'Agility'
  },
  Guard: {
    name: 'Guard',
    description: 'This player can offer assists to blocks even while being marked.',
    category: 'Strength'
  },
  Tackle: {
    name: 'Tackle',
    description:
      'Opponents cannot use Dodge to re-roll dodges away from this player, nor to ignore Defender Stumbles from its blocks.',
    category: 'General'
  },
  'Mighty Blow': {
    name: 'Mighty Blow',
    description:
      'Add +1 to either the Armour roll or the Injury roll when knocking an opponent down.',
    category: 'Strength'
  }
}

export const SKILL_NAMES = Object.keys(SKILLS) as SkillName[]
