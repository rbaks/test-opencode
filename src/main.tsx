import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { assertDatasetValid } from '@/data/validate'
import './index.css'

// Fail fast if the bundled dataset is corrupt (FR-014): an invalid strategy or
// asset-class definition refuses to render rather than shipping silently. The
// same guard also runs as a prebuild gate so `npm run build` fails outright.
assertDatasetValid()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
