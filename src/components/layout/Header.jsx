import { Sun, Moon, Bell, UserPlus, Menu } from 'lucide-react'
import { useStore } from '../../lib/store'
import { useSidebar } from './Sidebar'
import { cn } from '../../lib/utils'
import { useState, useEffect, useRef } from 'react'
import { db, supabase } from '../../lib/supabase'
import { NuevaInscripcionForm } from '../NuevaInscripcionForm'

// Subcomponentes
function MenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className='p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden touch-manipulation'
      aria-label='Abrir menú'
    >
      <Menu className='w-5 h-5 sm:w-6 sm:h-6' />
    </button>
  )
}

function NuevaInscripcionButton({ onClick }) {
  return (
    <button
      className='flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition-colors disabled:opacity-50 text-sm sm:text-base'
      onClick={onClick}
    >
      <UserPlus className='w-4 h-4 mr-2' />
      <span>Nueva inscripción</span>
      <span className='sm:hidden'>Nueva</span>
    </button>
  )
}

function ThemeToggle({ isDarkMode, toggleDarkMode }) {
  return (
    <button
      onClick={toggleDarkMode}
      className='p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation'
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
      className='p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation'
      aria-label='Notificaciones'
    >
      <Bell className='w-5 h-5 sm:w-6 sm:h-6' />
    </button>
  )
}

function UserMenu() {
  return (
    <div className='relative'>
      <button className='flex items-center space-x-2 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 touch-manipulation'>
        <div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center'>
          <span className='text-xs sm:text-sm font-medium text-primary-600 dark:text-primary-400'>
            U
          </span>
        </div>
      </button>
    </div>
  )
}

export function Header() {
  const { isDarkMode, toggleDarkMode } = useStore()
  const { openSidebar } = useSidebar()
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
    h-20 lg:h-20
    bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800
    transition-all duration-300 ease-in-out
    z-0
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
