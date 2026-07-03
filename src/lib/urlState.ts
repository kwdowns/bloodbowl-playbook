import { v4 as uuid } from 'uuid'
import type { FieldedPlayer } from '@/lib/models/FieldedPlayer'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'
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

/**
 * Compact, URL-safe view state: `_`-separated tokens, each a letter prefix
 * plus a value. Players are referenced by index into the encoded pitch order
 * (ids are regenerated on decode). Tokens: `s` selected index, `b` block
 * target index, `m` mode, `t` pinned pass target `row.column`, `x` scatter
 * on, `r` planned rushes, `w` move path as `row.column` pairs, `o` overlay.
 */

export type ViewMode = 'default' | 'pass' | 'throwTeammate' | 'move'
export type ViewOverlay = 'none' | 'offense' | 'defense' | 'net' | 'dodge'

export interface ViewState {
  selectedIndex: number | null
  blockTargetIndex: number | null
  mode: ViewMode
  overlay: ViewOverlay
  passTarget: PitchCoordinates | null
  showScatter: boolean
  plannedRushes: number | null
  movePath: PitchCoordinates[]
}

export const emptyViewState = (): ViewState => ({
  selectedIndex: null,
  blockTargetIndex: null,
  mode: 'default',
  overlay: 'none',
  passTarget: null,
  showScatter: false,
  plannedRushes: null,
  movePath: []
})

const MODE_CODES: Record<Exclude<ViewMode, 'default'>, string> = {
  pass: 'p',
  throwTeammate: 't',
  move: 'm'
}
const MODE_BY_CODE: Record<string, ViewMode> = { p: 'pass', t: 'throwTeammate', m: 'move' }

const OVERLAY_CODES: Record<Exclude<ViewOverlay, 'none'>, string> = {
  offense: 'o',
  defense: 'd',
  net: 'n',
  dodge: 'g'
}
const OVERLAY_BY_CODE: Record<string, ViewOverlay> = {
  o: 'offense',
  d: 'defense',
  n: 'net',
  g: 'dodge'
}

/** Encode the shareable view state; returns '' when there is nothing to share. */
export function encodeViewState(view: ViewState): string {
  const tokens: string[] = []
  if (view.selectedIndex !== null && view.selectedIndex >= 0) {
    tokens.push(`s${view.selectedIndex}`)
    if (view.mode === 'default') {
      if (view.blockTargetIndex !== null && view.blockTargetIndex >= 0) {
        tokens.push(`b${view.blockTargetIndex}`)
      }
    } else {
      tokens.push(`m${MODE_CODES[view.mode]}`)
    }
    if (view.mode === 'pass' || view.mode === 'throwTeammate') {
      if (view.passTarget) tokens.push(`t${coordinateToken(view.passTarget)}`)
      if (view.showScatter) tokens.push('x')
    }
    if (view.mode === 'move') {
      if (view.plannedRushes !== null) tokens.push(`r${view.plannedRushes}`)
      if (view.movePath.length) tokens.push(`w${view.movePath.map(coordinateToken).join('.')}`)
    }
  }
  if (view.overlay !== 'none') tokens.push(`o${OVERLAY_CODES[view.overlay]}`)
  return tokens.join('_')
}

const coordinateToken = ({ row, column }: PitchCoordinates) => `${row}.${column}`

/** Parse an encoded view string; malformed tokens are dropped individually. */
export function decodeViewState(encoded: string): ViewState {
  const view = emptyViewState()
  for (const token of encoded.split('_')) {
    const value = token.slice(1)
    switch (token.charAt(0)) {
      case 's':
        view.selectedIndex = parseIndex(value)
        break
      case 'b':
        view.blockTargetIndex = parseIndex(value)
        break
      case 'm':
        view.mode = MODE_BY_CODE[value] ?? view.mode
        break
      case 't': {
        const coordinates = parseCoordinates(value)
        if (coordinates?.length === 1) view.passTarget = coordinates[0]
        break
      }
      case 'x':
        if (!value) view.showScatter = true
        break
      case 'r': {
        const rushes = parseIndex(value)
        if (rushes !== null) view.plannedRushes = rushes
        break
      }
      case 'w': {
        const coordinates = parseCoordinates(value)
        if (coordinates?.length) view.movePath = coordinates
        break
      }
      case 'o':
        view.overlay = OVERLAY_BY_CODE[value] ?? view.overlay
        break
    }
  }
  return view
}

function parseIndex(value: string): number | null {
  return /^\d+$/.test(value) ? parseInt(value, 10) : null
}

function parseCoordinates(value: string): PitchCoordinates[] | null {
  const parts = value.split('.').map((part) => (/^\d+$/.test(part) ? parseInt(part, 10) : NaN))
  if (!parts.length || parts.length % 2 || parts.some(Number.isNaN)) return null
  const coordinates: PitchCoordinates[] = []
  for (let i = 0; i < parts.length; i += 2) {
    coordinates.push({ row: parts[i], column: parts[i + 1] })
  }
  return coordinates.every(isOnPitch) ? coordinates : null
}
