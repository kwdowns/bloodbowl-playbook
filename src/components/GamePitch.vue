<template>
  <div>
    <p>Add offensive players</p>
    <PlayerCard v-for="p in offensePlayers" :key="p.id" :player="p" draggable="true" />
  </div>
  <div>
    <p>Add defensive players</p>
    <PlayerCard v-for="p in defensePlayers" :key="p.id" :player="p" draggable="true" />
  </div>
  <div
    class="w-full h-full grid grid-cols-[repeat(15, minmax(0, 1fr))] grid-rows-[repeat(26, minmax(0, 1fr))]"
  >
    <PitchSquare
      v-for="cell in pitchLocations"
      :key="`${cell.row}|${cell.column}`"
      :row="cell.row"
      :col="cell.column"
      class="w-2"
    >
      <PlayerCard
        v-if="store.getPlayerAtLocation(cell)"
        :player="store.getPlayerAtLocation(cell)!"
        :on="{
          onDrop: console.log
        }"
      />
    </PitchSquare>
  </div>
</template>

<script setup lang="ts">
import PlayerCard from '@/components/PlayerCard.vue'
import { usePlayerStore } from '@/stores/playerStore'
import PitchSquare from './PitchSquare.vue'
import { ref } from 'vue'
import { data } from '@/lib/data'

const pitchLocations = ref(
  new Array(26 * 15).fill({ row: 0, column: 0 }).map((_, i) => ({
    row: i % 26,
    column: Math.floor(i / 26)
  }))
)

const offensePlayers = ref(data.offense.players)
const defensePlayers = ref(data.defense.players)

const store = usePlayerStore()

const onDrop = (event: DragEvent) => {
  if (event.dataTransfer === null) return

  const playerId = event.dataTransfer.getData('text/plain')
  const [row, col] = event.target ? (event.target as HTMLElement).id.split(',').map(Number) : [0, 0]
  store.movePlayer({ playerId, row, column: col })
}
</script>
