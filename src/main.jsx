import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { PortfolioProvider } from './data/portfolio.jsx'
import './styles/globals.css'
import './styles/sketchbook.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PortfolioProvider>
      <App />
    </PortfolioProvider>
  </React.StrictMode>
)
