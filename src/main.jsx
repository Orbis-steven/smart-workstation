import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { OrbcafeI18nProvider } from 'orbcafe-ui'
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OrbcafeI18nProvider defaultLocale="zh">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </OrbcafeI18nProvider>
  </StrictMode>,
)
