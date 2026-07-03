import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { PITCH_COLUMNS, PITCH_ROWS, isAdjacent } from '@/lib/models/PitchCoordinates'
import type { Team } from '@/lib/models/Team'

/** A PITCH_ROWS x PITCH_COLUMNS grid of numbers, indexed [row - 1][column - 1]. */
export type PitchGrid = number[][]

export function emptyGrid(): PitchGrid {
  return Array.from({ length: PITCH_ROWS }, () => new Array<number>(PITCH_COLUMNS).fill(0))
}

/** Number of tackle zones the given team exerts on each square. */
export function tackleZoneGrid(players: FieldedPlayer[], team: Team): PitchGrid {
  const grid = emptyGrid()
  for (const player of players) {
    if (player.team !== team) continue
    for (let row = player.row - 1; row <= player.row + 1; row++) {
      for (let column = player.column - 1; column <= player.column + 1; column++) {
        if (row < 1 || row > PITCH_ROWS || column < 1 || column > PITCH_COLUMNS) continue
        if (row === player.row && column === player.column) continue
        grid[row - 1][column - 1]++
      }
    }
  }
  return grid
}

export interface ControlMaps {
  offense: PitchGrid
  defense: PitchGrid
  /** offense minus defense; positive means offense controls the square. */
  net: PitchGrid
}

export function controlMaps(players: FieldedPlayer[]): ControlMaps {
  const offense = tackleZoneGrid(players, 'Offense')
  const defense = tackleZoneGrid(players, 'Defense')
  const net = emptyGrid()
  for (let row = 0; row < PITCH_ROWS; row++) {
    for (let column = 0; column < PITCH_COLUMNS; column++) {
      net[row][column] = offense[row][column] - defense[row][column]
    }
  }
  return { offense, defense, net }
}

/** Opposing players marking (adjacent to) the given player. */
export function markingOpponents(
  players: FieldedPlayer[],
  player: FieldedPlayer
): FieldedPlayer[] {
  return players.filter((other) => other.team !== player.team && isAdjacent(other, player))
}
