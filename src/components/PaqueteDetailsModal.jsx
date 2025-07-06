import { Card, CardHeader, CardTitle, CardContent } from './ui/card'
import {
  Package,
  DollarSign,
  Calendar,
  Edit2,
  X,
  AlertTriangle,
  Trash2
} from 'lucide-react'
import { useState } from 'react'
import { GenericForm } from './GenericForm'
import { db } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'

export function PaqueteDetailsModal({ open, onClose, paquete, onDataChange }) {
  if (!open || !paquete) return null

  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Utilidades para badges
  const getTipoServicioBadge = (tipo) => {
    const colors = {
      CONDFIS: 'bg-blue-100 text-blue-800',
      ACADEMIA: 'bg-green-100 text-green-800',
      CLINICA: 'bg-purple-100 text-purple-800',
      PROFESOR_A: 'bg-yellow-100 text-yellow-800',
      PROFESOR_B: 'bg-pink-100 text-pink-800',
      INTENSIVO: 'bg-orange-100 text-orange-800',
      OTRO: 'bg-gray-100 text-gray-800'
    }
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[tipo] || colors['OTRO']
        }`}
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
    <div
      className='fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity duration-300'
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className='relative bg-white h-full w-full max-w-lg border-l border-gray-200 px-8 py-8 overflow-y-auto animate-fade-in-right'>
        <button
          className='absolute top-4 right-6 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none transition-colors duration-200'
          onClick={onClose}
          aria-label='Cerrar'
        >
          ×
        </button>
        {/* Header */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center space-x-3'>
            <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
              <Package className='w-5 h-5 text-blue-600' />
            </div>
            <div>
              <h2 className='text-xl font-bold text-gray-900'>
                {paquete.nombre}
              </h2>
              <p className='text-sm text-gray-500'>Código: {paquete.codigo}</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className='flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
            >
              <Edit2 className='w-4 h-4' />
              Editar
            </button>
          )}
        </div>
        {error && (
          <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}
        {success && (
          <div className='mb-4 p-3 bg-green-50 border border-green-200 rounded-lg'>
            <p className='text-sm text-green-600'>{success}</p>
          </div>
        )}
        {isEditing ? (
          <div className='space-y-6'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Editar Paquete
              </h3>
              <div className='flex space-x-2'>
                <button
                  onClick={() => setIsEditing(false)}
                  className='px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors'
                >
                  Cancelar
                </button>
              </div>
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
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <Package className='w-5 h-5 text-blue-600' />
                  <span>Información del Paquete</span>
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Código
                    </label>
                    <p className='text-sm text-gray-900 font-medium'>
                      {paquete.codigo}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Categoría
                    </label>
                    <p className='text-sm text-gray-900'>{paquete.categoria}</p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Nombre
                    </label>
                    <p className='text-sm text-gray-900 font-medium'>
                      {paquete.nombre}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Tipo de Servicio
                    </label>
                    <div className='mt-1'>
                      {getTipoServicioBadge(paquete.tipo_servicio)}
                    </div>
                  </div>
                </div>
                <div>
                  <label className='text-sm font-medium text-gray-500'>
                    Descripción
                  </label>
                  <p className='text-sm text-gray-900 mt-1'>
                    {paquete.descripcion}
                  </p>
                </div>
              </CardContent>
            </Card>
            {/* Información de clases y precio */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <Calendar className='w-5 h-5 text-green-600' />
                  <span>Detalles de Clases</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Número de Clases
                    </label>
                    <p className='text-2xl font-bold text-gray-900'>
                      {paquete.numero_clases}
                    </p>
                  </div>
                  <div>
                    <label className='text-sm font-medium text-gray-500'>
                      Precio por Clase
                    </label>
                    <p className='text-2xl font-bold text-green-600'>
                      {formatCurrency(paquete.precio_con_iva)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Precio total */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center space-x-2'>
                  <DollarSign className='w-5 h-5 text-green-600' />
                  <span>Precio Total</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-center'>
                  <p className='text-sm text-gray-500 mb-2'>
                    Precio total del paquete
                  </p>
                  <p className='text-4xl font-bold text-green-600'>
                    {formatCurrency(
                      paquete.precio_con_iva * paquete.numero_clases
                    )}
                  </p>
                  <p className='text-sm text-gray-500 mt-1'>
                    {paquete.numero_clases} clases ×{' '}
                    {formatCurrency(paquete.precio_con_iva)} por clase
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Botón de eliminar paquete */}
            <div className='flex justify-end pt-4'>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className='flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors'
              >
                <Trash2 className='w-4 h-4' />
                Eliminar Paquete
              </button>
            </div>
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
                ¿Estás seguro que deseas eliminar el paquete{' '}
                <strong>{paquete.nombre}</strong>?
              </p>
              <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
                <p className='text-sm text-yellow-800'>
                  <strong>Advertencia:</strong> Al eliminar este paquete se
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
                onClick={handleDeletePaquete}
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
