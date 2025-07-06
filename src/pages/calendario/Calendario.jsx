import { useState, useEffect } from 'react'
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
  isToday
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
  Search
} from 'lucide-react'
import { db } from '../../lib/supabase'
import { NewEventModal } from '../../components/NewEventModal'

const COURT_COLORS = {
  'Cancha 1': 'bg-blue-500',
  'Cancha 2': 'bg-green-500',
  'Cancha 3': 'bg-purple-500',
  'Cancha 4': 'bg-orange-500'
}

const CLASS_TYPES = {
  'Clase Individual': {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: User
  },
  'Clase Grupal': {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Users
  },
  Entrenamiento: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Clock
  },
  Academia: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: CalendarIcon
  }
}

export function Calendario() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState('month') // 'month', 'week', 'day'
  const [events, setEvents] = useState([])
  const [profesores, setProfesores] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [selectedDate, setSelectedDate] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterProfesor, setFilterProfesor] = useState('TODOS')
  const [filterTipo, setFilterTipo] = useState('TODOS')
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedEvent, setDraggedEvent] = useState(null)
  const [dragOverDate, setDragOverDate] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Función para mostrar mensajes
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 3000)
  }

  // Función para refrescar datos del calendario
  const refrescarDatos = async () => {
    try {
      const { data, error } = await db.getAsistencias()
      if (!error && data) {
        const transformedEvents = data.map(transformAsistenciaToEvent)
        setEvents(transformedEvents)
      }
    } catch (error) {
      console.error('Error al refrescar datos:', error)
    }
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
    },
    {
      id: 3,
      title: 'Entrenamiento Avanzado',
      date: addDays(new Date(), 2),
      startTime: '18:00',
      endTime: '19:30',
      type: 'Entrenamiento',
      profesor: 'PROF001',
      alumnos: ['Pedro Ruiz', 'Laura Sánchez'],
      cancha: 'Cancha 3',
      estado: 'pendiente'
    }
  ]

  // Función para transformar datos de asistencias de la BD al formato del componente
  const transformAsistenciaToEvent = (asistencia) => {
    return {
      id: asistencia.id_asistencia,
      title: asistencia.codigo_paquete
        ? `${asistencia.codigo_paquete} - ${
            asistencia.alumnos?.nombre_completo || 'Sin alumno'
          }`
        : 'Clase',
      date: new Date(asistencia.fecha_clase),
      startTime: asistencia.hora_clase
        ? asistencia.hora_clase.substring(0, 5)
        : '00:00',
      endTime: asistencia.hora_clase
        ? new Date(
            new Date(`2000-01-01T${asistencia.hora_clase}`).getTime() +
              90 * 60000
          )
            .toTimeString()
            .substring(0, 5)
        : '01:30',
      type: asistencia.codigo_paquete || 'Clase',
      profesor: asistencia.id_profesor,
      alumno: asistencia.alumnos?.nombre_completo || 'Sin alumno',
      cancha: asistencia.academia || 'Sin cancha',
      estado: asistencia.confirmado ? 'confirmada' : 'pendiente',
      // Datos adicionales de la base de datos
      cedula_alumno: asistencia.cedula_alumno,
      codigo_paquete: asistencia.codigo_paquete,
      confirmado: asistencia.confirmado
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [profesoresData, alumnosData, asistenciasData] =
          await Promise.all([
            db.getProfesores(),
            db.getAlumnos(),
            db.getAsistencias()
          ])

        if (!profesoresData.error) setProfesores(profesoresData.data || [])
        if (!alumnosData.error) setAlumnos(alumnosData.data || [])

        if (!asistenciasData.error && asistenciasData.data) {
          const transformedEvents = asistenciasData.data.map(
            transformAsistenciaToEvent
          )
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
    const matchSearch =
      searchTerm === '' ||
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.alumno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.alumnos?.some((alumno) =>
        alumno.toLowerCase().includes(searchTerm.toLowerCase())
      )

    return matchProfesor && matchTipo && matchSearch
  })

  const getProfesorName = (profesorId) => {
    const profesor = profesores.find((p) => p.id_profesor === profesorId)
    return profesor ? profesor.nombre_completo : profesorId
  }

  // Handler para guardar nuevos eventos
  const handleSaveEvent = async (eventData) => {
    try {
      // Transformar los datos del evento al formato de la base de datos
      const asistenciaData = {
        id_asistencia: `AST-${Date.now()}`, // Generar ID único
        cedula_alumno:
          eventData.students && eventData.students.length > 0
            ? eventData.students[0]
            : null,
        id_profesor: eventData.profesor,
        codigo_paquete: eventData.type === 'Clase Individual' ? 'IND' : 'GRP',
        fecha_clase: eventData.date.toISOString().split('T')[0], // Formato YYYY-MM-DD
        hora_clase: eventData.startTime,
        academia: eventData.cancha,
        confirmado: true
      }

      // Guardar en la base de datos
      const { data, error } = await db.addAsistencia(asistenciaData)

      if (error) {
        console.error('Error al guardar asistencia:', error)
        throw error
      }

      // Si se guardó correctamente, refrescar los datos
      if (data && data.length > 0) {
        await refrescarDatos()
        showMessage('success', 'Evento guardado exitosamente')
        console.log('Evento guardado en BD:', data[0])
      }
    } catch (error) {
      console.error('Error saving event:', error)
      showMessage('error', 'Error al guardar el evento')
      throw error
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

    try {
      // Formatear la nueva fecha para la base de datos
      const nuevaFecha = targetDate.toISOString().split('T')[0]

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
            className={`min-h-32 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors drop-zone ${
              !isSameMonth(day, currentDate)
                ? 'bg-gray-50 text-gray-400'
                : 'bg-white'
            } ${isToday(day) ? 'ring-2 ring-blue-500' : ''} ${
              dragOverDate && dragOverDate.toDateString() === day.toDateString()
                ? 'drag-over'
                : ''
            }`}
            onClick={() => {
              setSelectedDate(day)
              setSelectedEvent(null)
              setShowEventModal(true)
            }}
            onDragOver={(e) => handleDragOver(e, day)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, day)}
          >
            <div
              className={`text-sm font-medium mb-1 ${
                isToday(day) ? 'text-blue-600' : ''
              }`}
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
                  } cursor-move`}
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
      <div className='bg-white rounded-lg border border-gray-200'>
        {/* Calendar header */}
        <div className='grid grid-cols-7 border-b border-gray-200'>
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div
              key={day}
              className='p-3 text-center text-sm font-medium text-gray-500 bg-gray-50'
            >
              {day}
            </div>
          ))}
        </div>
        {/* Calendar body */}
        <div>{rows}</div>
      </div>
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

              <div className='flex space-x-2 pt-4'>
                <button className='flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors'>
                  Editar
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

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-96 bg-gray-50'>
        <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  return (
    <div className='space-y-6 px-2 py-4 sm:px-4 md:px-8 bg-gray-50 min-h-screen'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Calendario</h1>
          <p className='text-gray-600 mt-1'>
            Gestiona las clases y horarios del club de pádel
          </p>
          <div className='flex items-center space-x-2 mt-2'>
            <div className='flex items-center space-x-1 text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded'>
              <span>💡</span>
              <span>Arrastra las clases para moverlas entre días</span>
            </div>
          </div>
        </div>
        <button
          className='mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center text-sm'
          onClick={() => {
            setSelectedEvent(null)
            setSelectedDate(new Date())
            setShowEventModal(true)
          }}
        >
          <Plus className='w-4 h-4 mr-2' />
          Nueva Clase
        </button>
      </div>

      {/* Statistics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white rounded-xl border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Clases Hoy
            </span>
            <CalendarIcon className='h-4 w-4 text-blue-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900 mt-2'>
            {getEventsForDate(new Date()).length}
          </div>
        </div>

        <div className='bg-white rounded-xl border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Esta Semana
            </span>
            <Clock className='h-4 w-4 text-green-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900 mt-2'>
            {events.length}
          </div>
        </div>

        <div className='bg-white rounded-xl border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Profesores Activos
            </span>
            <User className='h-4 w-4 text-purple-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900 mt-2'>
            {profesores.length}
          </div>
        </div>

        <div className='bg-white rounded-xl border border-gray-200 p-6'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Canchas Disponibles
            </span>
            <MapPin className='h-4 w-4 text-orange-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900 mt-2'>4</div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className='bg-white rounded-xl border border-gray-200 p-6'>
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0'>
          {/* Calendar Navigation */}
          <div className='flex items-center space-x-4'>
            <button
              onClick={prevMonth}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ChevronLeft className='w-5 h-5' />
            </button>
            <h2 className='text-xl font-semibold text-gray-900 min-w-48 text-center'>
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <button
              onClick={nextMonth}
              className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
            >
              <ChevronRight className='w-5 h-5' />
            </button>
          </div>

          {/* Filters */}
          <div className='flex flex-col sm:flex-row gap-3'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Buscar eventos...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none w-full sm:w-64'
              />
            </div>

            <select
              value={filterProfesor}
              onChange={(e) => setFilterProfesor(e.target.value)}
              className='px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none'
            >
              <option value='TODOS'>Todos los profesores</option>
              {profesores.map((profesor) => (
                <option key={profesor.id_profesor} value={profesor.id_profesor}>
                  {profesor.nombre_completo}
                </option>
              ))}
            </select>

            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className='px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none'
            >
              <option value='TODOS'>Todos los tipos</option>
              {Object.keys(CLASS_TYPES).map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar */}
      {renderMonthView()}

      {/* Legend */}
      <div className='bg-white rounded-xl border border-gray-200 p-6'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Leyenda</h3>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          {Object.entries(CLASS_TYPES).map(([type, config]) => (
            <div key={type} className='flex items-center space-x-2'>
              <div className={`w-4 h-4 rounded border ${config.color}`}></div>
              <span className='text-sm text-gray-700'>{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Modal */}
      {renderEventModal()}

      {/* New Event Modal */}
      <NewEventModal
        open={showEventModal && !selectedEvent}
        onClose={() => setShowEventModal(false)}
        onSave={handleSaveEvent}
        selectedDate={selectedDate}
        profesores={profesores}
        alumnos={alumnos}
      />

      {/* Messages */}
      {message.text && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            message.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  )
}
