import { type Player } from '@/lib/models/Player'
import type { Team } from './models/Team'

export const data: {
  [Property in Team as `${Lowercase<string & Property>}`]: {
    players: ({ team: Property } & Player)[]
  }
} & {} = {
  offense: {
    players: [
      {
        id: '',
        number: 1,
        position: 'Lineman',
        strength: 3,
        agility: 3,
        armor: 10,
        team: 'Offense',
        passing: 4,
        skills: []
      }
    ]
  },
  defense: {
    players: [
      {
        id: '',
        number: 1,
        position: 'Lineman',
        strength: 3,
        agility: 3,
        armor: 10,
        team: 'Defense',
        passing: 4,
        skills: []
      }
    ]
  }
}
