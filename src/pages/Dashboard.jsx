import { useEffect, useState } from 'react'
import { db } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'

export function Dashboard() {
  const [stats, setStats] = useState({
    alumnosActivos: 0,
    ingresosMes: 0,
    clasesProgramadas: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const { data, error } = await db.getResumen()
        if (error) throw error
        setStats(
          data[0] || {
            alumnosActivos: 0,
            ingresosMes: 0,
            clasesProgramadas: 0
          }
        )
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
        Dashboard
      </h1>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {/* Alumnos activos */}
        <div className='p-6 bg-white rounded-lg shadow dark:bg-gray-800'>
          <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            Alumnos activos
          </h3>
          <p className='mt-2 text-3xl font-semibold text-gray-900 dark:text-white'>
            {stats.alumnosActivos}
          </p>
        </div>

        {/* Ingresos del mes */}
        <div className='p-6 bg-white rounded-lg shadow dark:bg-gray-800'>
          <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            Ingresos del mes
          </h3>
          <p className='mt-2 text-3xl font-semibold text-gray-900 dark:text-white'>
            {formatCurrency(stats.ingresosMes)}
          </p>
        </div>

        {/* Clases programadas */}
        <div className='p-6 bg-white rounded-lg shadow dark:bg-gray-800'>
          <h3 className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            Clases programadas
          </h3>
          <p className='mt-2 text-3xl font-semibold text-gray-900 dark:text-white'>
            {stats.clasesProgramadas}
          </p>
        </div>
      </div>
    </div>
  )
}
