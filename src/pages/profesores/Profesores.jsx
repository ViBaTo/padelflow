import { useEffect, useState, useRef } from 'react'
import { db } from '../../lib/supabase'
import { GenericForm } from '../../components/GenericForm'
import { TeacherDetailsModal } from '../../components/TeacherDetailsModal'
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
  UserCog,
  Search,
  Filter,
  Plus,
  Phone,
  Calendar,
  Award,
  Users,
  Eye,
  MoreHorizontal,
  Download,
  BarChart3,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'

export function Profesores() {
  const [profesores, setProfesores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [inscripciones, setInscripciones] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [paquetes, setPaquetes] = useState([])
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    id_profesor: null
  })
  const [search, setSearch] = useState('')
  const [filterNivel, setFilterNivel] = useState('TODOS')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 12
  const contextMenuRef = useRef(null)
  const filterDropdownRef = useRef(null)

  const fetchProfesores = async () => {
    setLoading(true)
    const { data, error } = await db.getProfesores()
    if (error) setError(error.message)
    else setProfesores(data)
    setLoading(false)
  }

  const fetchInscripciones = async () => {
    const { data, error } = await db.getInscripciones()
    if (!error) setInscripciones(data || [])
  }

  const fetchAlumnos = async () => {
    const { data, error } = await db.getAlumnos()
    if (!error) setAlumnos(data || [])
  }

  const fetchPaquetes = async () => {
    const { data, error } = await db.getPaquetes()
    if (!error) setPaquetes(data || [])
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        console.log('🔄 Loading teachers data...')

        const dataPromise = db.getProfesores()

        // 🚀 Timeout aumentado significativamente (de 10s a 30s)
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Timeout al cargar profesores')),
            30000
          )
        )

        const { data, error } = await Promise.race([
          dataPromise,
          timeoutPromise
        ])

        if (error) {
          console.error('Error loading teachers:', error)
          throw error
        }

        setProfesores(data || [])
        setError('')
        console.log('✅ Teachers data loaded successfully')
      } catch (err) {
        console.error('❌ Error fetching profesores:', err)

        // 🚀 Mensaje de error más informativo
        if (err.message.includes('Timeout')) {
          setError(
            'La carga de profesores está tardando más de lo esperado. Verifica tu conexión a internet o intenta recargar la página.'
          )
        } else {
          setError('Error al cargar profesores: ' + err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
    const { error } = await db.addProfesor(data)
    if (error) setError(error.message)
    else {
      setShowModal(false)
      fetchProfesores()
    }
  }

  const handleDelete = async (id_profesor) => {
    setContextMenu({ ...contextMenu, visible: false })
    const { error } = await db.deleteProfesor(id_profesor)
    if (error) setError(error.message)
    else fetchProfesores()
  }

  const handleViewTeacher = (profesor) => {
    setSelectedTeacher(profesor)
    setShowDetailsModal(true)
  }

  const handleContextMenu = (e, id_profesor) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, id_profesor })
  }

  // Definición de campos para el formulario genérico de profesores
  const profesorFields = [
    { name: 'id_profesor', label: 'ID Profesor', type: 'text', required: true },
    {
      name: 'nombre_completo',
      label: 'Nombre completo',
      type: 'text',
      required: true
    },
    { name: 'telefono', label: 'Teléfono', type: 'text', required: true },
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
    { name: 'puede_academia', label: 'Puede academia', type: 'checkbox' },
    {
      name: 'fecha_ingreso',
      label: 'Fecha ingreso',
      type: 'date',
      required: true
    }
  ]

  // Filtros y paginación
  const profesoresFiltrados = profesores.filter((profesor) => {
    const matchNombre =
      profesor.nombre_completo &&
      profesor.nombre_completo.toLowerCase().includes(search.toLowerCase())
    const matchTelefono =
      profesor.telefono &&
      profesor.telefono.toLowerCase().includes(search.toLowerCase())
    const matchNivel = filterNivel === 'TODOS' || profesor.nivel === filterNivel
    return (matchNombre || matchTelefono) && matchNivel
  })

  const totalPages = Math.ceil(profesoresFiltrados.length / recordsPerPage)
  const paginatedProfesores = profesoresFiltrados.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterNivel])

  // Estadísticas
  const totalProfesores = profesores.length
  const profesoresAcademia = profesores.filter((p) => p.puede_academia).length
  const nivelesUnicos = [...new Set(profesores.map((p) => p.nivel))]

  // Badges mejorados
  const getNivelBadge = (nivel) => {
    const configs = {
      A: {
        bg: 'bg-gradient-to-r from-red-500 to-pink-500',
        text: 'text-white',
        icon: '🥇'
      },
      B: {
        bg: 'bg-gradient-to-r from-orange-500 to-yellow-500',
        text: 'text-white',
        icon: '🥈'
      },
      C: {
        bg: 'bg-gradient-to-r from-yellow-500 to-green-500',
        text: 'text-white',
        icon: '🥉'
      },
      D: {
        bg: 'bg-gradient-to-r from-green-500 to-blue-500',
        text: 'text-white',
        icon: '⭐'
      }
    }
    const config = configs[nivel] || {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      icon: '📋'
    }

    return (
      <span
        className={`px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text} shadow-sm flex items-center gap-1`}
      >
        <span>{config.icon}</span>
        Nivel {nivel}
      </span>
    )
  }

  const getAcademiaBadge = (puedeAcademia) => (
    <span
      className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
        puedeAcademia
          ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {puedeAcademia ? '✅ Sí' : '❌ No'}
    </span>
  )

  if (loading) {
    return (
      <div className={componentClasses.pageContainer}>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className={componentClasses.spinner}></div>
            <Text className='mt-4'>Cargando profesores...</Text>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={componentClasses.pageContainer}>
        <div className='p-6 lg:p-8 max-w-7xl mx-auto'>
          <Alert variant='error'>
            <Text>Error: {error}</Text>
          </Alert>
        </div>
      </div>
    )
  }

  return (
    <div className={componentClasses.pageContainer}>
      <div className='p-3 lg:p-4 max-w-7xl mx-auto space-y-4'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div>
            <Heading level={1} className='mb-1'>
              Gestión de Profesores
            </Heading>
            <Text variant='lead' className={designTokens.text.secondary}>
              Administra el equipo docente de tu club de pádel
            </Text>
          </div>
          <div className='flex gap-2'>
            <Button variant='secondary' size='sm'>
              <Download className='w-4 h-4 mr-2' />
              Exportar
            </Button>
            <Button size='sm' onClick={() => setShowModal(true)}>
              <Plus className='w-4 h-4 mr-2' />
              Nuevo Profesor
            </Button>
          </div>
        </div>

        {/* Métricas de profesores */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {/* Total Profesores */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Total Profesores
                  </Text>
                  <Heading level={2} className='mt-2 mb-1'>
                    {totalProfesores}
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <UserCog className='w-4 h-4 text-blue-500 mr-1' />
                    <span className={designTokens.text.info}>
                      Equipo completo
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl'>
                  <UserCog className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profesores Academia */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Certificados Academia
                  </Text>
                  <Heading level={2} className='mt-2 mb-1'>
                    {profesoresAcademia}
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <Award className='w-4 h-4 text-green-500 mr-1' />
                    <span className={designTokens.text.success}>
                      {Math.round(
                        (profesoresAcademia / totalProfesores) * 100
                      ) || 0}
                      % del total
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-green-500 to-emerald-600 p-3 rounded-2xl'>
                  <Award className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Niveles Diferentes */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Niveles Activos
                  </Text>
                  <Heading level={2} className='mt-2 mb-1'>
                    {nivelesUnicos.length}
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <Star className='w-4 h-4 text-blue-500 mr-1' />
                    <span className={designTokens.text.info}>
                      Diversidad de niveles
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl'>
                  <Star className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promedio experiencia */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Experiencia Promedio
                  </Text>
                  <Heading level={2} className='mt-2 mb-1'>
                    2.5 años
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <Clock className='w-4 h-4 text-orange-500 mr-1' />
                    <span className={designTokens.text.warning}>
                      Equipo maduro
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-orange-500 to-red-600 p-3 rounded-2xl'>
                  <Clock className='w-6 h-6 text-white' />
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
                <CardTitle>Lista de Profesores</CardTitle>
                <CardSubtitle>
                  {profesoresFiltrados.length} profesores encontrados
                </CardSubtitle>
              </div>
              <div className='flex flex-col sm:flex-row gap-3'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <input
                    type='text'
                    placeholder='Buscar profesores...'
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
                        Nivel
                      </label>
                      <select
                        value={filterNivel}
                        onChange={(e) => setFilterNivel(e.target.value)}
                        className='w-full border border-gray-300 dark:border-gray-600 p-2 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                      >
                        <option value='TODOS'>Todos los niveles</option>
                        {nivelesUnicos.map((nivel) => (
                          <option key={nivel} value={nivel}>
                            Nivel {nivel}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Grid de profesores */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {paginatedProfesores.map((profesor) => (
            <Card
              key={profesor.id_profesor}
              className='group hover:shadow-2xl transition-all duration-300 cursor-pointer'
              onContextMenu={(e) => handleContextMenu(e, profesor.id_profesor)}
            >
              <CardContent className='p-6'>
                <div className='flex items-start justify-between mb-4'>
                  <div className='bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl'>
                    <UserCog className='w-6 h-6 text-white' />
                  </div>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => handleViewTeacher(profesor)}
                    className='opacity-0 group-hover:opacity-100 transition-opacity'
                  >
                    <Eye className='w-4 h-4' />
                  </Button>
                </div>

                <div className='space-y-3'>
                  <div>
                    <Heading level={4} className='mb-1 truncate'>
                      {profesor.nombre_completo}
                    </Heading>
                    <Text variant='caption' className={designTokens.text.muted}>
                      ID: {profesor.id_profesor}
                    </Text>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                    <Phone className='w-4 h-4' />
                    <span>{profesor.telefono}</span>
                  </div>

                  <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                    <Calendar className='w-4 h-4' />
                    <span>Desde {profesor.fecha_ingreso}</span>
                  </div>

                  <div className='flex flex-wrap gap-2'>
                    {getNivelBadge(profesor.nivel)}
                    {getAcademiaBadge(profesor.puede_academia)}
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
                    profesoresFiltrados.length
                  )}{' '}
                  de {profesoresFiltrados.length} profesores
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

        {/* Modal para añadir profesor */}
        {showModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm'>
            <div className='relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden'>
              <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700'>
                <Heading level={3}>Nuevo Profesor</Heading>
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
                  fields={profesorFields}
                  initialValues={{}}
                  onSubmit={handleAdd}
                  submitText='Añadir profesor'
                />
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
              onClick={() => handleDelete(contextMenu.id_profesor)}
              className='w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors'
            >
              Eliminar
            </button>
          </div>
        )}

        {/* Modal de detalles del profesor */}
        <TeacherDetailsModal
          open={showDetailsModal}
          onClose={() => setShowDetailsModal(false)}
          teacher={selectedTeacher}
          inscripciones={inscripciones}
          alumnos={alumnos}
          paquetes={paquetes}
          onDataChange={() => {
            fetchProfesores()
            fetchInscripciones()
            fetchAlumnos()
            fetchPaquetes()
          }}
        />
      </div>
    </div>
  )
}
