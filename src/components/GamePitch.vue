<template>
  <div>
    <div v-for="row in 26" :key="row">
      <div v-for="col in 15" :key="col">
        <PlacedPlayer
          v-if="store.getPlayerAtLocation({ row, column: col })"
          :player="store.getPlayerAtLocation({ row, column: col })!"
          class="w-2"
        />
        <EmptySquare v-else :row="row" :col="col" class="w-2" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import PlacedPlayer from '@/components/PlayerCard.vue'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()

const onDrop = (event: DragEvent) => {
  if (event.dataTransfer === null) return

  const playerId = event.dataTransfer.getData('text/plain')
  const [row, col] = event.target ? (event.target as HTMLElement).id.split(',').map(Number) : [0, 0]
  store.movePlayer({ playerId, row, column: col })
}
</script>
