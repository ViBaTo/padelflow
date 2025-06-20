import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'

const COUNTRY_CODES = [
  { code: '+593', label: 'Ecuador' },
  { code: '+34', label: 'España' },
  { code: '+51', label: 'Perú' },
  { code: '+54', label: 'Argentina' },
  { code: '+1', label: 'EEUU/Canadá' },
  { code: '+52', label: 'México' },
  { code: '+55', label: 'Brasil' },
  { code: '+56', label: 'Chile' },
  { code: '+57', label: 'Colombia' },
  { code: '+58', label: 'Venezuela' }
]

export function UserProfileModal({ open, onClose }) {
  const { user } = useStore()
  const [form, setForm] = useState({
    email: user?.email || '',
    countryCode: '+593',
    telefono: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.id) {
      supabase
        .from('usuarios')
        .select('telefono')
        .eq('auth_user_id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.telefono) {
            // Separar código y número si es posible
            const match = data.telefono.match(/^(\+\d{1,4})\s?(.*)$/)
            if (match) {
              setForm((f) => ({
                ...f,
                countryCode: match[1],
                telefono: match[2]
              }))
            } else {
              setForm((f) => ({ ...f, telefono: data.telefono }))
            }
          }
        })
    }
  }, [user])

  if (!open) return null

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      // Actualizar email si cambió
      if (form.email && form.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: form.email
        })
        if (emailError) throw emailError
      }
      // Actualizar teléfono
      const telefonoCompleto = `${form.countryCode} ${form.telefono}`.trim()
      if (form.telefono) {
        const { error: telError } = await supabase
          .from('usuarios')
          .update({ telefono: telefonoCompleto })
          .eq('auth_user_id', user.id)
        if (telError) throw telError
      }
      setSuccess('Datos actualizados correctamente')
    } catch (err) {
      setError(err.message || 'Error al actualizar datos')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      if (form.newPassword !== form.confirmPassword) {
        setError('Las contraseñas no coinciden')
        setLoading(false)
        return
      }
      const { error: passError } = await supabase.auth.updateUser({
        password: form.newPassword
      })
      if (passError) throw passError
      setSuccess('Contraseña actualizada correctamente')
      setForm((f) => ({
        ...f,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (err) {
      setError(err.message || 'Error al cambiar contraseña')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-opacity-600 backdrop-blur-sm'>
      <div className='bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative'>
        <button
          className='absolute top-3 right-3 text-gray-400 hover:text-gray-700 dark:hover:text-white text-xl'
          onClick={onClose}
        >
          ×
        </button>
        <h2 className='text-xl font-bold mb-4 text-gray-900 dark:text-white'>
          Mi perfil
        </h2>
        <form onSubmit={handleSave} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>Email</label>
            <input
              type='email'
              name='email'
              value={form.email}
              onChange={handleChange}
              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>Teléfono</label>
            <div className='flex gap-2'>
              <select
                name='countryCode'
                value={form.countryCode}
                onChange={handleChange}
                className='border border-gray-300 rounded-md px-2 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800'
                style={{ minWidth: 90 }}
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} {c.label}
                  </option>
                ))}
              </select>
              <input
                type='text'
                name='telefono'
                value={form.telefono}
                onChange={handleChange}
                className='flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
                required
                placeholder='Número'
              />
            </div>
          </div>
          <button
            type='submit'
            className='w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition'
            disabled={loading}
          >
            {loading ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
        <hr className='my-6' />
        <form onSubmit={handleChangePassword} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium mb-1'>
              Nueva contraseña
            </label>
            <input
              type='password'
              name='newPassword'
              value={form.newPassword}
              onChange={handleChange}
              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
          </div>
          <div>
            <label className='block text-sm font-medium mb-1'>
              Confirmar nueva contraseña
            </label>
            <input
              type='password'
              name='confirmPassword'
              value={form.confirmPassword}
              onChange={handleChange}
              className='w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
          </div>
          <button
            type='submit'
            className='w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition'
            disabled={loading}
          >
            {loading ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
        {(error || success) && (
          <div
            className={`mt-4 text-sm rounded-md px-4 py-2 ${
              error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}
          >
            {error || success}
          </div>
        )}
      </div>
    </div>
  )
}
