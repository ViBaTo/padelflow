import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

// ID de organización constante para La Pala
const ORGANIZACION_ID = '495f2b65-1b9f-4fdb-bcdf-07374101aa61'

// Función helper para establecer contexto de organización (no necesaria con RLS deshabilitado)
// const setOrgContext = async () => {
//   try {
//     await supabase.rpc('set_current_org', { org_id: ORGANIZACION_ID })
//   } catch (error) {
//     console.warn('No se pudo establecer contexto de organización:', error)
//   }
// }

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
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  addAlumno: async (alumno) => {
    const alumnoConOrganizacion = {
      ...alumno,
      id_organizacion: ORGANIZACION_ID
    }
    const { data, error } = await supabase
      .from('alumnos')
      .insert([alumnoConOrganizacion])
    return { data, error }
  },

  deleteAlumno: async (cedula) => {
    const { data, error } = await supabase
      .from('alumnos')
      .delete()
      .eq('cedula', cedula)
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  updateAlumno: async (cedula, updates) => {
    const { data, error } = await supabase
      .from('alumnos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('cedula', cedula)
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  updateAlumnoEstado: async (cedula, nuevoEstado) => {
    const { data, error } = await supabase
      .from('alumnos')
      .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
      .eq('cedula', cedula)
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  // Profesores
  getProfesores: async () => {
    const { data, error } = await supabase
      .from('profesores')
      .select('*')
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  addProfesor: async (profesor) => {
    const profesorConOrganizacion = {
      ...profesor,
      id_organizacion: ORGANIZACION_ID
    }
    const { data, error } = await supabase
      .from('profesores')
      .insert([profesorConOrganizacion])
    return { data, error }
  },

  updateProfesor: async (id_profesor, updates) => {
    const { data, error } = await supabase
      .from('profesores')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id_profesor', id_profesor)
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  deleteProfesor: async (id_profesor) => {
    const { data, error } = await supabase
      .from('profesores')
      .delete()
      .eq('id_profesor', id_profesor)
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  // Paquetes
  getPaquetes: async () => {
    const { data, error } = await supabase
      .from('paquetes')
      .select('*')
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  addPaquete: async (paquete) => {
    const paqueteConOrganizacion = {
      ...paquete,
      id_organizacion: ORGANIZACION_ID
    }
    const { data, error } = await supabase
      .from('paquetes')
      .insert([paqueteConOrganizacion])
    return { data, error }
  },

  deletePaquete: async (codigo) => {
    const { data, error } = await supabase
      .from('paquetes')
      .delete()
      .eq('codigo', codigo)
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  updatePaquete: async (codigo, updates) => {
    const { data, error } = await supabase
      .from('paquetes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('codigo', codigo)
      .eq('id_organizacion', ORGANIZACION_ID)
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
    const { data, error } = await supabase
      .from('categorias')
      .select('*')
      .eq('id_organizacion', ORGANIZACION_ID)
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
    const inscripcionConOrganizacion = {
      ...inscripcion,
      id_organizacion: ORGANIZACION_ID
    }
    const { data, error } = await supabase
      .from('inscripciones')
      .insert([inscripcionConOrganizacion])
    return { data, error }
  },

  getInscripciones: async () => {
    const { data, error } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  getInscripcionesActivas: async () => {
    const { data, error } = await supabase
      .from('inscripciones')
      .select('*')
      .eq('estado', 'ACTIVO')
      .eq('id_organizacion', ORGANIZACION_ID)
      .order('fecha_fin', { ascending: true })
    return { data, error }
  },

  updateInscripcion: async (id, updates) => {
    const { data, error } = await supabase
      .from('inscripciones')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id_inscripcion', id)
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  deleteInscripcion: async (id_inscripcion) => {
    const { data, error } = await supabase
      .from('inscripciones')
      .delete()
      .eq('id_inscripcion', id_inscripcion)
      .eq('id_organizacion', ORGANIZACION_ID)
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
    const { data, error } = await supabase
      .from('asistencias')
      .select(
        `
        *,
        profesores:id_profesor (nombre_completo),
        alumnos:cedula_alumno (nombre_completo)
      `
      )
      .eq('id_organizacion', ORGANIZACION_ID)
      .order('fecha_clase', { ascending: true })
    return { data, error }
  },

  addAsistencia: async (asistencia) => {
    const asistenciaConOrganizacion = {
      ...asistencia,
      id_organizacion: ORGANIZACION_ID
    }
    const { data, error } = await supabase
      .from('asistencias')
      .insert([asistenciaConOrganizacion])
      .select()
    return { data, error }
  },

  updateAsistencia: async (id_asistencia, updates) => {
    const { data, error } = await supabase
      .from('asistencias')
      .update(updates)
      .eq('id_asistencia', id_asistencia)
      .eq('id_organizacion', ORGANIZACION_ID)
      .select()
    return { data, error }
  },

  deleteAsistencia: async (id_asistencia) => {
    const { data, error } = await supabase
      .from('asistencias')
      .delete()
      .eq('id_asistencia', id_asistencia)
      .eq('id_organizacion', ORGANIZACION_ID)
    return { data, error }
  },

  // Obtener asistencias por fecha
  getAsistenciasPorFecha: async (fechaInicio, fechaFin) => {
    const { data, error } = await supabase
      .from('asistencias')
      .select(
        `
        *,
        profesores:id_profesor (nombre_completo),
        alumnos:cedula_alumno (nombre_completo)
      `
      )
      .eq('id_organizacion', ORGANIZACION_ID)
      .gte('fecha_clase', fechaInicio)
      .lte('fecha_clase', fechaFin)
      .order('fecha_clase', { ascending: true })
    return { data, error }
  },

  // Mover asistencia a otra fecha (usado para drag and drop)
  moverAsistencia: async (id_asistencia, nuevaFecha) => {
    const { data, error } = await supabase
      .from('asistencias')
      .update({ fecha_clase: nuevaFecha })
      .eq('id_asistencia', id_asistencia)
      .eq('id_organizacion', ORGANIZACION_ID)
      .select()
    return { data, error }
  }
}
