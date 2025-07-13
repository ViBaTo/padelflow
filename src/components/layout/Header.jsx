import { Sun, Moon, Bell, UserPlus, Menu } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useSidebar } from './Sidebar'
import { cn } from '../../lib/utils'
import { useState, useEffect, useRef } from 'react'
import { db, supabase } from '../../lib/supabase'
import { NuevaInscripcionForm } from '../NuevaInscripcionForm'
import { UserProfileModal } from '../UserProfileModal'
import { Button } from '../ui/button'
import { designTokens, componentClasses } from '../../lib/designTokens'

// Subcomponentes
function MenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className='p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden touch-manipulation transition-all duration-200'
      aria-label='Abrir menú'
    >
      <Menu className='w-5 h-5 sm:w-6 sm:h-6' />
    </button>
  )
}

function NuevaInscripcionButton({ onClick }) {
  return (
    <Button
      onClick={onClick}
      variant='primary'
      size='default'
      className='shadow-lg'
      fullWidth={false}
    >
      <UserPlus className='w-4 h-4 mr-2' />
      <span className='md:hidden'>Nueva</span>
      <span className='hidden md:inline'>Nueva inscripción</span>
    </Button>
  )
}

function ThemeToggle({ isDarkMode, toggleDarkMode }) {
  return (
    <button
      onClick={toggleDarkMode}
      className='p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation transition-all duration-200'
      aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDarkMode ? (
        <Sun className='w-5 h-5 sm:w-6 sm:h-6' />
      ) : (
        <Moon className='w-5 h-5 sm:w-6 sm:h-6' />
      )}
    </button>
  )
}

function NotificationsButton() {
  return (
    <button
      className='relative p-2 text-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation transition-all duration-200'
      aria-label='Notificaciones'
    >
      <Bell className='w-5 h-5 sm:w-6 sm:h-6' />
      {/* Badge de notificación opcional */}
      <div className='absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white'></div>
    </button>
  )
}

function UserMenu() {
  const [open, setOpen] = useState(false)
  const { user } = useStore()
  return (
    <>
      <button
        className='flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation transition-all duration-200 group'
        onClick={() => setOpen(true)}
      >
        <div className='w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-primary-100 dark:bg-primary-900 border border-primary-200 dark:border-primary-800 flex items-center justify-center group-hover:bg-primary-200 dark:group-hover:bg-primary-800 transition-all duration-200'>
          <span className='text-sm sm:text-base font-semibold text-primary-600 dark:text-primary-400'>
            {user?.email?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
      </button>
      <UserProfileModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

export function Header() {
  const { isDarkMode, toggleDarkMode } = useStore()
  const sidebar = useSidebar()
  const openSidebar = sidebar?.openSidebar || (() => {})
  const [showInscripcionModal, setShowInscripcionModal] = useState(false)
  const [alumnos, setAlumnos] = useState([])
  const [paquetes, setPaquetes] = useState([])
  const [profesores, setProfesores] = useState([])
  const [form, setForm] = useState({
    alumno: '',
    paquete: '',
    fecha: '',
    profesor: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [alumnoSearch, setAlumnoSearch] = useState('')
  const [showAlumnoDropdown, setShowAlumnoDropdown] = useState(false)
  const alumnoInputRef = useRef(null)

  useEffect(() => {
    if (showInscripcionModal) {
      db.getAlumnos().then(({ data }) => setAlumnos(data || []))
      db.getPaquetes().then(({ data }) => setPaquetes(data || []))
      db.getProfesores().then(({ data }) => setProfesores(data || []))
      setForm({ alumno: '', paquete: '', fecha: '', profesor: '' })
      setError('')
      setSuccess('')
    }
  }, [showInscripcionModal])

  // Filtrado de alumnos para autocompletado
  const alumnosFiltrados = alumnoSearch
    ? alumnos.filter(
        (a) =>
          a.nombre_completo &&
          a.nombre_completo.toLowerCase().includes(alumnoSearch.toLowerCase())
      )
    : alumnos

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const alumno = alumnos.find((a) => a.cedula === form.alumno)
      const paquete = paquetes.find((p) => p.codigo === form.paquete)
      if (!alumno || !paquete) {
        setError('Selecciona un alumno y un paquete válidos.')
        setLoading(false)
        return
      }
      // Si el alumno está inactivo, actualizarlo a activo
      if (alumno.estado === 'INACTIVO') {
        await db.updateAlumnoEstado(alumno.cedula, 'ACTIVO')
      }
      // Campos automáticos
      const inscripcion = {
        cedula_alumno: alumno.cedula,
        codigo_paquete: paquete.codigo,
        fecha_inscripcion: form.fecha,
        fecha_vencimiento: null, // puedes calcularlo si lo necesitas
        clases_totales: paquete.numero_clases,
        clases_utilizadas: 0,
        precio_pagado: paquete.precio_con_iva || paquete.precio,
        descuento: 0,
        modo_pago: null,
        comprobante: null,
        observaciones: null,
        estado: 'ACTIVO',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id_profesor: form.profesor || null,
        user_id: supabase.auth.user().id
      }
      const { error } = await db.addInscripcion(inscripcion)
      if (error) {
        setError('Error al crear la inscripción: ' + error.message)
      } else {
        setSuccess('Inscripción creada correctamente')
        setTimeout(() => setShowInscripcionModal(false), 1200)
      }
    } catch (err) {
      setError('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  const handleAlumnoSelect = (cedula, nombre) => {
    setForm({ ...form, alumno: cedula })
    setAlumnoSearch(nombre)
    setShowAlumnoDropdown(false)
  }

  // Cerrar dropdown si se hace click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        alumnoInputRef.current &&
        !alumnoInputRef.current.contains(event.target)
      ) {
        setShowAlumnoDropdown(false)
      }
    }
    if (showAlumnoDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAlumnoDropdown])

  // Nuevo: validación de selección de alumno
  const alumnoNoSeleccionado = alumnoSearch && !form.alumno

  return (
    <header
      className='
        h-16 lg:h-16
        bg-white dark:bg-gray-900
        border-b border-gray-200 dark:border-gray-800
        transition-all duration-300 ease-in-out
        z-50
        shadow-sm
      '
    >
      <div className='flex items-center justify-between h-full px-4 sm:px-6'>
        {/* Left side */}
        <div className='flex items-center gap-2 sm:gap-4'>
          <MenuButton onClick={openSidebar} />
          <NuevaInscripcionButton
            onClick={() => setShowInscripcionModal(true)}
          />
        </div>

        {/* Right side */}
        <div className='flex items-center space-x-2 sm:space-x-4'>
          <ThemeToggle
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
          />
          <NotificationsButton />
          <UserMenu />
        </div>

        {/* Modal de inscripción */}
        <NuevaInscripcionForm
          open={showInscripcionModal}
          onClose={() => setShowInscripcionModal(false)}
          onSuccess={() => setShowInscripcionModal(false)}
        />
      </div>
    </header>
  )
}
