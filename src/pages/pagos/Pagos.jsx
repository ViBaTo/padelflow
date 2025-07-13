import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Filter,
  Trash2,
  DollarSign,
  CreditCard,
  FileText,
  Search,
  User,
  Package,
  Calendar,
  Plus,
  X
} from 'lucide-react'
import { supabase, db } from '../../lib/supabase'
import { ComprobanteLink } from '../../components/ComprobanteLink'
import { uploadFile, deleteFile } from '../../lib/storage'
import { formatDateSafe } from '../../lib/utils'
// Shadcn/ui components
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

export function Pagos() {
  const navigate = useNavigate()
  const [inscripciones, setInscripciones] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [paquetes, setPaquetes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [savingId, setSavingId] = useState(null)
  const [search, setSearch] = useState('')
  const [filterPagado, setFilterPagado] = useState('TODOS')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showNuevoPagoModal, setShowNuevoPagoModal] = useState(false)
  const [nuevoPagoForm, setNuevoPagoForm] = useState({
    alumno: '',
    paquete: '',
    monto: '',
    metodoPago: '',
    fechaPago: formatDateSafe(new Date()),
    notas: ''
  })
  const [searchAlumno, setSearchAlumno] = useState('')
  const [paquetesDisponibles, setPaquetesDisponibles] = useState([])
  const [showAlumnoDropdown, setShowAlumnoDropdown] = useState(false)
  const [comprobanteFile, setComprobanteFile] = useState(null)

  // Opciones de modo de pago
  const MODOS_PAGO = [
    { value: 'transferencia', label: 'Transferencia bancaria' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'efectivo', label: 'Efectivo' }
  ]

  // Obtener todos los alumnos para el dropdown
  const alumnosDisponibles = alumnos.map((alumno) => ({
    cedula: alumno.cedula,
    nombre: alumno.nombre_completo
  }))

  // Filtrar alumnos por búsqueda
  const alumnosFiltrados = alumnosDisponibles.filter((alumno) =>
    alumno.nombre.toLowerCase().includes(searchAlumno.toLowerCase())
  )

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      try {
        console.log('🔄 Loading payments data...')

        // 🚀 Timeout aumentado significativamente (de 15s a 45s) porque carga múltiples tablas
        const dataPromise = Promise.all([
          supabase.from('inscripciones').select('*'),
          db.getAlumnos(),
          db.getPaquetes()
        ])

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout al cargar datos de pagos')),
            45000
          )
        )

        const [
          { data: insc, error: err1 },
          { data: als, error: err2 },
          { data: pqs, error: err3 }
        ] = await Promise.race([dataPromise, timeoutPromise])

        if (err1 || err2 || err3) {
          const error = err1 || err2 || err3
          console.error('Error loading payments data:', error)
          throw error
        }

        setInscripciones(insc || [])
        setAlumnos(als || [])
        setPaquetes(pqs || [])
        setError(null)
        console.log('✅ Payments data loaded successfully')
      } catch (err) {
        console.error('❌ Error al cargar inscripciones:', err)

        // 🚀 Mensaje de error más informativo
        if (err.message.includes('Timeout')) {
          setError(
            'La carga de datos de pagos está tardando más de lo esperado. Verifica tu conexión a internet o intenta recargar la página.'
          )
        } else {
          setError('Error al cargar inscripciones: ' + err.message)
        }
      } finally {
        // 🔧 Siempre terminar loading
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
    .reduce((sum, i) => {
      const paquete = paquetes.find((p) => p.codigo === i.codigo_paquete)
      const totalPaquete = paquete
        ? paquete.precio_con_iva * paquete.numero_clases
        : 0
      return sum + totalPaquete
    }, 0)
  const conComprobante = inscripciones.filter((i) => i.comprobante).length

  // Actualizar modo de pago
  const handleUpdateModoPago = async (id, value) => {
    setSavingId(id)
    await supabase
      .from('inscripciones')
      .update({
        modo_pago: value,
        pagado: !!value,
        updated_at: new Date().toISOString()
      })
      .eq('id_inscripcion', id)
    // Actualiza solo el elemento modificado en el estado local
    setInscripciones((prev) =>
      prev.map((insc) =>
        insc.id_inscripcion === id
          ? {
              ...insc,
              modo_pago: value,
              pagado: !!value,
              updated_at: new Date().toISOString()
            }
          : insc
      )
    )
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
      const ext = file.name.split('.').pop()
      const filePath = `${id}_${Date.now()}.${ext}`
      const { error: uploadError } = await uploadFile(
        'comprobantes',
        filePath,
        file
      )
      if (uploadError) {
        alert('Error al subir comprobante: ' + uploadError.message)
        setSavingId(null)
        return
      }
      const { error: updateError } = await supabase
        .from('inscripciones')
        .update({ comprobante: filePath, updated_at: new Date().toISOString() })
        .eq('id_inscripcion', id)
      if (updateError) {
        alert(
          'Error al actualizar comprobante en la base de datos: ' +
            updateError.message
        )
        setSavingId(null)
        return
      }
      // Actualiza solo el elemento modificado en el estado local
      setInscripciones((prev) =>
        prev.map((insc) =>
          insc.id_inscripcion === id
            ? {
                ...insc,
                comprobante: filePath,
                updated_at: new Date().toISOString()
              }
            : insc
        )
      )
    } catch (error) {
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
      await deleteFile('comprobantes', currentComprobante)
      const { error: updateError } = await supabase
        .from('inscripciones')
        .update({ comprobante: null, updated_at: new Date().toISOString() })
        .eq('id_inscripcion', id)
      if (updateError) {
        alert('Error al eliminar comprobante: ' + updateError.message)
        setSavingId(null)
        return
      }
      // Actualiza solo el elemento modificado en el estado local
      setInscripciones((prev) =>
        prev.map((insc) =>
          insc.id_inscripcion === id
            ? {
                ...insc,
                comprobante: null,
                updated_at: new Date().toISOString()
              }
            : insc
        )
      )
    } catch (error) {
      alert('Error inesperado: ' + error.message)
    } finally {
      setSavingId(null)
    }
  }

  // Manejar formulario de nuevo pago
  const handleNuevoPagoSubmit = async (e) => {
    e.preventDefault()
    if (
      !nuevoPagoForm.alumno ||
      !nuevoPagoForm.paquete ||
      !nuevoPagoForm.metodoPago
    ) {
      alert('Por favor completa todos los campos obligatorios')
      return
    }

    // Validar comprobante para transferencias
    if (nuevoPagoForm.metodoPago === 'transferencia' && !comprobanteFile) {
      alert('El comprobante es requerido para pagos por transferencia')
      return
    }

    setSavingId('nuevo-pago')
    try {
      let comprobanteUrl = null

      // Si hay comprobante y es transferencia, subirlo primero
      if (comprobanteFile && nuevoPagoForm.metodoPago === 'transferencia') {
        const ext = comprobanteFile.name.split('.').pop()
        const filePath = `comprobante_${Date.now()}.${ext}`

        const { error: uploadError } = await uploadFile(
          'comprobantes',
          filePath,
          comprobanteFile
        )

        if (uploadError) {
          throw new Error('Error al subir comprobante: ' + uploadError.message)
        }

        comprobanteUrl = filePath
      }

      // Crear nueva inscripción
      const { data: inscripcionData, error: inscripcionError } = await supabase
        .from('inscripciones')
        .insert([
          {
            cedula_alumno: nuevoPagoForm.alumno,
            codigo_paquete: nuevoPagoForm.paquete,
            pagado: true,
            modo_pago: nuevoPagoForm.metodoPago,
            fecha_pago: nuevoPagoForm.fechaPago,
            notas_pago: nuevoPagoForm.notas,
            comprobante: comprobanteUrl,
            estado: 'ACTIVO',
            fecha_inicio: nuevoPagoForm.fechaPago,
            id_organizacion: '495f2b65-1b9f-4fdb-bcdf-07374101aa61',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()

      if (inscripcionError) throw inscripcionError

      // Actualizar el estado local
      if (inscripcionData && inscripcionData.length > 0) {
        setInscripciones((prev) => [...prev, inscripcionData[0]])
      }

      // Resetear formulario y cerrar modal
      setNuevoPagoForm({
        alumno: '',
        paquete: '',
        monto: '',
        metodoPago: '',
        fechaPago: formatDateSafe(new Date()),
        notas: ''
      })
      setSearchAlumno('')
      setShowAlumnoDropdown(false)
      setComprobanteFile(null)
      setShowNuevoPagoModal(false)
    } catch (error) {
      alert('Error al registrar el pago: ' + error.message)
    } finally {
      setSavingId(null)
    }
  }

  const handleAlumnoSelect = (alumno) => {
    setNuevoPagoForm((prev) => ({
      ...prev,
      alumno: alumno.cedula
    }))
    setSearchAlumno(alumno.nombre)
    setShowAlumnoDropdown(false) // Cerrar el dropdown
  }

  const handlePaqueteSelect = (paqueteCodigo) => {
    const paquete = paquetes.find((p) => p.codigo === paqueteCodigo)
    if (paquete) {
      const monto = paquete.precio_con_iva * paquete.numero_clases
      setNuevoPagoForm((prev) => ({
        ...prev,
        paquete: paqueteCodigo,
        monto: monto.toString()
      }))
    }
  }

  const handleInscribirNuevoAlumno = () => {
    // Cerrar el modal actual
    setShowNuevoPagoModal(false)
    // Resetear formulario
    setNuevoPagoForm({
      alumno: '',
      paquete: '',
      monto: '',
      metodoPago: '',
      fechaPago: formatDateSafe(new Date()),
      notas: ''
    })
    setSearchAlumno('')
    setShowAlumnoDropdown(false)
    setComprobanteFile(null)
    // Navegar a la página de Alumnos donde pueden agregar nuevos alumnos
    navigate('/alumnos')
  }

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAlumnoDropdown) {
        // Si el click no es dentro del dropdown, cerrarlo
        const dropdown = event.target.closest('.alumno-dropdown-container')
        if (!dropdown) {
          setShowAlumnoDropdown(false)
        }
      }
    }

    if (showAlumnoDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAlumnoDropdown])

  // Badges
  const getPagadoBadge = (pagado) => (
    <Badge variant={pagado ? 'default' : 'destructive'} className='gap-2'>
      <div
        className={`w-2 h-2 rounded-full ${
          pagado ? 'bg-green-500' : 'bg-red-500'
        }`}
      ></div>
      {pagado ? 'Pagado' : 'Pendiente'}
    </Badge>
  )

  const getModoPagoBadge = (modoPago) => {
    const variants = {
      transferencia: 'secondary',
      tarjeta: 'outline',
      efectivo: 'default'
    }
    return (
      <Badge variant={variants[modoPago] || 'outline'}>
        {modoPago
          ? modoPago.charAt(0).toUpperCase() + modoPago.slice(1)
          : 'No definido'}
      </Badge>
    )
  }

  return (
    <div className='space-y-4 p-3 lg:p-4 bg-gray-50'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div>
          <h1 className='text-2xl font-extrabold text-gray-900 tracking-tight'>
            Pagos
          </h1>
          <p className='text-gray-500 mt-1 text-sm'>
            Gestiona los pagos e inscripciones del club
          </p>
        </div>
        <Button onClick={() => setShowNuevoPagoModal(true)} className='h-9'>
          <DollarSign className='w-4 h-4' />
          Nuevo Pago
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <div className='bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Total Inscripciones
            </span>
            <FileText className='h-4 w-4 text-blue-600' />
          </div>
          <div className='text-xl font-bold text-gray-900'>
            {totalInscripciones}
          </div>
          <p className='text-xs text-gray-400 mt-1'>
            Registradas en el sistema
          </p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>Pagadas</span>
            <DollarSign className='h-4 w-4 text-green-600' />
          </div>
          <div className='text-xl font-bold text-gray-900'>{pagadas}</div>
          <p className='text-xs text-gray-400 mt-1'>Completadas</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Pendientes
            </span>
            <CreditCard className='h-4 w-4 text-red-600' />
          </div>
          <div className='text-xl font-bold text-gray-900'>{pendientes}</div>
          <p className='text-xs text-gray-400 mt-1'>Por procesar</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-1 shadow-sm hover:shadow-md transition-shadow'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Ingresos Totales
            </span>
            <DollarSign className='h-4 w-4 text-green-600' />
          </div>
          <div className='text-xl font-bold text-gray-900'>
            ${totalIngresos.toLocaleString()}
          </div>
          <p className='text-xs text-gray-400 mt-1'>Recaudado</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className='bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
        <h2 className='text-base font-semibold text-gray-900 mb-2 md:mb-0'>
          Lista de Pagos
        </h2>
        <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end ml-auto'>
          <div className='relative w-full sm:w-auto'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
            <input
              type='text'
              placeholder='Buscar por alumno o paquete...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10 border border-gray-200 rounded-lg py-2 w-full sm:w-64 text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none focus:border-blue-300 transition-colors bg-gray-50'
            />
          </div>
          <div className='flex gap-2'>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors focus:outline-none ${
                filterPagado === 'PAGADO'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setFilterPagado('PAGADO')}
            >
              Pagado
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors focus:outline-none ${
                filterPagado === 'PENDIENTE'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setFilterPagado('PENDIENTE')}
            >
              Pendiente
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors focus:outline-none ${
                filterPagado === 'TODOS'
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setFilterPagado('TODOS')}
            >
              Todos
            </button>
          </div>
        </div>
      </div>

      {/* Lista de pagos mejorada */}
      <div className='bg-white rounded-2xl border border-gray-200 p-0 shadow-sm'>
        <div
          className='overflow-y-auto space-y-6 p-6'
          style={{ maxHeight: '50vh' }}
        >
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
            inscripcionesFiltradas.map((insc) => {
              const paquete = paquetes.find(
                (p) => p.codigo === insc.codigo_paquete
              )
              const totalPagar = paquete
                ? paquete.precio_con_iva * paquete.numero_clases
                : null
              return (
                <div
                  key={insc.id_inscripcion}
                  className='bg-gray-50 rounded-xl border border-gray-100 p-6 flex flex-row items-center gap-4 shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-300 w-full flex-wrap md:flex-nowrap'
                >
                  {/* Alumno */}
                  <div className='flex items-center gap-3 min-w-[180px] flex-1 truncate'>
                    <div className='w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center'>
                      <User className='w-5 h-5 text-blue-600' />
                    </div>
                    <div className='truncate'>
                      <h3 className='font-semibold text-gray-900 text-base truncate'>
                        {getAlumnoNombre(insc.cedula_alumno)}
                      </h3>
                      <p className='text-xs text-gray-500'>Alumno</p>
                    </div>
                  </div>
                  {/* Paquete */}
                  <div className='flex items-center gap-3 min-w-[180px] flex-1 truncate'>
                    <div className='w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center'>
                      <Package className='w-5 h-5 text-purple-600' />
                    </div>
                    <div className='truncate'>
                      <h3 className='font-semibold text-gray-900 text-base truncate'>
                        {getPaqueteNombre(insc.codigo_paquete)}
                      </h3>
                      <p className='text-xs text-gray-500'>Paquete</p>
                    </div>
                  </div>
                  {/* Precio a pagar */}
                  <div className='flex flex-col items-center min-w-[100px]'>
                    <div className='text-lg font-bold text-green-600'>
                      {totalPagar
                        ? `$${Number(totalPagar).toLocaleString()}`
                        : '-'}
                    </div>
                    <p className='text-xs text-gray-500'>A pagar</p>
                  </div>
                  {/* Estado de pago */}
                  <div className='flex flex-col items-center min-w-[120px]'>
                    {getPagadoBadge(insc.pagado)}
                  </div>
                  {/* Modo de pago */}
                  <div className='flex flex-col items-center min-w-[150px]'>
                    {insc.modo_pago && getModoPagoBadge(insc.modo_pago)}
                    <select
                      className='border border-gray-200 rounded px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none mt-1'
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
                  {/* Comprobante y acciones */}
                  <div className='flex flex-col items-center min-w-[220px]'>
                    <div className='flex items-center gap-2'>
                      <FileText className='w-5 h-5 text-green-600' />
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
                      <div className='flex flex-col items-center w-full'>
                        <div className='flex items-center gap-2'>
                          <ComprobanteLink filePath={insc.comprobante} />
                          <button
                            onClick={() =>
                              handleDeleteComprobante(
                                insc.id_inscripcion,
                                insc.comprobante
                              )
                            }
                            disabled={savingId === insc.id_inscripcion}
                            className='flex items-center gap-1 text-red-600 hover:text-red-800 text-xs transition-colors p-1 rounded hover:bg-red-50 border border-red-100'
                          >
                            <Trash2 className='w-3 h-3' />
                            Eliminar
                          </button>
                        </div>
                        <span className='text-xs text-gray-400 truncate max-w-[140px] block mt-1'>
                          {insc.comprobante}
                        </span>
                      </div>
                    ) : (
                      <div className='flex flex-col items-center gap-1 w-full'>
                        <span className='text-gray-400 text-sm'>
                          Sin comprobante
                        </span>
                        <label className='inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded shadow cursor-pointer hover:bg-blue-700 transition-colors'>
                          <svg
                            className='w-4 h-4 mr-1'
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='2'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12'
                            />
                          </svg>
                          Subir archivo
                          <input
                            type='file'
                            accept='.png,.jpg,.jpeg,.pdf'
                            className='hidden'
                            onChange={(e) =>
                              handleComprobanteUpload(
                                insc.id_inscripcion,
                                e.target.files[0]
                              )
                            }
                            disabled={savingId === insc.id_inscripcion}
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Modal Nuevo Pago */}
      <Dialog
        open={showNuevoPagoModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowNuevoPagoModal(false)
            setSearchAlumno('')
            setShowAlumnoDropdown(false)
            setComprobanteFile(null)
          }
        }}
      >
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Pago</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleNuevoPagoSubmit} className='space-y-4'>
            {/* Seleccionar Alumno */}
            <div className='space-y-2'>
              <Label htmlFor='alumno'>Seleccionar Alumno *</Label>
              <div className='relative alumno-dropdown-container'>
                <Input
                  id='alumno'
                  type='text'
                  placeholder='Buscar alumno...'
                  value={searchAlumno}
                  onChange={(e) => {
                    setSearchAlumno(e.target.value)
                    setShowAlumnoDropdown(e.target.value.length > 0)
                  }}
                  onFocus={() => setShowAlumnoDropdown(searchAlumno.length > 0)}
                />
                {showAlumnoDropdown && searchAlumno && (
                  <div className='absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto z-10 shadow-lg'>
                    {alumnosFiltrados.length > 0 ? (
                      alumnosFiltrados.map((alumno) => (
                        <button
                          key={alumno.cedula}
                          type='button'
                          onClick={() => handleAlumnoSelect(alumno)}
                          className='w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0'
                        >
                          <div className='font-medium text-gray-900'>
                            {alumno.nombre}
                          </div>
                          <div className='text-sm text-gray-600'>
                            {alumno.cedula}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className='px-3 py-2 text-gray-500'>
                        No se encontraron alumnos
                      </div>
                    )}
                    <button
                      type='button'
                      onClick={handleInscribirNuevoAlumno}
                      className='w-full text-left px-3 py-2 text-blue-600 hover:bg-blue-50 border-t border-gray-200 transition-colors'
                    >
                      + Inscribir nuevo alumno
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Seleccionar Paquete */}
            <div className='space-y-2'>
              <Label htmlFor='paquete'>Seleccionar Paquete *</Label>
              <Select
                value={nuevoPagoForm.paquete}
                onValueChange={(value) => handlePaqueteSelect(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccionar paquete...' />
                </SelectTrigger>
                <SelectContent>
                  {paquetes.map((paquete) => (
                    <SelectItem key={paquete.codigo} value={paquete.codigo}>
                      {paquete.nombre} - $
                      {(
                        paquete.precio_con_iva * paquete.numero_clases
                      ).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monto (solo lectura) */}
            <div className='space-y-2'>
              <Label htmlFor='monto'>Monto Total</Label>
              <div className='relative'>
                <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500'>
                  $
                </span>
                <Input
                  id='monto'
                  type='text'
                  value={
                    nuevoPagoForm.monto
                      ? Number(nuevoPagoForm.monto).toLocaleString()
                      : '0.00'
                  }
                  className='pl-8 bg-gray-100 text-gray-700'
                  readOnly
                />
              </div>
              <p className='text-xs text-gray-500'>
                El monto se calcula automáticamente según el paquete
                seleccionado
              </p>
            </div>

            {/* Método de Pago */}
            <div className='space-y-2'>
              <Label htmlFor='metodoPago'>Método de Pago *</Label>
              <Select
                value={nuevoPagoForm.metodoPago}
                onValueChange={(value) =>
                  setNuevoPagoForm((prev) => ({
                    ...prev,
                    metodoPago: value
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Seleccionar método...' />
                </SelectTrigger>
                <SelectContent>
                  {MODOS_PAGO.map((modo) => (
                    <SelectItem key={modo.value} value={modo.value}>
                      {modo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha de Pago */}
            <div className='space-y-2'>
              <Label htmlFor='fechaPago'>Fecha de Pago *</Label>
              <Input
                id='fechaPago'
                type='date'
                value={nuevoPagoForm.fechaPago}
                onChange={(e) =>
                  setNuevoPagoForm((prev) => ({
                    ...prev,
                    fechaPago: e.target.value
                  }))
                }
                required
              />
            </div>

            {/* Notas */}
            <div className='space-y-2'>
              <Label htmlFor='notas'>Notas</Label>
              <Textarea
                id='notas'
                placeholder='Comentarios adicionales...'
                value={nuevoPagoForm.notas}
                onChange={(e) =>
                  setNuevoPagoForm((prev) => ({
                    ...prev,
                    notas: e.target.value
                  }))
                }
                rows={3}
              />
            </div>

            {/* Comprobante (solo para transferencias) */}
            {nuevoPagoForm.metodoPago === 'transferencia' && (
              <div className='space-y-2'>
                <Label htmlFor='comprobante'>
                  Comprobante de Transferencia *
                </Label>
                <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors'>
                  <input
                    type='file'
                    accept='.png,.jpg,.jpeg,.pdf'
                    onChange={(e) => setComprobanteFile(e.target.files[0])}
                    className='hidden'
                    id='comprobante-upload'
                  />
                  <label
                    htmlFor='comprobante-upload'
                    className='cursor-pointer flex flex-col items-center gap-2'
                  >
                    <FileText className='w-8 h-8 text-gray-400' />
                    {comprobanteFile ? (
                      <div className='text-sm'>
                        <p className='font-medium text-green-600'>
                          ✓ {comprobanteFile.name}
                        </p>
                        <p className='text-gray-500'>
                          Click para cambiar archivo
                        </p>
                      </div>
                    ) : (
                      <div className='text-sm'>
                        <p className='font-medium text-gray-700'>
                          Click para subir comprobante
                        </p>
                        <p className='text-gray-500'>
                          PNG, JPG o PDF (máx. 10MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
                <p className='text-xs text-gray-500'>
                  Requerido para pagos por transferencia
                </p>
              </div>
            )}
          </form>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setShowNuevoPagoModal(false)
                setSearchAlumno('')
                setShowAlumnoDropdown(false)
                setComprobanteFile(null)
              }}
            >
              Cancelar
            </Button>
            <Button
              type='submit'
              disabled={savingId === 'nuevo-pago'}
              onClick={handleNuevoPagoSubmit}
            >
              {savingId === 'nuevo-pago' ? (
                <>
                  <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                  Procesando...
                </>
              ) : (
                <>
                  <DollarSign className='w-4 h-4' />
                  Registrar Pago
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
