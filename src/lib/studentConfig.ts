/** Порядковий номер у списку групи (лабораторна). */
export const STUDENT_ORDER_NUMBER = 22

/**
 * Стовпець таблиці 1 (1…10): типово остання цифра номера; 10 → варіант 10.
 */
export function variantForOrderNumber(n: number): number {
  const r = Math.round(Math.abs(n)) % 10
  return r === 0 ? 10 : r
}

/**
 * Граф ФП: для перших 10 номерів — рис. 2 (ФП=0), далі — рис. 3 (ФП=1).
 */
export function fpForOrderNumber(n: number): number {
  const k = Math.round(Math.abs(n))
  return k >= 1 && k <= 10 ? 0 : 1
}
