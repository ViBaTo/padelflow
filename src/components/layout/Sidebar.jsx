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
  HelpCircle,
  LifeBuoy,
  X,
  ChevronRight
} from 'lucide-react'
import { useStore } from '../../lib/store'
import { cn } from '../../lib/utils'
import { useState, createContext, useContext, useEffect } from 'react'
import logoverdepadel from '../../assets/logos/logoverdepadel.png'

const SidebarContext = createContext()

export function useSidebar() {
  return useContext(SidebarContext)
}

// Hook para detectar el tipo de dispositivo
function useDeviceType() {
  const [isDesktop, setIsDesktop] = useState(true)

  useEffect(() => {
    const checkDeviceType = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)

    return () => window.removeEventListener('resize', checkDeviceType)
  }, [])

  return isDesktop
}

// Configuración de navegación agrupada
const navigationSections = [
  {
    title: 'GESTIÓN',
    items: [
      { name: 'Dashboard', href: '/', icon: LayoutDashboard },
      { name: 'Alumnos', href: '/alumnos', icon: Users },
      { name: 'Profesores', href: '/profesores', icon: UserCog },
      { name: 'Paquetes', href: '/paquetes', icon: Package },
      { name: 'Pagos', href: '/pagos', icon: CreditCard },
      { name: 'Calendario', href: '/calendario', icon: Calendar }
    ]
  },
  {
    title: 'CONFIGURACIÓN',
    items: [
      {
        name: 'Configuración',
        href: '/configuracion',
        icon: Settings,
        desktopOnly: true
      }
    ]
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

function SidebarContent({
  onClose,
  handleLogout,
  organizationName,
  organizationLogo,
  isMobile = false
}) {
  const location = useLocation()
  const isDesktop = useDeviceType()

  return (
    <div className='h-full flex flex-col bg-gradient-to-b from-blue-500 via-indigo-600 to-indigo-700 text-white'>
      {/* Header */}
      <div className='p-4 border-b border-white/10'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm'>
              <img
                src={logoverdepadel}
                alt='Padel Flow'
                className='w-5 h-5 object-contain'
              />
            </div>
            <div>
              <h1 className='text-lg font-bold'>Padel Flow</h1>
              <p className='text-white text-xs'>Gestión inteligente</p>
            </div>
          </div>
          {isMobile && (
            <button
              onClick={onClose}
              className='p-2 rounded-lg hover:bg-white/10 transition-colors'
            >
              <X className='w-5 h-5' />
            </button>
          )}
        </div>

        {/* Club Info */}
        {organizationName && (
          <div className='mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm'>
            <div className='flex items-center space-x-3'>
              <img
                src={organizationLogo || logoverdepadel}
                alt={organizationName}
                className='w-8 h-8 object-contain rounded-lg bg-white/20 p-1'
              />
              <div>
                <p className='font-medium text-sm truncate'>
                  {organizationName}
                </p>
                <p className='text-white text-xs'>Club activo</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className='flex-1 p-3 space-y-4 overflow-y-auto'>
        {navigationSections.map((section) => {
          const filteredItems = section.items.filter(
            (item) => !item.desktopOnly || isDesktop
          )

          if (filteredItems.length === 0) return null

          return (
            <div key={section.title}>
              <h2 className='text-xs font-semibold text-white uppercase tracking-wider mb-2 px-2'>
                {section.title}
              </h2>
              <div className='space-y-1'>
                {filteredItems.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      onClick={isMobile ? onClose : undefined}
                      style={!isActive ? { color: '#ffffff' } : {}}
                      className={cn(
                        'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                        isActive
                          ? 'bg-white text-blue-600 shadow-lg'
                          : 'text-white hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <div className='flex items-center space-x-3'>
                        <item.icon
                          style={!isActive ? { color: '#ffffff' } : {}}
                          className={cn(
                            'w-5 h-5 transition-colors',
                            isActive ? 'text-blue-600' : 'text-white'
                          )}
                        />
                        <span style={!isActive ? { color: '#ffffff' } : {}}>
                          {item.name}
                        </span>
                      </div>
                      {isActive && (
                        <ChevronRight className='w-4 h-4 text-blue-600' />
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Support Section */}
      <div className='p-3 space-y-3'>
        <div>
          <h2 className='text-xs font-semibold text-white uppercase tracking-wider mb-2 px-2'>
            SOPORTE
          </h2>
          <div className='space-y-1'>
            <button className='group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg text-white hover:bg-white/10 transition-all duration-200'>
              <div className='flex items-center space-x-3'>
                <LifeBuoy className='w-4 h-4 text-white transition-colors' />
                <span>Centro de Ayuda</span>
              </div>
            </button>
            <button className='group flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg text-white hover:bg-white/10 transition-all duration-200'>
              <div className='flex items-center space-x-3'>
                <HelpCircle className='w-4 h-4 text-white transition-colors' />
                <span>FAQ</span>
              </div>
            </button>
          </div>
        </div>

        {/* Help Center Card */}
        <div className='bg-white/10 rounded-xl p-3 backdrop-blur-sm'>
          <div className='text-center'>
            <div className='w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2'>
              <Users className='w-4 h-4 text-white' />
            </div>
            <h3 className='font-medium text-xs mb-1'>Centro de Ayuda</h3>
            <p className='text-xs text-white mb-2 opacity-90'>
              Ayuda y soporte
            </p>
            <button className='w-full bg-gradient-to-r from-blue-400 to-indigo-500 text-white text-xs font-medium py-2 rounded-lg hover:from-blue-500 hover:to-indigo-600 transition-all duration-200'>
              Comenzar
            </button>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className='flex items-center w-full px-4 py-3 text-sm font-medium text-white rounded-xl hover:bg-white/10 transition-all duration-200 border-t border-white/10 pt-4'
        >
          <LogOut className='w-5 h-5 mr-3 text-white' />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

function MobileSidebar({
  open,
  onClose,
  handleLogout,
  organizationName,
  organizationLogo
}) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className='fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden'
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent
          onClose={onClose}
          handleLogout={handleLogout}
          organizationName={organizationName}
          organizationLogo={organizationLogo}
          isMobile={true}
        />
      </div>
    </>
  )
}

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, userOrganization } = useStore()
  const sidebar = useSidebar()
  const [organizationLogoUrl, setOrganizationLogoUrl] = useState(null)

  const handleLogout = async () => {
    await logout(() => navigate('/login'))
  }

  // Cargar URL del logo de la organización
  useEffect(() => {
    if (userOrganization?.logo) {
      const publicUrl = `https://skqudwcjjgzzwsjronja.supabase.co/storage/v1/object/public/logos/${userOrganization.logo}`
      setOrganizationLogoUrl(publicUrl)
    } else {
      setOrganizationLogoUrl(null)
    }
  }, [userOrganization?.logo])

  const organizationName = userOrganization?.nombre

  return (
    <>
      {/* Mobile sidebar */}
      <MobileSidebar
        open={sidebar?.open || false}
        onClose={sidebar?.closeSidebar || (() => {})}
        handleLogout={handleLogout}
        organizationName={organizationName}
        organizationLogo={organizationLogoUrl}
      />

      {/* Desktop sidebar */}
      <div className='w-64 hidden lg:flex flex-col shadow-2xl'>
        <SidebarContent
          handleLogout={handleLogout}
          organizationName={organizationName}
          organizationLogo={organizationLogoUrl}
          isMobile={false}
        />
      </div>
    </>
  )
}
