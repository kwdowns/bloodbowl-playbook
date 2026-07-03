import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { v4 as uuid } from 'uuid'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import type { Player } from '@/lib/models/Player'
import { isAdjacent, samePosition } from '@/lib/models/PitchCoordinates'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import type { SkillName } from '@/lib/models/Skill'
import type { Team } from '@/lib/models/Team'
import { assessBlock } from '@/lib/rules/blocks'
import type { BlockAssessment } from '@/lib/rules/blocks'
import { summarizeBlock } from '@/lib/rules/blockDice'
import type { BlockOutcomeSummary } from '@/lib/rules/blockDice'
import { assessPass, ballLandingMap } from '@/lib/rules/pass'
import type { BallLandingMap, PassAssessment } from '@/lib/rules/pass'
import { controlMaps } from '@/lib/rules/tackleZones'
import { assessThrowTeammate } from '@/lib/rules/throwTeammate'
import type { ThrowTeammateAssessment } from '@/lib/rules/throwTeammate'

export type OverlayMode = 'none' | 'offense' | 'defense' | 'net' | 'dodge'
export type InteractionMode = 'default' | 'pass' | 'throwTeammate'

export interface PlayerTemplate {
  team: Team
  movement: number
  strength: number
  agility: number
  passing: number
  armor: number
  skills: SkillName[]
}

export const defaultTemplate = (team: Team): PlayerTemplate => ({
  team,
  movement: 6,
  strength: 3,
  agility: 3,
  passing: 4,
  armor: 9,
  skills: []
})

export const usePlayerStore = defineStore('players', () => {
  const players = ref<FieldedPlayer[]>([])
  const selectedPlayerId = ref<string | null>(null)
  const blockTargetId = ref<string | null>(null)
  const overlay = ref<OverlayMode>('none')
  const placementTemplate = ref<PlayerTemplate | null>(null)
  const mode = ref<InteractionMode>('default')
  const hoverSquare = ref<PitchCoordinates | null>(null)
  const pinnedPassTarget = ref<PitchCoordinates | null>(null)
  const showScatter = ref(false)

  const selectedPlayer = computed(() =>
    selectedPlayerId.value ? getPlayerById(selectedPlayerId.value) : undefined
  )
  const blockTarget = computed(() =>
    blockTargetId.value ? getPlayerById(blockTargetId.value) : undefined
  )

  const blockAnalysis = computed<
    { assessment: BlockAssessment; summary: BlockOutcomeSummary } | undefined
  >(() => {
    const attacker = selectedPlayer.value
    const defender = blockTarget.value
    if (!attacker || !defender) return undefined
    if (attacker.team === defender.team || !isAdjacent(attacker, defender)) return undefined
    const assessment = assessBlock(players.value, attacker, defender)
    const summary = summarizeBlock(assessment.diceCount, assessment.chooser, attacker, defender)
    return { assessment, summary }
  })

  const zones = computed(() => controlMaps(players.value))

  /** Square the pass/throw arc points at: the pinned target, else live hover. */
  const passTargetSquare = computed<PitchCoordinates | null>(() => {
    if (mode.value === 'default') return null
    return pinnedPassTarget.value ?? hoverSquare.value
  })

  const passAnalysis = computed<PassAssessment | undefined>(() => {
    if (mode.value !== 'pass') return undefined
    const thrower = selectedPlayer.value
    const target = passTargetSquare.value
    if (!thrower || !target || samePosition(thrower, target)) return undefined
    return assessPass(players.value, thrower, target)
  })

  const throwTeammateAnalysis = computed<ThrowTeammateAssessment | undefined>(() => {
    if (mode.value !== 'throwTeammate') return undefined
    const thrower = selectedPlayer.value
    const target = passTargetSquare.value
    if (!thrower || !target || samePosition(thrower, target)) return undefined
    return assessThrowTeammate(players.value, thrower, target)
  })

  /** Where the ball / thrown player can end up, when scatter highlighting is on. */
  const scatterMap = computed<BallLandingMap | undefined>(() => {
    if (!showScatter.value) return undefined
    const thrower = selectedPlayer.value
    const target = passTargetSquare.value
    if (!thrower || !target) return undefined
    if (passAnalysis.value?.canAttempt) {
      return ballLandingMap(thrower, target, passAnalysis.value)
    }
    if (throwTeammateAnalysis.value?.canAttempt) {
      return throwTeammateAnalysis.value.landing.map
    }
    return undefined
  })

  function getPlayerAtLocation(position: PitchCoordinates): FieldedPlayer | undefined {
    return players.value.find((p) => samePosition(p, position))
  }

  function getPlayerById(id: string): FieldedPlayer | undefined {
    return players.value.find((p) => p.id === id)
  }

  function getPlayersByTeam(team: Team): FieldedPlayer[] {
    return players.value.filter((p) => p.team === team)
  }

  function nextNumber(team: Team): number {
    return getPlayersByTeam(team).reduce((max, p) => Math.max(max, p.number ?? 0), 0) + 1
  }

  function addPlayer(template: PlayerTemplate, position: PitchCoordinates): FieldedPlayer | null {
    if (getPlayerAtLocation(position)) return null
    const player: FieldedPlayer = {
      ...template,
      skills: [...template.skills],
      id: uuid(),
      number: nextNumber(template.team),
      ...position
    }
    players.value.push(player)
    return player
  }

  function removePlayer(id: string) {
    const index = players.value.findIndex((p) => p.id === id)
    if (index !== -1) players.value.splice(index, 1)
    if (selectedPlayerId.value === id) selectPlayer(null)
    if (blockTargetId.value === id) blockTargetId.value = null
  }

  function updatePlayer(id: string, changes: Partial<Omit<Player, 'id'>>) {
    const player = getPlayerById(id)
    if (!player) return
    Object.assign(player, changes)
  }

  function movePlayer(id: string, destination: PitchCoordinates) {
    const player = getPlayerById(id)
    if (!player) return
    if (getPlayerAtLocation(destination)) return
    player.row = destination.row
    player.column = destination.column
  }

  function clearPitch() {
    players.value = []
    selectedPlayerId.value = null
    blockTargetId.value = null
    setMode('default')
  }

  function startPlacing(template: PlayerTemplate) {
    setMode('default')
    placementTemplate.value = template
    selectedPlayerId.value = null
    blockTargetId.value = null
  }

  function stopPlacing() {
    placementTemplate.value = null
  }

  function selectPlayer(id: string | null) {
    selectedPlayerId.value = id
    blockTargetId.value = null
    if (id === null) setMode('default')
  }

  function setMode(newMode: InteractionMode) {
    if (newMode !== 'default' && !selectedPlayer.value) return
    mode.value = newMode
    pinnedPassTarget.value = null
    if (newMode !== 'default') {
      blockTargetId.value = null
      placementTemplate.value = null
    }
  }

  function toggleMode(newMode: Exclude<InteractionMode, 'default'>) {
    setMode(mode.value === newMode ? 'default' : newMode)
  }

  function setHoverSquare(position: PitchCoordinates | null) {
    hoverSquare.value = position
  }

  /** Handle a click on a pitch square, routing between place / select / target / move. */
  function squareClicked(position: PitchCoordinates) {
    const occupant = getPlayerAtLocation(position)

    if (mode.value !== 'default') {
      // In pass / throw mode a click pins (or unpins) the target square.
      pinnedPassTarget.value =
        pinnedPassTarget.value && samePosition(pinnedPassTarget.value, position) ? null : position
      return
    }

    if (placementTemplate.value) {
      if (!occupant) {
        addPlayer(placementTemplate.value, position)
      } else {
        // Clicking an existing player while placing switches to editing them.
        stopPlacing()
        selectPlayer(occupant.id)
      }
      return
    }

    const selected = selectedPlayer.value
    if (occupant) {
      if (selected && occupant.id === selected.id) {
        selectPlayer(null)
      } else if (selected && occupant.team !== selected.team && isAdjacent(selected, occupant)) {
        blockTargetId.value = blockTargetId.value === occupant.id ? null : occupant.id
      } else {
        selectPlayer(occupant.id)
      }
      return
    }

    if (selected) {
      movePlayer(selected.id, position)
      blockTargetId.value = null
    }
  }

  return {
    players,
    selectedPlayerId,
    blockTargetId,
    overlay,
    placementTemplate,
    mode,
    hoverSquare,
    pinnedPassTarget,
    showScatter,
    selectedPlayer,
    blockTarget,
    blockAnalysis,
    zones,
    passTargetSquare,
    passAnalysis,
    throwTeammateAnalysis,
    scatterMap,
    setMode,
    toggleMode,
    setHoverSquare,
    getPlayerAtLocation,
    getPlayerById,
    getPlayersByTeam,
    addPlayer,
    removePlayer,
    updatePlayer,
    movePlayer,
    clearPitch,
    startPlacing,
    stopPlacing,
    selectPlayer,
    squareClicked
  }
})
