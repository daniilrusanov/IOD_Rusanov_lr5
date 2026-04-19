import { DEVICE_COUNT } from './table1'

/** Ребро направленого графа всередині підсистеми (індекси пристроїв). */
export type SubsystemEdge = { readonly from: number; readonly to: number }

/** Координати вузла в прямокутнику підсистеми: (0,0) — лівий верх, (1,1) — правий низ. */
export type FixedNodeLayout = { readonly deviceIndex: number; readonly fx: number; readonly fy: number }

/** Опис підсистеми: індекси пристроїв у графі (0…DEVICE_COUNT-1), відповідають рядкам π₀…π₁₄. */
export type SubsystemDef = {
  id: number
  label: string
  deviceIndices: readonly number[]
  /**
   * Якщо задано — топологія з рисунка методички; інакше зображення як послідовний ланцюг
   * у порядку deviceIndices.
   */
  edges?: readonly SubsystemEdge[]
  /**
   * Фіксоване розміщення для рис. 3 (і подібних), коли автоматичний розклад по рівнях не
   * відтворює геометрію (наприклад 6 і 7 в один ряд під 9).
   */
  fixedLayout?: readonly FixedNodeLayout[]
}

export type GraphPreset = {
  id: number
  name: string
  /** Короткий опис відповідності до рис. 2 / рис. 3 у методичці */
  description: string
  subsystems: readonly SubsystemDef[]
}

function assertPartition(subsystems: readonly SubsystemDef[]): void {
  const seen = new Set<number>()
  for (const s of subsystems) {
    for (const i of s.deviceIndices) {
      if (i < 0 || i >= DEVICE_COUNT) {
        throw new Error(`Індекс пристрою поза діапазоном: ${i}`)
      }
      if (seen.has(i)) {
        throw new Error(`Пристрій ${i} повторюється в підсистемах`)
      }
      seen.add(i)
    }
  }
  if (seen.size !== DEVICE_COUNT) {
    throw new Error('Підсистеми мають покривати всі пристрої рівно один раз')
  }
}

/** Рисунок 2 (ФП=0): три паралельні ланцюги по 5 пристроїв (π₀…π₄, π₅…π₉, π₁₀…π₁₄). */
const FP0: GraphPreset = {
  id: 0,
  name: 'Граф ФП = 0 (рис. 2)',
  description:
    'Три незалежні підсистеми: пристрої 0–4, 5–9 та 10–14; у кожній — послідовне з’єднання.',
  subsystems: [
    { id: 1, label: 'Підсистема 1', deviceIndices: [0, 1, 2, 3, 4] },
    { id: 2, label: 'Підсистема 2', deviceIndices: [5, 6, 7, 8, 9] },
    { id: 3, label: 'Підсистема 3', deviceIndices: [10, 11, 12, 13, 14] },
  ],
}

/**
 * Рисунок 3 (ФП=1): три незалежні підсистеми — як у методичці (ромб 0–5; «трикутник» 6–9; гілки 10–14).
 */
const FP1: GraphPreset = {
  id: 1,
  name: 'Граф ФП = 1 (рис. 3)',
  description:
    'Рис. 3: підсистема 1 — 2→1→0|3→4→5; підсистема 2 — лише 6–9: 9→6, 9→7, 6→7, 7→8; підсистема 3 — 10–14: 13→14|12|11, 14→10, 11→12.',
  subsystems: [
    {
      id: 1,
      label: 'Підсистема 1',
      deviceIndices: [0, 1, 2, 3, 4, 5],
      edges: [
        { from: 2, to: 1 },
        { from: 1, to: 0 },
        { from: 1, to: 3 },
        { from: 0, to: 4 },
        { from: 3, to: 4 },
        { from: 4, to: 5 },
      ],
    },
    {
      id: 2,
      label: 'Підсистема 2',
      deviceIndices: [6, 7, 8, 9],
      edges: [
        { from: 9, to: 6 },
        { from: 9, to: 7 },
        { from: 6, to: 7 },
        { from: 7, to: 8 },
      ],
      fixedLayout: [
        { deviceIndex: 9, fx: 0.5, fy: 0.06 },
        { deviceIndex: 6, fx: 0.18, fy: 0.4 },
        { deviceIndex: 7, fx: 0.82, fy: 0.4 },
        { deviceIndex: 8, fx: 0.58, fy: 0.86 },
      ],
    },
    {
      id: 3,
      label: 'Підсистема 3',
      deviceIndices: [10, 11, 12, 13, 14],
      edges: [
        { from: 13, to: 14 },
        { from: 13, to: 12 },
        { from: 13, to: 11 },
        { from: 14, to: 10 },
        { from: 11, to: 12 },
      ],
      fixedLayout: [
        { deviceIndex: 13, fx: 0.5, fy: 0.06 },
        { deviceIndex: 14, fx: 0.14, fy: 0.36 },
        { deviceIndex: 11, fx: 0.86, fy: 0.36 },
        { deviceIndex: 12, fx: 0.5, fy: 0.58 },
        { deviceIndex: 10, fx: 0.14, fy: 0.88 },
      ],
    },
  ],
}

assertPartition(FP0.subsystems)
assertPartition(FP1.subsystems)

export const GRAPH_PRESETS: readonly GraphPreset[] = [FP0, FP1]

export function getGraphPreset(fp: number): GraphPreset {
  return fp === 1 ? FP1 : FP0
}
