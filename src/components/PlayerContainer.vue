<template>

<div :ref="drag" :class="{ 
    'bg-green-400': isDragging,
    'bg-green-100': !isDragging
}">
    <div v-for="location in locations" :key="`location_${location.row}_${location.column}`">
        <div v-if="location.row === props.location?.row && location.column === props.location?.column">
            #{{ player.number}}, {{ player.position }}
        </div>
        <div v-else-if="blockAssists && blockAssists.row === location.row && blockAssists.column === location.column">
            Block +{{ blockAssists.offensiveAssists }}/-{{ blockAssists.defensiveAssists }}
        </div>
        <div v-else>
            
        </div>
    </div>
    
</div>

</template>
<script setup lang="ts">
import { useDrag, type DragSourceMonitor } from 'vue3-dnd'
import type { Player } from '@/lib/models/Player'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer';
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates';
import { computed, ref } from 'vue';
import type { PlayerDraggingEvent, PlayerDroppedEvent } from '@/lib/models/PlayerDraggingEvent';
import { toRefs } from 'vue';

const props = defineProps<{
  player: Player,
  location?: PitchCoordinates
  blockTargets?: Array<FieldedPlayer & { offensiveAssists: number; defensiveAssists: number; }>
}>()

const player = ref(props.player)

const locations = computed(getThisAndAdjacentCoordinates);
const adjacentLocations = computed(() => locations.value?.filter(x => x.row !== props.location?.row && x.column !== props.location?.column));
const blockAssists = computed(() => props.blockTargets?.find(x => adjacentLocations.value?.some(y => y.row === x.row && y.column === x.column)));

const [collect, drag] = useDrag({
  type: 'PlayerDraggingEvent',
  item: () => {
    return {
      player: player.value,
      sourceLocation: props.location
    } as PlayerDraggingEvent
  },
  collect: (monitor: DragSourceMonitor) => ({
    isDragging: monitor.isDragging(),
  })
})

const isDragging = toRefs(collect)

function getThisAndAdjacentCoordinates(): PitchCoordinates[] | null {
    if(!props.location)
    {
        return null;
    }
    const adjacentLocations: PitchCoordinates[] = [];
    for(let i = props.location.row - 1; i <= props.location.row + 1; i++)
    {
        for(let j = props.location.column - 1; j <= props.location.column + 1; j++)
        {
            if(i < 0 || i >= 26 || j < 0 || j >= 15)
            {
                continue;
            }
            adjacentLocations.push({ row: i, column: j });
        }
    }
    return adjacentLocations;
}

</script>