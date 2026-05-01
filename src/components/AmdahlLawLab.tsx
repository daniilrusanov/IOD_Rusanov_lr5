import { useState, useMemo } from 'react'

export function AmdahlLawLab() {
  // Початкові дані за прикладом (варіант 7)
  const [variant, setVariant] = useState(22)
  const [parallelFraction, setParallelFraction] = useState(0.45) // 1 - beta
  const [lProcessors, setLProcessors] = useState(20) // l однакових універсальних процесорів
  const [a1, setA1] = useState(15) // від a1 %
  const [a2, setA2] = useState(20) // до a2 %

  const results = useMemo(() => {
    const beta = 1 - parallelFraction
    const s_l = lProcessors / (lProcessors * beta + (1 - beta))
    const s_max = 1 / beta

    const lowerBoundPercent = a1 / 100
    const upperBoundPercent = a2 / 100

    const lowerTarget = lowerBoundPercent * s_max
    const upperTarget = upperBoundPercent * s_max

    // l / (l * beta + (1 - beta)) >= lowerTarget
    // l >= lowerTarget * (l * beta + (1 - beta))
    // l >= lowerTarget * l * beta + lowerTarget * (1 - beta)
    // l * (1 - lowerTarget * beta) >= lowerTarget * (1 - beta)
    // l >= (lowerTarget * (1 - beta)) / (1 - lowerTarget * beta)

    const l_min = (lowerTarget * (1 - beta)) / (1 - lowerTarget * beta)
    const l_max = (upperTarget * (1 - beta)) / (1 - upperTarget * beta)

    // Find integers in range [l_min, l_max]
    const integersInRange: number[] = []
    for (let i = Math.ceil(l_min); i <= Math.floor(l_max); i++) {
      integersInRange.push(i)
    }

    return {
      beta,
      s_l,
      s_max,
      lowerTarget,
      upperTarget,
      l_min,
      l_max,
      integersInRange
    }
  }, [parallelFraction, lProcessors, a1, a2])

  return (
    <div className="amdahl-lab">
      <header className="header">
        <h1>Лабораторна робота №8</h1>
      </header>

      <section className="panel">
        <h2>Початкові дані</h2>
        <table className="data-table no-border">
          <tbody>
            <tr>
              <td>Варіант №</td>
              <td style={{ textAlign: 'right' }}>
                <input
                  type="number"
                  value={variant}
                  onChange={(e) => setVariant(Number(e.target.value))}
                  className="inline-input"
                />
              </td>
            </tr>
            <tr>
              <td>Частка паралельних обчислень (1 - β)</td>
              <td style={{ textAlign: 'right' }}>
                <input
                  type="number"
                  step="0.1"
                  value={parallelFraction}
                  onChange={(e) => setParallelFraction(Number(e.target.value))}
                  className="inline-input"
                />
              </td>
            </tr>
            <tr>
              <td>Максимальне можливе прискорення у випадку використання однакових універсальних процесорів</td>
              <td style={{ textAlign: 'right' }}>
                <input
                  type="number"
                  value={lProcessors}
                  onChange={(e) => setLProcessors(Number(e.target.value))}
                  className="inline-input"
                />
              </td>
            </tr>
            <tr>
              <td>Необхідно забезпечити від a₁ до a₂ від максимально можливого прискорення</td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <input
                  type="number"
                  value={a1}
                  onChange={(e) => setA1(Number(e.target.value))}
                  className="inline-input short"
                /> % -
                <input
                  type="number"
                  value={a2}
                  onChange={(e) => setA2(Number(e.target.value))}
                  className="inline-input short"
                /> %
              </td>
            </tr>
          </tbody>
        </table>
        <div style={{ marginTop: '1rem' }}>
           <button className="btn" onClick={() => {
             setParallelFraction(0.45)
             setLProcessors(20)
             setA1(15)
             setA2(20)
           }}>Повернути значення за замовчуванням</button>
           <button className="btn primary" style={{ marginLeft: '0.5rem' }}>Обчислити</button>
        </div>
      </section>

      <section className="panel solution-panel">
        <h2>Розв'язок.</h2>
        <p>Визначимо частку послідовних обчислень:</p>
        <div className="formula-block">
          β = 1 - {parallelFraction} = {results.beta.toFixed(2)}
        </div>

        <h3>Максимальне можливе прискорення</h3>
        <p>1. Скористаємося 2-м законом Амдала:</p>
        <div className="formula-block">
          S<sub>{lProcessors}</sub> = {lProcessors} / ({lProcessors} · {results.beta.toFixed(2)} + (1 - {results.beta.toFixed(2)})) = {results.s_l.toFixed(3)}
        </div>

        <h3>Кількість процесорів</h3>
        <p>2. Використаємо 3-й закон Амдала:</p>
        <div className="formula-block">
          {a2/100} · S<sub>max</sub> ≥ S<sub>l</sub> ≥ {a1/100} · S<sub>max</sub>,<br />
          S<sub>max</sub> = 1 / β = 1 / {results.beta.toFixed(2)} = {results.s_max.toFixed(3)}<br />
          {a2/100} · {results.s_max.toFixed(3)} ≥ l / (l · {results.beta.toFixed(2)} + {parallelFraction}) ≥ {a1/100} · {results.s_max.toFixed(3)},<br />
          {results.upperTarget.toFixed(3)} ≥ l / (l · {results.beta.toFixed(2)} + {parallelFraction}) ≥ {results.lowerTarget.toFixed(3)},<br />
          нижняМежа : l ≥ {results.lowerTarget.toFixed(2)} · (l · {results.beta.toFixed(2)} + {parallelFraction}),<br />
          верхняМежа : l ≤ {results.upperTarget.toFixed(2)} · (l · {results.beta.toFixed(2)} + {parallelFraction}),<br />
          нижняМежа : l ≥ {results.l_min.toFixed(4)}<br />
          верхняМежа : l ≤ {results.l_max.toFixed(4)}<br />
          l ∈ [{results.l_min.toFixed(4)}, {results.l_max.toFixed(4)}]
        </div>

        <p><strong>Відповідь:</strong> {results.integersInRange.length > 0
          ? `цілі числа в цьому проміжку: ${results.integersInRange.join(', ')}`
          : 'немає жодного цілого числа в цьому проміжку'}
        </p>
      </section>

      <style>{`
        .amdahl-lab .inline-input {
          width: 60px;
          text-align: center;
          padding: 2px;
          margin: 0 4px;
        }
        .amdahl-lab .inline-input.short {
          width: 40px;
        }
        .amdahl-lab .no-border td {
          border: none !important;
          padding: 8px 0;
        }
        .amdahl-lab .formula-block {
          text-align: center;
          font-family: serif;
          font-size: 1.2rem;
          margin: 1.5rem 0;
          background: #f9f9f9;
          padding: 1rem;
          border-radius: 8px;
        }
        .amdahl-lab .solution-panel h3 {
          margin-top: 2rem;
        }
      `}</style>
    </div>
  )
}
