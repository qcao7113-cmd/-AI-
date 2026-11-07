import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/tokens.css'
import './styles/layout.css'
import './styles/ui.css'
import './styles/pages.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* BASE_URL 由 Vite 按部署路径注入（GitHub Pages 为 /<repo>/），保证子路径路由可用 */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
