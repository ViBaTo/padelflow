import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import diagnostics from './lib/diagnostics.js'

// 🔍 Inicializar herramientas de diagnóstico
if (import.meta.env.DEV) {
  console.log('🛠️ Modo desarrollo - diagnósticos disponibles')
  console.log(
    'Usa window.appDiagnostics.logHealth() para ver el estado de la app'
  )

  // 🚀 Usar monitor ligero para reducir overhead
  diagnostics.startLightMonitor()

  // Log inicial de salud
  setTimeout(() => {
    diagnostics.logHealth()
  }, 2000)
}

// 🔧 StrictMode desactivado temporalmente para evitar dobles inicializaciones en desarrollo
ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
)
