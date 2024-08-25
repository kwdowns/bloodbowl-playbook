import type { Pitch } from '@/lib/models/Pitch'
import type { PitchCoordinates } from '@/lib/models/PitchCoordinates'

export interface Analyzer<T> {
  enabled: boolean
  analyzePitch: (pitch: Pitch) => AnalyzedPitch<T>
}

export type AnalyzedPitch<T> = Map<PitchCoordinates, T>
