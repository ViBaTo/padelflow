import { useEffect, useState, useRef } from 'react'
import { db } from '../../lib/supabase'
import { GenericForm } from '../../components/GenericForm'

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
  const contextMenuRef = useRef(null)

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
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [contextMenu])

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

  if (loading) return <p>Cargando...</p>
  if (error) return <p className='text-red-500'>Error: {error}</p>

  return (
    <div className='space-y-6 relative'>
      <div className='flex justify-between items-center'>
        <h1 className='text-2xl font-bold text-gray-900 dark:text-white'>
          Paquetes
        </h1>
        <button
          className='bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-semibold shadow'
          onClick={() => setShowModal(true)}
        >
          + Nuevo Paquete
        </button>
      </div>
      {/* Modal para añadir paquete */}
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
              fields={paqueteFields}
              initialValues={{}}
              onSubmit={handleAdd}
              submitText='Añadir paquete'
            />
          </div>
        </div>
      )}
      <table className='min-w-full bg-white dark:bg-gray-800 rounded-lg shadow'>
        <thead>
          <tr>
            <th className='px-4 py-2 text-left'>Código</th>
            <th className='px-4 py-2 text-left'>Categoría</th>
            <th className='px-4 py-2 text-left'>Nombre</th>
            <th className='px-4 py-2 text-left'>Tipo de servicio</th>
            <th className='px-4 py-2 text-left'>Descripción</th>
            <th className='px-4 py-2 text-left'>Número de clases</th>
            <th className='px-4 py-2 text-left'>Precio</th>
            <th className='px-4 py-2 text-left'>Precio con IVA</th>
          </tr>
        </thead>
        <tbody>
          {paquetes.map((paquete) => (
            <tr
              key={paquete.codigo}
              onContextMenu={(e) => handleContextMenu(e, paquete.codigo)}
              className='hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
            >
              <td className='px-4 py-2'>{paquete.codigo}</td>
              <td className='px-4 py-2'>{paquete.categoria}</td>
              <td className='px-4 py-2'>{paquete.nombre}</td>
              <td className='px-4 py-2'>{paquete.tipo_servicio}</td>
              <td className='px-4 py-2'>{paquete.descripcion}</td>
              <td className='px-4 py-2'>{paquete.numero_clases}</td>
              <td className='px-4 py-2'>${paquete.precio}</td>
              <td className='px-4 py-2'>${paquete.precio_con_iva}</td>
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
              onClick={() => handleDelete(contextMenu.codigo)}
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
