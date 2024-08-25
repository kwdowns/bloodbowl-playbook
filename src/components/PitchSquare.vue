<template>
  <div class="w-4 h-4 border-slate-800 dark:border-gray-200 bg-slate-100 dark:bg-gray-700">
    <slot></slot>
  </div>
</template>
<script setup lang="ts">
import { useSlots, computed } from 'vue'

const { slots } = useSlots()

const hasPlayer = computed(() => slots !== undefined)

const props = defineProps<{
  row: number
  col: number
}>()
</script>
