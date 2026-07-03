import { hasSkill } from '@/lib/models/Player'
import type { Player } from '@/lib/models/Player'
import type { BlockChooser } from '@/lib/rules/blocks'

export const BLOCK_RESULTS = [
  'Attacker Down',
  'Both Down',
  'Push',
  'Defender Stumbles',
  'Defender Down'
] as const

export type BlockResult = (typeof BLOCK_RESULTS)[number]

/** Faces per result on a standard block die (out of 6). */
export const BLOCK_DIE_FACES: Record<BlockResult, number> = {
  'Attacker Down': 1,
  'Both Down': 1,
  Push: 2,
  'Defender Stumbles': 1,
  'Defender Down': 1
}

/** What actually happens when a given result is applied, accounting for skills. */
export interface BlockResultEffects {
  attackerDown: boolean
  defenderDown: boolean
  defenderPushed: boolean
  turnover: boolean
}

export function resultEffects(
  result: BlockResult,
  attacker: Player,
  defender: Player
): BlockResultEffects {
  switch (result) {
    case 'Attacker Down':
      return { attackerDown: true, defenderDown: false, defenderPushed: false, turnover: true }
    case 'Both Down': {
      const attackerDown = !hasSkill(attacker, 'Block')
      const defenderDown = !hasSkill(defender, 'Block')
      return { attackerDown, defenderDown, defenderPushed: false, turnover: attackerDown }
    }
    case 'Push':
      return { attackerDown: false, defenderDown: false, defenderPushed: true, turnover: false }
    case 'Defender Stumbles': {
      const dodgesAway = hasSkill(defender, 'Dodge') && !hasSkill(attacker, 'Tackle')
      return {
        attackerDown: false,
        defenderDown: !dodgesAway,
        defenderPushed: true,
        turnover: false
      }
    }
    case 'Defender Down':
      return { attackerDown: false, defenderDown: true, defenderPushed: true, turnover: false }
  }
}

/**
 * How desirable a result is from the attacker's point of view, given both
 * players' skills. Used to decide which die the chooser picks.
 */
function attackerScore(effects: BlockResultEffects, canonicalIndex: number): number {
  let score = 0
  if (effects.defenderDown) score += 2
  if (effects.defenderPushed) score += 0.5
  if (effects.attackerDown) score -= 2.5
  if (effects.turnover) score -= 0.5
  // Tiny tiebreaker so equal outcomes resolve in canonical order deterministically.
  return score + canonicalIndex * 1e-6
}

export type BlockDistribution = Record<BlockResult, number>

/**
 * Probability that each result is the one applied, assuming the chooser picks
 * the die that is best for their side (attacker maximises the attacker score,
 * defender minimises it).
 */
export function chosenResultDistribution(
  diceCount: number,
  chooser: BlockChooser,
  attacker: Player,
  defender: Player
): BlockDistribution {
  const scored = BLOCK_RESULTS.map((result, index) => ({
    result,
    faces: BLOCK_DIE_FACES[result],
    score: attackerScore(resultEffects(result, attacker, defender), index)
  }))

  // Order results from most preferred to least preferred for the chooser.
  scored.sort((a, b) => (chooser === 'attacker' ? b.score - a.score : a.score - b.score))

  // The applied result is the most-preferred result that shows on any die:
  // P(applied = k) = P(all dice at or below preference k) - P(all dice below k).
  const distribution = {} as BlockDistribution
  let facesAtOrBelow = 6
  for (const { result, faces } of scored) {
    const pAtOrBelow = Math.pow(facesAtOrBelow / 6, diceCount)
    const pBelow = Math.pow((facesAtOrBelow - faces) / 6, diceCount)
    distribution[result] = pAtOrBelow - pBelow
    facesAtOrBelow -= faces
  }
  return distribution
}

export interface BlockOutcomeSummary {
  distribution: BlockDistribution
  defenderDownChance: number
  defenderPushedOrDownChance: number
  attackerDownChance: number
  turnoverChance: number
}

export function summarizeBlock(
  diceCount: number,
  chooser: BlockChooser,
  attacker: Player,
  defender: Player
): BlockOutcomeSummary {
  const distribution = chosenResultDistribution(diceCount, chooser, attacker, defender)

  let defenderDownChance = 0
  let defenderPushedOrDownChance = 0
  let attackerDownChance = 0
  let turnoverChance = 0

  for (const result of BLOCK_RESULTS) {
    const probability = distribution[result]
    const effects = resultEffects(result, attacker, defender)
    if (effects.defenderDown) defenderDownChance += probability
    if (effects.defenderDown || effects.defenderPushed) defenderPushedOrDownChance += probability
    if (effects.attackerDown) attackerDownChance += probability
    if (effects.turnover) turnoverChance += probability
  }

  return {
    distribution,
    defenderDownChance,
    defenderPushedOrDownChance,
    attackerDownChance,
    turnoverChance
  }
}
