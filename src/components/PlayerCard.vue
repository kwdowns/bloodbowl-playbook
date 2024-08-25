<template><p></p></template>

<script setup lang="ts">
import { type Player } from '@/lib/models/Player'
import { usePlayerStore } from '@/stores/playerStore'
const props = defineProps<{
  player?: Player
}>()
const store = usePlayerStore()
</script>

<script lang="tsx"></script>
