<template>
  <div class="inline-block rounded-lg bg-emerald-900 p-2 shadow-lg">
    <div
      class="grid w-max"
      :class="store.placementTemplate ? 'cursor-crosshair' : ''"
      :style="{ gridTemplateColumns: `repeat(${PITCH_ROWS}, min-content)` }"
    >
      <PitchSquare
        v-for="square in squares"
        :key="`${square.row},${square.column}`"
        :square="square"
        @click="store.squareClicked({ row: square.row, column: square.column })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PitchSquare from '@/components/PitchSquare.vue'
import type { SquareViewModel } from '@/components/squareViewModel'
import { PITCH_COLUMNS, PITCH_ROWS, isAdjacent } from '@/lib/models/PitchCoordinates'
import { assessDodge } from '@/lib/rules/dodge'
import { formatPercent } from '@/lib/format'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()

function zoneClass(row: number, column: number): string {
  if (row === 1 || row === PITCH_ROWS) return 'bg-emerald-800'
  if (column <= 4 || column >= PITCH_COLUMNS - 3) return 'bg-emerald-700'
  return 'bg-emerald-600'
}

function zoneOverlay(count: number, rgb: string, prefix: string) {
  if (count === 0) return {}
  const alpha = Math.min(0.75, 0.07 + 0.18 * Math.abs(count))
  return {
    overlayColor: `rgba(${rgb}, ${alpha})`,
    overlayLabel: `${count > 0 && prefix === 'Net control' ? '+' : ''}${count}`,
    overlayTitle: `${prefix}: ${count}`
  }
}

// The pitch is drawn landscape: pitch rows (length, 1..26) run left to right,
// pitch columns (width, 1..15) run top to bottom.
const squares = computed<SquareViewModel[]>(() => {
  const { offense, defense, net } = store.zones
  const selected = store.selectedPlayer
  const placing = Boolean(store.placementTemplate)
  const result: SquareViewModel[] = []

  for (let column = 1; column <= PITCH_COLUMNS; column++) {
    for (let row = 1; row <= PITCH_ROWS; row++) {
      const occupant = store.getPlayerAtLocation({ row, column })
      const square: SquareViewModel = {
        row,
        column,
        occupant,
        zoneClass: zoneClass(row, column),
        scrimmageEdge: row === PITCH_ROWS / 2,
        selected: Boolean(occupant && occupant.id === store.selectedPlayerId),
        blockTarget: Boolean(occupant && occupant.id === store.blockTargetId),
        targetable: Boolean(
          !placing &&
            occupant &&
            selected &&
            occupant.team !== selected.team &&
            isAdjacent(selected, occupant)
        )
      }

      if (store.overlay === 'offense') {
        Object.assign(
          square,
          zoneOverlay(offense[row - 1][column - 1], '248, 113, 113', 'Offense tackle zones')
        )
      } else if (store.overlay === 'defense') {
        Object.assign(
          square,
          zoneOverlay(defense[row - 1][column - 1], '56, 189, 248', 'Defense tackle zones')
        )
      } else if (store.overlay === 'net') {
        const value = net[row - 1][column - 1]
        Object.assign(
          square,
          zoneOverlay(value, value > 0 ? '248, 113, 113' : '56, 189, 248', 'Net control')
        )
      } else if (
        store.overlay === 'dodge' &&
        selected &&
        !occupant &&
        isAdjacent(selected, square)
      ) {
        const dodge = assessDodge(store.players, selected, square)
        square.overlayColor = 'rgba(255, 255, 255, 0.18)'
        if (dodge.required) {
          square.overlayLabel = `${dodge.target}+`
          square.overlayTitle = `Dodge ${dodge.target}+ (${formatPercent(dodge.successChance)})${
            dodge.withRerollChance
              ? `, ${formatPercent(dodge.withRerollChance)} with Dodge re-roll`
              : ''
          }`
        } else {
          square.overlayLabel = '✓'
          square.overlayTitle = 'No dodge needed — this player is not marked'
        }
      }

      result.push(square)
    }
  }
  return result
})
</script>
