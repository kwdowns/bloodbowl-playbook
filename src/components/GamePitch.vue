<template>
  <div class="w-full">
    <div>
      <p>Add offensive players</p>
      <PlayerCard 
      v-for="p in offensePlayers" 
      :key="p.id" 
      :player="p" 
      draggable="true"
      @dragStart="playerDragStart"
      @dragEnd="playerDragEnd"
      @dragOver="playerDragOver"
      />
    </div>
    <div>
      <p>Add defensive players</p>
      <PlayerCard v-for="p in defensePlayers" :key="p.id" :player="p" draggable="true" />
    </div>
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
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import type { PlayerDraggingEvent } from '@/lib/models/PlayerDraggingEvent'

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

  const playerJson = event.dataTransfer.getData('application/json')
  if(!playerJson) return;
  const draggedPlayer : PlayerDraggingEvent = JSON.parse(playerJson)
  if(!draggedPlayer) return;
  const dropElement = event.target as HTMLElement;
  if(!dropElement) return;
  dropElement.
  const [row, col] = 
  if(!draggedPlayer.sourceLocation)
  {
    store.addPlayer({...draggedPlayer.player, row, column: col});
  }
  else
  {
    store.movePlayer());
  }
}

const playerDragStart = (event: DragEvent) => {
  if (event.dataTransfer === null) return

  const player = JSON.parse(event.dataTransfer.getData('application/json')) as PlayerDraggingEvent;
  if(!player) return;

  event.dataTransfer.setData('application/json', playerId)
}
</script>
