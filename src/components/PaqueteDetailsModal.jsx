import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import {
  Package,
  DollarSign,
  Calendar,
  Edit2,
  AlertTriangle,
  Trash2,
  CheckCircle,
  FileText,
  Tag,
  Users
} from 'lucide-react'
import { useState } from 'react'
import { GenericForm } from './GenericForm'
import { db } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog'
import { Button } from './ui/button'
import { designTokens, componentClasses } from '../lib/designTokens'

export function PaqueteDetailsModal({ open, onClose, paquete, onDataChange }) {
  if (!paquete) return null

  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Utilidades para badges
  const getTipoServicioBadge = (tipo) => {
    const colors = {
      CONDFIS: 'bg-blue-100 text-blue-800 border-blue-200',
      ACADEMIA: 'bg-green-100 text-green-800 border-green-200',
      CLINICA: 'bg-purple-100 text-purple-800 border-purple-200',
      PROFESOR_A: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PROFESOR_B: 'bg-pink-100 text-pink-800 border-pink-200',
      INTENSIVO: 'bg-orange-100 text-orange-800 border-orange-200',
      OTRO: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return (
      <span
        className={`px-3 py-1 ${
          designTokens.rounded.small
        } text-xs font-medium border ${colors[tipo] || colors['OTRO']}`}
      >
        {tipo}
      </span>
    )
  }

  // Campos para edición de paquete
  const paqueteFields = [
    { name: 'codigo', label: 'Código', type: 'text', required: true },
    { name: 'categoria', label: 'Categoría', type: 'text', required: true },
    { name: 'nombre', label: 'Nombre', type: 'text', required: true },
    {
      name: 'tipo_servicio',
      label: 'Tipo de servicio',
      type: 'text',
      required: true
    },
    { name: 'descripcion', label: 'Descripción', type: 'text', required: true },
    {
      name: 'numero_clases',
      label: 'Número de clases',
      type: 'number',
      required: true
    },
    { name: 'precio', label: 'Precio', type: 'number', required: true }
  ]

  // Handlers
  const handleUpdatePaquete = async (data) => {
    setError(null)
    setSuccess(null)
    try {
      const { error } = await db.updatePaquete(paquete.codigo, data)
      if (error) throw error
      setSuccess('Paquete actualizado correctamente')
      setIsEditing(false)
      if (onDataChange) onDataChange()
    } catch (err) {
      setError(err.message)
    }
  }

  // Handler para eliminar paquete
  const handleDeletePaquete = async () => {
    setIsDeleting(true)
    setError(null)
    setSuccess(null)
    try {
      const { error } = await db.deletePaquete(paquete.codigo)
      if (error) throw error
      setSuccess('Paquete eliminado correctamente')
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle
            className={`${designTokens.typography.h3} ${designTokens.text.primary} flex items-center space-x-2`}
          >
            <Package className='w-6 h-6 text-blue-600' />
            <span>{paquete.nombre}</span>
          </DialogTitle>
          <DialogDescription className={designTokens.text.secondary}>
            Detalles completos del paquete - Código: {paquete.codigo}
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

          {/* Modal de confirmación para eliminar */}
          {showDeleteConfirm && (
            <div className={`${componentClasses.errorMessage} space-y-4`}>
              <div className='flex items-start space-x-3'>
                <AlertTriangle className='w-5 h-5 text-red-500 flex-shrink-0 mt-0.5' />
                <div>
                  <h3
                    className={`${designTokens.typography.h5} ${designTokens.text.error} mb-2`}
                  >
                    ¿Eliminar paquete?
                  </h3>
                  <p className={`${designTokens.text.error} text-sm mb-4`}>
                    Esta acción no se puede deshacer. El paquete "
                    {paquete.nombre}" será eliminado permanentemente.
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
                      onClick={handleDeletePaquete}
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
                  Editar Paquete
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
                fields={paqueteFields}
                initialValues={paquete}
                onSubmit={handleUpdatePaquete}
                submitText='Guardar Cambios'
              />
            </div>
          ) : (
            <div className='space-y-6'>
              {/* Información básica */}
              <Card className={componentClasses.mainCard}>
                <CardHeader className={componentClasses.cardHeader}>
                  <CardTitle
                    className={`${componentClasses.cardHeaderTitle} flex items-center space-x-2`}
                  >
                    <Package className='w-5 h-5' />
                    <span>Información del Paquete</span>
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
                        Código
                      </label>
                      <p
                        className={`text-sm ${designTokens.text.primary} font-medium`}
                      >
                        {paquete.codigo}
                      </p>
                    </div>
                    <div>
                      <label
                        className={`text-sm font-medium ${designTokens.text.muted}`}
                      >
                        Categoría
                      </label>
                      <p
                        className={`text-sm ${designTokens.text.primary} font-medium flex items-center`}
                      >
                        <Tag className='w-4 h-4 mr-2 text-blue-600' />
                        {paquete.categoria}
                      </p>
                    </div>
                    <div className='md:col-span-2'>
                      <label
                        className={`text-sm font-medium ${designTokens.text.muted}`}
                      >
                        Nombre del paquete
                      </label>
                      <p
                        className={`text-lg ${designTokens.text.primary} font-semibold`}
                      >
                        {paquete.nombre}
                      </p>
                    </div>
                    <div>
                      <label
                        className={`text-sm font-medium ${designTokens.text.muted}`}
                      >
                        Tipo de servicio
                      </label>
                      <div className='mt-2'>
                        {getTipoServicioBadge(paquete.tipo_servicio)}
                      </div>
                    </div>
                    <div>
                      <label
                        className={`text-sm font-medium ${designTokens.text.muted}`}
                      >
                        Número de clases
                      </label>
                      <p
                        className={`text-sm ${designTokens.text.primary} font-medium flex items-center`}
                      >
                        <Users className='w-4 h-4 mr-2 text-blue-600' />
                        {paquete.numero_clases} clases
                      </p>
                    </div>
                  </div>

                  {paquete.descripcion && (
                    <div className='pt-4 border-t border-gray-200 dark:border-gray-700'>
                      <label
                        className={`text-sm font-medium ${designTokens.text.muted}`}
                      >
                        Descripción
                      </label>
                      <p
                        className={`text-sm ${designTokens.text.secondary} mt-2 flex items-start`}
                      >
                        <FileText className='w-4 h-4 mr-2 text-blue-600 flex-shrink-0 mt-0.5' />
                        {paquete.descripcion}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Información de precios */}
              <Card className={componentClasses.mainCard}>
                <CardHeader className={componentClasses.cardHeader}>
                  <CardTitle
                    className={`${componentClasses.cardHeaderTitle} flex items-center space-x-2`}
                  >
                    <DollarSign className='w-5 h-5' />
                    <span>Información de Precios</span>
                  </CardTitle>
                </CardHeader>
                <CardContent
                  className={`${componentClasses.cardContent} space-y-4`}
                >
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div
                      className={`${designTokens.backgrounds.success} ${designTokens.borders.success} ${designTokens.rounded.card} p-4`}
                    >
                      <label
                        className={`text-sm font-medium ${designTokens.text.success}`}
                      >
                        Precio base
                      </label>
                      <p
                        className={`text-2xl ${designTokens.text.success} font-bold`}
                      >
                        {formatCurrency(paquete.precio)}
                      </p>
                    </div>

                    {paquete.precio_con_iva && (
                      <div
                        className={`${designTokens.backgrounds.info} ${designTokens.borders.info} ${designTokens.rounded.card} p-4`}
                      >
                        <label
                          className={`text-sm font-medium ${designTokens.text.info}`}
                        >
                          Precio con IVA
                        </label>
                        <p
                          className={`text-2xl ${designTokens.text.info} font-bold`}
                        >
                          {formatCurrency(paquete.precio_con_iva)}
                        </p>
                      </div>
                    )}
                  </div>

                  {paquete.numero_clases && paquete.precio && (
                    <div
                      className={`${designTokens.backgrounds.warning} ${designTokens.borders.warning} ${designTokens.rounded.card} p-4`}
                    >
                      <label
                        className={`text-sm font-medium ${designTokens.text.warning}`}
                      >
                        Precio por clase
                      </label>
                      <p
                        className={`text-lg ${designTokens.text.warning} font-semibold`}
                      >
                        {formatCurrency(paquete.precio / paquete.numero_clases)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className='flex flex-col sm:flex-row gap-3'>
          {!isEditing && !showDeleteConfirm && (
            <>
              <Button
                variant='outline'
                onClick={() => setShowDeleteConfirm(true)}
                className='text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300'
              >
                <Trash2 className='w-4 h-4 mr-2' />
                Eliminar
              </Button>
              <Button
                onClick={() => setIsEditing(true)}
                className='bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
              >
                <Edit2 className='w-4 h-4 mr-2' />
                Editar
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
