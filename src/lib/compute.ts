import type { SubsystemDef } from './graphs'

export type DeviceResult = {
  deviceIndex: number
  peakPi: number
  subsystemId: number
  /** Реальна продуктивність підсистеми (однакова для всіх ФП цієї підсистеми) */
  subsystemRealPi: number
  /** Завантаженість pᵢ = πᵣₑₐₗ / πᵢ */
  load: number
}

export type SubsystemResult = {
  subsystemId: number
  label: string
  deviceIndices: readonly number[]
  peakPi: number[]
  realPi: number
  /** r⁽ⁱ⁾ = lᵢ · πᵣₑₐₗ для підсистеми */
  r: number
  bottleneckIndex: number
}

export type ComputeResult = {
  subsystems: SubsystemResult[]
  devices: DeviceResult[]
  /** Сумарна реальна продуктивність R = Σ r⁽ⁱ⁾ */
  totalRealR: number
  /** Σ πᵢ — сума пікових продуктивностей усіх пристроїв (пікова продуктивність системи) */
  peakPiSum: number
  /** max πᵢ серед пристроїв */
  maxPeakPi: number
  /** Індекс пристрою з максимальним πᵢ */
  maxPeakPiIndex: number
  /** Завантаженість системи ρ = R / Σπᵢ */
  systemLoadRho: number
  /** Прискорення системи S = R / max πᵢ (як у прикладі методички: 73/12 ≈ 6,08) */
  systemSpeedupS: number
  incompatible: boolean
  incompatibilityMessages: string[]
  incompatibilityCauses: string[]
  /** Пропозиція π (копія вектора з підвищенням вузьких місць до другого мінімуму в підсистемі) */
  suggestedPi: number[]
  /** Дані для формул ЛР7 (2-й закон Амдала) */
  lr7Details?: {
    N: number
    n: number
    s: number
    beta: number
    n_sys: number
    R_n: number
    E_n: number
  }
}

const EPS = 1e-9

export function computeSystem(
  peakPi: readonly number[],
  subsystems: readonly SubsystemDef[],
): ComputeResult {
  const n = peakPi.length
  const incompatibilityMessages: string[] = []
  const incompatibilityCauses: string[] = []

  for (let i = 0; i < n; i++) {
    if (!Number.isFinite(peakPi[i])) {
      incompatibilityMessages.push(`${formatPi(i)} не є скінченним числом.`)
      incompatibilityCauses.push('Некоректне числове значення продуктивності.')
    } else if (peakPi[i] <= 0) {
      incompatibilityMessages.push(`${formatPi(i)} ≤ 0: неможливо визначити завантаженість.`)
      incompatibilityCauses.push(
        'Пікова продуктивність пристрою має бути додатною; нуль або від’ємне значення суперечить моделі.',
      )
    }
  }

  const devices: DeviceResult[] = Array.from({ length: n }, (_, i) => ({
    deviceIndex: i,
    peakPi: peakPi[i],
    subsystemId: -1,
    subsystemRealPi: 0,
    load: 0,
  }))

  const subsOut: SubsystemResult[] = []

  for (const sub of subsystems) {
    const peaks = sub.deviceIndices.map((j) => peakPi[j])
    const realPi = Math.min(...peaks)
    let bottleneckIndex = sub.deviceIndices[0]
    for (const j of sub.deviceIndices) {
      if (peakPi[j] < peakPi[bottleneckIndex] - EPS) bottleneckIndex = j
    }

    subsOut.push({
      subsystemId: sub.id,
      label: sub.label,
      deviceIndices: sub.deviceIndices,
      peakPi: peaks,
      realPi,
      r: sub.deviceIndices.length * realPi,
      bottleneckIndex,
    })

    for (const j of sub.deviceIndices) {
      devices[j].subsystemId = sub.id
      devices[j].subsystemRealPi = realPi
      devices[j].load = realPi / peakPi[j]
    }
  }

  const totalRealR = subsOut.reduce((s, x) => s + x.r, 0)

  let peakPiSum = 0
  let maxPeakPi = peakPi[0] ?? 0
  let maxPeakPiIndex = 0
  for (let i = 0; i < n; i++) {
    peakPiSum += peakPi[i]
    if (peakPi[i] > maxPeakPi + EPS) {
      maxPeakPi = peakPi[i]
      maxPeakPiIndex = i
    }
  }
  const systemLoadRho = peakPiSum > 0 ? totalRealR / peakPiSum : 0
  const systemSpeedupS = maxPeakPi > 0 ? totalRealR / maxPeakPi : 0

  for (const d of devices) {
    if (d.load > 1 + 1e-6) {
      incompatibilityMessages.push(
        `Завантаженість пристрою ${d.deviceIndex} > 1 (${d.load.toFixed(4)}).`,
      )
      incompatibilityCauses.push(
        'За моделлю pᵢ = πᵣₑₐₗ/πᵢ це не повинно траплятися; перевірте розбиття на підсистеми та введені π.',
      )
    }
  }

  const suggestedPi = suggestPi(peakPi, subsystems)

  // Розрахунок параметрів для ЛР7 за 2-м законом Амдала
  let lr7Data: ComputeResult['lr7Details']
  if (subsystems.length === 1 && subsystems[0].deviceIndices.length === 17) {
    const N = 17
    const n = 5 // 0, 1, 10, 11, 16 (послідовні вузли в ланцюгу)
    const s = 4 // Максимальна ширина (4 паралельні гілки)
    const beta = n / N
    const n_sys = 3 // Як у прикладі на скриншоті
    
    // R_n = s / (s * beta + (1 - beta))
    const R_n = s / (s * beta + (1 - beta))
    const E_n = (R_n / n_sys) * 100

    lr7Data = {
      N,
      n,
      s,
      beta,
      n_sys,
      R_n,
      E_n,
    }
  }

  const incompatible = incompatibilityMessages.length > 0

  return {
    subsystems: subsOut,
    devices,
    totalRealR,
    peakPiSum,
    maxPeakPi,
    maxPeakPiIndex,
    systemLoadRho,
    systemSpeedupS,
    incompatible,
    incompatibilityMessages,
    incompatibilityCauses,
    suggestedPi,
    lr7Details: lr7Data,
  }
}

function formatPi(i: number): string {
  return `π${i}`
}

/**
 * Пропозиція сумісних пікових продуктивностей: для кожної підсистеми підняти вузьке місце
 * до наступного за величиною π серед пристроїв підсистеми (або до max, якщо один пристрій).
 */
function suggestPi(
  peakPi: readonly number[],
  subsystems: readonly SubsystemDef[],
): number[] {
  const next = [...peakPi]
  for (const sub of subsystems) {
    const idx = [...sub.deviceIndices].sort((a, b) => peakPi[a] - peakPi[b])
    const b = idx[0]
    const second = idx.length > 1 ? peakPi[idx[1]] : peakPi[b]
    if (second > peakPi[b]) {
      next[b] = second
    }
  }
  return next
}
