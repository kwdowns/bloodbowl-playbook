<template>
  <button
    type="button"
    class="relative h-7 w-7 border border-emerald-950/25 p-0.5"
    :class="[square.zoneClass, square.scrimmageEdge ? 'border-r-2 border-r-white/60' : '']"
    @click="emit('click')"
  >
    <div
      v-if="square.overlayColor"
      class="pointer-events-none absolute inset-0"
      :style="{ backgroundColor: square.overlayColor }"
    ></div>
    <span
      v-if="!square.occupant && square.overlayLabel"
      class="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-white drop-shadow"
      :title="square.overlayTitle"
    >
      {{ square.overlayLabel }}
    </span>
    <PlayerToken
      v-if="square.occupant"
      :player="square.occupant"
      :selected="square.selected"
      :block-target="square.blockTarget"
      :targetable="square.targetable"
    />
  </button>
</template>

<script setup lang="ts">
import PlayerToken from '@/components/PlayerToken.vue'
import type { SquareViewModel } from '@/components/squareViewModel'

defineProps<{ square: SquareViewModel }>()
const emit = defineEmits<{ click: [] }>()
</script>
