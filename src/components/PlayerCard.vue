<template>
  <p>{{ player.position }}</p>
  <table>
    <thead>
      <tr>
        <td>AG</td>
        <td>PA</td>
        <td>ST</td>
        <td>AR</td>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          {{ player.agility }}
        </td>
        <td>
          {{ player.passing }}
        </td>
        <td>
          {{ player.strength }}
        </td>
        <td>
          {{ player.armor }}
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates';
import { type Player } from '@/lib/models/Player'
import { ref } from 'vue'
const props = defineProps<{
  player: Player,
  location?: PitchCoordinates
}>()
const player = ref(props.player)
</script>
