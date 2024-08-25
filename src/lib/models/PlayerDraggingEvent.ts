export type PlayerDraggingEvent = {
  player: {
    id?: string
    position: string
    strength: number
    agility: number
    armor: number
    passing: number
    skills: string[]
    team?: string
  }
  isNewPlayer: boolean
}
