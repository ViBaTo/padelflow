import { useState, useEffect } from 'react'
import { getCategoryColorByType } from '../lib/utils'

export function CategoryColorConfig({ categorias, onSave, clubConfig = {} }) {
  const [colorConfig, setColorConfig] = useState({})
  const [isEditing, setIsEditing] = useState(false)

  const colorOptions = [
    { name: 'Azul', class: 'bg-blue-100 text-blue-800' },
    { name: 'Verde', class: 'bg-green-100 text-green-800' },
    { name: 'Amarillo', class: 'bg-yellow-100 text-yellow-800' },
    { name: 'Rojo', class: 'bg-red-100 text-red-800' },
    { name: 'Púrpura', class: 'bg-purple-100 text-purple-800' },
    { name: 'Rosa', class: 'bg-pink-100 text-pink-800' },
    { name: 'Índigo', class: 'bg-indigo-100 text-indigo-800' },
    { name: 'Verde azulado', class: 'bg-teal-100 text-teal-800' },
    { name: 'Naranja', class: 'bg-orange-100 text-orange-800' },
    { name: 'Cian', class: 'bg-cyan-100 text-cyan-800' },
    { name: 'Lima', class: 'bg-lime-100 text-lime-800' },
    { name: 'Esmeralda', class: 'bg-emerald-100 text-emerald-800' },
    { name: 'Rosa intenso', class: 'bg-rose-100 text-rose-800' },
    { name: 'Violeta', class: 'bg-violet-100 text-violet-800' },
    { name: 'Cielo', class: 'bg-sky-100 text-sky-800' },
    { name: 'Ámbar', class: 'bg-amber-100 text-amber-800' }
  ]

  useEffect(() => {
    // Inicializar con colores automáticos si no hay configuración
    const initialConfig = {}
    categorias.forEach((cat) => {
      initialConfig[cat.categoria] =
        clubConfig.categoryColors?.[cat.categoria] ||
        getCategoryColorByType(cat.categoria)
    })
    setColorConfig(initialConfig)
  }, [categorias, clubConfig])

  const handleColorChange = (categoryName, colorClass) => {
    setColorConfig((prev) => ({
      ...prev,
      [categoryName]: colorClass
    }))
  }

  const handleSave = () => {
    onSave({ categoryColors: colorConfig })
    setIsEditing(false)
  }

  const handleReset = () => {
    const resetConfig = {}
    categorias.forEach((cat) => {
      resetConfig[cat.categoria] = getCategoryColorByType(cat.categoria)
    })
    setColorConfig(resetConfig)
  }

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6'>
      <div className='flex justify-between items-center mb-4'>
        <h3 className='text-lg font-semibold text-gray-900'>
          Configuración de Colores por Categoría
        </h3>
        <div className='flex gap-2'>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className='px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700'
            >
              Editar
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className='px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700'
              >
                Guardar
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className='px-3 py-1 bg-gray-600 text-white rounded-md text-sm hover:bg-gray-700'
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      <div className='space-y-3'>
        {categorias.map((categoria) => (
          <div
            key={categoria.id_categoria}
            className='flex items-center justify-between p-3 border border-gray-100 rounded-lg'
          >
            <div className='flex items-center gap-3'>
              <span
                className={`px-2 py-1 rounded-md text-xs font-medium ${
                  colorConfig[categoria.categoria] ||
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {categoria.categoria}
              </span>
              <span className='text-sm text-gray-600'>Color actual</span>
            </div>

            {isEditing && (
              <select
                value={colorConfig[categoria.categoria] || ''}
                onChange={(e) =>
                  handleColorChange(categoria.categoria, e.target.value)
                }
                className='border border-gray-300 rounded-md px-2 py-1 text-sm'
              >
                <option value=''>Automático</option>
                {colorOptions.map((color) => (
                  <option key={color.class} value={color.class}>
                    {color.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
      </div>

      {isEditing && (
        <div className='mt-4 pt-4 border-t border-gray-200'>
          <button
            onClick={handleReset}
            className='px-3 py-1 bg-yellow-600 text-white rounded-md text-sm hover:bg-yellow-700'
          >
            Restablecer a Automático
          </button>
        </div>
      )}

      <div className='mt-4 p-3 bg-blue-50 rounded-lg'>
        <p className='text-sm text-blue-800'>
          <strong>Nota:</strong> Los colores automáticos se generan basándose en
          el nombre de la categoría. Puedes personalizar cada categoría o dejar
          que el sistema los asigne automáticamente.
        </p>
      </div>
    </div>
  )
}
