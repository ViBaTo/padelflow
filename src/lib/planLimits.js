import { supabase } from './supabase'

/**
 * Obtiene el plan de una organización
 */
export const getOrganizationPlan = async (organizationId) => {
  const { data, error } = await supabase
    .from('organizaciones')
    .select(
      `
      id_plan,
      planes:id_plan (
        id_plan,
        nombre,
        descripcion,
        precio_mensual,
        precio_anual,
        limite_alumnos,
        limite_profesores,
        limite_canchas,
        limite_almacenamiento,
        soporte_prioritario,
        reportes_avanzados,
        api_acceso,
        integraciones_externas
      )
    `
    )
    .eq('id_organizacion', organizationId)
    .single()

  if (error) throw error
  return data.planes
}

/**
 * Obtiene el uso actual de recursos de una organización
 */
export const getOrganizationUsage = async (organizationId) => {
  const [alumnos, profesores, canchas] = await Promise.all([
    supabase
      .from('usuarios')
      .select('id', { count: 'exact' })
      .eq('id_organizacion', organizationId)
      .eq('rol', 'ALUMNO'),
    supabase
      .from('usuarios')
      .select('id', { count: 'exact' })
      .eq('id_organizacion', organizationId)
      .eq('rol', 'PROFESOR'),
    supabase
      .from('canchas')
      .select('id', { count: 'exact' })
      .eq('id_organizacion', organizationId)
  ])

  return {
    alumnos: alumnos.count || 0,
    profesores: profesores.count || 0,
    canchas: canchas.count || 0
  }
}

/**
 * Verifica si se puede agregar un recurso sin exceder los límites
 */
export const canAddResource = async (
  organizationId,
  resourceType,
  quantity = 1
) => {
  const [plan, usage] = await Promise.all([
    getOrganizationPlan(organizationId),
    getOrganizationUsage(organizationId)
  ])

  const limits = {
    alumnos: plan.limite_alumnos,
    profesores: plan.limite_profesores,
    canchas: plan.limite_canchas
  }

  const current = usage[resourceType]
  const limit = limits[resourceType]

  if (current + quantity > limit) {
    return {
      canAdd: false,
      current,
      limit,
      exceeded: current + quantity - limit,
      message: `No puedes agregar ${quantity} ${resourceType}. Límite del plan ${plan.nombre}: ${limit}. Actual: ${current}.`
    }
  }

  return {
    canAdd: true,
    current,
    limit,
    remaining: limit - current - quantity
  }
}

/**
 * Obtiene información completa del plan y uso
 */
export const getPlanAndUsage = async (organizationId) => {
  const [plan, usage] = await Promise.all([
    getOrganizationPlan(organizationId),
    getOrganizationUsage(organizationId)
  ])

  const limits = {
    alumnos: { current: usage.alumnos, max: plan.limite_alumnos },
    profesores: { current: usage.profesores, max: plan.limite_profesores },
    canchas: { current: usage.canchas, max: plan.limite_canchas }
  }

  // Calcular porcentajes de uso
  const percentages = Object.keys(limits).reduce((acc, key) => {
    const { current, max } = limits[key]
    acc[key] = max > 0 ? Math.round((current / max) * 100) : 0
    return acc
  }, {})

  return {
    plan,
    usage,
    limits,
    percentages
  }
}

/**
 * Valida si una organización puede crear un nuevo recurso
 * Lanza un error si no es posible
 */
export const validateResourceCreation = async (
  organizationId,
  resourceType,
  quantity = 1
) => {
  const validation = await canAddResource(
    organizationId,
    resourceType,
    quantity
  )

  if (!validation.canAdd) {
    throw new Error(validation.message)
  }

  return validation
}

/**
 * Obtiene todos los planes disponibles
 */
export const getAvailablePlans = async () => {
  const { data, error } = await supabase
    .from('planes')
    .select('*')
    .eq('estado', 'ACTIVO')
    .order('precio_mensual', { ascending: true })

  if (error) throw error
  return data
}

/**
 * Actualiza el plan de una organización
 */
export const updateOrganizationPlan = async (organizationId, newPlanId) => {
  const { data, error } = await supabase
    .from('organizaciones')
    .update({ id_plan: newPlanId })
    .eq('id_organizacion', organizationId)

  if (error) throw error
  return data
}
