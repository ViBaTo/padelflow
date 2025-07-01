import { useEffect, useState, useRef } from 'react'
import { db } from '../../lib/supabase'
import { GenericForm } from '../../components/GenericForm'
import { TeacherDetailsModal } from '../../components/TeacherDetailsModal'
import {
  UserCog,
  Search,
  Filter,
  Plus,
  Phone,
  Calendar,
  Award
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
  const recordsPerPage = 15
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
    fetchProfesores()
    fetchInscripciones()
    fetchAlumnos()
    fetchPaquetes()
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

  // Badges
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

  if (loading) return <p>Cargando...</p>
  if (error) return <p className='text-red-500'>Error: {error}</p>

  return (
    <div className='space-y-8 px-2 py-4 sm:px-4 md:px-8 bg-gray-50 min-w-0'>
      {/* Header e indicadores */}
      <div>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Profesores</h1>
            <p className='text-gray-600 mt-1'>
              Gestiona los profesores del club de pádel
            </p>
          </div>
          <button
            className='bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center text-sm'
            onClick={() => setShowModal(true)}
          >
            <Plus className='w-4 h-4 mr-2' />
            Nuevo Profesor
          </button>
        </div>
        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 my-6'>
          <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-600'>
                Total Profesores
              </span>
              <UserCog className='h-4 w-4 text-blue-600' />
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              {totalProfesores}
            </div>
            <p className='text-xs text-gray-500 mt-1'>Profesores registrados</p>
          </div>
          <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-600'>
                Profesores Academia
              </span>
              <Award className='h-4 w-4 text-green-600' />
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              {profesoresAcademia}
            </div>
            <p className='text-xs text-gray-500 mt-1'>
              Pueden dar clases de academia
            </p>
          </div>
          <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-600'>Niveles</span>
              <Award className='h-4 w-4 text-blue-600' />
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              {nivelesUnicos.length}
            </div>
            <p className='text-xs text-gray-500 mt-1'></p>
          </div>
        </div>
        {/* Filtros y búsqueda */}
        <div className='bg-white rounded-xl border border-gray-200 p-6 mt-4'>
          <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Lista de Profesores
            </h2>
            <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='Buscar Profesores...'
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pl-10 border border-gray-200 rounded-lg py-2 w-full sm:w-64 text-sm focus:ring-2 focus:ring-blue-100 focus:outline-none'
                />
              </div>
              <div className='relative' ref={filterDropdownRef}>
                <button
                  className='flex items-center border border-gray-200 px-4 py-2 rounded-lg text-gray-700 bg-white text-sm font-medium hover:bg-gray-50 transition'
                  onClick={() => setShowFilterDropdown((v) => !v)}
                  type='button'
                >
                  <Filter className='w-4 h-4 mr-2' />
                  Filtros
                </button>
                {showFilterDropdown && (
                  <div className='absolute right-0 mt-2 w-40 bg-white border rounded-xl shadow z-10 p-3'>
                    <label className='block text-xs font-semibold mb-1 text-gray-700'>
                      Nivel
                    </label>
                    <select
                      value={filterNivel}
                      onChange={(e) => setFilterNivel(e.target.value)}
                      className='w-full border border-gray-200 p-2 rounded-lg text-sm'
                    >
                      <option value='TODOS'>Todos</option>
                      {nivelesUnicos.map((nivel) => (
                        <option key={nivel} value={nivel}>
                          {nivel}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Listado con scroll */}
      <div className='w-full min-w-0'>
        {/* Tabla de profesores */}
        <div className='overflow-x-auto'>
          <table className='min-w-full bg-white rounded-xl border border-gray-200'>
            <thead>
              <tr className='bg-gray-50'>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  ID Profesor
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Nombre
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Teléfono
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Nivel
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Academia
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Fecha Ingreso
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {paginatedProfesores.map((profesor) => (
                <tr
                  key={profesor.id_profesor}
                  className='hover:bg-gray-50 transition'
                  onContextMenu={(e) =>
                    handleContextMenu(e, profesor.id_profesor)
                  }
                >
                  <td className='px-6 py-4 text-sm text-gray-900'>
                    {profesor.id_profesor}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-900 font-medium'>
                    {profesor.nombre_completo}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-700 flex items-center gap-2'>
                    <Phone className='w-4 h-4 text-gray-400' />
                    {profesor.telefono}
                  </td>
                  <td className='px-6 py-4'>{getNivelBadge(profesor.nivel)}</td>
                  <td className='px-6 py-4'>
                    {getAcademiaBadge(profesor.puede_academia)}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-600'>
                    {profesor.fecha_ingreso}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex space-x-2'>
                      <button
                        onClick={() => handleViewTeacher(profesor)}
                        className='border border-gray-200 rounded px-3 py-1 text-xs font-medium hover:bg-gray-100 transition'
                      >
                        Ver
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        {totalPages > 1 && (
          <div className='flex gap-2 mt-4 items-center justify-end'>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className='px-3 py-1 rounded border border-gray-200 bg-white text-gray-700 text-xs font-medium disabled:opacity-50'
            >
              Anterior
            </button>
            <span className='text-xs text-gray-500'>
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className='px-3 py-1 rounded border border-gray-200 bg-white text-gray-700 text-xs font-medium disabled:opacity-50'
            >
              Siguiente
            </button>
          </div>
        )}
      </div>
      {/* Modal para añadir profesor */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity duration-300'>
          <div className='relative bg-white h-full w-full max-w-lg border-l border-gray-200 px-8 py-8 overflow-y-auto animate-fade-in-right'>
            <button
              className='absolute top-4 right-6 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none transition-colors duration-200'
              onClick={() => setShowModal(false)}
              aria-label='Cerrar'
            >
              ×
            </button>
            <GenericForm
              fields={profesorFields}
              initialValues={{}}
              onSubmit={handleAdd}
              submitText='Añadir profesor'
            />
          </div>
        </div>
      )}
      {/* Menú contextual */}
      {contextMenu.visible && (
        <ul
          ref={contextMenuRef}
          className='absolute z-50 bg-white border rounded shadow-md py-1 text-sm'
          style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 120 }}
        >
          <li>
            <button
              onClick={() => handleDelete(contextMenu.id_profesor)}
              className='w-full text-left px-4 py-2 hover:bg-red-100 hover:text-red-600'
            >
              Eliminar
            </button>
          </li>
        </ul>
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
  )
}
