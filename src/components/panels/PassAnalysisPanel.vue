<template>
  <section v-if="store.mode !== 'default'" class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <div class="mb-2 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-700">
        {{ isThrowTeammate ? 'Throw team-mate' : 'Pass analysis' }}
      </h2>
      <button
        type="button"
        class="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
        @click="store.setMode('default')"
      >
        Exit (Esc)
      </button>
    </div>

    <label class="mb-2 flex items-center gap-1.5 text-xs text-slate-600">
      <input v-model="store.showScatter" type="checkbox" />
      Highlight possible scatter / bounce squares
    </label>

    <p v-if="!store.passTargetSquare" class="text-xs text-slate-500">
      Hover a square to preview the throw; click to pin the target.
    </p>
    <p v-else-if="store.pinnedPassTarget" class="mb-2 text-xs text-slate-500">
      Target pinned — click another square to move it, or the same square to unpin.
    </p>

    <!-- ===== Regular pass ===== -->
    <template v-if="!isThrowTeammate && pass">
      <div class="mb-2 flex items-center gap-2">
        <span
          class="rounded px-2 py-1 text-xs font-bold text-white"
          :style="{ backgroundColor: rangeColor(pass.range) }"
        >
          {{ pass.range }}
        </span>
        <span v-if="pass.canAttempt && !pass.isHandOff" class="text-xs text-slate-600">
          PA {{ store.selectedPlayer?.passing }}+, modifier {{ pass.modifier }}
          <template v-if="pass.throwerMarkers"> ({{ pass.throwerMarkers }} marking)</template>
        </span>
      </div>

      <p v-if="!pass.canAttempt" class="text-xs font-medium text-rose-600">{{ pass.reason }}</p>

      <template v-else>
        <dl class="grid grid-cols-3 gap-1.5 text-xs">
          <div class="rounded bg-slate-50 p-1.5">
            <dt class="text-slate-500">Thrower</dt>
            <dd class="font-mono text-sm font-semibold text-slate-800">
              {{ pass.isHandOff ? 'Auto' : formatPercent(passerChance) }}
            </dd>
            <dd v-if="pass.outcomeWithReroll" class="text-[10px] text-slate-400">with Pass re-roll</dd>
          </div>
          <div class="rounded bg-slate-50 p-1.5">
            <dt class="text-slate-500">Catcher</dt>
            <dd class="font-mono text-sm font-semibold text-slate-800">
              {{ pass.catch ? formatPercent(catcherChance) : '—' }}
            </dd>
            <dd v-if="pass.catch?.withRerollChance" class="text-[10px] text-slate-400">
              with Catch re-roll
            </dd>
          </div>
          <div class="rounded bg-emerald-50 p-1.5">
            <dt class="text-slate-500">Combined</dt>
            <dd class="font-mono text-sm font-semibold text-emerald-800">
              {{ pass.catch ? formatPercent(pass.completionChance ?? 0) : '—' }}
            </dd>
          </div>
        </dl>

        <p v-if="pass.catch" class="mt-1.5 text-xs text-slate-600">
          Catcher #{{ pass.catch.catcher.number }} needs {{ pass.catch.target }}+
          <template v-if="pass.catch.markers"> ({{ pass.catch.markers }} marking)</template>
        </p>
        <p v-else class="mt-1.5 text-xs text-amber-700">
          No team-mate on the target square — the ball will bounce on arrival.
        </p>

        <p v-if="pass.interference" class="mt-1.5 rounded bg-rose-50 p-1.5 text-xs text-rose-700">
          Interference: #{{ pass.interference.interferer.number }} is in the passing lane and
          deflects on {{ pass.interference.deflectTarget }}+ —
          {{ formatPercent(pass.interference.deflectionChance) }} of throws deflected,
          {{ formatPercent(pass.interference.interceptionChance) }} fully intercepted (turnover).
        </p>

        <table v-if="!pass.isHandOff" class="mt-2 w-full text-xs">
          <tbody>
            <tr v-for="row in passOutcomeRows" :key="row.label">
              <td class="py-0.5 pr-2 text-slate-600">{{ row.label }}</td>
              <td class="w-full py-0.5">
                <div class="h-2.5 rounded-sm bg-slate-100">
                  <div
                    class="h-2.5 rounded-sm"
                    :class="row.barClass"
                    :style="{ width: `${row.chance * 100}%` }"
                  ></div>
                </div>
              </td>
              <td class="py-0.5 pl-2 text-right font-mono text-slate-700">
                {{ formatPercent(row.chance) }}
              </td>
            </tr>
          </tbody>
        </table>
        <p v-if="pass.isHandOff" class="mt-1 text-[11px] text-slate-400">
          A hand-off needs no test from the thrower.
        </p>
      </template>
    </template>

    <!-- ===== Throw team-mate ===== -->
    <template v-else-if="isThrowTeammate && ttm">
      <div class="mb-2 flex items-center gap-2">
        <span class="rounded bg-purple-500 px-2 py-1 text-xs font-bold text-white">
          {{ ttm.range === 'Hand-off' ? 'Quick Throw' : ttm.range.replace('Pass', 'Throw') }}
        </span>
        <span v-if="ttm.thrownPlayer" class="text-xs text-slate-600">
          Throwing #{{ ttm.thrownPlayer.number }} (PA {{ store.selectedPlayer?.passing }}+, modifier
          {{ ttm.modifier }})
        </span>
      </div>

      <p v-if="!ttm.canAttempt" class="text-xs font-medium text-rose-600">{{ ttm.reason }}</p>

      <template v-else>
        <dl class="grid grid-cols-2 gap-1.5 text-xs">
          <div class="rounded bg-emerald-50 p-1.5">
            <dt class="text-slate-500">Lands on feet</dt>
            <dd class="font-mono text-sm font-semibold text-emerald-800">
              {{ formatPercent(ttm.landing.safeChance) }}
            </dd>
          </div>
          <div class="rounded bg-amber-50 p-1.5">
            <dt class="text-slate-500">Lands prone</dt>
            <dd class="font-mono text-sm font-semibold text-amber-800">
              {{ formatPercent(ttm.landing.proneChance) }}
            </dd>
          </div>
          <div class="rounded bg-rose-50 p-1.5">
            <dt class="text-slate-500">Dropped (fumble)</dt>
            <dd class="font-mono text-sm font-semibold text-rose-800">
              {{ formatPercent(ttm.fumbleDropChance) }}
            </dd>
          </div>
          <div class="rounded bg-rose-50 p-1.5">
            <dt class="text-slate-500">Into crowd / on player</dt>
            <dd class="font-mono text-sm font-semibold text-rose-800">
              {{ formatPercent(ttm.landing.crowdChance + ttm.landing.onPlayerChance) }}
            </dd>
          </div>
        </dl>

        <ul class="mt-2 space-y-0.5 text-xs text-slate-600">
          <li v-if="ttm.lostActivationChance > 0">
            Really Stupid: {{ formatPercent(ttm.lostActivationChance) }} chance the thrower loses
            the activation{{ ttm.activationAssisted ? ' (assisted by a team-mate)' : ' (no helper adjacent!)' }}
          </li>
          <li v-if="ttm.eatenChance > 0" class="text-rose-700">
            Always Hungry: {{ formatPercent(ttm.eatenChance) }} chance #{{
              ttm.thrownPlayer?.number
            }}
            gets eaten, {{ formatPercent(ttm.hungryEscapeChance) }} they squirm free (throw
            fumbled)
          </li>
          <li>
            Throw: {{ formatPercent(ttm.throwOutcome.accurate) }} on target (still scatters 3
            squares), {{ formatPercent(ttm.throwOutcome.wildlyInaccurate) }} wildly off,
            {{ formatPercent(ttm.throwOutcome.fumble) }} fumbled
          </li>
        </ul>

        <p class="mt-2 text-[11px] leading-snug text-slate-400">
          A thrown team-mate always scatters before landing; landing on an occupied square is
          counted as a crash.
        </p>
      </template>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatPercent } from '@/lib/format'
import type { PassRange } from '@/lib/rules/pass'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()
const isThrowTeammate = computed(() => store.mode === 'throwTeammate')
const pass = computed(() => store.passAnalysis)
const ttm = computed(() => store.throwTeammateAnalysis)

const RANGE_COLORS: Record<PassRange, string> = {
  'Hand-off': '#38bdf8',
  'Quick Pass': '#4ade80',
  'Short Pass': '#eab308',
  'Long Pass': '#fb923c',
  'Long Bomb': '#f87171',
  'Out of Range': '#94a3b8'
}

function rangeColor(range: PassRange): string {
  return RANGE_COLORS[range]
}

const passerChance = computed(() => {
  const p = pass.value
  if (!p) return 0
  return (p.outcomeWithReroll ?? p.outcome).accurate
})

const catcherChance = computed(() => {
  const c = pass.value?.catch
  if (!c) return 0
  return c.withRerollChance ?? c.successChance
})

const passOutcomeRows = computed(() => {
  const p = pass.value
  if (!p || p.isHandOff) return []
  const outcome = p.outcomeWithReroll ?? p.outcome
  return [
    { label: 'Accurate', chance: outcome.accurate, barClass: 'bg-emerald-500' },
    { label: 'Inaccurate', chance: outcome.inaccurate, barClass: 'bg-amber-400' },
    { label: 'Wildly inaccurate', chance: outcome.wildlyInaccurate, barClass: 'bg-orange-500' },
    { label: 'Fumble', chance: outcome.fumble, barClass: 'bg-rose-500' }
  ]
})
</script>
