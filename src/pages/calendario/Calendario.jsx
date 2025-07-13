import React, { useState, useEffect, useRef } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isToday,
  startOfDay,
  endOfDay,
  eachHourOfInterval,
  setHours,
  getHours,
  getMinutes
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  MapPin,
  Calendar as CalendarIcon,
  Users,
  Filter,
  Search,
  TrendingUp,
  Activity,
  ChevronUp,
  ChevronDown,
  X,
  Menu,
  Home,
  ArrowLeft,
  ArrowRight,
  MoreHorizontal
} from 'lucide-react'
import { db } from '../../lib/supabase'
import { NewEventModal } from '../../components/NewEventModal'
import { ConflictModal } from '../../components/ConflictModal'
import { useConflictValidation } from '../../hooks/useConflictValidation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Alert } from '../../components/ui/Alert'
import { Input } from '../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select'
import { designTokens, componentClasses } from '../../lib/designTokens'
import { cn, formatDateSafe } from '../../lib/utils'

// Colores disponibles para canchas
const AVAILABLE_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-orange-500',
  'bg-purple-500',
  'bg-red-500',
  'bg-yellow-500',
  'bg-indigo-500',
  'bg-pink-500'
]

const CLASS_TYPES = {
  'Clase Individual': {
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: User
  },
  'Clase Grupal': {
    color: 'bg-primary-50 text-primary-700 border-primary-200',
    icon: Users
  },
  Academia: {
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: CalendarIcon
  }
}

const CLASS_STATES = {
  confirmada: {
    color: 'bg-primary-50 text-primary-700 border-primary-200',
    label: 'Confirmada',
    icon: '✓'
  },
  pendiente: {
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    label: 'Pendiente',
    icon: '⏳'
  },
  cancelada: {
    color: 'bg-red-50 text-red-700 border-red-200',
    label: 'Cancelada',
    icon: '✗'
  },
  completada: {
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    label: 'Completada',
    icon: '✓'
  },
  reprogramada: {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    label: 'Reprogramada',
    icon: '↻'
  }
}

// Horarios disponibles (slots de 30 minutos)
const TIME_SLOTS = [
  '08:00',
  '08:30',
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
  '17:30',
  '18:00',
  '18:30',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00'
]

export function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month') // 'month', 'week', 'day'
  const [events, setEvents] = useState([])
  const [profesores, setProfesores] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [canchas, setCanchas] = useState([])
  const [inscripciones, setInscripciones] = useState([]) // 🆕 Para paquetes de alumnos
  const [paquetes, setPaquetes] = useState([]) // 🆕 Para nombres de paquetes
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterProfesor, setFilterProfesor] = useState('TODOS')
  const [filterTipo, setFilterTipo] = useState('TODOS')
  const [filterCancha, setFilterCancha] = useState('TODAS')
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedEvent, setDraggedEvent] = useState(null)
  const [dragOverDate, setDragOverDate] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [conflictData, setConflictData] = useState(null)

  // 📱 NUEVOS ESTADOS PARA MÓVIL
  const [showFilters, setShowFilters] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 })
  const [swipeThreshold, setSwipeThreshold] = useState(50)
  const calendarRef = useRef(null)

  // Detectar si es dispositivo móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 📱 FUNCIONES DE NAVEGACIÓN TÁCTIL
  const handleTouchStart = (e) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    })
  }

  const handleTouchEnd = (e) => {
    if (!touchStart.x || !touchStart.y) return

    const currentX = e.changedTouches[0].clientX
    const currentY = e.changedTouches[0].clientY

    const diffX = touchStart.x - currentX
    const diffY = touchStart.y - currentY

    // Solo procesar swipes horizontales (no verticales para scroll)
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
      if (diffX > 0) {
        // Swipe izquierda - siguiente
        handleSwipeNext()
      } else {
        // Swipe derecha - anterior
        handleSwipePrev()
      }
    }

    // Reset
    setTouchStart({ x: 0, y: 0 })
  }

  const handleSwipeNext = () => {
    if (view === 'month') {
      setCurrentDate(addMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(addDays(currentDate, 1))
    }
  }

  const handleSwipePrev = () => {
    if (view === 'month') {
      setCurrentDate(subMonths(currentDate, 1))
    } else if (view === 'week') {
      setCurrentDate(addDays(currentDate, -7))
    } else {
      setCurrentDate(addDays(currentDate, -1))
    }
  }

  // Hook de validación de conflictos
  const { validateEvent, getSuggestedTimes } = useConflictValidation(
    events,
    profesores
  )

  // Función para mostrar mensajes
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Función para abrir modal con fecha preseleccionada
  const openEventModal = (date = currentDate, slot = null) => {
    setSelectedEvent(null)
    setSelectedDate(date)
    setSelectedSlot(slot)
    setShowEventModal(true)

    // Mostrar mensaje confirmando la fecha preseleccionada
    const dateString = format(date, "dd 'de' MMMM, yyyy", { locale: es })
    let message = `📅 Fecha preseleccionada: ${dateString}`

    if (slot) {
      message += ` - ${slot.time} en ${slot.courtName}`
    }

    showMessage('info', message)
  }

  // Función para refrescar datos del calendario
  const refrescarDatos = async () => {
    try {
      // 🆕 Refrescar asistencias, inscripciones, y también alumnos/profesores por si han cambiado
      const [asistenciasData, inscripcionesData, alumnosData, profesoresData] =
        await Promise.all([
          db.getAsistencias(),
          db.getInscripciones(),
          db.getAlumnos(),
          db.getProfesores()
        ])

      // Actualizar alumnos y profesores primero
      if (!alumnosData.error && alumnosData.data) {
        setAlumnos(alumnosData.data)
      }

      if (!profesoresData.error && profesoresData.data) {
        setProfesores(profesoresData.data)
      }

      // Luego transformar asistencias con los datos actualizados
      if (!asistenciasData.error && asistenciasData.data) {
        // Usar los datos recién obtenidos para la transformación
        const alumnosActualizados = alumnosData.data || alumnos
        const profesoresActualizados = profesoresData.data || profesores

        const transformedEvents = asistenciasData.data.map((asistencia) => {
          // Crear una versión local de transformAsistenciaToEvent con datos actualizados
          return transformAsistenciaToEventWithData(
            asistencia,
            alumnosActualizados,
            profesoresActualizados
          )
        })
        setEvents(transformedEvents)
      }

      if (!inscripcionesData.error && inscripcionesData.data) {
        setInscripciones(inscripcionesData.data)
      }
    } catch (error) {
      console.error('Error al refrescar datos:', error)
    }
  }

  // Función para calcular cuántos slots de 30 minutos ocupa un evento
  const calculateEventSlots = (event) => {
    if (!event.endTime || !event.startTime) return 1

    const startTime = new Date(`2000-01-01T${event.startTime}:00`)
    const endTime = new Date(`2000-01-01T${event.endTime}:00`)
    const diffMinutes = (endTime - startTime) / 60000

    return Math.ceil(diffMinutes / 30) // Redondear hacia arriba para slots de 30 minutos
  }

  // Función para obtener todos los slots que ocupa un evento
  const getEventSlots = (event) => {
    const slots = []
    const startTime = new Date(`2000-01-01T${event.startTime}:00`)
    const slotsCount = calculateEventSlots(event)

    for (let i = 0; i < slotsCount; i++) {
      const slotTime = new Date(startTime.getTime() + i * 30 * 60000)
      const timeString = slotTime.toTimeString().substring(0, 5)
      slots.push(timeString)
    }

    return slots
  }

  // Función para verificar si un slot está ocupado por algún evento
  const isSlotOccupied = (courtName, time, date = currentDate) => {
    return events.some((event) => {
      if (event.cancha !== courtName || !isSameDay(event.date, date)) {
        return false
      }

      const eventSlots = getEventSlots(event)
      return eventSlots.includes(time)
    })
  }

  // Función para obtener evento en un slot específico (puede ser slot de inicio o continuación)
  const getEventForSlot = (courtName, time, date = currentDate) => {
    return events.find((event) => {
      if (event.cancha !== courtName || !isSameDay(event.date, date)) {
        return false
      }

      const eventSlots = getEventSlots(event)
      return eventSlots.includes(time)
    })
  }

  // Función para verificar si un slot es el inicio de un evento
  const isSlotStart = (event, time) => {
    return event.startTime === time
  }

  // Función para obtener el color del tipo de evento
  const getEventTypeColor = (type) => {
    return (
      CLASS_TYPES[type]?.color || 'bg-gray-100 text-gray-800 border-gray-200'
    )
  }

  // Función para obtener el color de una cancha
  const getCourtColor = (courtName) => {
    const court = canchas.find((c) => c.nombre === courtName)
    if (court && court.color) {
      return court.color
    }
    // Fallback: asignar color basado en el índice
    const index = canchas.findIndex((c) => c.nombre === courtName)
    return index >= 0
      ? AVAILABLE_COLORS[index % AVAILABLE_COLORS.length]
      : 'bg-gray-500'
  }

  // Función para obtener información completa de una cancha
  const getCourtInfo = (courtName) => {
    return (
      canchas.find((c) => c.nombre === courtName) || {
        id_cancha: null,
        nombre: courtName,
        tipo: 'unknown',
        color: 'bg-gray-500'
      }
    )
  }

  // Función para calcular ocupación
  const calculateOccupancy = (date = currentDate) => {
    const dayEvents = events.filter((event) => isSameDay(event.date, date))
    const totalSlots = TIME_SLOTS.length * canchas.length
    const occupiedSlots = dayEvents.length
    return canchas.length > 0
      ? Math.round((occupiedSlots / totalSlots) * 100)
      : 0
  }

  // Función para manejar click en slot vacío
  const handleSlotClick = (courtName, time, date = currentDate) => {
    const slotDateTime = new Date(date)
    const [hours, minutes] = time.split(':')
    slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0)

    const slot = { courtName, time, date: slotDateTime }
    openEventModal(slotDateTime, slot)
  }

  // Mock events data - In a real app, this would come from your database
  const mockEvents = [
    {
      id: 1,
      title: 'Clase Individual - Juan Pérez',
      date: new Date(),
      startTime: '09:00',
      endTime: '10:00',
      type: 'Clase Individual',
      profesor: 'PROF001',
      alumno: 'Juan Pérez',
      cancha: 'Cancha 1',
      estado: 'confirmada'
    },
    {
      id: 2,
      title: 'Clase Grupal - Principiantes',
      date: addDays(new Date(), 1),
      startTime: '16:00',
      endTime: '17:30',
      type: 'Clase Grupal',
      profesor: 'PROF002',
      alumnos: ['María García', 'Carlos López', 'Ana Martín'],
      cancha: 'Cancha 2',
      estado: 'confirmada'
    }
  ]

  // Función auxiliar para transformar con datos específicos
  const transformAsistenciaToEventWithData = (
    asistencia,
    alumnosData,
    profesoresData
  ) => {
    // Buscar el nombre del profesor
    const profesor = profesoresData.find(
      (p) => p.id_profesor === asistencia.id_profesor
    )
    const nombreProfesor = profesor
      ? profesor.nombre_completo
      : asistencia.id_profesor

    // Buscar el nombre del alumno
    const alumno = alumnosData.find(
      (a) => a.cedula === asistencia.cedula_alumno
    )
    const nombreAlumno = alumno ? alumno.nombre_completo : 'Sin alumno'

    // 🔍 Debug: verificar si se encuentra el alumno
    if (!alumno && asistencia.cedula_alumno) {
      console.warn(
        '⚠️ Alumno no encontrado en transformAsistenciaToEventWithData:',
        {
          cedula_buscada: asistencia.cedula_alumno,
          alumnos_disponibles: alumnosData.length,
          primer_alumno: alumnosData[0]?.cedula || 'N/A'
        }
      )
    }

    // ✅ Buscar el nombre de la cancha correctamente
    let nombreCancha = 'Sin cancha'
    if (asistencia.id_cancha) {
      // Usar el ID de cancha (campo correcto)
      const cancha = canchas.find((c) => c.id_cancha === asistencia.id_cancha)
      nombreCancha = cancha
        ? cancha.nombre
        : `Cancha ID: ${asistencia.id_cancha}`
    } else if (asistencia.academia) {
      // Fallback al campo legacy
      nombreCancha = asistencia.academia
    }

    // 🔍 Debug: Verificar parsing de fecha desde BD
    let fechaParseada
    if (
      typeof asistencia.fecha_clase === 'string' &&
      asistencia.fecha_clase.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      const [year, month, day] = asistencia.fecha_clase.split('-').map(Number)
      fechaParseada = new Date(year, month - 1, day)
    } else {
      fechaParseada = new Date(asistencia.fecha_clase)
    }
    console.log('🔍 transformAsistenciaToEventWithData - Parsing fecha:', {
      id_asistencia: asistencia.id_asistencia,
      fecha_clase_bd: asistencia.fecha_clase,
      fecha_parseada: fechaParseada,
      fecha_parseada_string: formatDateSafe(fechaParseada),
      fecha_parseada_formatted: format(fechaParseada, "dd 'de' MMMM, yyyy", {
        locale: es
      })
    })

    return {
      id: asistencia.id_asistencia,
      title: asistencia.codigo_paquete
        ? `${asistencia.codigo_paquete} - ${nombreAlumno}`
        : `Clase - ${nombreAlumno}`,
      date: fechaParseada,
      startTime: asistencia.hora_inicio
        ? asistencia.hora_inicio.substring(0, 5)
        : '00:00',
      endTime: asistencia.hora_fin
        ? asistencia.hora_fin.substring(0, 5)
        : asistencia.hora_inicio
        ? new Date(
            new Date(`2000-01-01T${asistencia.hora_inicio}`).getTime() +
              90 * 60000
          )
            .toTimeString()
            .substring(0, 5)
        : '01:30',
      type: asistencia.tipo_clase || asistencia.codigo_paquete || 'Clase',
      profesor: asistencia.id_profesor,
      alumno: nombreAlumno,
      cancha: nombreCancha, // ✅ Ahora usa el campo correcto
      estado:
        asistencia.estado ||
        (asistencia.confirmado ? 'confirmada' : 'pendiente'),
      // Datos adicionales de la base de datos
      cedula_alumno: asistencia.cedula_alumno,
      codigo_paquete: asistencia.codigo_paquete,
      confirmado: asistencia.confirmado,
      duration:
        asistencia.hora_fin && asistencia.hora_inicio
          ? Math.round(
              (new Date(`2000-01-01T${asistencia.hora_fin}`) -
                new Date(`2000-01-01T${asistencia.hora_inicio}`)) /
                60000
            )
          : 90
    }
  }

  // Función para transformar datos de asistencias de la BD al formato del componente
  const transformAsistenciaToEvent = (asistencia) => {
    // Buscar el nombre del profesor
    const profesor = profesores.find(
      (p) => p.id_profesor === asistencia.id_profesor
    )
    const nombreProfesor = profesor
      ? profesor.nombre_completo
      : asistencia.id_profesor

    // Buscar el nombre del alumno
    const alumno = alumnos.find((a) => a.cedula === asistencia.cedula_alumno)
    const nombreAlumno = alumno ? alumno.nombre_completo : 'Sin alumno'

    // 🔍 Debug: verificar si se encuentra el alumno
    if (!alumno && asistencia.cedula_alumno) {
      console.warn('⚠️ Alumno no encontrado:', {
        cedula_buscada: asistencia.cedula_alumno,
        alumnos_disponibles: alumnos.length,
        primer_alumno: alumnos[0]?.cedula || 'N/A'
      })
    }

    // ✅ Buscar el nombre de la cancha correctamente
    let nombreCancha = 'Sin cancha'
    if (asistencia.id_cancha) {
      // Usar el ID de cancha (campo correcto)
      const cancha = canchas.find((c) => c.id_cancha === asistencia.id_cancha)
      nombreCancha = cancha
        ? cancha.nombre
        : `Cancha ID: ${asistencia.id_cancha}`
    } else if (asistencia.academia) {
      // Fallback al campo legacy
      nombreCancha = asistencia.academia
    }

    // 🔍 Debug: Verificar parsing de fecha desde BD (función legacy)
    let fechaParseada
    if (
      typeof asistencia.fecha_clase === 'string' &&
      asistencia.fecha_clase.match(/^\d{4}-\d{2}-\d{2}$/)
    ) {
      const [year, month, day] = asistencia.fecha_clase.split('-').map(Number)
      fechaParseada = new Date(year, month - 1, day)
    } else {
      fechaParseada = new Date(asistencia.fecha_clase)
    }
    console.log('🔍 transformAsistenciaToEvent - Parsing fecha:', {
      id_asistencia: asistencia.id_asistencia,
      fecha_clase_bd: asistencia.fecha_clase,
      fecha_parseada: fechaParseada,
      fecha_parseada_string: formatDateSafe(fechaParseada),
      fecha_parseada_formatted: format(fechaParseada, "dd 'de' MMMM, yyyy", {
        locale: es
      })
    })

    return {
      id: asistencia.id_asistencia,
      title: asistencia.codigo_paquete
        ? `${asistencia.codigo_paquete} - ${nombreAlumno}`
        : `Clase - ${nombreAlumno}`,
      date: fechaParseada,
      startTime: asistencia.hora_inicio
        ? asistencia.hora_inicio.substring(0, 5)
        : '00:00',
      endTime: asistencia.hora_fin
        ? asistencia.hora_fin.substring(0, 5)
        : asistencia.hora_inicio
        ? new Date(
            new Date(`2000-01-01T${asistencia.hora_inicio}`).getTime() +
              90 * 60000
          )
            .toTimeString()
            .substring(0, 5)
        : '01:30',
      type: asistencia.tipo_clase || asistencia.codigo_paquete || 'Clase',
      profesor: asistencia.id_profesor,
      alumno: nombreAlumno,
      cancha: nombreCancha, // ✅ Ahora usa el campo correcto
      estado:
        asistencia.estado ||
        (asistencia.confirmado ? 'confirmada' : 'pendiente'),
      // Datos adicionales de la base de datos
      cedula_alumno: asistencia.cedula_alumno,
      codigo_paquete: asistencia.codigo_paquete,
      confirmado: asistencia.confirmado,
      duration:
        asistencia.hora_fin && asistencia.hora_inicio
          ? Math.round(
              (new Date(`2000-01-01T${asistencia.hora_fin}`) -
                new Date(`2000-01-01T${asistencia.hora_inicio}`)) /
                60000
            )
          : 90
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [
          profesoresData,
          alumnosData,
          asistenciasData,
          canchasData,
          inscripcionesData,
          paquetesData
        ] = await Promise.all([
          db.getProfesores(),
          db.getAlumnos(),
          db.getAsistencias(),
          db.getCanchas(),
          db.getInscripciones(), // 🆕 Cargar inscripciones
          db.getPaquetes() // 🆕 Cargar paquetes
        ])

        if (!profesoresData.error) setProfesores(profesoresData.data || [])
        if (!alumnosData.error) setAlumnos(alumnosData.data || [])
        if (!inscripcionesData.error)
          setInscripciones(inscripcionesData.data || []) // 🆕
        if (!paquetesData.error) setPaquetes(paquetesData.data || []) // 🆕

        // Cargar canchas desde la BD
        if (!canchasData.error && canchasData.data) {
          // Asignar colores automáticamente si no los tienen
          const canchasConColor = canchasData.data.map((cancha, index) => ({
            ...cancha,
            color:
              cancha.color || AVAILABLE_COLORS[index % AVAILABLE_COLORS.length],
            // Asegurar que el tipo sea compatible con el calendario
            tipo: cancha.tipo_superficie === 'cristal' ? 'indoor' : 'outdoor'
          }))
          setCanchas(canchasConColor)
          console.log('Canchas cargadas desde BD:', canchasConColor)
        } else {
          console.error('Error al cargar canchas:', canchasData.error)
          // Fallback a datos mock si hay error
          setCanchas([
            {
              id_cancha: 1,
              nombre: 'Cancha 1',
              tipo: 'indoor',
              color: 'bg-blue-500',
              codigo: 'CAN001'
            },
            {
              id_cancha: 2,
              nombre: 'Cancha 2',
              tipo: 'indoor',
              color: 'bg-emerald-500',
              codigo: 'CAN002'
            },
            {
              id_cancha: 3,
              nombre: 'Cancha 3',
              tipo: 'outdoor',
              color: 'bg-orange-500',
              codigo: 'CAN003'
            },
            {
              id_cancha: 4,
              nombre: 'Cancha 4',
              tipo: 'outdoor',
              color: 'bg-purple-500',
              codigo: 'CAN004'
            }
          ])
        }

        if (!asistenciasData.error && asistenciasData.data) {
          // Usar los datos recién cargados para la transformación
          const transformedEvents = asistenciasData.data.map((asistencia) => {
            return transformAsistenciaToEventWithData(
              asistencia,
              alumnosData.data || [],
              profesoresData.data || []
            )
          })
          setEvents(transformedEvents)
        } else {
          console.error('Error al cargar asistencias:', asistenciasData.error)
          // Fallback a datos mock si hay error
          setEvents(mockEvents)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        // Fallback a datos mock si hay error
        setEvents(mockEvents)
        setCanchas([
          {
            id_cancha: 1,
            nombre: 'Cancha 1',
            tipo: 'indoor',
            color: 'bg-blue-500'
          },
          {
            id_cancha: 2,
            nombre: 'Cancha 2',
            tipo: 'indoor',
            color: 'bg-emerald-500'
          },
          {
            id_cancha: 3,
            nombre: 'Cancha 3',
            tipo: 'outdoor',
            color: 'bg-orange-500'
          },
          {
            id_cancha: 4,
            nombre: 'Cancha 4',
            tipo: 'outdoor',
            color: 'bg-purple-500'
          }
        ])
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const getEventsForDate = (date) => {
    return events.filter((event) => isSameDay(event.date, date))
  }

  const filteredEvents = events.filter((event) => {
    const matchProfesor =
      filterProfesor === 'TODOS' || event.profesor === filterProfesor
    const matchTipo = filterTipo === 'TODOS' || event.type === filterTipo
    const matchCancha =
      filterCancha === 'TODAS' || event.cancha === filterCancha
    const matchSearch =
      searchTerm === '' ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.alumno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.alumnos?.some((alumno) =>
        alumno.toLowerCase().includes(searchTerm.toLowerCase())
      )

    return matchProfesor && matchTipo && matchCancha && matchSearch
  })

  const getProfesorName = (profesorId) => {
    const profesor = profesores.find((p) => p.id_profesor === profesorId)
    return profesor ? profesor.nombre_completo : profesorId
  }

  // Handler para guardar nuevos eventos con validaciones
  const handleSaveEvent = async (eventData) => {
    try {
      console.log('Datos recibidos para guardar:', eventData)

      // Validaciones básicas
      if (!eventData.profesor) {
        throw new Error('Profesor es requerido')
      }
      if (!eventData.students || eventData.students.length === 0) {
        throw new Error('Debe seleccionar al menos un alumno')
      }
      if (!eventData.cancha) {
        throw new Error('Cancha es requerida')
      }

      // Validar que el profesor existe
      const profesorExiste = profesores.find(
        (p) => p.id_profesor === eventData.profesor
      )
      if (!profesorExiste) {
        throw new Error('El profesor seleccionado no existe')
      }

      // Validar que el alumno existe
      const alumnoExiste = alumnos.find(
        (a) => a.cedula === eventData.students[0]
      )
      if (!alumnoExiste) {
        throw new Error('El alumno seleccionado no existe')
      }

      // Validar conflictos usando el hook
      const validation = validateEvent(eventData)

      if (!validation.isValid) {
        // Si hay conflictos, mostrar modal de confirmación
        setConflictData({
          eventData,
          conflicts: validation.conflicts,
          warnings: validation.warnings,
          suggestions: getSuggestedTimes(eventData)
        })
        setShowConflictModal(true)
        return // No guardar hasta que el usuario resuelva los conflictos
      }

      // Si hay solo advertencias, mostrarlas pero continuar
      if (validation.hasWarnings) {
        console.warn('Advertencias detectadas:', validation.warnings)
        validation.warnings.forEach((warning) => {
          showMessage('warning', warning)
        })
      }

      // Proceder con el guardado
      await saveEventToDatabase(eventData)
    } catch (error) {
      console.error('Error saving event:', error)
      showMessage('error', error.message || 'Error al guardar el evento')
      throw error
    }
  }

  // Función separada para guardar en base de datos
  const saveEventToDatabase = async (eventData) => {
    try {
      // Validaciones previas
      if (!eventData) {
        throw new Error('Datos del evento no válidos')
      }

      if (!eventData.students || eventData.students.length === 0) {
        throw new Error('Debe especificar al menos un alumno')
      }

      if (!eventData.profesor) {
        throw new Error('Debe especificar un profesor')
      }

      if (!eventData.cancha) {
        throw new Error('Debe especificar una cancha')
      }

      if (!eventData.startTime || !eventData.endTime) {
        throw new Error('Debe especificar hora de inicio y fin')
      }

      // Validar formato de horas
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (
        !timeRegex.test(eventData.startTime) ||
        !timeRegex.test(eventData.endTime)
      ) {
        throw new Error('Formato de hora inválido. Use HH:MM')
      }

      // Validar que la hora de fin sea posterior a la de inicio
      const startTime = new Date(`2000-01-01T${eventData.startTime}:00`)
      const endTime = new Date(`2000-01-01T${eventData.endTime}:00`)
      if (endTime <= startTime) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio')
      }

      // Generar ID único más robusto
      const timestamp = new Date().getTime()
      const random = Math.random().toString(36).substring(2, 8)
      const uniqueId = `AST-${timestamp}-${random}`

      // Transformar los datos del evento al formato de la base de datos
      // Solo incluir campos que existen en el esquema de la tabla asistencias

      // Buscar el ID de la cancha por su nombre
      const canchaSeleccionada = canchas.find(
        (c) => c.nombre === eventData.cancha
      )
      const idCancha = canchaSeleccionada ? canchaSeleccionada.id_cancha : null

      const asistenciaData = {
        id_asistencia: uniqueId,
        cedula_alumno: eventData.students[0], // Para clases individuales
        id_profesor: eventData.profesor,
        codigo_paquete: eventData.packageCode || null,
        fecha_clase: formatDateSafe(eventData.date), // Formato YYYY-MM-DD sin problemas de zona horaria
        hora_inicio: eventData.startTime,
        hora_fin: eventData.endTime,
        tipo_clase: eventData.type || 'Clase Individual',
        estado: eventData.estado || 'confirmada',
        id_cancha: idCancha, // ✅ Campo correcto para la relación con canchas
        academia: eventData.cancha, // 📝 Mantener por compatibilidad (campo legacy)
        confirmado:
          eventData.confirmado !== undefined ? eventData.confirmado : true
      }

      // Validar que no haya campos undefined o null críticos
      if (!asistenciaData.cedula_alumno) {
        throw new Error('Cédula del alumno es requerida')
      }
      if (!asistenciaData.id_profesor) {
        throw new Error('ID del profesor es requerido')
      }
      if (!asistenciaData.id_cancha) {
        throw new Error('ID de cancha es requerido')
      }

      console.log('📅 Guardando nueva asistencia:', {
        id: asistenciaData.id_asistencia,
        fecha: asistenciaData.fecha_clase,
        horario: `${asistenciaData.hora_inicio} - ${asistenciaData.hora_fin}`,
        profesor: asistenciaData.id_profesor,
        alumno: asistenciaData.cedula_alumno,
        id_cancha: asistenciaData.id_cancha,
        cancha_nombre: eventData.cancha,
        tipo: asistenciaData.tipo_clase,
        estado: asistenciaData.estado,
        confirmado: asistenciaData.confirmado
      })

      // Guardar en la base de datos
      const { data, error } = await db.addAsistencia(asistenciaData)

      if (error) {
        console.error('❌ Error al guardar asistencia:', error)

        // Manejo específico de errores comunes
        let errorMessage = 'Error al guardar el evento'
        if (error.message?.includes('foreign key')) {
          errorMessage = 'Error: El profesor o alumno seleccionado no existe'
        } else if (error.message?.includes('unique')) {
          errorMessage = 'Error: Ya existe una asistencia con este ID'
        } else if (error.message?.includes('not null')) {
          errorMessage = 'Error: Faltan datos obligatorios'
        } else if (
          error.message?.includes('column') &&
          error.message?.includes('schema')
        ) {
          errorMessage =
            'Error: Problema con el esquema de la base de datos. Contacte al administrador.'
        } else if (error.message?.includes('duracion')) {
          errorMessage =
            'Error: Campo duración no válido. Se ha corregido automáticamente.'
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`
        }

        showMessage('error', errorMessage)
        throw new Error(errorMessage)
      }

      // Verificar que se guardó correctamente
      if (!data || data.length === 0) {
        throw new Error(
          'No se pudo confirmar que el evento se guardó correctamente'
        )
      }

      // Si se guardó correctamente, refrescar los datos
      console.log('✅ Evento guardado exitosamente:', data[0])

      // 🆕 Si hay un paquete seleccionado, actualizar clases utilizadas
      if (eventData.packageCode) {
        try {
          console.log(
            '📦 Actualizando clases utilizadas del paquete:',
            eventData.packageCode
          )

          // Buscar la inscripción del alumno con este paquete
          const inscripcion = inscripciones.find(
            (ins) =>
              ins.cedula_alumno === eventData.students[0] &&
              ins.codigo_paquete === eventData.packageCode &&
              ins.estado === 'ACTIVO'
          )

          if (inscripcion) {
            const nuevasClasesUtilizadas =
              (inscripcion.clases_utilizadas || 0) + 1

            // Actualizar en la base de datos
            const { error: updateError } = await db.updateInscripcion(
              inscripcion.id_inscripcion,
              {
                clases_utilizadas: nuevasClasesUtilizadas
              }
            )

            if (updateError) {
              console.error(
                '❌ Error actualizando clases utilizadas:',
                updateError
              )
              showMessage(
                'warning',
                'Evento guardado pero no se pudo actualizar el paquete'
              )
            } else {
              console.log(
                '✅ Clases utilizadas actualizadas:',
                nuevasClasesUtilizadas
              )
              showMessage(
                'success',
                `Evento guardado y clase descontada del paquete ${eventData.packageCode}`
              )
            }
          } else {
            console.warn('⚠️ No se encontró la inscripción para actualizar')
            showMessage(
              'warning',
              'Evento guardado pero no se encontró el paquete para actualizar'
            )
          }
        } catch (updateError) {
          console.error('❌ Error actualizando paquete:', updateError)
          showMessage(
            'warning',
            'Evento guardado pero hubo un error actualizando el paquete'
          )
        }
      } else {
        showMessage('success', 'Evento guardado exitosamente')
      }

      // Refrescar datos del calendario
      await refrescarDatos()

      // Retornar los datos guardados para uso posterior si es necesario
      return data[0]
    } catch (error) {
      console.error('💥 Error en saveEventToDatabase:', error)

      // Re-lanzar el error para que sea manejado por el caller
      throw error
    }
  }

  // Handler para forzar guardado ignorando conflictos
  const handleForceSave = async () => {
    try {
      if (conflictData?.eventData) {
        await saveEventToDatabase(conflictData.eventData)
        setShowConflictModal(false)
        setConflictData(null)
      }
    } catch (error) {
      console.error('Error al forzar guardado:', error)
      showMessage('error', 'Error al guardar el evento')
    }
  }

  // Handler para aplicar sugerencia
  const handleApplySuggestion = async (suggestion) => {
    try {
      const updatedEventData = {
        ...conflictData.eventData,
        startTime: suggestion.startTime,
        endTime: suggestion.endTime
      }

      await saveEventToDatabase(updatedEventData)
      setShowConflictModal(false)
      setConflictData(null)
    } catch (error) {
      console.error('Error al aplicar sugerencia:', error)
      showMessage('error', 'Error al guardar el evento')
    }
  }

  // Handler para cambiar estado de evento
  const handleChangeEventState = async (eventId, newState) => {
    try {
      const { data, error } = await db.updateAsistencia(eventId, {
        confirmado: newState === 'confirmada'
      })

      if (error) {
        console.error('Error al cambiar estado:', error)
        showMessage('error', 'Error al cambiar el estado del evento')
        return
      }

      await refrescarDatos()
      showMessage(
        'success',
        `Evento marcado como ${CLASS_STATES[newState]?.label.toLowerCase()}`
      )
    } catch (error) {
      console.error('Error al cambiar estado:', error)
      showMessage('error', 'Error inesperado al cambiar el estado')
    }
  }

  // Handler para eliminar evento
  const handleDeleteEvent = async (eventId) => {
    const confirmed = window.confirm(
      '¿Está seguro de que desea eliminar este evento?'
    )

    if (!confirmed) return

    try {
      const { data, error } = await db.deleteAsistencia(eventId)

      if (error) {
        console.error('Error al eliminar evento:', error)
        showMessage('error', 'Error al eliminar el evento')
        return
      }

      await refrescarDatos()
      setShowEventModal(false)
      showMessage('success', 'Evento eliminado exitosamente')
    } catch (error) {
      console.error('Error al eliminar evento:', error)
      showMessage('error', 'Error inesperado al eliminar el evento')
    }
  }

  // Handlers para drag and drop
  const handleDragStart = (e, event) => {
    setDraggedEvent(event)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.target.outerHTML)
    e.target.classList.add('dragging')
  }

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging')
    setDraggedEvent(null)
    setDragOverDate(null)
  }

  const handleDragOver = (e, date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(date)

    // 🔍 Debug: Verificar fecha de drag over
    console.log('🔍 Drag Over fecha:', {
      date: date,
      dateString: formatDateSafe(date),
      dayOfWeek: format(date, 'EEEE', { locale: es }),
      formatted: format(date, "dd 'de' MMMM, yyyy", { locale: es })
    })
  }

  const handleDragLeave = (e) => {
    // Solo remover el highlight si realmente salimos de la celda
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverDate(null)
    }
  }

  const handleDrop = async (e, targetDate) => {
    e.preventDefault()
    setDragOverDate(null)

    if (!draggedEvent) return

    // 🔍 Debug: Verificar fechas antes del movimiento
    console.log('🔍 INICIO handleDrop - Datos del movimiento:', {
      eventoArrastrado: {
        id: draggedEvent.id,
        titulo: draggedEvent.title,
        fechaOriginal: draggedEvent.date,
        fechaOriginalString: formatDateSafe(draggedEvent.date),
        fechaOriginalFormatted: format(
          draggedEvent.date,
          "dd 'de' MMMM, yyyy",
          { locale: es }
        )
      },
      fechaDestino: {
        targetDate: targetDate,
        targetDateString: formatDateSafe(targetDate),
        targetDateFormatted: format(targetDate, "dd 'de' MMMM, yyyy", {
          locale: es
        }),
        dayOfWeek: format(targetDate, 'EEEE', { locale: es })
      }
    })

    try {
      // Crear evento temporal para validar el movimiento
      const movedEvent = {
        ...draggedEvent,
        date: targetDate,
        id: draggedEvent.id // Excluir el evento actual de la validación
      }

      // Validar conflictos en la nueva fecha
      const validation = validateEvent(movedEvent)

      if (!validation.isValid) {
        // Mostrar conflictos pero permitir mover con confirmación
        const shouldMove = window.confirm(
          `Se detectaron conflictos al mover el evento:\n\n${validation.conflicts.join(
            '\n'
          )}\n\n¿Desea mover el evento de todas formas?`
        )

        if (!shouldMove) {
          setDraggedEvent(null)
          return
        }
      }

      // Si hay advertencias, mostrarlas
      if (validation.hasWarnings) {
        validation.warnings.forEach((warning) => {
          showMessage('warning', warning)
        })
      }

      // 🔧 FIX: Formatear la fecha de manera segura sin problemas de zona horaria
      const nuevaFecha = formatDateSafe(targetDate)

      console.log('🔧 Moviendo evento:', {
        eventoId: draggedEvent.id,
        fechaOriginal: formatDateSafe(draggedEvent.date),
        fechaNueva: nuevaFecha,
        targetDate: targetDate.toString()
      })

      // Actualizar en la base de datos
      const { data, error } = await db.moverAsistencia(
        draggedEvent.id,
        nuevaFecha
      )

      if (error) {
        console.error('Error al mover evento en BD:', error)
        showMessage('error', 'Error al mover el evento')
        return
      }

      console.log('✅ Evento movido en BD:', data)

      // Si se actualizó correctamente, refrescar los datos
      await refrescarDatos()
      showMessage('success', 'Evento movido exitosamente')
      console.log('Evento movido exitosamente')
    } catch (error) {
      console.error('Error al mover evento:', error)
      showMessage('error', 'Error inesperado al mover el evento')
    } finally {
      setDraggedEvent(null)
    }
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayEvents = getEventsForDate(day).filter((event) =>
          filteredEvents.includes(event)
        )

        days.push(
          <div
            key={day.toString()}
            className={cn(
              'min-h-32 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors drop-zone',
              !isSameMonth(day, currentDate)
                ? 'bg-gray-50 text-gray-400'
                : 'bg-white',
              isToday(day) ? 'ring-2 ring-primary-500' : '',
              dragOverDate && dragOverDate.toDateString() === day.toDateString()
                ? 'bg-primary-50'
                : ''
            )}
            onClick={() => openEventModal(day)}
            onDragOver={(e) => handleDragOver(e, day)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, day)}
          >
            <div
              className={cn(
                'text-sm font-medium mb-1',
                isToday(day) ? 'text-primary-600' : ''
              )}
            >
              {format(day, 'd')}
            </div>
            <div className='space-y-1'>
              {dayEvents.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded border calendar-event ${
                    CLASS_TYPES[event.type]?.color ||
                    'bg-gray-100 text-gray-800 border-gray-200'
                  } cursor-move relative`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, event)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedEvent(event)
                    setShowEventModal(true)
                  }}
                >
                  <div className='font-medium truncate'>{event.startTime}</div>
                  <div className='truncate'>{event.title}</div>
                  {/* Indicador de estado */}
                  <div className='absolute top-0 right-0 text-xs'>
                    {CLASS_STATES[event.estado]?.icon ||
                      (event.confirmado ? '✓' : '⏳')}
                  </div>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className='text-xs text-gray-500 font-medium'>
                  +{dayEvents.length - 3} más
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className='grid grid-cols-7'>
          {days}
        </div>
      )
      days = []
    }

    return (
      <Card>
        <CardContent className='p-0'>
          {/* Calendar header */}
          <div className='grid grid-cols-7 border-b border-gray-200'>
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
              <div
                key={day}
                className={cn(
                  'p-3 text-center text-sm font-medium bg-primary-50 text-primary-700'
                )}
              >
                {day}
              </div>
            ))}
          </div>
          {/* Calendar body */}
          <div>{rows}</div>
        </CardContent>
      </Card>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = []
    let day = weekStart
    while (day <= weekEnd) {
      weekDays.push(day)
      day = addDays(day, 1)
    }

    // Generar horas completas del día (estilo Apple)
    const hours = Array.from({ length: 15 }, (_, i) => i + 8) // 8:00 a 22:00

    return (
      <div className='bg-white rounded-lg border border-gray-200 overflow-hidden'>
        {/* Header minimalista estilo Apple */}
        <div className='border-b border-gray-100 p-4'>
          <div className='flex justify-between items-center'>
            <h2 className='text-lg font-medium text-gray-900'>
              {format(weekStart, 'd', { locale: es })} - {format(weekEnd, 'd MMM yyyy', { locale: es })}
            </h2>
            <div className='text-sm text-gray-500'>
              {weekDays.reduce((total, day) => {
                return total + events.filter(event => 
                  isSameDay(event.date, day) && filteredEvents.includes(event)
                ).length
              }, 0)} eventos
            </div>
          </div>
        </div>

        {/* Grid principal estilo Apple */}
        <div className='overflow-auto' style={{ height: '600px' }}>
          <div className='grid grid-cols-8 min-w-full'>
            {/* Header con días de la semana */}
            <div className='sticky top-0 bg-white z-20 border-b border-gray-100'>
              <div className='h-16 flex items-center justify-center text-xs font-medium text-gray-500'>
                GMT-5
              </div>
            </div>
            {weekDays.map((day) => (
              <div
                key={day.toString()}
                className='sticky top-0 bg-white z-20 border-b border-l border-gray-100'
              >
                <div className='h-16 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors'
                     onClick={() => {
                       setCurrentDate(day)
                       setView('day')
                     }}>
                  <div className={cn(
                    'text-xs font-medium uppercase tracking-wide',
                    isToday(day) ? 'text-blue-600' : 'text-gray-500'
                  )}>
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={cn(
                    'text-lg font-light mt-1',
                    isToday(day) ? 'text-blue-600 font-medium' : 'text-gray-900'
                  )}>
                    {format(day, 'd')}
                  </div>
                  {isToday(day) && (
                    <div className='w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium mt-1'>
                      {format(day, 'd')}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Grid de horas y eventos */}
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                {/* Columna de hora */}
                <div className='border-b border-gray-50 relative'>
                  <div className='h-16 flex items-start justify-end pr-3 pt-1'>
                    <span className='text-xs text-gray-400 font-light'>
                      {hour}:00
                    </span>
                  </div>
                </div>

                {/* Columnas de días */}
                {weekDays.map((day) => {
                  const dayEvents = events.filter(event => 
                    isSameDay(event.date, day) && 
                    filteredEvents.includes(event) &&
                    getHours(new Date(`2000-01-01T${event.startTime}:00`)) === hour
                  )

                  return (
                    <div
                      key={`${day.toString()}-${hour}`}
                      className='border-b border-l border-gray-50 relative group'
                      style={{ minHeight: '64px' }}
                      onDragOver={(e) => handleDragOver(e, day)}
                      onDrop={(e) => handleDrop(e, day, `${hour}:00`)}
                    >
                      {/* Línea de media hora */}
                      <div className='absolute top-8 left-0 right-0 border-t border-gray-100'></div>
                      
                      {/* Botón para agregar evento (solo visible al hover) */}
                      {dayEvents.length === 0 && (
                        <button
                          onClick={() => handleSlotClick('Cancha 1', `${hour}:00`, day)}
                          className='absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 hover:bg-blue-50 transition-all duration-200 flex items-center justify-center'
                        >
                          <Plus className='w-4 h-4 text-blue-500' />
                        </button>
                      )}

                      {/* Eventos */}
                      {dayEvents.map((event, index) => {
                        const startHour = getHours(new Date(`2000-01-01T${event.startTime}:00`))
                        const startMinutes = getMinutes(new Date(`2000-01-01T${event.startTime}:00`))
                        const endHour = getHours(new Date(`2000-01-01T${event.endTime}:00`))
                        const endMinutes = getMinutes(new Date(`2000-01-01T${event.endTime}:00`))
                        
                        const totalMinutes = (endHour - startHour) * 60 + (endMinutes - startMinutes)
                        const height = Math.max((totalMinutes / 60) * 64, 32) // Mínimo 32px de altura
                        const topOffset = (startMinutes / 60) * 64

                        return (
                          <div
                            key={event.id}
                            className={cn(
                              'absolute left-1 right-1 rounded-md shadow-sm cursor-pointer transition-all hover:shadow-md z-10 border-l-4',
                              event.estado === 'confirmada' ? 'bg-blue-50 border-blue-400' :
                              event.estado === 'pendiente' ? 'bg-yellow-50 border-yellow-400' :
                              'bg-red-50 border-red-400'
                            )}
                            style={{
                              top: `${topOffset}px`,
                              height: `${height}px`,
                              marginLeft: `${index * 2}px`,
                              zIndex: 10 + index
                            }}
                            onClick={() => {
                              setSelectedEvent(event)
                              setShowEventModal(true)
                            }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, event)}
                          >
                            <div className='p-2 h-full flex flex-col justify-start overflow-hidden'>
                              <div className={cn(
                                'text-xs font-medium truncate leading-tight',
                                event.estado === 'confirmada' ? 'text-blue-800' :
                                event.estado === 'pendiente' ? 'text-yellow-800' :
                                'text-red-800'
                              )}>
                                {event.tipo || event.type}
                              </div>
                              <div className='text-xs text-gray-600 truncate'>
                                {event.startTime} - {event.endTime}
                              </div>
                              {height > 48 && (
                                <>
                                  <div className='text-xs text-gray-600 truncate mt-1'>
                                    {event.profesorNombre}
                                  </div>
                                  <div className='text-xs text-gray-500 truncate'>
                                    {event.alumnosNombres?.join(', ') || event.alumno || 'Sin alumno'}
                                  </div>
                                  <div className='text-xs text-gray-500 truncate'>
                                    {event.academia}
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate).filter((event) =>
      filteredEvents.includes(event)
    )

    return (
      <Card>
        <CardContent className='p-0 overflow-hidden'>
          {/* Header del calendario diario */}
          <div className='bg-white border-b border-gray-200 p-4'>
            <div className='flex justify-between items-center'>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Vista Diaria -{' '}
                  {format(currentDate, "EEEE dd 'de' MMMM yyyy", {
                    locale: es
                  })}
                </h3>
                {isToday(currentDate) && (
                  <p className='text-sm text-primary-600 font-medium'>HOY</p>
                )}
              </div>
              <div className='flex items-center space-x-3'>
                <Badge variant='outline' className='text-xs'>
                  Ocupación: {calculateOccupancy(currentDate)}%
                </Badge>
                <Badge variant='outline' className='text-xs'>
                  {dayEvents.length} eventos
                </Badge>
              </div>
            </div>
          </div>

          {/* Tabla de horarios y canchas */}
          <div className='overflow-x-auto'>
            <table className='w-full border-collapse'>
              <thead>
                <tr className='bg-gray-50 border-b border-gray-200'>
                  <th className='text-left p-3 font-medium text-gray-700 w-20 sticky left-0 bg-gray-50 z-10 border-r border-gray-200'>
                    Hora
                  </th>
                  {canchas.map((court) => (
                    <th
                      key={court.id_cancha}
                      className='text-center p-3 font-medium text-gray-700 min-w-48 border-r border-gray-200'
                    >
                      <div className='flex flex-col items-center justify-center space-y-1'>
                        <div className='flex items-center space-x-2'>
                          <span className='text-sm font-medium text-gray-700'>
                            {court.nombre}
                          </span>
                          <Badge
                            variant='outline'
                            className={cn(
                              'text-xs',
                              court.tipo === 'indoor'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : 'bg-green-100 text-green-800 border-green-300'
                            )}
                          >
                            {court.tipo}
                          </Badge>
                        </div>
                        {court.codigo && (
                          <span className='text-xs text-gray-500 font-mono'>
                            {court.codigo}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIME_SLOTS.map((time, timeIndex) => (
                  <tr
                    key={time}
                    className='border-b border-gray-100 hover:bg-gray-50'
                    style={{ height: '96px' }} // Altura fija para cada fila
                  >
                    <td className='p-3 font-medium text-gray-700 bg-gray-50 sticky left-0 z-10 border-r border-gray-200'>
                      <div className='text-sm font-semibold'>{time}</div>
                    </td>
                    {canchas.map((court, courtIndex) => {
                      const event = getEventForSlot(
                        court.nombre,
                        time,
                        currentDate
                      )
                      const isFiltered = event && filteredEvents.includes(event)
                      const isEventStart = event && isSlotStart(event, time)
                      const isOccupied = isSlotOccupied(
                        court.nombre,
                        time,
                        currentDate
                      )

                      return (
                        <td
                          key={court.id_cancha}
                          className='p-2 relative border-r border-gray-200'
                          style={{ height: '96px' }}
                        >
                          {event && isFiltered && isEventStart ? (
                            // Mostrar evento completo expandido con posición absoluta
                            <div
                              className={cn(
                                'absolute left-2 right-2 p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md group z-20',
                                getEventTypeColor(event.type)
                              )}
                              style={{
                                top: '8px',
                                height: `${
                                  calculateEventSlots(event) * 96 - 16
                                }px` // 96px por slot menos márgenes
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEvent(event)
                                setShowEventModal(true)
                              }}
                            >
                              <div className='font-medium text-sm truncate'>
                                {event.title}
                              </div>
                              {event.profesor && (
                                <div className='text-xs flex items-center mt-1'>
                                  <User className='w-3 h-3 mr-1 flex-shrink-0' />
                                  <span className='truncate'>
                                    {getProfesorName(event.profesor)}
                                  </span>
                                </div>
                              )}
                              <div className='text-xs flex items-center mt-1'>
                                <Users className='w-3 h-3 mr-1 flex-shrink-0' />
                                <span>{event.alumno || 'Sin alumno'}</span>
                              </div>
                              <div className='text-xs flex items-center mt-1'>
                                <Clock className='w-3 h-3 mr-1 flex-shrink-0' />
                                <span>{event.duration || 90}min</span>
                              </div>
                              <div className='text-xs flex items-center mt-1'>
                                <MapPin className='w-3 h-3 mr-1 flex-shrink-0' />
                                <span>{event.cancha}</span>
                              </div>
                              <div className='text-xs flex items-center mt-1'>
                                <span className='text-gray-600'>
                                  {event.startTime} - {event.endTime}
                                </span>
                              </div>
                              {/* Indicador de estado */}
                              <div className='absolute top-2 right-2 text-xs'>
                                {CLASS_STATES[event.estado]?.icon ||
                                  (event.confirmado ? '✓' : '⏳')}
                              </div>
                              {/* Hover actions */}
                              <div className='absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center'>
                                <span className='text-xs text-gray-600 bg-white px-2 py-1 rounded shadow'>
                                  Click para ver detalles
                                </span>
                              </div>
                            </div>
                          ) : event && isFiltered && !isEventStart ? (
                            // Slot ocupado por continuación de evento - completamente vacío pero clickeable
                            <div
                              className='w-full h-full cursor-pointer'
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedEvent(event)
                                setShowEventModal(true)
                              }}
                            >
                              {/* Completamente vacío para que el evento extendido sea visible */}
                            </div>
                          ) : !isOccupied ? (
                            // Slot vacío
                            <button
                              onClick={() =>
                                handleSlotClick(court.nombre, time, currentDate)
                              }
                              className='w-full h-full border-2 border-dashed border-gray-300 rounded-lg transition-colors flex flex-col items-center justify-center group hover:border-primary-400 hover:bg-primary-50 mx-1'
                            >
                              <Plus className='w-5 h-5 text-gray-400 group-hover:text-primary-500' />
                              <span className='text-xs text-gray-500 group-hover:text-primary-600 mt-1'>
                                Crear reserva
                              </span>
                            </button>
                          ) : (
                            // Slot ocupado por otro evento - vacío para no interferir
                            <div className='w-full h-full'></div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Estadísticas del día */}
          <div className='bg-gray-50 p-4 border-t border-gray-200'>
            <h4 className='text-sm font-medium text-gray-900 mb-3'>
              Estadísticas del día
            </h4>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='text-lg font-semibold text-primary-600'>
                  {dayEvents.length}
                </div>
                <div className='text-xs text-gray-500'>Total</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-semibold text-emerald-600'>
                  {dayEvents.filter((e) => e.estado === 'confirmada').length}
                </div>
                <div className='text-xs text-gray-500'>Confirmados</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-semibold text-yellow-600'>
                  {dayEvents.filter((e) => e.estado === 'pendiente').length}
                </div>
                <div className='text-xs text-gray-500'>Pendientes</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-semibold text-blue-600'>
                  {calculateOccupancy(currentDate)}%
                </div>
                <div className='text-xs text-gray-500'>Ocupación</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderEventModal = () => {
    if (!showEventModal || !selectedEvent) return null

    return (
      <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
        <div className='bg-white rounded-lg shadow-xl max-w-md w-full mx-4'>
          <div className='p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Detalles del Evento
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                ×
              </button>
            </div>

            <div className='space-y-4'>
              <div className='flex items-center space-x-2'>
                <Clock className='w-4 h-4 text-gray-400' />
                <span className='text-sm text-gray-600'>
                  {format(selectedEvent.date, 'dd/MM/yyyy', { locale: es })} •{' '}
                  {selectedEvent.startTime} - {selectedEvent.endTime}
                </span>
              </div>

              <div className='flex items-center space-x-2'>
                <User className='w-4 h-4 text-gray-400' />
                <span className='text-sm text-gray-600'>
                  Profesor: {getProfesorName(selectedEvent.profesor)}
                </span>
              </div>

              <div className='flex items-center space-x-2'>
                <MapPin className='w-4 h-4 text-gray-400' />
                <span className='text-sm text-gray-600'>
                  {selectedEvent.cancha}
                </span>
              </div>

              <div
                className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                  CLASS_TYPES[selectedEvent.type]?.color ||
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {selectedEvent.type}
              </div>

              <div className='pt-2'>
                <h4 className='text-sm font-medium text-gray-900 mb-2'>
                  Participantes:
                </h4>
                {selectedEvent.alumno && (
                  <p className='text-sm text-gray-600'>
                    • {selectedEvent.alumno}
                  </p>
                )}
                {selectedEvent.alumnos &&
                  selectedEvent.alumnos.map((alumno, index) => (
                    <p key={index} className='text-sm text-gray-600'>
                      • {alumno}
                    </p>
                  ))}
              </div>

              {/* Estado actual */}
              <div className='pt-2'>
                <h4 className='text-sm font-medium text-gray-900 mb-2'>
                  Estado:
                </h4>
                <div
                  className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                    CLASS_STATES[selectedEvent.estado]?.color ||
                    'bg-gray-100 text-gray-800'
                  }`}
                >
                  {CLASS_STATES[selectedEvent.estado]?.icon}{' '}
                  {CLASS_STATES[selectedEvent.estado]?.label ||
                    selectedEvent.estado}
                </div>
              </div>

              {/* Acciones de estado */}
              <div className='pt-4'>
                <h4 className='text-sm font-medium text-gray-900 mb-2'>
                  Cambiar estado:
                </h4>
                <div className='flex flex-wrap gap-2'>
                  {Object.entries(CLASS_STATES).map(([state, config]) => (
                    <button
                      key={state}
                      onClick={() =>
                        handleChangeEventState(selectedEvent.id, state)
                      }
                      disabled={selectedEvent.estado === state}
                      className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                        selectedEvent.estado === state
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {config.icon} {config.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className='flex space-x-2 pt-4'>
                <button className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors'>
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className='flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors'
                >
                  Eliminar
                </button>
                <button
                  onClick={() => setShowEventModal(false)}
                  className='flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 📱 COMPONENTE DE NAVEGACIÓN MÓVIL
  const MobileNavigation = () => (
    <div className='lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40'>
      <div className='px-4 py-3'>
        {/* Header con título y botón de filtros */}
        <div className='flex items-center justify-between mb-3'>
          <h1 className='text-lg font-bold text-gray-900'>Calendario</h1>
          <div className='flex items-center space-x-2'>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => setShowFilters(!showFilters)}
              className='h-8 px-3 text-xs'
            >
              <Filter className='w-4 h-4 mr-1' />
              Filtros
              {showFilters ? (
                <ChevronUp className='w-3 h-3 ml-1' />
              ) : (
                <ChevronDown className='w-3 h-3 ml-1' />
              )}
            </Button>
            <Button
              variant='primary'
              size='sm'
              onClick={() => openEventModal(currentDate)}
              className='h-8 px-3 text-xs'
            >
              <Plus className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {/* Navegación de fecha */}
        <div className='flex items-center justify-between'>
          <Button
            variant='secondary'
            size='sm'
            onClick={
              view === 'month'
                ? prevMonth
                : () =>
                    setCurrentDate(
                      addDays(currentDate, view === 'week' ? -7 : -1)
                    )
            }
            className='h-8 w-8 rounded-full p-0'
          >
            <ArrowLeft className='w-4 h-4' />
          </Button>

          <div className='text-center flex-1 px-3'>
            <h2 className='text-sm font-semibold text-gray-900 leading-tight'>
              {view === 'month' &&
                format(currentDate, 'MMMM yyyy', { locale: es })}
              {view === 'week' &&
                `${format(
                  startOfWeek(currentDate, { weekStartsOn: 1 }),
                  'dd MMM',
                  { locale: es }
                )} - ${format(
                  endOfWeek(currentDate, { weekStartsOn: 1 }),
                  'dd MMM',
                  { locale: es }
                )}`}
              {view === 'day' &&
                format(currentDate, "dd 'de' MMM", {
                  locale: es
                })}
            </h2>
            <p className='text-xs text-gray-500'>
              {isToday(currentDate) && view === 'day'
                ? 'HOY'
                : view === 'month'
                ? 'Toca un día para ver detalles'
                : view === 'week'
                ? 'Desliza para navegar'
                : 'Vista diaria'}
            </p>
          </div>

          <Button
            variant='secondary'
            size='sm'
            onClick={
              view === 'month'
                ? nextMonth
                : () =>
                    setCurrentDate(
                      addDays(currentDate, view === 'week' ? 7 : 1)
                    )
            }
            className='h-8 w-8 rounded-full p-0'
          >
            <ArrowRight className='w-4 h-4' />
          </Button>
        </div>

        {/* Selector de vista */}
        <div className='flex justify-center mt-3'>
          <div className='inline-flex rounded-lg bg-gray-100 p-1'>
            {[
              { key: 'month', label: 'Mes', icon: CalendarIcon },
              { key: 'week', label: 'Sem', icon: Users },
              { key: 'day', label: 'Día', icon: Clock }
            ].map(({ key, label, icon: Icon }) => (
              <Button
                key={key}
                variant={view === key ? 'primary' : 'secondary'}
                size='sm'
                onClick={() => setView(key)}
                className={cn(
                  'h-7 px-3 text-xs font-medium transition-all duration-200 shadow-none border-0',
                  view === key
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'bg-transparent text-gray-600'
                )}
              >
                <Icon className='w-3 h-3 mr-1' />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Indicador de swipe */}
        <div className='flex justify-center mt-2'>
          <div className='flex items-center space-x-1 text-xs text-gray-400'>
            <ArrowLeft className='w-3 h-3' />
            <span>Desliza para navegar</span>
            <ArrowRight className='w-3 h-3' />
          </div>
        </div>
      </div>

      {/* Filtros colapsables */}
      {showFilters && (
        <div className='px-4 py-3 bg-gray-50 border-t border-gray-200 animate-in slide-in-from-top duration-200'>
          <div className='space-y-3'>
            {/* Búsqueda rápida */}
            <div>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <Input
                  type='text'
                  placeholder='Buscar...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='pl-9 pr-4 h-9 text-sm border-gray-200 rounded-lg'
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                  >
                    <X className='w-4 h-4' />
                  </button>
                )}
              </div>
            </div>

            {/* Filtros compactos */}
            <div className='grid grid-cols-2 gap-2'>
              <Select value={filterProfesor} onValueChange={setFilterProfesor}>
                <SelectTrigger className='h-9 text-sm border-gray-200 rounded-lg'>
                  <SelectValue placeholder='Profesor' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='TODOS'>Profesores</SelectItem>
                  {profesores.map((profesor) => (
                    <SelectItem
                      key={profesor.id_profesor}
                      value={profesor.id_profesor}
                    >
                      {profesor.nombre_completo.split(' ')[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterCancha} onValueChange={setFilterCancha}>
                <SelectTrigger className='h-9 text-sm border-gray-200 rounded-lg'>
                  <SelectValue placeholder='Cancha' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='TODAS'>Canchas</SelectItem>
                  {canchas.map((court) => (
                    <SelectItem key={court.id_cancha} value={court.nombre}>
                      {court.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estadísticas rápidas */}
            <div className='flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-200'>
              <span>Eventos: {filteredEvents.length}</span>
              <span>Ocupación: {calculateOccupancy()}%</span>
              {(filterProfesor !== 'TODOS' ||
                filterCancha !== 'TODAS' ||
                searchTerm) && (
                <button
                  onClick={() => {
                    setFilterProfesor('TODOS')
                    setFilterCancha('TODAS')
                    setSearchTerm('')
                  }}
                  className='text-primary-600 font-medium'
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // 📱 VISTA MENSUAL MÓVIL OPTIMIZADA
  const renderMobileMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

    const rows = []
    let days = []
    let day = startDate

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayEvents = getEventsForDate(day).filter((event) =>
          filteredEvents.includes(event)
        )

        days.push(
          <div
            key={day.toString()}
            className={cn(
              'min-h-16 border-r border-b border-gray-100 p-1 cursor-pointer active:bg-gray-100 transition-colors',
              !isSameMonth(day, currentDate)
                ? 'bg-gray-50 text-gray-400'
                : 'bg-white',
              isToday(day) ? 'bg-primary-50 ring-2 ring-primary-200' : ''
            )}
            onClick={() => {
              setCurrentDate(day)
              setView('day')
            }}
          >
            <div
              className={cn(
                'text-xs font-medium mb-1 text-center',
                isToday(day) ? 'text-primary-600 font-bold' : 'text-gray-700'
              )}
            >
              {format(day, 'd')}
            </div>

            {/* Indicadores de eventos */}
            <div className='space-y-0.5'>
              {dayEvents.slice(0, 2).map((event) => (
                <div
                  key={event.id}
                  className='h-1.5 rounded-full bg-primary-500 opacity-80'
                  title={event.title}
                />
              ))}
              {dayEvents.length > 2 && (
                <div className='text-xs text-center text-gray-500 font-medium'>
                  +{dayEvents.length - 2}
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className='grid grid-cols-7'>
          {days}
        </div>
      )
      days = []
    }

    return (
      <Card className='shadow-sm border-0'>
        <CardContent className='p-0'>
          {/* Header días de la semana */}
          <div className='grid grid-cols-7 bg-primary-50 border-b border-gray-200'>
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day) => (
              <div
                key={day}
                className='p-2 text-center text-xs font-semibold text-primary-700'
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendario */}
          <div
            ref={calendarRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className='touch-pan-y'
          >
            {rows}
          </div>

          {/* Información del día seleccionado */}
          {isToday(currentDate) && (
            <div className='p-3 bg-primary-50 border-t border-primary-200'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <div className='w-2 h-2 bg-primary-500 rounded-full animate-pulse' />
                  <span className='text-sm font-medium text-primary-700'>
                    Hoy tienes {getEventsForDate(new Date()).length} eventos
                  </span>
                </div>
                <Button
                  variant='primary'
                  size='sm'
                  onClick={() => setView('day')}
                  className='h-7 px-3 text-xs'
                >
                  Ver detalles
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // 📱 VISTA SEMANAL MÓVIL OPTIMIZADA - FORMATO AGENDA
  const renderMobileWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDays = []
    let day = weekStart
    while (day <= weekEnd) {
      weekDays.push(day)
      day = addDays(day, 1)
    }

    // Horas optimizadas para móvil (slots de 30 minutos)
    const mobileTimeSlots = [
      '08:00',
      '08:30',
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '12:00',
      '12:30',
      '13:00',
      '13:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
      '16:00',
      '16:30',
      '17:00',
      '17:30',
      '18:00',
      '18:30',
      '19:00',
      '19:30',
      '20:00',
      '20:30',
      '21:00',
      '21:30',
      '22:00'
    ]

    return (
      <Card className='shadow-sm border-0'>
        <CardContent className='p-0'>
          {/* Header de la semana */}
          <div className='p-3 bg-primary-50 border-b border-gray-200'>
            <div className='flex items-center justify-between'>
              <h3 className='font-semibold text-sm text-primary-700'>
                {format(weekStart, 'dd MMM', { locale: es })} -{' '}
                {format(weekEnd, 'dd MMM', { locale: es })}
              </h3>
              <Badge
                variant='outline'
                className='text-xs bg-primary-100 text-primary-700 border-primary-300'
              >
                {weekDays.reduce((total, day) => {
                  return (
                    total +
                    events.filter(
                      (event) =>
                        isSameDay(event.date, day) &&
                        filteredEvents.includes(event)
                    ).length
                  )
                }, 0)}{' '}
                eventos
              </Badge>
            </div>
          </div>

          {/* Grid de agenda semanal */}
          <div className='overflow-x-auto'>
            <div className='min-w-full'>
              {/* Header con días de la semana */}
              <div className='flex bg-gray-50 border-b border-gray-200 sticky top-0 z-10'>
                <div className='flex-shrink-0 w-14 p-2 text-center text-xs font-medium text-gray-500'>
                  Hora
                </div>
                {weekDays.map((day) => (
                  <div
                    key={day.toString()}
                    className={cn(
                      'flex-1 min-w-16 p-2 text-center border-l border-gray-200 cursor-pointer active:bg-gray-100',
                      isToday(day) ? 'bg-primary-100' : 'bg-gray-50'
                    )}
                    onClick={() => {
                      setCurrentDate(day)
                      setView('day')
                    }}
                  >
                    <div
                      className={cn(
                        'text-xs font-medium',
                        isToday(day) ? 'text-primary-700' : 'text-gray-600'
                      )}
                    >
                      {format(day, 'EEE', { locale: es }).toUpperCase()}
                    </div>
                    <div
                      className={cn(
                        'text-sm font-bold mt-1',
                        isToday(day) ? 'text-primary-800' : 'text-gray-900'
                      )}
                    >
                      {format(day, 'd')}
                    </div>
                    {isToday(day) && (
                      <div className='text-xs text-primary-600 font-medium'>
                        HOY
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Grid de horarios */}
              <div className='divide-y divide-gray-100'>
                {mobileTimeSlots.map((time) => (
                  <div key={time} className='flex min-h-16'>
                    {/* Columna de hora */}
                    <div className='flex-shrink-0 w-14 p-2 text-center border-r border-gray-200 bg-gray-50'>
                      <div className='text-xs font-medium text-gray-700'>
                        {time}
                      </div>
                    </div>

                    {/* Columnas de días */}
                    {weekDays.map((day) => {
                      // Buscar eventos que ocupen este slot específico
                      const slotEvents = events.filter(
                        (event) =>
                          isSameDay(event.date, day) &&
                          filteredEvents.includes(event) &&
                          getEventSlots(event).includes(time)
                      )

                      // Filtrar solo los eventos que empiezan en este slot
                      const startingEvents = slotEvents.filter((event) =>
                        isSlotStart(event, time)
                      )

                      const isAnySlotOccupied = slotEvents.length > 0

                      return (
                        <div
                          key={day.toString()}
                          className={cn(
                            'flex-1 min-w-16 p-1 border-l border-gray-200 relative',
                            isToday(day) ? 'bg-primary-25' : 'bg-white'
                          )}
                          style={{
                            minHeight:
                              startingEvents.length > 0
                                ? `${
                                    Math.max(
                                      ...startingEvents.map((e) =>
                                        calculateEventSlots(e)
                                      )
                                    ) * 3.5
                                  }rem`
                                : '3.5rem'
                          }}
                        >
                          {startingEvents.length === 0 ? (
                            <button
                              onClick={() =>
                                handleSlotClick('Cancha 1', time, day)
                              }
                              disabled={isAnySlotOccupied}
                              className={cn(
                                'w-full h-14 border border-dashed rounded transition-colors flex items-center justify-center',
                                isAnySlotOccupied
                                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                  : isToday(day)
                                  ? 'border-primary-200 hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100'
                                  : 'border-gray-300 hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100'
                              )}
                            >
                              {!isAnySlotOccupied && (
                                <Plus className='w-3 h-3 text-gray-400' />
                              )}
                              {isAnySlotOccupied && (
                                <div className='w-full h-full bg-gray-100 border border-gray-300 rounded flex items-center justify-center'>
                                  <span className='text-xs text-gray-400 font-medium'>
                                    Ocupado
                                  </span>
                                </div>
                              )}
                            </button>
                          ) : (
                            <div className='space-y-1'>
                              {startingEvents.slice(0, 1).map((event) => (
                                <div
                                  key={event.id}
                                  className={cn(
                                    'absolute top-0 left-0 right-0 p-1.5 rounded text-xs cursor-pointer active:scale-95 transition-all duration-150 border-l-2 flex flex-col justify-center z-10',
                                    getEventTypeColor(event.type),
                                    'bg-opacity-90 hover:bg-opacity-100 shadow-sm'
                                  )}
                                  style={{
                                    height: `${
                                      calculateEventSlots(event) * 3.5
                                    }rem`, // 3.5rem por slot en vista semanal móvil
                                    borderLeftColor:
                                      event.estado === 'confirmada'
                                        ? '#10b981'
                                        : event.estado === 'pendiente'
                                        ? '#f59e0b'
                                        : '#ef4444'
                                  }}
                                  onClick={() => {
                                    setSelectedEvent(event)
                                    setShowEventModal(true)
                                  }}
                                >
                                  <div className='font-medium truncate text-xs leading-tight'>
                                    {event.title.split(' - ')[1] || event.title}
                                  </div>
                                  <div className='truncate text-xs text-gray-600 mt-0.5 leading-tight'>
                                    {event.cancha.replace('Cancha ', 'C')}
                                  </div>
                                  <div className='flex items-center justify-between mt-0.5'>
                                    <span className='text-xs text-gray-500'>
                                      {event.startTime}-{event.endTime}
                                    </span>
                                    <span className='text-xs'>
                                      {CLASS_STATES[event.estado]?.icon || '⏳'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                              {startingEvents.length > 1 && (
                                <div
                                  className='text-center py-1 text-xs text-gray-500 cursor-pointer hover:text-primary-600 bg-gray-50 rounded border border-gray-200'
                                  onClick={() => {
                                    setCurrentDate(day)
                                    setView('day')
                                  }}
                                >
                                  +{startingEvents.length - 1} más
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Resumen semanal */}
          <div className='p-3 bg-gray-50 border-t border-gray-200'>
            <div className='grid grid-cols-4 gap-2 text-center'>
              <div>
                <div className='text-sm font-semibold text-gray-900'>
                  {weekDays.reduce((total, day) => {
                    return (
                      total +
                      events.filter(
                        (event) =>
                          isSameDay(event.date, day) &&
                          filteredEvents.includes(event)
                      ).length
                    )
                  }, 0)}
                </div>
                <div className='text-xs text-gray-500'>Total</div>
              </div>
              <div>
                <div className='text-sm font-semibold text-emerald-600'>
                  {weekDays.reduce((total, day) => {
                    return (
                      total +
                      events.filter(
                        (event) =>
                          isSameDay(event.date, day) &&
                          filteredEvents.includes(event) &&
                          event.estado === 'confirmada'
                      ).length
                    )
                  }, 0)}
                </div>
                <div className='text-xs text-gray-500'>Confirmados</div>
              </div>
              <div>
                <div className='text-sm font-semibold text-yellow-600'>
                  {weekDays.reduce((total, day) => {
                    return (
                      total +
                      events.filter(
                        (event) =>
                          isSameDay(event.date, day) &&
                          filteredEvents.includes(event) &&
                          event.estado === 'pendiente'
                      ).length
                    )
                  }, 0)}
                </div>
                <div className='text-xs text-gray-500'>Pendientes</div>
              </div>
              <div>
                <div className='text-sm font-semibold text-blue-600'>
                  {Math.round(
                    (weekDays.reduce((total, day) => {
                      return (
                        total +
                        events.filter(
                          (event) =>
                            isSameDay(event.date, day) &&
                            filteredEvents.includes(event)
                        ).length
                      )
                    }, 0) /
                      (mobileTimeSlots.length * 7)) *
                      100
                  )}
                  %
                </div>
                <div className='text-xs text-gray-500'>Ocupación</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // 📱 VISTA DIARIA MÓVIL OPTIMIZADA
  const renderMobileDayView = () => {
    const dayEvents = getEventsForDate(currentDate).filter((event) =>
      filteredEvents.includes(event)
    )

    // Agrupar eventos por hora (solo eventos que empiezan en cada slot)
    const eventsByHour = {}
    TIME_SLOTS.forEach((time) => {
      eventsByHour[time] = dayEvents.filter((event) => isSlotStart(event, time))
    })

    return (
      <div className='space-y-3'>
        {/* Header del día */}
        <Card className='shadow-sm border-0'>
          <CardContent className='p-4'>
            <div className='text-center'>
              <h2 className='text-xl font-bold text-gray-900'>
                {format(currentDate, 'EEEE', { locale: es })}
              </h2>
              <p className='text-lg text-gray-600'>
                {format(currentDate, "dd 'de' MMMM, yyyy", { locale: es })}
              </p>
              {isToday(currentDate) && (
                <Badge className='mt-2 bg-primary-100 text-primary-700'>
                  HOY
                </Badge>
              )}
            </div>

            {/* Estadísticas del día */}
            <div className='grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200'>
              <div className='text-center'>
                <div className='text-lg font-semibold text-primary-600'>
                  {dayEvents.length}
                </div>
                <div className='text-xs text-gray-500'>Total</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-semibold text-emerald-600'>
                  {dayEvents.filter((e) => e.estado === 'confirmada').length}
                </div>
                <div className='text-xs text-gray-500'>Confirmados</div>
              </div>
              <div className='text-center'>
                <div className='text-lg font-semibold text-blue-600'>
                  {calculateOccupancy(currentDate)}%
                </div>
                <div className='text-xs text-gray-500'>Ocupación</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timeline de eventos */}
        <Card className='shadow-sm border-0'>
          <CardContent className='p-0'>
            <div className='divide-y divide-gray-100'>
              {TIME_SLOTS.map((time) => {
                const timeEvents = eventsByHour[time] || []

                return (
                  <div key={time} className='p-3'>
                    <div className='flex items-start space-x-3'>
                      {/* Hora */}
                      <div className='flex-shrink-0 w-12 text-right'>
                        <span className='text-xs font-semibold text-gray-700'>
                          {time}
                        </span>
                      </div>

                      {/* Contenido */}
                      <div className='flex-1 min-w-0'>
                        {(() => {
                          const isOccupied = isSlotOccupied(
                            canchas[0]?.nombre || 'Cancha 1',
                            time,
                            currentDate
                          )

                          return timeEvents.length === 0 ? (
                            <button
                              onClick={() =>
                                handleSlotClick(
                                  canchas[0]?.nombre || 'Cancha 1',
                                  time,
                                  currentDate
                                )
                              }
                              disabled={isOccupied}
                              className={cn(
                                'w-full p-2 border-2 border-dashed rounded-lg transition-colors',
                                isOccupied
                                  ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                  : 'border-gray-300 text-gray-400 hover:border-primary-400 hover:text-primary-600 active:bg-primary-50'
                              )}
                            >
                              {!isOccupied ? (
                                <Plus className='w-4 h-4 mx-auto' />
                              ) : (
                                <span className='text-xs text-gray-500 font-medium'>
                                  Ocupado
                                </span>
                              )}
                            </button>
                          ) : (
                            <div className='space-y-2'>
                              {timeEvents.map((event) => (
                                <div
                                  key={event.id}
                                  className={cn(
                                    'p-3 rounded-lg border-l-4 cursor-pointer active:scale-95 transition-all duration-150',
                                    getEventTypeColor(event.type)
                                  )}
                                  style={{
                                    minHeight: `${
                                      calculateEventSlots(event) * 3
                                    }rem`, // 3rem por slot en móvil
                                    borderLeftColor:
                                      event.estado === 'confirmada'
                                        ? '#10b981'
                                        : event.estado === 'pendiente'
                                        ? '#f59e0b'
                                        : '#ef4444'
                                  }}
                                  onClick={() => {
                                    setSelectedEvent(event)
                                    setShowEventModal(true)
                                  }}
                                >
                                  <div className='flex items-center justify-between'>
                                    <div className='flex-1 min-w-0'>
                                      <h4 className='font-medium text-sm text-gray-900 truncate'>
                                        {event.title}
                                      </h4>
                                      <div className='mt-1 space-y-1'>
                                        <div className='flex items-center text-xs text-gray-600'>
                                          <MapPin className='w-3 h-3 mr-1' />
                                          <span>{event.cancha}</span>
                                          <span className='mx-2'>•</span>
                                          <span>
                                            {event.startTime} - {event.endTime}
                                          </span>
                                        </div>
                                        <div className='flex items-center text-xs text-gray-600'>
                                          <Users className='w-3 h-3 mr-1' />
                                          <span className='truncate'>
                                            {event.alumno}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className='ml-2 flex-shrink-0 text-lg'>
                                      {CLASS_STATES[event.estado]?.icon || '⏳'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Botón flotante para crear evento */}
        <div className='fixed bottom-6 right-6 z-30'>
          <Button
            variant='primary'
            size='lg'
            onClick={() => openEventModal(currentDate)}
            className='h-14 w-14 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition-all duration-200'
          >
            <Plus className='w-6 h-6' />
          </Button>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-96 bg-gray-50'>
        <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  return (
    <div className={cn(designTokens.backgrounds.page, 'min-h-screen')}>
      {/* 📱 VERSIÓN MÓVIL */}
      {isMobile ? (
        <div className='pb-6'>
          <MobileNavigation />

          <div className='px-3 py-4 space-y-4'>
            {/* Vista principal */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className='touch-pan-y'
            >
              {view === 'month' && renderMobileMonthView()}
              {view === 'week' && renderMobileWeekView()}
              {view === 'day' && renderMobileDayView()}
            </div>

            {/* Indicador de navegación por gestos */}
            <div className='text-center'>
              <div className='inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500'>
                <ArrowLeft className='w-3 h-3' />
                <span>Desliza para navegar</span>
                <ArrowRight className='w-3 h-3' />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* 💻 VERSIÓN DESKTOP (CÓDIGO ORIGINAL) */
        <div className='space-y-6 px-2 py-4 sm:px-4 md:px-8'>
          {/* Header */}
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <h1
                className={cn(
                  designTokens.typography.h1,
                  designTokens.text.primary
                )}
              >
                Calendario
              </h1>
              <p
                className={cn(
                  designTokens.typography.body,
                  designTokens.text.secondary,
                  'mt-1'
                )}
              >
                Gestiona las clases y horarios del club de pádel
              </p>
              <div className='flex items-center space-x-2 mt-2'>
                <div
                  className={cn(
                    'flex items-center space-x-1 text-xs bg-primary-50 text-primary-700 px-2 py-1',
                    designTokens.rounded.input
                  )}
                >
                  <span>💡</span>
                  <span>Arrastra las clases para moverlas entre días</span>
                </div>
              </div>
            </div>
            <Button
              variant='primary'
              size='default'
              className='mt-4 sm:mt-0'
              onClick={() => openEventModal(currentDate)}
            >
              <Plus className='w-4 h-4 mr-2' />
              Nueva Clase
            </Button>
          </div>

          {/* Statistics Cards */}
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <span
                    className={cn(
                      designTokens.typography.caption,
                      designTokens.text.secondary,
                      'font-medium'
                    )}
                  >
                    Clases Hoy
                  </span>
                  <CalendarIcon className='h-4 w-4 text-primary-600' />
                </div>
                <div
                  className={cn(
                    designTokens.typography.h2,
                    designTokens.text.primary,
                    'mt-2'
                  )}
                >
                  {getEventsForDate(new Date()).length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <span
                    className={cn(
                      designTokens.typography.caption,
                      designTokens.text.secondary,
                      'font-medium'
                    )}
                  >
                    Ocupación Hoy
                  </span>
                  <TrendingUp className='h-4 w-4 text-emerald-600' />
                </div>
                <div
                  className={cn(
                    designTokens.typography.h2,
                    designTokens.text.primary,
                    'mt-2'
                  )}
                >
                  {calculateOccupancy(new Date())}%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <span
                    className={cn(
                      designTokens.typography.caption,
                      designTokens.text.secondary,
                      'font-medium'
                    )}
                  >
                    Profesores Activos
                  </span>
                  <User className='h-4 w-4 text-purple-600' />
                </div>
                <div
                  className={cn(
                    designTokens.typography.h2,
                    designTokens.text.primary,
                    'mt-2'
                  )}
                >
                  {profesores.length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <span
                    className={cn(
                      designTokens.typography.caption,
                      designTokens.text.secondary,
                      'font-medium'
                    )}
                  >
                    Canchas Totales
                  </span>
                  <MapPin className='h-4 w-4 text-orange-600' />
                </div>
                <div
                  className={cn(
                    designTokens.typography.h2,
                    designTokens.text.primary,
                    'mt-2'
                  )}
                >
                  {canchas.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Navigation and Controls */}
          <Card>
            <CardContent className='p-6'>
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
                {/* Navigation */}
                <div className='flex items-center space-x-4'>
                  <div className='flex items-center space-x-2'>
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={
                        view === 'month'
                          ? prevMonth
                          : () =>
                              setCurrentDate(
                                addDays(currentDate, view === 'week' ? -7 : -1)
                              )
                      }
                    >
                      <ChevronLeft className='w-4 h-4' />
                    </Button>
                    <h2 className='text-lg font-semibold text-gray-900 min-w-48 text-center'>
                      {view === 'month' &&
                        format(currentDate, 'MMMM yyyy', { locale: es })}
                      {view === 'week' &&
                        `${format(
                          startOfWeek(currentDate, { weekStartsOn: 1 }),
                          'dd MMM',
                          { locale: es }
                        )} - ${format(
                          endOfWeek(currentDate, { weekStartsOn: 1 }),
                          'dd MMM yyyy',
                          { locale: es }
                        )}`}
                      {view === 'day' &&
                        format(currentDate, "EEEE, dd 'de' MMMM yyyy", {
                          locale: es
                        })}
                    </h2>
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={
                        view === 'month'
                          ? nextMonth
                          : () =>
                              setCurrentDate(
                                addDays(currentDate, view === 'week' ? 7 : 1)
                              )
                      }
                    >
                      <ChevronRight className='w-4 h-4' />
                    </Button>
                  </div>

                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setCurrentDate(new Date())}
                  >
                    <Home className='w-4 h-4 mr-2' />
                    Hoy
                  </Button>
                </div>

                {/* View Selector */}
                <div className='flex items-center space-x-2'>
                  <div className='flex rounded-lg bg-gray-100 p-1'>
                    {[
                      { key: 'month', label: 'Mes', icon: CalendarIcon },
                      { key: 'week', label: 'Semana', icon: Users },
                      { key: 'day', label: 'Día', icon: Clock }
                    ].map(({ key, label, icon: Icon }) => (
                      <Button
                        key={key}
                        variant={view === key ? 'primary' : 'secondary'}
                        size='sm'
                        onClick={() => setView(key)}
                        className={cn(
                          'shadow-none border-0',
                          view === key
                            ? 'bg-white text-primary-700 shadow-sm'
                            : 'bg-transparent text-gray-600'
                        )}
                      >
                        <Icon className='w-4 h-4 mr-2' />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className='p-6'>
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
                <div className='flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4'>
                  {/* Search */}
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                    <Input
                      type='text'
                      placeholder='Buscar eventos...'
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className='pl-10 w-full sm:w-64'
                    />
                  </div>

                  {/* Filters */}
                  <div className='flex flex-wrap items-center gap-3'>
                    <Select
                      value={filterProfesor}
                      onValueChange={setFilterProfesor}
                    >
                      <SelectTrigger className='w-48'>
                        <SelectValue placeholder='Filtrar por profesor' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='TODOS'>
                          Todos los profesores
                        </SelectItem>
                        {profesores.map((profesor) => (
                          <SelectItem
                            key={profesor.id_profesor}
                            value={profesor.id_profesor}
                          >
                            {profesor.nombre_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={filterTipo} onValueChange={setFilterTipo}>
                      <SelectTrigger className='w-48'>
                        <SelectValue placeholder='Filtrar por tipo' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='TODOS'>Todos los tipos</SelectItem>
                        {Object.keys(CLASS_TYPES).map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={filterCancha}
                      onValueChange={setFilterCancha}
                    >
                      <SelectTrigger className='w-48'>
                        <SelectValue placeholder='Filtrar por cancha' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='TODAS'>Todas las canchas</SelectItem>
                        {canchas.map((court) => (
                          <SelectItem
                            key={court.id_cancha}
                            value={court.nombre}
                          >
                            {court.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Clear filters */}
                {(filterProfesor !== 'TODOS' ||
                  filterTipo !== 'TODOS' ||
                  filterCancha !== 'TODAS' ||
                  searchTerm) && (
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => {
                      setFilterProfesor('TODOS')
                      setFilterTipo('TODOS')
                      setFilterCancha('TODAS')
                      setSearchTerm('')
                    }}
                  >
                    <X className='w-4 h-4 mr-2' />
                    Limpiar filtros
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Calendar Views */}
          {view === 'month' && renderMonthView()}
          {view === 'week' && renderWeekView()}
          {view === 'day' && renderDayView()}

          {/* Legend */}
          <Card>
            <CardContent className='p-6'>
              <h3 className='text-lg font-semibold text-gray-900 mb-4'>
                Leyenda
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {/* Tipos de clase */}
                <div>
                  <h4 className='font-medium text-gray-700 mb-3'>
                    Tipos de Clase
                  </h4>
                  <div className='space-y-2'>
                    {Object.entries(CLASS_TYPES).map(([type, config]) => (
                      <div key={type} className='flex items-center space-x-2'>
                        <config.icon className='w-4 h-4 text-gray-600' />
                        <div
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            config.color
                          )}
                        >
                          {type}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estados */}
                <div>
                  <h4 className='font-medium text-gray-700 mb-3'>Estados</h4>
                  <div className='space-y-2'>
                    {Object.entries(CLASS_STATES).map(([state, config]) => (
                      <div key={state} className='flex items-center space-x-2'>
                        <span className='text-sm'>{config.icon}</span>
                        <div
                          className={cn(
                            'px-2 py-1 rounded text-xs font-medium',
                            config.color
                          )}
                        >
                          {config.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Canchas */}
                <div>
                  <h4 className='font-medium text-gray-700 mb-3'>Canchas</h4>
                  <div className='space-y-2'>
                    {canchas.slice(0, 6).map((court) => (
                      <div
                        key={court.id_cancha}
                        className='flex items-center space-x-2'
                      >
                        <div
                          className={cn(
                            'w-4 h-4 rounded',
                            getCourtColor(court.nombre)
                          )}
                        />
                        <span className='text-sm text-gray-600'>
                          {court.nombre}
                        </span>
                        <Badge
                          variant='outline'
                          className={cn(
                            'text-xs',
                            court.tipo === 'indoor'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-green-100 text-green-800 border-green-300'
                          )}
                        >
                          {court.tipo}
                        </Badge>
                      </div>
                    ))}
                    {canchas.length > 6 && (
                      <p className='text-xs text-gray-500'>
                        +{canchas.length - 6} canchas más
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Statistics summary */}
              <div className='mt-6 pt-6 border-t border-gray-200'>
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
                  <div>
                    <div className='text-lg font-semibold text-gray-900'>
                      {filteredEvents.length}
                    </div>
                    <div className='text-xs text-gray-500'>
                      Eventos filtrados
                    </div>
                  </div>
                  <div>
                    <div className='text-lg font-semibold text-emerald-600'>
                      {
                        filteredEvents.filter((e) => e.estado === 'confirmada')
                          .length
                      }
                    </div>
                    <div className='text-xs text-gray-500'>Confirmados</div>
                  </div>
                  <div>
                    <div className='text-lg font-semibold text-yellow-600'>
                      {
                        filteredEvents.filter((e) => e.estado === 'pendiente')
                          .length
                      }
                    </div>
                    <div className='text-xs text-gray-500'>Pendientes</div>
                  </div>
                  <div>
                    <div className='text-lg font-semibold text-blue-600'>
                      {calculateOccupancy()}%
                    </div>
                    <div className='text-xs text-gray-500'>Ocupación total</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modales (compartidos entre móvil y desktop) */}
      {renderEventModal()}

      <NewEventModal
        open={showEventModal && !selectedEvent}
        onClose={() => {
          setShowEventModal(false)
          setSelectedSlot(null)
        }}
        onSave={handleSaveEvent}
        selectedDate={selectedDate}
        profesores={profesores}
        alumnos={alumnos}
        canchas={canchas}
        inscripciones={inscripciones}
        paquetes={paquetes}
        initialData={
          selectedSlot
            ? {
                cancha: selectedSlot.courtName,
                startTime: selectedSlot.time,
                endTime: (() => {
                  const [hours, minutes] = selectedSlot.time.split(':')
                  const endTime = new Date()
                  endTime.setHours(parseInt(hours) + 1, parseInt(minutes), 0, 0)
                  return endTime.toTimeString().substring(0, 5)
                })()
              }
            : null
        }
      />

      <ConflictModal
        open={showConflictModal}
        onClose={() => setShowConflictModal(false)}
        conflictData={conflictData}
        onForceSave={handleForceSave}
        onApplySuggestion={handleApplySuggestion}
      />

      {/* Messages */}
      {message.text && (
        <div
          className={cn(
            'fixed z-50 max-w-md',
            isMobile ? 'bottom-20 left-4 right-4' : 'bottom-4 right-4'
          )}
        >
          <Alert
            variant={
              message.type === 'success'
                ? 'success'
                : message.type === 'warning'
                ? 'warning'
                : 'error'
            }
            className={cn(designTokens.shadows.elevated)}
          >
            {message.text}
          </Alert>
        </div>
      )}
    </div>
  )
}
