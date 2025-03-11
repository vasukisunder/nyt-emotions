import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Add a style tag to ensure the root div takes full width
const style = document.createElement('style')
style.textContent = `
  #root {
    width: 100%;
    height: 100%;
    display: block;
  }
`
document.head.appendChild(style)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
