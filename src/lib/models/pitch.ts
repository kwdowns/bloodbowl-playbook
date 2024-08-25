import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
import type { Player } from '@/lib/models/Player'

export class Pitch {
  constructor() {}

  players: Array<FieldedPlayer> = []

  public addPlayer({ row, column, player }: { player: Player; row: number; column: number }): void {
    if (
      this.players.some(
        (fieldedPlayer) => fieldedPlayer.row === row && fieldedPlayer.column === column
      )
    ) {
      throw new Error('There is already a player in that position')
    }

    const fieldedPlayer: FieldedPlayer = {
      ...player,
      row,
      column
    }

    this.playerAdded(fieldedPlayer)
  }

  public removePlayer({ row, column }: PitchCoordinates): void {
    this.players = this.players.filter(
      (fieldedPlayer) => fieldedPlayer.row !== row && fieldedPlayer.column !== column
    )
  }

  private playerAdded(fieldedPlayer: FieldedPlayer): void {
    console.log(`Player added to row ${fieldedPlayer.row} column ${fieldedPlayer.column}`)
    this.players.push(fieldedPlayer)
  }

  public getAdjacentPlayers({ row, column }: PitchCoordinates): FieldedPlayer[] {
    return this.players
      .filter(
        (fieldedPlayer) =>
          Math.abs(fieldedPlayer.row - row) <= 1 && Math.abs(fieldedPlayer.column - column) <= 1
      )
      .filter((fieldedPlayer) => fieldedPlayer.row !== row || fieldedPlayer.column !== column)
  }

  public getAdjacentOpponents({ row, column }: PitchCoordinates): FieldedPlayer[] {
    const player = this.players.find((p) => p.row === row && p.column === column)
    if (!player) {
      throw new Error('Player not found')
    }

    return this.getAdjacentPlayers(player).filter(
      (fieldedPlayer) => fieldedPlayer.team !== player.team
    )
  }

  public getBlockSums(
    source: PitchCoordinates,
    target: PitchCoordinates
  ): {
    sourceAssists: number
    targetAssists: number
    netAssists: number
    effectiveSourceValue: number
    effectiveTargetValue: number
  } {
    const sourcePlayer = this.players.find(
      (player) => player.row === source.row && player.column === source.column
    )
    const targetPlayer = this.players.find(
      (player) => player.row === target.row && player.column === target.column
    )

    if (!sourcePlayer || !targetPlayer) {
      throw new Error('Players not found')
    }

    if (sourcePlayer.team === targetPlayer.team) {
      throw new Error('Players are on the same team')
    }

    // For each additional ally adjacent to the target of a block, the player gains +1 strength as long as the ally is not being marked by an opponent besides the opponent being targeted by the block.
    const sourceAssists: number = this.getAdjacentOpponents(source)
      .filter((x) => x !== target)
      .map((x) => this.getAdjacentOpponents(x).filter((y) => y !== source))
      .reduce((acc, elem) => (acc + elem.length > 0 ? 1 : 0), 0)

    const targetAssists: number = this.getAdjacentOpponents(target)
      .filter((x) => x !== source)
      .map((x) => this.getAdjacentOpponents(x).filter((y) => y !== target))
      .reduce((acc, elem) => (acc + elem.length > 0 ? 1 : 0), 0)

    return {
      sourceAssists,
      targetAssists,
      netAssists: sourceAssists - targetAssists,
      effectiveSourceValue: sourcePlayer.strength + sourceAssists,
      effectiveTargetValue: targetPlayer.strength + targetAssists
    }
  }
}
