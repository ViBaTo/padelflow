import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import {
  Mail,
  Phone,
  Calendar,
  User,
  Trash2,
  Edit2,
  Award,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { supabase, db } from '../lib/supabase'
import { useState, useEffect } from 'react'
import {
  designTokens,
  componentClasses,
  getButtonGradient,
  getButtonHoverGradient
} from '../lib/designTokens'

export function TeacherDetailsModal({
  open,
  onClose,
  teacher,
  inscripciones = [],
  alumnos = [],
  paquetes = [],
  onDataChange
}) {
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

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null)
        setSuccess(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [error, success])

  // Utilidades para badges
  const getNivelBadge = (nivel) => {
    const colors = {
      A: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
      B: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
      C: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
      D: 'bg-gradient-to-r from-green-500 to-green-600 text-white'
    }
    return (
      <span
        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
          colors[nivel] ||
          'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
        } ${designTokens.shadows.button}`}
      >
        Nivel {nivel}
      </span>
    )
  }

  const getAcademiaBadge = (puedeAcademia) => (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
        puedeAcademia
          ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
          : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
      } ${designTokens.shadows.button}`}
    >
      {puedeAcademia ? 'Academia: Sí' : 'Academia: No'}
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
      className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2`}
      style={{
        backgroundColor: activeTab === tab ? '#3b82f6' : '#ffffff',
        color: activeTab === tab ? '#ffffff' : '#374151',
        border: activeTab === tab ? 'none' : '1px solid #d1d5db',
        boxShadow:
          activeTab === tab ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none'
      }}
    >
      <Icon className='w-4 h-4' />
      {label}
    </button>
  )

  const InfoTab = () => (
    <div className='space-y-6'>
      <Card className={componentClasses.mainCard}>
        <CardHeader className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white'>
          <CardTitle className='text-xl flex items-center gap-2'>
            <User className='w-5 h-5' />
            Información Personal
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-1'>
              <label className={componentClasses.label}>
                <User className='w-4 h-4 inline mr-2' />
                Nombre Completo
              </label>
              {editingField === 'nombre_completo' ? (
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={componentClasses.input}
                    autoFocus
                  />
                  <button
                    onClick={() =>
                      handleInlineEdit('nombre_completo', editValue)
                    }
                    disabled={isSaving}
                    className='px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50'
                  >
                    <CheckCircle className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => {
                      setEditingField(null)
                      setEditValue('')
                    }}
                    className='px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all'
                  >
                    <XCircle className='w-4 h-4' />
                  </button>
                </div>
              ) : (
                <div
                  className='p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between'
                  onClick={() => {
                    setEditingField('nombre_completo')
                    setEditValue(teacher.nombre_completo || '')
                  }}
                >
                  <span className={designTokens.text.primary}>
                    {teacher.nombre_completo || 'No especificado'}
                  </span>
                  <Edit2 className='w-4 h-4 text-gray-400' />
                </div>
              )}
            </div>

            <div className='space-y-1'>
              <label className={componentClasses.label}>
                <Phone className='w-4 h-4 inline mr-2' />
                Teléfono
              </label>
              {editingField === 'telefono' ? (
                <div className='flex gap-2'>
                  <input
                    type='text'
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={componentClasses.input}
                    autoFocus
                  />
                  <button
                    onClick={() => handleInlineEdit('telefono', editValue)}
                    disabled={isSaving}
                    className='px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50'
                  >
                    <CheckCircle className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => {
                      setEditingField(null)
                      setEditValue('')
                    }}
                    className='px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all'
                  >
                    <XCircle className='w-4 h-4' />
                  </button>
                </div>
              ) : (
                <div
                  className='p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between'
                  onClick={() => {
                    setEditingField('telefono')
                    setEditValue(teacher.telefono || '')
                  }}
                >
                  <span className={designTokens.text.primary}>
                    {teacher.telefono || 'No especificado'}
                  </span>
                  <Edit2 className='w-4 h-4 text-gray-400' />
                </div>
              )}
            </div>

            <div className='space-y-1'>
              <label className={componentClasses.label}>
                <Mail className='w-4 h-4 inline mr-2' />
                Email
              </label>
              {editingField === 'email' ? (
                <div className='flex gap-2'>
                  <input
                    type='email'
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={componentClasses.input}
                    autoFocus
                  />
                  <button
                    onClick={() => handleInlineEdit('email', editValue)}
                    disabled={isSaving}
                    className='px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50'
                  >
                    <CheckCircle className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => {
                      setEditingField(null)
                      setEditValue('')
                    }}
                    className='px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all'
                  >
                    <XCircle className='w-4 h-4' />
                  </button>
                </div>
              ) : (
                <div
                  className='p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between'
                  onClick={() => {
                    setEditingField('email')
                    setEditValue(teacher.email || '')
                  }}
                >
                  <span className={designTokens.text.primary}>
                    {teacher.email || 'No especificado'}
                  </span>
                  <Edit2 className='w-4 h-4 text-gray-400' />
                </div>
              )}
            </div>

            <div className='space-y-1'>
              <label className={componentClasses.label}>
                <Award className='w-4 h-4 inline mr-2' />
                Nivel
              </label>
              {editingField === 'nivel' ? (
                <div className='flex gap-2'>
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={componentClasses.input}
                    autoFocus
                  >
                    <option value='A'>Nivel A</option>
                    <option value='B'>Nivel B</option>
                    <option value='C'>Nivel C</option>
                    <option value='D'>Nivel D</option>
                  </select>
                  <button
                    onClick={() => handleInlineEdit('nivel', editValue)}
                    disabled={isSaving}
                    className='px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50'
                  >
                    <CheckCircle className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => {
                      setEditingField(null)
                      setEditValue('')
                    }}
                    className='px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all'
                  >
                    <XCircle className='w-4 h-4' />
                  </button>
                </div>
              ) : (
                <div
                  className='p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between'
                  onClick={() => {
                    setEditingField('nivel')
                    setEditValue(teacher.nivel || 'A')
                  }}
                >
                  <div>{getNivelBadge(teacher.nivel)}</div>
                  <Edit2 className='w-4 h-4 text-gray-400' />
                </div>
              )}
            </div>
          </div>

          <div className='pt-4 border-t border-gray-200'>
            <div className='space-y-1'>
              <label className={componentClasses.label}>
                <Package className='w-4 h-4 inline mr-2' />
                Puede dar Academia
              </label>
              {editingField === 'puede_academia' ? (
                <div className='flex gap-2'>
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className={componentClasses.input}
                    autoFocus
                  >
                    <option value='true'>Sí</option>
                    <option value='false'>No</option>
                  </select>
                  <button
                    onClick={() =>
                      handleInlineEdit('puede_academia', editValue === 'true')
                    }
                    disabled={isSaving}
                    className='px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50'
                  >
                    <CheckCircle className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => {
                      setEditingField(null)
                      setEditValue('')
                    }}
                    className='px-3 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white rounded-lg hover:from-gray-500 hover:to-gray-600 transition-all'
                  >
                    <XCircle className='w-4 h-4' />
                  </button>
                </div>
              ) : (
                <div
                  className='p-3 border border-gray-200 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between'
                  onClick={() => {
                    setEditingField('puede_academia')
                    setEditValue(teacher.puede_academia?.toString() || 'false')
                  }}
                >
                  <div>{getAcademiaBadge(teacher.puede_academia)}</div>
                  <Edit2 className='w-4 h-4 text-gray-400' />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const PaquetesTab = () => (
    <div className='space-y-6'>
      <Card className={componentClasses.mainCard}>
        <CardHeader className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white'>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Package className='w-5 h-5' />
            Paquetes Activos
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
          {/* Resumen de facturación y clases */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <Card className='bg-gradient-to-r from-green-50 to-green-100 border-green-200'>
              <CardContent className='p-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-green-700'>
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
                  <div className='text-sm text-green-600 font-medium'>
                    Facturación Total (con IVA)
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className='bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200'>
              <CardContent className='p-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-blue-700'>
                    {paquetesActivos.reduce(
                      (total, paquete) => total + paquete.clasesUtilizadasTotal,
                      0
                    )}
                  </div>
                  <div className='text-sm text-blue-600 font-medium'>
                    Clases Dadas
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className='bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200'>
              <CardContent className='p-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold text-purple-700'>
                    {paquetesActivos.length}
                  </div>
                  <div className='text-sm text-purple-600 font-medium'>
                    Paquetes
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de paquetes activos */}
          {paquetesActivos.length === 0 ? (
            <Card className='border-dashed border-2 border-gray-300'>
              <CardContent className='p-8 text-center'>
                <Package className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                <p className='text-gray-500 font-medium'>
                  Sin paquetes activos
                </p>
              </CardContent>
            </Card>
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
                                className='text-sm text-gray-600 flex items-center justify-between p-2 bg-white rounded border'
                              >
                                <span className='flex items-center gap-2'>
                                  <User className='w-3 h-3 text-gray-400' />
                                  {alumno.nombre}
                                </span>
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
                                      <span className='text-xs text-gray-500'>
                                        / {paquete.clasesTotales}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleSaveClases(
                                            inscripcion.id_inscripcion
                                          )
                                        }
                                        disabled={savingClases}
                                        className='text-green-600 hover:text-green-700 text-xs p-1 rounded'
                                      >
                                        {savingClases ? (
                                          <div className='w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin' />
                                        ) : (
                                          <CheckCircle className='w-3 h-3' />
                                        )}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditClasesId(null)
                                          setEditClasesValue('')
                                        }}
                                        disabled={savingClases}
                                        className='text-gray-600 hover:text-gray-700 text-xs p-1 rounded'
                                      >
                                        <XCircle className='w-3 h-3' />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className='flex items-center gap-1'>
                                      <span className='text-xs font-medium'>
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
                                        className='text-blue-600 hover:text-blue-700 p-1 rounded'
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
                          <span className='font-bold text-green-600 text-lg'>
                            ${facturacionPaquete.toFixed(2)}
                          </span>
                          <div className='text-xs text-green-500 font-medium'>
                            Facturación (con IVA)
                          </div>
                        </div>
                        <div className='text-sm'>
                          <span className='font-semibold text-blue-600'>
                            {paquete.clasesUtilizadasTotal} /{' '}
                            {paquete.clasesTotales ?? 0}
                          </span>
                          <div className='text-xs text-blue-500 font-medium'>
                            Total clases
                          </div>
                        </div>
                      </div>
                    </div>
                    {paquete.fechaVencimiento && (
                      <div className='mt-4 pt-4 border-t border-blue-200'>
                        <div className='text-sm text-gray-600 flex items-center gap-2'>
                          <Calendar className='w-4 h-4 text-blue-500' />
                          <span>
                            <strong>Vence:</strong>{' '}
                            {new Date(
                              paquete.fechaVencimiento
                            ).toLocaleDateString('es-ES')}
                          </span>
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
      <Card className={componentClasses.mainCard}>
        <CardHeader className='bg-gradient-to-r from-blue-500 to-indigo-600 text-white'>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Award className='w-5 h-5' />
            Historial de Paquetes
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
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
                    <div className='space-y-3 flex-1'>
                      <div className='font-semibold text-lg flex items-center gap-3'>
                        {paquete.nombrePaquete}
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                            paquete.estado === 'ACTIVO'
                              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                              : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                          } ${designTokens.shadows.button}`}
                        >
                          {paquete.estado === 'ACTIVO' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <div className='text-sm text-gray-600 flex items-center gap-2'>
                        <Package className='w-4 h-4 text-blue-500' />
                        <span>
                          <strong>Precio total del paquete:</strong> $
                          {precioTotalPaquete.toFixed(2)}
                        </span>
                      </div>
                      <div className='text-sm text-gray-600 flex items-center gap-2'>
                        <Calendar className='w-4 h-4 text-blue-500' />
                        <span>
                          <strong>Fecha de inicio:</strong>{' '}
                          {new Date(paquete.fechaInicio).toLocaleDateString(
                            'es-ES'
                          )}
                        </span>
                      </div>
                      <div className='text-sm text-gray-600 flex items-center gap-2'>
                        <User className='w-4 h-4 text-blue-500' />
                        <span>
                          <strong>Alumnos ({paquete.alumnos.length}):</strong>
                        </span>
                      </div>
                      <div className='ml-6 grid grid-cols-1 md:grid-cols-2 gap-2'>
                        {paquete.alumnos.map((alumno, index) => (
                          <div
                            key={index}
                            className='text-sm text-gray-600 p-2 bg-gray-50 rounded border'
                          >
                            {alumno.nombre}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className='space-y-3 text-right'>
                      <div className='text-sm'>
                        <span className='font-bold text-green-600 text-lg'>
                          ${facturacionPaquete.toFixed(2)}
                        </span>
                        <div className='text-xs text-green-500 font-medium'>
                          Facturación (con IVA)
                        </div>
                      </div>
                      <div className='text-sm'>
                        <span className='font-semibold text-blue-600'>
                          {paquete.clasesUtilizadasTotal} /{' '}
                          {paquete.clasesTotales ?? 0}
                        </span>
                        <div className='text-xs text-blue-500 font-medium'>
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

  if (!teacher) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className='sm:max-w-[900px] max-h-[95vh] overflow-hidden flex flex-col'>
          <DialogHeader className='flex-shrink-0 pb-4'>
            <DialogTitle className='text-2xl font-bold flex items-center gap-2'>
              <User className='w-6 h-6 text-blue-600' />
              {teacher.nombre_completo}
            </DialogTitle>
          </DialogHeader>

          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              {getNivelBadge(teacher.nivel)}
              {getAcademiaBadge(teacher.puede_academia)}
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className='bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center gap-2 font-medium shadow-lg'
              style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                outline: 'none'
              }}
              title='Eliminar profesor'
            >
              <Trash2 className='w-4 h-4' />
              Eliminar
            </button>
          </div>

          <div className='flex-1 overflow-y-auto'>
            {/* Tabs */}
            <div className='flex gap-2 border-b border-gray-200 mb-6'>
              <TabButton tab='info' icon={User} label='Información' />
              <TabButton
                tab='paquetes'
                icon={Package}
                label='Paquetes Activos'
              />
              <TabButton tab='historial' icon={Award} label='Historial' />
            </div>

            {/* Content */}
            {activeTab === 'info' && <InfoTab />}
            {activeTab === 'paquetes' && <PaquetesTab />}
            {activeTab === 'historial' && <HistorialTab />}
          </div>

          {/* Messages */}
          {error && (
            <div
              className={`fixed bottom-4 right-4 ${componentClasses.errorMessage} ${designTokens.shadows.elevated} z-50`}
            >
              <XCircle className='w-5 h-5 text-red-600 flex-shrink-0' />
              <span className={designTokens.text.error}>{error}</span>
            </div>
          )}
          {success && (
            <div
              className={`fixed bottom-4 right-4 ${componentClasses.successMessage} ${designTokens.shadows.elevated} z-50`}
            >
              <CheckCircle className='w-5 h-5 text-green-600 flex-shrink-0' />
              <span className={designTokens.text.success}>{success}</span>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle className='flex items-center gap-3'>
                <div className='flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center'>
                  <AlertTriangle className='w-6 h-6 text-red-600' />
                </div>
                <div>
                  <div className='text-lg font-semibold text-gray-900'>
                    Confirmar eliminación
                  </div>
                  <p className='text-sm text-gray-600 font-normal'>
                    Esta acción no se puede deshacer
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className='py-4'>
              <p className='text-gray-700 mb-4'>
                ¿Estás seguro que deseas eliminar al profesor{' '}
                <strong>{teacher?.nombre_completo}</strong>?
              </p>
              <div
                className={`p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex gap-3`}
              >
                <AlertTriangle className='w-5 h-5 text-yellow-600 flex-shrink-0' />
                <div>
                  <p className='text-sm text-yellow-800'>
                    <strong>Advertencia:</strong> Al eliminar este profesor se
                    perderá toda su información y no podrá recuperarse.
                  </p>
                </div>
              </div>
            </div>

            <div className='flex gap-3 justify-end pt-4 border-t border-gray-200'>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium'
              >
                <span>Cancelar</span>
              </button>
              <button
                onClick={handleDeleteProfesor}
                disabled={isDeleting}
                className='px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 flex items-center gap-2 font-medium border-0'
              >
                {isDeleting ? (
                  <>
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin' />
                    <span>Eliminando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className='w-4 h-4' />
                    <span>Eliminar</span>
                  </>
                )}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
