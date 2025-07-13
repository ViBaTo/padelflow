import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 🔧 Singleton para evitar múltiples instancias de Supabase
let supabaseInstance = null

const createSupabaseClient = () => {
  if (supabaseInstance) {
    console.log('📦 Reutilizando instancia existente de Supabase')
    return supabaseInstance
  }

  console.log('🚀 Creando nueva instancia de Supabase')

  // 🚀 Configuración optimizada del cliente Supabase
  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storageKey: 'padelflow-auth' // Key único para evitar conflictos
    },
    global: {
      headers: { 'x-my-custom-header': 'padelflow-app' },
      // 🚀 Timeouts más generosos para conexiones lentas
      fetch: (url, options = {}) => {
        return fetch(url, {
          ...options,
          // Timeout de 30 segundos para todas las request
          signal: AbortSignal.timeout(30000)
        }).catch((error) => {
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - conexión muy lenta')
          }
          throw error
        })
      }
    }
  })

  return supabaseInstance
}

// 🚀 Exportar la instancia singleton
export const supabase = createSupabaseClient()

// ID de organización constante para La Pala (fallback)
const ORGANIZACION_ID = '495f2b65-1b9f-4fdb-bcdf-07374101aa61'

// 🚀 Cache para optimizar getCurrentOrganizationId
let organizationCache = {
  id: null,
  timestamp: null,
  isLoading: false
}

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos en millisegundos

// Helper optimizado para obtener el ID de organización actual
const getCurrentOrganizationId = async () => {
  try {
    // 🚀 Verificar cache válido
    const now = Date.now()
    if (
      organizationCache.id &&
      organizationCache.timestamp &&
      now - organizationCache.timestamp < CACHE_DURATION
    ) {
      console.log('📦 Usando organización desde cache:', organizationCache.id)
      return organizationCache.id
    }

    // 🚀 Evitar múltiples llamadas simultáneas
    if (organizationCache.isLoading) {
      console.log('⏳ Esperando a que termine carga de organización...')
      // Esperar hasta que termine la carga
      while (organizationCache.isLoading) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      return organizationCache.id || ORGANIZACION_ID
    }

    // 🚀 Marcar como cargando
    organizationCache.isLoading = true

    console.log('🔄 Obteniendo organización desde Supabase...')

    // Intentar obtener de la sesión actual del usuario
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      console.warn('No user found, using fallback organization')
      organizationCache = {
        id: ORGANIZACION_ID,
        timestamp: now,
        isLoading: false
      }
      return ORGANIZACION_ID
    }

    // Buscar la organización del usuario
    const { data: userData, error } = await supabase
      .from('usuarios')
      .select('id_organizacion')
      .eq('auth_user_id', user.id)
      .single()

    if (error || !userData?.id_organizacion) {
      console.warn('No organization found for user, using fallback:', error)
      organizationCache = {
        id: ORGANIZACION_ID,
        timestamp: now,
        isLoading: false
      }
      return ORGANIZACION_ID
    }

    // 🚀 Guardar en cache
    organizationCache = {
      id: userData.id_organizacion,
      timestamp: now,
      isLoading: false
    }

    console.log('✅ Organización cargada y cacheada:', userData.id_organizacion)
    return userData.id_organizacion
  } catch (error) {
    console.warn('Error getting current organization, using fallback:', error)

    // 🚀 En caso de error, usar fallback y cachear por menos tiempo
    const now = Date.now()
    organizationCache = {
      id: ORGANIZACION_ID,
      timestamp: now - (CACHE_DURATION - 30000), // Cache por solo 30 segundos en caso de error
      isLoading: false
    }

    return ORGANIZACION_ID
  }
}

// 🚀 Función para limpiar el cache (útil para debug)
export const clearOrganizationCache = () => {
  console.log('🧹 Limpiando cache de organización')
  organizationCache = {
    id: null,
    timestamp: null,
    isLoading: false
  }
}

// 🚀 Función para forzar recarga de organización
export const reloadOrganization = async () => {
  clearOrganizationCache()
  return await getCurrentOrganizationId()
}

// 🆕 Helper para asegurar que un usuario auth existe en la tabla usuarios
export const ensureUserInDatabase = async (authUser, additionalData = {}) => {
  try {
    console.log(
      '🔍 Verificando si usuario existe en tabla usuarios:',
      authUser.id
    )

    // Verificar si ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('auth_user_id', authUser.id)
      .limit(1)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error verificando usuario:', checkError)
      return { data: null, error: checkError }
    }

    if (existingUser) {
      console.log('✅ Usuario ya existe en tabla usuarios:', existingUser)

      // Si se proporcionan datos adicionales y el usuario existe pero con organización null,
      // actualizar la organización
      if (additionalData.id_organizacion && !existingUser.id_organizacion) {
        console.log('🔄 Actualizando organización del usuario existente...')
        const { data: updatedUser, error: updateError } = await supabase
          .from('usuarios')
          .update({
            id_organizacion: additionalData.id_organizacion,
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', authUser.id)
          .select()
          .single()

        if (updateError) {
          console.error('❌ Error actualizando organización:', updateError)
          return { data: existingUser, error: null } // Retornar usuario existente si falla actualización
        }

        console.log('✅ Organización actualizada:', updatedUser)
        return { data: updatedUser, error: null }
      }

      return { data: existingUser, error: null }
    }

    // Si no existe, crearlo con datos básicos
    console.log('📝 Creando usuario en tabla usuarios...')
    const userData = {
      auth_user_id: authUser.id,
      nombre_completo:
        additionalData.nombre_completo || authUser.email.split('@')[0],
      telefono: additionalData.telefono || null,
      rol: additionalData.rol || 'ADMINISTRADOR',
      estado: 'ACTIVO',
      id_organizacion: additionalData.id_organizacion || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: newUser, error: insertError } = await supabase
      .from('usuarios')
      .insert([userData])
      .select()
      .single()

    if (insertError) {
      console.error('❌ Error creando usuario en tabla:', insertError)
      return { data: null, error: insertError }
    }

    console.log('✅ Usuario creado en tabla usuarios:', newUser)
    return { data: newUser, error: null }
  } catch (error) {
    console.error('❌ Error en ensureUserInDatabase:', error)
    return { data: null, error }
  }
}

// Funciones de autenticación
export const auth = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getSession: async () => {
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()
    return { session, error }
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Funciones de base de datos
export const db = {
  // Alumnos
  getAlumnos: async () => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  addAlumno: async (alumno) => {
    const organizacionId = await getCurrentOrganizationId()
    const alumnoConOrganizacion = {
      ...alumno,
      id_organizacion: organizacionId
    }
    const { data, error } = await supabase
      .from('alumnos')
      .insert([alumnoConOrganizacion])
    return { data, error }
  },

  deleteAlumno: async (cedula) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('alumnos')
      .delete()
      .eq('cedula', cedula)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  updateAlumno: async (cedula, updates) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('alumnos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('cedula', cedula)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  updateAlumnoEstado: async (cedula, nuevoEstado) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('alumnos')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('cedula', cedula)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  // Profesores
  getProfesores: async () => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('profesores')
      .select('*')
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  addProfesor: async (profesor) => {
    const organizacionId = await getCurrentOrganizationId()
    const profesorConOrganizacion = {
      ...profesor,
      id_organizacion: organizacionId
    }
    const { data, error } = await supabase
      .from('profesores')
      .insert([profesorConOrganizacion])
    return { data, error }
  },

  updateProfesor: async (id_profesor, updates) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('profesores')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id_profesor', id_profesor)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  deleteProfesor: async (id_profesor) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('profesores')
      .delete()
      .eq('id_profesor', id_profesor)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  // Paquetes
  getPaquetes: async () => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('paquetes')
      .select('*')
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  addPaquete: async (paquete) => {
    const organizacionId = await getCurrentOrganizationId()
    const paqueteConOrganizacion = {
      ...paquete,
      id_organizacion: organizacionId
    }
    const { data, error } = await supabase
      .from('paquetes')
      .insert([paqueteConOrganizacion])
    return { data, error }
  },

  deletePaquete: async (codigo) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('paquetes')
      .delete()
      .eq('codigo', codigo)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  updatePaquete: async (codigo, updates) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('paquetes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('codigo', codigo)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  // Precios
  getPrecios: async () => {
    const { data, error } = await supabase.from('precios').select('*')
    return { data, error }
  },

  // Modos de pago
  getModosDePago: async () => {
    const { data, error } = await supabase.from('modos_de_pago').select('*')
    return { data, error }
  },

  // Gestores
  getGestores: async () => {
    const { data, error } = await supabase.from('gestores').select('*')
    return { data, error }
  },

  // Categorías
  getCategorias: async () => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  // Pagos
  getPagos: async () => {
    const { data, error } = await supabase.from('pagos').select('*')
    return { data, error }
  },

  // Resumen
  getResumen: async () => {
    const { data, error } = await supabase.from('resumen').select('*')
    return { data, error }
  },

  // Inscripciones
  addInscripcion: async (inscripcion) => {
    const organizacionId = await getCurrentOrganizationId()
    const inscripcionConOrganizacion = {
      ...inscripcion,
      id_organizacion: organizacionId
    }
    const { data, error } = await supabase
      .from('inscripciones')
      .insert([inscripcionConOrganizacion])
    return { data, error }
  },

  getInscripciones: async () => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  getInscripcionesActivas: async () => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('estado', 'ACTIVO')
      .eq('id_organizacion', organizacionId)
      .order('fecha_fin', { ascending: true })
    return { data, error }
  },

  updateInscripcion: async (id, updates) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('inscripciones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id_inscripcion', id)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  deleteInscripcion: async (id_inscripcion) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('inscripciones')
      .delete()
      .eq('id_inscripcion', id_inscripcion)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  getVistaInscripcionesActivas: async () => {
    const { data, error } = await supabase
      .from('vista_inscripciones_activas')
      .select('*')
    return { data, error }
  },

  // Asistencias/Eventos de Calendario
  getAsistencias: async () => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .eq('id_organizacion', organizacionId)
      .order('fecha_clase', { ascending: true })
    return { data, error }
  },

  addAsistencia: async (asistencia) => {
    const organizacionId = await getCurrentOrganizationId()
    const asistenciaConOrganizacion = {
      ...asistencia,
      id_organizacion: organizacionId
    }

    // Intentar insertar directamente primero
    try {
      const { data, error } = await supabase
        .from('asistencias')
        .insert([asistenciaConOrganizacion])
        .select()

      // Si hay error relacionado con clases_restantes, intentar sin triggers
      if (
        error &&
        error.message &&
        error.message.includes('clases_restantes')
      ) {
        console.warn(
          'Error relacionado con clases_restantes detectado, intentando inserción simple'
        )

        // Insertar sin activar triggers problemáticos
        const { data: dataSimple, error: errorSimple } = await supabase.rpc(
          'insert_asistencia_simple',
          {
            asistencia_data: asistenciaConOrganizacion
          }
        )

        if (errorSimple) {
          console.error('Error en inserción simple:', errorSimple)
          return { data: null, error: errorSimple }
        }

        return { data: dataSimple, error: null }
      }

      return { data, error }
    } catch (err) {
      console.error('Error general en addAsistencia:', err)
      return { data: null, error: err }
    }
  },

  updateAsistencia: async (id_asistencia, updates) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('asistencias')
      .update(updates)
      .eq('id_asistencia', id_asistencia)
      .eq('id_organizacion', organizacionId)
      .select()
    return { data, error }
  },

  deleteAsistencia: async (id_asistencia) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('asistencias')
      .delete()
      .eq('id_asistencia', id_asistencia)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  // Obtener asistencias por fecha
  getAsistenciasPorFecha: async (fechaInicio, fechaFin) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('asistencias')
      .select('*')
      .eq('id_organizacion', organizacionId)
      .gte('fecha_clase', fechaInicio)
      .lte('fecha_clase', fechaFin)
      .order('fecha_clase', { ascending: true })
    return { data, error }
  },

  // Mover asistencia a otra fecha (usado para drag and drop)
  moverAsistencia: async (id_asistencia, nuevaFecha) => {
    const organizacionId = await getCurrentOrganizationId()

    // 🔍 Debug: Verificar datos recibidos en moverAsistencia
    console.log('🔍 moverAsistencia - Datos recibidos:', {
      id_asistencia,
      nuevaFecha,
      tipoDato: typeof nuevaFecha,
      organizacionId
    })

    const { data, error } = await supabase
      .from('asistencias')
      .update({ fecha_clase: nuevaFecha })
      .eq('id_asistencia', id_asistencia)
      .eq('id_organizacion', organizacionId)
      .select()

    // 🔍 Debug: Verificar resultado de la actualización
    console.log('🔍 moverAsistencia - Resultado:', {
      data,
      error,
      fechaActualizada: data?.[0]?.fecha_clase
    })

    return { data, error }
  },

  // Canchas
  getCanchas: async () => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('canchas')
      .select('*')
      .eq('id_organizacion', organizacionId)
      .order('nombre')
    return { data, error }
  },

  addCancha: async (cancha) => {
    const organizacionId = await getCurrentOrganizationId()
    const canchaConOrganizacion = {
      ...cancha,
      id_organizacion: organizacionId
    }
    const { data, error } = await supabase
      .from('canchas')
      .insert([canchaConOrganizacion])
      .select()
    return { data, error }
  },

  updateCancha: async (id_cancha, updates) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('canchas')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id_cancha', id_cancha)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  deleteCancha: async (id_cancha) => {
    const organizacionId = await getCurrentOrganizationId()
    const { data, error } = await supabase
      .from('canchas')
      .delete()
      .eq('id_cancha', id_cancha)
      .eq('id_organizacion', organizacionId)
    return { data, error }
  },

  // Organizaciones - nuevas funciones
  getOrganizaciones: async () => {
    const { data, error } = await supabase
      .from('organizaciones')
      .select('*')
      .eq('estado', 'ACTIVO')
      .order('nombre')
    return { data, error }
  },

  getCurrentOrganization: async () => {
    const organizacionId = await getCurrentOrganizationId()
    console.log('🔍 getCurrentOrganization - ID:', organizacionId)

    const { data, error } = await supabase
      .from('organizaciones')
      .select('*, logo')
      .eq('id_organizacion', organizacionId)
      .maybeSingle()

    if (error) {
      console.error('❌ Error en getCurrentOrganization:', error)
    } else {
      console.log(
        '✅ getCurrentOrganization - datos:',
        data ? 'encontrados' : 'no encontrados'
      )
    }

    return { data, error }
  },

  updateOrganization: async (updates) => {
    const organizacionId = await getCurrentOrganizationId()
    console.log(
      '🔍 updateOrganization - ID:',
      organizacionId,
      'Updates:',
      updates
    )

    // Primero verificar que la organización existe
    const { data: existingOrg, error: checkError } = await supabase
      .from('organizaciones')
      .select('id_organizacion, nombre')
      .eq('id_organizacion', organizacionId)
      .maybeSingle()

    if (checkError) {
      console.error('❌ Error verificando organización:', checkError)
      return { data: null, error: checkError }
    }

    if (!existingOrg) {
      console.error('❌ Organización no encontrada:', organizacionId)
      return {
        data: null,
        error: {
          message: `Organización con ID ${organizacionId} no encontrada`,
          code: 'ORGANIZATION_NOT_FOUND'
        }
      }
    }

    console.log('✅ Organización encontrada:', existingOrg.nombre)

    // Proceder con la actualización
    const { data, error } = await supabase
      .from('organizaciones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id_organizacion', organizacionId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('❌ Error en updateOrganization:', error)
    } else {
      console.log(
        '✅ updateOrganization - datos actualizados:',
        data ? 'sí' : 'no'
      )
    }

    return { data, error }
  }
}

// 🚀 Funciones de utilidad para debug y optimización
export const supabaseUtils = {
  // Test de conectividad básico
  testConnection: async () => {
    try {
      console.log('🔍 Testing Supabase connection...')
      const start = Date.now()

      const { data, error } = await supabase
        .from('alumnos')
        .select('id_alumno')
        .limit(1)

      const duration = Date.now() - start

      if (error) {
        console.error('❌ Connection test failed:', error)
        return { success: false, error, duration }
      }

      console.log(`✅ Connection test successful in ${duration}ms`)
      return { success: true, duration }
    } catch (error) {
      console.error('❌ Connection test error:', error)
      return { success: false, error }
    }
  },

  // Limpieza de cache de organización
  clearCache: () => {
    clearOrganizationCache()
    console.log('🧹 All caches cleared')
  },

  // Información de rendimiento
  getPerformanceInfo: () => {
    const now = Date.now()
    return {
      organizationCache: {
        hasId: !!organizationCache.id,
        age: organizationCache.timestamp
          ? now - organizationCache.timestamp
          : null,
        isLoading: organizationCache.isLoading
      },
      connection: {
        online: navigator.onLine,
        type: navigator.connection?.effectiveType || 'unknown'
      }
    }
  }
}

// Exponer utilidades globalmente en desarrollo
if (import.meta.env.DEV && typeof window !== 'undefined') {
  window.supabaseUtils = supabaseUtils
  console.log('🛠️ supabaseUtils disponible globalmente (window.supabaseUtils)')
}
