export type SkillName =
  | 'Block'
  | 'Dodge'
  | 'Guard'
  | 'Tackle'
  | 'Mighty Blow'
  | 'Pass'
  | 'Catch'
  | 'Throw Team-mate'
  | 'Right Stuff'
  | 'Really Stupid'
  | 'Always Hungry'

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
  },
  Pass: {
    name: 'Pass',
    description: 'Once per turn, re-roll a failed Passing Ability test when making a pass.',
    category: 'Passing'
  },
  Catch: {
    name: 'Catch',
    description: 'Once per turn, re-roll a failed Agility test to catch the ball.',
    category: 'Agility'
  },
  'Throw Team-mate': {
    name: 'Throw Team-mate',
    description:
      'This player may throw an adjacent team-mate with Right Stuff instead of the ball.',
    category: 'Strength'
  },
  'Right Stuff': {
    name: 'Right Stuff',
    description: 'This player may be thrown by a team-mate with Throw Team-mate.',
    category: 'Agility'
  },
  'Really Stupid': {
    name: 'Really Stupid',
    description:
      'When activated, roll a D6 (+2 if a non-Really Stupid team-mate is adjacent). On a modified 1-3 the player loses their activation.',
    category: 'Trait'
  },
  'Always Hungry': {
    name: 'Always Hungry',
    description:
      'When throwing a team-mate, on a D6 roll of 1 this player tries to eat them: a further 1 means they are eaten; otherwise the team-mate squirms free and the throw is fumbled.',
    category: 'Trait'
  }
}

export const SKILL_NAMES = Object.keys(SKILLS) as SkillName[]
