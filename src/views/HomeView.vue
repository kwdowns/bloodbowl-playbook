<template>
  <div class="min-h-screen bg-slate-100">
    <header class="border-b border-slate-200 bg-white px-4 py-3">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 class="text-lg font-bold text-slate-800">Blood Bowl Playbook</h1>
          <p class="text-xs text-slate-500">
            Set up a board scenario, then click a player and an adjacent opponent to analyze the
            block — or flip on an overlay to see who controls the pitch.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="store.players.length"
            type="button"
            class="rounded bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
            @click="copyShareLink"
          >
            {{ copied ? 'Link copied!' : 'Copy share link' }}
          </button>
          <button
            v-if="store.players.length"
            type="button"
            class="rounded bg-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-300"
            @click="store.clearPitch()"
          >
            Clear pitch
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto flex max-w-[1400px] flex-col gap-3 p-4 xl:flex-row xl:items-start xl:justify-center">
      <div class="flex min-w-0 flex-col gap-3">
        <OverlayControls />
        <div class="overflow-x-auto">
          <GamePitch />
        </div>
        <BlockAnalysisPanel />
      </div>

      <aside class="grid w-full gap-3 self-start md:grid-cols-2 xl:w-96 xl:shrink-0 xl:grid-cols-1">
        <AddPlayerForm />
        <SelectedPlayerPanel />
        <MoveAnalysisPanel />
        <PassAnalysisPanel />
      </aside>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import GamePitch from '@/components/GamePitch.vue'
import AddPlayerForm from '@/components/panels/AddPlayerForm.vue'
import BlockAnalysisPanel from '@/components/panels/BlockAnalysisPanel.vue'
import MoveAnalysisPanel from '@/components/panels/MoveAnalysisPanel.vue'
import OverlayControls from '@/components/panels/OverlayControls.vue'
import PassAnalysisPanel from '@/components/panels/PassAnalysisPanel.vue'
import SelectedPlayerPanel from '@/components/panels/SelectedPlayerPanel.vue'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import { isAdjacent, samePosition } from '@/lib/models/PitchCoordinates'
import { decodePitchState, decodeViewState, encodePitchState, encodeViewState } from '@/lib/urlState'
import type { ViewState } from '@/lib/urlState'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()
const copied = ref(false)

// --- Pitch + view state <-> URL query string ---

const PITCH_PARAM = 'pitch'
const VIEW_PARAM = 'view'

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  const encodedPitch = params.get(PITCH_PARAM)
  if (encodedPitch) store.players = decodePitchState(encodedPitch)
  const encodedView = params.get(VIEW_PARAM)
  if (encodedView) applyViewState(decodeViewState(encodedView))
})

/** Restore a decoded view state, dropping anything the current roster can't support. */
function applyViewState(view: ViewState) {
  store.overlay = view.overlay
  const selected = view.selectedIndex === null ? undefined : store.players[view.selectedIndex]
  if (!selected) return
  store.selectPlayer(selected.id)

  if (view.mode === 'default') {
    const target = view.blockTargetIndex === null ? undefined : store.players[view.blockTargetIndex]
    if (target && target.team !== selected.team && isAdjacent(selected, target)) {
      store.blockTargetId = target.id
    }
    return
  }

  store.setMode(view.mode)
  if (view.mode === 'move') {
    if (view.plannedRushes !== null) store.plannedRushes = view.plannedRushes
    store.movePath = validMovePrefix(selected, view.movePath)
  } else {
    if (view.passTarget && !samePosition(selected, view.passTarget)) {
      store.pinnedPassTarget = view.passTarget
    }
    store.showScatter = view.showScatter
  }
}

/** Longest leading stretch of the path that is step-by-step legal for the mover. */
function validMovePrefix(mover: FieldedPlayer, path: PitchCoordinates[]): PitchCoordinates[] {
  const valid: PitchCoordinates[] = []
  let previous: PitchCoordinates = { row: mover.row, column: mover.column }
  for (const step of path) {
    if (valid.length >= store.moveStepLimit) break
    if (!isAdjacent(previous, step) || store.getPlayerAtLocation(step)) break
    valid.push(step)
    previous = step
  }
  return valid
}

function playerIndex(id: string | null): number | null {
  if (!id) return null
  const index = store.players.findIndex((p) => p.id === id)
  return index === -1 ? null : index
}

const encodedPitch = computed(() => encodePitchState(store.players))
const encodedView = computed(() =>
  encodeViewState({
    selectedIndex: playerIndex(store.selectedPlayerId),
    blockTargetIndex: playerIndex(store.blockTargetId),
    mode: store.mode,
    overlay: store.overlay,
    passTarget: store.pinnedPassTarget,
    showScatter: store.showScatter,
    plannedRushes: store.plannedRushes,
    movePath: store.movePath
  })
)

watch([encodedPitch, encodedView], ([pitch, view]) => {
  const params = new URLSearchParams(window.location.search)
  if (pitch) params.set(PITCH_PARAM, pitch)
  else params.delete(PITCH_PARAM)
  if (view) params.set(VIEW_PARAM, view)
  else params.delete(VIEW_PARAM)
  const query = params.toString()
  // replaceState keeps vue-router's history entry intact and avoids history spam.
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${query ? `?${query}` : ''}`
  )
})

async function copyShareLink() {
  await navigator.clipboard.writeText(window.location.href)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

// --- Keyboard shortcuts ---

function isTyping(event: KeyboardEvent): boolean {
  const target = event.target
  if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true
  // A focused checkbox / radio / button is not text entry — hotkeys stay live.
  if (target instanceof HTMLInputElement) {
    return !['checkbox', 'radio', 'range', 'button'].includes(target.type)
  }
  return false
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    if (store.mode !== 'default') {
      // First Escape leaves pass / throw mode, a second one deselects.
      store.setMode('default')
      return
    }
    store.stopPlacing()
    store.selectPlayer(null)
    return
  }

  if (isTyping(event)) return
  const key = event.key.toLowerCase()
  if (key === 'p' && store.selectedPlayer) store.toggleMode('pass')
  else if (key === 't' && store.selectedPlayer) store.toggleMode('throwTeammate')
  else if (key === 'm' && store.selectedPlayer) store.toggleMode('move')
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>
