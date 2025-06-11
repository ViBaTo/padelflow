import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  UserCog,
  Package,
  CreditCard,
  Calendar,
  Settings,
  LogOut,
  UserPlus
} from 'lucide-react'
import { useStore } from '../../lib/store'
import { cn } from '../../lib/utils'
import { useState } from 'react'
import logo from '../../assets/images/logo.png'

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
  const navigate = useNavigate()
  const [showInscripcionModal, setShowInscripcionModal] = useState(false)

  const handleLogout = () => {
    logout(() => navigate('/login'))
  }

  return (
    <div
      className={cn(
        'fixed inset-y-0 left-0 z-[60] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-transform duration-300 ease-in-out',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <div className='flex flex-col h-full'>
        {/* Logo */}
        <div className='flex items-center justify-center h-20 px-4 border-b border-gray-200 dark:border-gray-800'>
          <img
            src={logo}
            alt='Logo LaPala Club'
            className='h-10 w-10 object-contain mr-2'
            style={{ minWidth: 40 }}
          />
          <span className='text-xl font-bold text-primary-600'>
            LaPala Club
          </span>
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
            onClick={handleLogout}
            className='flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          >
            <LogOut className='w-5 h-5 mr-3' />
            Cerrar sesión
          </button>
        </div>
        {/* Modal de inscripción (placeholder) */}
        {showInscripcionModal && (
          <div className='fixed inset-0 z-50 flex justify-center items-center bg-black/40'>
            <div className='bg-white rounded-lg p-8 shadow-lg relative w-full max-w-lg'>
              <button
                className='absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none transition-colors duration-200'
                onClick={() => setShowInscripcionModal(false)}
                aria-label='Cerrar'
              >
                ×
              </button>
              <h2 className='text-xl font-bold mb-4'>Nueva inscripción</h2>
              <p className='text-gray-500'>
                Aquí irá el formulario de inscripción.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
