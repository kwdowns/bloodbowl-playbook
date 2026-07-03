import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { hasSkill } from '@/lib/models/Player'
import { isAdjacent } from '@/lib/models/PitchCoordinates'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'

export type BlockChooser = 'attacker' | 'defender'

export interface BlockAssessment {
  attacker: FieldedPlayer
  defender: FieldedPlayer
  offensiveAssists: FieldedPlayer[]
  defensiveAssists: FieldedPlayer[]
  attackerStrength: number
  defenderStrength: number
  diceCount: 1 | 2 | 3
  chooser: BlockChooser
}

export function playersAdjacentTo(
  players: FieldedPlayer[],
  position: PitchCoordinates
): FieldedPlayer[] {
  return players.filter((player) => isAdjacent(player, position))
}

/** Opposing players adjacent to (i.e. marking) the given player. */
export function markersOf(players: FieldedPlayer[], player: FieldedPlayer): FieldedPlayer[] {
  return playersAdjacentTo(players, player).filter((other) => other.team !== player.team)
}

/**
 * A teammate of `assisted` may assist a block involving `assisted` and `opponent`
 * if they are adjacent to `opponent` and not marked by any opposing player other
 * than `opponent` — unless they have Guard, which lets them assist while marked.
 */
function assistsFor(
  players: FieldedPlayer[],
  assisted: FieldedPlayer,
  opponent: FieldedPlayer
): FieldedPlayer[] {
  return players.filter((candidate) => {
    if (candidate.team !== assisted.team) return false
    if (candidate.id === assisted.id) return false
    if (!isAdjacent(candidate, opponent)) return false
    if (hasSkill(candidate, 'Guard')) return true
    return markersOf(players, candidate).every((marker) => marker.id === opponent.id)
  })
}

export function assessBlock(
  players: FieldedPlayer[],
  attacker: FieldedPlayer,
  defender: FieldedPlayer
): BlockAssessment {
  if (attacker.team === defender.team) {
    throw new Error('Cannot block a teammate')
  }
  if (!isAdjacent(attacker, defender)) {
    throw new Error('Attacker and defender must be adjacent')
  }

  const offensiveAssists = assistsFor(players, attacker, defender)
  const defensiveAssists = assistsFor(players, defender, attacker)

  const attackerStrength = attacker.strength + offensiveAssists.length
  const defenderStrength = defender.strength + defensiveAssists.length

  let diceCount: 1 | 2 | 3 = 1
  let chooser: BlockChooser = 'attacker'

  if (attackerStrength > defenderStrength * 2) {
    diceCount = 3
  } else if (attackerStrength > defenderStrength) {
    diceCount = 2
  } else if (defenderStrength > attackerStrength * 2) {
    diceCount = 3
    chooser = 'defender'
  } else if (defenderStrength > attackerStrength) {
    diceCount = 2
    chooser = 'defender'
  }

  return {
    attacker,
    defender,
    offensiveAssists,
    defensiveAssists,
    attackerStrength,
    defenderStrength,
    diceCount,
    chooser
  }
}
