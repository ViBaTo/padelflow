import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import {
  Calendar,
  Clock,
  User,
  Users,
  MapPin,
  FileText,
  X,
  Plus,
  Trash2
} from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

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
    icon: Calendar
  }
}

const CANCHAS = ['Cancha 1', 'Cancha 2', 'Cancha 3', 'Cancha 4']

export function NewEventModal({
  open,
  onClose,
  onSave,
  selectedDate,
  profesores = [],
  alumnos = []
}) {
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: selectedDate
      ? format(selectedDate, 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd'),
    horaInicio: '09:00',
    horaFin: '10:00',
    tipo: 'Clase Individual',
    profesorId: '',
    alumnosSeleccionados: [],
    cancha: 'Cancha 1',
    descripcion: '',
    estado: 'confirmada'
  })

  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  if (!open) return null

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
    setFormData((prev) => ({
      ...prev,
      alumnosSeleccionados: prev.alumnosSeleccionados.includes(alumnoId)
        ? prev.alumnosSeleccionados.filter((id) => id !== alumnoId)
        : [...prev.alumnosSeleccionados, alumnoId]
    }))
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
        alumnos: formData.alumnosSeleccionados.map((id) => {
          const alumno = alumnos.find((a) => a.cedula === id)
          return alumno ? alumno.nombre_completo : id
        }),
        cancha: formData.cancha,
        title: formData.titulo
      }

      await onSave(eventData)
      setSuccess('Evento creado correctamente')

      // Reset form
      setFormData({
        titulo: '',
        fecha: selectedDate
          ? format(selectedDate, 'yyyy-MM-dd')
          : format(new Date(), 'yyyy-MM-dd'),
        horaInicio: '09:00',
        horaFin: '10:00',
        tipo: 'Clase Individual',
        profesorId: '',
        alumnosSeleccionados: [],
        cancha: 'Cancha 1',
        descripcion: '',
        estado: 'confirmada'
      })

      // Cerrar modal después de un delay
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
    <div
      className='fixed inset-0 z-50 flex justify-center items-center bg-black/50'
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className='relative bg-white w-full max-w-4xl rounded-xl shadow-lg p-6 overflow-y-auto max-h-[90vh]'>
        <button
          className='absolute top-4 right-6 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none transition-colors duration-200'
          onClick={onClose}
          aria-label='Cerrar'
        >
          ×
        </button>

        {/* Header */}
        <div className='mb-6'>
          <h2 className='text-2xl font-bold flex items-center gap-2'>
            <Plus className='w-5 h-5 text-blue-600' /> Nuevo Evento
          </h2>
          <p className='text-gray-600 mt-1'>
            Crea un nuevo evento en el calendario
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-6'>
          {/* Información básica del evento */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Calendar className='w-4 h-4' /> Información del Evento
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Título */}
              <div>
                <label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Título del evento *
                </label>
                <input
                  type='text'
                  value={formData.titulo}
                  onChange={(e) => handleInputChange('titulo', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.titulo ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder='Ej: Clase de pádel - Principiantes'
                />
                {errors.titulo && (
                  <p className='text-red-500 text-sm mt-1'>{errors.titulo}</p>
                )}
              </div>

              {/* Fecha y Hora */}
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Fecha *
                  </label>
                  <input
                    type='date'
                    value={formData.fecha}
                    onChange={(e) => handleInputChange('fecha', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.fecha ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.fecha && (
                    <p className='text-red-500 text-sm mt-1'>{errors.fecha}</p>
                  )}
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Hora inicio *
                  </label>
                  <input
                    type='time'
                    value={formData.horaInicio}
                    onChange={(e) =>
                      handleInputChange('horaInicio', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.horaInicio ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.horaInicio && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.horaInicio}
                    </p>
                  )}
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Hora fin *
                  </label>
                  <input
                    type='time'
                    value={formData.horaFin}
                    onChange={(e) =>
                      handleInputChange('horaFin', e.target.value)
                    }
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.horaFin ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.horaFin && (
                    <p className='text-red-500 text-sm mt-1'>
                      {errors.horaFin}
                    </p>
                  )}
                </div>
              </div>

              {/* Tipo de clase y Cancha */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Tipo de clase *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => handleInputChange('tipo', e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    {Object.keys(CLASS_TYPES).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className='text-sm font-medium text-gray-700 mb-2 block'>
                    Cancha *
                  </label>
                  <select
                    value={formData.cancha}
                    onChange={(e) =>
                      handleInputChange('cancha', e.target.value)
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  >
                    {CANCHAS.map((cancha) => (
                      <option key={cancha} value={cancha}>
                        {cancha}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Participantes */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Users className='w-4 h-4' /> Participantes
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Profesor */}
              <div>
                <label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Profesor *
                </label>
                <select
                  value={formData.profesorId}
                  onChange={(e) =>
                    handleInputChange('profesorId', e.target.value)
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.profesorId ? 'border-red-500' : 'border-gray-300'
                  }`}
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
                  <p className='text-red-500 text-sm mt-1'>
                    {errors.profesorId}
                  </p>
                )}
              </div>

              {/* Alumnos */}
              <div>
                <label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Alumnos *
                  {formData.tipo === 'Clase Individual' && (
                    <span className='text-xs text-gray-500 ml-1'>
                      (máximo 1 para clase individual)
                    </span>
                  )}
                </label>
                <div className='border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50'>
                  {alumnos.length === 0 ? (
                    <p className='text-gray-500 text-sm'>
                      No hay alumnos disponibles
                    </p>
                  ) : (
                    <div className='space-y-2'>
                      {alumnos.map((alumno) => (
                        <label
                          key={alumno.cedula}
                          className='flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded'
                        >
                          <input
                            type='checkbox'
                            checked={formData.alumnosSeleccionados.includes(
                              alumno.cedula
                            )}
                            onChange={() => handleAlumnoToggle(alumno.cedula)}
                            className='text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                          />
                          <span className='text-sm text-gray-700'>
                            {alumno.nombre_completo}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {errors.alumnos && (
                  <p className='text-red-500 text-sm mt-1'>{errors.alumnos}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Detalles adicionales */}
          <Card>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <FileText className='w-4 h-4' /> Detalles Adicionales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className='text-sm font-medium text-gray-700 mb-2 block'>
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    handleInputChange('descripcion', e.target.value)
                  }
                  rows={3}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                  placeholder='Detalles adicionales del evento...'
                />
              </div>
            </CardContent>
          </Card>

          {/* Botones */}
          <div className='flex gap-3 pt-4'>
            <button
              type='button'
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors'
            >
              Cancelar
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className='flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
            >
              {isSubmitting ? (
                <>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                  Guardando...
                </>
              ) : (
                <>
                  <Plus className='w-4 h-4' />
                  Crear Evento
                </>
              )}
            </button>
          </div>
        </form>

        {/* Messages */}
        {error && (
          <div className='fixed bottom-4 right-4 bg-red-100 border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-lg'>
            {error}
          </div>
        )}
        {success && (
          <div className='fixed bottom-4 right-4 bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-lg shadow-lg'>
            {success}
          </div>
        )}
      </div>
    </div>
  )
}
