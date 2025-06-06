import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useStore } from '../../lib/store'
import { useEffect } from 'react'

export function Layout() {
  const { initialize, isLoading } = useStore()

  useEffect(() => {
    initialize()
  }, [initialize])

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900'>
        <div className='w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <Sidebar />
      <Header />
      <main className='pt-16 pl-64'>
        <div className='container p-6 mx-auto'>
          <Outlet />
        </div>
      </main>
    </div>
  )
}
