import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './popup.css'
import { PopupGreeting } from '../components/PopupGreeting'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Popup root element was not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <PopupGreeting />
  </StrictMode>,
)
