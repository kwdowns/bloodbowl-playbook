<template>
  <div class="min-h-screen bg-slate-100">
    <header class="border-b border-slate-200 bg-white px-4 py-3">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-slate-800">Blood Bowl Playbook</h1>
          <p class="text-xs text-slate-500">
            Set up a board scenario, then click a player and an adjacent opponent to analyze the
            block — or flip on an overlay to see who controls the pitch.
          </p>
        </div>
        <button
          v-if="store.players.length"
          type="button"
          class="rounded bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
          @click="store.clearPitch()"
        >
          Clear pitch
        </button>
      </div>
    </header>

    <main class="flex flex-col gap-4 p-4 xl:flex-row">
      <div class="overflow-x-auto">
        <GamePitch />
      </div>

      <aside class="flex w-full flex-col gap-3 xl:w-96 xl:shrink-0">
        <OverlayControls />
        <AddPlayerForm />
        <SelectedPlayerPanel />
        <BlockAnalysisPanel />
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import GamePitch from '@/components/GamePitch.vue'
import AddPlayerForm from '@/components/panels/AddPlayerForm.vue'
import BlockAnalysisPanel from '@/components/panels/BlockAnalysisPanel.vue'
import OverlayControls from '@/components/panels/OverlayControls.vue'
import SelectedPlayerPanel from '@/components/panels/SelectedPlayerPanel.vue'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    store.stopPlacing()
    store.selectPlayer(null)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>
