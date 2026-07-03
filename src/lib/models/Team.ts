export type Team = 'Offense' | 'Defense'

export function opposingTeam(team: Team): Team {
  return team === 'Offense' ? 'Defense' : 'Offense'
}
