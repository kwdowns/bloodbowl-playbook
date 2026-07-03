<template>
  <section v-if="analysis" class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <h2 class="mb-2 text-sm font-semibold text-slate-700">Block analysis</h2>

    <div class="mb-2 flex items-center gap-2">
      <span
        class="rounded px-2 py-1 text-sm font-bold text-white"
        :class="assessment.chooser === 'attacker' ? 'bg-emerald-700' : 'bg-rose-600'"
      >
        {{ assessment.diceCount }}D
      </span>
      <span class="text-xs text-slate-600">
        {{ assessment.chooser === 'attacker' ? 'Attacker' : 'Defender' }} chooses the result
      </span>
    </div>

    <p class="text-xs text-slate-600">
      <span class="font-semibold text-red-700">#{{ assessment.attacker.number }}</span>
      ST {{ assessment.attacker.strength
      }}<template v-if="assessment.offensiveAssists.length">
        + {{ assessment.offensiveAssists.length }} assist{{
          assessment.offensiveAssists.length > 1 ? 's' : ''
        }}
        ({{ assistNumbers(assessment.offensiveAssists) }})</template
      >
      = <span class="font-semibold">{{ assessment.attackerStrength }}</span>
      &nbsp;vs&nbsp;
      <span class="font-semibold text-sky-700">#{{ assessment.defender.number }}</span>
      ST {{ assessment.defender.strength
      }}<template v-if="assessment.defensiveAssists.length">
        + {{ assessment.defensiveAssists.length }} assist{{
          assessment.defensiveAssists.length > 1 ? 's' : ''
        }}
        ({{ assistNumbers(assessment.defensiveAssists) }})</template
      >
      = <span class="font-semibold">{{ assessment.defenderStrength }}</span>
    </p>

    <table class="mt-3 w-full text-xs">
      <tbody>
        <tr v-for="result in BLOCK_RESULTS" :key="result">
          <td class="py-0.5 pr-2 text-slate-600">{{ result }}</td>
          <td class="w-full py-0.5">
            <div class="h-3 rounded-sm bg-slate-100">
              <div
                class="h-3 rounded-sm"
                :class="barClass(result)"
                :style="{ width: `${summary.distribution[result] * 100}%` }"
              ></div>
            </div>
          </td>
          <td class="py-0.5 pl-2 text-right font-mono text-slate-700">
            {{ formatPercent(summary.distribution[result]) }}
          </td>
        </tr>
      </tbody>
    </table>

    <dl class="mt-3 grid grid-cols-2 gap-1.5 text-xs">
      <div class="rounded bg-emerald-50 p-1.5">
        <dt class="text-slate-500">Defender knocked down</dt>
        <dd class="font-mono text-sm font-semibold text-emerald-800">
          {{ formatPercent(summary.defenderDownChance) }}
        </dd>
      </div>
      <div class="rounded bg-emerald-50 p-1.5">
        <dt class="text-slate-500">Pushed or down</dt>
        <dd class="font-mono text-sm font-semibold text-emerald-800">
          {{ formatPercent(summary.defenderPushedOrDownChance) }}
        </dd>
      </div>
      <div class="rounded bg-rose-50 p-1.5">
        <dt class="text-slate-500">Attacker knocked down</dt>
        <dd class="font-mono text-sm font-semibold text-rose-800">
          {{ formatPercent(summary.attackerDownChance) }}
        </dd>
      </div>
      <div class="rounded bg-rose-50 p-1.5">
        <dt class="text-slate-500">Turnover</dt>
        <dd class="font-mono text-sm font-semibold text-rose-800">
          {{ formatPercent(summary.turnoverChance) }}
        </dd>
      </div>
    </dl>

    <p class="mt-2 text-[11px] leading-snug text-slate-400">
      Assumes the chooser picks the best die for their side. Block, Dodge, Guard and Tackle are
      factored into assists and outcomes.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { formatPercent } from '@/lib/format'
import { BLOCK_RESULTS } from '@/lib/rules/blockDice'
import type { BlockResult } from '@/lib/rules/blockDice'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()
const analysis = computed(() => store.blockAnalysis)
const assessment = computed(() => analysis.value!.assessment)
const summary = computed(() => analysis.value!.summary)

function assistNumbers(players: FieldedPlayer[]): string {
  return players.map((p) => `#${p.number}`).join(', ')
}

function barClass(result: BlockResult): string {
  switch (result) {
    case 'Defender Down':
    case 'Defender Stumbles':
      return 'bg-emerald-500'
    case 'Push':
      return 'bg-slate-400'
    default:
      return 'bg-rose-500'
  }
}
</script>
