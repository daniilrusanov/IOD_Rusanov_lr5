import { useMemo, useState } from 'react'
import { FunctionalDevicesLab } from './components/FunctionalDevicesLab'
import { getGraphPreset } from './lib/graphs'
import {
  fpForOrderNumber,
  STUDENT_ORDER_NUMBER,
  variantForOrderNumber,
} from './lib/studentConfig'
import './App.css'

const FIXED_VARIANT = variantForOrderNumber(STUDENT_ORDER_NUMBER)
const FIXED_FP = fpForOrderNumber(STUDENT_ORDER_NUMBER)

type PageId = 'lab5' | 'lab6'

export default function App() {
  const [page, setPage] = useState<PageId>('lab5')

  const preset = useMemo(() => getGraphPreset(FIXED_FP), [])

  return (
    <div className="app">
      <nav className="app-nav" aria-label="Навігація по лабораторних">
        <button
          type="button"
          className={`nav-tab ${page === 'lab5' ? 'active' : ''}`}
          onClick={() => setPage('lab5')}
        >
          Лабораторна 5
        </button>
        <button
          type="button"
          className={`nav-tab ${page === 'lab6' ? 'active' : ''}`}
          onClick={() => setPage('lab6')}
        >
          Лабораторна 6
        </button>
      </nav>

      <FunctionalDevicesLab
        labNumber={page === 'lab6' ? 6 : 5}
        studentOrderNumber={STUDENT_ORDER_NUMBER}
        fixedVariant={FIXED_VARIANT}
        fixedFp={FIXED_FP}
        preset={preset}
        showSystemMetrics={page === 'lab6'}
      />
    </div>
  )
}
