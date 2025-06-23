import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { useStore } from './lib/store'
import { useEffect } from 'react'
import Alumnos from './pages/alumnos/Alumnos'
import { Analytics } from '@vercel/analytics/react'

// Páginas
import { Login } from './pages/auth/Login'
import { Dashboard } from './pages/Dashboard'
import { Profesores } from './pages/profesores/Profesores'
import { Paquetes } from './pages/paquetes/Paquetes'
import { Pagos } from './pages/pagos/Pagos'
import { Calendario } from './pages/calendario/Calendario'
import { Configuracion } from './pages/configuracion/Configuracion'
import { Register } from './pages/auth/Register'

// Componente para rutas protegidas
function ProtectedRoute({ children }) {
  const { user, isLoading } = useStore()

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  if (!user) {
    return <Navigate to='/login' replace />
  }

  return children
}

function App() {
  const { initialize } = useStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <div className='main-layout'>
      <BrowserRouter>
        <Routes>
          {/* Rutas públicas */}
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />

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
      </BrowserRouter>
      <Analytics />
    </div>
  )
}

export default App
