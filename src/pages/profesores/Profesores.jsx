import { useEffect, useState, useRef } from 'react'
import { db } from '../../lib/supabase'
import { GenericForm } from '../../components/GenericForm'

export function Profesores() {
  const [profesores, setProfesores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    id_profesor: null
  })
  const contextMenuRef = useRef(null)

  const fetchProfesores = async () => {
    setLoading(true)
    const { data, error } = await db.getProfesores()
    if (error) setError(error.message)
    else setProfesores(data)
    setLoading(false)
  }

  useEffect(() => {
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
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [contextMenu])

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
    { name: 'nivel', label: 'Nivel', type: 'text', required: true },
    { name: 'puede_academia', label: 'Puede academia', type: 'checkbox' },
    {
      name: 'fecha_ingreso',
      label: 'Fecha ingreso',
      type: 'date',
      required: true
    }
  ]

  if (loading) return <p>Cargando...</p>
  if (error) return <p className='text-red-500'>Error: {error}</p>

  return (
    <div className='space-y-6 relative'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
          Profesores
        </h1>
        <button
          className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold shadow'
          onClick={() => setShowModal(true)}
        >
          + Nuevo Profesor
        </button>
      </div>
      {/* Modal para añadir profesor */}
      {showModal && (
        <div className='fixed inset-0 z-50 flex justify-end bg-black/50 transition-opacity duration-300'>
          <div className='relative bg-white dark:bg-gray-900 h-full w-full max-w-lg border-l border-gray-200 dark:border-gray-800 px-8 py-8 overflow-y-auto animate-fade-in-right'>
            <button
              className='absolute top-4 right-6 text-gray-400 hover:text-gray-700 dark:hover:text-white text-2xl font-bold focus:outline-none transition-colors duration-200'
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
      <table className='min-w-full bg-white dark:bg-gray-800 rounded-lg shadow'>
        <thead>
          <tr>
            <th className='px-4 py-2 text-left'>ID Profesor</th>
            <th className='px-4 py-2 text-left'>Nombre completo</th>
            <th className='px-4 py-2 text-left'>Teléfono</th>
            <th className='px-4 py-2 text-left'>Nivel</th>
            <th className='px-4 py-2 text-left'>Puede academia</th>
            <th className='px-4 py-2 text-left'>Fecha ingreso</th>
          </tr>
        </thead>
        <tbody>
          {profesores.map((profesor) => (
            <tr
              key={profesor.id_profesor}
              onContextMenu={(e) => handleContextMenu(e, profesor.id_profesor)}
              className='hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
            >
              <td className='px-4 py-2'>{profesor.id_profesor}</td>
              <td className='px-4 py-2'>{profesor.nombre_completo}</td>
              <td className='px-4 py-2'>{profesor.telefono}</td>
              <td className='px-4 py-2'>{profesor.nivel}</td>
              <td className='px-4 py-2'>
                {profesor.puede_academia ? 'Sí' : 'No'}
              </td>
              <td className='px-4 py-2'>{profesor.fecha_ingreso}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Menú contextual */}
      {contextMenu.visible && (
        <ul
          ref={contextMenuRef}
          className='absolute z-50 bg-white dark:bg-gray-800 border rounded shadow-md py-1 text-sm'
          style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 120 }}
        >
          <li>
            <button
              onClick={() => handleDelete(contextMenu.id_profesor)}
              className='w-full text-left px-4 py-2 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900 dark:hover:text-red-400'
            >
              Eliminar
            </button>
          </li>
        </ul>
      )}
    </div>
  )
}
