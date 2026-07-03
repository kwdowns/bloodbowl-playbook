<template>
  <section class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
    <h2 class="mb-2 text-sm font-semibold text-slate-700">Overlay</h2>
    <div class="flex flex-wrap gap-1.5">
      <button
        v-for="option in options"
        :key="option.value"
        type="button"
        class="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
        :class="
          store.overlay === option.value
            ? 'bg-slate-800 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        "
        :title="option.hint"
        @click="store.overlay = option.value"
      >
        {{ option.label }}
      </button>
    </div>
    <p v-if="store.overlay === 'dodge'" class="mt-2 text-xs text-slate-500">
      Select a player to see the dodge roll needed for each adjacent square.
    </p>
  </section>
</template>

<script setup lang="ts">
import type { OverlayMode } from '@/stores/playerStore'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()

const options: { value: OverlayMode; label: string; hint: string }[] = [
  { value: 'none', label: 'None', hint: 'No overlay' },
  {
    value: 'offense',
    label: 'Red zones',
    hint: 'Squares covered by red (Offense) tackle zones'
  },
  {
    value: 'defense',
    label: 'Blue zones',
    hint: 'Squares covered by blue (Defense) tackle zones'
  },
  {
    value: 'net',
    label: 'Net control',
    hint: 'Red tackle zones minus blue tackle zones per square'
  },
  { value: 'dodge', label: 'Dodge', hint: 'Dodge targets for the selected player' }
]
</script>
