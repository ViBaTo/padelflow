import { useStore } from '../lib/store'
import { clearAppState, detectAndCleanCorruptedState } from '../lib/store'
import { diagnoseUserSync } from '../lib/diagnostics'
import { useState, useEffect } from 'react'
import { Button } from './ui/button'

export function DebugPanel() {
  const store = useStore()
  const [isVisible, setIsVisible] = useState(false)
  const [debugInfo, setDebugInfo] = useState({})

  useEffect(() => {
    const updateDebugInfo = () => {
      setDebugInfo({
        isLoading: store.isLoading,
        hasUser: !!store.user,
        hasSession: !!store.session,
        userOrganization: !!store.userOrganization,
        organizationLoading: store.organizationLoading,
        timestamp: new Date().toLocaleTimeString()
      })
    }

    updateDebugInfo()
    const interval = setInterval(updateDebugInfo, 1000)
    return () => clearInterval(interval)
  }, [store])

  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV === 'production') {
    return null
  }

  // Mostrar/ocultar con Ctrl + D
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'd') {
        e.preventDefault()
        setIsVisible(!isVisible)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className='fixed bottom-4 right-4 z-50'>
        <Button
          size='sm'
          variant='secondary'
          onClick={() => setIsVisible(true)}
          className='opacity-50 hover:opacity-100'
        >
          🔍 Debug
        </Button>
      </div>
    )
  }

  return (
    <div className='fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm'>
      <div className='flex justify-between items-center mb-3'>
        <h3 className='font-semibold text-sm'>Debug Panel</h3>
        <button
          onClick={() => setIsVisible(false)}
          className='text-gray-500 hover:text-gray-700'
        >
          ✕
        </button>
      </div>

      <div className='space-y-2 text-xs'>
        <div className='grid grid-cols-2 gap-2'>
          <div
            className={`p-2 rounded ${
              debugInfo.isLoading
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}
          >
            Loading: {debugInfo.isLoading ? 'TRUE' : 'FALSE'}
          </div>
          <div
            className={`p-2 rounded ${
              debugInfo.hasUser
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            User: {debugInfo.hasUser ? 'YES' : 'NO'}
          </div>
          <div
            className={`p-2 rounded ${
              debugInfo.hasSession
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            Session: {debugInfo.hasSession ? 'YES' : 'NO'}
          </div>
          <div
            className={`p-2 rounded ${
              debugInfo.userOrganization
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            Org: {debugInfo.userOrganization ? 'YES' : 'NO'}
          </div>
        </div>

        <div className='text-gray-600'>Last update: {debugInfo.timestamp}</div>

        <div className='flex gap-1 pt-2 flex-wrap'>
          <Button
            size='xs'
            onClick={() => store.debugState()}
            variant='secondary'
          >
            Log State
          </Button>
          <Button
            size='xs'
            onClick={() => store.forceFinishLoading()}
            variant='secondary'
          >
            Force Finish
          </Button>
          <Button
            size='xs'
            onClick={() => {
              const cleaned = detectAndCleanCorruptedState()
              if (cleaned) {
                alert('Estados corruptos limpiados!')
              } else {
                alert('No se encontraron estados corruptos')
              }
            }}
            variant='secondary'
            className='text-orange-600 hover:text-orange-700'
          >
            Clean Corrupt
          </Button>
          <Button
            size='xs'
            onClick={async () => {
              const result = await diagnoseUserSync()
              const message = `${result.message}\n\nEstado: ${result.status}`
              alert(message)
              console.log('Diagnóstico de usuario:', result)
            }}
            variant='secondary'
            className='text-blue-600 hover:text-blue-700'
          >
            Check User
          </Button>
          <Button
            size='xs'
            onClick={() => {
              if (
                window.confirm('¿Limpiar todo el estado y recargar la página?')
              ) {
                clearAppState()
              }
            }}
            variant='secondary'
            className='text-red-600 hover:text-red-700'
          >
            Clear All
          </Button>
        </div>
      </div>
    </div>
  )
}
