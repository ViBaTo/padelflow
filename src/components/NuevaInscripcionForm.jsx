import { useEffect, useState, useRef } from 'react'
import { db, supabase } from '../lib/supabase'

export function NuevaInscripcionForm({
  open,
  onClose,
  onSuccess,
  alumnoPreSeleccionado
}) {
  const [alumnos, setAlumnos] = useState([])
  const [paquetes, setPaquetes] = useState([])
  const [profesores, setProfesores] = useState([])
  const [form, setForm] = useState({
    alumno: '',
    paquete: '',
    fecha: '',
    profesor: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [alumnoSearch, setAlumnoSearch] = useState('')
  const [showAlumnoDropdown, setShowAlumnoDropdown] = useState(false)
  const alumnoInputRef = useRef(null)

  useEffect(() => {
    if (open) {
      db.getAlumnos().then(({ data }) => setAlumnos(data || []))
      db.getPaquetes().then(({ data }) => setPaquetes(data || []))
      db.getProfesores().then(({ data }) => setProfesores(data || []))

      if (alumnoPreSeleccionado) {
        setForm((prev) => ({
          ...prev,
          alumno: alumnoPreSeleccionado.cedula
        }))
        setAlumnoSearch(alumnoPreSeleccionado.nombre_completo)
      } else {
        setForm({ alumno: '', paquete: '', fecha: '', profesor: '' })
        setAlumnoSearch('')
      }

      setError('')
      setSuccess('')
    }
  }, [open, alumnoPreSeleccionado])

  const alumnosFiltrados = alumnoSearch
    ? alumnos.filter(
        (a) =>
          a.nombre_completo &&
          a.nombre_completo.toLowerCase().includes(alumnoSearch.toLowerCase())
      )
    : alumnos

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')
    try {
      const alumno = alumnos.find((a) => a.cedula === form.alumno)
      const paquete = paquetes.find((p) => p.codigo === form.paquete)
      if (!alumno || !paquete) {
        setError('Selecciona un alumno y un paquete válidos.')
        setLoading(false)
        return
      }
      if (alumno.estado === 'INACTIVO') {
        await db.updateAlumnoEstado(alumno.cedula, 'ACTIVO')
      }
      const { data, error: userError } = await supabase.auth.getUser()
      const user = data?.user
      if (!user) {
        setError('No hay usuario autenticado.')
        setLoading(false)
        return
      }
      const inscripcion = {
        cedula_alumno: alumno.cedula,
        codigo_paquete: paquete.codigo,
        fecha_inscripcion: form.fecha,
        fecha_vencimiento: null,
        clases_totales: paquete.numero_clases,
        clases_utilizadas: 0,
        precio_pagado: paquete.precio_con_iva || paquete.precio,
        descuento: 0,
        modo_pago: null,
        comprobante: null,
        observaciones: null,
        estado: 'ACTIVO',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        id_profesor: form.profesor || null,
        user_id: user.id
      }
      const { error } = await db.addInscripcion(inscripcion)
      if (error) {
        setError(error.message || JSON.stringify(error))
      } else {
        setSuccess('Inscripción creada correctamente')
        if (onSuccess) onSuccess()
        setTimeout(() => onClose(), 1200)
      }
    } catch (err) {
      setError(err?.message || JSON.stringify(err))
    } finally {
      setLoading(false)
    }
  }

  const handleAlumnoSelect = (cedula, nombre) => {
    setForm({ ...form, alumno: cedula })
    setAlumnoSearch(nombre)
    setShowAlumnoDropdown(false)
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        alumnoInputRef.current &&
        !alumnoInputRef.current.contains(event.target)
      ) {
        setShowAlumnoDropdown(false)
      }
    }
    if (showAlumnoDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAlumnoDropdown])

  const alumnoNoSeleccionado = alumnoSearch && !form.alumno

  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex justify-center items-center bg-black/40'>
      <div className='bg-white rounded-lg p-8 shadow-lg relative w-full max-w-lg'>
        <button
          className='absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none transition-colors duration-200'
          onClick={onClose}
          aria-label='Cerrar'
        >
          ×
        </button>
        <h2 className='text-xl font-bold mb-4'>Nueva inscripción</h2>
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
          <div className='relative' ref={alumnoInputRef}>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Alumno
            </label>
            <input
              type='text'
              name='alumno_search'
              autoComplete='off'
              value={alumnoSearch}
              onChange={(e) => {
                setAlumnoSearch(e.target.value)
                setShowAlumnoDropdown(true)
                setForm({ ...form, alumno: '' })
              }}
              onFocus={() =>
                !alumnoPreSeleccionado && setShowAlumnoDropdown(true)
              }
              placeholder='Escribe el nombre del alumno...'
              className={`border p-2 rounded w-full ${
                alumnoNoSeleccionado ? 'border-red-500' : ''
              }`}
              required
              disabled={!!alumnoPreSeleccionado}
            />
            {showAlumnoDropdown &&
              alumnosFiltrados.length > 0 &&
              !alumnoPreSeleccionado && (
                <ul className='absolute z-10 bg-white border rounded w-full mt-1 max-h-48 overflow-y-auto shadow'>
                  {alumnosFiltrados.map((a) => (
                    <li
                      key={a.cedula}
                      className='px-3 py-2 hover:bg-blue-100 cursor-pointer text-sm'
                      onClick={() =>
                        handleAlumnoSelect(a.cedula, a.nombre_completo)
                      }
                    >
                      {a.nombre_completo}
                    </li>
                  ))}
                </ul>
              )}
            {alumnoNoSeleccionado && !alumnoPreSeleccionado && (
              <div className='text-red-500 text-xs mt-1'>
                Selecciona un alumno de la lista.
              </div>
            )}
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Paquete
            </label>
            <select
              name='paquete'
              value={form.paquete}
              onChange={handleChange}
              required
              className='border p-2 rounded w-full'
            >
              <option value=''>Selecciona un paquete...</option>
              {paquetes.map((p) => (
                <option key={p.codigo} value={p.codigo}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Fecha de inicio
            </label>
            <input
              type='date'
              name='fecha'
              value={form.fecha}
              onChange={handleChange}
              required
              className='border p-2 rounded w-full'
            />
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Profesor (opcional)
            </label>
            <select
              name='profesor'
              value={form.profesor || ''}
              onChange={handleChange}
              className='border p-2 rounded w-full'
            >
              <option value=''>Sin asignar</option>
              {profesores.map((p) => (
                <option key={p.id_profesor} value={p.id_profesor}>
                  {p.nombre_completo}
                </option>
              ))}
            </select>
          </div>
          {error && <div className='text-red-500 text-sm'>{error}</div>}
          {success && <div className='text-green-600 text-sm'>{success}</div>}
          <button
            type='submit'
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold shadow mt-2 disabled:opacity-50'
            disabled={loading || !form.alumno}
          >
            {loading ? 'Guardando...' : 'Crear inscripción'}
          </button>
        </form>
      </div>
    </div>
  )
}
