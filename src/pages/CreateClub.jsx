import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useStore } from '../lib/store'
import { supabase, ensureUserInDatabase } from '../lib/supabase'
import { Building2, Plus, X, Check, ArrowLeft } from 'lucide-react'
import logoverdepadel from '../assets/logos/logoverdepadel.png'

export function CreateClub() {
  const navigate = useNavigate()
  const { user, setUser } = useStore()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Información del club, 2: Configurar pistas
  const [clubData, setClubData] = useState(null)
  const [courts, setCourts] = useState([
    { nombre: '', tipo_superficie: 'cristal', techada: true, iluminacion: true }
  ])

  // Obtener datos del usuario pendientes del registro
  const [pendingUserData] = useState(() => {
    const data = localStorage.getItem('pendingUserData')
    return data ? JSON.parse(data) : null
  })

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  // Función para generar código de club único (máximo 20 caracteres)
  const generateClubCode = (clubName) => {
    let code = clubName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    // Limitar a 20 caracteres
    if (code.length > 20) {
      // Tomar las primeras palabras hasta que quepan en 20 caracteres
      const words = clubName.toLowerCase().split(/\s+/)
      const abbreviations = words.map((word) => {
        // Tomar primeras 3 letras de cada palabra
        return word.replace(/[^a-z0-9]/g, '').substring(0, 3)
      })

      code = abbreviations.join('')

      // Si sigue siendo muy largo, tomar solo las primeras 20 caracteres
      if (code.length > 20) {
        code = code.substring(0, 20)
      }
    }

    return code
  }

  // Función para crear una nueva organización
  const createOrganization = async (formData) => {
    const clubCode = generateClubCode(formData.nombre_club)

    const organizationData = {
      nombre: formData.nombre_club,
      codigo_club: clubCode,
      subdomain: clubCode,
      pais: 'EC', // Por defecto Ecuador
      zona_horaria: 'America/Guayaquil',
      moneda: 'USD',
      estado: 'ACTIVO',
      id_plan: 1, // Plan BASICO por defecto
      // Campos de ubicación
      direccion: formData.direccion || null,
      ciudad: formData.ciudad || null,
      codigo_postal: formData.codigo_postal || null,
      provincia: formData.provincia || null,
      // Campos de contacto
      telefono: formData.telefono || null,
      email: formData.email || null,
      sitio_web: formData.sitio_web || null
    }

    console.log(
      '📋 Datos de organización a insertar (VERSIÓN ACTUALIZADA):',
      organizationData
    )

    // Verificar que no hay campos obsoletos
    console.log('🔍 Verificando campos enviados:')
    Object.keys(organizationData).forEach((key) => {
      console.log(
        `  - ${key}: ${organizationData[key]} (${typeof organizationData[key]})`
      )
    })

    // Verificar límites de caracteres
    console.log('📏 Verificando límites de caracteres:')
    console.log(`- nombre: ${organizationData.nombre.length}/255 chars`)
    console.log(
      `- codigo_club: ${organizationData.codigo_club.length}/20 chars`
    )
    console.log(`- subdomain: ${organizationData.subdomain.length}/50 chars`)
    console.log(`- estado: ${organizationData.estado.length}/20 chars`)
    console.log(`- id_plan: ${organizationData.id_plan} (número)`)

    console.log('🔄 Ejecutando inserción en base de datos...')

    // Verificar autenticación
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession()
    console.log('🔐 Estado de la sesión:', {
      isAuthenticated: !!sessionData.session,
      userId: sessionData.session?.user?.id,
      error: sessionError
    })

    // Verificar si ya existe un club con el mismo código
    console.log(
      '🔍 Verificando si existe club con código:',
      organizationData.codigo_club
    )
    const { data: existingClub, error: checkError } = await supabase
      .from('organizaciones')
      .select('codigo_club')
      .eq('codigo_club', organizationData.codigo_club)
      .limit(1)

    console.log('📋 Resultado de verificación:', { existingClub, checkError })

    if (existingClub && existingClub.length > 0) {
      console.log('⚠️ Ya existe un club con ese código, generando uno nuevo...')
      organizationData.codigo_club =
        organizationData.codigo_club + Math.floor(Math.random() * 1000)
      organizationData.subdomain = organizationData.codigo_club
      console.log('🔄 Nuevo código generado:', organizationData.codigo_club)
    }

    const { data, error } = await supabase
      .from('organizaciones')
      .insert([organizationData])
      .select()
      .single()

    console.log('📊 Resultado de la inserción:')
    console.log('- Data:', data)
    console.log('- Error:', error)

    if (error) {
      console.error('❌ Error creando organización:', error)
      console.error('❌ Detalles del error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      throw new Error(`Error al crear organización: ${error.message}`)
    }

    console.log('✅ Organización creada exitosamente:', data)
    return data
  }

  // Función para obtener plan por ID
  const getPlanById = async (planId) => {
    const { data, error } = await supabase
      .from('planes')
      .select('*')
      .eq('id_plan', planId)
      .single()

    if (error) throw error
    return data
  }

  // Función para verificar límites del plan
  const checkPlanLimits = async (organizationId, planId) => {
    const plan = await getPlanById(planId)

    // Obtener conteos actuales
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
      plan,
      limits: {
        alumnos: { current: alumnos.count || 0, max: plan.limite_alumnos },
        profesores: {
          current: profesores.count || 0,
          max: plan.limite_profesores
        },
        canchas: { current: canchas.count || 0, max: plan.limite_canchas }
      }
    }
  }

  // Función para crear pistas
  const createCourts = async (organizationId, courtsData) => {
    // Filtrar solo las pistas que tienen nombre
    const validCourts = courtsData.filter((court) => court.nombre.trim() !== '')

    if (validCourts.length === 0) {
      return // No hay pistas que crear
    }

    // Verificar límites del plan antes de crear pistas
    const orgData = await supabase
      .from('organizaciones')
      .select('id_plan')
      .eq('id_organizacion', organizationId)
      .single()
    const planLimits = await checkPlanLimits(
      organizationId,
      orgData.data.id_plan
    )

    if (
      planLimits.limits.canchas.current + validCourts.length >
      planLimits.limits.canchas.max
    ) {
      throw new Error(
        `No puedes crear más de ${planLimits.limits.canchas.max} canchas con tu plan ${planLimits.plan.nombre}`
      )
    }

    const pistasData = validCourts.map((pista, index) => ({
      id_organizacion: organizationId,
      nombre: pista.nombre.trim(),
      tipo_superficie: pista.tipo_superficie,
      techada: pista.techada,
      iluminacion: pista.iluminacion,
      estado: 'DISPONIBLE',
      capacidad_maxima: 4,
      codigo: `P${index + 1}`
    }))

    const { error } = await supabase.from('canchas').insert(pistasData)

    if (error) throw error

    return pistasData
  }

  // Función para crear el usuario en la base de datos
  const createUserInDatabase = async (organizationId) => {
    if (!pendingUserData) {
      throw new Error('No hay datos de usuario pendientes')
    }

    console.log('📝 Creando usuario en base de datos...')
    console.log('📋 Datos a usar:', {
      auth_user_id: user.id,
      nombre_completo: pendingUserData.nombre_completo,
      telefono: pendingUserData.telefono,
      rol: 'ADMINISTRADOR',
      id_organizacion: organizationId
    })

    const { data: dbUser, error } = await ensureUserInDatabase(user, {
      nombre_completo: pendingUserData.nombre_completo,
      telefono: pendingUserData.telefono,
      rol: 'ADMINISTRADOR',
      id_organizacion: organizationId
    })

    if (error) {
      console.error('❌ Error creando usuario en base de datos:', error)
      throw error
    }

    console.log('✅ Usuario creado en base de datos:', dbUser)
    return dbUser
  }

  // Función para actualizar el usuario con la organización (legacy - ya no se usa)
  const updateUserOrganization = async (organizationId) => {
    const { error } = await supabase
      .from('usuarios')
      .update({
        id_organizacion: organizationId,
        updated_at: new Date().toISOString()
      })
      .eq('auth_user_id', user.id)

    if (error) throw error
  }

  // Paso 1: Crear el club
  const onSubmitClub = async (data) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('🏢 Creando organización...')
      // Crear la organización
      const newOrganization = await createOrganization(data)

      console.log('👤 Creando usuario en base de datos...')
      // Crear el usuario en la base de datos con la organización
      await createUserInDatabase(newOrganization.id_organizacion)

      console.log('🧹 Limpiando datos temporales...')
      // Limpiar datos temporales del localStorage
      localStorage.removeItem('pendingUserData')

      // Guardar datos del club para el siguiente paso
      setClubData({
        ...data,
        organizationId: newOrganization.id_organizacion
      })

      console.log('✅ Club y usuario creados exitosamente')
      // Ir al paso 2 (configurar pistas)
      setStep(2)
    } catch (err) {
      console.error('💥 Error:', err)
      setError(err.message || 'Error al crear el club')
    } finally {
      setIsLoading(false)
    }
  }

  // Paso 2: Configurar pistas y finalizar
  const onSubmitCourts = async (skipCourts = false) => {
    setIsLoading(true)
    setError(null)

    try {
      // Crear pistas si no se saltó el paso
      if (!skipCourts) {
        console.log('🏟️ Creando pistas...')
        await createCourts(clubData.organizationId, courts)
        console.log('✅ Pistas creadas exitosamente')
      } else {
        console.log('⏭️ Saltando configuración de pistas')
      }

      console.log('🎉 Configuración completa, redirigiendo al dashboard...')
      // Redirigir al dashboard
      navigate('/')
    } catch (err) {
      console.error('💥 Error:', err)
      setError(err.message || 'Error al configurar el club')
    } finally {
      setIsLoading(false)
    }
  }

  // Funciones para manejar pistas
  const addCourt = () => {
    setCourts([
      ...courts,
      {
        nombre: '',
        tipo_superficie: 'cristal',
        techada: true,
        iluminacion: true
      }
    ])
  }

  const removeCourt = (index) => {
    setCourts(courts.filter((_, i) => i !== index))
  }

  const updateCourt = (index, field, value) => {
    const newCourts = [...courts]
    newCourts[index][field] = value
    setCourts(newCourts)
  }

  // Verificar si el usuario está autenticado
  if (!user) {
    navigate('/login')
    return null
  }

  // Verificar si hay datos pendientes del usuario del registro
  if (!pendingUserData) {
    console.warn(
      '⚠️ No hay datos de usuario pendientes, redirigiendo al registro'
    )
    navigate('/register')
    return null
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900'>
      <div className='min-h-screen grid lg:grid-cols-2'>
        {/* Left Column - Branding */}
        <div className='hidden lg:flex lg:items-center lg:justify-center lg:px-12'>
          <div className='max-w-md text-center'>
            <div className='flex items-center justify-center mb-8'>
              <div className='bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-2xl'>
                <img
                  src={logoverdepadel}
                  alt='Padel Flow'
                  className='w-16 h-16 rounded-2xl'
                />
              </div>
            </div>
            <h1 className='text-5xl font-bold text-gray-900 dark:text-white mb-6'>
              {step === 1 ? 'Crear tu club' : 'Configurar pistas'}
            </h1>
            <p className='text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed'>
              {step === 1
                ? 'Configura la información básica y ubicación de tu club de pádel'
                : 'Agrega las pistas de tu club para comenzar a gestionar reservas'}
            </p>
            <div className='space-y-4 text-left'>
              <div className='flex items-center space-x-3'>
                <div
                  className={`p-2 rounded-full ${
                    step >= 1
                      ? 'bg-green-100 dark:bg-green-900'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Building2
                    className={`w-5 h-5 ${
                      step >= 1
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                    }`}
                  />
                </div>
                <span
                  className={`${
                    step >= 1
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-gray-500'
                  }`}
                >
                  Información y ubicación
                </span>
              </div>
              <div className='flex items-center space-x-3'>
                <div
                  className={`p-2 rounded-full ${
                    step >= 2
                      ? 'bg-green-100 dark:bg-green-900'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <Plus
                    className={`w-5 h-5 ${
                      step >= 2
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                    }`}
                  />
                </div>
                <span
                  className={`${
                    step >= 2
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-gray-500'
                  }`}
                >
                  Configurar pistas
                </span>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='bg-gray-100 dark:bg-gray-700 p-2 rounded-full'>
                  <Check className='w-5 h-5 text-gray-400' />
                </div>
                <span className='text-gray-500'>¡Listo para gestionar!</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className='flex items-center justify-center p-4 lg:p-8'>
          <div className='w-full max-w-md'>
            {/* Mobile Header */}
            <div className='lg:hidden text-center mb-8'>
              <div className='flex items-center justify-center mb-4'>
                <div className='bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-lg'>
                  <img
                    src={logoverdepadel}
                    alt='Padel Flow'
                    className='w-14 h-14 rounded-xl'
                  />
                </div>
              </div>
              <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                {step === 1 ? 'Crear tu club' : 'Configurar pistas'}
              </h1>
              <p className='text-gray-600 dark:text-gray-400'>
                {step === 1
                  ? 'Información y ubicación del club'
                  : 'Agrega las pistas del club'}
              </p>
            </div>

            {/* Main Card */}
            <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden'>
              {/* Header */}
              <div className='bg-gradient-to-r from-blue-500 to-indigo-600 p-4'>
                <div className='flex items-center justify-between text-white'>
                  <div className='flex items-center space-x-2'>
                    {step === 2 && (
                      <button
                        type='button'
                        onClick={() => setStep(1)}
                        className='p-1 hover:bg-white/20 rounded-full transition-colors'
                      >
                        <ArrowLeft size={20} />
                      </button>
                    )}
                    <h2 className='text-xl font-semibold'>
                      {step === 1
                        ? 'Información y ubicación'
                        : 'Configurar pistas'}
                    </h2>
                  </div>
                  <div className='flex space-x-1'>
                    <div
                      className={`w-2 h-2 rounded-full ${
                        step === 1 ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                    <div
                      className={`w-2 h-2 rounded-full ${
                        step === 2 ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className='p-6'>
                {error && (
                  <div className='mb-4 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-center space-x-3'>
                    <X className='w-5 h-5 text-red-500 flex-shrink-0' />
                    <span className='text-red-700 dark:text-red-300 text-sm'>
                      {error}
                    </span>
                  </div>
                )}

                {step === 1 && (
                  <form
                    onSubmit={handleSubmit(onSubmitClub)}
                    className='space-y-6'
                  >
                    <div>
                      <label
                        htmlFor='nombre_club'
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                      >
                        Nombre del club
                      </label>
                      <input
                        type='text'
                        id='nombre_club'
                        className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                        placeholder='Mi Club de Pádel'
                        required
                        {...register('nombre_club', {
                          required: 'El nombre del club es requerido'
                        })}
                      />
                      {errors.nombre_club && (
                        <p className='mt-1 text-sm text-red-500'>
                          {errors.nombre_club.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor='descripcion'
                        className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                      >
                        Descripción (opcional)
                      </label>
                      <textarea
                        id='descripcion'
                        rows={3}
                        className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                        placeholder='Describe tu club de pádel...'
                        {...register('descripcion')}
                      />
                    </div>

                    {/* Información de ubicación */}
                    <div className='border-t border-gray-200 dark:border-gray-600 pt-6'>
                      <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                        Ubicación del club
                      </h3>

                      <div className='space-y-4'>
                        <div>
                          <label
                            htmlFor='direccion'
                            className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                          >
                            Dirección
                          </label>
                          <input
                            type='text'
                            id='direccion'
                            className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                            placeholder='Av. Los Pinos 123'
                            {...register('direccion')}
                          />
                        </div>

                        <div className='grid grid-cols-2 gap-4'>
                          <div>
                            <label
                              htmlFor='ciudad'
                              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                            >
                              Ciudad
                            </label>
                            <input
                              type='text'
                              id='ciudad'
                              className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                              placeholder='Quito'
                              {...register('ciudad')}
                            />
                          </div>

                          <div>
                            <label
                              htmlFor='codigo_postal'
                              className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                            >
                              Código Postal
                            </label>
                            <input
                              type='text'
                              id='codigo_postal'
                              className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                              placeholder='170101'
                              {...register('codigo_postal')}
                            />
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor='provincia'
                            className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                          >
                            Provincia
                          </label>
                          <input
                            type='text'
                            id='provincia'
                            className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                            placeholder='Pichincha'
                            {...register('provincia')}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Información de contacto */}
                    <div className='border-t border-gray-200 dark:border-gray-600 pt-6'>
                      <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                        Información de contacto
                      </h3>

                      <div className='space-y-4'>
                        <div>
                          <label
                            htmlFor='telefono'
                            className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                          >
                            Teléfono
                          </label>
                          <input
                            type='tel'
                            id='telefono'
                            className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                            placeholder='+593 99 123 4567'
                            {...register('telefono')}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor='email'
                            className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                          >
                            Email del club
                          </label>
                          <input
                            type='email'
                            id='email'
                            className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                            placeholder='info@miclubpadel.com'
                            {...register('email')}
                          />
                        </div>

                        <div>
                          <label
                            htmlFor='sitio_web'
                            className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                          >
                            Sitio web (opcional)
                          </label>
                          <input
                            type='url'
                            id='sitio_web'
                            className='w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors'
                            placeholder='https://www.miclubpadel.com'
                            {...register('sitio_web')}
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type='submit'
                      disabled={isLoading}
                      className='w-full text-white font-medium py-4 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed'
                      style={{
                        background: isLoading
                          ? 'linear-gradient(to right, #9ca3af, #6b7280)'
                          : 'linear-gradient(to right, #3b82f6, #4f46e5)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.target.style.background =
                            'linear-gradient(to right, #2563eb, #3730a3)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.target.style.background =
                            'linear-gradient(to right, #3b82f6, #4f46e5)'
                        }
                      }}
                    >
                      {isLoading ? (
                        <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                      ) : (
                        <>
                          <Building2 size={20} />
                          <span>Crear club</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {step === 2 && (
                  <div className='space-y-6'>
                    <div>
                      <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-lg font-medium text-gray-900 dark:text-white'>
                          Pistas del club
                        </h3>
                        <button
                          type='button'
                          onClick={addCourt}
                          className='flex items-center space-x-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors'
                        >
                          <Plus size={16} />
                          <span>Agregar pista</span>
                        </button>
                      </div>

                      <div className='space-y-4'>
                        {courts.map((court, index) => (
                          <div
                            key={index}
                            className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600'
                          >
                            <div className='flex items-center justify-between mb-3'>
                              <h4 className='text-sm font-medium text-gray-900 dark:text-white'>
                                Pista {index + 1}
                              </h4>
                              {courts.length > 1 && (
                                <button
                                  type='button'
                                  onClick={() => removeCourt(index)}
                                  className='text-red-600 hover:text-red-700 dark:text-red-400 transition-colors'
                                >
                                  <X size={16} />
                                </button>
                              )}
                            </div>

                            <div className='grid grid-cols-2 gap-3 mb-3'>
                              <input
                                type='text'
                                placeholder='Nombre de la pista'
                                value={court.nombre}
                                onChange={(e) =>
                                  updateCourt(index, 'nombre', e.target.value)
                                }
                                className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                              />

                              <select
                                value={court.tipo_superficie}
                                onChange={(e) =>
                                  updateCourt(
                                    index,
                                    'tipo_superficie',
                                    e.target.value
                                  )
                                }
                                className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                              >
                                <option value='cristal'>Cristal</option>
                                <option value='cesped'>Césped</option>
                                <option value='cemento'>Cemento</option>
                              </select>
                            </div>

                            <div className='flex space-x-4'>
                              <label className='flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer'>
                                <input
                                  type='checkbox'
                                  checked={court.techada}
                                  onChange={(e) =>
                                    updateCourt(
                                      index,
                                      'techada',
                                      e.target.checked
                                    )
                                  }
                                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                />
                                <span>Techada</span>
                              </label>
                              <label className='flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer'>
                                <input
                                  type='checkbox'
                                  checked={court.iluminacion}
                                  onChange={(e) =>
                                    updateCourt(
                                      index,
                                      'iluminacion',
                                      e.target.checked
                                    )
                                  }
                                  className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                                />
                                <span>Iluminación</span>
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className='flex space-x-3'>
                      <button
                        type='button'
                        onClick={() => onSubmitCourts(true)}
                        disabled={isLoading}
                        className='flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed'
                      >
                        Configurar más tarde
                      </button>
                      <button
                        type='button'
                        onClick={() => onSubmitCourts(false)}
                        disabled={isLoading}
                        className='flex-1 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed'
                        style={{
                          background: isLoading
                            ? 'linear-gradient(to right, #9ca3af, #6b7280)'
                            : 'linear-gradient(to right, #3b82f6, #4f46e5)'
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoading) {
                            e.target.style.background =
                              'linear-gradient(to right, #2563eb, #3730a3)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLoading) {
                            e.target.style.background =
                              'linear-gradient(to right, #3b82f6, #4f46e5)'
                          }
                        }}
                      >
                        {isLoading ? (
                          <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                        ) : (
                          <>
                            <Check size={20} />
                            <span>Finalizar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
