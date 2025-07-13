import { create } from 'zustand'
import { auth, supabase, ensureUserInDatabase } from './supabase'

// 🔧 Flag global para evitar múltiples inicializaciones
let storeInitialized = false
let initializationPromise = null

export const useStore = create((set, get) => ({
  // Estado de autenticación
  user: null,
  session: null,
  isLoading: true,

  // Estado de organización
  userOrganization: null,
  organizationLoading: false,

  // Estado de la UI
  isDarkMode: localStorage.getItem('isDarkMode') === 'true',
  sidebarOpen: true,

  // Configuración del club
  clubConfig: JSON.parse(localStorage.getItem('clubConfig') || '{}'),

  // Acciones de autenticación
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),

  // Acciones de organización
  setUserOrganization: (organization) =>
    set({ userOrganization: organization }),
  setOrganizationLoading: (loading) => set({ organizationLoading: loading }),

  // Función para cargar organización del usuario con timeout
  loadUserOrganization: async (userId) => {
    if (!userId) {
      set({ organizationLoading: false })
      return null
    }

    set({ organizationLoading: true })

    // 🆕 Timeout para evitar bloqueos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout loading organization')), 5000)
    })

    try {
      console.log('🔄 Cargando organización del usuario:', userId)

      // Race between la consulta y el timeout
      const queryPromise = supabase
        .from('usuarios')
        .select(
          `
          id_organizacion,
          organizaciones:id_organizacion (
            id_organizacion,
            nombre,
            codigo_club,
            pais,
            zona_horaria,
            moneda,
            logo
          )
        `
        )
        .eq('auth_user_id', userId)
        .not('id_organizacion', 'is', null) // 🔧 Filtrar solo registros con organización
        .limit(1)
        .maybeSingle()

      const { data: userData, error: userError } = await Promise.race([
        queryPromise,
        timeoutPromise
      ])

      if (userError) {
        console.error('❌ Error loading user organization:', userError)
        set({ userOrganization: null })
        return null
      }

      // Si no existe el usuario en DB, no es error crítico
      if (!userData) {
        console.log(
          '📝 Usuario no encontrado en DB (probablemente nuevo usuario)'
        )
        set({ userOrganization: null })
        return null
      }

      const organization = userData?.organizaciones
      console.log(
        '✅ Organización cargada:',
        organization?.nombre || 'Sin nombre'
      )
      set({ userOrganization: organization })
      return organization
    } catch (error) {
      console.error('❌ Error/Timeout en loadUserOrganization:', error.message)
      // No bloquear la aplicación, simplemente establecer null
      set({ userOrganization: null })
      return null
    } finally {
      set({ organizationLoading: false })
    }
  },

  // Acciones de UI
  toggleDarkMode: () => {
    const newMode = !get().isDarkMode
    localStorage.setItem('isDarkMode', newMode.toString())
    set({ isDarkMode: newMode })
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Acciones de configuración del club
  updateClubConfig: (config) => {
    const newConfig = { ...get().clubConfig, ...config }
    localStorage.setItem('clubConfig', JSON.stringify(newConfig))
    set({ clubConfig: newConfig })
  },

  // 🆕 Función para forzar fin del loading (fallback de seguridad)
  forceFinishLoading: () => {
    console.log('🔧 Forzando fin del loading state')
    set({ isLoading: false })
  },

  // 🆕 Función de debug para troubleshooting
  debugState: () => {
    const state = get()
    console.log('🔍 Estado actual del store:', {
      isLoading: state.isLoading,
      hasUser: !!state.user,
      hasSession: !!state.session,
      userOrganization: !!state.userOrganization,
      organizationLoading: state.organizationLoading,
      storeInitialized,
      initializationPromise: !!initializationPromise
    })
    return state
  },

  // Inicialización mejorada con singleton pattern
  initialize: async () => {
    // 🔧 Evitar múltiples inicializaciones
    if (storeInitialized) {
      console.log('📦 Store ya inicializado, saltando...')
      // 🆕 Verificar estado de loading y corregir si es necesario
      const currentState = get()
      if (currentState.isLoading && currentState.user) {
        console.log(
          '🔧 Corrigiendo estado inconsistente: usuario existe pero isLoading=true'
        )
        set({ isLoading: false })
      }
      return initializationPromise
    }

    if (initializationPromise) {
      console.log('⏳ Inicialización en progreso, esperando...')
      return initializationPromise
    }

    initializationPromise = (async () => {
      try {
        console.log('🚀 Iniciando store...')
        storeInitialized = true

        // 🆕 Limpieza automática de estados corruptos al inicio
        try {
          console.log('🔍 Verificando estados corruptos...')
          const authKeys = Object.keys(localStorage).filter(
            (key) =>
              key.includes('supabase') ||
              key.includes('auth') ||
              key.includes('padelflow')
          )

          let cleaned = false
          authKeys.forEach((key) => {
            try {
              const value = localStorage.getItem(key)
              if (value && value !== 'null' && value !== 'undefined') {
                JSON.parse(value) // Test if it's valid JSON
              }
            } catch (e) {
              console.warn('🧹 Limpiando localStorage corrupto:', key)
              localStorage.removeItem(key)
              cleaned = true
            }
          })

          if (cleaned) {
            console.log('✅ Estados corruptos limpiados automáticamente')
          }
        } catch (cleanError) {
          console.warn('Error en limpieza automática:', cleanError)
        }

        // 🆕 Timeout de seguridad - máximo 7 segundos en loading
        const loadingTimeout = setTimeout(() => {
          console.warn(
            '⚠️ Timeout de loading alcanzado, forzando fin del loading'
          )
          get().forceFinishLoading()
        }, 7000)

        // 🆕 Sistema de reintentos para getSession
        let session = null
        let sessionError = null
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries) {
          try {
            const result = await auth.getSession()
            session = result.session
            sessionError = result.error

            if (!sessionError) break // Éxito, salir del loop

            console.warn(`⚠️ Intento ${retryCount + 1} fallido:`, sessionError)
            retryCount++

            if (retryCount < maxRetries) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount)
              ) // Backoff exponencial
            }
          } catch (err) {
            console.error(`❌ Error en intento ${retryCount + 1}:`, err)
            sessionError = err
            retryCount++

            if (retryCount < maxRetries) {
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount)
              )
            }
          }
        }

        if (sessionError) {
          console.error('❌ Error final después de reintentos:', sessionError)
          // No lanzar error, continuar con session null
        }

        // 🆕 Siempre establecer isLoading: false después de obtener la sesión
        set({
          session,
          user: session?.user ?? null,
          isLoading: false
        })

        console.log('✅ Estado de auth establecido:', {
          hasSession: !!session,
          hasUser: !!session?.user,
          isLoading: false
        })

        // Limpiar timeout ya que terminamos exitosamente
        clearTimeout(loadingTimeout)

        // Cargar organización del usuario en background si está autenticado
        if (session?.user) {
          console.log('🔄 Cargando organización inicial en background...')
          // No await - ejecutar en background para no bloquear inicialización
          get()
            .loadUserOrganization(session.user.id)
            .catch((orgError) => {
              console.error('❌ Error loading organization:', orgError)
              // Error silencioso - no bloquear la aplicación
            })
        }

        // Suscribirse a cambios de autenticación
        auth.onAuthStateChange(async (event, session) => {
          console.log('🔄 Auth state change:', event)
          set({
            session,
            user: session?.user ?? null
          })

          // Cargar organización en background sin bloquear navegación
          if (session?.user && event === 'SIGNED_IN') {
            console.log(
              '🚀 Usuario autenticado, verificando existencia en BD...'
            )

            // Asegurar que el usuario existe en la tabla usuarios
            ensureUserInDatabase(session.user)
              .then(({ data: dbUser, error }) => {
                if (error) {
                  console.error('❌ Error ensuring user in DB:', error)
                } else {
                  console.log('✅ Usuario verificado en BD:', dbUser)
                }
              })
              .catch((error) => {
                console.error('❌ Error en ensureUserInDatabase:', error)
              })

            // Cargar organización en background
            console.log('🚀 Cargando organización en background...')
            // No await - ejecutar en background
            get()
              .loadUserOrganization(session.user.id)
              .catch((orgError) => {
                console.error(
                  '❌ Error loading organization on sign in:',
                  orgError
                )
                // Error silencioso - no bloquear la aplicación
              })
          } else if (event === 'SIGNED_OUT') {
            set({ userOrganization: null, organizationLoading: false })
          }
        })

        console.log('✅ Store inicializado correctamente')
      } catch (error) {
        console.error('❌ Error initializing auth:', error)
        // 🔧 IMPORTANTE: Siempre terminar el loading, incluso en error
        set({ isLoading: false })
      }
    })()

    return initializationPromise
  },

  // Logout
  logout: async (onLoggedOut) => {
    try {
      const { session } = await auth.getSession()
      if (session) {
        // Solo intenta cerrar sesión si hay sesión activa
        await auth.signOut()
      }
    } catch (error) {
      // Si el error es AuthSessionMissingError, lo ignoramos
      if (!error.message?.includes('Auth session missing')) {
        console.error('Error signing out:', error)
      }
    } finally {
      set({ user: null, session: null, userOrganization: null })
      if (typeof onLoggedOut === 'function') onLoggedOut()
    }
  }
}))

// 🔧 Función para resetear el estado de inicialización (útil para development)
export const resetStoreInitialization = () => {
  storeInitialized = false
  initializationPromise = null
  console.log('🔄 Store initialization reset')
}

// 🆕 Función para limpiar todo el estado de la aplicación
export const clearAppState = () => {
  console.log('🧹 Limpiando estado completo de la aplicación...')

  // Limpiar localStorage
  const keysToKeep = ['isDarkMode', 'clubConfig']
  const allKeys = Object.keys(localStorage)
  allKeys.forEach((key) => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key)
    }
  })

  // Resetear el store
  resetStoreInitialization()

  // Forzar recarga de la página
  window.location.reload()
}

// 🆕 Función para detectar y limpiar estados corruptos automáticamente
export const detectAndCleanCorruptedState = () => {
  try {
    console.log('🔍 Detectando estados corruptos...')

    // Verificar localStorage de Supabase corrupto
    const authKeys = Object.keys(localStorage).filter(
      (key) =>
        key.includes('supabase') ||
        key.includes('auth') ||
        key.includes('padelflow')
    )

    let hasCorruptedAuth = false

    authKeys.forEach((key) => {
      try {
        const value = localStorage.getItem(key)
        if (value && value !== 'null' && value !== 'undefined') {
          JSON.parse(value) // Test if it's valid JSON
        }
      } catch (e) {
        console.warn('🧹 Detectado localStorage corrupto:', key)
        localStorage.removeItem(key)
        hasCorruptedAuth = true
      }
    })

    // Verificar si hay sesiones fantasma
    const supabaseAuthToken = localStorage.getItem('supabase.auth.token')
    const padelflowAuth = localStorage.getItem('padelflow-auth')

    if (supabaseAuthToken || padelflowAuth) {
      try {
        if (supabaseAuthToken) JSON.parse(supabaseAuthToken)
        if (padelflowAuth) JSON.parse(padelflowAuth)
      } catch (e) {
        console.warn('🧹 Limpiando tokens de auth corruptos')
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('padelflow-auth')
        hasCorruptedAuth = true
      }
    }

    if (hasCorruptedAuth) {
      console.log('✅ Estados corruptos limpiados automáticamente')
    }

    return hasCorruptedAuth
  } catch (error) {
    console.error('Error detectando estados corruptos:', error)
    return false
  }
}
