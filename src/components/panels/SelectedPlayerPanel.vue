<template>
  <section v-if="player" class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <div class="mb-2 flex items-center justify-between">
      <h2 class="text-sm font-semibold text-slate-700">
        <span
          class="mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold text-white"
          :class="player.team === 'Offense' ? 'bg-red-600' : 'bg-sky-600'"
          >{{ player.number }}</span
        >
        {{ player.name || 'Selected player' }}
      </h2>
      <button
        type="button"
        class="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700 hover:bg-rose-200"
        @click="store.removePlayer(player.id)"
      >
        Remove
      </button>
    </div>

    <input
      v-model.trim="player.name"
      type="text"
      placeholder="Custom name (optional)"
      maxlength="30"
      class="mb-2 w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-800"
    />

    <div class="grid grid-cols-5 gap-1.5 text-center">
      <label v-for="stat in stats" :key="stat.key" class="text-[10px] font-medium text-slate-500">
        {{ stat.label }}
        <input
          v-model.number="player[stat.key]"
          type="number"
          :min="stat.min"
          :max="stat.max"
          class="mt-0.5 w-full rounded border border-slate-300 px-1 py-0.5 text-center text-xs text-slate-800"
        />
      </label>
    </div>

    <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      <label
        v-for="skill in SKILL_NAMES"
        :key="skill"
        class="flex items-center gap-1 text-xs text-slate-600"
        :title="SKILLS[skill].description"
      >
        <input v-model="player.skills" type="checkbox" :value="skill" />
        {{ skill }}
      </label>
    </div>

    <div class="mt-2 flex flex-wrap gap-1.5">
      <button
        type="button"
        class="rounded px-2 py-1 text-xs font-semibold"
        :class="
          store.mode === 'move'
            ? 'bg-sky-600 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        "
        @click="store.toggleMode('move')"
      >
        Move mode (M)
      </button>
      <button
        type="button"
        class="rounded px-2 py-1 text-xs font-semibold"
        :class="
          store.mode === 'pass'
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        "
        @click="store.toggleMode('pass')"
      >
        Pass mode (P)
      </button>
      <button
        type="button"
        class="rounded px-2 py-1 text-xs font-semibold"
        :class="
          store.mode === 'throwTeammate'
            ? 'bg-purple-600 text-white'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
        "
        @click="store.toggleMode('throwTeammate')"
      >
        Throw team-mate (T)
      </button>
    </div>

    <p class="mt-2 text-xs text-slate-500">
      Click an empty square to move this player, or use Move mode to plan a path with dodges and
      rushes. Click an adjacent opponent to analyze a block.
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SKILLS, SKILL_NAMES } from '@/lib/models/Skill'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()
const player = computed(() => store.selectedPlayer)

const stats = [
  { key: 'movement', label: 'MA', min: 1, max: 9 },
  { key: 'strength', label: 'ST', min: 1, max: 8 },
  { key: 'agility', label: 'AG+', min: 1, max: 6 },
  { key: 'passing', label: 'PA+', min: 0, max: 6 },
  { key: 'armor', label: 'AV+', min: 3, max: 11 }
] as const
</script>
