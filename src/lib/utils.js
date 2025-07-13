import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export function formatDate(date) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

// Función para generar colores automáticos para categorías
export const getCategoryColor = (categoryName) => {
  if (!categoryName) return 'bg-gray-100 text-gray-800'

  // Generar un hash del nombre de la categoría
  let hash = 0
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convertir a entero de 32 bits
  }

  // Usar el hash para seleccionar un color
  const colors = [
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-red-100 text-red-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
    'bg-teal-100 text-teal-800',
    'bg-orange-100 text-orange-800',
    'bg-cyan-100 text-cyan-800',
    'bg-lime-100 text-lime-800',
    'bg-emerald-100 text-emerald-800',
    'bg-rose-100 text-rose-800',
    'bg-violet-100 text-violet-800',
    'bg-sky-100 text-sky-800',
    'bg-amber-100 text-amber-800'
  ]

  const colorIndex = Math.abs(hash) % colors.length
  return colors[colorIndex]
}

// Función para obtener variaciones de color (más intenso)
export const getCategoryColorIntense = (categoryName) => {
  if (!categoryName) return 'bg-gray-200 text-gray-900'

  let hash = 0
  for (let i = 0; i < categoryName.length; i++) {
    const char = categoryName.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }

  const colors = [
    'bg-blue-200 text-blue-900',
    'bg-green-200 text-green-900',
    'bg-yellow-200 text-yellow-900',
    'bg-red-200 text-red-900',
    'bg-purple-200 text-purple-900',
    'bg-pink-200 text-pink-900',
    'bg-indigo-200 text-indigo-900',
    'bg-teal-200 text-teal-900',
    'bg-orange-200 text-orange-900',
    'bg-cyan-200 text-cyan-900',
    'bg-lime-200 text-lime-900',
    'bg-emerald-200 text-emerald-900',
    'bg-rose-200 text-rose-900',
    'bg-violet-200 text-violet-900',
    'bg-sky-200 text-sky-900',
    'bg-amber-200 text-amber-900'
  ]

  const colorIndex = Math.abs(hash) % colors.length
  return colors[colorIndex]
}

// Función para obtener colores basados en configuración del club
export const getCategoryColorByConfig = (categoryName, clubConfig = {}) => {
  // Si el club tiene configuración específica de colores, usarla
  if (clubConfig.categoryColors && clubConfig.categoryColors[categoryName]) {
    return clubConfig.categoryColors[categoryName]
  }

  // Si no, usar colores automáticos
  return getCategoryColor(categoryName)
}

// Función para generar colores consistentes por tipo de categoría
export const getCategoryColorByType = (categoryName) => {
  const lowerName = categoryName.toLowerCase()

  // Detectar patrones comunes
  if (lowerName.includes('hombre') || lowerName.includes('masculino')) {
    return 'bg-blue-100 text-blue-800'
  }
  if (lowerName.includes('mujer') || lowerName.includes('femenino')) {
    return 'bg-pink-100 text-pink-800'
  }
  if (
    lowerName.includes('niño') ||
    lowerName.includes('infantil') ||
    lowerName.includes('junior')
  ) {
    return 'bg-green-100 text-green-800'
  }
  if (lowerName.includes('principiante') || lowerName.includes('básico')) {
    return 'bg-yellow-100 text-yellow-800'
  }
  if (lowerName.includes('intermedio') || lowerName.includes('medio')) {
    return 'bg-orange-100 text-orange-800'
  }
  if (lowerName.includes('avanzado') || lowerName.includes('experto')) {
    return 'bg-red-100 text-red-800'
  }
  if (lowerName.includes('senior') || lowerName.includes('adulto')) {
    return 'bg-purple-100 text-purple-800'
  }

  // Si no coincide con ningún patrón, usar color automático
  return getCategoryColor(categoryName)
}

// Función para convertir datos a formato CSV
export const convertToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    return null
  }

  // Obtener las columnas del primer objeto
  const columns = Object.keys(data[0])

  // Crear la línea de encabezados
  const headers = columns.join(',')

  // Crear las líneas de datos
  const rows = data.map((row) => {
    return columns
      .map((column) => {
        const value = row[column]
        // Escapar comillas y manejar valores especiales
        if (value === null || value === undefined) {
          return ''
        }
        const stringValue = String(value)
        if (
          stringValue.includes(',') ||
          stringValue.includes('"') ||
          stringValue.includes('\n')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(',')
  })

  // Combinar headers y rows
  const csvContent = [headers, ...rows].join('\n')

  // Crear y descargar el archivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

// Función para exportar todas las tablas como archivos CSV separados
export const exportAllTablesAsCSV = async (db, supabase) => {
  const tables = [
    { name: 'alumnos', label: 'Alumnos', function: 'getAlumnos' },
    { name: 'profesores', label: 'Profesores', function: 'getProfesores' },
    { name: 'paquetes', label: 'Paquetes', function: 'getPaquetes' },
    { name: 'precios', label: 'Precios', function: 'getPrecios' },
    {
      name: 'modos_de_pago',
      label: 'Modos de Pago',
      function: 'getModosDePago'
    },
    { name: 'gestores', label: 'Gestores', function: 'getGestores' },
    { name: 'categorias', label: 'Categorías', function: 'getCategorias' },
    { name: 'pagos', label: 'Pagos', function: 'getPagos' },
    { name: 'resumen', label: 'Resumen', function: 'getResumen' },
    {
      name: 'inscripciones',
      label: 'Inscripciones',
      function: 'getInscripciones'
    }
  ]

  const date = new Date().toISOString().split('T')[0]
  const exportedFiles = []

  for (const table of tables) {
    try {
      let data, error

      // Intentar usar la función específica del db
      if (db[table.function]) {
        const result = await db[table.function]()
        data = result.data
        error = result.error
      } else {
        // Fallback: usar supabase directamente
        const result = await supabase.from(table.name).select('*')
        data = result.data
        error = result.error
      }

      if (error) {
        console.warn(`Error al exportar ${table.label}:`, error)
        continue
      }

      if (data && data.length > 0) {
        const filename = `lapala_${table.name}_${date}`
        convertToCSV(data, filename)
        exportedFiles.push(table.label)
      }
    } catch (err) {
      console.warn(`Error al exportar ${table.label}:`, err)
    }
  }

  return exportedFiles
}

// 🔧 Funciones de formateo de fechas seguras (sin problemas de zona horaria)

/**
 * Formatea una fecha a string YYYY-MM-DD de manera segura sin problemas de zona horaria
 * @param {Date} date - La fecha a formatear
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
export const formatDateSafe = (date) => {
  if (!date || !(date instanceof Date)) {
    console.warn('formatDateSafe: fecha inválida recibida:', date)
    return null
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formatea una fecha a string YYYY-MM-DD HH:MM:SS de manera segura
 * @param {Date} date - La fecha a formatear
 * @returns {string} - Fecha en formato YYYY-MM-DD HH:MM:SS
 */
export const formatDateTimeSafe = (date) => {
  if (!date || !(date instanceof Date)) {
    console.warn('formatDateTimeSafe: fecha inválida recibida:', date)
    return null
  }

  const datePart = formatDateSafe(date)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${datePart} ${hours}:${minutes}:${seconds}`
}

/**
 * Convierte un string de fecha YYYY-MM-DD a objeto Date local
 * @param {string} dateString - String en formato YYYY-MM-DD
 * @returns {Date} - Objeto Date local
 */
export const parseeDateStringToLocal = (dateString) => {
  if (!dateString || typeof dateString !== 'string') {
    console.warn(
      'parseeDateStringToLocal: string de fecha inválido:',
      dateString
    )
    return null
  }

  // Dividir la fecha en partes para evitar problemas de zona horaria
  const [year, month, day] = dateString.split('-').map(Number)

  if (!year || !month || !day) {
    console.warn(
      'parseeDateStringToLocal: formato de fecha inválido:',
      dateString
    )
    return null
  }

  // Crear fecha local usando el constructor con parámetros separados
  return new Date(year, month - 1, day) // month es 0-indexed en JavaScript
}

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns {string} - Fecha actual en formato YYYY-MM-DD
 */
export const getTodayDateString = () => {
  return formatDateSafe(new Date())
}

/**
 * Compara dos fechas ignorando la hora
 * @param {Date} date1 - Primera fecha
 * @param {Date} date2 - Segunda fecha
 * @returns {boolean} - true si las fechas son el mismo día
 */
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false

  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}
