import { useMemo, useState } from 'react'
import { FunctionalDevicesLab } from './components/FunctionalDevicesLab'
import { AmdahlLawLab } from './components/AmdahlLawLab'
import { getGraphPreset } from './lib/graphs'
import {
  fpForOrderNumber,
  STUDENT_ORDER_NUMBER,
  variantForOrderNumber,
} from './lib/studentConfig'
import './App.css'

const FIXED_VARIANT = variantForOrderNumber(STUDENT_ORDER_NUMBER)

type PageId = 'lab5' | 'lab6' | 'lab7' | 'lab8'

export default function App() {
  const [page, setPage] = useState<PageId>('lab5')

  const labNum = page === 'lab8' ? 8 : page === 'lab7' ? 7 : page === 'lab6' ? 6 : 5

  const preset = useMemo(() => {
    const fp = fpForOrderNumber(STUDENT_ORDER_NUMBER, labNum)
    return getGraphPreset(fp)
  }, [labNum])

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
        <button
          type="button"
          className={`nav-tab ${page === 'lab7' ? 'active' : ''}`}
          onClick={() => setPage('lab7')}
        >
          Лабораторна 7
        </button>
        <button
          type="button"
          className={`nav-tab ${page === 'lab8' ? 'active' : ''}`}
          onClick={() => setPage('lab8')}
        >
          Лабораторна 8
        </button>
      </nav>

      {page === 'lab8' ? (
        <AmdahlLawLab/>
      ) : (
        <FunctionalDevicesLab
          labNumber={labNum as 5 | 6 | 7}
          studentOrderNumber={STUDENT_ORDER_NUMBER}
          fixedVariant={FIXED_VARIANT}
          fixedFp={preset.id}
          preset={preset}
          showSystemMetrics={page === 'lab6' || page === 'lab7'}
        />
      )}
    </div>
  )
}
