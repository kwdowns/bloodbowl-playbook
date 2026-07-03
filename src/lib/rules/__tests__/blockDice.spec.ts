import { describe, it, expect } from 'vitest'
import {
  BLOCK_RESULTS,
  chosenResultDistribution,
  resultEffects,
  summarizeBlock
} from '@/lib/rules/blockDice'
import { makePlayer } from './blocks.spec'

const attacker = makePlayer('Offense', 10, 7)
const defender = makePlayer('Defense', 10, 8)

function total(distribution: Record<string, number>): number {
  return Object.values(distribution).reduce((sum, p) => sum + p, 0)
}

describe('chosenResultDistribution', () => {
  it('matches the raw die faces for a single die', () => {
    const dist = chosenResultDistribution(1, 'attacker', attacker, defender)
    expect(dist['Attacker Down']).toBeCloseTo(1 / 6)
    expect(dist['Both Down']).toBeCloseTo(1 / 6)
    expect(dist['Push']).toBeCloseTo(2 / 6)
    expect(dist['Defender Stumbles']).toBeCloseTo(1 / 6)
    expect(dist['Defender Down']).toBeCloseTo(1 / 6)
  })

  it('sums to 1 for every dice count and chooser', () => {
    for (const diceCount of [1, 2, 3]) {
      for (const chooser of ['attacker', 'defender'] as const) {
        expect(total(chosenResultDistribution(diceCount, chooser, attacker, defender))).toBeCloseTo(
          1
        )
      }
    }
  })

  it('gives the attacker Defender Down at 1 - (5/6)^n when choosing', () => {
    const twoDice = chosenResultDistribution(2, 'attacker', attacker, defender)
    expect(twoDice['Defender Down']).toBeCloseTo(1 - Math.pow(5 / 6, 2))
    const threeDice = chosenResultDistribution(3, 'attacker', attacker, defender)
    expect(threeDice['Defender Down']).toBeCloseTo(1 - Math.pow(5 / 6, 3))
  })

  it('gives the defender Attacker Down at 1 - (5/6)^n when choosing', () => {
    const twoDice = chosenResultDistribution(2, 'defender', attacker, defender)
    expect(twoDice['Attacker Down']).toBeCloseTo(1 - Math.pow(5 / 6, 2))
    // Attacker only goes down if every die is Attacker Down when the attacker picks.
    const attackerPicks = chosenResultDistribution(2, 'attacker', attacker, defender)
    expect(attackerPicks['Attacker Down']).toBeCloseTo(1 / 36)
  })
})

describe('resultEffects', () => {
  it('applies Block to Both Down', () => {
    const blocker = makePlayer('Offense', 1, 1, { skills: ['Block'] })
    const effects = resultEffects('Both Down', blocker, defender)
    expect(effects.attackerDown).toBe(false)
    expect(effects.defenderDown).toBe(true)
    expect(effects.turnover).toBe(false)
  })

  it('applies Dodge to Defender Stumbles unless the attacker has Tackle', () => {
    const dodger = makePlayer('Defense', 1, 2, { skills: ['Dodge'] })
    expect(resultEffects('Defender Stumbles', attacker, dodger).defenderDown).toBe(false)
    const tackler = makePlayer('Offense', 1, 1, { skills: ['Tackle'] })
    expect(resultEffects('Defender Stumbles', tackler, dodger).defenderDown).toBe(true)
  })
})

describe('summarizeBlock', () => {
  it('reports knockdown and turnover chances for a plain one-die block', () => {
    const summary = summarizeBlock(1, 'attacker', attacker, defender)
    // Defender Down or Defender Stumbles
    expect(summary.defenderDownChance).toBeCloseTo(2 / 6 + 1 / 6)
    // Attacker Down or Both Down
    expect(summary.turnoverChance).toBeCloseTo(2 / 6)
  })

  it('keeps every result probability accounted for', () => {
    const summary = summarizeBlock(2, 'defender', attacker, defender)
    expect(total(summary.distribution)).toBeCloseTo(1)
    expect(BLOCK_RESULTS.every((r) => summary.distribution[r] >= 0)).toBe(true)
  })
})
