import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useStore } from '../../lib/store'
import { supabase, auth } from '../../lib/supabase'
import logo from '../../assets/images/logo.png'

export function Register() {
  const navigate = useNavigate()
  const { setUser, setSession } = useStore()
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm()

  const password = watch('password')

  const onSubmit = async (data) => {
    setIsLoading(true)
    setError(null)
    try {
      // 1. Crear usuario en Supabase Auth
      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email: data.email,
          password: data.password
        })
      if (signUpError) throw signUpError
      const user = signUpData.user
      const session = signUpData.session
      if (!user) throw new Error('No se pudo crear el usuario.')
      // 2. Insertar en tabla usuarios
      const { error: dbError } = await supabase.from('usuarios').insert([
        {
          auth_user_id: user.id,
          nombre_completo: data.nombre_completo,
          telefono: data.telefono,
          rol: 'ADMINISTRADOR',
          estado: 'ACTIVO',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      if (dbError) {
        // Si falla, borra el usuario de Auth
        await supabase.auth.admin.deleteUser(user.id)
        throw dbError
      }
      // 3. Guardar usuario y sesión en store y navegar
      setUser(user)
      setSession(session)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error al registrar usuario')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='flex flex-col items-center justify-center px-6 py-8 w-full sm:max-w-md'>
        <div className='w-full bg-white rounded-lg shadow dark:border sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700'>
          <div className='flex items-center justify-center gap-3 pt-6'>
            <img
              src={logo}
              alt='logo'
              width={48}
              height={48}
              className='rounded-full'
            />
            <span className='text-xl font-bold text-primary-600 dark:text-primary-400 tracking-wide'>
              La Pala Ecuador
            </span>
          </div>
          <div className='p-6 space-y-4 md:space-y-6 sm:p-8'>
            <h1 className='text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white'>
              Crear cuenta
            </h1>
            <form
              className='space-y-4 md:space-y-6'
              onSubmit={handleSubmit(onSubmit)}
            >
              {error && (
                <div className='p-3 text-sm text-red-500 bg-red-50 rounded-lg dark:bg-red-900/50'>
                  {error}
                </div>
              )}
              <div>
                <label
                  htmlFor='email'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Email
                </label>
                <input
                  type='email'
                  id='email'
                  className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                  placeholder='name@company.com'
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
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Contraseña
                </label>
                <input
                  type='password'
                  id='password'
                  placeholder='••••••••'
                  className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                  required
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres'
                    }
                  })}
                />
                {errors.password && (
                  <p className='mt-1 text-sm text-red-500'>
                    {errors.password.message}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Confirmar contraseña
                </label>
                <input
                  type='password'
                  id='confirmPassword'
                  placeholder='••••••••'
                  className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                  required
                  {...register('confirmPassword', {
                    required: 'Debe confirmar la contraseña',
                    validate: (value) =>
                      value === password || 'Las contraseñas no coinciden'
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
                  htmlFor='nombre_completo'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Nombre completo
                </label>
                <input
                  type='text'
                  id='nombre_completo'
                  className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                  placeholder='Nombre completo'
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
              <div>
                <label
                  htmlFor='telefono'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Teléfono
                </label>
                <input
                  type='text'
                  id='telefono'
                  className='bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500'
                  placeholder='Teléfono'
                  required
                  {...register('telefono', {
                    required: 'El teléfono es requerido'
                  })}
                />
                {errors.telefono && (
                  <p className='mt-1 text-sm text-red-500'>
                    {errors.telefono.message}
                  </p>
                )}
              </div>
              <button
                type='submit'
                className='w-full text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800'
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto' />
                ) : (
                  'Crear cuenta'
                )}
              </button>
              <p className='text-sm font-light text-gray-500 dark:text-gray-400'>
                ¿Ya tienes una cuenta?{' '}
                <a
                  href='/login'
                  className='font-medium text-primary-600 hover:underline dark:text-primary-500'
                >
                  Inicia sesión
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}
