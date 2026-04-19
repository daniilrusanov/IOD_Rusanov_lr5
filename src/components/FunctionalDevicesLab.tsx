import { useMemo, useState } from 'react'
import { GraphVisualization } from './GraphVisualization'
import { computeSystem } from '../lib/compute'
import type { GraphPreset } from '../lib/graphs'
import { columnForVariant, peakVectorFromTable } from '../lib/table1'

type Props = {
  /** Номер лабораторної для заголовка та підказок */
  labNumber: 5 | 6
  studentOrderNumber: number
  fixedVariant: number
  fixedFp: number
  preset: GraphPreset
  /** Додаткові картки ρ, Σπ, S (повний зміст лаб. 6 за методичкою) */
  showSystemMetrics: boolean
}

function parsePiInputs(texts: string[]): number[] {
  return texts.map((t) => {
    const x = Number(String(t).replace(',', '.'))
    return Number.isFinite(x) ? x : NaN
  })
}

export function FunctionalDevicesLab({
  labNumber,
  studentOrderNumber,
  fixedVariant,
  fixedFp,
  preset,
  showSystemMetrics,
}: Props) {
  const [inputs, setInputs] = useState<string[]>(() =>
    peakVectorFromTable(fixedVariant).map((v) => String(v)),
  )

  const peakPi = useMemo(() => parsePiInputs(inputs), [inputs])

  const result = useMemo(() => {
    if (peakPi.some((x) => !Number.isFinite(x) || x <= 0)) {
      return null
    }
    return computeSystem(peakPi, preset.subsystems)
  }, [peakPi, preset.subsystems])

  const title =
    labNumber === 6
      ? 'Лабораторна 6 · Характеристики систем функціональних пристроїв (продовження)'
      : 'Лабораторна 5 · Системи функціональних пристроїв'

  return (
    <>
      <header className="header">
        <h1>{title}</h1>
        <p className="subtitle">
          Порядковий номер у списку групи: <strong>{studentOrderNumber}</strong> · граф ФП=
          {fixedFp} · варіант таблиці 1: <strong>{fixedVariant}</strong>. Завантаженість пристроїв,
          реальна продуктивність за першим законом Амдала, аналіз несумісності та візуалізація графа
          {labNumber === 6 ? '; завантаженість системи ρ та прискорення S.' : '.'}
        </p>
      </header>

      {labNumber === 6 && (
        <section className="panel theory">
          <h2>Мета та хід (лаб. 6)</h2>
          <p className="hint">
            Оцінювання характеристик системи обчислювальних пристроїв у різних режимах. Незалежні
            підсистеми: реальна продуктивність гілки визначається мінімумом π у підсистемі (перший
            закон Амдала). Для кожного пристрою{' '}
            <em>
              pᵢ = πᵣₑₐₗ / πᵢ
            </em>
            , де πᵣₑₐₗ однакова для всіх ФП підсистеми. Сумарна реальна продуктивність{' '}
            <em>R = Σ r⁽ⁱ⁾</em>, <em>r⁽ⁱ⁾ = lᵢ · min(π)</em> у підсистемі. Завантаженість системи{' '}
            <em>ρ = R / Σπᵢ</em>, прискорення <em>S = R / max πᵢ</em> (як у прикладі методички).
          </p>
        </section>
      )}

      <section className="panel">
        <h2>Вхідні дані (π з таблиці 1)</h2>
        <p className="hint">{preset.description}</p>

        <div className="pi-grid">
          {inputs.map((val, i) => (
            <label key={i} className="pi-cell">
              <span className="pi-name">π{i}</span>
              <input
                inputMode="decimal"
                value={val}
                onChange={(e) => {
                  const next = [...inputs]
                  next[i] = e.target.value
                  setInputs(next)
                }}
              />
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Граф системи функціональних пристроїв</h2>
        {result && <GraphVisualization preset={preset} devices={result.devices} />}
      </section>

      <section className="panel">
        <h2>Результати обчислення</h2>
        {!result && (
          <p className="warn">Введіть додатні числові значення для всіх π.</p>
        )}
        {result && (
          <>
            <div className="results-summary">
              <div className="card">
                <h3>Реальна продуктивність системи R</h3>
                <p className="big-number">{result.totalRealR.toFixed(4)}</p>
                <p className="small">
                  Сума r⁽ⁱ⁾ = Σ (lᵢ · πᵣₑₐₗ для підсистеми i), незалежні підсистеми.
                </p>
              </div>
              {showSystemMetrics && (
                <>
                  <div className="card">
                    <h3>Сума пікових продуктивностей Σπᵢ</h3>
                    <p className="big-number">{result.peakPiSum.toFixed(4)}</p>
                    <p className="small">Пікова продуктивність системи як сума піків пристроїв.</p>
                  </div>
                  <div className="card">
                    <h3>Завантаженість системи ρ</h3>
                    <p className="big-number">{result.systemLoadRho.toFixed(4)}</p>
                    <p className="small">
                      ρ = R / Σπᵢ (частка використання сумарного пікового ресурсу).
                    </p>
                  </div>
                  <div className="card">
                    <h3>Прискорення S</h3>
                    <p className="big-number">{result.systemSpeedupS.toFixed(4)}</p>
                    <p className="small">
                      S = R / max πᵢ (max на пристрої π{result.maxPeakPiIndex} ={' '}
                      {result.maxPeakPi.toFixed(4)}).
                    </p>
                  </div>
                </>
              )}
            </div>

            <h3>Підсистеми</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Підсистема</th>
                    <th>Пристрої</th>
                    <th>min(π)</th>
                    <th>lᵢ</th>
                    <th>r⁽ⁱ⁾</th>
                    <th>Вузьке місце</th>
                  </tr>
                </thead>
                <tbody>
                  {result.subsystems.map((s) => (
                    <tr key={s.subsystemId}>
                      <td>{s.label}</td>
                      <td>{s.deviceIndices.join(', ')}</td>
                      <td>{s.realPi.toFixed(4)}</td>
                      <td>{s.deviceIndices.length}</td>
                      <td>{s.r.toFixed(4)}</td>
                      <td>π{s.bottleneckIndex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Завантаженість усіх пристроїв pᵢ = πᵣₑₐₗ / πᵢ</h3>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Пристрій</th>
                    <th>πᵢ (пік)</th>
                    <th>πᵣₑₐₗ підсистеми</th>
                    <th>pᵢ</th>
                  </tr>
                </thead>
                <tbody>
                  {result.devices.map((d) => (
                    <tr key={d.deviceIndex}>
                      <td>π{d.deviceIndex}</td>
                      <td>{d.peakPi.toFixed(4)}</td>
                      <td>{d.subsystemRealPi.toFixed(4)}</td>
                      <td>{d.load.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Несумісність (за введеними π)</h3>
            {result.incompatible ? (
              <div className="callout bad">
                <p>
                  <strong>Виявлено несумісність.</strong>
                </p>
                <ul>
                  {result.incompatibilityMessages.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
                <p>
                  <strong>Можливі причини:</strong>
                </p>
                <ul>
                  {result.incompatibilityCauses.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="ok">
                <p>
                  За обраною моделлю (мінімум у підсистемі, додатні π) явних суперечностей у вхідних
                  даних не виявлено. Вузькі місця обмежують продуктивність гілки — це відповідає
                  першому закону Амдала.
                </p>
                <p className="small explain-gap">
                  <strong>Що зазвичай трактують як «несумісність» у звіті:</strong> нульові або від’ємні
                  π; відсутність балансу, якщо змінити топологію графа; обмеження саме найповільнішого
                  пристрою в підсистемі — причина зниження реальної продуктивності гілки. Підвищення π
                  на вузькому місці (таблиця пропозицій нижче) наближає систему до рівноможливості
                  навантаження в межах гілки.
                </p>
              </div>
            )}

            <h3>Пропозиція π для зменшення вузьких місць</h3>
            <p className="small">
              Для кожної підсистеми π вузького місця піднято до наступного мінімуму серед пристроїв
              цієї підсистеми (можна застосувати до полів і порівняти R).
            </p>
            <button
              type="button"
              className="btn primary btn-suggested"
              onClick={() =>
                setInputs(result.suggestedPi.map((x) => String(x.toFixed(4))))
              }
            >
              Застосувати запропоновані π до полів вводу
            </button>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Пристрій</th>
                    <th>Було πᵢ</th>
                    <th>Запропоновано πᵢ</th>
                  </tr>
                </thead>
                <tbody>
                  {result.devices.map((d) => (
                    <tr key={d.deviceIndex}>
                      <td>π{d.deviceIndex}</td>
                      <td>{d.peakPi.toFixed(4)}</td>
                      <td>{result.suggestedPi[d.deviceIndex].toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <footer className="footer">
        <p>
          Джерело: лабораторна «Визначення характеристик систем функціональних пристроїв»
          {labNumber === 6 ? ' (№6, продовження)' : ''}. Порядковий номер: {studentOrderNumber}.
          Стовпець таблиці 1: варіант {fixedVariant} (індекс {columnForVariant(fixedVariant)}), граф ФП
          = {fixedFp}.
        </p>
      </footer>
    </>
  )
}
