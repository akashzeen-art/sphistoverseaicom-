import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import './index.css'
import './styles/histoverse.css'
import './styles/histotheme.css'
import './styles/overrides.css'
import './styles/talk.css'
import './styles/enhance.css'
import './styles/figure-portraits.css'
import './styles/ai.css'
import './styles/preloader.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
