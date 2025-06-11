import { useEffect, useState, useRef } from 'react'
import { db } from '../../lib/supabase'
import { GenericForm } from '../../components/GenericForm'
import {
  Package,
  Search,
  Filter,
  Plus,
  DollarSign,
  Calendar,
  Tag
} from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

export function Paquetes() {
  const [paquetes, setPaquetes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    codigo: null
  })
  const [search, setSearch] = useState('')
  const [filterTipoServicio, setFilterTipoServicio] = useState('TODOS')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const recordsPerPage = 15
  const contextMenuRef = useRef(null)
  const filterDropdownRef = useRef(null)

  const fetchPaquetes = async () => {
    setLoading(true)
    const { data, error } = await db.getPaquetes()
    if (error) setError(error.message)
    else setPaquetes(data)
    setLoading(false)
  }

  useEffect(() => {
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
    const { error } = await db.addPaquete(data)
    if (error) setError(error.message)
    else {
      setShowModal(false)
      fetchPaquetes()
    }
  }

  const handleDelete = async (codigo) => {
    setContextMenu({ ...contextMenu, visible: false })
    const { error } = await db.deletePaquete(codigo)
    if (error) setError(error.message)
    else fetchPaquetes()
  }

  const handleContextMenu = (e, codigo) => {
    e.preventDefault()
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, codigo })
  }

  // Definición de campos para el formulario genérico de paquetes
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

  // Filtros y paginación
  const paquetesFiltrados = paquetes.filter((paquete) => {
    const matchNombre =
      paquete.nombre &&
      paquete.nombre.toLowerCase().includes(search.toLowerCase())
    const matchCodigo =
      paquete.codigo &&
      paquete.codigo.toLowerCase().includes(search.toLowerCase())
    const matchTipoServicio =
      filterTipoServicio === 'TODOS' ||
      paquete.tipo_servicio === filterTipoServicio
    return (matchNombre || matchCodigo) && matchTipoServicio
  })

  const totalPages = Math.ceil(paquetesFiltrados.length / recordsPerPage)
  const paginatedPaquetes = paquetesFiltrados.slice(
    (currentPage - 1) * recordsPerPage,
    currentPage * recordsPerPage
  )

  useEffect(() => {
    setCurrentPage(1)
  }, [search, filterTipoServicio])

  // Estadísticas
  const totalPaquetes = paquetes.length
  const totalIngresos = paquetes.reduce((sum, p) => sum + p.precio_con_iva, 0)
  const tiposServicioUnicos = [...new Set(paquetes.map((p) => p.tipo_servicio))]

  // Badges
  const getCategoryBadge = (categoria) => {
    const colors = {
      CLASE: 'bg-blue-100 text-blue-800',
      ACADEMIA: 'bg-green-100 text-green-800',
      TORNEO: 'bg-purple-100 text-purple-800',
      OTRO: 'bg-gray-100 text-gray-800'
    }
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          colors[categoria] || colors['OTRO']
        }`}
      >
        {categoria}
      </span>
    )
  }

  if (loading) return <p>Cargando...</p>
  if (error) return <p className='text-red-500'>Error: {error}</p>

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Paquetes</h1>
          <p className='text-gray-600 mt-1'>
            Gestiona los paquetes de servicios del club
          </p>
        </div>
        <button
          className='bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center text-sm'
          onClick={() => setShowModal(true)}
        >
          <Plus className='w-4 h-4 mr-2' />
          Nuevo Paquete
        </button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Total Paquetes
            </span>
            <Package className='h-4 w-4 text-blue-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900'>
            {totalPaquetes}
          </div>
          <p className='text-xs text-gray-500 mt-1'>Paquetes disponibles</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>
              Ingresos Totales
            </span>
            <DollarSign className='h-4 w-4 text-green-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900'>
            {formatCurrency(totalIngresos)}
          </div>
          <p className='text-xs text-gray-500 mt-1'>Valor total de paquetes</p>
        </div>
        <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
          <div className='flex items-center justify-between'>
            <span className='text-sm font-medium text-gray-600'>Servicios</span>
            <Tag className='h-4 w-4 text-blue-600' />
          </div>
          <div className='text-2xl font-bold text-gray-900'>
            {tiposServicioUnicos.length}
          </div>
          <p className='text-xs text-gray-500 mt-1'>Tipos de paquetes</p>
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className='bg-white rounded-xl border border-gray-200 p-6'>
        <div className='flex flex-col sm:flex-row gap-4 items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900'>
            Lista de Paquetes
          </h2>
          <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
              <input
                type='text'
                placeholder='Buscar Paquetes...'
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
                    Tipo de Servicio
                  </label>
                  <select
                    value={filterTipoServicio}
                    onChange={(e) => setFilterTipoServicio(e.target.value)}
                    className='w-full border border-gray-200 p-2 rounded-lg text-sm'
                  >
                    <option value='TODOS'>Todos</option>
                    {tiposServicioUnicos.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de paquetes */}
      <div className='overflow-x-auto'>
        <table className='min-w-full bg-white rounded-xl border border-gray-200'>
          <thead>
            <tr className='bg-gray-50'>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                Código
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                Categoría
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                Nombre
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                Tipo de servicio
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                Clases
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                Precio
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                Precio con IVA
              </th>
              <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-gray-100'>
            {paginatedPaquetes.map((paquete) => (
              <tr
                key={paquete.codigo}
                className='hover:bg-gray-50 transition'
                onContextMenu={(e) => handleContextMenu(e, paquete.codigo)}
              >
                <td className='px-6 py-4 text-sm text-gray-900'>
                  {paquete.codigo}
                </td>
                <td className='px-6 py-4'>
                  {getCategoryBadge(paquete.categoria)}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900 font-medium'>
                  {paquete.nombre}
                </td>
                <td className='px-6 py-4 text-sm text-gray-700'>
                  {paquete.tipo_servicio}
                </td>
                <td className='px-6 py-4 text-sm text-gray-600'>
                  {paquete.numero_clases}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900'>
                  {formatCurrency(paquete.precio)}
                </td>
                <td className='px-6 py-4 text-sm text-gray-900'>
                  {formatCurrency(paquete.precio_con_iva)}
                </td>
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

      {/* Modal para añadir paquete */}
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
              fields={paqueteFields}
              initialValues={{}}
              onSubmit={handleAdd}
              submitText='Añadir paquete'
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
              onClick={() => handleDelete(contextMenu.codigo)}
              className='w-full text-left px-4 py-2 hover:bg-red-100 hover:text-red-600'
            >
              Eliminar
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
