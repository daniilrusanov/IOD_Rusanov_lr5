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
 * Для 7-ї лабораторної та варіанту 22 — рис. 4/система 2 (ФП=2).
 */
export function fpForOrderNumber(n: number, labNumber: number = 5): number {
  const k = Math.round(Math.abs(n))
  if (labNumber === 7 && k === 22) return 2
  return k >= 1 && k <= 10 ? 0 : 1
}
