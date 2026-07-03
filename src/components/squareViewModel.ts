import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'

export interface SquareViewModel {
  row: number
  column: number
  occupant?: FieldedPlayer
  zoneClass: string
  /** True on the display edge between the two halves of the pitch. */
  scrimmageEdge: boolean
  overlayColor?: string
  overlayLabel?: string
  overlayTitle?: string
  selected: boolean
  blockTarget: boolean
  targetable: boolean
}
