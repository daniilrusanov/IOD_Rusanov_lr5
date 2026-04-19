/** Таблиця 1 з методички (лаб. 6): π₀…π₁₄ × варіанти №1…№10 (стовпці). */
export const TABLE1: readonly (readonly number[])[] = [
  [9, 8, 4, 5, 6, 9, 10, 4, 7, 12],
  [15, 5, 8, 15, 9, 12, 8, 8, 8, 8],
  [9, 9, 7, 12, 5, 7, 5, 6, 10, 6],
  [12, 12, 15, 7, 7, 6, 5, 8, 8, 9],
  [4, 10, 10, 4, 12, 15, 7, 7, 15, 5],
  [8, 8, 8, 8, 8, 4, 8, 6, 4, 9],
  [9, 9, 7, 12, 5, 7, 5, 6, 10, 6],
  [10, 7, 5, 10, 5, 8, 9, 9, 8, 12],
  [8, 8, 7, 8, 9, 10, 7, 12, 10, 15],
  [5, 7, 6, 8, 5, 6, 5, 7, 9, 7],
  [8, 5, 6, 4, 15, 9, 4, 6, 12, 15],
  [8, 8, 7, 8, 9, 10, 7, 12, 10, 15],
  [11, 12, 9, 9, 7, 8, 9, 5, 8, 4],
  [6, 6, 5, 9, 8, 8, 8, 5, 5, 8],
  [9, 9, 7, 12, 5, 7, 5, 6, 10, 6],
] as const

export const DEVICE_COUNT = TABLE1.length

export function columnForVariant(variant1to10: number): number {
  const v = Math.min(10, Math.max(1, Math.round(variant1to10)))
  return v - 1
}

export function peakVectorFromTable(variant1to10: number): number[] {
  const col = columnForVariant(variant1to10)
  return TABLE1.map((row) => row[col])
}
