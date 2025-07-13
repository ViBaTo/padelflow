import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import {
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  FileText,
  Plus,
  AlertTriangle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { designTokens, componentClasses } from '../lib/designTokens'

const CLASS_TYPES = {
  'Clase Individual': {
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: User
  },
  'Clase Grupal': {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Users
  },
  Academia: {
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Calendar
  }
}

export function NewEventModal({
  open,
  onClose,
  onSave,
  selectedDate,
  profesores = [],
  alumnos = [],
  canchas = [],
  inscripciones = [], // 🆕 Agregar inscripciones para obtener paquetes
  paquetes = [], // 🆕 Agregar paquetes para mostrar nombres
  initialData = null
}) {
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: selectedDate
      ? format(selectedDate, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    horaInicio: initialData?.startTime || '09:00',
    horaFin: initialData?.endTime || '10:00',
    tipo: 'Clase Individual',
    profesorId: '',
    alumnosSeleccionados: [],
    paqueteSeleccionado: '', // 🆕 Paquete seleccionado
    cancha:
      initialData?.cancha || (canchas.length > 0 ? canchas[0].nombre : ''),
    descripcion: '',
    estado: 'confirmada'
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  // 🆕 Función para obtener paquetes activos del alumno seleccionado
  const getPaquetesDelAlumno = (cedulaAlumno) => {
    if (!cedulaAlumno) return []

    return inscripciones
      .filter(
        (inscripcion) =>
          inscripcion.cedula_alumno === cedulaAlumno &&
          inscripcion.estado === 'ACTIVO' &&
          (inscripcion.clases_restantes > 0 ||
            inscripcion.clases_totales - inscripcion.clases_utilizadas > 0)
      )
      .map((inscripcion) => {
        const paquete = paquetes.find(
          (p) => p.codigo === inscripcion.codigo_paquete
        )
        const clasesRestantes =
          inscripcion.clases_restantes ||
          inscripcion.clases_totales - inscripcion.clases_utilizadas

        return {
          ...inscripcion,
          nombrePaquete: paquete ? paquete.nombre : inscripcion.codigo_paquete,
          clasesRestantes: clasesRestantes
        }
      })
  }

  // Efecto para actualizar el formulario cuando cambien los props
  useEffect(() => {
    if (open) {
      const fechaFormateada = selectedDate
        ? format(selectedDate, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd')

      const horaInicio = initialData?.startTime || '09:00'
      let horaFin = initialData?.endTime

      // Si hay hora de inicio pero no de fin, calcular automáticamente (90 minutos después)
      if (horaInicio && !horaFin) {
        const [hours, minutes] = horaInicio.split(':').map(Number)
        const inicioDate = new Date()
        inicioDate.setHours(hours, minutes, 0, 0)
        inicioDate.setTime(inicioDate.getTime() + 90 * 60 * 1000) // 90 minutos
        horaFin = `${inicioDate
          .getHours()
          .toString()
          .padStart(2, '0')}:${inicioDate
          .getMinutes()
          .toString()
          .padStart(2, '0')}`
      }

      if (!horaFin) {
        horaFin = '10:00'
      }

      const nuevosData = {
        titulo: '',
        fecha: fechaFormateada,
        horaInicio: horaInicio,
        horaFin: horaFin,
        tipo: 'Clase Individual',
        profesorId: '',
        alumnosSeleccionados: [],
        paqueteSeleccionado: '', // 🆕 Reset paquete
        cancha:
          initialData?.cancha || (canchas.length > 0 ? canchas[0].nombre : ''),
        descripcion: '',
        estado: 'confirmada'
      }

      console.log('🎯 Datos preseleccionados en el modal:', {
        fecha: fechaFormateada,
        horaInicio: horaInicio,
        horaFin: horaFin,
        cancha: nuevosData.cancha,
        hasInitialData: !!initialData
      })

      setFormData(nuevosData)

      // Limpiar errores y mensajes
      setErrors({})
      setError(null)
      setSuccess(null)
    }
  }, [open, selectedDate, initialData, canchas])

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleAlumnoToggle = (alumnoId) => {
    setFormData((prev) => {
      let nuevosAlumnos

      if (prev.alumnosSeleccionados.includes(alumnoId)) {
        // Deseleccionar alumno
        nuevosAlumnos = prev.alumnosSeleccionados.filter(
          (id) => id !== alumnoId
        )
      } else {
        // Seleccionar alumno
        if (prev.tipo === 'Clase Individual') {
          // Para clases individuales, solo un alumno
          nuevosAlumnos = [alumnoId]
        } else {
          // Para clases grupales, agregar alumno
          nuevosAlumnos = [...prev.alumnosSeleccionados, alumnoId]
        }
      }

      return {
        ...prev,
        alumnosSeleccionados: nuevosAlumnos,
        paqueteSeleccionado: '' // 🆕 Limpiar paquete cuando cambie alumno
      }
    })
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.titulo.trim()) {
      newErrors.titulo = 'El título es requerido'
    }

    if (!formData.fecha) {
      newErrors.fecha = 'La fecha es requerida'
    }

    if (!formData.horaInicio) {
      newErrors.horaInicio = 'La hora de inicio es requerida'
    }

    if (!formData.horaFin) {
      newErrors.horaFin = 'La hora de fin es requerida'
    }

    if (formData.horaInicio >= formData.horaFin) {
      newErrors.horaFin =
        'La hora de fin debe ser posterior a la hora de inicio'
    }

    if (!formData.profesorId) {
      newErrors.profesorId = 'Debe seleccionar un profesor'
    }

    if (formData.alumnosSeleccionados.length === 0) {
      newErrors.alumnos = 'Debe seleccionar al menos un alumno'
    }

    if (
      formData.tipo === 'Clase Individual' &&
      formData.alumnosSeleccionados.length > 1
    ) {
      newErrors.alumnos = 'Las clases individuales solo pueden tener un alumno'
    }

    // 🆕 Validar paquete seleccionado (solo si se selecciona uno)
    if (
      formData.tipo === 'Clase Individual' &&
      formData.alumnosSeleccionados.length > 0 &&
      formData.paqueteSeleccionado // Solo validar si hay un paquete seleccionado
    ) {
      // Validar que el paquete tenga clases restantes
      const paquetesDisponibles = getPaquetesDelAlumno(
        formData.alumnosSeleccionados[0]
      )
      const paqueteInfo = paquetesDisponibles.find(
        (p) => p.codigo_paquete === formData.paqueteSeleccionado
      )

      if (!paqueteInfo || paqueteInfo.clasesRestantes <= 0) {
        newErrors.paquete =
          'El paquete seleccionado no tiene clases disponibles'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      const eventData = {
        ...formData,
        id: Date.now(), // Temporary ID generation
        date: new Date(formData.fecha),
        startTime: formData.horaInicio,
        endTime: formData.horaFin,
        type: formData.tipo,
        profesor: formData.profesorId,
        students: formData.alumnosSeleccionados, // Cambiado para que coincida con el handler
        alumnos: formData.alumnosSeleccionados.map((id) => {
          const alumno = alumnos.find((a) => a.cedula === id)
          return alumno ? alumno.nombre_completo : id
        }),
        cancha: formData.cancha,
        title: formData.titulo,
        packageCode: formData.paqueteSeleccionado // 🆕 Agregar código del paquete
      }

      await onSave(eventData)
      setSuccess('Evento creado correctamente')

      // Cerrar modal después de un delay - el formulario se resetea automáticamente cuando se reabre
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (error) {
      console.error('Error creating event:', error)
      setError('Error al crear el evento. Inténtalo de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle
            className={`${designTokens.typography.h3} ${designTokens.text.primary} flex items-center space-x-2`}
          >
            <Plus className='w-6 h-6 text-blue-600' />
            <span>Nuevo Evento</span>
          </DialogTitle>
          <DialogDescription className={designTokens.text.secondary}>
            Crea un nuevo evento en el calendario del club
          </DialogDescription>

          {/* Indicador de datos preseleccionados */}
          {(selectedDate || initialData) && (
            <div className='mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
              <div className='flex items-center space-x-2 text-sm text-blue-700'>
                <Calendar className='w-4 h-4' />
                <span className='font-medium'>Datos preseleccionados:</span>
              </div>
              <div className='mt-2 text-sm text-blue-600 space-y-1'>
                {selectedDate && (
                  <div>
                    📅 Fecha:{' '}
                    {format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es })}
                  </div>
                )}
                {initialData?.startTime && (
                  <div>⏰ Hora: {initialData.startTime}</div>
                )}
                {initialData?.cancha && (
                  <div>🏟️ Cancha: {initialData.cancha}</div>
                )}
              </div>
            </div>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Mensajes de estado */}
          {error && (
            <div className={componentClasses.errorMessage}>
              <AlertTriangle className='w-4 h-4 text-red-500 flex-shrink-0' />
              <span className='text-sm'>{error}</span>
            </div>
          )}

          {success && (
            <div className={componentClasses.successMessage}>
              <span className='text-sm'>{success}</span>
            </div>
          )}

          {/* Información básica del evento */}
          <Card className={componentClasses.mainCard}>
            <CardHeader className={componentClasses.cardHeader}>
              <CardTitle
                className={`${componentClasses.cardHeaderTitle} flex items-center gap-2`}
              >
                <Calendar className='w-5 h-5' /> Información del Evento
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`${componentClasses.cardContent} space-y-6`}
            >
              {/* Título */}
              <div>
                <Label className={componentClasses.label}>
                  Título del evento *
                </Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) => handleInputChange('titulo', e.target.value)}
                  className={
                    errors.titulo
                      ? componentClasses.inputError
                      : componentClasses.input
                  }
                  placeholder='Ej: Clase de pádel - Principiantes'
                />
                {errors.titulo && (
                  <p className={`${designTokens.text.error} text-sm mt-1`}>
                    {errors.titulo}
                  </p>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <Label className={componentClasses.label}>Fecha *</Label>
                  <Input
                    type='date'
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    className={
                      errors.fecha
                        ? componentClasses.inputError
                        : componentClasses.input
                    }
                  />
                  {errors.fecha && (
                    <p className={`${designTokens.text.error} text-sm mt-1`}>
                      {errors.fecha}
                    </p>
                  )}
                </div>

                <div>
                  <Label className={componentClasses.label}>
                    Hora inicio *
                  </Label>
                  <Input
                    type='time'
                    value={formData.horaInicio}
                    onChange={(e) =>
                      handleInputChange('horaInicio', e.target.value)
                    }
                    className={
                      errors.horaInicio
                        ? componentClasses.inputError
                        : componentClasses.input
                    }
                  />
                  {errors.horaInicio && (
                    <p className={`${designTokens.text.error} text-sm mt-1`}>
                      {errors.horaInicio}
                    </p>
                  )}
                </div>

                <div>
                  <Label className={componentClasses.label}>Hora fin *</Label>
                  <Input
                    type='time'
                    value={formData.horaFin}
                    onChange={(e) =>
                      handleInputChange('horaFin', e.target.value)
                    }
                    className={
                      errors.horaFin
                        ? componentClasses.inputError
                        : componentClasses.input
                    }
                  />
                  {errors.horaFin && (
                    <p className={`${designTokens.text.error} text-sm mt-1`}>
                      {errors.horaFin}
                    </p>
                  )}
                </div>
              </div>

              {/* Tipo de clase y Cancha */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <Label className={componentClasses.label}>
                    Tipo de clase *
                  </Label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                    className={componentClasses.input}
                  >
                    {Object.keys(CLASS_TYPES).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className={componentClasses.label}>Cancha *</Label>
                  <select
                    value={formData.cancha}
                    onChange={(e) =>
                      handleInputChange('cancha', e.target.value)
                    }
                    className={componentClasses.input}
                  >
                    <option value=''>Selecciona una cancha</option>
                    {canchas.map((cancha) => (
                      <option key={cancha.id_cancha} value={cancha.nombre}>
                        {cancha.nombre} ({cancha.tipo})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participantes */}
          <Card className={componentClasses.mainCard}>
            <CardHeader className={componentClasses.cardHeader}>
              <CardTitle
                className={`${componentClasses.cardHeaderTitle} flex items-center gap-2`}
              >
                <Users className='w-5 h-5' /> Participantes
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`${componentClasses.cardContent} space-y-6`}
            >
              {/* Profesor */}
              <div>
                <Label className={componentClasses.label}>Profesor *</Label>
                <select
                  value={formData.profesorId}
                  onChange={(e) =>
                    handleInputChange('profesorId', e.target.value)
                  }
                  className={
                    errors.profesorId
                      ? componentClasses.inputError
                      : componentClasses.input
                  }
                >
                  <option value=''>Selecciona un profesor</option>
                  {profesores.map((profesor) => (
                    <option
                      key={profesor.id_profesor}
                      value={profesor.id_profesor}
                    >
                      {profesor.nombre_completo}
                    </option>
                  ))}
                </select>
                {errors.profesorId && (
                  <p className={`${designTokens.text.error} text-sm mt-1`}>
                    {errors.profesorId}
                  </p>
                )}
              </div>

              {/* Alumnos */}
              <div>
                <Label className={componentClasses.label}>
                  Alumnos *
                  {formData.tipo === 'Clase Individual' && (
                    <span className={`text-xs ${designTokens.text.muted} ml-1`}>
                      (máximo 1 para clase individual)
                    </span>
                  )}
                </Label>
                <div
                  className={`${designTokens.borders.input} ${designTokens.rounded.input} p-3 max-h-40 overflow-y-auto ${designTokens.backgrounds.card}`}
                >
                  {alumnos.length === 0 ? (
                    <p className={`${designTokens.text.muted} text-sm`}>
                      No hay alumnos disponibles
                    </p>
                  ) : (
                    <div className='space-y-2'>
                      {alumnos.map((alumno) => (
                        <label
                          key={alumno.cedula}
                          className={`flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded ${designTokens.transitions.colors}`}
                        >
                          <input
                            type='checkbox'
                            checked={formData.alumnosSeleccionados.includes(
                              alumno.cedula
                            )}
                            onChange={() => handleAlumnoToggle(alumno.cedula)}
                            className='text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                          />
                          <span
                            className={`text-sm ${designTokens.text.primary}`}
                          >
                            {alumno.nombre_completo}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {errors.alumnos && (
                  <p className={`${designTokens.text.error} text-sm mt-1`}>
                    {errors.alumnos}
                  </p>
                )}
              </div>

              {/* 🆕 Selección de Paquete */}
              {formData.tipo === 'Clase Individual' &&
                formData.alumnosSeleccionados.length === 1 && (
                  <div>
                    <Label className={componentClasses.label}>
                      Paquete a descontar (opcional)
                      <span
                        className={`text-xs ${designTokens.text.muted} ml-1`}
                      >
                        (se descontará 1 clase del paquete seleccionado)
                      </span>
                    </Label>

                    {(() => {
                      const paquetesDisponibles = getPaquetesDelAlumno(
                        formData.alumnosSeleccionados[0]
                      )

                      if (paquetesDisponibles.length === 0) {
                        return (
                          <div>
                            <select
                              value={formData.paqueteSeleccionado}
                              onChange={(e) =>
                                handleInputChange(
                                  'paqueteSeleccionado',
                                  e.target.value
                                )
                              }
                              className={
                                errors.paquete
                                  ? componentClasses.inputError
                                  : componentClasses.input
                              }
                            >
                              <option value=''>
                                Sin paquete (clase individual)
                              </option>
                            </select>
                            <div className='mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                              <p
                                className={`${designTokens.text.muted} text-sm flex items-center`}
                              >
                                <AlertTriangle className='w-4 h-4 mr-2 text-yellow-500' />
                                Este alumno no tiene paquetes activos con clases
                                disponibles. La clase se creará sin descontar de
                                ningún paquete.
                              </p>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <select
                          value={formData.paqueteSeleccionado}
                          onChange={(e) =>
                            handleInputChange(
                              'paqueteSeleccionado',
                              e.target.value
                            )
                          }
                          className={
                            errors.paquete
                              ? componentClasses.inputError
                              : componentClasses.input
                          }
                        >
                          <option value=''>
                            Sin paquete (clase individual)
                          </option>
                          {paquetesDisponibles.map((paquete) => (
                            <option
                              key={paquete.codigo_paquete}
                              value={paquete.codigo_paquete}
                            >
                              {paquete.nombrePaquete} -{' '}
                              {paquete.clasesRestantes} clases restantes
                            </option>
                          ))}
                        </select>
                      )
                    })()}

                    {errors.paquete && (
                      <p className={`${designTokens.text.error} text-sm mt-1`}>
                        {errors.paquete}
                      </p>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Detalles adicionales */}
          <Card className={componentClasses.mainCard}>
            <CardHeader className={componentClasses.cardHeader}>
              <CardTitle
                className={`${componentClasses.cardHeaderTitle} flex items-center gap-2`}
              >
                <FileText className='w-5 h-5' /> Detalles Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent className={componentClasses.cardContent}>
              <div>
                <Label className={componentClasses.label}>
                  Descripción (opcional)
                </Label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    handleInputChange('descripcion', e.target.value)
                  }
                  rows={3}
                  className={componentClasses.input}
                  placeholder='Detalles adicionales del evento...'
                />
              </div>
            </CardContent>
          </Card>
        </form>

        <DialogFooter className='flex flex-col sm:flex-row gap-3 pt-4'>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            className='flex-1'
          >
            Cancelar
          </Button>
          <Button
            type='submit'
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white`}
          >
            {isSubmitting ? (
              <>
                <div className={componentClasses.spinner} />
                Guardando...
              </>
            ) : (
              <>
                <Plus className='w-4 h-4 mr-2' />
                Crear Evento
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
