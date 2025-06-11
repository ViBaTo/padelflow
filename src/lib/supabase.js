import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

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
    const { data, error } = await supabase.from('alumnos').select('*')
    return { data, error }
  },

  addAlumno: async (alumno) => {
    const { data, error } = await supabase.from('alumnos').insert([alumno])
    return { data, error }
  },

  deleteAlumno: async (cedula) => {
    const { data, error } = await supabase
      .from('alumnos')
      .delete()
      .eq('cedula', cedula)
    return { data, error }
  },

  updateAlumnoEstado: async (cedula, nuevoEstado) => {
    const { data, error } = await supabase
      .from('alumnos')
      .update({ estado: nuevoEstado })
      .eq('cedula', cedula)
    return { data, error }
  },

  // Profesores
  getProfesores: async () => {
    const { data, error } = await supabase.from('profesores').select('*')
    return { data, error }
  },

  addProfesor: async (profesor) => {
    const { data, error } = await supabase.from('profesores').insert([profesor])
    return { data, error }
  },

  deleteProfesor: async (id_profesor) => {
    const { data, error } = await supabase
      .from('profesores')
      .delete()
      .eq('id_profesor', id_profesor)
    return { data, error }
  },

  // Paquetes
  getPaquetes: async () => {
    const { data, error } = await supabase.from('paquetes').select('*')
    return { data, error }
  },

  addPaquete: async (paquete) => {
    const { data, error } = await supabase.from('paquetes').insert([paquete])
    return { data, error }
  },

  deletePaquete: async (codigo) => {
    const { data, error } = await supabase
      .from('paquetes')
      .delete()
      .eq('codigo', codigo)
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
    const { data, error } = await supabase.from('categorias').select('*')
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
    const { data, error } = await supabase
      .from('inscripciones')
      .insert([inscripcion])
    return { data, error }
  },

  getInscripciones: async () => {
    const { data, error } = await supabase.from('inscripciones').select('*')
    return { data, error }
  },

  updateInscripcion: async (id, updates) => {
    const { data, error } = await supabase
      .from('inscripciones')
      .update(updates)
      .eq('id_inscripcion', id)
    return { data, error }
  }
}
