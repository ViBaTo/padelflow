import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { useStore } from './lib/store'
import { useEffect, useState } from 'react'
import Alumnos from './pages/alumnos/Alumnos'

// Páginas
import { Login } from './pages/auth/Login'
import { Dashboard } from './pages/Dashboard'
import { Profesores } from './pages/profesores/Profesores'
import { Paquetes } from './pages/paquetes/Paquetes'
import { Pagos } from './pages/pagos/Pagos'
import { Calendario } from './pages/calendario/Calendario'
import { Configuracion } from './pages/configuracion/Configuracion'
import { Register } from './pages/auth/Register'
import { CreateClub } from './pages/CreateClub'
import { DebugPanel } from './components/DebugPanel'

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  const { user, isLoading, forceFinishLoading } = useStore()
  const [localTimeout, setLocalTimeout] = useState(null)

  // 🆕 Manejo mejorado del timeout de seguridad
  useEffect(() => {
    if (isLoading) {
      // Limpiar timeout previo si existe
      if (localTimeout) {
        clearTimeout(localTimeout)
      }

      // Nuevo timeout de seguridad
      const timeout = setTimeout(() => {
        console.warn('⚠️ ProtectedRoute timeout - forzando fin del loading')
        forceFinishLoading()
      }, 8000) // Reducido a 8 segundos

      setLocalTimeout(timeout)

      // Cleanup del timeout
      return () => {
        clearTimeout(timeout)
        setLocalTimeout(null)
      }
    }
  }, [isLoading, forceFinishLoading])

  // 🆕 Si tenemos usuario pero sigue loading, forzar fin del loading
  useEffect(() => {
    if (user && isLoading) {
      console.log(
        '🔧 Usuario detectado pero isLoading=true, forzando fin del loading'
      )
      setTimeout(() => forceFinishLoading(), 100) // Pequeño delay para evitar problemas de race condition
    }
  }, [user, isLoading, forceFinishLoading])

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin' />
          <p className='text-gray-600 dark:text-gray-400 text-sm'>
            Cargando aplicación...
          </p>
          {/* 🆕 Botón de emergencia después de 5 segundos */}
          <button
            onClick={() => {
              console.log('🔧 Usuario forzó fin del loading')
              forceFinishLoading()
            }}
            className='mt-4 px-4 py-2 text-xs text-gray-500 hover:text-gray-700 underline transition-opacity opacity-0'
            ref={(el) => {
              if (el) {
                setTimeout(() => {
                  el.style.opacity = '1'
                }, 5000) // Mostrar después de 5 segundos
              }
            }}
          >
            Continuar sin cargar (si el problema persiste)
          </button>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  return children
}

function App() {
  const { initialize, isLoading, user } = useStore()
  const [appInitialized, setAppInitialized] = useState(false)

  // 🔧 useEffect optimizado con mejor control de inicialización
  useEffect(() => {
    if (!appInitialized) {
      console.log('🚀 Inicializando App...')
      setAppInitialized(true)
      initialize()
        .then(() => {
          console.log('✅ App inicializada correctamente')
        })
        .catch((error) => {
          console.error('❌ Error inicializando App:', error)
        })
    }
  }, [initialize, appInitialized])

  // 🆕 Debug logging para troubleshooting
  useEffect(() => {
    console.log('🔍 App state:', { isLoading, user: !!user, appInitialized })
  }, [isLoading, user, appInitialized])

  return (
    <div className='main-layout'>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />

          {/* Ruta especial para crear club */}
          <Route
            path='/crear-club'
            element={
              <ProtectedRoute>
                <CreateClub />
              </ProtectedRoute>
            }
          />

          {/* Rutas protegidas */}
          <Route
            path='/'
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path='alumnos' element={<Alumnos />} />
            <Route path='profesores' element={<Profesores />} />
            <Route path='paquetes' element={<Paquetes />} />
            <Route path='pagos' element={<Pagos />} />
            <Route path='calendario' element={<Calendario />} />
            <Route path='configuracion' element={<Configuracion />} />
          </Route>

          {/* Ruta por defecto */}
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>

        {/* Panel de debug solo en desarrollo */}
        {/* <DebugPanel /> */}
      </BrowserRouter>
    </div>
  )
}

export default App
