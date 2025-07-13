import { supabase } from './supabase'

// Diagnósticos ligeros para desarrollo
let isMonitoring = false

const diagnostics = {
  // Monitor ligero que no genera tanto ruido
  startLightMonitor() {
    if (isMonitoring) return
    isMonitoring = true

    // Solo loggear problemas críticos
    window.addEventListener('error', (event) => {
      console.error('💥 Error crítico:', event.error)
    })

    window.addEventListener('unhandledrejection', (event) => {
      console.error('🚨 Promise rechazada:', event.reason)
    })

    console.log('🔍 Monitor ligero iniciado')
  },

  // Diagnóstico de salud simplificado
  logHealth() {
    console.log('🔍 App Health Diagnostics')
    console.log('Timestamp:', new Date().toISOString())

    // Verificar store
    try {
      const store = window.useStore?.getState?.() || {}
      const hasUser = !!store.user
      const isLoading = store.isLoading

      console.log(hasUser ? '✅ Store State: OK' : '⚠️ Store State: NO USER')
      console.log('  Details:', {
        hasUser,
        isLoading,
        userOrganization: !!store.userOrganization
      })
    } catch (e) {
      console.log('❌ Store State: ERROR')
    }

    // Verificar conectividad básica
    console.log(navigator.onLine ? '✅ Network: OK' : '❌ Network: OFFLINE')
    console.log('  Details:', {
      online: navigator.onLine,
      connection: navigator.connection?.effectiveType || 'unknown'
    })

    // Verificar localStorage
    try {
      localStorage.setItem('test', 'test')
      localStorage.removeItem('test')
      console.log('✅ Local Storage: OK')
    } catch (e) {
      console.log('❌ Local Storage: ERROR')
    }

    // Verificar memoria (simplificado)
    if (performance.memory) {
      const memory = performance.memory
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
      const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024)

      if (usedMB > 100) {
        console.log('⚠️ Memory Usage: WARNING')
        console.log('  Details:', { usedMB, totalMB })
      } else {
        console.log('✅ Memory Usage: OK')
      }
    }
  },

  // Función para debuggear problemas específicos
  debugAuth() {
    return {
      hasSupabase: !!window.supabase,
      hasStore: !!window.useStore,
      localStorage: {
        hasAuth: !!localStorage.getItem('supabase.auth.token'),
        hasPadelAuth: !!localStorage.getItem('padelflow-auth'),
        keys: Object.keys(localStorage).filter((k) => k.includes('auth'))
      }
    }
  }
}

// 🆕 Función para diagnosticar usuarios desincronizados
export const diagnoseUserSync = async () => {
  try {
    console.log('🔍 Diagnosticando sincronización de usuarios...')

    // Obtener usuario actual de Auth
    const {
      data: { user: authUser },
      error: authError
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('❌ Error obteniendo usuario de Auth:', authError)
      return {
        status: 'error',
        message: 'No se pudo obtener usuario de Auth',
        details: { authError }
      }
    }

    if (!authUser) {
      return {
        status: 'info',
        message: 'No hay usuario autenticado',
        details: {}
      }
    }

    console.log('👤 Usuario Auth encontrado:', {
      id: authUser.id,
      email: authUser.email,
      created_at: authUser.created_at
    })

    // Buscar usuario en tabla usuarios
    const { data: dbUser, error: dbError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .maybeSingle()

    if (dbError) {
      console.error('❌ Error buscando usuario en tabla:', dbError)
      return {
        status: 'error',
        message: 'Error consultando tabla usuarios',
        details: { dbError }
      }
    }

    if (!dbUser) {
      console.warn(
        '⚠️ Usuario desincronizado: existe en Auth pero no en tabla usuarios'
      )
      return {
        status: 'warning',
        message: 'Usuario desincronizado',
        details: {
          authUser: {
            id: authUser.id,
            email: authUser.email,
            created_at: authUser.created_at
          },
          suggestion: 'El usuario necesita ser creado en la tabla usuarios'
        }
      }
    }

    console.log('✅ Usuario sincronizado correctamente')
    return {
      status: 'success',
      message: 'Usuario sincronizado correctamente',
      details: {
        authUser: {
          id: authUser.id,
          email: authUser.email
        },
        dbUser: {
          id: dbUser.id,
          nombre_completo: dbUser.nombre_completo,
          rol: dbUser.rol,
          id_organizacion: dbUser.id_organizacion
        }
      }
    }
  } catch (error) {
    console.error('❌ Error en diagnóstico de sincronización:', error)
    return {
      status: 'error',
      message: 'Error inesperado en diagnóstico',
      details: { error: error.message }
    }
  }
}

// 🆕 Función para diagnosticar la estructura de la tabla canchas
export const diagnoseCanchasStructure = async () => {
  try {
    console.log('🔍 Diagnosticando estructura de tabla canchas...')

    // Obtener la estructura de la tabla
    const { data: structure, error: structureError } = await supabase
      .from('canchas')
      .select('*')
      .limit(1)

    if (structureError) {
      console.error(
        '❌ Error obteniendo estructura de canchas:',
        structureError
      )
      return {
        status: 'error',
        message: 'No se pudo obtener estructura de tabla canchas',
        details: { structureError }
      }
    }

    // Obtener una muestra de datos
    const { data: sampleData, error: sampleError } = await supabase
      .from('canchas')
      .select('*')
      .limit(3)

    if (sampleError) {
      console.error('❌ Error obteniendo muestra de canchas:', sampleError)
      return {
        status: 'error',
        message: 'No se pudo obtener muestra de canchas',
        details: { sampleError }
      }
    }

    // Campos esperados para una cancha
    const expectedFields = [
      'id_cancha',
      'nombre',
      'tipo',
      'color',
      'estado',
      'capacidad',
      'precio_hora',
      'descripcion',
      'id_organizacion',
      'created_at',
      'updated_at'
    ]

    const actualFields = sampleData.length > 0 ? Object.keys(sampleData[0]) : []

    const missingFields = expectedFields.filter(
      (field) => !actualFields.includes(field)
    )
    const extraFields = actualFields.filter(
      (field) => !expectedFields.includes(field)
    )

    console.log('✅ Estructura de tabla canchas analizada')
    return {
      status: 'success',
      message: 'Estructura de tabla canchas analizada',
      details: {
        expectedFields,
        actualFields,
        missingFields,
        extraFields,
        sampleData: sampleData.map((cancha) => ({
          ...cancha,
          // Ocultar campos sensibles
          created_at: cancha.created_at ? 'presente' : 'ausente',
          updated_at: cancha.updated_at ? 'presente' : 'ausente'
        })),
        fieldsInfo: {
          required: ['nombre', 'tipo', 'color', 'id_organizacion'],
          optional: ['capacidad', 'precio_hora', 'descripcion', 'estado'],
          auto: ['id_cancha', 'created_at', 'updated_at']
        }
      }
    }
  } catch (error) {
    console.error('❌ Error en diagnóstico de estructura de canchas:', error)
    return {
      status: 'error',
      message: 'Error inesperado en diagnóstico',
      details: { error: error.message }
    }
  }
}

// 🆕 Función para limpiar usuarios duplicados
export const cleanDuplicateUsers = async () => {
  try {
    console.log('🔍 Buscando usuarios duplicados...')

    // Buscar usuarios duplicados por auth_user_id
    const { data: duplicates, error: duplicateError } = await supabase
      .from('usuarios')
      .select('auth_user_id, count(*)')
      .group('auth_user_id')
      .having('count(*) > 1')

    if (duplicateError) {
      console.error('❌ Error buscando duplicados:', duplicateError)
      return {
        status: 'error',
        message: 'No se pudo buscar usuarios duplicados',
        details: { duplicateError }
      }
    }

    if (duplicates.length === 0) {
      console.log('✅ No se encontraron usuarios duplicados')
      return {
        status: 'success',
        message: 'No hay usuarios duplicados',
        details: {}
      }
    }

    console.log(`⚠️ Se encontraron ${duplicates.length} usuarios duplicados`)
    return {
      status: 'warning',
      message: `Se encontraron ${duplicates.length} usuarios duplicados`,
      details: {
        duplicates,
        recommendation:
          'Contacta con el administrador para resolver los duplicados'
      }
    }
  } catch (error) {
    console.error('❌ Error en limpieza de usuarios duplicados:', error)
    return {
      status: 'error',
      message: 'Error inesperado en limpieza',
      details: { error: error.message }
    }
  }
}

// 🆕 Función para verificar requisitos de cancha
export const validateCanchaData = (canchaData) => {
  const errors = []
  const warnings = []

  // Validar campos requeridos
  if (!canchaData.nombre || canchaData.nombre.trim() === '') {
    errors.push('El nombre de la cancha es requerido')
  }

  if (!canchaData.tipo || canchaData.tipo.trim() === '') {
    errors.push('El tipo de cancha es requerido')
  } else if (!['indoor', 'outdoor'].includes(canchaData.tipo.toLowerCase())) {
    warnings.push('El tipo de cancha debería ser "indoor" o "outdoor"')
  }

  if (!canchaData.color || canchaData.color.trim() === '') {
    errors.push('El color para el calendario es requerido')
  }

  // Validar campos opcionales
  if (canchaData.capacidad && canchaData.capacidad <= 0) {
    warnings.push('La capacidad debe ser mayor a 0')
  }

  if (canchaData.precio_hora && canchaData.precio_hora < 0) {
    warnings.push('El precio por hora no puede ser negativo')
  }

  const allowedStates = ['ACTIVA', 'INACTIVA', 'MANTENIMIENTO']
  if (canchaData.estado && !allowedStates.includes(canchaData.estado)) {
    warnings.push(`El estado debe ser uno de: ${allowedStates.join(', ')}`)
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    cleanedData: {
      nombre: canchaData.nombre?.toString().trim(),
      tipo: canchaData.tipo?.toString().trim().toLowerCase(),
      color: canchaData.color?.toString().trim(),
      estado: canchaData.estado?.toString().trim() || 'ACTIVA',
      capacidad: parseInt(canchaData.capacidad) || 4,
      precio_hora: parseFloat(canchaData.precio_hora) || 0,
      descripcion: canchaData.descripcion?.toString().trim() || ''
    }
  }
}

// 🆕 Función de diagnóstico completo para canchas
export const runCanchasDiagnostic = async () => {
  console.log('🔍 === DIAGNÓSTICO COMPLETO DE CANCHAS ===')

  try {
    // Verificar estructura
    const structureResult = await diagnoseCanchasStructure()
    console.log('📊 Estructura de tabla:', structureResult)

    // Verificar usuarios duplicados
    const duplicateResult = await cleanDuplicateUsers()
    console.log('👥 Usuarios duplicados:', duplicateResult)

    // Verificar sincronización de usuarios
    const syncResult = await diagnoseUserSync()
    console.log('🔄 Sincronización de usuarios:', syncResult)

    // Resumen
    console.log('📋 === RESUMEN DE DIAGNÓSTICO ===')
    console.log('✅ Estructura de canchas:', structureResult.status)
    console.log('✅ Usuarios duplicados:', duplicateResult.status)
    console.log('✅ Sincronización:', syncResult.status)

    return {
      structure: structureResult,
      duplicates: duplicateResult,
      sync: syncResult
    }
  } catch (error) {
    console.error('❌ Error en diagnóstico completo:', error)
    return { error: error.message }
  }
}

// Hacer disponible globalmente en desarrollo
if (import.meta.env.DEV) {
  window.appDiagnostics = {
    ...diagnostics,
    diagnoseCanchasStructure,
    cleanDuplicateUsers,
    validateCanchaData,
    runCanchasDiagnostic,
    diagnoseUserSync
  }
}

export default diagnostics
