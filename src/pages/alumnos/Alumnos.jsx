import { useEffect, useState, useRef } from 'react'
import { db, supabase } from '../../lib/supabase'
import { GenericForm } from '../../components/GenericForm'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardSubtitle
} from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Alert } from '../../components/ui/Alert'
import { Heading, Text, Muted } from '../../components/ui/Typography'
import { componentClasses, designTokens } from '../../lib/designTokens'
import {
  Users,
  Phone,
  Calendar,
  Plus,
  Search,
  Filter,
  Mail,
  Eye,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  X,
  TrendingUp,
  UserCheck,
  UserPlus,
  Activity
} from 'lucide-react'
import { StudentDetailsModal } from '../../components/StudentDetailsModal'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import {
  getCategoryColor,
  getCategoryColorByType,
  formatDateSafe
} from '../../lib/utils'

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [inscripciones, setInscripciones] = useState([])
  const [paquetes, setPaquetes] = useState([])
  const [profesores, setProfesores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    cedula: null
  })
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState('TODOS')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 12
  const contextMenuRef = useRef(null)
  const filterDropdownRef = useRef(null)
  const [selectedAlumno, setSelectedAlumno] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)

  // Función unificada para cargar todos los datos
  const fetchAllData = async () => {
    setLoading(true)
    try {
      console.log('🔄 Loading all data...')

      const dataPromises = [
        db.getAlumnos(),
        db.getCategorias(),
        supabase.from('inscripciones').select('*'),
        db.getPaquetes(),
        db.getProfesores()
      ]

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout al cargar datos')), 30000)
      )

      const results = await Promise.race([
        Promise.all(dataPromises),
        timeoutPromise
      ])

      const [
        alumnosResult,
        categoriasResult,
        inscripcionesResult,
        paquetesResult,
        profesoresResult
      ] = results

      if (alumnosResult.error) throw alumnosResult.error
      if (categoriasResult.error) throw categoriasResult.error
      if (inscripcionesResult.error) throw inscripcionesResult.error
      if (paquetesResult.error) throw paquetesResult.error
      if (profesoresResult.error) throw profesoresResult.error

      setAlumnos(alumnosResult.data || [])
      setCategorias(categoriasResult.data || [])
      setInscripciones(inscripcionesResult.data || [])
      setPaquetes(paquetesResult.data || [])
      setProfesores(profesoresResult.data || [])
      setError('')

      console.log('✅ All data loaded successfully')
    } catch (err) {
      console.error('❌ Error fetching data:', err)

      if (err.message.includes('Timeout')) {
        setError(
          'La carga de datos está tardando más de lo esperado. Verifica tu conexión a internet o intenta recargar la página.'
        )
      } else {
        setError('Error al cargar datos: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAlumnos = async () => {
    try {
      const { data, error } = await db.getAlumnos()
      if (error) throw error
      setAlumnos(data || [])
    } catch (err) {
      console.error('Error fetching alumnos:', err)
      setError('Error al cargar alumnos: ' + err.message)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    const handleClick = (e) => {
      if (
        contextMenu.visible &&
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target)
      ) {
        setContextMenu({ ...contextMenu, visible: false })
      }
      if (
        showFilterDropdown &&
        filterDropdownRef.current &&
        !filterDropdownRef.current.contains(e.target)
      ) {
        setShowFilterDropdown(false)
      }
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [contextMenu, showFilterDropdown])

  const handleAdd = async (data) => {
    const { error } = await db.addAlumno(data)
    if (error) setError(error.message)
    else {
      setShowModal(false)
      fetchAlumnos()
    }
  }

  const handleDelete = async (cedula) => {
    setContextMenu({ ...contextMenu, visible: false })
    const { error } = await db.deleteAlumno(cedula)
    if (error) {
      // Detecta el error de clave foránea de asistencias
      if (
        error.message &&
        error.message.includes('violates foreign key constraint') &&
        error.message.includes('asistencias_alumno_fkey')
      ) {
        setError(
          'No puedes eliminar este alumno porque tiene asistencias registradas. Elimina primero sus asistencias antes de eliminar al alumno.'
        )
      } else {
        setError(error.message)
      }
    } else fetchAlumnos()
  }

  const handleContextMenu = (e, cedula) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, cedula })
  }

  const handleViewStudent = (alumno) => {
    setSelectedAlumno(alumno)
    setShowDetailModal(true)
  }

  // Filtros y paginación
  const alumnosFiltrados = alumnos.filter((alumno) => {
    const matchNombre =
      alumno.nombre_completo &&
      alumno.nombre_completo.toLowerCase().includes(search.toLowerCase())
    const matchTelefono =
      alumno.telefono &&
      alumno.telefono.toLowerCase().includes(search.toLowerCase())
    const matchEstado =
      filterEstado === 'TODOS' || alumno.estado === filterEstado
    return (matchNombre || matchTelefono) && matchEstado
  })

  const totalPages = Math.ceil(alumnosFiltrados.length / recordsPerPage)
  const paginatedAlumnos = alumnosFiltrados.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterEstado])

  // Estadísticas mejoradas
  const totalAlumnos = alumnos.length
  const activos = alumnos.filter((a) => a.estado === 'ACTIVO').length
  const inactivos = alumnos.filter((a) => a.estado === 'INACTIVO').length

  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const nuevosEsteMes = alumnos.filter((a) => {
    if (!a.fecha_registro) return false
    const fecha = new Date(a.fecha_registro)
    return fecha.getMonth() === thisMonth && fecha.getFullYear() === thisYear
  }).length

  const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
  const lastMonthYear =
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const nuevosUltimoMes = alumnos.filter((a) => {
    if (!a.fecha_registro) return false
    const fecha = new Date(a.fecha_registro)
    return (
      fecha.getMonth() === lastMonth && fecha.getFullYear() === lastMonthYear
    )
  }).length

  const porcentaje =
    nuevosUltimoMes === 0
      ? nuevosEsteMes > 0
        ? 100
        : 0
      : ((nuevosEsteMes - nuevosUltimoMes) / nuevosUltimoMes) * 100

  // Definición de campos para el formulario
  const alumnoFields = [
    { name: 'cedula', label: 'Cédula', type: 'text', required: true },
    {
      name: 'nombre_completo',
      label: 'Nombre completo',
      type: 'text',
      required: true
    },
    { name: 'telefono', label: 'Teléfono', type: 'text', required: true },
    { name: 'email', label: 'Email', type: 'email' },
    {
      name: 'fecha_registro',
      label: 'Fecha registro',
      type: 'date',
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
    },
    {
      name: 'id_categoria',
      label: 'Categoría',
      type: 'select',
      options: categorias.map((cat) => ({
        value: cat.id_categoria,
        label: cat.tipo
      })),
      required: true
    }
  ]

  // Badges mejorados
  const getStatusBadge = (status) => (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
        status === 'ACTIVO'
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
          : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
      }`}
    >
      {status === 'ACTIVO' ? '✅ Activo' : '⭕ Inactivo'}
    </span>
  )

  const getCategoryBadge = (categoriaId) => {
    const categoria = categorias.find((c) => c.id_categoria === categoriaId)
    if (!categoria) {
      return (
        <span className='px-3 py-1.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 shadow-sm'>
          Sin categoría
        </span>
      )
    }

    const color = getCategoryColorByType(categoria.tipo)
    return (
      <span
        className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${color.bg} ${color.text} flex items-center gap-1`}
      >
        <span>{color.icon}</span>
        {categoria.tipo}
      </span>
    )
  }

  const getAlumnoPaquetes = (cedula) => {
    return inscripciones
      .filter((i) => i.cedula_alumno === cedula)
      .map((i) => paquetes.find((p) => p.codigo === i.codigo_paquete))
      .filter(Boolean)
  }

  const getPaquetesBadges = (cedula) => {
    const alumnosPaquetes = getAlumnoPaquetes(cedula)
    if (alumnosPaquetes.length === 0) {
      return (
        <span className='px-2 py-1 rounded-lg text-xs text-gray-500 bg-gray-100'>
          Sin paquetes
        </span>
      )
    }

    return (
      <div className='flex flex-wrap gap-1'>
        {alumnosPaquetes.slice(0, 2).map((paquete, index) => (
          <span
            key={index}
            className='px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700'
          >
            {paquete.nombre}
          </span>
        ))}
        {alumnosPaquetes.length > 2 && (
          <span className='px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600'>
            +{alumnosPaquetes.length - 2}
          </span>
        )}
      </div>
    )
  }

  // Funciones de importación (mantenidas del código original)
  const handleImportFile = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setImportError(null)
    setImportSuccess(null)
    setImportLoading(true)

    const fileExtension = file.name.split('.').pop().toLowerCase()

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          processRows(results.data, alumnoFields)
        },
        error: (error) => {
          setImportError('Error al leer el archivo CSV: ' + error.message)
          setImportLoading(false)
        }
      })
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          processRows(jsonData, alumnoFields)
        } catch (error) {
          setImportError('Error al leer el archivo Excel: ' + error.message)
          setImportLoading(false)
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      setImportError('Formato de archivo no soportado. Use CSV o Excel.')
      setImportLoading(false)
    }
  }

  const processRows = async (rows, fields) => {
    try {
      let successCount = 0
      let errorCount = 0
      const errors = []

      for (const [index, row] of rows.entries()) {
        if (!row.cedula || !row.nombre_completo) continue

        try {
          const alumnoData = {
            cedula: row.cedula?.toString().trim(),
            nombre_completo: row.nombre_completo?.toString().trim(),
            telefono: row.telefono?.toString().trim() || '',
            email: row.email?.toString().trim() || '',
            fecha_registro: row.fecha_registro || formatDateSafe(new Date()),
            estado:
              row.estado?.toString().toUpperCase() === 'ACTIVO'
                ? 'ACTIVO'
                : 'INACTIVO',
            id_categoria: row.id_categoria || null
          }

          const { error } = await db.addAlumno(alumnoData)

          if (error) {
            errorCount++
            errors.push(`Fila ${index + 2}: ${error.message}`)
          } else {
            successCount++
          }
        } catch (err) {
          errorCount++
          errors.push(`Fila ${index + 2}: ${err.message}`)
        }
      }

      if (successCount > 0) {
        setImportSuccess(`✅ ${successCount} alumnos importados exitosamente`)
        fetchAlumnos()
      }

      if (errorCount > 0) {
        setImportError(
          `❌ ${errorCount} errores encontrados:\n${errors
            .slice(0, 5)
            .join('\n')}${errors.length > 5 ? '\n...' : ''}`
        )
      }
    } catch (error) {
      setImportError('Error durante la importación: ' + error.message)
    } finally {
      setImportLoading(false)
      setTimeout(() => {
        setImportError(null)
        setImportSuccess(null)
      }, 10000)
    }
  }

  if (loading) {
    return (
      <div className={componentClasses.pageContainer}>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className={componentClasses.spinner}></div>
            <Text className='mt-4'>Cargando estudiantes...</Text>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={componentClasses.pageContainer}>
      <div className='p-3 lg:p-4 max-w-7xl mx-auto space-y-4'>
        {/* Error state */}
        {error && (
          <Alert variant='error'>
            <div>
              <Heading level={4}>Error al cargar datos</Heading>
              <Text className='mt-1'>{error}</Text>
              <Button
                variant='secondary'
                size='sm'
                onClick={fetchAllData}
                className='mt-2'
              >
                Reintentar
              </Button>
            </div>
          </Alert>
        )}

        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div>
            <Heading level={1} className='mb-1'>
              Gestión de Estudiantes
            </Heading>
            <Text variant='lead' className={designTokens.text.secondary}>
              Administra los estudiantes de tu club de pádel
            </Text>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => setShowImportModal(true)}
            >
              <Upload className='w-4 h-4 mr-2' />
              Importar CSV
            </Button>
            <Button variant='secondary' size='sm'>
              <Download className='w-4 h-4 mr-2' />
              Exportar
            </Button>
            <Button size='sm' onClick={() => setShowModal(true)}>
              <Plus className='w-4 h-4 mr-2' />
              Nuevo Estudiante
            </Button>
          </div>
        </div>

        {/* Métricas de estudiantes */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Total Estudiantes */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Total Estudiantes
                  </Text>
                  <Heading level={2} className='mt-1 mb-1'>
                    {totalAlumnos}
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <Users className='w-4 h-4 text-blue-500 mr-1' />
                    <span className={designTokens.text.info}>
                      Registrados en el club
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl'>
                  <Users className='w-5 h-5 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estudiantes Activos */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Estudiantes Activos
                  </Text>
                  <Heading level={2} className='mt-1 mb-1'>
                    {activos}
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <UserCheck className='w-4 h-4 text-green-500 mr-1' />
                    <span className={designTokens.text.success}>
                      {Math.round((activos / totalAlumnos) * 100) || 0}% del
                      total
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl'>
                  <UserCheck className='w-5 h-5 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nuevos Este Mes */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Nuevos Este Mes
                  </Text>
                  <Heading level={2} className='mt-1 mb-1'>
                    {nuevosEsteMes}
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <TrendingUp className='w-4 h-4 text-blue-500 mr-1' />
                    <span
                      className={
                        porcentaje >= 0
                          ? designTokens.text.success
                          : designTokens.text.error
                      }
                    >
                      {porcentaje >= 0 ? '+' : ''}
                      {porcentaje.toFixed(0)}% vs mes anterior
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl'>
                  <UserPlus className='w-5 h-5 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tasa de Participación */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Tasa de Participación
                  </Text>
                  <Heading level={2} className='mt-1 mb-1'>
                    {Math.round((activos / totalAlumnos) * 100) || 0}%
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <Activity className='w-4 h-4 text-orange-500 mr-1' />
                    <span className={designTokens.text.warning}>
                      Estudiantes activos
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl'>
                  <Activity className='w-5 h-5 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div>
                <CardTitle>Lista de Estudiantes</CardTitle>
                <CardSubtitle>
                  {alumnosFiltrados.length} estudiantes encontrados
                </CardSubtitle>
              </div>
              <div className='flex flex-col sm:flex-row gap-3'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <input
                    type='text'
                    placeholder='Buscar estudiantes...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg w-full sm:w-64 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                  />
                </div>
                <div className='relative' ref={filterDropdownRef}>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  >
                    <Filter className='w-4 h-4 mr-2' />
                    Filtros
                  </Button>
                  {showFilterDropdown && (
                    <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-10 p-4'>
                      <label className='block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300'>
                        Estado
                      </label>
                      <select
                        value={filterEstado}
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className='w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      >
                        <option value='TODOS'>Todos los estados</option>
                        <option value='ACTIVO'>Activos</option>
                        <option value='INACTIVO'>Inactivos</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Grid de estudiantes */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {paginatedAlumnos.map((alumno) => (
            <Card
              key={alumno.cedula}
              className='group hover:shadow-2xl transition-all duration-300 cursor-pointer'
              onContextMenu={(e) => handleContextMenu(e, alumno.cedula)}
            >
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl'>
                    <Users className='w-6 h-6 text-white' />
                  </div>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => handleViewStudent(alumno)}
                    className='opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    <Eye className='w-4 h-4' />
                  </Button>
                </div>

                <div className='space-y-3'>
                  <div>
                    <Heading level={4} className='mb-1 truncate'>
                      {alumno.nombre_completo}
                    </Heading>
                    <Text variant='caption' className={designTokens.text.muted}>
                      ID: {alumno.cedula}
                    </Text>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                    <Phone className='w-4 h-4' />
                    <span>{alumno.telefono}</span>
                  </div>

                  {alumno.email && (
                    <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                      <Mail className='w-4 h-4' />
                      <span className='truncate'>{alumno.email}</span>
                    </div>
                  )}

                  <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                    <Calendar className='w-4 h-4' />
                    <span>Desde {alumno.fecha_registro}</span>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    {getStatusBadge(alumno.estado)}
                    {getCategoryBadge(alumno.id_categoria)}
                  </div>

                  <div className='pt-2 border-t border-gray-100 dark:border-gray-700'>
                    <Text
                      variant='small'
                      className={designTokens.text.muted + ' mb-2'}
                    >
                      Paquetes:
                    </Text>
                    {getPaquetesBadges(alumno.cedula)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <Text variant='small' className={designTokens.text.muted}>
                  Mostrando {(currentPage - 1) * recordsPerPage + 1} a{' '}
                  {Math.min(
                    currentPage * recordsPerPage,
                    alumnosFiltrados.length
                  )}{' '}
                  de {alumnosFiltrados.length} estudiantes
                </Text>
                <div className='flex items-center gap-2'>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className='w-4 h-4' />
                    Anterior
                  </Button>
                  <Text variant='small' className='px-4'>
                    Página {currentPage} de {totalPages}
                  </Text>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                    <ChevronRight className='w-4 h-4' />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Modal para añadir estudiante */}
        {showModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            <div className='relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden'>
              <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
                <Heading level={3}>Nuevo Estudiante</Heading>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => setShowModal(false)}
                >
                  <X className='w-4 h-4' />
                </Button>
              </div>
              <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)]'>
                <GenericForm
                  fields={alumnoFields}
                  initialValues={{}}
                  onSubmit={handleAdd}
                  submitText='Añadir estudiante'
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal de importación modernizado */}
        {showImportModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            <div className='relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden'>
              <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
                <div>
                  <Heading level={3}>Importar Estudiantes</Heading>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Sube un archivo CSV o Excel con la lista de estudiantes
                  </Text>
                </div>
                <Button
                  variant='secondary'
                  size='sm'
                  onClick={() => setShowImportModal(false)}
                >
                  <X className='w-4 h-4' />
                </Button>
              </div>

              <div className='p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6'>
                {/* Plantillas */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>
                      📋 Plantillas Disponibles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className='flex gap-3'>
                    <a
                      href='/alumnos_template.csv'
                      download='alumnos_template.csv'
                      className='flex-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-center'
                    >
                      📄 Plantilla Básica
                    </a>
                    <a
                      href='/alumnos_demo.csv'
                      download='alumnos_demo.csv'
                      className='flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-center'
                    >
                      🎯 Datos de Demo
                    </a>
                  </CardContent>
                </Card>

                {/* Campos requeridos */}
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>
                      📝 Campos Requeridos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='grid grid-cols-2 gap-3'>
                      {[
                        'cedula',
                        'nombre_completo',
                        'telefono',
                        'fecha_registro',
                        'estado'
                      ].map((field) => (
                        <div key={field} className='flex items-center'>
                          <span className='w-2 h-2 bg-blue-500 rounded-full mr-2'></span>
                          <span className='text-sm text-gray-700 dark:text-gray-300'>
                            {field}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Upload area */}
                <Card>
                  <CardContent className='p-6'>
                    <div className='border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 transition-colors'>
                      <input
                        type='file'
                        accept='.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
                        onChange={handleImportFile}
                        className='hidden'
                        id='file-upload'
                        disabled={importLoading}
                      />
                      <label htmlFor='file-upload' className='cursor-pointer'>
                        <div className='space-y-3'>
                          <Upload className='mx-auto h-12 w-12 text-gray-400' />
                          <div className='text-gray-600 dark:text-gray-400'>
                            <span className='font-medium text-blue-600 hover:text-blue-500'>
                              Haz clic para subir
                            </span>
                            <span className='text-gray-500'>
                              {' '}
                              o arrastra y suelta
                            </span>
                          </div>
                          <Text
                            variant='small'
                            className={designTokens.text.muted}
                          >
                            CSV, XLSX hasta 10MB
                          </Text>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                {/* Estados de importación */}
                {importLoading && (
                  <Alert variant='info'>
                    <div className='flex items-center'>
                      <div className={componentClasses.spinner + ' mr-3'}></div>
                      <Text>Importando estudiantes...</Text>
                    </div>
                  </Alert>
                )}

                {importError && (
                  <Alert variant='error'>
                    <Text className='whitespace-pre-line'>{importError}</Text>
                  </Alert>
                )}

                {importSuccess && (
                  <Alert variant='success'>
                    <Text>{importSuccess}</Text>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Menú contextual */}
        {contextMenu.visible && (
          <div
            ref={contextMenuRef}
            className='absolute z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-2 min-w-[120px]'
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              onClick={() => handleDelete(contextMenu.cedula)}
              className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
            >
              Eliminar
            </button>
          </div>
        )}

        {/* Modal de detalles del estudiante */}
        <StudentDetailsModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          student={selectedAlumno}
          paquetes={paquetes}
          inscripciones={inscripciones}
          categorias={categorias}
          profesores={profesores}
          onDataChange={() => {
            fetchAllData()
          }}
        />
      </div>
    </div>
  )
}
