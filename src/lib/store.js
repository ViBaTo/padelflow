import { create } from 'zustand'
import { auth } from './supabase'

export const useStore = create((set) => ({
  // Estado de autenticación
  user: null,
  session: null,
  isLoading: true,

  // Estado de la UI
  isDarkMode: false,
  sidebarOpen: true,

  // Acciones de autenticación
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),

  // Acciones de UI
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

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
