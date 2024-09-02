<template>
  <div :class="{
    'w-4': true,
    'h-4': true,
    'bg-green-400': hasPlayer,
    'bg-green-500': !hasPlayer,
    'bg-gradient-to-b from-green-400 to-red-200': hasPlayer && isHovering,
    'bg-green-700': !hasPlayer && isHovering,
    'border-slate-700': true
  }">
    <span v-if="props.dodgeModifiers" class="text-blue-600">{{ props.dodgeModifiers.offensiveModifier }}</span>
    <span v-if="props.dodgeModifiers" class="text-red-600">{{ props.dodgeModifiers.defensiveModifier }}</span>
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { useSlots, computed, toRefs, unref, ref } from 'vue'
import { useDrop } from 'vue3-dnd';
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import type { Player } from '@/lib/models/Player';
import type { PlayerDraggingEvent, PlayerDroppedEvent } from '@/lib/models/PlayerDraggingEvent';
const { slots } = useSlots()
const hasPlayer = computed(() => slots !== undefined)
const props = defineProps<PitchCoordinates &{
  onPlayerDrop: (item: PlayerDroppedEvent) => void
  beginHover: (item: PlayerDraggingEvent) => void
  endHover: (item: PlayerDraggingEvent) => void
  dodgeModifiers?: { offensiveModifier: number, defensiveModifier: number } | null
}>()
const isHovering = ref(false);

const [, drop] = useDrop({
  accept: 'PlayerDraggingEvent',
  drop: (item: { player: Player }) => {
    if(!hasPlayer.value)
    {
      props.onPlayerDrop({player: item.player, targetLocation: {row: props.row, column: props.column}});
      return;
    }
    
  },
  collect: (monitor: any ):{
    isOver: boolean,
    canDrop: boolean
  } => ({
    isOver: monitor.isOver(),
    canDrop: monitor.canDrop()
  })
})

</script>
