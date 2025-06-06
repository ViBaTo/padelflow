import { useEffect, useState, useRef } from 'react'
import { db } from '../../lib/supabase'
import { GenericForm } from '../../components/GenericForm'
import { Users, Phone, Calendar, Plus, Search, Filter } from 'lucide-react'

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState([])
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
  const recordsPerPage = 15
  const contextMenuRef = useRef(null)
  const filterDropdownRef = useRef(null)

  const fetchAlumnos = async () => {
    setLoading(true)
    const { data, error } = await db.getAlumnos()
    if (error) setError(error.message)
    else setAlumnos(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchAlumnos()
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
    if (error) setError(error.message)
    else fetchAlumnos()
  }

  const handleContextMenu = (e, cedula) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, cedula })
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

  // Estadísticas
  const totalAlumnos = alumnos.length
  const activos = alumnos.filter((a) => a.estado === 'ACTIVO').length

  // Nuevos este mes y porcentaje
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  const nuevosEsteMes = alumnos.filter((a) => {
    if (!a.fecha_registro) return false
    const fecha = new Date(a.fecha_registro)
    return fecha.getMonth() === thisMonth && fecha.getFullYear() === thisYear
  }).length
  const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1
  const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear
  const nuevosMesAnterior = alumnos.filter((a) => {
    if (!a.fecha_registro) return false
    const fecha = new Date(a.fecha_registro)
    return fecha.getMonth() === prevMonth && fecha.getFullYear() === prevYear
  }).length
  let porcentaje = 0
  if (nuevosMesAnterior > 0) {
    porcentaje = ((nuevosEsteMes - nuevosMesAnterior) / nuevosMesAnterior) * 100
  } else if (nuevosEsteMes > 0) {
    porcentaje = 100
  }

  // Formulario
  const alumnoFields = [
    { name: 'cedula', label: 'Cédula', type: 'text', required: true },
    {
      name: 'nombre_completo',
      label: 'Nombre completo',
      type: 'text',
      required: true
    },
    { name: 'telefono', label: 'Teléfono', type: 'text', required: true },
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
      options: ['ACTIVO', 'INACTIVO'],
      required: true
    }
  ]

  // Badges
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

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Alumnos</h1>
          <p className='text-gray-600 mt-1'>
            Gestiona los alumnos del club de pádel
          </p>
        </div>
        <button
          className='bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center text-sm'
          onClick={() => setShowModal(true)}
        >
          <Plus className='w-4 h-4 mr-2' />
          Nuevo Alumno
        </button>
      </div>
      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Total Alumnos
            </span>
            <Users className='h-4 w-4 text-blue-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900'>{totalAlumnos}</div>
          <p className='text-xs text-gray-500 mt-1'>Registrados en el club</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Alumnos Activos
            </span>
            <Users className='h-4 w-4 text-green-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900'>{activos}</div>
          <p className='text-xs text-gray-500 mt-1'>Participando en clases</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Nuevos Este Mes
            </span>
            <Calendar className='h-4 w-4 text-blue-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900'>
            {nuevosEsteMes}
          </div>
          <div
            className={`text-xs mt-1 ${
              porcentaje >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {porcentaje >= 0 ? '+' : ''}
            {porcentaje.toFixed(0)}% vs mes anterior
          </div>
        </div>
      </div>
      {/* Filtros y búsqueda */}
      <div className='bg-white rounded-xl border border-gray-200 p-6 mt-4'>
        <div className='flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Lista de Alumnos
          </h2>
          <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end ml-auto'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Buscar Alumnos...'
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
                    Estado
                  </label>
                  <select
                    value={filterEstado}
                    onChange={(e) => setFilterEstado(e.target.value)}
                    className='w-full border border-gray-200 p-2 rounded-lg text-sm'
                  >
                    <option value='TODOS'>Todos</option>
                    <option value='ACTIVO'>Activo</option>
                    <option value='INACTIVO'>Inactivo</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Tabla de alumnos */}
        <div className='overflow-x-auto'>
          <table className='min-w-full bg-white rounded-xl border border-gray-200'>
            <thead>
              <tr className='bg-gray-50'>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Cédula
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Nombre
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Teléfono
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Fecha Registro
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Estado
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-100'>
              {paginatedAlumnos.map((alumno) => (
                <tr
                  key={alumno.cedula}
                  className='hover:bg-gray-50 transition'
                  onContextMenu={(e) => handleContextMenu(e, alumno.cedula)}
                >
                  <td className='px-6 py-4 text-sm text-gray-900'>
                    {alumno.cedula}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-900 font-medium'>
                    {alumno.nombre_completo}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-700 flex items-center gap-2'>
                    <Phone className='w-4 h-4 text-gray-400' />
                    {alumno.telefono}
                  </td>
                  <td className='px-6 py-4 text-sm text-gray-600'>
                    {alumno.fecha_registro}
                  </td>
                  <td className='px-6 py-4'>{getStatusBadge(alumno.estado)}</td>
                  <td className='px-6 py-4'>
                    <div className='flex space-x-2'>
                      <button className='border border-gray-200 rounded px-3 py-1 text-xs font-medium hover:bg-gray-100 transition'>
                        Ver
                      </button>
                      <button className='border border-gray-200 rounded px-3 py-1 text-xs font-medium hover:bg-gray-100 transition'>
                        Editar
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
        {/* Menú contextual */}
        {contextMenu.visible && (
          <ul
            ref={contextMenuRef}
            className='absolute z-50 bg-white border rounded shadow-md py-1 text-sm'
            style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 120 }}
          >
            <li>
              <button
                onClick={() => handleDelete(contextMenu.cedula)}
                className='w-full text-left px-4 py-2 hover:bg-red-100 hover:text-red-600'
              >
                Eliminar
              </button>
            </li>
          </ul>
        )}
      </div>
      {/* Modal para añadir alumno */}
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
              fields={alumnoFields}
              initialValues={{}}
              onSubmit={handleAdd}
              submitText='Añadir alumno'
            />
          </div>
        </div>
      )}
    </div>
  )
}
