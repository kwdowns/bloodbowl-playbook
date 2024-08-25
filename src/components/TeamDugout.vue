<template lang="ts">
;<PlayerCard />
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import { type FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { type Player } from '@/lib/models/Player'
import { type Team } from '@/lib/models/Team'
import PlayerCard from '@/components/PlayerCard.vue'

const props = defineProps<{
  team: Team
  playerTemplates: Player[]
}>()
</script>

<script lang="tsx"></script>
