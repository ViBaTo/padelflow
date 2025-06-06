import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Package,
  CreditCard,
  Calendar,
  Settings,
  LogOut
} from 'lucide-react'
import { useStore } from '../../lib/store'
import { cn } from '../../lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Alumnos', href: '/alumnos', icon: Users },
  { name: 'Profesores', href: '/profesores', icon: UserCog },
  { name: 'Paquetes', href: '/paquetes', icon: Package },
  { name: 'Pagos', href: '/pagos', icon: CreditCard },
  { name: 'Calendario', href: '/calendario', icon: Calendar },
  { name: 'Configuración', href: '/configuracion', icon: Settings }
]

export function Sidebar() {
  const location = useLocation()
  const { sidebarOpen, logout } = useStore()

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className='flex flex-col h-full'>
        {/* Logo */}
        <div className='flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-800'>
          <h1 className='text-xl font-bold text-primary-600 dark:text-primary-400'>
            LaPala Club
          </h1>
        </div>

        {/* Navigation */}
        <nav className='flex-1 px-2 py-4 space-y-1'>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                )}
              >
                <item.icon className='w-5 h-5 mr-3' />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className='p-4 border-t border-gray-200 dark:border-gray-800'>
          <button
            onClick={logout}
            className='flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          >
            <LogOut className='w-5 h-5 mr-3' />
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  )
}
