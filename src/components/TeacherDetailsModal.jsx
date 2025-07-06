import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import {
  Mail,
  Phone,
  Calendar,
  User,
  Trash2,
  Edit2,
  Award,
  Package,
  AlertTriangle
} from 'lucide-react'
import { supabase, db } from '../lib/supabase'
import { useState, useEffect } from 'react'

export function TeacherDetailsModal({
  open,
  onClose,
  teacher,
  inscripciones = [],
  alumnos = [],
  paquetes = [],
  onDataChange
}) {
  if (!open || !teacher) return null

  const [activeTab, setActiveTab] = useState('info') // 'info', 'paquetes', 'historial'
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editClasesId, setEditClasesId] = useState(null)
  const [editClasesValue, setEditClasesValue] = useState('')
  const [savingClases, setSavingClases] = useState(false)
  const [inscripcionesState, setInscripciones] = useState(inscripciones || [])
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Utilidades para badges
  const getNivelBadge = (nivel) => {
    const colors = {
      A: 'bg-red-100 text-red-800',
      B: 'bg-orange-100 text-orange-800',
      C: 'bg-yellow-100 text-yellow-800',
      D: 'bg-green-100 text-green-800'
    }
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[nivel] || 'bg-gray-100 text-gray-800'
        }`}
      >
        Nivel {nivel}
      </span>
    )
  }

  const getAcademiaBadge = (puedeAcademia) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        puedeAcademia
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      {puedeAcademia ? 'Sí' : 'No'}
    </span>
  )

  // Paquetes activos del profesor agrupados por nombre y fecha
  const inscripcionesActivas = inscripcionesState.filter(
    (insc) =>
      insc.id_profesor === teacher.id_profesor && insc.estado === 'ACTIVO'
  )

  // Agrupar paquetes por nombre y fecha de inscripción
  const paquetesAgrupados = inscripcionesActivas.reduce((grupos, insc) => {
    const paquete = paquetes.find((p) => p.codigo === insc.codigo_paquete)
    const alumno = alumnos.find((a) => a.cedula === insc.cedula_alumno)

    const nombrePaquete = paquete ? paquete.nombre : insc.codigo_paquete
    const fechaInicio = insc.fecha_inscripcion
    const key = `${nombrePaquete}-${fechaInicio}`

    if (!grupos[key]) {
      grupos[key] = {
        nombrePaquete,
        fechaInicio,
        precioPorClaseConIVA:
          paquete && paquete.precio_con_iva ? paquete.precio_con_iva : 0,
        clasesTotales:
          paquete && paquete.numero_clases ? paquete.numero_clases : 0,
        alumnos: [],
        inscripciones: []
      }
    }

    grupos[key].alumnos.push({
      nombre: alumno ? alumno.nombre_completo : 'Alumno no encontrado',
      cedula: insc.cedula_alumno,
      telefono: alumno ? alumno.telefono : 'N/A',
      email: alumno ? alumno.email : 'N/A',
      clasesUtilizadas: insc.clases_utilizadas || 0,
      fechaVencimiento: insc.fecha_vencimiento
    })

    grupos[key].inscripciones.push(insc)

    return grupos
  }, {})

  const paquetesActivos = Object.values(paquetesAgrupados).map((grupo) => ({
    ...grupo,
    clasesUtilizadasTotal: grupo.alumnos.reduce(
      (total, alumno) => total + alumno.clasesUtilizadas,
      0
    ),
    clasesRestantes:
      grupo.clasesTotales -
      grupo.alumnos.reduce(
        (total, alumno) => total + alumno.clasesUtilizadas,
        0
      )
  }))

  // Historial de paquetes agrupados (incluye activos e inactivos)
  const historialInscripciones = inscripcionesState.filter(
    (insc) => insc.id_profesor === teacher.id_profesor
  )

  const historialAgrupado = historialInscripciones.reduce((grupos, insc) => {
    const paquete = paquetes.find((p) => p.codigo === insc.codigo_paquete)
    const alumno = alumnos.find((a) => a.cedula === insc.cedula_alumno)

    const nombrePaquete = paquete ? paquete.nombre : insc.codigo_paquete
    const fechaInicio = insc.fecha_inscripcion
    const key = `${nombrePaquete}-${fechaInicio}`

    if (!grupos[key]) {
      grupos[key] = {
        nombrePaquete,
        fechaInicio,
        precioPorClaseConIVA:
          paquete && paquete.precio_con_iva ? paquete.precio_con_iva : 0,
        clasesTotales:
          paquete && paquete.numero_clases ? paquete.numero_clases : 0,
        alumnos: [],
        inscripciones: []
      }
    }

    grupos[key].alumnos.push({
      nombre: alumno ? alumno.nombre_completo : 'Alumno no encontrado',
      cedula: insc.cedula_alumno,
      telefono: alumno ? alumno.telefono : 'N/A',
      email: alumno ? alumno.email : 'N/A',
      clasesUtilizadas: insc.clases_utilizadas || 0,
      fechaVencimiento: insc.fecha_vencimiento,
      estado: insc.estado
    })

    grupos[key].inscripciones.push(insc)

    return grupos
  }, {})

  const historialPaquetes = Object.values(historialAgrupado)
    .map((grupo) => ({
      ...grupo,
      clasesUtilizadasTotal: grupo.alumnos.reduce(
        (total, alumno) => total + alumno.clasesUtilizadas,
        0
      ),
      clasesRestantes:
        grupo.clasesTotales -
        grupo.alumnos.reduce(
          (total, alumno) => total + alumno.clasesUtilizadas,
          0
        ),
      estado: grupo.alumnos.some((alumno) => alumno.estado === 'ACTIVO')
        ? 'ACTIVO'
        : 'INACTIVO'
    }))
    .sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio))

  // Cálculo de facturación total
  const facturacionTotal = paquetesActivos.reduce((total, paquete) => {
    const clasesDadas = paquete.clasesUtilizadasTotal
    const precioPorClase =
      paquete.precioPorClaseConIVA / (paquete.clasesTotales || 1)
    const facturacionPaquete = clasesDadas * precioPorClase * 1.21
    return total + facturacionPaquete
  }, 0)

  // Total de clases dadas
  const totalClasesDadas = paquetesActivos.reduce((total, paquete) => {
    return total + (paquete.clases_utilizadas || 0)
  }, 0)

  // Campos para edición de profesor
  const profesorFields = [
    {
      name: 'nombre_completo',
      label: 'Nombre completo',
      type: 'text',
      required: true
    },
    { name: 'telefono', label: 'Teléfono', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: false },
    {
      name: 'nivel',
      label: 'Nivel',
      type: 'select',
      options: [
        { value: 'A', label: 'Nivel A' },
        { value: 'B', label: 'Nivel B' },
        { value: 'C', label: 'Nivel C' },
        { value: 'D', label: 'Nivel D' }
      ],
      required: true
    },
    {
      name: 'puede_academia',
      label: 'Puede academia',
      type: 'checkbox',
      required: false
    }
  ]

  // Handlers
  const handleUpdateProfesor = async (data) => {
    setError(null)
    setSuccess(null)
    try {
      const { error } = await db.updateProfesor(teacher.id_profesor, data)
      if (error) throw error
      setSuccess('Información actualizada correctamente')
      setIsEditing(false)
      if (onDataChange) onDataChange()
    } catch (err) {
      setError(err.message)
    }
  }

  // Handler para eliminar profesor
  const handleDeleteProfesor = async () => {
    setIsDeleting(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await db.deleteProfesor(teacher.id_profesor)
      if (error) throw error
      setSuccess('Profesor eliminado correctamente')
      setShowDeleteConfirm(false)
      if (onDataChange) onDataChange()
      // Cerrar modal después de eliminar
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  // Nuevo handler para edición inline
  const handleInlineEdit = async (field, value) => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await db.updateProfesor(teacher.id_profesor, {
        [field]: value
      })
      if (error) throw error
      setSuccess('Información actualizada correctamente')
      setEditingField(null)
      if (onDataChange) onDataChange()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const fetchInscripciones = async () => {
    const { data, error } = await db.getInscripciones()
    if (!error) setInscripciones(data || [])
  }

  const handleSaveClases = async (id_inscripcion) => {
    setSavingClases(true)
    try {
      const { error } = await db.updateInscripcion(id_inscripcion, {
        clases_utilizadas: Number(editClasesValue)
      })
      if (error) throw error
      await fetchInscripciones()
      setEditClasesId(null)
      setEditClasesValue('')
      setSavingClases(false)
    } catch (err) {
      setError(err.message)
    }
  }

  // Componentes de pestañas
  const TabButton = ({ tab, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className='w-4 h-4' />
      {label}
    </button>
  )

  const InfoTab = () => (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-lg flex items-center gap-2'>
            <User className='w-4 h-4' /> Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            {/* Nombre */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Nombre completo
              </label>
              {editingField === 'nombre_completo' ? (
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className='flex-1 px-3 py-2 border rounded-md'
                    disabled={isSaving}
                  />
                  <button
                    onClick={() =>
                      handleInlineEdit('nombre_completo', editValue)
                    }
                    disabled={isSaving}
                    className='px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    disabled={isSaving}
                    className='px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50'
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className='flex justify-between items-center'>
                  <span className='text-lg font-semibold'>
                    {teacher.nombre_completo}
                  </span>
                  <button
                    onClick={() => {
                      setEditingField('nombre_completo')
                      setEditValue(teacher.nombre_completo)
                    }}
                    className='text-blue-600 hover:text-blue-700'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>

            {/* Teléfono */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Teléfono
              </label>
              {editingField === 'telefono' ? (
                <div className='flex gap-2'>
                  <input
                    type='tel'
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className='flex-1 px-3 py-2 border rounded-md'
                    disabled={isSaving}
                  />
                  <button
                    onClick={() => handleInlineEdit('telefono', editValue)}
                    disabled={isSaving}
                    className='px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    disabled={isSaving}
                    className='px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50'
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-2 text-gray-600'>
                    <Phone className='w-4 h-4' />
                    <span>{teacher.telefono}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingField('telefono')
                      setEditValue(teacher.telefono)
                    }}
                    className='text-blue-600 hover:text-blue-700'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Email</label>
              {editingField === 'email' ? (
                <div className='flex gap-2'>
                  <input
                    type='email'
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className='flex-1 px-3 py-2 border rounded-md'
                    disabled={isSaving}
                  />
                  <button
                    onClick={() => handleInlineEdit('email', editValue)}
                    disabled={isSaving}
                    className='px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    disabled={isSaving}
                    className='px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50'
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className='flex justify-between items-center'>
                  <div className='flex items-center gap-2 text-gray-600'>
                    <Mail className='w-4 h-4' />
                    <span>{teacher.email || 'Sin email'}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingField('email')
                      setEditValue(teacher.email || '')
                    }}
                    className='text-blue-600 hover:text-blue-700'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>

            {/* Nivel */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Nivel</label>
              {editingField === 'nivel' ? (
                <div className='flex gap-2'>
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className='flex-1 px-3 py-2 border rounded-md'
                    disabled={isSaving}
                  >
                    <option value='A'>Nivel A</option>
                    <option value='B'>Nivel B</option>
                    <option value='C'>Nivel C</option>
                    <option value='D'>Nivel D</option>
                  </select>
                  <button
                    onClick={() => handleInlineEdit('nivel', editValue)}
                    disabled={isSaving}
                    className='px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    disabled={isSaving}
                    className='px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50'
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className='flex justify-between items-center'>
                  {getNivelBadge(teacher.nivel)}
                  <button
                    onClick={() => {
                      setEditingField('nivel')
                      setEditValue(teacher.nivel)
                    }}
                    className='text-blue-600 hover:text-blue-700 ml-2'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>

            {/* Puede academia */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Puede academia
              </label>
              {editingField === 'puede_academia' ? (
                <div className='flex gap-2'>
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value === 'true')}
                    className='flex-1 px-3 py-2 border rounded-md'
                    disabled={isSaving}
                  >
                    <option value='true'>Sí</option>
                    <option value='false'>No</option>
                  </select>
                  <button
                    onClick={() =>
                      handleInlineEdit('puede_academia', editValue)
                    }
                    disabled={isSaving}
                    className='px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50'
                  >
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditingField(null)}
                    disabled={isSaving}
                    className='px-3 py-2 border rounded-md hover:bg-gray-50 disabled:opacity-50'
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className='flex justify-between items-center'>
                  {getAcademiaBadge(teacher.puede_academia)}
                  <button
                    onClick={() => {
                      setEditingField('puede_academia')
                      setEditValue(teacher.puede_academia)
                    }}
                    className='text-blue-600 hover:text-blue-700 ml-2'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>

            {/* Fecha de ingreso (solo lectura) */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Fecha de ingreso
              </label>
              <div className='flex items-center gap-2 text-gray-600'>
                <Calendar className='w-4 h-4' />
                <span>{teacher.fecha_ingreso}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botón de eliminar profesor */}
      <div className='flex justify-end'>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
        >
          <Trash2 className='w-4 h-4' />
          Eliminar Profesor
        </button>
      </div>
    </div>
  )

  const PaquetesTab = () => (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Paquetes Activos
        </h3>
      </div>

      {/* Resumen de facturación y clases */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                $
                {paquetesActivos
                  .reduce((total, paquete) => {
                    return (
                      total +
                      paquete.clasesUtilizadasTotal *
                        paquete.precioPorClaseConIVA
                    )
                  }, 0)
                  .toFixed(2)}
              </div>
              <div className='text-sm text-gray-600'>
                Facturación Total (con IVA)
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {paquetesActivos.reduce(
                  (total, paquete) => total + paquete.clasesUtilizadasTotal,
                  0
                )}
              </div>
              <div className='text-sm text-gray-600'>Clases Dadas</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-purple-600'>
                {paquetesActivos.length}
              </div>
              <div className='text-sm text-gray-600'>Paquetes</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className='pt-6'>
          {paquetesActivos.length === 0 ? (
            <div className='text-gray-500'>Sin paquetes activos</div>
          ) : (
            <div className='space-y-4'>
              {paquetesActivos.map((paquete) => {
                const clasesDadas = paquete.clasesUtilizadasTotal
                const facturacionPaquete =
                  clasesDadas * paquete.precioPorClaseConIVA
                const precioTotalPaquete =
                  paquete.precioPorClaseConIVA * paquete.clasesTotales
                return (
                  <div
                    key={paquete.nombrePaquete}
                    className='bg-blue-50 border border-blue-100 rounded-lg p-4'
                  >
                    <div className='flex justify-between items-start'>
                      <div className='space-y-2 flex-1'>
                        <div className='font-medium text-lg'>
                          {paquete.nombrePaquete}
                        </div>
                        <div className='text-sm text-gray-600'>
                          <strong>Precio total del paquete:</strong> $
                          {precioTotalPaquete.toFixed(2)}
                        </div>
                        <div className='text-sm text-gray-600'>
                          <strong>Fecha de inicio:</strong>{' '}
                          {new Date(paquete.fechaInicio).toLocaleDateString(
                            'es-ES'
                          )}
                        </div>
                        <div className='text-sm text-gray-600'>
                          <strong>Alumnos ({paquete.alumnos.length}):</strong>
                        </div>
                        <div className='ml-4 space-y-2'>
                          {paquete.alumnos.map((alumno, index) => {
                            const inscripcion = paquete.inscripciones.find(
                              (insc) => insc.cedula_alumno === alumno.cedula
                            )
                            return (
                              <div
                                key={index}
                                className='text-sm text-gray-600 flex items-center justify-between'
                              >
                                <span>• {alumno.nombre}</span>
                                <div className='flex items-center gap-2'>
                                  {editClasesId ===
                                  inscripcion?.id_inscripcion ? (
                                    <div className='flex items-center gap-1'>
                                      <input
                                        type='number'
                                        min='0'
                                        value={editClasesValue}
                                        onChange={(e) =>
                                          setEditClasesValue(e.target.value)
                                        }
                                        className='w-12 px-1 py-0.5 border rounded text-xs'
                                        disabled={savingClases}
                                      />
                                      <span className='text-xs'>
                                        / {paquete.clasesTotales}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleSaveClases(
                                            inscripcion.id_inscripcion
                                          )
                                        }
                                        disabled={savingClases}
                                        className='text-green-600 hover:text-green-700 text-xs'
                                      >
                                        {savingClases ? '...' : '✓'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditClasesId(null)
                                          setEditClasesValue('')
                                        }}
                                        disabled={savingClases}
                                        className='text-gray-600 hover:text-gray-700 text-xs'
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <div className='flex items-center gap-1'>
                                      <span className='text-xs'>
                                        {alumno.clasesUtilizadas} /{' '}
                                        {paquete.clasesTotales}
                                      </span>
                                      <button
                                        onClick={() => {
                                          setEditClasesId(
                                            inscripcion?.id_inscripcion
                                          )
                                          setEditClasesValue(
                                            alumno.clasesUtilizadas.toString()
                                          )
                                        }}
                                        className='text-blue-600 hover:text-blue-700 text-xs'
                                        title='Editar clases'
                                      >
                                        <Edit2 className='w-3 h-3' />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      <div className='space-y-2 text-right'>
                        <div className='text-sm'>
                          <span className='font-medium text-green-600'>
                            ${facturacionPaquete.toFixed(2)}
                          </span>
                          <div className='text-xs text-gray-500'>
                            Facturación (con IVA)
                          </div>
                        </div>
                        <div className='text-sm'>
                          <span className='font-medium text-gray-600'>
                            {paquete.clasesUtilizadasTotal} /{' '}
                            {paquete.clasesTotales ?? 0}
                          </span>
                          <div className='text-xs text-gray-500'>
                            Total clases
                          </div>
                        </div>
                      </div>
                    </div>
                    {paquete.fechaVencimiento && (
                      <div className='mt-3 pt-3 border-t border-blue-200'>
                        <div className='text-sm text-gray-600'>
                          <strong>Vence:</strong>{' '}
                          {new Date(
                            paquete.fechaVencimiento
                          ).toLocaleDateString('es-ES')}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const HistorialTab = () => (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-lg flex items-center gap-2'>
            <Award className='w-4 h-4' /> Historial de Paquetes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {historialPaquetes.map((paquete) => {
              const clasesDadas = paquete.clasesUtilizadasTotal
              const facturacionPaquete =
                clasesDadas * paquete.precioPorClaseConIVA
              const precioTotalPaquete =
                paquete.precioPorClaseConIVA * paquete.clasesTotales
              return (
                <div
                  key={paquete.nombrePaquete}
                  className={`border rounded-lg p-4 ${
                    paquete.estado === 'ACTIVO'
                      ? 'bg-blue-50 border-blue-100'
                      : 'bg-gray-50 border-gray-100'
                  }`}
                >
                  <div className='flex justify-between items-start'>
                    <div className='space-y-2 flex-1'>
                      <div className='font-medium flex items-center gap-2 text-lg'>
                        {paquete.nombrePaquete}
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            paquete.estado === 'ACTIVO'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {paquete.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className='text-sm text-gray-600'>
                        <strong>Precio total del paquete:</strong> $
                        {precioTotalPaquete.toFixed(2)}
                      </div>
                      <div className='text-sm text-gray-600'>
                        <strong>Fecha de inicio:</strong>{' '}
                        {new Date(paquete.fechaInicio).toLocaleDateString(
                          'es-ES'
                        )}
                      </div>
                      <div className='text-sm text-gray-600'>
                        <strong>Alumnos ({paquete.alumnos.length}):</strong>
                      </div>
                      <div className='ml-4 space-y-1'>
                        {paquete.alumnos.map((alumno, index) => (
                          <div key={index} className='text-sm text-gray-600'>
                            • {alumno.nombre}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className='space-y-2 text-right'>
                      <div className='text-sm'>
                        <span className='font-medium text-green-600'>
                          ${facturacionPaquete.toFixed(2)}
                        </span>
                        <div className='text-xs text-gray-500'>
                          Facturación (con IVA)
                        </div>
                      </div>
                      <div className='text-sm'>
                        <span className='font-medium text-gray-600'>
                          {paquete.clasesUtilizadasTotal} /{' '}
                          {paquete.clasesTotales ?? 0}
                        </span>
                        <div className='text-xs text-gray-500'>
                          Total clases
                        </div>
                      </div>
                    </div>
                  </div>
                  {paquete.fechaVencimiento && (
                    <div className='mt-3 pt-3 border-t border-gray-200'>
                      <div className='text-sm text-gray-600'>
                        <strong>Vencimiento:</strong>{' '}
                        {new Date(paquete.fechaVencimiento).toLocaleDateString(
                          'es-ES'
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )

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
            <User className='w-5 h-5' /> {teacher.nombre_completo}
          </h2>
          <div className='flex items-center gap-2 mt-2'>
            {getNivelBadge(teacher.nivel)}
            {getAcademiaBadge(teacher.puede_academia)}
          </div>
        </div>

        {/* Tabs */}
        <div className='flex gap-2 border-b border-gray-200 mb-6'>
          <TabButton tab='info' icon={User} label='Información' />
          <TabButton tab='paquetes' icon={Package} label='Paquetes Activos' />
          <TabButton tab='historial' icon={Award} label='Historial' />
        </div>

        {/* Content */}
        {activeTab === 'info' && <InfoTab />}
        {activeTab === 'paquetes' && <PaquetesTab />}
        {activeTab === 'historial' && <HistorialTab />}

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

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 z-60 flex justify-center items-center bg-black/50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full mx-4'>
            <div className='flex items-center gap-3 mb-4'>
              <div className='flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                <AlertTriangle className='w-6 h-6 text-red-600' />
              </div>
              <div>
                <h3 className='text-lg font-semibold text-gray-900'>
                  Confirmar eliminación
                </h3>
                <p className='text-sm text-gray-600'>
                  Esta acción no se puede deshacer
                </p>
              </div>
            </div>

            <div className='mb-6'>
              <p className='text-gray-700'>
                ¿Estás seguro que deseas eliminar al profesor{' '}
                <strong>{teacher.nombre_completo}</strong>?
              </p>
              <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <p className='text-sm text-yellow-800'>
                  <strong>Advertencia:</strong> Al eliminar este profesor se
                  perderá toda su información y no podrá recuperarse.
                </p>
              </div>
            </div>

            <div className='flex gap-3 justify-end'>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50'
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteProfesor}
                disabled={isDeleting}
                className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2'
              >
                {isDeleting ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className='w-4 h-4' />
                    Eliminar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
