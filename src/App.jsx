import { useCallback, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Preloader, { shouldShowHistoryPreloader } from './components/Preloader'
import BrainTrainersPage from './pages/BrainTrainersPage'
import HomePage from './pages/HomePage'
import TalkPage from './pages/TalkPage'

export default function App() {
  const [bootDone, setBootDone] = useState(() => !shouldShowHistoryPreloader())
  const finishBoot = useCallback(() => setBootDone(true), [])

  return (
    <>
      {!bootDone && <Preloader onDone={finishBoot} />}
      <div className={`hv-app${bootDone ? ' is-ready' : ''}`}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/brain-trainers" element={<BrainTrainersPage />} />
            <Route path="/talk/:id" element={<TalkPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </div>
    </>
  )
}
