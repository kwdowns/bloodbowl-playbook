export function formatPercent(probability: number): string {
  const percent = probability * 100
  return `${percent.toFixed(percent >= 9.95 || percent === 0 ? 0 : 1)}%`
}
