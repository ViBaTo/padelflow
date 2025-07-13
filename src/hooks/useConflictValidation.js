import { useMemo } from 'react'
import { isSameDay, parseISO, addMinutes, isWithinInterval } from 'date-fns'

export function useConflictValidation(events = [], profesores = []) {
  // Función para convertir tiempo "HH:MM" a minutos desde medianoche
  const timeToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Función para crear intervalo de tiempo
  const createTimeInterval = (date, startTime, endTime) => {
    const baseDate = new Date(date)
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    
    const start = new Date(baseDate)
    start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0)
    
    const end = new Date(baseDate)
    end.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0)
    
    return { start, end }
  }

  // Función para verificar si dos intervalos se solapan
  const intervalsOverlap = (interval1, interval2) => {
    return (
      isWithinInterval(interval1.start, interval2) ||
      isWithinInterval(interval1.end, interval2) ||
      isWithinInterval(interval2.start, interval1) ||
      isWithinInterval(interval2.end, interval1) ||
      (interval1.start <= interval2.start && interval1.end >= interval2.end)
    )
  }

  const validateEvent = useMemo(() => {
    return (newEvent) => {
      const conflicts = []
      const warnings = []

      // Validaciones básicas
      if (!newEvent.date || !newEvent.startTime || !newEvent.endTime) {
        return { isValid: false, conflicts: ['Faltan datos requeridos'], warnings: [] }
      }

      if (!newEvent.profesor || !newEvent.cancha || !newEvent.students?.length) {
        return { isValid: false, conflicts: ['Faltan datos requeridos'], warnings: [] }
      }

      // Crear intervalo del nuevo evento
      const newInterval = createTimeInterval(newEvent.date, newEvent.startTime, newEvent.endTime)
      
      // Verificar que la hora de fin sea posterior a la de inicio
      if (newInterval.end <= newInterval.start) {
        conflicts.push('La hora de fin debe ser posterior a la hora de inicio')
      }

      // Filtrar eventos del mismo día
      const sameDay = events.filter(event => 
        isSameDay(event.date, newEvent.date) && 
        event.id !== newEvent.id // Excluir el evento actual si está siendo editado
      )

      // 1. Verificar conflictos de profesor
      const profesorConflicts = sameDay.filter(event => {
        if (event.profesor !== newEvent.profesor) return false
        
        const existingInterval = createTimeInterval(event.date, event.startTime, event.endTime)
        return intervalsOverlap(newInterval, existingInterval)
      })

      if (profesorConflicts.length > 0) {
        const profesorName = profesores.find(p => p.id_profesor === newEvent.profesor)?.nombre_completo || newEvent.profesor
        conflicts.push(`El profesor ${profesorName} ya tiene una clase programada en este horario`)
      }

      // 2. Verificar conflictos de cancha
      const canchaConflicts = sameDay.filter(event => {
        if (event.cancha !== newEvent.cancha) return false
        
        const existingInterval = createTimeInterval(event.date, event.startTime, event.endTime)
        return intervalsOverlap(newInterval, existingInterval)
      })

      if (canchaConflicts.length > 0) {
        conflicts.push(`La ${newEvent.cancha} ya está ocupada en este horario`)
      }

      // 3. Verificar conflictos de estudiantes
      const studentConflicts = sameDay.filter(event => {
        // Verificar si algún estudiante del nuevo evento ya está en otra clase
        const eventStudents = Array.isArray(event.alumnos) ? event.alumnos : [event.alumno]
        const newStudents = newEvent.students || []
        
        const hasCommonStudents = newStudents.some(student => 
          eventStudents.some(eventStudent => eventStudent === student)
        )
        
        if (!hasCommonStudents) return false
        
        const existingInterval = createTimeInterval(event.date, event.startTime, event.endTime)
        return intervalsOverlap(newInterval, existingInterval)
      })

      if (studentConflicts.length > 0) {
        conflicts.push('Uno o más alumnos ya tienen una clase programada en este horario')
      }

      // 4. Validaciones de reglas de negocio
      
      // Validar horarios de apertura (ejemplo: 6:00 - 22:00)
      const startMinutes = timeToMinutes(newEvent.startTime)
      const endMinutes = timeToMinutes(newEvent.endTime)
      
      if (startMinutes < 360 || endMinutes > 1320) { // 6:00 AM a 10:00 PM
        warnings.push('La clase está fuera del horario habitual del club (6:00 - 22:00)')
      }

      // Validar duración mínima y máxima
      const duration = endMinutes - startMinutes
      if (duration < 30) {
        conflicts.push('La duración mínima de una clase es 30 minutos')
      }
      if (duration > 180) {
        warnings.push('La clase tiene una duración muy larga (más de 3 horas)')
      }

      // Validar tipo de clase vs número de estudiantes
      if (newEvent.type === 'Clase Individual' && newEvent.students.length > 1) {
        conflicts.push('Las clases individuales solo pueden tener un alumno')
      }
      
      if (newEvent.type === 'Clase Grupal' && newEvent.students.length > 4) {
        warnings.push('Las clases grupales con más de 4 alumnos pueden ser difíciles de manejar')
      }

      // Validar días de la semana para ciertos tipos
      const dayOfWeek = newEvent.date.getDay()
      if (newEvent.type === 'Academia' && (dayOfWeek === 0 || dayOfWeek === 6)) {
        warnings.push('Las clases de Academia normalmente no se programan en fines de semana')
      }

      return {
        isValid: conflicts.length === 0,
        conflicts,
        warnings,
        hasWarnings: warnings.length > 0
      }
    }
  }, [events, profesores])

  // Función para obtener sugerencias de horarios alternativos
  const getSuggestedTimes = useMemo(() => {
    return (eventData, targetDate) => {
      const suggestions = []
      const date = targetDate || eventData.date
      
      // Horarios estándar del club
      const standardTimes = [
        { start: '08:00', end: '09:30' },
        { start: '09:30', end: '11:00' },
        { start: '11:00', end: '12:30' },
        { start: '14:00', end: '15:30' },
        { start: '15:30', end: '17:00' },
        { start: '17:00', end: '18:30' },
        { start: '18:30', end: '20:00' },
        { start: '20:00', end: '21:30' }
      ]

      standardTimes.forEach(time => {
        const testEvent = {
          ...eventData,
          date,
          startTime: time.start,
          endTime: time.end
        }
        
        const validation = validateEvent(testEvent)
        if (validation.isValid) {
          suggestions.push({
            startTime: time.start,
            endTime: time.end,
            conflicts: validation.conflicts,
            warnings: validation.warnings
          })
        }
      })

      return suggestions.slice(0, 3) // Máximo 3 sugerencias
    }
  }, [validateEvent])

  return {
    validateEvent,
    getSuggestedTimes,
    timeToMinutes,
    createTimeInterval
  }
}