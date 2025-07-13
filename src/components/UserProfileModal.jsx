import { useState, useEffect } from 'react'
import { useStore } from '../lib/store'
import { supabase } from '../lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { designTokens, componentClasses } from '../lib/designTokens'
import { User, Phone, Mail, Lock, Eye, EyeOff } from 'lucide-react'

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
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  useEffect(() => {
    if (user?.id) {
      // TODO: Implementar tabla usuarios cuando esté disponible
      // supabase
      //   .from('usuarios')
      //   .select('telefono')
      //   .eq('auth_user_id', user.id)
      //   .single()
      //   .then(({ data }) => {
      //     if (data?.telefono) {
      //       // Separar código y número si es posible
      //       const match = data.telefono.match(/^(\+\d{1,4})\s?(.*)$/)
      //       if (match) {
      //         setForm((f) => ({
      //           ...f,
      //           countryCode: match[1],
      //           telefono: match[2]
      //         }))
      //       } else {
      //         setForm((f) => ({ ...f, telefono: data.telefono }))
      //       }
      //     }
      //   })
    }
  }, [user])

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
      // TODO: Actualizar teléfono cuando tabla usuarios esté disponible
      // const telefonoCompleto = `${form.countryCode} ${form.telefono}`.trim()
      // if (form.telefono) {
      //   const { error: telError } = await supabase
      //     .from('usuarios')
      //     .update({ telefono: telefonoCompleto })
      //     .eq('auth_user_id', user.id)
      //   if (telError) throw telError
      // }
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

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle
            className={`${designTokens.typography.h3} ${designTokens.text.primary} flex items-center space-x-2`}
          >
            <User className='w-6 h-6 text-blue-600' />
            <span>Mi Perfil</span>
          </DialogTitle>
          <DialogDescription className={designTokens.text.secondary}>
            Actualiza tu información personal y configuración de cuenta.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Mensajes de estado */}
          {error && (
            <div className={componentClasses.errorMessage}>
              <span className='text-sm'>{error}</span>
            </div>
          )}

          {success && (
            <div className={componentClasses.successMessage}>
              <span className='text-sm'>{success}</span>
            </div>
          )}

          {/* Información personal */}
          <div
            className={`${designTokens.backgrounds.card} ${designTokens.borders.card} ${designTokens.rounded.card} p-4`}
          >
            <h3
              className={`${designTokens.typography.h5} ${designTokens.text.primary} mb-4 flex items-center`}
            >
              <Mail className='w-4 h-4 mr-2 text-blue-600' />
              Información Personal
            </h3>
            <form onSubmit={handleSave} className='space-y-4'>
              <div>
                <Label htmlFor='email' className={componentClasses.label}>
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  name='email'
                  value={form.email}
                  onChange={handleChange}
                  className={componentClasses.input}
                  required
                />
              </div>

              <div>
                <Label className={componentClasses.label}>Teléfono</Label>
                <div className='flex gap-2'>
                  <select
                    name='countryCode'
                    value={form.countryCode}
                    onChange={handleChange}
                    className={`${componentClasses.input} flex-shrink-0 w-32`}
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.code} {c.label}
                      </option>
                    ))}
                  </select>
                  <Input
                    type='text'
                    name='telefono'
                    value={form.telefono}
                    onChange={handleChange}
                    className={`${componentClasses.input} flex-1`}
                    placeholder='Número'
                  />
                </div>
              </div>

              <Button
                type='submit'
                disabled={loading}
                className={`${componentClasses.primaryButton} bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700`}
              >
                {loading ? (
                  <>
                    <div className={componentClasses.spinner} />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </form>
          </div>

          {/* Cambio de contraseña */}
          <div
            className={`${designTokens.backgrounds.card} ${designTokens.borders.card} ${designTokens.rounded.card} p-4`}
          >
            <h3
              className={`${designTokens.typography.h5} ${designTokens.text.primary} mb-4 flex items-center`}
            >
              <Lock className='w-4 h-4 mr-2 text-blue-600' />
              Cambiar Contraseña
            </h3>
            <form onSubmit={handleChangePassword} className='space-y-4'>
              <div>
                <Label htmlFor='newPassword' className={componentClasses.label}>
                  Nueva contraseña
                </Label>
                <div className='relative'>
                  <Input
                    id='newPassword'
                    type={showPasswords.new ? 'text' : 'password'}
                    name='newPassword'
                    value={form.newPassword}
                    onChange={handleChange}
                    className={componentClasses.input}
                    required
                  />
                  <button
                    type='button'
                    className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    onClick={() => togglePasswordVisibility('new')}
                  >
                    {showPasswords.new ? (
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400' />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <Label
                  htmlFor='confirmPassword'
                  className={componentClasses.label}
                >
                  Confirmar contraseña
                </Label>
                <div className='relative'>
                  <Input
                    id='confirmPassword'
                    type={showPasswords.confirm ? 'text' : 'password'}
                    name='confirmPassword'
                    value={form.confirmPassword}
                    onChange={handleChange}
                    className={componentClasses.input}
                    required
                  />
                  <button
                    type='button'
                    className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    onClick={() => togglePasswordVisibility('confirm')}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400' />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type='submit'
                disabled={loading || !form.newPassword || !form.confirmPassword}
                className={`${componentClasses.primaryButton} bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700`}
              >
                {loading ? (
                  <>
                    <div className={componentClasses.spinner} />
                    Actualizando...
                  </>
                ) : (
                  'Cambiar contraseña'
                )}
              </Button>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
