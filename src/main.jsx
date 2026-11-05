import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/prompt/800.css'
import '@fontsource/prompt/900.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/700-italic.css'
import '@fontsource/bangers/400.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
