import { useEffect, useState, useRef } from 'react'
import { db } from '../../lib/supabase'
import { GenericForm } from '../../components/GenericForm'
import { PaqueteDetailsModal } from '../../components/PaqueteDetailsModal'
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
import { componentClasses, designTokens } from '../../lib/designTokens'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Heading, Text } from '../../components/ui/Typography'

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
  const recordsPerPage = 10
  const contextMenuRef = useRef(null)
  const filterDropdownRef = useRef(null)
  const [selectedPaquete, setSelectedPaquete] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const fetchPaquetes = async () => {
    setLoading(true)
    const { data, error } = await db.getPaquetes()
    if (error) {
      setError(error.message)
    } else {
      setPaquetes(data || [])
    }
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
    if (!paquete) return false
    const matchNombre =
      paquete.nombre &&
      paquete.nombre.toLowerCase().includes(search.toLowerCase())
    const matchCodigo =
      paquete.codigo &&
      paquete.codigo.toLowerCase().includes(search.toLowerCase())
    const matchTipoServicio =
      filterTipoServicio === 'TODOS' ||
      (paquete.tipo_servicio && paquete.tipo_servicio === filterTipoServicio)
    return (matchNombre || matchCodigo) && matchTipoServicio
  })

  // console.log('Total paquetes:', paquetes.length)
  // console.log('Paquetes filtrados:', paquetesFiltrados.length)

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
  const totalIngresos = paquetes.reduce(
    (sum, p) => sum + (p.precio_con_iva || 0),
    0
  )
  const tiposServicioUnicos = [
    ...new Set(paquetes.map((p) => p.tipo_servicio).filter(Boolean))
  ]

  // Badges
  const getTipoServicioBadge = (tipo) => {
    if (!tipo) return <Badge variant='secondary'>N/A</Badge>
    const variants = {
      CONDFIS: 'default',
      ACADEMIA: 'secondary',
      CLINICA: 'secondary',
      PROFESOR_A: 'secondary',
      PROFESOR_B: 'secondary',
      INTENSIVO: 'secondary',
      OTRO: 'secondary'
    }
    return <Badge variant={variants[tipo] || 'secondary'}>{tipo}</Badge>
  }

  if (loading) return <p>Cargando...</p>
  if (error) return <p className='text-red-500'>Error: {error}</p>

  return (
    <div className={componentClasses.pageContainer}>
      <div className='p-3 lg:p-4 max-w-7xl mx-auto space-y-4'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div>
            <Heading level={1} className='mb-1'>
              Paquetes
            </Heading>
            <Text variant='lead' className={designTokens.text.secondary}>
              Gestiona los paquetes de servicios del club
            </Text>
          </div>
          <Button size='sm' onClick={() => setShowModal(true)}>
            <Plus className='w-4 h-4 mr-2' />
            Nuevo Paquete
          </Button>
        </div>
        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <Text variant='caption' className={designTokens.text.muted}>
                  Total Paquetes
                </Text>
                <Package className='h-4 w-4 text-blue-600' />
              </div>
              <Heading level={2} className='mt-1 mb-1'>
                {totalPaquetes}
              </Heading>
              <Text variant='small' className={designTokens.text.muted}>
                Paquetes disponibles
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <Text variant='caption' className={designTokens.text.muted}>
                  Ingresos Totales
                </Text>
                <DollarSign className='h-4 w-4 text-green-600' />
              </div>
              <Heading level={2} className='mt-1 mb-1'>
                {formatCurrency(totalIngresos)}
              </Heading>
              <Text variant='small' className={designTokens.text.muted}>
                Valor total de paquetes
              </Text>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <Text variant='caption' className={designTokens.text.muted}>
                  Servicios
                </Text>
                <Tag className='h-4 w-4 text-blue-600' />
              </div>
              <Heading level={2} className='mt-1 mb-1'>
                {tiposServicioUnicos.length}
              </Heading>
              <Text variant='small' className={designTokens.text.muted}>
                Tipos de paquetes
              </Text>
            </CardContent>
          </Card>
        </div>
        {/* Filtros y búsqueda */}
        <Card>
          <CardHeader className='p-4'>
            <div className='flex flex-col sm:flex-row gap-3 items-center justify-between'>
              <CardTitle className='text-base'>Lista de Paquetes</CardTitle>
              <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
                <div className='relative'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                  <Input
                    type='text'
                    placeholder='Buscar Paquetes...'
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className='pl-10 w-full sm:w-64'
                  />
                </div>
                <div className='relative' ref={filterDropdownRef}>
                  <Button
                    variant='secondary'
                    size='sm'
                    onClick={() => setShowFilterDropdown((v) => !v)}
                    type='button'
                  >
                    <Filter className='w-4 h-4 mr-2' />
                    Filtros
                  </Button>
                  {showFilterDropdown && (
                    <div className='absolute right-0 mt-2 w-40 bg-white border rounded-lg shadow-lg z-10 p-3'>
                      <Text
                        variant='small'
                        className='block font-semibold mb-2 text-gray-700'
                      >
                        Tipo de Servicio
                      </Text>
                      <Select
                        value={filterTipoServicio}
                        onValueChange={setFilterTipoServicio}
                      >
                        <SelectTrigger className='w-full'>
                          <SelectValue placeholder='Seleccionar tipo' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='TODOS'>Todos</SelectItem>
                          {tiposServicioUnicos.length > 0 ? (
                            tiposServicioUnicos.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {tipo}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value='' disabled>
                              No hay tipos de servicio
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Lista de paquetes */}
        <Card>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <table className='min-w-full'>
                <thead>
                  <tr className='border-b bg-gray-50/50'>
                    <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Código
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Nombre
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Tipo de servicio
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Clases
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Precio Total
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider'>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-100'>
                  {paginatedPaquetes.length === 0 ? (
                    <tr>
                      <td colSpan='6' className='px-6 py-8 text-center'>
                        <div className='flex flex-col items-center justify-center space-y-2'>
                          <Package className='h-8 w-8 text-gray-400' />
                          <Text
                            variant='body'
                            className={designTokens.text.muted}
                          >
                            {paquetes.length === 0
                              ? 'No hay paquetes registrados'
                              : 'No se encontraron paquetes con los filtros aplicados'}
                          </Text>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedPaquetes.map((paquete) => (
                      <tr
                        key={paquete.codigo}
                        className='hover:bg-gray-50/50 transition-colors'
                        onContextMenu={(e) =>
                          handleContextMenu(e, paquete.codigo)
                        }
                      >
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <Text variant='body' className='font-mono text-sm'>
                            {paquete.codigo || 'N/A'}
                          </Text>
                        </td>
                        <td className='px-6 py-4'>
                          <Text variant='body' className='font-medium'>
                            {paquete.nombre || 'Sin nombre'}
                          </Text>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          {getTipoServicioBadge(paquete.tipo_servicio)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <Text
                            variant='body'
                            className={designTokens.text.muted}
                          >
                            {paquete.numero_clases || 0}
                          </Text>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <Text
                            variant='body'
                            className='font-semibold text-green-600'
                          >
                            {formatCurrency(
                              (paquete.precio_con_iva || 0) *
                                (paquete.numero_clases || 0)
                            )}
                          </Text>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <Button
                            variant='secondary'
                            size='sm'
                            onClick={() => {
                              setSelectedPaquete(paquete)
                              setShowDetailModal(true)
                            }}
                          >
                            Ver
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className='flex gap-2 mt-4 items-center justify-end'>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Text variant='small' className={designTokens.text.muted}>
              Página {currentPage} de {totalPages}
            </Text>
            <Button
              variant='secondary'
              size='sm'
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        )}

        {/* Modales y menús contextuales */}
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
        {/* Modal de detalle de paquete */}
        <PaqueteDetailsModal
          open={showDetailModal}
          onClose={() => setShowDetailModal(false)}
          paquete={selectedPaquete}
          onDataChange={fetchPaquetes}
        />
      </div>
    </div>
  )
}
