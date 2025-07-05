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

const COURT_COLORS = {
  'Cancha 1': 'bg-blue-500',
  'Cancha 2': 'bg-green-500',
  'Cancha 3': 'bg-purple-500',
  'Cancha 4': 'bg-orange-500'
}

const CLASS_TYPES = {
  'Clase Individual': { color: 'bg-red-100 text-red-800 border-red-200', icon: User },
  'Clase Grupal': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Users },
  'Entrenamiento': { color: 'bg-green-100 text-green-800 border-green-200', icon: Clock },
  'Academia': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: CalendarIcon }
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [profesoresData, alumnosData] = await Promise.all([
          db.getProfesores(),
          db.getAlumnos()
        ])

        if (!profesoresData.error) setProfesores(profesoresData.data || [])
        if (!alumnosData.error) setAlumnos(alumnosData.data || [])

        // For now, use mock events. In production, you'd fetch from database
        setEvents(mockEvents)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

  const getEventsForDate = (date) => {
    return events.filter(event => isSameDay(event.date, date))
  }

  const filteredEvents = events.filter(event => {
    const matchProfesor = filterProfesor === 'TODOS' || event.profesor === filterProfesor
    const matchTipo = filterTipo === 'TODOS' || event.type === filterTipo
    const matchSearch = searchTerm === '' || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.alumno?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.alumnos?.some(alumno => alumno.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchProfesor && matchTipo && matchSearch
  })

  const getProfesorName = (profesorId) => {
    const profesor = profesores.find(p => p.id_profesor === profesorId)
    return profesor ? profesor.nombre_completo : profesorId
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
        const dayEvents = getEventsForDate(day).filter(event => 
          filteredEvents.includes(event)
        )
        
        days.push(
          <div
            key={day.toString()}
            className={`min-h-32 border border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
              !isSameMonth(day, currentDate) ? 'bg-gray-50 text-gray-400' : 'bg-white'
            } ${
              isToday(day) ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => {
              setSelectedDate(day)
              setSelectedEvent(null)
              setShowEventModal(true)
            }}
          >
            <div className={`text-sm font-medium mb-1 ${
              isToday(day) ? 'text-blue-600' : ''
            }`}>
              {format(day, 'd')}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => (
                <div
                  key={event.id}
                  className={`text-xs p-1 rounded border ${CLASS_TYPES[event.type]?.color || 'bg-gray-100 text-gray-800 border-gray-200'} cursor-pointer hover:opacity-80`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedEvent(event)
                    setShowEventModal(true)
                  }}
                >
                  <div className="font-medium truncate">{event.startTime}</div>
                  <div className="truncate">{event.title}</div>
                </div>
              ))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 font-medium">
                  +{dayEvents.length - 3} más
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }

    return (
      <div className="bg-white rounded-lg border border-gray-200">
        {/* Calendar header */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
            <div key={day} className="p-3 text-center text-sm font-medium text-gray-500 bg-gray-50">
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
    if (!showEventModal) return null

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedEvent ? 'Detalles del Evento' : 'Nuevo Evento'}
              </h3>
              <button
                onClick={() => setShowEventModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            {selectedEvent ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {format(selectedEvent.date, 'dd/MM/yyyy', { locale: es })} • {selectedEvent.startTime} - {selectedEvent.endTime}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Profesor: {getProfesorName(selectedEvent.profesor)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {selectedEvent.cancha}
                  </span>
                </div>
                
                <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${CLASS_TYPES[selectedEvent.type]?.color || 'bg-gray-100 text-gray-800'}`}>
                  {selectedEvent.type}
                </div>
                
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Participantes:</h4>
                  {selectedEvent.alumno && (
                    <p className="text-sm text-gray-600">• {selectedEvent.alumno}</p>
                  )}
                  {selectedEvent.alumnos && selectedEvent.alumnos.map((alumno, index) => (
                    <p key={index} className="text-sm text-gray-600">• {alumno}</p>
                  ))}
                </div>
                
                <div className="flex space-x-2 pt-4">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                    Editar
                  </button>
                  <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Fecha seleccionada: {selectedDate && format(selectedDate, 'dd/MM/yyyy', { locale: es })}
                </p>
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Función de creación de eventos en desarrollo</p>
                  <button 
                    className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={() => setShowEventModal(false)}
                  >
                    Entendido
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 px-2 py-4 sm:px-4 md:px-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Calendario</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las clases y horarios del club de pádel
          </p>
        </div>
        <button
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center text-sm"
          onClick={() => {
            setSelectedEvent(null)
            setSelectedDate(new Date())
            setShowEventModal(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Clase
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Clases Hoy</span>
            <CalendarIcon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {getEventsForDate(new Date()).length}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Esta Semana</span>
            <Clock className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {events.length}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Profesores Activos</span>
            <User className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            {profesores.length}
          </div>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Canchas Disponibles</span>
            <MapPin className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">
            4
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          {/* Calendar Navigation */}
          <div className="flex items-center space-x-4">
            <button
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 min-w-48 text-center">
              {format(currentDate, 'MMMM yyyy', { locale: es })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none w-full sm:w-64"
              />
            </div>
            
            <select
              value={filterProfesor}
              onChange={(e) => setFilterProfesor(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none"
            >
              <option value="TODOS">Todos los profesores</option>
              {profesores.map(profesor => (
                <option key={profesor.id_profesor} value={profesor.id_profesor}>
                  {profesor.nombre_completo}
                </option>
              ))}
            </select>
            
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none"
            >
              <option value="TODOS">Todos los tipos</option>
              {Object.keys(CLASS_TYPES).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Calendar */}
      {renderMonthView()}

      {/* Legend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Leyenda</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(CLASS_TYPES).map(([type, config]) => (
            <div key={type} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded border ${config.color}`}></div>
              <span className="text-sm text-gray-700">{type}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Event Modal */}
      {renderEventModal()}
    </div>
  )
}
