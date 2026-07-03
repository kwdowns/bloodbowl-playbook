import { v4 as uuid } from 'uuid'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import { isOnPitch, samePosition } from '@/lib/models/PitchCoordinates'
import { SKILL_NAMES } from '@/lib/models/Skill'
import type { Team } from '@/lib/models/Team'

/**
 * Compact, URL-safe pitch state: players joined by `;`, each player as
 * `{O|D}{number}-row-column-MA-ST-AG-PA-AV-skillMask[-name]`.
 * The skill mask is a base-36 bitmask over SKILL_NAMES; the optional name is
 * URI-encoded and always the tail, so it may itself contain dashes.
 */

const TEAM_BY_CODE: Record<string, Team> = { O: 'Offense', D: 'Defense' }
const TEAM_CODES: Record<Team, string> = { Offense: 'O', Defense: 'D' }

export function encodePitchState(players: FieldedPlayer[]): string {
  return players.map(encodePlayer).join(';')
}

function encodePlayer(p: FieldedPlayer): string {
  const skillMask = p.skills.reduce((mask, skill) => mask | (1 << SKILL_NAMES.indexOf(skill)), 0)
  const fields = [
    `${TEAM_CODES[p.team]}${p.number ?? 0}`,
    p.row,
    p.column,
    p.movement,
    p.strength,
    p.agility,
    p.passing,
    p.armor,
    skillMask.toString(36)
  ].map(String)
  if (p.name) fields.push(encodeURIComponent(p.name))
  return fields.join('-')
}

/** Parse an encoded pitch string; malformed or colliding players are dropped. */
export function decodePitchState(encoded: string): FieldedPlayer[] {
  const players: FieldedPlayer[] = []
  for (const token of encoded.split(';')) {
    const player = decodePlayer(token)
    if (player && isOnPitch(player) && !players.some((p) => samePosition(p, player))) {
      players.push(player)
    }
  }
  return players
}

function decodePlayer(token: string): FieldedPlayer | null {
  const fields = token.split('-')
  if (fields.length < 9) return null

  const team = TEAM_BY_CODE[fields[0].charAt(0)]
  if (!team) return null
  const number = parseInt(fields[0].slice(1), 10)

  const [row, column, movement, strength, agility, passing, armor] = fields
    .slice(1, 8)
    .map((value) => parseInt(value, 10))
  const skillMask = parseInt(fields[8], 36)
  if ([number, row, column, movement, strength, agility, passing, armor, skillMask].some(Number.isNaN)) {
    return null
  }

  let name: string | undefined
  if (fields.length > 9) {
    try {
      name = decodeURIComponent(fields.slice(9).join('-')) || undefined
    } catch {
      return null
    }
  }

  return {
    id: uuid(),
    team,
    number: number || undefined,
    name,
    row,
    column,
    movement,
    strength,
    agility,
    passing,
    armor,
    skills: SKILL_NAMES.filter((_, index) => skillMask & (1 << index))
  }
}
