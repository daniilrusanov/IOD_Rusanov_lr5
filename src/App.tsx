import { useMemo, useState } from 'react'
import { GraphVisualization } from './components/GraphVisualization'
import { computeSystem } from './lib/compute'
import { getGraphPreset } from './lib/graphs'
import { columnForVariant, peakVectorFromTable } from './lib/table1'
import {
  fpForOrderNumber,
  STUDENT_ORDER_NUMBER,
  variantForOrderNumber,
} from './lib/studentConfig'
import './App.css'

const FIXED_VARIANT = variantForOrderNumber(STUDENT_ORDER_NUMBER)
const FIXED_FP = fpForOrderNumber(STUDENT_ORDER_NUMBER)

function parsePiInputs(texts: string[]): number[] {
  return texts.map((t) => {
    const x = Number(String(t).replace(',', '.'))
    return Number.isFinite(x) ? x : NaN
  })
}

export default function App() {
  const preset = useMemo(() => getGraphPreset(FIXED_FP), [])

  const [inputs, setInputs] = useState<string[]>(() =>
    peakVectorFromTable(FIXED_VARIANT).map((v) => String(v)),
  )

  const peakPi = useMemo(() => parsePiInputs(inputs), [inputs])

  const result = useMemo(() => {
    if (peakPi.some((x) => !Number.isFinite(x) || x <= 0)) {
      return null
    }
    return computeSystem(peakPi, preset.subsystems)
  }, [peakPi, preset.subsystems])

  return (
    <div className="app">
      <header className="header">
        <h1>Лабораторна 5 · Системи функціональних пристроїв</h1>
        <p className="subtitle">
          Порядковий номер у списку групи: <strong>{STUDENT_ORDER_NUMBER}</strong> · граф ФП=
          {FIXED_FP} · варіант таблиці 1: <strong>{FIXED_VARIANT}</strong>. Завантаженість
          пристроїв, реальна продуктивність за першим законом Амдала, аналіз несумісності та
          візуалізація графа.
        </p>
      </header>

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
                  За обраною моделлю (мінімум у підсистемі, додатні π) явних суперечностей у
                  вхідних даних не виявлено. Вузькі місця обмежують продуктивність гілки — це
                  відповідає першому закону Амдала.
                </p>
                <p className="small explain-gap">
                  <strong>Що зазвичай трактують як «несумісність» у звіті:</strong> нульові або
                  від’ємні π; відсутність балансу, якщо змінити топологію графа; обмеження
                  саме найповільнішого пристрою в підсистемі — причина зниження реальної
                  продуктивності гілки. Підвищення π на вузькому місці (таблиця пропозицій нижче)
                  наближає систему до рівноможливості навантаження в межах гілки.
                </p>
              </div>
            )}

            <h3>Пропозиція π для зменшення вузьких місць</h3>
            <p className="small">
              Для кожної підсистеми π вузького місця піднято до наступного мінімуму серед
              пристроїв цієї підсистеми (можна застосувати до полів і порівняти R).
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
          Джерело: лабораторна «Визначення характеристик систем функціональних пристроїв».
          Порядковий номер: {STUDENT_ORDER_NUMBER}. Стовпець таблиці 1: варіант {FIXED_VARIANT}{' '}
          (індекс {columnForVariant(FIXED_VARIANT)}), граф ФП = {FIXED_FP}.
        </p>
      </footer>
    </div>
  )
}
