export type PitchCoordinates = { row: number; column: number }

/** Length of the pitch in squares (rows run from one end zone to the other). */
export const PITCH_ROWS = 26
/** Width of the pitch in squares. */
export const PITCH_COLUMNS = 15

export function samePosition(a: PitchCoordinates, b: PitchCoordinates): boolean {
  return a.row === b.row && a.column === b.column
}

export function isAdjacent(a: PitchCoordinates, b: PitchCoordinates): boolean {
  return !samePosition(a, b) && Math.abs(a.row - b.row) <= 1 && Math.abs(a.column - b.column) <= 1
}

export function isOnPitch({ row, column }: PitchCoordinates): boolean {
  return row >= 1 && row <= PITCH_ROWS && column >= 1 && column <= PITCH_COLUMNS
}
