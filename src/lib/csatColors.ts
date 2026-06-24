export type CsatScore = 0 | 1 | 2 | 3 | 4 | 5

export const CSAT_SCORES: CsatScore[] = [0, 1, 2, 3, 4, 5]

export const CSAT_COLORS: Record<CsatScore, string> = {
  0: '#dc3545',
  1: '#e85d30',
  2: '#ff774a',
  3: '#f0b429',
  4: '#5cb894',
  5: '#21a484',
}

export function getCsatColor(score: CsatScore): string {
  return CSAT_COLORS[score]
}

export function isCsatScore(value: number): value is CsatScore {
  return Number.isInteger(value) && value >= 0 && value <= 5
}
