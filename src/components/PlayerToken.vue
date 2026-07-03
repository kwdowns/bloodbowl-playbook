<template>
  <div
    class="relative flex h-full w-full items-center justify-center rounded-full text-xs font-bold text-white shadow"
    :class="[
      player.team === 'Offense' ? 'bg-red-600' : 'bg-sky-600',
      selected ? 'ring-2 ring-yellow-300' : '',
      blockTarget ? 'ring-2 ring-rose-300' : '',
      targetable && !blockTarget ? 'outline outline-1 outline-dashed outline-rose-200' : ''
    ]"
    :title="tooltip"
  >
    {{ player.number }}
    <span
      v-if="player.skills.length"
      class="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-yellow-300"
    ></span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'

const props = defineProps<{
  player: FieldedPlayer
  selected?: boolean
  blockTarget?: boolean
  targetable?: boolean
}>()

const tooltip = computed(() => {
  const p = props.player
  const skills = p.skills.length ? ` — ${p.skills.join(', ')}` : ''
  return `#${p.number} ${p.team} · MA ${p.movement} ST ${p.strength} AG ${p.agility}+ PA ${p.passing}+ AV ${p.armor}+${skills}`
})
</script>
