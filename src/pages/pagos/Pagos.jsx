import { useEffect, useState } from 'react'
import {
  Filter,
  Trash2,
  DollarSign,
  CreditCard,
  FileText,
  Search,
  User,
  Package,
  Calendar
} from 'lucide-react'
import { supabase, db } from '../../lib/supabase'
import { ComprobanteLink } from '../../components/ComprobanteLink'
import { uploadFile, deleteFile } from '../../lib/storage'

export function Pagos() {
  const [inscripciones, setInscripciones] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [paquetes, setPaquetes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterPagado, setFilterPagado] = useState('TODOS')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Opciones de modo de pago
  const MODOS_PAGO = [
    { value: 'transferencia', label: 'Transferencia bancaria' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'efectivo', label: 'Efectivo' }
  ]

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        const [
          { data: insc, error: err1 },
          { data: als, error: err2 },
          { data: pqs, error: err3 }
        ] = await Promise.all([
          supabase.from('inscripciones').select('*'),
          db.getAlumnos(),
          db.getPaquetes()
        ])
        if (err1 || err2 || err3) throw err1 || err2 || err3
        setInscripciones(insc || [])
        setAlumnos(als || [])
        setPaquetes(pqs || [])
        setError(null)
      } catch (err) {
        setError('Error al cargar inscripciones')
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const getAlumnoNombre = (cedula) =>
    alumnos.find((a) => a.cedula === cedula)?.nombre_completo || cedula
  const getPaqueteNombre = (codigo) =>
    paquetes.find((p) => p.codigo === codigo)?.nombre || codigo

  // Filtros
  const inscripcionesFiltradas = inscripciones.filter((insc) => {
    const alumnoNombre = getAlumnoNombre(insc.cedula_alumno)
    const paqueteNombre = getPaqueteNombre(insc.codigo_paquete)

    const matchSearch =
      alumnoNombre.toLowerCase().includes(search.toLowerCase()) ||
      paqueteNombre.toLowerCase().includes(search.toLowerCase())

    const matchPagado =
      filterPagado === 'TODOS' ||
      (filterPagado === 'PAGADO' && insc.pagado) ||
      (filterPagado === 'PENDIENTE' && !insc.pagado)

    return matchSearch && matchPagado
  })

  // Estadísticas
  const totalInscripciones = inscripciones.length
  const pagadas = inscripciones.filter((i) => i.pagado).length
  const pendientes = totalInscripciones - pagadas
  const totalIngresos = inscripciones
    .filter((i) => i.pagado)
    .reduce((sum, i) => sum + (i.precio_pagado || 0), 0)
  const conComprobante = inscripciones.filter((i) => i.comprobante).length

  // Actualizar modo de pago
  const handleUpdateModoPago = async (id, value) => {
    setSavingId(id)
    await supabase
      .from('inscripciones')
      .update({ modo_pago: value, updated_at: new Date().toISOString() })
      .eq('id_inscripcion', id)
    // Refrescar datos
    const { data } = await supabase.from('inscripciones').select('*')
    setInscripciones(data || [])
    setSavingId(null)
  }

  // Actualizar pagado
  const handleUpdatePagado = async (id, value) => {
    setSavingId(id)
    await supabase
      .from('inscripciones')
      .update({ pagado: value === 'si', updated_at: new Date().toISOString() })
      .eq('id_inscripcion', id)
    // Refrescar datos
    const { data } = await supabase.from('inscripciones').select('*')
    setInscripciones(data || [])
    setSavingId(null)
  }

  // Subir comprobante
  const handleComprobanteUpload = async (id, file) => {
    if (!file) return
    setSavingId(id)

    try {
      console.log('Iniciando subida de archivo:', file.name)

      const ext = file.name.split('.').pop()
      const filePath = `${id}_${Date.now()}.${ext}`

      console.log('Subiendo archivo a:', filePath)

      const { error: uploadError } = await uploadFile(
        'comprobantes',
        filePath,
        file
      )

      if (uploadError) {
        console.error('Error al subir archivo:', uploadError)
        alert('Error al subir comprobante: ' + uploadError.message)
        setSavingId(null)
        return
      }

      console.log('Archivo subido exitosamente')

      // Actualizar la base de datos con el path del archivo
      const { data: updateData, error: updateError } = await supabase
        .from('inscripciones')
        .update({
          comprobante: filePath, // Guardar solo el path, no la URL completa
          updated_at: new Date().toISOString()
        })
        .eq('id_inscripcion', id)
        .select()

      if (updateError) {
        console.error('Error al actualizar base de datos:', updateError)
        alert(
          'Error al actualizar comprobante en la base de datos: ' +
            updateError.message
        )
        setSavingId(null)
        return
      }

      console.log('Base de datos actualizada:', updateData)

      // Refrescar datos
      const { data, error: refreshError } = await supabase
        .from('inscripciones')
        .select('*')

      if (refreshError) {
        console.error('Error al refrescar datos:', refreshError)
        alert('Error al refrescar datos: ' + refreshError.message)
      } else {
        setInscripciones(data || [])
        console.log('Datos refrescados exitosamente')
      }
    } catch (error) {
      console.error('Error general:', error)
      alert('Error inesperado: ' + error.message)
    } finally {
      setSavingId(null)
    }
  }

  // Eliminar comprobante
  const handleDeleteComprobante = async (id, currentComprobante) => {
    if (!currentComprobante) return

    if (!confirm('¿Estás seguro de que quieres eliminar este comprobante?')) {
      return
    }

    setSavingId(id)

    try {
      // Eliminar archivo del storage
      const { error: deleteError } = await deleteFile(
        'comprobantes',
        currentComprobante
      )

      if (deleteError) {
        console.error('Error al eliminar archivo:', deleteError)
        // Continuar con la limpieza de la base de datos aunque falle la eliminación del archivo
      }

      // Limpiar referencia en la base de datos
      const { error: updateError } = await supabase
        .from('inscripciones')
        .update({
          comprobante: null,
          updated_at: new Date().toISOString()
        })
        .eq('id_inscripcion', id)

      if (updateError) {
        console.error('Error al actualizar base de datos:', updateError)
        alert('Error al eliminar comprobante: ' + updateError.message)
        setSavingId(null)
        return
      }

      // Refrescar datos
      const { data, error: refreshError } = await supabase
        .from('inscripciones')
        .select('*')

      if (refreshError) {
        console.error('Error al refrescar datos:', refreshError)
        alert('Error al refrescar datos: ' + refreshError.message)
      } else {
        setInscripciones(data || [])
        console.log('Comprobante eliminado exitosamente')
      }
    } catch (error) {
      console.error('Error general:', error)
      alert('Error inesperado: ' + error.message)
    } finally {
      setSavingId(null)
    }
  }

  // Badges
  const getPagadoBadge = (pagado) => (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        pagado
          ? 'bg-green-100 text-green-800 border border-green-200'
          : 'bg-red-100 text-red-800 border border-red-200'
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full mr-2 ${
          pagado ? 'bg-green-500' : 'bg-red-500'
        }`}
      ></div>
      {pagado ? 'Pagado' : 'Pendiente'}
    </span>
  )

  const getModoPagoBadge = (modoPago) => {
    const colors = {
      transferencia: 'bg-blue-100 text-blue-800 border-blue-200',
      tarjeta: 'bg-purple-100 text-purple-800 border-purple-200',
      efectivo: 'bg-green-100 text-green-800 border-green-200'
    }
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
          colors[modoPago] || 'bg-gray-100 text-gray-800 border-gray-200'
        }`}
      >
        {modoPago
          ? modoPago.charAt(0).toUpperCase() + modoPago.slice(1)
          : 'No definido'}
      </span>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Pagos</h1>
          <p className='text-gray-600 mt-1'>
            Gestiona los pagos e inscripciones del club
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Total Inscripciones
            </span>
            <FileText className='h-4 w-4 text-blue-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900'>
            {totalInscripciones}
          </div>
          <p className='text-xs text-gray-500 mt-1'>
            Registradas en el sistema
          </p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>Pagadas</span>
            <DollarSign className='h-4 w-4 text-green-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900'>{pagadas}</div>
          <p className='text-xs text-gray-500 mt-1'>Completadas</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Pendientes
            </span>
            <CreditCard className='h-4 w-4 text-red-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900'>{pendientes}</div>
          <p className='text-xs text-gray-500 mt-1'>Por procesar</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Ingresos Totales
            </span>
            <DollarSign className='h-4 w-4 text-green-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900'>
            ${totalIngresos.toLocaleString()}
          </div>
          <p className='text-xs text-gray-500 mt-1'>Recaudado</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className='bg-white rounded-xl border border-gray-200 p-6 shadow-sm'>
        <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-6'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Lista de Pagos
          </h2>
          <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end ml-auto'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Buscar por alumno o paquete...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className='pl-10 border border-gray-200 rounded-lg py-2 w-full sm:w-64 text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none focus:border-blue-300 transition-colors'
              />
            </div>
            <div className='relative'>
              <button
                className='flex items-center border border-gray-200 px-4 py-2 rounded-lg text-gray-700 bg-white text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-colors'
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                type='button'
              >
                <Filter className='w-4 h-4 mr-2' />
                Filtros
              </button>
              {showFilterDropdown && (
                <div className='absolute right-0 mt-2 w-40 bg-white border rounded-xl shadow-lg z-10 p-3'>
                  <label className='block text-xs font-semibold mb-1 text-gray-700'>
                    Estado de Pago
                  </label>
                  <select
                    value={filterPagado}
                    onChange={(e) => setFilterPagado(e.target.value)}
                    className='w-full border border-gray-200 p-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none'
                  >
                    <option value='TODOS'>Todos</option>
                    <option value='PAGADO'>Pagado</option>
                    <option value='PENDIENTE'>Pendiente</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lista de pagos mejorada */}
        <div className='space-y-4'>
          {loading ? (
            <div className='text-center py-12 text-gray-500'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4'></div>
              Cargando pagos...
            </div>
          ) : error ? (
            <div className='text-center py-12 text-red-500'>{error}</div>
          ) : inscripcionesFiltradas.length === 0 ? (
            <div className='text-center py-12 text-gray-500'>
              <FileText className='h-12 w-12 text-gray-300 mx-auto mb-4' />
              <p className='text-lg font-medium'>No hay pagos registrados</p>
              <p className='text-sm'>
                Los pagos aparecerán aquí cuando se creen inscripciones
              </p>
            </div>
          ) : (
            inscripcionesFiltradas.map((insc) => (
              <div
                key={insc.id_inscripcion}
                className='bg-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-md transition-all duration-200 hover:border-gray-300'
              >
                <div className='grid grid-cols-1 lg:grid-cols-12 gap-4 items-center'>
                  {/* Información del alumno */}
                  <div className='lg:col-span-3'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                        <User className='w-5 h-5 text-blue-600' />
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-900 text-sm'>
                          {getAlumnoNombre(insc.cedula_alumno)}
                        </h3>
                        <p className='text-xs text-gray-500'>Alumno</p>
                      </div>
                    </div>
                  </div>

                  {/* Información del paquete */}
                  <div className='lg:col-span-3'>
                    <div className='flex items-center gap-3'>
                      <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                        <Package className='w-5 h-5 text-purple-600' />
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-900 text-sm'>
                          {getPaqueteNombre(insc.codigo_paquete)}
                        </h3>
                        <p className='text-xs text-gray-500'>Paquete</p>
                      </div>
                    </div>
                  </div>

                  {/* Precio */}
                  <div className='lg:col-span-2'>
                    <div className='text-center'>
                      <div className='text-lg font-bold text-gray-900'>
                        {insc.precio_pagado
                          ? `$${Number(insc.precio_pagado).toLocaleString()}`
                          : '-'}
                      </div>
                      <p className='text-xs text-gray-500'>A pagar</p>
                    </div>
                  </div>

                  {/* Estado de pago */}
                  <div className='lg:col-span-2'>
                    <div className='flex flex-col items-center gap-2'>
                      {getPagadoBadge(insc.pagado)}
                      <select
                        className='border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none'
                        value={insc.pagado ? 'si' : 'no'}
                        onChange={(e) =>
                          handleUpdatePagado(
                            insc.id_inscripcion,
                            e.target.value
                          )
                        }
                        disabled={savingId === insc.id_inscripcion}
                      >
                        <option value='si'>Sí</option>
                        <option value='no'>No</option>
                      </select>
                    </div>
                  </div>

                  {/* Modo de pago */}
                  <div className='lg:col-span-2'>
                    <div className='flex flex-col items-center gap-2'>
                      {insc.modo_pago && getModoPagoBadge(insc.modo_pago)}
                      <select
                        className='border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none'
                        value={insc.modo_pago || ''}
                        onChange={(e) =>
                          handleUpdateModoPago(
                            insc.id_inscripcion,
                            e.target.value
                          )
                        }
                        disabled={savingId === insc.id_inscripcion}
                      >
                        <option value=''>Selecciona...</option>
                        {MODOS_PAGO.map((m) => (
                          <option key={m.value} value={m.value}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Comprobante */}
                <div className='mt-4 pt-4 border-t border-gray-200'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      <div className='w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
                        <FileText className='w-4 h-4 text-green-600' />
                      </div>
                      <span className='text-sm font-medium text-gray-700'>
                        Comprobante
                      </span>
                    </div>

                    {savingId === insc.id_inscripcion ? (
                      <div className='text-blue-600 flex items-center gap-2'>
                        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600'></div>
                        <span className='text-sm'>Procesando...</span>
                      </div>
                    ) : insc.comprobante ? (
                      <div className='flex items-center gap-3'>
                        <ComprobanteLink filePath={insc.comprobante} />
                        <button
                          onClick={() =>
                            handleDeleteComprobante(
                              insc.id_inscripcion,
                              insc.comprobante
                            )
                          }
                          disabled={savingId === insc.id_inscripcion}
                          className='flex items-center gap-1 text-red-600 hover:text-red-800 text-xs transition-colors p-1 rounded hover:bg-red-50'
                        >
                          <Trash2 className='w-3 h-3' />
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className='flex items-center gap-3'>
                        <span className='text-gray-400 text-sm'>
                          Sin comprobante
                        </span>
                        <input
                          type='file'
                          accept='.png,.jpg,.jpeg,.pdf'
                          className='block text-xs border border-gray-200 rounded px-2 py-1 bg-white hover:border-gray-300 transition-colors'
                          onChange={(e) =>
                            handleComprobanteUpload(
                              insc.id_inscripcion,
                              e.target.files[0]
                            )
                          }
                          disabled={savingId === insc.id_inscripcion}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
