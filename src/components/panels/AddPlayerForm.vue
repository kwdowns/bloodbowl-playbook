<template>
  <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <h2 class="mb-2 text-sm font-semibold text-slate-700">Add players</h2>

    <div class="mb-2 flex gap-1.5">
      <button
        v-for="team in ['Offense', 'Defense'] as const"
        :key="team"
        type="button"
        class="flex-1 rounded px-2 py-1 text-xs font-semibold"
        :class="
          template.team === team
            ? team === 'Offense'
              ? 'bg-red-600 text-white'
              : 'bg-sky-600 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        "
        @click="template.team = team"
      >
        {{ team === 'Offense' ? 'Red (Offense)' : 'Blue (Defense)' }}
      </button>
    </div>

    <div class="grid grid-cols-5 gap-1.5 text-center">
      <label v-for="stat in stats" :key="stat.key" class="text-[10px] font-medium text-slate-500">
        {{ stat.label }}
        <input
          v-model.number="template[stat.key]"
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
        <input v-model="template.skills" type="checkbox" :value="skill" />
        {{ skill }}
      </label>
    </div>

    <button
      type="button"
      class="mt-3 w-full rounded px-2 py-1.5 text-xs font-semibold text-white"
      :class="store.placementTemplate ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-700 hover:bg-emerald-800'"
      @click="togglePlacing"
    >
      {{ store.placementTemplate ? 'Done placing (Esc)' : 'Place on pitch' }}
    </button>
    <p v-if="store.placementTemplate" class="mt-1.5 text-xs text-slate-500">
      Click empty squares to drop players with these stats.
    </p>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { SKILLS, SKILL_NAMES } from '@/lib/models/Skill'
import { defaultTemplate, usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()
const template = reactive(defaultTemplate('Offense'))

const stats = [
  { key: 'movement', label: 'MA', min: 1, max: 9 },
  { key: 'strength', label: 'ST', min: 1, max: 8 },
  { key: 'agility', label: 'AG+', min: 1, max: 6 },
  { key: 'passing', label: 'PA+', min: 0, max: 6 },
  { key: 'armor', label: 'AV+', min: 3, max: 11 }
] as const

function togglePlacing() {
  if (store.placementTemplate) {
    store.stopPlacing()
  } else {
    store.startPlacing({ ...template, skills: [...template.skills] })
  }
}
</script>
