import type { PitchCoordinates } from "./PitchCoordinates"
import type { Player } from "./Player"

export type PlayerDraggingEvent = {
  player: Player,
  sourceLocation?: PitchCoordinates
}

export type PlayerDroppedEvent = PlayerDraggingEvent & {
  targetLocation: PitchCoordinates
}