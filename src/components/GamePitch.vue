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
        v-if="movePathLine"
        class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        <polyline :points="movePathLine" class="move-path-glow" />
        <polyline :points="movePathLine" class="move-path-line" />
      </svg>

      <svg
        v-if="assistArrows.length"
        class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      >
        <defs>
          <marker
            v-for="(color, team) in TEAM_ARROW_COLORS"
            :id="`assist-arrowhead-${team}`"
            :key="team"
            markerWidth="6"
            markerHeight="6"
            refX="4.5"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L6,3 L0,6 Z" :fill="color" />
          </marker>
        </defs>
        <g v-for="arrow in assistArrows" :key="arrow.key">
          <line
            :x1="arrow.x1"
            :y1="arrow.y1"
            :x2="arrow.x2"
            :y2="arrow.y2"
            class="assist-arrow-glow"
            :stroke="arrow.color"
          />
          <line
            :x1="arrow.x1"
            :y1="arrow.y1"
            :x2="arrow.x2"
            :y2="arrow.y2"
            class="assist-arrow-line"
            :stroke="arrow.color"
            :marker-end="`url(#assist-arrowhead-${arrow.team})`"
          >
            <title>{{ arrow.title }}</title>
          </line>
        </g>
      </svg>

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
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import type { SquareViewModel } from '@/components/squareViewModel'
import { PITCH_COLUMNS, PITCH_ROWS, isAdjacent, samePosition } from '@/lib/models/PitchCoordinates'
import { assessDodge } from '@/lib/rules/dodge'
import { RUSH_TARGET } from '@/lib/rules/movement'
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

const TEAM_ARROW_COLORS = {
  Offense: '#f87171',
  Defense: '#38bdf8'
} as const

const cursorClass = computed(() => {
  if (store.placementTemplate) return 'cursor-crosshair'
  if (store.mode !== 'default') return 'cursor-cell'
  return ''
})

// The pass arc, drawn over the landscape pitch: display x follows the pitch
// row, display y follows the pitch column.
const arc = computed(() => {
  if (store.mode !== 'pass' && store.mode !== 'throwTeammate') return null
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

// Assist arrows for the current block: each offensive assist points at the
// defender, each defensive assist points at the attacker. Drawn over the
// landscape pitch (display x follows the pitch row, display y the pitch
// column), trimmed at both ends so the tokens stay readable.
const assistArrows = computed(() => {
  const analysis = store.blockAnalysis
  if (!analysis) return []
  const { attacker, defender, offensiveAssists, defensiveAssists } = analysis.assessment

  function arrowsToward(assists: FieldedPlayer[], target: FieldedPlayer, label: string) {
    return assists.map((assist) => {
      const x1 = (assist.row - 0.5) * CELL
      const y1 = (assist.column - 0.5) * CELL
      const x2 = (target.row - 0.5) * CELL
      const y2 = (target.column - 0.5) * CELL
      const length = Math.hypot(x2 - x1, y2 - y1)
      const ux = (x2 - x1) / length
      const uy = (y2 - y1) / length
      // Start at the assisting token's edge, stop short of the target token.
      const startOffset = 9
      const endOffset = 15
      return {
        key: `${assist.id}-${target.id}`,
        x1: x1 + ux * startOffset,
        y1: y1 + uy * startOffset,
        x2: x2 - ux * endOffset,
        y2: y2 - uy * endOffset,
        team: assist.team,
        color: TEAM_ARROW_COLORS[assist.team],
        title: `#${assist.number} ${label}`
      }
    })
  }

  return [
    ...arrowsToward(offensiveAssists, defender, 'assists the block'),
    ...arrowsToward(defensiveAssists, attacker, 'assists the defender')
  ]
})

// The planned move path, drawn square-center to square-center over the pitch
// (display x follows the pitch row, display y the pitch column).
const movePathLine = computed(() => {
  const mover = store.selectedPlayer
  if (store.mode !== 'move' || !mover || store.movePath.length === 0) return null
  return [{ row: mover.row, column: mover.column }, ...store.movePath]
    .map((square) => `${(square.row - 0.5) * CELL},${(square.column - 0.5) * CELL}`)
    .join(' ')
})

function zoneClass(row: number, column: number): string {
  if (row === 1 || row === PITCH_ROWS) return 'bg-emerald-700'
  if (column <= 4 || column >= PITCH_COLUMNS - 3) return 'bg-emerald-600'
  return 'bg-emerald-500'
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
  const passTarget =
    store.mode === 'pass' || store.mode === 'throwTeammate' ? store.passTargetSquare : null
  const moveSteps = store.moveAnalysis?.steps
  const pathChance = store.moveAnalysis?.successChance ?? 1
  const moveStepBySquare = new Map(
    store.mode === 'move'
      ? store.movePath.map((square, index): [string, number] => [
          `${square.row},${square.column}`,
          index
        ])
      : []
  )
  const reachable = store.mode === 'move' ? store.moveReachable : undefined
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

      // Move planner: the planned path with its rolls, and reachable squares.
      if (store.mode === 'move' && selected) {
        const stepIndex = moveStepBySquare.get(`${row},${column}`)
        if (stepIndex !== undefined && moveSteps) {
          const step = moveSteps[stepIndex]
          const rolls: string[] = []
          if (step.rush) rolls.push(`Rush ${RUSH_TARGET}+`)
          if (step.dodge) {
            rolls.push(
              `Dodge ${step.dodge.target}+${step.dodge.destinationMarkers ? ` (${step.dodge.destinationMarkers} marking)` : ''}`
            )
          }
          square.onMovePath = true
          square.overlayColor =
            rolls.length > 0 ? 'rgba(251, 191, 36, 0.4)' : 'rgba(56, 189, 248, 0.35)'
          square.overlayLabel = step.dodge
            ? `${step.dodge.target}+`
            : step.rush
              ? `${RUSH_TARGET}+`
              : `${step.stepNumber}`
          square.overlayTitle = `Step ${step.stepNumber}${rolls.length ? ` — ${rolls.join(', ')}` : ' — no roll needed'}`
        } else if (!occupant) {
          const route = reachable?.[row - 1][column - 1]
          if (route) {
            const totalChance = pathChance * route.chance
            square.overlayColor =
              route.rushes > 0 ? 'rgba(251, 191, 36, 0.2)' : 'rgba(255, 255, 255, 0.22)'
            square.overlayTitle = `${route.steps} square${route.steps === 1 ? '' : 's'}${
              route.rushes > 0 ? ` (${route.rushes} rush${route.rushes === 1 ? '' : 'es'})` : ''
            } — best route ${formatPercent(totalChance)}`
            if (totalChance < 0.999) square.overlayLabel = formatPercent(totalChance)
          }
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

.assist-arrow-line {
  stroke-width: 2.5;
  stroke-linecap: round;
}

.assist-arrow-glow {
  stroke-width: 6;
  stroke-linecap: round;
  opacity: 0.3;
}

.move-path-line {
  fill: none;
  stroke: #7dd3fc;
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 6 5;
}

.move-path-glow {
  fill: none;
  stroke: #0ea5e9;
  stroke-width: 6;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.3;
}
</style>
