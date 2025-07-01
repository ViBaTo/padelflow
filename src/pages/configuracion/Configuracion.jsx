import { useState, useEffect } from 'react'
import { db, supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { CategoryColorConfig } from '../../components/CategoryColorConfig'
import { GenericForm } from '../../components/GenericForm'
import { exportAllTablesAsCSV } from '../../lib/utils'
import { useNavigate } from 'react-router-dom'
import {
  Settings,
  Users,
  Palette,
  CreditCard,
  Bell,
  Download,
  Upload,
  Shield,
  Moon,
  Sun,
  Globe,
  Database,
  Building,
  Save,
  Plus,
  Trash2,
  Edit2,
  FileText,
  Info,
  Package,
  Monitor,
  Smartphone
} from 'lucide-react'

export function Configuracion() {
  const { user, isDarkMode, toggleDarkMode, clubConfig, updateClubConfig } =
    useStore()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('club')
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showPaqueteModal, setShowPaqueteModal] = useState(false)
  const [editingPaquete, setEditingPaquete] = useState(null)
  const [paquetes, setPaquetes] = useState([])
  const [isDesktop, setIsDesktop] = useState(true)

  // Detectar tipo de dispositivo
  useEffect(() => {
    const checkDeviceType = () => {
      const desktop = window.innerWidth >= 1024
      setIsDesktop(desktop)

      // Redirigir a móviles al dashboard
      if (!desktop) {
        navigate('/', { replace: true })
      }
    }

    checkDeviceType()
    window.addEventListener('resize', checkDeviceType)

    return () => window.removeEventListener('resize', checkDeviceType)
  }, [navigate])

  // Estados para diferentes configuraciones
  const [clubInfo, setClubInfo] = useState({
    nombre: clubConfig.nombre || 'LaPala Club',
    direccion: clubConfig.direccion || '',
    telefono: clubConfig.telefono || '',
    email: clubConfig.email || '',
    website: clubConfig.website || '',
    zona_horaria: clubConfig.zona_horaria || 'America/Guayaquil'
  })

  const [paymentConfig, setPaymentConfig] = useState({
    iva_porcentaje: clubConfig.paymentConfig?.iva_porcentaje || 18,
    moneda: clubConfig.paymentConfig?.moneda || 'USD',
    modos_pago: clubConfig.paymentConfig?.modos_pago || [
      'efectivo',
      'transferencia',
      'tarjeta'
    ],
    dias_vencimiento: clubConfig.paymentConfig?.dias_vencimiento || 30
  })

  const [notificationConfig, setNotificationConfig] = useState({
    alertas_vencimiento:
      clubConfig.notificationConfig?.alertas_vencimiento || 7,
    recordatorios_pago: clubConfig.notificationConfig?.recordatorios_pago || 3,
    notificaciones_nuevos_alumnos:
      clubConfig.notificationConfig?.notificaciones_nuevos_alumnos !== false,
    email_notificaciones:
      clubConfig.notificationConfig?.email_notificaciones || false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: cats, error: catError } = await db.getCategorias()
      if (catError) throw catError
      setCategorias(cats || [])

      const { data: pqs, error: pqsError } = await db.getPaquetes()
      if (pqsError) throw pqsError
      console.log('Paquetes cargados:', pqs)
      setPaquetes(pqs || [])

      setLoading(false)
    } catch (err) {
      console.error('Error en fetchData:', err)
      setError('Error al cargar configuración: ' + err.message)
      setLoading(false)
    }
  }

  const handleSaveClubConfig = async (config) => {
    try {
      updateClubConfig(config)
      setSuccess('Configuración guardada correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError('Error al guardar configuración: ' + err.message)
    }
  }

  const handleAddCategory = async (data) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .insert([{ ...data, tipo: 'alumno' }])
      if (error) throw error
      setShowCategoryModal(false)
      fetchData()
      setSuccess('Categoría creada correctamente')
    } catch (err) {
      setError('Error al crear categoría: ' + err.message)
    }
  }

  const handleUpdateCategory = async (id, data) => {
    try {
      const { error } = await supabase
        .from('categorias')
        .update({ ...data, tipo: 'alumno' })
        .eq('id_categoria', id)
      if (error) throw error
      setEditingCategory(null)
      fetchData()
      setSuccess('Categoría actualizada correctamente')
    } catch (err) {
      setError('Error al actualizar categoría: ' + err.message)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (
      !window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')
    )
      return

    try {
      const { error } = await supabase
        .from('categorias')
        .delete()
        .eq('id_categoria', id)
      if (error) throw error
      fetchData()
      setSuccess('Categoría eliminada correctamente')
    } catch (err) {
      setError('Error al eliminar categoría: ' + err.message)
    }
  }

  const handleAddPaquete = async (data) => {
    try {
      console.log('Agregando paquete:', data)
      setError(null) // Limpiar errores previos

      // Limpiar y validar datos
      const cleanedData = {
        codigo: data.codigo?.toString().trim(),
        nombre: data.nombre?.toString().trim(),
        categoria: data.categoria?.toString().trim(),
        tipo_servicio: data.tipo_servicio?.toString().trim(),
        descripcion: data.descripcion?.toString().trim(),
        numero_clases: parseInt(data.numero_clases) || 0,
        precio: parseFloat(data.precio) || 0,
        precio_con_iva: parseFloat(data.precio_con_iva) || 0,
        estado: data.estado?.toString().trim()
      }

      // Validar que todos los campos requeridos estén presentes
      const requiredFields = [
        'codigo',
        'nombre',
        'categoria',
        'tipo_servicio',
        'descripcion',
        'numero_clases',
        'precio',
        'precio_con_iva',
        'estado'
      ]
      const missingFields = requiredFields.filter(
        (field) => !cleanedData[field]
      )

      if (missingFields.length > 0) {
        throw new Error(`Campos faltantes: ${missingFields.join(', ')}`)
      }

      console.log('Datos limpios para agregar:', cleanedData)
      const { error } = await db.addPaquete(cleanedData)
      if (error) {
        console.error('Error en addPaquete:', error)
        throw error
      }
      console.log('Paquete agregado exitosamente')
      setShowPaqueteModal(false)
      fetchData()
      setSuccess('Paquete creado correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error completo:', err)
      setError('Error al crear paquete: ' + err.message)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleUpdatePaquete = async (codigo, data) => {
    try {
      console.log('Actualizando paquete:', { codigo, data })
      setError(null) // Limpiar errores previos

      // Limpiar y validar datos
      const cleanedData = {
        codigo: data.codigo?.toString().trim(),
        nombre: data.nombre?.toString().trim(),
        categoria: data.categoria?.toString().trim(),
        tipo_servicio: data.tipo_servicio?.toString().trim(),
        descripcion: data.descripcion?.toString().trim(),
        numero_clases: parseInt(data.numero_clases) || 0,
        precio: parseFloat(data.precio) || 0,
        precio_con_iva: parseFloat(data.precio_con_iva) || 0,
        estado: data.estado?.toString().trim()
      }

      // Validar que todos los campos requeridos estén presentes
      const requiredFields = [
        'codigo',
        'nombre',
        'categoria',
        'tipo_servicio',
        'descripcion',
        'numero_clases',
        'precio',
        'precio_con_iva',
        'estado'
      ]
      const missingFields = requiredFields.filter(
        (field) => !cleanedData[field]
      )

      if (missingFields.length > 0) {
        throw new Error(`Campos faltantes: ${missingFields.join(', ')}`)
      }

      console.log('Datos limpios:', cleanedData)
      const { error } = await db.updatePaquete(codigo, cleanedData)
      if (error) {
        console.error('Error en updatePaquete:', error)
        throw error
      }
      console.log('Paquete actualizado exitosamente')
      setEditingPaquete(null)
      fetchData()
      setSuccess('Paquete actualizado correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error completo:', err)
      setError('Error al actualizar paquete: ' + err.message)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDeletePaquete = async (codigo) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este paquete?'))
      return

    try {
      const { error } = await db.deletePaquete(codigo)
      if (error) throw error
      fetchData()
      setSuccess('Paquete eliminado correctamente')
    } catch (err) {
      setError('Error al eliminar paquete: ' + err.message)
    }
  }

  // Función para cerrar modales
  const closeModals = () => {
    console.log('Cerrando modales')
    setShowCategoryModal(false)
    setEditingCategory(null)
    setShowPaqueteModal(false)
    setEditingPaquete(null)
  }

  // Manejador de clic en overlay
  const handleOverlayClick = (e) => {
    console.log('Overlay click:', e.target === e.currentTarget)
    if (e.target === e.currentTarget) {
      closeModals()
    }
  }

  const handleExportData = async () => {
    try {
      setSuccess('Exportando datos...')

      const exportedFiles = await exportAllTablesAsCSV(db, supabase)

      if (exportedFiles.length > 0) {
        setSuccess(
          `Datos exportados correctamente: ${exportedFiles.join(', ')}`
        )
      } else {
        setError('No se pudieron exportar los datos')
      }

      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      setError('Error al exportar datos: ' + err.message)
    }
  }

  const handleChangePassword = async (data) => {
    try {
      if (data.newPassword !== data.confirmPassword) {
        setError('Las contraseñas no coinciden')
        return
      }

      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })
      if (error) throw error
      setSuccess('Contraseña actualizada correctamente')
    } catch (err) {
      setError('Error al cambiar contraseña: ' + err.message)
    }
  }

  // Campos para formularios
  const categoryFields = [
    {
      name: 'categoria',
      label: 'Nombre de la categoría',
      type: 'text',
      required: true
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'text',
      required: false
    }
  ]

  const passwordFields = [
    {
      name: 'currentPassword',
      label: 'Contraseña actual',
      type: 'password',
      required: true
    },
    {
      name: 'newPassword',
      label: 'Nueva contraseña',
      type: 'password',
      required: true
    },
    {
      name: 'confirmPassword',
      label: 'Confirmar nueva contraseña',
      type: 'password',
      required: true
    }
  ]

  const paqueteFields = [
    {
      name: 'codigo',
      label: 'Código del paquete',
      type: 'text',
      required: true
    },
    {
      name: 'nombre',
      label: 'Nombre del paquete',
      type: 'text',
      required: true
    },
    {
      name: 'categoria',
      label: 'Categoría',
      type: 'text',
      required: true
    },
    {
      name: 'tipo_servicio',
      label: 'Tipo de servicio',
      type: 'select',
      options: [
        { value: 'ACADEMIA', label: 'Academia' },
        { value: 'CONDFIS', label: 'Condicionamiento Físico' },
        { value: 'CLINICA', label: 'Clínica' },
        { value: 'PROFESOR_A', label: 'Profesor A' },
        { value: 'PROFESOR_B', label: 'Profesor B' },
        { value: 'INTENSIVO', label: 'Intensivo' },
        { value: 'OTRO', label: 'Otro' }
      ],
      required: true
    },
    {
      name: 'descripcion',
      label: 'Descripción',
      type: 'text',
      required: true
    },
    {
      name: 'numero_clases',
      label: 'Número de clases',
      type: 'number',
      required: true
    },
    {
      name: 'precio',
      label: 'Precio sin IVA',
      type: 'number',
      required: true
    },
    {
      name: 'precio_con_iva',
      label: 'Precio con IVA',
      type: 'number',
      required: true
    },
    {
      name: 'estado',
      label: 'Estado',
      type: 'select',
      options: [
        { value: 'ACTIVO', label: 'Activo' },
        { value: 'INACTIVO', label: 'Inactivo' }
      ],
      required: true
    }
  ]

  console.log('Campos de paquete definidos:', paqueteFields)

  const tabs = [
    { id: 'club', label: 'Club', icon: Building },
    { id: 'categorias', label: 'Categorías', icon: Users },
    { id: 'paquetes', label: 'Paquetes', icon: Package },
    { id: 'colores', label: 'Colores', icon: Palette },
    { id: 'pagos', label: 'Pagos', icon: CreditCard },
    { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
    { id: 'tema', label: 'Tema', icon: isDarkMode ? Sun : Moon },
    { id: 'backup', label: 'Backup', icon: Database }
  ]

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin' />
      </div>
    )
  }

  // Mostrar mensaje si no es desktop
  if (!isDesktop) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen p-6 text-center'>
        <div className='max-w-md'>
          <div className='flex justify-center mb-6'>
            <div className='p-4 bg-blue-100 rounded-full'>
              <Smartphone className='w-12 h-12 text-blue-600' />
            </div>
          </div>
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Configuración Solo Disponible en Escritorio
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mb-6'>
            La página de configuración está optimizada para dispositivos de
            escritorio para brindarte la mejor experiencia de gestión del
            sistema.
          </p>
          <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6'>
            <div className='flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
              <Monitor className='w-4 h-4' />
              <span>
                Accede desde tu computadora para gestionar la configuración
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            className='px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors'
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex flex-col flex-1 h-full p-6'>
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            Configuración
          </h1>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            Gestiona la configuración del sistema
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {success && (
            <div className='px-4 py-2 bg-green-100 text-green-800 rounded-md text-sm'>
              {success}
            </div>
          )}
          {error && (
            <div className='px-4 py-2 bg-red-100 text-red-800 rounded-md text-sm'>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className='border-b border-gray-200 dark:border-gray-700 mb-6'>
        <nav className='-mb-px flex space-x-8'>
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className='w-4 h-4' />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className='flex-1 overflow-y-auto'>
        {/* Configuración del Club */}
        {activeTab === 'club' && (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Información del Club
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Nombre del Club
                  </label>
                  <input
                    type='text'
                    value={clubInfo.nombre}
                    onChange={(e) =>
                      setClubInfo({ ...clubInfo, nombre: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Teléfono
                  </label>
                  <input
                    type='text'
                    value={clubInfo.telefono}
                    onChange={(e) =>
                      setClubInfo({ ...clubInfo, telefono: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Email
                  </label>
                  <input
                    type='email'
                    value={clubInfo.email}
                    onChange={(e) =>
                      setClubInfo({ ...clubInfo, email: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Zona Horaria
                  </label>
                  <select
                    value={clubInfo.zona_horaria}
                    onChange={(e) =>
                      setClubInfo({ ...clubInfo, zona_horaria: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='America/Guayaquil'>Ecuador (GMT-5)</option>
                    <option value='America/New_York'>
                      Nueva York (GMT-5/-4)
                    </option>
                    <option value='America/Los_Angeles'>
                      Los Ángeles (GMT-8/-7)
                    </option>
                    <option value='Europe/Madrid'>Madrid (GMT+1/+2)</option>
                  </select>
                </div>
                <div className='md:col-span-2'>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Dirección
                  </label>
                  <textarea
                    value={clubInfo.direccion}
                    onChange={(e) =>
                      setClubInfo({ ...clubInfo, direccion: e.target.value })
                    }
                    rows={3}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
              <div className='mt-4'>
                <button
                  onClick={() => handleSaveClubConfig(clubInfo)}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2'
                >
                  <Save className='w-4 h-4' />
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gestión de Categorías */}
        {activeTab === 'categorias' && (
          <div className='space-y-6'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Categorías de Alumnos
              </h3>
              <button
                onClick={() => setShowCategoryModal(true)}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2'
              >
                <Plus className='w-4 h-4' />
                Nueva Categoría
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {categorias.map((categoria) => (
                <div
                  key={categoria.id_categoria}
                  className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4'
                >
                  <div className='flex justify-between items-start mb-2'>
                    <h4 className='font-medium text-gray-900 dark:text-white'>
                      {categoria.categoria}
                    </h4>
                    <div className='flex gap-1'>
                      <button
                        onClick={() => setEditingCategory(categoria)}
                        className='p-1 text-gray-400 hover:text-blue-600'
                      >
                        <Edit2 className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteCategory(categoria.id_categoria)
                        }
                        className='p-1 text-gray-400 hover:text-red-600'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                    {categoria.descripcion || 'Sin descripción'}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal para nueva/editar categoría */}
            {(showCategoryModal || editingCategory) && (
              <div
                className='fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]'
                onClick={handleOverlayClick}
              >
                <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                    {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                  </h3>
                  <GenericForm
                    fields={categoryFields}
                    initialValues={editingCategory || {}}
                    onSubmit={
                      editingCategory
                        ? (data) =>
                            handleUpdateCategory(
                              editingCategory.id_categoria,
                              data
                            )
                        : handleAddCategory
                    }
                    onCancel={closeModals}
                    submitText={editingCategory ? 'Actualizar' : 'Crear'}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gestión de Paquetes */}
        {activeTab === 'paquetes' && (
          <div className='space-y-6'>
            <div className='flex justify-between items-center'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                Gestión de Paquetes
              </h3>
              <button
                onClick={() => setShowPaqueteModal(true)}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2'
              >
                <Plus className='w-4 h-4' />
                Nuevo Paquete
              </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {paquetes.map((paquete) => (
                <div
                  key={paquete.codigo}
                  className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4'
                >
                  <div className='flex justify-between items-start mb-2'>
                    <h4 className='font-medium text-gray-900 dark:text-white'>
                      {paquete.nombre}
                    </h4>
                    <div className='flex gap-1'>
                      <button
                        onClick={() => {
                          console.log('Editando paquete:', paquete)
                          setEditingPaquete(paquete)
                        }}
                        className='p-1 text-gray-400 hover:text-blue-600'
                      >
                        <Edit2 className='w-4 h-4' />
                      </button>
                      <button
                        onClick={() => handleDeletePaquete(paquete.codigo)}
                        className='p-1 text-gray-400 hover:text-red-600'
                      >
                        <Trash2 className='w-4 h-4' />
                      </button>
                    </div>
                  </div>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                    {paquete.descripcion}
                  </p>
                  <div className='space-y-1 text-sm'>
                    <div className='flex justify-between'>
                      <span className='text-gray-600 dark:text-gray-400'>
                        Código:
                      </span>
                      <span className='font-medium'>{paquete.codigo}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600 dark:text-gray-400'>
                        Clases:
                      </span>
                      <span className='font-medium'>
                        {paquete.numero_clases}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600 dark:text-gray-400'>
                        Precio:
                      </span>
                      <span className='font-medium text-green-600'>
                        ${paquete.precio_con_iva}
                      </span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-600 dark:text-gray-400'>
                        Estado:
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          paquete.estado === 'ACTIVO'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {paquete.estado}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal para nueva/editar paquete */}
            {(showPaqueteModal || editingPaquete) && (
              <div
                className='fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]'
                onClick={handleOverlayClick}
              >
                {console.log('Renderizando modal de paquete:', {
                  showPaqueteModal,
                  editingPaquete
                })}
                <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                    {editingPaquete ? 'Editar Paquete' : 'Nuevo Paquete'}
                  </h3>
                  <GenericForm
                    fields={paqueteFields}
                    initialValues={editingPaquete || {}}
                    onSubmit={
                      editingPaquete
                        ? (data) => {
                            console.log(
                              'Enviando datos de actualización:',
                              data
                            )
                            handleUpdatePaquete(editingPaquete.codigo, data)
                          }
                        : (data) => {
                            console.log('Enviando datos de creación:', data)
                            handleAddPaquete(data)
                          }
                    }
                    onCancel={() => {
                      console.log('Cancelando formulario')
                      closeModals()
                    }}
                    submitText={editingPaquete ? 'Actualizar' : 'Crear'}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configuración de Colores */}
        {activeTab === 'colores' && (
          <div className='space-y-6'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              Personalización de Colores por Categoría
            </h3>
            <CategoryColorConfig
              categorias={categorias}
              onSave={handleSaveClubConfig}
              clubConfig={clubConfig}
            />
          </div>
        )}

        {/* Configuración de Pagos */}
        {activeTab === 'pagos' && (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Configuración de Pagos
              </h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Porcentaje de IVA (%)
                  </label>
                  <input
                    type='number'
                    value={paymentConfig.iva_porcentaje}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        iva_porcentaje: Number(e.target.value)
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Moneda
                  </label>
                  <select
                    value={paymentConfig.moneda}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        moneda: e.target.value
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  >
                    <option value='USD'>USD ($)</option>
                    <option value='EUR'>EUR (€)</option>
                    <option value='PEN'>PEN (S/)</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Días de Vencimiento por Defecto
                  </label>
                  <input
                    type='number'
                    value={paymentConfig.dias_vencimiento}
                    onChange={(e) =>
                      setPaymentConfig({
                        ...paymentConfig,
                        dias_vencimiento: Number(e.target.value)
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
              </div>
              <div className='mt-4'>
                <button
                  onClick={() => handleSaveClubConfig({ paymentConfig })}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2'
                >
                  <Save className='w-4 h-4' />
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Configuración de Notificaciones */}
        {activeTab === 'notificaciones' && (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Configuración de Notificaciones
              </h3>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Días antes de vencimiento para alerta
                  </label>
                  <input
                    type='number'
                    value={notificationConfig.alertas_vencimiento}
                    onChange={(e) =>
                      setNotificationConfig({
                        ...notificationConfig,
                        alertas_vencimiento: Number(e.target.value)
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                    Días antes de pago para recordatorio
                  </label>
                  <input
                    type='number'
                    value={notificationConfig.recordatorios_pago}
                    onChange={(e) =>
                      setNotificationConfig({
                        ...notificationConfig,
                        recordatorios_pago: Number(e.target.value)
                      })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                </div>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={notificationConfig.notificaciones_nuevos_alumnos}
                    onChange={(e) =>
                      setNotificationConfig({
                        ...notificationConfig,
                        notificaciones_nuevos_alumnos: e.target.checked
                      })
                    }
                    className='mr-2'
                  />
                  <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Notificar nuevos alumnos
                  </label>
                </div>
                <div className='flex items-center'>
                  <input
                    type='checkbox'
                    checked={notificationConfig.email_notificaciones}
                    onChange={(e) =>
                      setNotificationConfig({
                        ...notificationConfig,
                        email_notificaciones: e.target.checked
                      })
                    }
                    className='mr-2'
                  />
                  <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                    Habilitar notificaciones por email
                  </label>
                </div>
              </div>
              <div className='mt-4'>
                <button
                  onClick={() => handleSaveClubConfig({ notificationConfig })}
                  className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2'
                >
                  <Save className='w-4 h-4' />
                  Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Configuración de Tema */}
        {activeTab === 'tema' && (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Configuración de Tema
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h4 className='font-medium text-gray-900 dark:text-white'>
                      Modo Oscuro
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400'>
                      Cambiar entre tema claro y oscuro
                    </p>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className='p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                  >
                    {isDarkMode ? (
                      <Sun className='w-6 h-6' />
                    ) : (
                      <Moon className='w-6 h-6' />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configuración de Backup */}
        {activeTab === 'backup' && (
          <div className='space-y-6'>
            <div className='bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
                Backup y Restauración
              </h3>

              {/* Instrucciones para convertir CSV a Excel */}
              <div className='bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6'>
                <div className='flex items-start gap-3 mb-4'>
                  <Info className='w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0' />
                  <h4 className='font-medium text-blue-900 dark:text-blue-100'>
                    Cómo convertir CSV a Excel
                  </h4>
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='text-sm text-blue-800 dark:text-blue-200'>
                    <p className='font-semibold mb-2'>
                      <strong>Método 1 - Excel:</strong>
                    </p>
                    <ol className='list-decimal list-inside space-y-1'>
                      <li>Abre Excel</li>
                      <li>
                        Ve a <strong>Datos</strong> →{' '}
                        <strong>Obtener datos</strong> →{' '}
                        <strong>Desde archivo</strong> →{' '}
                        <strong>Desde texto/CSV</strong>
                      </li>
                      <li>Selecciona el archivo CSV descargado</li>
                      <li>
                        Configura la codificación como <strong>UTF-8</strong>
                      </li>
                      <li>
                        Haz clic en <strong>Cargar</strong>
                      </li>
                    </ol>
                  </div>

                  <div className='text-sm text-blue-800 dark:text-blue-200'>
                    <p className='font-semibold mb-2'>
                      <strong>Método 2 - Google Sheets:</strong>
                    </p>
                    <ol className='list-decimal list-inside space-y-1'>
                      <li>Abre Google Sheets</li>
                      <li>
                        Ve a <strong>Archivo</strong> →{' '}
                        <strong>Importar</strong>
                      </li>
                      <li>Sube el archivo CSV</li>
                      <li>Configura las opciones de importación</li>
                      <li>
                        Haz clic en <strong>Importar datos</strong>
                      </li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <div>
                  <h4 className='font-medium text-gray-900 dark:text-white mb-2'>
                    Exportar Datos
                  </h4>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                    Descarga una copia de seguridad de todas las tablas del
                    sistema en formato CSV. Cada tabla se exportará como un
                    archivo separado con la fecha actual.
                  </p>
                  <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3'>
                    <p className='text-sm text-gray-700 dark:text-gray-300'>
                      <strong>Tablas que se exportarán:</strong>
                    </p>
                    <div className='grid grid-cols-2 md:grid-cols-3 gap-1 mt-2 text-xs text-gray-600 dark:text-gray-400'>
                      <span>• Alumnos</span>
                      <span>• Profesores</span>
                      <span>• Paquetes</span>
                      <span>• Precios</span>
                      <span>• Modos de Pago</span>
                      <span>• Gestores</span>
                      <span>• Categorías</span>
                      <span>• Pagos</span>
                      <span>• Resumen</span>
                      <span>• Inscripciones</span>
                      <span>• Usuarios</span>
                    </div>
                  </div>
                  <button
                    onClick={handleExportData}
                    className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2'
                  >
                    <Download className='w-4 h-4' />
                    Exportar Todas las Tablas (CSV)
                  </button>
                </div>
                <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
                  <h4 className='font-medium text-gray-900 dark:text-white mb-2'>
                    Importar Datos
                  </h4>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                    Restaura datos desde archivos de backup (funcionalidad en
                    desarrollo)
                  </p>
                  <button
                    disabled
                    className='px-4 py-2 bg-gray-400 text-white rounded-md cursor-not-allowed flex items-center gap-2'
                  >
                    <Upload className='w-4 h-4' />
                    Importar Datos (Próximamente)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
