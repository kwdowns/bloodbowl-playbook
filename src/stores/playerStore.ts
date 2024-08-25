import { type FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { type PitchCoordinates } from '@/lib/models/PitchCoordinates'
import { type Team } from '@/lib/models/Team'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const usePlayerStore = defineStore('players', () => {
  const players = ref<FieldedPlayer[]>([])
  const addPlayer = (player: FieldedPlayer) => {
    players.value.push(player)
  }
  const removePlayer = (id: string) => {
    const index = players.value.findIndex((p) => p.id === id)
    if (index !== -1) {
      players.value.splice(index, 1)
    }
  }
  const movePlayer = ({
    playerId,
    row,
    column
  }: {
    playerId: string
    row: number
    column: number
  }) => {
    const selectedPlayer = players.value.find((p) => p.id === playerId)
    if (!selectedPlayer) return
    if (players.value.some((p) => p.row === row && p.column === column)) return
    selectedPlayer.row = row
    selectedPlayer.column = column
  }
  const getPlayerAtLocation = ({ row, column }: PitchCoordinates): FieldedPlayer | undefined => {
    return players.value.find((p) => p.row === row && p.column === column)
  }
  const getPlayerById = (id: string): FieldedPlayer | undefined => {
    return players.value.find((p) => p.id === id)
  }
  const getPlayersByTeam = (team: Team): FieldedPlayer[] => {
    return players.value.filter((p) => p.team === team)
  }
  const getAdjacentPlayers = (player: FieldedPlayer): FieldedPlayer[] => {
    const adjacentPlayers: FieldedPlayer[] = []
    const { row, column } = player
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (i === 0 && j === 0) continue
        const adjacentPlayer = getPlayerAtLocation({ row: row + i, column: column + j })
        if (adjacentPlayer) {
          adjacentPlayers.push(adjacentPlayer)
        }
      }
    }
    return adjacentPlayers
  }
  return {
    players,
    addPlayer,
    removePlayer,
    movePlayer,
    getPlayerAtLocation,
    getPlayerById,
    getPlayersByTeam,
    getAdjacentPlayers
  }
})
