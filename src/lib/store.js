import { create } from 'zustand'
import { auth } from './supabase'

export const useStore = create((set, get) => ({
  // Estado de autenticación
  user: null,
  session: null,
  isLoading: true,

  // Estado de la UI
  isDarkMode: localStorage.getItem('isDarkMode') === 'true',
  sidebarOpen: true,

  // Configuración del club
  clubConfig: JSON.parse(localStorage.getItem('clubConfig') || '{}'),

  // Acciones de autenticación
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),

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

  // Inicialización
  initialize: async () => {
    try {
      const { session, error } = await auth.getSession()
      if (error) throw error

      set({
        session,
        user: session?.user ?? null,
        isLoading: false
      })

      // Suscribirse a cambios de autenticación
      auth.onAuthStateChange((event, session) => {
        set({
          session,
          user: session?.user ?? null
        })
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
      set({ isLoading: false })
    }
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
      set({ user: null, session: null })
      if (typeof onLoggedOut === 'function') onLoggedOut()
    }
  }
}))
