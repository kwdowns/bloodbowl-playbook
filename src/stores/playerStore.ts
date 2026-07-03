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
import { controlMaps } from '@/lib/rules/tackleZones'

export type OverlayMode = 'none' | 'offense' | 'defense' | 'net' | 'dodge'

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
    if (selectedPlayerId.value === id) selectedPlayerId.value = null
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
  }

  function startPlacing(template: PlayerTemplate) {
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
  }

  /** Handle a click on a pitch square, routing between place / select / target / move. */
  function squareClicked(position: PitchCoordinates) {
    const occupant = getPlayerAtLocation(position)

    if (placementTemplate.value) {
      if (!occupant) addPlayer(placementTemplate.value, position)
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
    selectedPlayer,
    blockTarget,
    blockAnalysis,
    zones,
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
