import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { hasSkill } from '@/lib/models/Player'
import { isAdjacent } from '@/lib/models/PitchCoordinates'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import { markingOpponents } from '@/lib/rules/tackleZones'

export interface DodgeAssessment {
  /** True when leaving the current square requires a Dodge test at all. */
  required: boolean
  /** Opposing tackle zones on the destination square. */
  destinationMarkers: number
  /** Effective target number on a D6 (clamped to 2..6: a 1 always fails, a 6 always succeeds). */
  target: number
  successChance: number
  /** Success chance using the Dodge skill re-roll, when the player has it. */
  withRerollChance?: number
}

/**
 * Assess the dodge for `player` moving from their current square into `destination`.
 * A Dodge test is only required when the player starts the move marked by one or
 * more opponents. The test is the player's Agility, modified by -1 for each
 * opposing player marking the destination square.
 */
export function assessDodge(
  players: FieldedPlayer[],
  player: FieldedPlayer,
  destination: PitchCoordinates
): DodgeAssessment {
  const markers = markingOpponents(players, player)
  const required = markers.length > 0

  const destinationMarkers = players.filter(
    (other) => other.team !== player.team && isAdjacent(other, destination)
  ).length

  const target = Math.min(6, Math.max(2, player.agility + destinationMarkers))
  const successChance = required ? (7 - target) / 6 : 1

  // Tackle denies the Dodge skill re-roll when dodging away from a marking player.
  const rerollDenied = markers.some((marker) => hasSkill(marker, 'Tackle'))

  const assessment: DodgeAssessment = { required, destinationMarkers, target, successChance }
  if (required && hasSkill(player, 'Dodge') && !rerollDenied) {
    assessment.withRerollChance = 1 - Math.pow(1 - successChance, 2)
  }
  return assessment
}
