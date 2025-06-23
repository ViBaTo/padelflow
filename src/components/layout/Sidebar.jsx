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
import { useState, createContext, useContext, useEffect } from 'react'
import logo from '../../assets/images/logo.png'

const SidebarContext = createContext()

export function useSidebar() {
  return useContext(SidebarContext)
}

// Hook para detectar el tipo de dispositivo
function useDeviceType() {
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const checkDeviceType = () => {
      // Consideramos desktop si el ancho es mayor a 1024px (lg breakpoint de Tailwind)
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)

    return () => window.removeEventListener('resize', checkDeviceType)
  }, [])

  return isDesktop
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Alumnos', href: '/alumnos', icon: Users },
  { name: 'Profesores', href: '/profesores', icon: UserCog },
  { name: 'Paquetes', href: '/paquetes', icon: Package },
  { name: 'Pagos', href: '/pagos', icon: CreditCard },
  { name: 'Calendario', href: '/calendario', icon: Calendar },
  {
    name: 'Configuración',
    href: '/configuracion',
    icon: Settings,
    desktopOnly: true
  }
]

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(false)
  const value = {
    open,
    openSidebar: () => setOpen(true),
    closeSidebar: () => setOpen(false),
    toggleSidebar: () => setOpen((v) => !v)
  }
  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

export function SidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      className='p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden'
      aria-label='Abrir menú'
      onClick={toggleSidebar}
    >
      <svg
        width='24'
        height='24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <line x1='3' y1='12' x2='21' y2='12' />
        <line x1='3' y1='6' x2='21' y2='6' />
        <line x1='3' y1='18' x2='21' y2='18' />
      </svg>
    </button>
  )
}

export function Sidebar() {
  const location = useLocation()
  const { logout } = useStore()
  const navigate = useNavigate()
  const [showInscripcionModal, setShowInscripcionModal] = useState(false)
  const { open, closeSidebar } = useSidebar()
  const isDesktop = useDeviceType()

  const handleLogout = () => {
    logout(() => navigate('/login'))
  }

  // Filtrar navegación basado en el tipo de dispositivo
  const filteredNavigation = navigation.filter(
    (item) => !item.desktopOnly || isDesktop
  )

  // Drawer desde arriba para móvil
  return (
    <>
      {open && (
        <>
          {/* Fondo borroso */}
          <div
            className='fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden'
            onClick={closeSidebar}
            aria-label='Cerrar fondo sidebar'
          />
          {/* Drawer */}
          <div
            className={`fixed top-0 left-0 w-full h-[80vh] z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl transition-transform duration-300 ease-in-out lg:hidden ${
              open ? 'translate-y-0' : '-translate-y-full'
            }`}
            tabIndex={-1}
            aria-label='Sidebar'
          >
            <div className='flex flex-col h-full'>
              <div className='flex items-center justify-between h-20 px-4 border-b border-gray-200 dark:border-gray-800'>
                <div className='flex items-center'>
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
                <button
                  className='p-2 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none'
                  onClick={closeSidebar}
                  aria-label='Cerrar menú'
                >
                  ×
                </button>
              </div>
              <nav className='flex-1 px-2 py-4 space-y-1 overflow-y-auto'>
                {filteredNavigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={closeSidebar}
                      className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className='w-5 h-5 mr-3' />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
              <div className='p-4 border-t border-gray-200 dark:border-gray-800'>
                <button
                  className='flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                  onClick={handleLogout}
                >
                  <LogOut className='w-5 h-5 mr-3' />
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {/* Sidebar fijo para escritorio */}
      <div className='w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 hidden lg:flex flex-col'>
        <div className='flex items-center h-20 px-4 border-b border-gray-200 dark:border-gray-800'>
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
        <nav className='flex-1 px-2 py-4 space-y-1'>
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className='w-5 h-5 mr-3' />
                {item.name}
              </Link>
            )
          })}
        </nav>
        <div className='p-4 border-t border-gray-200 dark:border-gray-800'>
          <button
            className='flex items-center w-full px-4 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            onClick={handleLogout}
          >
            <LogOut className='w-5 h-5 mr-3' />
            Cerrar sesión
          </button>
        </div>
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
    </>
  )
}
