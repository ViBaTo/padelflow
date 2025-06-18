import { useEffect, useState, useRef } from 'react'
import { db, supabase } from '../../lib/supabase'
import { GenericForm } from '../../components/GenericForm'
import {
  Users,
  Phone,
  Calendar,
  Plus,
  Search,
  Filter,
  Mail
} from 'lucide-react'
import { StudentDetailsModal } from '../../components/StudentDetailsModal'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

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
  const recordsPerPage = 5
  const contextMenuRef = useRef(null)
  const filterDropdownRef = useRef(null)
  const [selectedAlumno, setSelectedAlumno] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(null)

  const fetchAlumnos = async () => {
    setLoading(true)
    const { data, error } = await db.getAlumnos()
    if (error) {
      setError(error.message)
      console.error('Error fetching alumnos:', error)
    } else {
      console.log('Alumnos data:', data)
      setAlumnos(data)
    }
    setLoading(false)
  }

  const fetchCategorias = async () => {
    const { data, error } = await db.getCategorias()
    if (error) setError(error.message)
    else setCategorias(data || [])
  }

  const fetchInscripciones = async () => {
    const { data, error } = await supabase.from('inscripciones').select('*')
    if (error) setError(error.message)
    else setInscripciones(data || [])
  }

  const fetchPaquetes = async () => {
    const { data, error } = await db.getPaquetes()
    if (error) setError(error.message)
    else setPaquetes(data || [])
  }

  const fetchProfesores = async () => {
    const { data, error } = await db.getProfesores()
    if (error) setError(error.message)
    else setProfesores(data || [])
  }

  useEffect(() => {
    fetchAlumnos()
    fetchCategorias()
    fetchInscripciones()
    fetchPaquetes()
    fetchProfesores()
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

  const getCategoryBadge = (categoriaId) => {
    if (!categoriaId) {
      return (
        <span className='px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
          Sin categoría
        </span>
      )
    }

    // Buscar la categoría por ID
    const categoriaObj = categorias.find(
      (cat) => cat.id_categoria === categoriaId
    )
    const nombre = categoriaObj ? categoriaObj.categoria : categoriaId

    // Asignar colores según el nombre de la categoría
    const colorMap = {
      'Hombre - 1': 'bg-blue-100 text-blue-800',
      'Hombre - 2': 'bg-blue-200 text-blue-900',
      'Hombre - 3': 'bg-blue-300 text-blue-900',
      'Hombre - 4': 'bg-blue-400 text-white',
      'Hombre - 5': 'bg-blue-500 text-white',
      'Hombre - Principiante': 'bg-cyan-100 text-cyan-800',
      'Hombre - Intermedio': 'bg-cyan-200 text-cyan-900',
      'Hombre - Avanzado': 'bg-cyan-300 text-cyan-900',
      'Mujer - 1': 'bg-pink-100 text-pink-800',
      'Mujer - 2': 'bg-pink-200 text-pink-900',
      'Mujer - 3': 'bg-pink-300 text-pink-900',
      'Mujer - 4': 'bg-pink-400 text-white',
      'Mujer - 5': 'bg-pink-500 text-white',
      'Mujer - Principiante': 'bg-fuchsia-100 text-fuchsia-800',
      'Mujer - Intermedio': 'bg-fuchsia-200 text-fuchsia-900',
      'Mujer - Avanzado': 'bg-fuchsia-300 text-fuchsia-900',
      'Niño - 1': 'bg-green-100 text-green-800',
      'Niño - 2': 'bg-green-200 text-green-900',
      'Niño - 3': 'bg-green-300 text-green-900',
      'Niño - 4': 'bg-green-400 text-white',
      'Niño - 5': 'bg-green-500 text-white',
      'Niño - Principiante': 'bg-lime-100 text-lime-800',
      'Niño - Intermedio': 'bg-lime-200 text-lime-900',
      'Niño - Avanzado': 'bg-lime-300 text-lime-900'
    }

    return (
      <span
        className={`px-2 py-1 rounded-md text-xs font-medium ${
          colorMap[nombre] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {nombre}
      </span>
    )
  }

  // Función para obtener los paquetes de un alumno
  const getAlumnoPaquetes = (cedula) => {
    // Obtener las inscripciones activas del alumno
    const inscripcionesAlumno = inscripciones.filter(
      (insc) => insc.cedula_alumno === cedula && insc.estado === 'ACTIVO'
    )

    // Obtener los nombres de los paquetes
    const paquetesAlumno = inscripcionesAlumno.map((insc) => {
      const paquete = paquetes.find((p) => p.codigo === insc.codigo_paquete)
      return paquete ? paquete.nombre : insc.codigo_paquete
    })

    return paquetesAlumno
  }

  // Función para mostrar los paquetes como badges
  const getPaquetesBadges = (cedula) => {
    const paquetesAlumno = getAlumnoPaquetes(cedula)

    if (paquetesAlumno.length === 0) {
      return (
        <span className='px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800'>
          Sin paquetes
        </span>
      )
    }

    return (
      <div className='flex flex-wrap gap-1'>
        {paquetesAlumno.map((paquete, index) => (
          <span
            key={index}
            className='px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800'
          >
            {paquete}
          </span>
        ))}
      </div>
    )
  }

  // Importar alumnos desde archivo
  const handleImportFile = (e) => {
    setImportError(null)
    setImportSuccess(null)
    const file = e.target.files[0]
    if (!file) return
    setImportLoading(true)
    const ext = file.name.split('.').pop().toLowerCase()
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processRows(results.data, results.meta.fields),
        error: (err) => {
          setImportError('Error al leer el archivo: ' + err.message)
          setImportLoading(false)
        }
      })
    } else if (ext === 'xlsx') {
      const reader = new FileReader()
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
        const fields = Object.keys(rows[0] || {})
        processRows(rows, fields)
      }
      reader.readAsArrayBuffer(file)
    } else {
      setImportError('Formato no soportado. Sube un archivo .csv o .xlsx')
      setImportLoading(false)
    }
  }

  // Procesar filas y subir a Supabase
  const processRows = async (rows, fields) => {
    const required = [
      'cedula',
      'nombre_completo',
      'telefono',
      'fecha_registro',
      'estado'
    ]
    const missing = required.filter((f) => !fields.includes(f))
    if (missing.length > 0) {
      setImportError('Faltan columnas: ' + missing.join(', '))
      setImportLoading(false)
      return
    }
    try {
      let errors = []
      for (const alumno of rows) {
        const { error } = await db.addAlumno(alumno)
        if (error) errors.push(`${alumno.cedula}: ${error.message}`)
      }
      if (errors.length > 0) {
        setImportError('Errores al importar:\n' + errors.join('\n'))
      } else {
        setImportSuccess('Importación exitosa')
        fetchAlumnos()
        setShowImportModal(false)
      }
    } catch (err) {
      setImportError('Error inesperado: ' + err.message)
    } finally {
      setImportLoading(false)
    }
  }

  return (
    <div className='flex flex-col flex-1 h-full p-6'>
      {/* Header e indicadores */}
      <div>
        {/* Header */}
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Estudiantes</h1>
            <p className='text-gray-600 mt-1'>
              Gestiona los estudiantes del club de pádel
            </p>
          </div>
          <div className='flex gap-2'>
            <button
              className='bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow flex items-center text-sm'
              onClick={() => setShowModal(true)}
            >
              <Plus className='w-4 h-4 mr-2' />
              Nuevo Estudiante
            </button>
            <button
              className='bg-gray-100 hover:bg-gray-200 text-blue-700 px-5 py-2 rounded-lg font-semibold shadow flex items-center text-sm border border-gray-300'
              onClick={() => setShowImportModal(true)}
            >
              Importar CSV
            </button>
          </div>
        </div>
        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 my-6'>
          <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-600'>
                Total Estudiantes
              </span>
              <Users className='h-4 w-4 text-blue-600' />
            </div>
            <div className='text-2xl font-bold text-gray-900'>
              {totalAlumnos}
            </div>
            <p className='text-xs text-gray-500 mt-1'>Registrados en el club</p>
          </div>
          <div className='bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-1'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-600'>
                Estudiantes Activos
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
              Lista de Estudiantes
            </h2>
            <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto justify-end ml-auto'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
                <input
                  type='text'
                  placeholder='Buscar estudiantes...'
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
        </div>
      </div>
      {/* Listado con scroll */}
      <div className='flex-1 overflow-y-auto mt-4'>
        {/* Tabla de estudiantes */}
        <div className='overflow-x-auto'>
          <table className='min-w-full bg-white rounded-xl border border-gray-200'>
            <thead>
              <tr className='bg-gray-50'>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Nombre
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Contacto
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Categoría
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Estado
                </th>
                <th className='px-6 py-3 text-left text-xs font-semibold text-gray-500'>
                  Paquetes
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
                  <td className='px-6 py-4'>
                    <div className='font-medium text-gray-900 text-sm'>
                      {alumno.nombre_completo}
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    <div className='space-y-1'>
                      <div className='flex items-center text-sm text-gray-600'>
                        <Phone className='w-3 h-3 mr-1' />
                        {alumno.telefono}
                      </div>
                    </div>
                  </td>
                  <td className='px-6 py-4'>
                    {getCategoryBadge(alumno.categoria_id)}
                  </td>
                  <td className='px-6 py-4'>{getStatusBadge(alumno.estado)}</td>
                  <td className='px-6 py-4'>
                    {getPaquetesBadges(alumno.cedula)}
                  </td>
                  <td className='px-6 py-4'>
                    <div className='flex space-x-2'>
                      <button
                        className='border border-gray-200 rounded px-3 py-1 text-xs font-medium hover:bg-gray-100 transition'
                        onClick={() => {
                          setSelectedAlumno(alumno)
                          setShowDetailModal(true)
                        }}
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
      {/* Modal para añadir estudiante */}
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
              submitText='Añadir estudiante'
            />
          </div>
        </div>
      )}
      {/* Modal de detalle de alumno */}
      <StudentDetailsModal
        open={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        student={selectedAlumno}
        paquetes={paquetes}
        inscripciones={inscripciones}
        categorias={categorias}
        profesores={profesores}
      />
      {/* Modal de importación de alumnos */}
      {showImportModal && (
        <div className='fixed inset-0 z-50 flex justify-center items-center bg-black/40'>
          <div className='bg-white rounded-lg p-8 shadow-lg relative w-full max-w-md'>
            <button
              className='absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none transition-colors duration-200'
              onClick={() => setShowImportModal(false)}
              aria-label='Cerrar'
            >
              ×
            </button>
            <h2 className='text-xl font-bold mb-4'>
              Importar alumnos desde CSV
            </h2>
            <p className='mb-2 text-sm text-gray-600'>
              Descarga la plantilla, complétala y súbela aquí. Los campos
              requeridos son:{' '}
              <b>cedula, nombre_completo, telefono, fecha_registro, estado</b>.
            </p>
            <a
              href='/alumnos_template.csv'
              download='alumnos_template.csv'
              className='inline-block mb-4 text-blue-600 underline text-sm'
            >
              Descargar plantilla CSV
            </a>
            <input
              type='file'
              accept='.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel'
              onChange={handleImportFile}
              className='block w-full mb-4 border border-gray-200 rounded p-2'
              disabled={importLoading}
            />
            <div className='text-xs text-gray-500 mb-2'>
              Puedes subir archivos en formato CSV o Excel (.xlsx).
            </div>
            {importLoading && (
              <div className='text-blue-600 mb-2'>Importando...</div>
            )}
            {importError && (
              <div className='text-red-600 mb-2 whitespace-pre-line'>
                {importError}
              </div>
            )}
            {importSuccess && (
              <div className='text-green-600 mb-2'>{importSuccess}</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
