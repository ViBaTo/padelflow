import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import {
  Mail,
  Phone,
  Calendar,
  User,
  Trash2,
  Edit2,
  Plus,
  History,
  Package
} from 'lucide-react'
import { ComprobanteLink } from './ComprobanteLink'
import { uploadFile, deleteFile } from '../lib/storage'
import { supabase, db } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { GenericForm } from './GenericForm'
import { NuevaInscripcionForm } from './NuevaInscripcionForm'

export function StudentDetailsModal({
  open,
  onClose,
  student,
  paquetes = [],
  inscripciones = [],
  categorias = [],
  profesores = [],
  onDataChange
}) {
  if (!open || !student) return null

  const [activeTab, setActiveTab] = useState('info') // 'info', 'paquetes', 'historial'
  const [isEditing, setIsEditing] = useState(false)
  const [showNewPaqueteModal, setShowNewPaqueteModal] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingField, setEditingField] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  // Nuevos estados para edición de clases
  const [editClasesId, setEditClasesId] = useState(null)
  const [editClasesValue, setEditClasesValue] = useState('')
  const [savingClases, setSavingClases] = useState(false)

  // Utilidades para badges
  const getStatusBadge = (status) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium ${
        status === 'ACTIVO'
          ? 'bg-green-100 text-green-800'
          : 'bg-gray-100 text-gray-800'
      }`}
    >
      {status === 'ACTIVO' ? 'Activo' : 'Inactivo'}
    </span>
  )

  const getCategoryBadge = (categoriaId) => {
    if (!categoriaId) {
      return (
        <span className='px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
          Sin categoría
        </span>
      )
    }
    const categoriaObj = categorias.find(
      (cat) => cat.id_categoria === categoriaId
    )
    const nombre = categoriaObj ? categoriaObj.categoria : categoriaId
    return (
      <span className='px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
        {nombre}
      </span>
    )
  }

  // Paquetes activos del alumno
  const inscripcionesActivas = inscripciones.filter(
    (insc) => insc.cedula_alumno === student.cedula && insc.estado === 'ACTIVO'
  )
  const paquetesAlumno = inscripcionesActivas.map((insc) => {
    const paquete = paquetes.find((p) => p.codigo === insc.codigo_paquete)
    return {
      ...insc,
      nombrePaquete: paquete ? paquete.nombre : insc.codigo_paquete
    }
  })

  // Historial de paquetes (incluye activos e inactivos)
  const historialPaquetes = inscripciones
    .filter((insc) => insc.cedula_alumno === student.cedula)
    .map((insc) => {
      const paquete = paquetes.find((p) => p.codigo === insc.codigo_paquete)
      const profesor = profesores.find(
        (p) => p.id_profesor === insc.id_profesor
      )
      return {
        ...insc,
        nombrePaquete: paquete ? paquete.nombre : insc.codigo_paquete,
        nombreProfesor: profesor ? profesor.nombre_completo : 'Sin asignar'
      }
    })
    .sort(
      (a, b) => new Date(b.fecha_inscripcion) - new Date(a.fecha_inscripcion)
    )

  // Campos para edición de alumno
  const alumnoFields = [
    {
      name: 'nombre_completo',
      label: 'Nombre completo',
      type: 'text',
      required: true
    },
    { name: 'telefono', label: 'Teléfono', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email', required: false },
    {
      name: 'categoria_id',
      label: 'Categoría',
      type: 'select',
      options: categorias.map((cat) => ({
        value: cat.id_categoria,
        label: cat.categoria
      })),
      required: true
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'ACTIVO', label: 'Activo' },
        { value: 'INACTIVO', label: 'Inactivo' }
      ],
      required: true
    }
  ]

  // Handlers
  const handleUpdateAlumno = async (data) => {
    setError(null)
    setSuccess(null)
    try {
      const { error } = await db.updateAlumno(student.cedula, data)
      if (error) throw error
      setSuccess('Información actualizada correctamente')
      setIsEditing(false)
      if (onDataChange) onDataChange()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeletePaquete = async (id_inscripcion) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este paquete?'))
      return
    setError(null)
    setSuccess(null)
    try {
      const { error } = await db.deleteInscripcion(id_inscripcion)
      if (error) throw error
      setSuccess('Paquete eliminado correctamente')
      if (onDataChange) onDataChange()
    } catch (err) {
      setError(err.message)
    }
  }

  // Subida de comprobante
  const handleComprobanteUpload = async (id_inscripcion, file) => {
    if (!file) return
    setSavingId(id_inscripcion)
    setError(null)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `${id_inscripcion}_${Date.now()}.${ext}`
      const { error: uploadError } = await uploadFile(
        'comprobantes',
        filePath,
        file
      )
      if (uploadError) throw uploadError

      const { error: updateError } = await supabase
        .from('inscripciones')
        .update({ comprobante: filePath, updated_at: new Date().toISOString() })
        .eq('id_inscripcion', id_inscripcion)
      if (updateError) throw updateError

      if (onDataChange) onDataChange()
    } catch (err) {
      setError('Error: ' + err.message)
    } finally {
      setSavingId(null)
    }
  }

  // Eliminar comprobante
  const handleDeleteComprobante = async (
    id_inscripcion,
    currentComprobante
  ) => {
    setSavingId(id_inscripcion)
    setError(null)
    setSuccess(null)
    try {
      // Eliminar archivo del storage
      if (currentComprobante) {
        await deleteFile(currentComprobante)
      }
      // Actualizar base de datos
      const { error } = await db.updateInscripcion(id_inscripcion, {
        comprobante: null
      })
      if (error) throw error
      setSuccess('Comprobante eliminado correctamente')
      if (onDataChange) onDataChange()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  // Funciones para edición de clases
  const handleEditClases = (id_inscripcion, clasesActuales) => {
    setEditClasesId(id_inscripcion)
    setEditClasesValue(clasesActuales.toString())
  }

  const handleSaveClases = async (id_inscripcion) => {
    setSavingClases(true)
    setError(null)
    setSuccess(null)
    try {
      const nuevasClases = Number(editClasesValue)
      if (isNaN(nuevasClases) || nuevasClases < 0) {
        throw new Error(
          'El número de clases debe ser un número válido mayor o igual a 0'
        )
      }

      const { error } = await db.updateInscripcion(id_inscripcion, {
        clases_utilizadas: nuevasClases
      })
      if (error) throw error

      setSuccess('Número de clases actualizado correctamente')
      setEditClasesId(null)
      setEditClasesValue('')
      if (onDataChange) onDataChange()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingClases(false)
    }
  }

  const handleCancelEditClases = () => {
    setEditClasesId(null)
    setEditClasesValue('')
  }

  // Nuevo handler para edición inline
  const handleInlineEdit = async (field, value) => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await db.updateAlumno(student.cedula, {
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
                    {student.nombre_completo}
                  </span>
                  <button
                    onClick={() => {
                      setEditingField('nombre_completo')
                      setEditValue(student.nombre_completo)
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
                    <span>{student.telefono}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingField('telefono')
                      setEditValue(student.telefono)
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
                    <span>{student.email || 'Sin email'}</span>
                  </div>
                  <button
                    onClick={() => {
                      setEditingField('email')
                      setEditValue(student.email || '')
                    }}
                    className='text-blue-600 hover:text-blue-700'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>

            {/* Categoría */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Categoría
              </label>
              {editingField === 'categoria_id' ? (
                <div className='flex gap-2'>
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className='flex-1 px-3 py-2 border rounded-md'
                    disabled={isSaving}
                  >
                    {categorias.map((cat) => (
                      <option key={cat.id_categoria} value={cat.id_categoria}>
                        {cat.categoria}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleInlineEdit('categoria_id', editValue)}
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
                  {getCategoryBadge(student.categoria_id)}
                  <button
                    onClick={() => {
                      setEditingField('categoria_id')
                      setEditValue(student.categoria_id)
                    }}
                    className='text-blue-600 hover:text-blue-700 ml-2'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>

            {/* Estado */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Estado
              </label>
              {editingField === 'estado' ? (
                <div className='flex gap-2'>
                  <select
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className='flex-1 px-3 py-2 border rounded-md'
                    disabled={isSaving}
                  >
                    <option value='ACTIVO'>Activo</option>
                    <option value='INACTIVO'>Inactivo</option>
                  </select>
                  <button
                    onClick={() => handleInlineEdit('estado', editValue)}
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
                  {getStatusBadge(student.estado)}
                  <button
                    onClick={() => {
                      setEditingField('estado')
                      setEditValue(student.estado)
                    }}
                    className='text-blue-600 hover:text-blue-700 ml-2'
                  >
                    <Edit2 className='w-4 h-4' />
                  </button>
                </div>
              )}
            </div>

            {/* Fecha de registro (solo lectura) */}
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Fecha de registro
              </label>
              <div className='flex items-center gap-2 text-gray-600'>
                <Calendar className='w-4 h-4' />
                <span>{student.fecha_registro}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const PaquetesTab = () => (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Paquetes Activos
        </h3>
        <button
          onClick={() => setShowNewPaqueteModal(true)}
          className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium'
        >
          <Plus className='w-4 h-4' /> Nuevo Paquete
        </button>
      </div>
      <Card>
        <CardContent className='pt-6'>
          {paquetesAlumno.length === 0 ? (
            <div className='text-gray-500'>Sin paquetes activos</div>
          ) : (
            <div className='space-y-4'>
              {paquetesAlumno.map((paq) => {
                const profesor = profesores.find(
                  (p) => p.id_profesor === paq.id_profesor
                )
                return (
                  <div
                    key={paq.id_inscripcion}
                    className='bg-blue-50 border border-blue-100 rounded-lg p-4'
                  >
                    <div className='flex justify-between items-start'>
                      <div className='space-y-2'>
                        <div className='font-medium'>{paq.nombrePaquete}</div>
                        <div className='text-sm text-gray-600'>
                          {editClasesId === paq.id_inscripcion ? (
                            <div className='flex items-center gap-2'>
                              <span>Clases:</span>
                              <input
                                type='number'
                                min='0'
                                value={editClasesValue}
                                onChange={(e) =>
                                  setEditClasesValue(e.target.value)
                                }
                                className='w-16 px-2 py-1 border rounded text-sm'
                                disabled={savingClases}
                              />
                              <span>/ {paq.clases_totales || 0}</span>
                              <button
                                onClick={() =>
                                  handleSaveClases(paq.id_inscripcion)
                                }
                                disabled={savingClases}
                                className='text-green-600 hover:text-green-700 text-xs'
                              >
                                {savingClases ? 'Guardando...' : '✓'}
                              </button>
                              <button
                                onClick={handleCancelEditClases}
                                disabled={savingClases}
                                className='text-gray-600 hover:text-gray-700 text-xs'
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div className='flex items-center gap-2'>
                              <span>
                                Clases: {paq.clases_utilizadas || 0} /{' '}
                                {paq.clases_totales || 0}
                              </span>
                              <button
                                onClick={() =>
                                  handleEditClases(
                                    paq.id_inscripcion,
                                    paq.clases_utilizadas || 0
                                  )
                                }
                                className='text-blue-600 hover:text-blue-700 text-xs'
                                title='Editar número de clases'
                              >
                                <Edit2 className='w-3 h-3' />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className='text-sm text-gray-600'>
                          Profesor:{' '}
                          {profesor ? profesor.nombre_completo : 'Sin asignar'}
                        </div>
                        <div className='text-sm text-gray-600'>
                          Vence:{' '}
                          {paq.fecha_vencimiento
                            ? new Date(
                                paq.fecha_vencimiento
                              ).toLocaleDateString('es-ES')
                            : 'Sin fecha'}
                        </div>
                      </div>
                      <div className='flex flex-col items-end gap-2'>
                        <button
                          onClick={() =>
                            handleDeletePaquete(paq.id_inscripcion)
                          }
                          className='text-red-600 hover:text-red-700 text-sm flex items-center gap-1'
                        >
                          <Trash2 className='w-4 h-4' /> Eliminar
                        </button>
                        <div className='text-sm'>
                          {paq.comprobante ? (
                            <div className='flex items-center gap-2'>
                              <ComprobanteLink filePath={paq.comprobante} />
                              <button
                                onClick={() =>
                                  handleDeleteComprobante(
                                    paq.id_inscripcion,
                                    paq.comprobante
                                  )
                                }
                                disabled={savingId === paq.id_inscripcion}
                                className='text-red-600 hover:text-red-700'
                              >
                                <Trash2 className='w-4 h-4' />
                              </button>
                            </div>
                          ) : (
                            <input
                              type='file'
                              accept='.png,.jpg,.jpeg,.pdf'
                              className='block text-xs border border-gray-200 rounded px-2 py-1 bg-white hover:border-gray-300'
                              onChange={(e) =>
                                handleComprobanteUpload(
                                  paq.id_inscripcion,
                                  e.target.files[0]
                                )
                              }
                              disabled={savingId === paq.id_inscripcion}
                            />
                          )}
                        </div>
                      </div>
                    </div>
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
            <History className='w-4 h-4' /> Historial de Paquetes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {historialPaquetes.map((paq) => (
              <div
                key={paq.id_inscripcion}
                className={`border rounded-lg p-4 ${
                  paq.estado === 'ACTIVO'
                    ? 'bg-blue-50 border-blue-100'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className='flex justify-between items-start'>
                  <div className='space-y-2'>
                    <div className='font-medium flex items-center gap-2'>
                      {paq.nombrePaquete}
                      {getStatusBadge(paq.estado)}
                    </div>
                    <div className='text-sm text-gray-600'>
                      Fecha de inscripción:{' '}
                      {new Date(paq.fecha_inscripcion).toLocaleDateString(
                        'es-ES'
                      )}
                    </div>
                    <div className='text-sm text-gray-600'>
                      Clases: {paq.clases_utilizadas || 0} /{' '}
                      {paq.clases_totales || 0}
                      {paq.estado === 'ACTIVO' && (
                        <span className='ml-2 text-xs text-blue-600'>
                          (Editar en pestaña Paquetes)
                        </span>
                      )}
                    </div>
                    <div className='text-sm text-gray-600'>
                      Profesor: {paq.nombreProfesor}
                    </div>
                    {paq.fecha_vencimiento && (
                      <div className='text-sm text-gray-600'>
                        Vencimiento:{' '}
                        {new Date(paq.fecha_vencimiento).toLocaleDateString(
                          'es-ES'
                        )}
                      </div>
                    )}
                  </div>
                  {paq.comprobante && (
                    <ComprobanteLink filePath={paq.comprobante} />
                  )}
                </div>
              </div>
            ))}
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
            <User className='w-5 h-5' /> {student.nombre_completo}
          </h2>
          <div className='flex items-center gap-2 mt-2'>
            {getStatusBadge(student.estado)}
            {getCategoryBadge(student.categoria_id)}
          </div>
        </div>

        {/* Tabs */}
        <div className='flex gap-2 border-b border-gray-200 mb-6'>
          <TabButton tab='info' icon={User} label='Información' />
          <TabButton tab='paquetes' icon={Package} label='Paquetes' />
          <TabButton tab='historial' icon={History} label='Historial' />
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

        {/* Modal de nuevo paquete */}
        <NuevaInscripcionForm
          open={showNewPaqueteModal}
          onClose={() => setShowNewPaqueteModal(false)}
          onSuccess={() => {
            setShowNewPaqueteModal(false)
            if (onDataChange) onDataChange()
          }}
          alumnoPreSeleccionado={student}
        />
      </div>
    </div>
  )
}
