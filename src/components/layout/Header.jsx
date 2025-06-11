import { Sun, Moon, Bell, UserPlus, Menu } from 'lucide-react'
import { useStore } from '../../lib/store'
import { cn } from '../../lib/utils'
import { useState, useEffect, useRef } from 'react'
import { db, supabase } from '../../lib/supabase'
import { NuevaInscripcionForm } from '../NuevaInscripcionForm'

export function Header() {
  const { sidebarOpen, toggleSidebar, isDarkMode, toggleDarkMode } = useStore()
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
    <header className='fixed top-0 right-0 left-0 z-50 h-20 bg-white border-b border-gray-200 pl-64'>
      <div className='flex items-center justify-between h-full px-4'>
        {/* Left side */}
        <div className='flex items-center gap-4'>
          {/* Menú hamburguesa solo en móvil */}
          <button
            onClick={toggleSidebar}
            className='p-2 text-gray-500 rounded-lg hover:bg-gray-100 md:hidden'
          >
            <Menu className='w-6 h-6' />
          </button>
          {/* Botón de nueva inscripción */}
          <button
            className='flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow text-sm'
            onClick={() => setShowInscripcionModal(true)}
          >
            <UserPlus className='w-4 h-4 mr-2' />
            Nueva inscripción
          </button>
        </div>

        {/* Right side */}
        <div className='flex items-center space-x-4'>
          {/* Theme toggle */}
          <button
            onClick={toggleDarkMode}
            className='p-2 text-gray-500 rounded-lg hover:bg-gray-100'
          >
            {isDarkMode ? (
              <Sun className='w-6 h-6' />
            ) : (
              <Moon className='w-6 h-6' />
            )}
          </button>

          {/* Notifications */}
          <button className='p-2 text-gray-500 rounded-lg hover:bg-gray-100'>
            <Bell className='w-6 h-6' />
          </button>

          {/* User menu */}
          <div className='relative'>
            <button className='flex items-center space-x-2'>
              <div className='w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center'>
                <span className='text-sm font-medium text-primary-600'>U</span>
              </div>
            </button>
          </div>
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
