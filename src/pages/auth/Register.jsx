import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useStore } from '../../lib/store'
import { supabase, auth, ensureUserInDatabase } from '../../lib/supabase'
import {
  designTokens,
  componentClasses,
  getButtonGradient,
  getButtonHoverGradient
} from '../../lib/designTokens'
import {
  Building2,
  Users,
  ArrowLeft,
  Plus,
  X,
  Check,
  Search,
  ChevronDown,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import logo from '../../assets/images/logo.png'
import logoverdepadel from '../../assets/logos/logoverdepadel.png'

// Lista de países con códigos
const COUNTRIES = [
  { code: '+1', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: '+1', name: 'Canadá', flag: '🇨🇦' },
  { code: '+52', name: 'México', flag: '🇲🇽' },
  { code: '+34', name: 'España', flag: '🇪🇸' },
  { code: '+33', name: 'Francia', flag: '🇫🇷' },
  { code: '+49', name: 'Alemania', flag: '🇩🇪' },
  { code: '+39', name: 'Italia', flag: '🇮🇹' },
  { code: '+44', name: 'Reino Unido', flag: '🇬🇧' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+51', name: 'Perú', flag: '🇵🇪' },
  { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+55', name: 'Brasil', flag: '🇧🇷' },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: '+593', name: 'Ecuador', flag: '🇪🇨' },
  { code: '+595', name: 'Paraguay', flag: '🇵🇾' },
  { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+81', name: 'Japón', flag: '🇯🇵' },
  { code: '+82', name: 'Corea del Sur', flag: '🇰🇷' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+7', name: 'Rusia', flag: '🇷🇺' }
]

// Componente selector de país con búsqueda
function CountrySelector({ value, onChange, error }) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === value) || COUNTRIES[0]
  )

  const filteredCountries = COUNTRIES.filter(
    (country) =>
      country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      country.code.includes(searchTerm)
  )

  const handleSelect = (country) => {
    setSelectedCountry(country)
    onChange(country.code)
    setIsOpen(false)
    setSearchTerm('')
  }

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.country-selector')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Actualizar país seleccionado cuando cambia el valor
  useEffect(() => {
    const country = COUNTRIES.find((c) => c.code === value)
    if (country) {
      setSelectedCountry(country)
    }
  }, [value])

  return (
    <div className='relative country-selector'>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-2 py-3 border rounded-l-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors w-24 ${
          error
            ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
        }`}
      >
        <span className='text-lg'>{selectedCountry.flag}</span>
        <span className={designTokens.typography.caption + ' font-medium'}>
          {selectedCountry.code}
        </span>
        <ChevronDown className='w-4 h-4' />
      </button>

      {isOpen && (
        <div className='absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50'>
          <div className='p-3 border-b border-gray-200 dark:border-gray-600'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400' />
              <input
                type='text'
                placeholder='Buscar país...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={
                  componentClasses.input +
                  ' pl-10 ' +
                  designTokens.typography.caption
                }
              />
            </div>
          </div>
          <div className='max-h-48 overflow-y-auto'>
            {filteredCountries.map((country, index) => (
              <button
                key={index}
                type='button'
                onClick={() => handleSelect(country)}
                className='w-full flex items-center space-x-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors'
              >
                <span className='text-lg'>{country.flag}</span>
                <span
                  className={
                    designTokens.typography.caption +
                    ' font-medium ' +
                    designTokens.text.primary
                  }
                >
                  {country.code}
                </span>
                <span
                  className={
                    designTokens.typography.caption +
                    ' ' +
                    designTokens.text.secondary
                  }
                >
                  {country.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function Register() {
  const navigate = useNavigate()
  const { setUser, setSession } = useStore()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [countryCode, setCountryCode] = useState('+593') // Default Ecuador
  const [registrationOption, setRegistrationOption] = useState(null) // 'create_club' o 'join_club'
  const [clubCode, setClubCode] = useState('')
  const [foundClub, setFoundClub] = useState(null)
  const [searchingClub, setSearchingClub] = useState(false)
  const [clubNotFound, setClubNotFound] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm({
    mode: 'onChange' // Validación en tiempo real
  })

  const password = watch('password')
  const email = watch('email')
  const confirmEmail = watch('confirmEmail')
  const confirmPassword = watch('confirmPassword')

  // Validaciones en tiempo real
  const emailsMatch = email && confirmEmail && email === confirmEmail
  const passwordsMatch =
    password && confirmPassword && password === confirmPassword
  const emailsNotMatch = email && confirmEmail && email !== confirmEmail
  const passwordsNotMatch =
    password && confirmPassword && password !== confirmPassword

  // Función para buscar club por código
  const searchClubByCode = async (code) => {
    if (!code || code.length < 3) {
      setFoundClub(null)
      setClubNotFound(false)
      return
    }

    setSearchingClub(true)
    setClubNotFound(false)

    try {
      const { data: clubData, error } = await supabase
        .from('organizaciones')
        .select('id_organizacion, nombre, codigo_club')
        .eq('codigo_club', code)
        .single()

      if (error || !clubData) {
        setFoundClub(null)
        setClubNotFound(true)
      } else {
        setFoundClub(clubData)
        setClubNotFound(false)
      }
    } catch (err) {
      setFoundClub(null)
      setClubNotFound(true)
    } finally {
      setSearchingClub(false)
    }
  }

  // Función para manejar el cambio del código del club
  const handleClubCodeChange = (e) => {
    const code = e.target.value.toLowerCase()
    setClubCode(code)

    // Debounce la búsqueda para evitar muchas consultas
    if (window.clubSearchTimeout) {
      clearTimeout(window.clubSearchTimeout)
    }

    window.clubSearchTimeout = setTimeout(() => {
      searchClubByCode(code)
    }, 500) // Esperar 500ms después de que el usuario deje de escribir
  }

  // Función para limpiar estados del club
  const clearClubStates = () => {
    setClubCode('')
    setFoundClub(null)
    setSearchingClub(false)
    setClubNotFound(false)
    if (window.clubSearchTimeout) {
      clearTimeout(window.clubSearchTimeout)
    }
  }

  // Función para manejar el cambio de opción de registro
  const handleRegistrationOptionChange = (option) => {
    setRegistrationOption(option)
    clearClubStates()
  }

  // Función para volver a las opciones
  const handleBackToOptions = () => {
    setRegistrationOption(null)
    clearClubStates()
  }

  const onSubmit = async (data) => {
    setIsLoading(true)
    setError(null)
    try {
      console.log('🚀 Iniciando proceso de registro...')

      if (registrationOption === 'join_club') {
        // Verificar que tenemos un club válido
        if (!foundClub) {
          throw new Error(
            'El código del club no existe. Verifica el código e intenta nuevamente.'
          )
        }

        console.log('✅ Usando club encontrado:', foundClub)
      }

      // 1. Crear usuario en Supabase Auth
      console.log('👤 Creando usuario en Supabase Auth con email:', data.email)
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: data.email,
          password: data.password
        })

      if (signUpError) {
        console.error('❌ Error de Supabase Auth:', signUpError)
        // Mejorar el mensaje de error para el usuario
        if (
          signUpError.message.includes('invalid') &&
          signUpError.message.includes('email')
        ) {
          throw new Error(
            `El email "${data.email}" fue rechazado por el sistema. Esto puede deberse a configuraciones del servidor. Por favor contacta al administrador o intenta con otro email.`
          )
        }
        throw signUpError
      }

      const user = signUpData.user
      const session = signUpData.session
      console.log('✅ Usuario creado en Auth:', {
        userId: user?.id,
        email: user?.email,
        hasSession: !!session
      })

      if (!user) throw new Error('No se pudo crear el usuario.')

      if (registrationOption === 'join_club') {
        // 2. Crear usuario en la base de datos como profesor
        console.log('👨‍🏫 Creando usuario como profesor...')

        const { data: dbUser, error: userError } = await ensureUserInDatabase(
          user,
          {
            nombre_completo: data.nombre_completo,
            telefono: `${countryCode} ${data.telefono}`,
            rol: 'PROFESOR',
            id_organizacion: foundClub.id_organizacion
          }
        )

        if (userError) {
          console.error('❌ Error creando usuario:', userError)
          throw new Error(
            'Error al crear el usuario en la base de datos: ' +
              userError.message
          )
        }

        console.log('✅ Usuario creado como profesor exitosamente:', dbUser)
        console.log('🔄 Redirigiendo al dashboard...')
        navigate('/')
      } else {
        // 2. Guardar datos del formulario en localStorage para usar en crear-club
        console.log('💾 Guardando datos del formulario...')
        localStorage.setItem(
          'pendingUserData',
          JSON.stringify({
            nombre_completo: data.nombre_completo,
            telefono: `${countryCode} ${data.telefono}`,
            email: data.email
          })
        )
        console.log('✅ Datos guardados en localStorage')

        // 3. El store manejará automáticamente la sesión vía onAuthStateChange
        console.log('🎉 Usuario creado exitosamente')

        // 4. Redirigir a creación de club (crear usuario en DB se hará allí)
        console.log('🔄 Redirigiendo a /crear-club...')
        navigate('/crear-club')
      }

      console.log('✅ Navegación iniciada')
    } catch (err) {
      console.error('💥 Error durante el registro:', err)
      console.error('Stack trace:', err.stack)

      // Si el error es "User already registered", intentar limpiar y continuar
      if (
        err.message?.includes('User already registered') ||
        err.message?.includes('already been registered')
      ) {
        console.log(
          '⚠️ Usuario ya registrado, intentando continuar con flujo...'
        )

        try {
          // Obtener el usuario existente de Auth
          const { data: userData, error: userError } =
            await supabase.auth.getUser()

          if (userData?.user && registrationOption === 'create_club') {
            console.log(
              '👤 Usuario encontrado en Auth, continuando con creación de club...'
            )

            // Guardar datos para crear-club si no existen
            const existingData = localStorage.getItem('pendingUserData')
            if (!existingData) {
              localStorage.setItem(
                'pendingUserData',
                JSON.stringify({
                  nombre_completo: data.nombre_completo,
                  telefono: `${countryCode} ${data.telefono}`,
                  email: data.email
                })
              )
            }

            console.log('🔄 Redirigiendo a /crear-club...')
            navigate('/crear-club')
            return // Salir sin mostrar error
          }
        } catch (recoveryError) {
          console.error('❌ Error en recuperación:', recoveryError)
        }
      }

      setError(err.message || 'Error al registrar usuario')
    } finally {
      console.log('🔚 Finalizando proceso de registro (loading = false)')
      setIsLoading(false)
    }
  }

  return (
    <div
      className={
        componentClasses.pageContainer + ' min-h-screen overflow-y-auto'
      }
    >
      <div className={componentClasses.twoColumnGrid}>
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
            <h1 className={designTokens.typography.h1 + ' mb-6'}>Padel Flow</h1>
            <p
              className={
                designTokens.typography.lead +
                ' ' +
                designTokens.text.secondary +
                ' mb-8'
              }
            >
              La plataforma líder para la gestión profesional de clubes de pádel
            </p>
            <div className='space-y-4 text-left'>
              <div className='flex items-center space-x-3'>
                <div className='bg-blue-100 dark:bg-blue-900 p-2 rounded-full'>
                  <Building2 className='w-5 h-5 text-blue-600 dark:text-blue-400' />
                </div>
                <span className={designTokens.text.secondary}>
                  Gestión completa de instalaciones
                </span>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='bg-green-100 dark:bg-green-900 p-2 rounded-full'>
                  <Users className='w-5 h-5 text-green-600 dark:text-green-400' />
                </div>
                <span className={designTokens.text.secondary}>
                  Control de alumnos y profesores
                </span>
              </div>
              <div className='flex items-center space-x-3'>
                <div className='bg-purple-100 dark:bg-purple-900 p-2 rounded-full'>
                  <Check className='w-5 h-5 text-purple-600 dark:text-purple-400' />
                </div>
                <span className={designTokens.text.secondary}>
                  Reservas y pagos automatizados
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className='flex items-center justify-center p-4 lg:p-8'>
          <div className={componentClasses.maxWidthContainer}>
            {/* Mobile Header */}
            <div className='lg:hidden text-center mb-8'>
              <div className='flex items-center justify-center mb-4'>
                <div className='bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-lg'>
                  <img
                    src={logoverdepadel}
                    alt='Padel Flow'
                    className='w-12 h-12 rounded-xl'
                  />
                </div>
              </div>
              <h1 className={designTokens.typography.h2 + ' mb-2'}>
                Padel Flow
              </h1>
              <p className={designTokens.text.secondary}>
                Gestión profesional de clubes de pádel
              </p>
            </div>

            {/* Main Card */}
            <div className={componentClasses.mainCard}>
              {/* Header */}
              <div className={componentClasses.cardHeader}>
                <div className='text-center text-white'>
                  <h2 className={componentClasses.cardHeaderTitle}>
                    {registrationOption === 'create_club'
                      ? 'Crear nuevo club'
                      : registrationOption === 'join_club'
                      ? 'Unirse a club existente'
                      : 'Crear cuenta'}
                  </h2>
                  <p className={componentClasses.cardHeaderSubtitle}>
                    {registrationOption === 'create_club'
                      ? 'Completa la información para crear tu club'
                      : registrationOption === 'join_club'
                      ? 'Completa la información para unirte como profesor'
                      : 'Regístrate para gestionar tu club de pádel'}
                  </p>
                </div>
              </div>

              <div className={componentClasses.cardContent}>
                {error && (
                  <div className={componentClasses.errorMessage + ' mb-4'}>
                    <X className='w-5 h-5 text-red-500 flex-shrink-0' />
                    <span
                      className={
                        designTokens.text.error +
                        ' ' +
                        designTokens.typography.caption
                      }
                    >
                      {error}
                    </span>
                  </div>
                )}

                {!registrationOption && (
                  <div className='space-y-6'>
                    <div className='text-center mb-8'>
                      <h3
                        className={
                          designTokens.typography.h5 +
                          ' ' +
                          designTokens.text.primary +
                          ' mb-2'
                        }
                      >
                        ¿Cómo quieres comenzar?
                      </h3>
                      <p
                        className={
                          designTokens.text.secondary +
                          ' ' +
                          designTokens.typography.caption
                        }
                      >
                        Selecciona una opción para continuar
                      </p>
                    </div>

                    <div className='grid grid-cols-1 gap-4'>
                      {/* Opción: Crear nuevo club */}
                      <button
                        type='button'
                        onClick={() =>
                          handleRegistrationOptionChange('create_club')
                        }
                        className='group relative p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-2 border-blue-200 dark:border-blue-700 rounded-xl hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/50 dark:hover:to-indigo-900/50 transition-all duration-200 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600'
                      >
                        <div className='flex items-center space-x-4'>
                          <div className='bg-blue-500 p-3 rounded-lg group-hover:bg-blue-600 transition-colors'>
                            <Building2 className='w-6 h-6 text-white' />
                          </div>
                          <div className='text-left'>
                            <h4
                              className={
                                designTokens.typography.h6 +
                                ' ' +
                                designTokens.text.primary
                              }
                            >
                              Crear nuevo club
                            </h4>
                            <p
                              className={
                                designTokens.typography.caption +
                                ' ' +
                                designTokens.text.secondary
                              }
                            >
                              Soy dueño/administrador y quiero crear mi club de
                              pádel
                            </p>
                          </div>
                        </div>
                      </button>

                      {/* Opción: Unirse a club existente */}
                      <button
                        type='button'
                        onClick={() =>
                          handleRegistrationOptionChange('join_club')
                        }
                        className='group relative p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-200 dark:border-green-700 rounded-xl hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/50 dark:hover:to-emerald-900/50 transition-all duration-200 hover:shadow-lg hover:border-green-300 dark:hover:border-green-600'
                      >
                        <div className='flex items-center space-x-4'>
                          <div className='bg-green-500 p-3 rounded-lg group-hover:bg-green-600 transition-colors'>
                            <Users className='w-6 h-6 text-white' />
                          </div>
                          <div className='text-left'>
                            <h4
                              className={
                                designTokens.typography.h6 +
                                ' ' +
                                designTokens.text.primary
                              }
                            >
                              Unirse a un club
                            </h4>
                            <p
                              className={
                                designTokens.typography.caption +
                                ' ' +
                                designTokens.text.secondary
                              }
                            >
                              Soy profesor y quiero unirme a un club existente
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                {registrationOption && (
                  <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                    {/* Botón de volver */}
                    <button
                      type='button'
                      onClick={handleBackToOptions}
                      className='flex items-center space-x-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors'
                    >
                      <ArrowLeft size={16} />
                      <span className={designTokens.typography.caption}>
                        Volver a opciones
                      </span>
                    </button>

                    {/* Formulario de registro */}
                    <div className='space-y-6'>
                      {/* Campo de código de club (solo para join_club) */}
                      {registrationOption === 'join_club' && (
                        <div>
                          <label
                            htmlFor='club_code'
                            className={componentClasses.label}
                          >
                            Código del club
                          </label>
                          <div className='relative'>
                            <input
                              type='text'
                              id='club_code'
                              value={clubCode}
                              onChange={handleClubCodeChange}
                              className={`${
                                foundClub
                                  ? componentClasses.inputSuccess
                                  : clubNotFound && clubCode.length >= 3
                                  ? componentClasses.inputError
                                  : componentClasses.input
                              }`}
                              placeholder='abc123'
                              required
                            />
                            {searchingClub && (
                              <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                                <div className={componentClasses.spinner}></div>
                              </div>
                            )}
                          </div>

                          {/* Mostrar club encontrado */}
                          {foundClub && (
                            <div
                              className={
                                componentClasses.successMessage + ' mt-3'
                              }
                            >
                              <div className='flex items-center space-x-3'>
                                <div className='bg-green-100 dark:bg-green-800 p-2 rounded-full'>
                                  <Building2 className='w-5 h-5 text-green-600 dark:text-green-400' />
                                </div>
                                <div>
                                  <h4 className='text-sm font-semibold text-green-800 dark:text-green-200'>
                                    Club encontrado
                                  </h4>
                                  <p className='text-sm text-green-700 dark:text-green-300'>
                                    {foundClub.nombre}
                                  </p>
                                  <p className='text-xs text-green-600 dark:text-green-400'>
                                    Código: {foundClub.codigo_club}
                                  </p>
                                </div>
                                <div className='ml-auto'>
                                  <Check className='w-6 h-6 text-green-600 dark:text-green-400' />
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Mostrar error cuando no se encuentra el club */}
                          {clubNotFound && clubCode.length >= 3 && (
                            <div
                              className={
                                componentClasses.errorMessage + ' mt-3'
                              }
                            >
                              <div className='flex items-center space-x-3'>
                                <div className='bg-red-100 dark:bg-red-800 p-2 rounded-full'>
                                  <X className='w-5 h-5 text-red-600 dark:text-red-400' />
                                </div>
                                <div>
                                  <h4 className='text-sm font-semibold text-red-800 dark:text-red-200'>
                                    Club no encontrado
                                  </h4>
                                  <p className='text-sm text-red-700 dark:text-red-300'>
                                    El código "{clubCode}" no existe
                                  </p>
                                  <p className='text-xs text-red-600 dark:text-red-400'>
                                    Verifica el código con el administrador
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Mensaje de ayuda */}
                          {!foundClub && !clubNotFound && (
                            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                              Solicita el código del club al administrador
                            </p>
                          )}
                        </div>
                      )}

                      {/* Campos comunes en dos columnas */}
                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
                        {/* Columna Izquierda */}
                        <div className='space-y-4'>
                          <div>
                            <label
                              htmlFor='email'
                              className={componentClasses.label}
                            >
                              Email del club o personal
                            </label>
                            <input
                              type='email'
                              id='email'
                              className={componentClasses.input}
                              placeholder='miclub@gmail.com'
                              required
                              {...register('email', {
                                required: 'El email es requerido',
                                pattern: {
                                  value:
                                    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message:
                                    'Formato de email inválido. Ejemplo: miclub@gmail.com'
                                }
                              })}
                            />
                            {errors.email && (
                              <p className='mt-1 text-sm text-red-500'>
                                {errors.email.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor='password'
                              className={componentClasses.label}
                            >
                              Contraseña
                            </label>
                            <div className='relative'>
                              <input
                                type={showPassword ? 'text' : 'password'}
                                id='password'
                                placeholder='••••••••'
                                className={componentClasses.input + ' pr-12'}
                                required
                                {...register('password', {
                                  required: 'La contraseña es requerida',
                                  minLength: {
                                    value: 6,
                                    message: 'Mínimo 6 caracteres'
                                  }
                                })}
                              />
                              <button
                                type='button'
                                onClick={() => setShowPassword(!showPassword)}
                                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                              >
                                {showPassword ? (
                                  <EyeOff className='w-5 h-5' />
                                ) : (
                                  <Eye className='w-5 h-5' />
                                )}
                              </button>
                            </div>
                            {errors.password && (
                              <p className='mt-1 text-sm text-red-500'>
                                {errors.password.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor='nombre_completo'
                              className={componentClasses.label}
                            >
                              Nombre completo
                            </label>
                            <input
                              type='text'
                              id='nombre_completo'
                              className={componentClasses.input}
                              placeholder='Juan Pérez'
                              required
                              {...register('nombre_completo', {
                                required: 'El nombre es requerido'
                              })}
                            />
                            {errors.nombre_completo && (
                              <p className='mt-1 text-sm text-red-500'>
                                {errors.nombre_completo.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Columna Derecha */}
                        <div className='space-y-4'>
                          <div>
                            <label
                              htmlFor='confirmEmail'
                              className={componentClasses.label}
                            >
                              Confirmar email
                              {email && confirmEmail && (
                                <span
                                  className={`ml-2 text-sm ${
                                    emailsMatch
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-500'
                                  }`}
                                >
                                  {emailsMatch ? '✓' : '✗'}
                                </span>
                              )}
                            </label>
                            <input
                              type='email'
                              id='confirmEmail'
                              className={componentClasses.input}
                              placeholder='miclub@gmail.com'
                              required
                              {...register('confirmEmail', {
                                required: 'Debe confirmar el email',
                                pattern: {
                                  value:
                                    /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                  message: 'Formato de email inválido'
                                },
                                validate: (value) =>
                                  value === email || 'Los emails no coinciden'
                              })}
                            />
                            {errors.confirmEmail && (
                              <p className='mt-1 text-sm text-red-500'>
                                {errors.confirmEmail.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor='confirmPassword'
                              className={componentClasses.label}
                            >
                              Confirmar contraseña
                              {password && confirmPassword && (
                                <span
                                  className={`ml-2 text-sm ${
                                    passwordsMatch
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-red-500'
                                  }`}
                                >
                                  {passwordsMatch ? '✓' : '✗'}
                                </span>
                              )}
                            </label>
                            <input
                              type='password'
                              id='confirmPassword'
                              placeholder='••••••••'
                              className={componentClasses.input}
                              required
                              {...register('confirmPassword', {
                                required: 'Debe confirmar la contraseña',
                                validate: (value) =>
                                  value === password ||
                                  'Las contraseñas no coinciden'
                              })}
                            />
                            {errors.confirmPassword && (
                              <p className='mt-1 text-sm text-red-500'>
                                {errors.confirmPassword.message}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor='telefono'
                              className={componentClasses.label}
                            >
                              Teléfono
                            </label>
                            <div className='flex'>
                              <div className='flex-shrink-0'>
                                <CountrySelector
                                  value={countryCode}
                                  onChange={setCountryCode}
                                  error={errors.telefono}
                                />
                              </div>
                              <input
                                type='text'
                                id='telefono'
                                className={`flex-1 min-w-0 px-4 py-3 border rounded-r-lg focus:ring-2 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors ${
                                  errors.telefono
                                    ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                                }`}
                                placeholder='123 456 7890'
                                required
                                {...register('telefono', {
                                  required: 'El teléfono es requerido',
                                  pattern: {
                                    value: /^[0-9\s\-\(\)]+$/,
                                    message: 'Solo números, espacios y guiones'
                                  }
                                })}
                              />
                            </div>
                            {errors.telefono && (
                              <p className='mt-1 text-sm text-red-500'>
                                {errors.telefono.message}
                              </p>
                            )}
                            <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                              Formato: {countryCode}{' '}
                              {watch('telefono') || '123 456 7890'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Botón de envío */}
                      <button
                        type='submit'
                        disabled={
                          isLoading ||
                          (registrationOption === 'join_club' && !foundClub)
                        }
                        className={componentClasses.primaryButton}
                        style={{
                          background: getButtonGradient(isLoading)
                        }}
                        onMouseEnter={(e) => {
                          if (!isLoading) {
                            e.target.style.background = getButtonHoverGradient()
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isLoading) {
                            e.target.style.background = getButtonGradient()
                          }
                        }}
                      >
                        {isLoading ? (
                          <div className={componentClasses.spinner} />
                        ) : (
                          <>
                            <Check size={20} />
                            <span>Crear cuenta</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Footer */}
                <div className='mt-8 pt-6 text-center border-t border-gray-200 dark:border-gray-700'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    ¿Ya tienes una cuenta?{' '}
                    <button
                      type='button'
                      onClick={() => navigate('/login')}
                      className='text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors focus:outline-none focus:underline'
                    >
                      Inicia sesión
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
