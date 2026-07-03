<template>
  <div class="inline-block rounded-lg bg-emerald-900 p-2 shadow-lg">
    <div class="relative w-max" @mouseleave="store.setHoverSquare(null)">
      <div
        class="grid w-max"
        :class="cursorClass"
        :style="{ gridTemplateColumns: `repeat(${PITCH_ROWS}, min-content)` }"
      >
        <PitchSquare
          v-for="square in squares"
          :key="`${square.row},${square.column}`"
          :square="square"
          @click="store.squareClicked({ row: square.row, column: square.column })"
          @mouseenter="store.setHoverSquare({ row: square.row, column: square.column })"
        />
      </div>

      <svg
        v-if="arc"
        class="pass-arc pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        :style="{ color: arc.color }"
      >
        <defs>
          <marker
            id="pass-arrowhead"
            markerWidth="7"
            markerHeight="7"
            refX="5.5"
            refY="3.5"
            orient="auto"
          >
            <path d="M0,0 L7,3.5 L0,7 Z" fill="currentColor" />
          </marker>
        </defs>
        <path :d="arc.path" class="pass-arc-glow" />
        <path :d="arc.path" class="pass-arc-line" marker-end="url(#pass-arrowhead)" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PitchSquare from '@/components/PitchSquare.vue'
import type { SquareViewModel } from '@/components/squareViewModel'
import { PITCH_COLUMNS, PITCH_ROWS, isAdjacent, samePosition } from '@/lib/models/PitchCoordinates'
import { assessDodge } from '@/lib/rules/dodge'
import { passRange, passingLaneSquares } from '@/lib/rules/pass'
import type { PassRange } from '@/lib/rules/pass'
import { formatPercent } from '@/lib/format'
import { usePlayerStore } from '@/stores/playerStore'

const store = usePlayerStore()

/** Rendered size of one pitch square in px; keep in sync with h-7/w-7 on PitchSquare. */
const CELL = 28

const RANGE_COLORS: Record<PassRange, string> = {
  'Hand-off': '#38bdf8',
  'Quick Pass': '#4ade80',
  'Short Pass': '#facc15',
  'Long Pass': '#fb923c',
  'Long Bomb': '#f87171',
  'Out of Range': '#94a3b8'
}

const cursorClass = computed(() => {
  if (store.placementTemplate) return 'cursor-crosshair'
  if (store.mode !== 'default') return 'cursor-cell'
  return ''
})

// The pass arc, drawn over the landscape pitch: display x follows the pitch
// row, display y follows the pitch column.
const arc = computed(() => {
  if (store.mode === 'default') return null
  const from = store.selectedPlayer
  const to = store.passTargetSquare
  if (!from || !to || samePosition(from, to)) return null

  const x1 = (from.row - 0.5) * CELL
  const y1 = (from.column - 0.5) * CELL
  const x2 = (to.row - 0.5) * CELL
  const y2 = (to.column - 0.5) * CELL
  const lift = Math.min(52, 10 + Math.hypot(x2 - x1, y2 - y1) * 0.2)
  const path = `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - lift} ${x2} ${y2}`
  const color =
    store.mode === 'throwTeammate' ? '#c084fc' : RANGE_COLORS[passRange(from, to)]
  return { path, color }
})

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
  const passTarget = store.passTargetSquare
  const scatter = store.scatterMap
  const lane =
    store.mode === 'pass' && selected && passTarget && !isAdjacent(selected, passTarget)
      ? passingLaneSquares(selected, passTarget)
      : []
  const interference = store.passAnalysis?.interference
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
        passTarget: Boolean(passTarget && samePosition(passTarget, { row, column })),
        targetable: Boolean(
          !placing &&
            store.mode === 'default' &&
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
        store.mode === 'default' &&
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

      // Passing lane and the best-placed interferer, in pass mode.
      if (lane.some((s) => samePosition(s, square))) {
        if (occupant && interference && occupant.id === interference.interferer.id) {
          square.overlayColor = 'rgba(251, 191, 36, 0.5)'
          square.overlayTitle = `#${occupant.number} can attempt passing interference`
        } else {
          square.overlayColor = 'rgba(255, 255, 255, 0.15)'
          square.overlayTitle = 'Passing lane'
        }
      }

      // Ball scatter heat map wins over the zone overlays while active.
      if (scatter) {
        const probability = scatter.grid[row - 1][column - 1]
        if (probability > 0.001) {
          square.overlayColor = `rgba(251, 191, 36, ${Math.min(0.85, 0.15 + Math.sqrt(probability) * 1.1)})`
          square.overlayTitle = `Ball ends here: ${formatPercent(probability)}`
          square.overlayLabel = probability >= 0.05 ? formatPercent(probability) : undefined
        }
      }

      result.push(square)
    }
  }
  return result
})
</script>

<style scoped>
.pass-arc-line {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 8 6;
  animation: pass-arc-dash 0.5s linear infinite;
}

.pass-arc-glow {
  fill: none;
  stroke: currentColor;
  stroke-width: 6;
  stroke-linecap: round;
  opacity: 0.25;
}

@keyframes pass-arc-dash {
  to {
    stroke-dashoffset: -14;
  }
}
</style>
