import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useStore } from '../../lib/store'
import { supabase } from '../../lib/supabase'
import {
  designTokens,
  componentClasses,
  getButtonGradient,
  getButtonHoverGradient
} from '../../lib/designTokens'
import { Building2, Users, Check, LogIn, X } from 'lucide-react'
import logo from '../../assets/images/logo.png'
import logoverdepadel from '../../assets/logos/logoverdepadel.png'

export function Login() {
  const navigate = useNavigate()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm()

  const onSubmit = async (data) => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('🚀 Iniciando login...')

      // Timeout de seguridad para el login
      const loginTimeout = setTimeout(() => {
        setError('Login tomando demasiado tiempo. Intenta de nuevo.')
        setIsLoading(false)
      }, 15000) // 15 segundos

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password
        })

      clearTimeout(loginTimeout)

      if (authError) {
        console.error('❌ Error de login:', authError)
        throw authError
      }

      console.log('✅ Login exitoso, navegando...')
      // El store manejará automáticamente la sesión vía onAuthStateChange
      navigate('/')
    } catch (error) {
      console.error('❌ Error en login:', error)
      setError(error.message)
    } finally {
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
              La plataforma para la gestión profesional de clubes de pádel
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
                    Bienvenido de vuelta
                  </h2>
                  <p className={componentClasses.cardHeaderSubtitle}>
                    Inicia sesión en tu cuenta
                  </p>
                </div>
              </div>

              <div className={componentClasses.cardContent}>
                <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
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

                  <div className='space-y-4'>
                    <div>
                      <label htmlFor='email' className={componentClasses.label}>
                        Email
                      </label>
                      <input
                        type='email'
                        id='email'
                        className={componentClasses.input}
                        placeholder='tu@email.com'
                        required
                        {...register('email', {
                          required: 'El email es requerido',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
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
                      <input
                        type='password'
                        id='password'
                        placeholder='••••••••'
                        className={componentClasses.input}
                        required
                        {...register('password', {
                          required: 'La contraseña es requerida',
                          minLength: {
                            value: 6,
                            message: 'Mínimo 6 caracteres'
                          }
                        })}
                      />
                      {errors.password && (
                        <p className='mt-1 text-sm text-red-500'>
                          {errors.password.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <input
                        id='remember'
                        type='checkbox'
                        className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600'
                      />
                      <label
                        htmlFor='remember'
                        className='ml-2 text-sm text-gray-600 dark:text-gray-400'
                      >
                        Recordarme
                      </label>
                    </div>
                    <button
                      type='button'
                      className='text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors focus:outline-none focus:underline'
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <button
                    type='submit'
                    disabled={isLoading}
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
                        <LogIn size={20} />
                        <span>Iniciar sesión</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className='mt-8 pt-6 text-center border-t border-gray-200 dark:border-gray-700'>
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    ¿No tienes una cuenta?{' '}
                    <Link
                      to='/register'
                      className='text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium transition-colors focus:outline-none focus:underline'
                    >
                      Regístrate
                    </Link>
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
