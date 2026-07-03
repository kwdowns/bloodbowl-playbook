<template>
  <section
    v-if="store.mode === 'move' && player && analysis"
    class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
  >
    <div class="mb-2 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-700">Movement</h2>
      <button
        type="button"
        class="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
        @click="store.setMode('default')"
      >
        Exit (Esc)
      </button>
    </div>

    <p class="mb-2 text-xs text-slate-600">
      Movement used:
      <span class="font-mono font-semibold">{{ analysis.normalSteps }} / {{ player.movement }}</span>
      <template v-if="analysis.rushSteps">
        <span class="font-semibold text-orange-600">
          + {{ analysis.rushSteps }} / {{ MAX_RUSHES }} Rush{{ analysis.rushSteps > 1 ? 'es' : '' }}
        </span>
      </template>
    </p>

    <p v-if="!analysis.steps.length" class="text-xs text-slate-500">
      Click a highlighted square to plot the move — click further squares to extend the path.
      Orange squares need a Rush (Go For It) roll of {{ RUSH_TARGET }}+.
    </p>

    <template v-else>
      <table v-if="rolls.length" class="w-full text-xs">
        <tbody>
          <tr v-for="step in rolls" :key="step.stepNumber">
            <td class="py-0.5 pr-2 whitespace-nowrap text-slate-600">Sq {{ step.stepNumber }}</td>
            <td class="py-0.5 pr-2 whitespace-nowrap font-medium" :class="step.isRush ? 'text-orange-600' : 'text-slate-700'">
              {{ rollLabel(step) }}
            </td>
            <td class="w-full py-0.5">
              <div class="h-2.5 rounded-sm bg-slate-100">
                <div
                  class="h-2.5 rounded-sm"
                  :class="step.isRush ? 'bg-orange-400' : 'bg-emerald-500'"
                  :style="{ width: `${step.chance * 100}%` }"
                ></div>
              </div>
            </td>
            <td class="py-0.5 pl-2 text-right font-mono text-slate-700">
              {{ formatPercent(step.chance) }}
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="text-xs text-slate-500">No dice needed — this path is completely safe.</p>

      <dl class="mt-2 grid grid-cols-2 gap-1.5 text-xs">
        <div class="rounded bg-emerald-50 p-1.5">
          <dt class="text-slate-500">All rolls succeed</dt>
          <dd class="font-mono text-sm font-semibold text-emerald-800">
            {{ formatPercent(analysis.successChance) }}
          </dd>
        </div>
        <div v-if="analysis.withDodgeRerollChance" class="rounded bg-emerald-50 p-1.5">
          <dt class="text-slate-500">With Dodge re-roll</dt>
          <dd class="font-mono text-sm font-semibold text-emerald-800">
            {{ formatPercent(analysis.withDodgeRerollChance) }}
          </dd>
        </div>
      </dl>

      <div class="mt-2 flex gap-1.5">
        <button
          type="button"
          class="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          @click="store.undoMoveStep()"
        >
          Undo step
        </button>
        <button
          type="button"
          class="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          @click="store.clearMovePath()"
        >
          Clear path
        </button>
        <button
          type="button"
          class="rounded bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
          @click="store.applyMove()"
        >
          Apply move
        </button>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatPercent } from '@/lib/format'
import { MAX_RUSHES, RUSH_TARGET } from '@/lib/rules/movement'
import type { MoveStep } from '@/lib/rules/movement'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()
const player = computed(() => store.selectedPlayer)
const analysis = computed(() => store.moveAnalysis)

const rolls = computed(() =>
  (analysis.value?.steps ?? []).filter((step) => step.isRush || step.dodge)
)

function rollLabel(step: MoveStep): string {
  const parts: string[] = []
  if (step.isRush) parts.push(`Rush ${RUSH_TARGET}+`)
  if (step.dodge) parts.push(`Dodge ${step.dodge.target}+`)
  return parts.join(' + ')
}
</script>
