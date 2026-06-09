import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import CapturePage from './CapturePage'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CapturePage />
  </StrictMode>,
)
