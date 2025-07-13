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
  Package,
  AlertTriangle,
  CheckCircle,
  FileText,
  Upload,
  Download
} from 'lucide-react'
import { ComprobanteLink } from './ComprobanteLink'
import { uploadFile, deleteFile } from '../lib/storage'
import { supabase, db } from '../lib/supabase'
import { useState, useEffect } from 'react'
import { GenericForm } from './GenericForm'
import { NuevaInscripcionForm } from './NuevaInscripcionForm'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { designTokens, componentClasses } from '../lib/designTokens'

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
  if (!student) return null

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Utilidades para badges
  const getStatusBadge = (status) => (
    <span
      className={`px-3 py-1 ${designTokens.rounded.small} text-xs font-medium ${
        status === 'ACTIVO'
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-gray-100 text-gray-800 border border-gray-200'
      }`}
    >
      {status === 'ACTIVO' ? 'Activo' : 'Inactivo'}
    </span>
  )

  const getCategoryBadge = (categoriaId) => {
    if (!categoriaId) {
      return (
        <span
          className={`px-3 py-1 ${designTokens.rounded.small} text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200`}
        >
          Sin categoría
        </span>
      )
    }
    const categoriaObj = categorias.find(
      (cat) => cat.id_categoria === categoriaId
    )
    const nombre = categoriaObj ? categoriaObj.categoria : categoriaId
    return (
      <span
        className={`px-3 py-1 ${designTokens.rounded.small} text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200`}
      >
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

  // Handler para eliminar alumno
  const handleDeleteAlumno = async () => {
    setIsDeleting(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await db.deleteAlumno(student.cedula)
      if (error) throw error
      setSuccess('Alumno eliminado correctamente')
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
      // Subir el archivo
      const filePath = await uploadFile(file, 'comprobantes')

      // Actualizar la inscripción con la URL del comprobante
      const { error } = await db.updateInscripcion(id_inscripcion, {
        comprobante: filePath
      })

      if (error) throw error
      setSuccess('Comprobante subido correctamente')
      if (onDataChange) onDataChange()
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingId(null)
    }
  }

  const handleDeleteComprobante = async (
    id_inscripcion,
    currentComprobante
  ) => {
    if (
      !window.confirm('¿Estás seguro de que quieres eliminar este comprobante?')
    )
      return
    setSavingId(id_inscripcion)
    setError(null)
    try {
      // Eliminar archivo del storage
      if (currentComprobante) {
        await deleteFile(currentComprobante)
      }

      // Actualizar la inscripción
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

  const handleEditClases = (id_inscripcion, clasesActuales) => {
    setEditClasesId(id_inscripcion)
    setEditClasesValue(clasesActuales.toString())
  }

  const handleSaveClases = async (id_inscripcion) => {
    setSavingClases(true)
    setError(null)
    try {
      const nuevasClases = parseInt(editClasesValue)
      if (isNaN(nuevasClases) || nuevasClases < 0) {
        setError('Por favor ingresa un número válido de clases')
        return
      }

      const { error } = await db.updateInscripcion(id_inscripcion, {
        clases_utilizadas: nuevasClases
      })

      if (error) throw error
      setSuccess('Clases actualizadas correctamente')
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

  const handleInlineEdit = async (field, value) => {
    setIsSaving(true)
    setError(null)
    try {
      const { error } = await db.updateAlumno(student.cedula, {
        [field]: value
      })
      if (error) throw error
      setSuccess(`${field} actualizado correctamente`)
      setEditingField(null)
      setEditValue('')
      if (onDataChange) onDataChange()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const TabButton = ({ tab, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-2 ${
        designTokens.rounded.button
      } text-sm font-medium transition-colors ${
        activeTab === tab
          ? 'bg-blue-100 text-blue-700 border border-blue-200'
          : `${designTokens.text.secondary} hover:bg-gray-100 dark:hover:bg-gray-700`
      }`}
    >
      <Icon className='w-4 h-4' />
      <span>{label}</span>
    </button>
  )

  const InfoTab = () => (
    <div className='space-y-6'>
      {/* Modal de confirmación para eliminar */}
      {showDeleteConfirm && (
        <div className={`${componentClasses.errorMessage} space-y-4`}>
          <div className='flex items-start space-x-3'>
            <AlertTriangle className='w-5 h-5 text-red-500 flex-shrink-0 mt-0.5' />
            <div>
              <h3
                className={`${designTokens.typography.h5} ${designTokens.text.error} mb-2`}
              >
                ¿Eliminar alumno?
              </h3>
              <p className={`${designTokens.text.error} text-sm mb-4`}>
                Esta acción no se puede deshacer. El alumno "
                {student.nombre_completo}" será eliminado permanentemente.
              </p>
              <div className='flex gap-3'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </Button>
                <Button
                  size='sm'
                  onClick={handleDeleteAlumno}
                  disabled={isDeleting}
                  className='bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
                >
                  {isDeleting ? (
                    <>
                      <div className={componentClasses.spinner} />
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <Trash2 className='w-4 h-4 mr-2' />
                      Eliminar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3
              className={`${designTokens.typography.h4} ${designTokens.text.primary}`}
            >
              Editar Información del Alumno
            </h3>
            <Button
              variant='outline'
              onClick={() => setIsEditing(false)}
              size='sm'
            >
              Cancelar
            </Button>
          </div>
          <GenericForm
            fields={alumnoFields}
            initialValues={student}
            onSubmit={handleUpdateAlumno}
            submitText='Guardar Cambios'
          />
        </div>
      ) : (
        <div className='space-y-6'>
          {/* Información personal */}
          <Card className={componentClasses.mainCard}>
            <CardHeader className={componentClasses.cardHeader}>
              <CardTitle
                className={`${componentClasses.cardHeaderTitle} flex items-center space-x-2`}
              >
                <User className='w-5 h-5' />
                <span>Información Personal</span>
              </CardTitle>
            </CardHeader>
            <CardContent
              className={`${componentClasses.cardContent} space-y-4`}
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label
                    className={`text-sm font-medium ${designTokens.text.muted}`}
                  >
                    Nombre completo
                  </label>
                  <p
                    className={`text-lg ${designTokens.text.primary} font-semibold`}
                  >
                    {student.nombre_completo}
                  </p>
                </div>
                <div>
                  <label
                    className={`text-sm font-medium ${designTokens.text.muted}`}
                  >
                    Cédula
                  </label>
                  <p
                    className={`text-sm ${designTokens.text.primary} font-medium`}
                  >
                    {student.cedula}
                  </p>
                </div>
                <div>
                  <label
                    className={`text-sm font-medium ${designTokens.text.muted}`}
                  >
                    Teléfono
                  </label>
                  <p
                    className={`text-sm ${designTokens.text.primary} flex items-center`}
                  >
                    <Phone className='w-4 h-4 mr-2 text-blue-600' />
                    {student.telefono}
                  </p>
                </div>
                <div>
                  <label
                    className={`text-sm font-medium ${designTokens.text.muted}`}
                  >
                    Email
                  </label>
                  <p
                    className={`text-sm ${designTokens.text.primary} flex items-center`}
                  >
                    <Mail className='w-4 h-4 mr-2 text-blue-600' />
                    {student.email || 'No especificado'}
                  </p>
                </div>
                <div>
                  <label
                    className={`text-sm font-medium ${designTokens.text.muted}`}
                  >
                    Estado
                  </label>
                  <div className='mt-2'>{getStatusBadge(student.estado)}</div>
                </div>
                <div>
                  <label
                    className={`text-sm font-medium ${designTokens.text.muted}`}
                  >
                    Categoría
                  </label>
                  <div className='mt-2'>
                    {getCategoryBadge(student.categoria_id)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className='flex gap-3'>
            <Button
              onClick={() => setIsEditing(true)}
              className='bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
            >
              <Edit2 className='w-4 h-4 mr-2' />
              Editar
            </Button>
            <Button
              variant='outline'
              onClick={() => setShowDeleteConfirm(true)}
              className='text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
            >
              <Trash2 className='w-4 h-4 mr-2' />
              Eliminar
            </Button>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle
            className={`${designTokens.typography.h3} ${designTokens.text.primary} flex items-center space-x-2`}
          >
            <User className='w-6 h-6 text-blue-600' />
            <span>{student.nombre_completo}</span>
          </DialogTitle>
          <DialogDescription className={designTokens.text.secondary}>
            Información completa del alumno - Cédula: {student.cedula}
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Mensajes de estado */}
          {error && (
            <div className={componentClasses.errorMessage}>
              <AlertTriangle className='w-4 h-4 text-red-500 flex-shrink-0' />
              <span className='text-sm'>{error}</span>
            </div>
          )}

          {success && (
            <div className={componentClasses.successMessage}>
              <CheckCircle className='w-4 h-4 text-green-500 flex-shrink-0' />
              <span className='text-sm'>{success}</span>
            </div>
          )}

          {/* Navegación por tabs */}
          <div className='flex space-x-2 overflow-x-auto'>
            <TabButton tab='info' icon={User} label='Información' />
            <TabButton tab='paquetes' icon={Package} label='Paquetes Activos' />
            <TabButton tab='historial' icon={History} label='Historial' />
          </div>

          {/* Contenido de tabs */}
          <div className='mt-6'>
            {activeTab === 'info' && <InfoTab />}
            {/* Aquí irían los otros tabs: PaquetesTab y HistorialTab */}
          </div>
        </div>

        {/* Modal de nueva inscripción */}
        <NuevaInscripcionForm
          open={showNewPaqueteModal}
          onClose={() => setShowNewPaqueteModal(false)}
          onSuccess={() => {
            setShowNewPaqueteModal(false)
            if (onDataChange) onDataChange()
          }}
          alumnoPreSeleccionado={student}
        />
      </DialogContent>
    </Dialog>
  )
}
