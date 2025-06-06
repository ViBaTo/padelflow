import { Menu, Sun, Moon, Bell } from 'lucide-react'
import { useStore } from '../../lib/store'
import { cn } from '../../lib/utils'

export function Header() {
  const { sidebarOpen, toggleSidebar, isDarkMode, toggleDarkMode } = useStore()

  return (
    <header className='fixed top-0 right-0 left-0 z-40 h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800'>
      <div className='flex items-center justify-between h-full px-4'>
        {/* Left side */}
        <div className='flex items-center'>
          <button
            onClick={toggleSidebar}
            className='p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          >
            <Menu className='w-6 h-6' />
          </button>
        </div>

        {/* Right side */}
        <div className='flex items-center space-x-4'>
          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className='p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
          >
            {isDarkMode ? (
              <Sun className='w-6 h-6' />
            ) : (
              <Moon className='w-6 h-6' />
            )}
          </button>

          {/* Notifications */}
          <button className='p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'>
            <Bell className='w-6 h-6' />
          </button>

          {/* User menu */}
          <div className='relative'>
            <button className='flex items-center space-x-2'>
              <div className='w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center'>
                <span className='text-sm font-medium text-primary-600 dark:text-primary-400'>
                  U
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
