import { useEffect, useState, useRef } from 'react'
import { db, supabase } from '../lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { designTokens, componentClasses } from '../lib/designTokens'
import {
  UserPlus,
  Search,
  Package,
  User,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react'

export function NuevaInscripcionForm({
  open,
  onClose,
  onSuccess,
  alumnoPreSeleccionado
}) {
  const [alumnos, setAlumnos] = useState([])
  const [paquetes, setPaquetes] = useState([])
  const [profesores, setProfesores] = useState([])
  const [horariosGrupos, setHorariosGrupos] = useState([])
  const [form, setForm] = useState({
    alumno: '',
    paquete: '',
    fecha: '',
    profesor: '',
    horario: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [alumnoSearch, setAlumnoSearch] = useState('')
  const [showAlumnoDropdown, setShowAlumnoDropdown] = useState(false)
  const alumnoInputRef = useRef(null)

  const fetchHorarios = async () => {
    try {
      const { data, error } = await supabase
        .from('horarios_grupos')
        .select('*')
        .eq('activo', true)
        .order('nombre_horario')

      if (error) throw error
      setHorariosGrupos(data || [])
    } catch (err) {
      console.error('Error cargando horarios:', err)
    }
  }

  const isAcademiaPackage = () => {
    if (!form.paquete) return false
    const paqueteSeleccionado = paquetes.find((p) => p.codigo === form.paquete)
    return paqueteSeleccionado?.tipo_servicio === 'ACADEMIA'
  }

  useEffect(() => {
    if (open) {
      db.getAlumnos().then(({ data }) => setAlumnos(data || []))
      db.getPaquetes().then(({ data }) => setPaquetes(data || []))
      db.getProfesores().then(({ data }) => setProfesores(data || []))
      fetchHorarios()

      if (alumnoPreSeleccionado) {
        setForm((prev) => ({
          ...prev,
          alumno: alumnoPreSeleccionado.cedula
        }))
        setAlumnoSearch(alumnoPreSeleccionado.nombre_completo)
      } else {
        setForm({
          alumno: '',
          paquete: '',
          fecha: '',
          profesor: '',
          horario: ''
        })
        setAlumnoSearch('')
      }

      setError('')
      setSuccess('')
    }
  }, [open, alumnoPreSeleccionado])

  useEffect(() => {
    if (!isAcademiaPackage() && form.horario) {
      setForm((prev) => ({ ...prev, horario: '' }))
    }
  }, [form.paquete, paquetes])

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

      if (paquete.tipo_servicio === 'ACADEMIA' && !form.horario) {
        setError('Por favor selecciona un horario para el paquete de Academia.')
        setLoading(false)
        return
      }

      if (alumno.estado === 'INACTIVO') {
        await db.updateAlumnoEstado(alumno.cedula, 'ACTIVO')
      }
      const { data, error: userError } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) {
        setError('No hay usuario autenticado.')
        setLoading(false)
        return
      }

      const inscripcion = {
        cedula_alumno: alumno.cedula,
        codigo_paquete: paquete.codigo,
        fecha_inscripcion: form.fecha,
        fecha_vencimiento: null,
        clases_totales: paquete.numero_clases,
        clases_utilizadas: 0,
        precio_pagado: paquete.precio_con_iva || paquete.precio,
        descuento: 0,
        modo_pago: null,
        comprobante: null,
        observaciones: null,
        id_horario:
          paquete.tipo_servicio === 'ACADEMIA' ? parseInt(form.horario) : null,
        estado: 'ACTIVO',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id_profesor: form.profesor || null,
        user_id: user.id
      }
      const { error } = await db.addInscripcion(inscripcion)
      if (error) {
        setError(error.message || JSON.stringify(error))
      } else {
        setSuccess('Inscripción creada correctamente')
        if (onSuccess) onSuccess()
        setTimeout(() => onClose(), 1200)
      }
    } catch (err) {
      setError(err?.message || JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  const handleAlumnoSelect = (cedula, nombre) => {
    setForm({ ...form, alumno: cedula })
    setAlumnoSearch(nombre)
    setShowAlumnoDropdown(false)
  }

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

  const alumnoNoSeleccionado = alumnoSearch && !form.alumno

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle
            className={`${designTokens.typography.h3} ${designTokens.text.primary} flex items-center space-x-2`}
          >
            <UserPlus className='w-6 h-6 text-blue-600' />
            <span>Nueva Inscripción</span>
          </DialogTitle>
          <DialogDescription className={designTokens.text.secondary}>
            Inscribe a un alumno en un paquete del club
          </DialogDescription>
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

          {/* Selección de alumno */}
          <div className='space-y-4'>
            <div>
              <Label className={componentClasses.label}>
                <User className='w-4 h-4 inline mr-2' />
                Alumno *
              </Label>
              <div className='relative' ref={alumnoInputRef}>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <Input
                    type='text'
                    value={alumnoSearch}
                    onChange={(e) => {
                      setAlumnoSearch(e.target.value)
                      setShowAlumnoDropdown(true)
                      if (!e.target.value) {
                        setForm({ ...form, alumno: '' })
                      }
                    }}
                    onFocus={() => setShowAlumnoDropdown(true)}
                    className={`${componentClasses.input} pl-10 ${
                      alumnoNoSeleccionado ? 'border-yellow-400' : ''
                    }`}
                    placeholder='Buscar alumno...'
                    required
                  />
                </div>

                {showAlumnoDropdown && alumnoSearch && (
                  <div
                    className={`absolute z-10 w-full mt-1 ${designTokens.backgrounds.card} ${designTokens.borders.card} ${designTokens.rounded.card} ${designTokens.shadows.card} max-h-48 overflow-y-auto`}
                  >
                    {alumnosFiltrados.length > 0 ? (
                      alumnosFiltrados.map((alumno) => (
                        <div
                          key={alumno.cedula}
                          onClick={() =>
                            handleAlumnoSelect(
                              alumno.cedula,
                              alumno.nombre_completo
                            )
                          }
                          className={`p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${designTokens.transitions.colors} border-b border-gray-100 dark:border-gray-700 last:border-b-0`}
                        >
                          <div
                            className={`font-medium ${designTokens.text.primary}`}
                          >
                            {alumno.nombre_completo}
                          </div>
                          <div className={`text-sm ${designTokens.text.muted}`}>
                            Cédula: {alumno.cedula}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        className={`p-3 ${designTokens.text.muted} text-center`}
                      >
                        No se encontraron alumnos
                      </div>
                    )}
                  </div>
                )}
              </div>

              {alumnoNoSeleccionado && (
                <p className={`${designTokens.text.warning} text-sm mt-1`}>
                  Por favor selecciona un alumno de la lista
                </p>
              )}
            </div>

            {/* Paquete */}
            <div>
              <Label className={componentClasses.label}>
                <Package className='w-4 h-4 inline mr-2' />
                Paquete *
              </Label>
              <select
                name='paquete'
                value={form.paquete}
                onChange={handleChange}
                className={componentClasses.input}
                required
              >
                <option value=''>Selecciona un paquete</option>
                {paquetes.map((paquete) => (
                  <option key={paquete.codigo} value={paquete.codigo}>
                    {paquete.nombre} - $
                    {paquete.precio_con_iva || paquete.precio}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha de inscripción */}
            <div>
              <Label className={componentClasses.label}>
                <Calendar className='w-4 h-4 inline mr-2' />
                Fecha de inscripción *
              </Label>
              <Input
                type='date'
                name='fecha'
                value={form.fecha}
                onChange={handleChange}
                className={componentClasses.input}
                required
              />
            </div>

            {/* Profesor */}
            <div>
              <Label className={componentClasses.label}>
                <User className='w-4 h-4 inline mr-2' />
                Profesor (opcional)
              </Label>
              <select
                name='profesor'
                value={form.profesor}
                onChange={handleChange}
                className={componentClasses.input}
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
            </div>

            {/* Horario (solo para academia) */}
            {isAcademiaPackage() && (
              <div>
                <Label className={componentClasses.label}>
                  <Clock className='w-4 h-4 inline mr-2' />
                  Horario *
                </Label>
                <select
                  name='horario'
                  value={form.horario}
                  onChange={handleChange}
                  className={componentClasses.input}
                  required
                >
                  <option value=''>Selecciona un horario</option>
                  {horariosGrupos.map((horario) => (
                    <option key={horario.id} value={horario.id}>
                      {horario.nombre_horario}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Botones */}
          <div className='flex gap-3 pt-4'>
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
              disabled={loading || alumnoNoSeleccionado}
              className={`flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white`}
            >
              {loading ? (
                <>
                  <div className={componentClasses.spinner} />
                  Creando...
                </>
              ) : (
                <>
                  <UserPlus className='w-4 h-4 mr-2' />
                  Crear Inscripción
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
