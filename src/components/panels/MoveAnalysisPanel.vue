<template>
  <section
    v-if="store.mode === 'move' && player"
    class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
  >
    <div class="mb-2 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-700">Move planner</h2>
      <button
        type="button"
        class="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
        @click="store.setMode('default')"
      >
        Exit (Esc)
      </button>
    </div>

    <div class="mb-2 flex items-center justify-between gap-2 text-xs text-slate-600">
      <span>
        MA {{ player.movement }} · used {{ store.movePath.length }} / {{ store.moveStepLimit }}
        squares
      </span>
      <label class="flex items-center gap-1.5">
        Rushes
        <select
          v-model.number="store.plannedRushes"
          class="rounded border border-slate-300 px-1 py-0.5 text-xs text-slate-800"
        >
          <option v-for="n in rushOptions" :key="n" :value="n">{{ n }}</option>
        </select>
      </label>
    </div>

    <p v-if="!analysis" class="text-xs text-slate-500">
      Click highlighted squares to plan the path — white squares are within movement, amber ones
      need a Rush ({{ RUSH_TARGET }}+). Click a planned square to rewind.
    </p>

    <template v-else>
      <ol class="max-h-48 space-y-0.5 overflow-y-auto text-xs">
        <li
          v-for="step in analysis.steps"
          :key="step.stepNumber"
          class="flex items-baseline justify-between gap-2"
          :class="step.rush || step.dodge ? 'text-amber-800' : 'text-slate-500'"
        >
          <span>
            {{ step.stepNumber }}.
            <template v-if="step.rush">Rush {{ RUSH_TARGET }}+</template>
            <template v-if="step.rush && step.dodge"> · </template>
            <template v-if="step.dodge">
              Dodge {{ step.dodge.target }}+
              <template v-if="step.dodge.destinationMarkers">
                ({{ step.dodge.destinationMarkers }} marking the target square)
              </template>
            </template>
            <template v-if="!step.rush && !step.dodge">free move</template>
          </span>
          <span v-if="step.chance < 1" class="font-mono">{{ formatPercent(step.chance) }}</span>
        </li>
      </ol>

      <dl class="mt-2 grid grid-cols-2 gap-1.5 text-xs">
        <div class="rounded bg-emerald-50 p-1.5">
          <dt class="text-slate-500">Whole path succeeds</dt>
          <dd class="font-mono text-sm font-semibold text-emerald-800">
            {{ formatPercent(analysis.successChance) }}
          </dd>
        </div>
        <div class="rounded bg-slate-50 p-1.5">
          <dt class="text-slate-500">With skill re-rolls</dt>
          <dd class="font-mono text-sm font-semibold text-slate-800">
            {{
              analysis.successChanceWithSkills > analysis.successChance
                ? formatPercent(analysis.successChanceWithSkills)
                : '—'
            }}
          </dd>
        </div>
      </dl>
      <p
        v-if="analysis.successChanceWithSkills > analysis.successChance"
        class="mt-1 text-[11px] text-slate-400"
      >
        Dodge and Sure Feet re-rolls are each used at most once per turn, on the first failure.
      </p>
      <p v-if="analysis.rushesUsed" class="mt-1 text-[11px] text-slate-400">
        Failing a Rush or a Dodge means the player falls over on that square.
      </p>

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
          Clear
        </button>
        <button
          type="button"
          class="rounded bg-sky-600 px-2 py-1 text-xs font-semibold text-white hover:bg-sky-700"
          @click="store.applyMovePath()"
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
import { RUSH_TARGET, maxRushes } from '@/lib/rules/movement'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()
const player = computed(() => store.selectedPlayer)
const analysis = computed(() => store.moveAnalysis)

const rushOptions = computed(() => {
  const max = player.value ? maxRushes(player.value) : 2
  return Array.from({ length: max + 1 }, (_, n) => n)
})
</script>
