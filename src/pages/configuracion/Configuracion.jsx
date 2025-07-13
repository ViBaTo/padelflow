import { useState, useEffect } from 'react'
import { db, supabase } from '../../lib/supabase'
import { useStore } from '../../lib/store'
import { CategoryColorConfig } from '../../components/CategoryColorConfig'
import { GenericForm } from '../../components/GenericForm'
import { PlanInfo } from '../../components/PlanInfo'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '../../components/ui/card'
import { Alert } from '../../components/ui/Alert'
import { exportAllTablesAsCSV } from '../../lib/utils'
import { uploadFile, deleteFile, getSignedUrl } from '../../lib/storage'
import { useNavigate } from 'react-router-dom'
import { componentClasses, designTokens } from '../../lib/designTokens'
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
  Smartphone,
  Image,
  X,
  MapPin
} from 'lucide-react'

// Definir campos de formularios fuera del componente para evitar recalculos
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

const canchaFields = [
  {
    name: 'nombre',
    label: 'Nombre de la cancha',
    type: 'text',
    required: true,
    placeholder: 'Ej: Cancha 1, Cancha Central, etc.'
  },
  {
    name: 'tipo_superficie',
    label: 'Tipo de superficie',
    type: 'select',
    options: [
      { value: 'cristal', label: 'Cristal' },
      { value: 'cesped', label: 'Césped' },
      { value: 'cemento', label: 'Cemento' }
    ],
    required: true
  },
  {
    name: 'techada',
    label: 'Techada',
    type: 'select',
    options: [
      { value: true, label: 'Sí' },
      { value: false, label: 'No' }
    ],
    required: true
  },
  {
    name: 'iluminacion',
    label: 'Iluminación',
    type: 'select',
    options: [
      { value: true, label: 'Sí' },
      { value: false, label: 'No' }
    ],
    required: true
  },
  {
    name: 'capacidad_maxima',
    label: 'Capacidad máxima',
    type: 'number',
    required: false,
    placeholder: '4'
  },
  {
    name: 'precio_por_hora',
    label: 'Precio por hora (opcional)',
    type: 'number',
    required: false,
    placeholder: '0.00'
  },
  {
    name: 'estado',
    label: 'Estado',
    type: 'select',
    options: [
      { value: 'DISPONIBLE', label: 'Disponible' },
      { value: 'MANTENIMIENTO', label: 'En mantenimiento' },
      { value: 'FUERA_SERVICIO', label: 'Fuera de servicio' }
    ],
    required: true
  }
]

export function Configuracion() {
  const {
    user,
    isDarkMode,
    toggleDarkMode,
    clubConfig,
    updateClubConfig,
    userOrganization: organization
  } = useStore()
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
  // Estados para el logo
  const [logoFile, setLogoFile] = useState(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoUrl, setLogoUrl] = useState(null)
  // Estados para canchas
  const [canchas, setCanchas] = useState([])
  const [showCanchaModal, setShowCanchaModal] = useState(false)
  const [editingCancha, setEditingCancha] = useState(null)

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

  // Estados para diferentes configuraciones (inicializados con valores por defecto)
  const [clubInfo, setClubInfo] = useState({
    nombre: 'LaPala Club',
    direccion: '',
    telefono: '',
    email: '',
    website: '',
    zona_horaria: 'America/Guayaquil'
  })

  const [paymentConfig, setPaymentConfig] = useState({
    iva_porcentaje: 18,
    moneda: 'USD',
    modos_pago: ['efectivo', 'transferencia', 'tarjeta'],
    dias_vencimiento: 30
  })

  const [notificationConfig, setNotificationConfig] = useState({
    alertas_vencimiento: 7,
    recordatorios_pago: 3,
    notificaciones_nuevos_alumnos: true,
    email_notificaciones: false
  })

  useEffect(() => {
    const initializeData = async () => {
      try {
        await Promise.all([fetchData(), loadOrganizationConfig()])
      } catch (error) {
        console.error('Error al inicializar datos:', error)
        setError('Error al cargar configuración inicial')
        setLoading(false) // 🔧 Asegurar que loading se termine incluso en error
      }
    }

    initializeData()
  }, [])

  // Función para cargar configuración desde la organización
  const loadOrganizationConfig = async () => {
    try {
      if (!organization?.id_organizacion) {
        console.log(
          '⚠️ No hay organización disponible, usando valores por defecto'
        )
        return
      }

      console.log('🔄 Cargando configuración de la organización...')
      const { data: orgData, error } = await db.getCurrentOrganization()

      if (error) {
        console.error('❌ Error cargando organización:', error)
        // No mostrar error al usuario aquí, solo loggear
        return
      }

      if (!orgData) {
        console.log(
          '⚠️ No se encontraron datos de organización, usando valores por defecto'
        )
        return
      }

      console.log('✅ Datos de organización cargados:', orgData)

      // Actualizar información básica del club
      setClubInfo({
        nombre: orgData.nombre || 'LaPala Club',
        direccion: orgData.direccion || '',
        telefono: orgData.telefono || '',
        email: orgData.email || '',
        website: orgData.sitio_web || '',
        zona_horaria: orgData.zona_horaria || 'America/Guayaquil'
      })

      // Parsear configuración JSON
      let configData = {}
      try {
        configData = orgData.configuracion
          ? JSON.parse(orgData.configuracion)
          : {}
      } catch (err) {
        console.warn('⚠️ Error parsing organization config JSON:', err)
        configData = {}
      }

      // Cargar configuración de pagos desde JSON + moneda desde campo directo
      const paymentConfigFromDB = {
        iva_porcentaje: configData.pagos?.iva_porcentaje || 18,
        moneda: orgData.moneda || 'USD',
        modos_pago: configData.pagos?.modos_pago || [
          'efectivo',
          'transferencia',
          'tarjeta'
        ],
        dias_vencimiento: configData.pagos?.dias_vencimiento || 30
      }

      setPaymentConfig(paymentConfigFromDB)

      // Cargar configuración de notificaciones desde JSON
      const notificationConfigFromDB = {
        alertas_vencimiento:
          configData.notificaciones?.alertas_vencimiento || 7,
        recordatorios_pago: configData.notificaciones?.recordatorios_pago || 3,
        notificaciones_nuevos_alumnos:
          configData.notificaciones?.notificaciones_nuevos_alumnos !== false,
        email_notificaciones:
          configData.notificaciones?.email_notificaciones || false
      }

      setNotificationConfig(notificationConfigFromDB)

      // También actualizar el localStorage para compatibilidad
      if (configData.pagos || configData.notificaciones) {
        const clubConfigUpdate = {}
        if (configData.pagos)
          clubConfigUpdate.paymentConfig = paymentConfigFromDB
        if (configData.notificaciones)
          clubConfigUpdate.notificationConfig = notificationConfigFromDB
        updateClubConfig(clubConfigUpdate)
      }

      console.log('✅ Configuración cargada desde organización')
    } catch (err) {
      console.error('❌ Error en loadOrganizationConfig:', err)
    }
  }

  // Cargar URL del logo cuando cambie la organización
  useEffect(() => {
    console.log('🔄 Organization effect triggered:', {
      organization: organization?.id_organizacion,
      logo: organization?.logo,
      name: organization?.nombre
    })

    if (organization?.logo) {
      // Usar Supabase para obtener la URL pública del logo
      const { data } = supabase.storage
        .from('logos')
        .getPublicUrl(organization.logo)
      console.log('🖼️ Logo URL generated:', data?.publicUrl)
      setLogoUrl(data?.publicUrl || null)
    } else {
      console.log('📷 No logo found for organization')
      setLogoUrl(null)
    }
  }, [organization?.logo])

  // Recargar configuración cuando cambie la organización
  useEffect(() => {
    if (organization?.id_organizacion) {
      loadOrganizationConfig()
    }
  }, [organization?.id_organizacion])

  const fetchData = async () => {
    setLoading(true)
    setError(null) // 🆕 Limpiar errores previos

    try {
      console.log('🔄 Fetching configuration data...')

      // 🆕 Timeout de seguridad para fetchData
      const fetchPromise = Promise.all([
        db.getCategorias(),
        db.getPaquetes(),
        db.getCanchas()
      ])

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout al cargar datos')), 15000)
      )

      const [categoriaResult, paqueteResult, canchaResult] = await Promise.race(
        [fetchPromise, timeoutPromise]
      )

      const { data: cats, error: catError } = categoriaResult
      const { data: pqs, error: pqsError } = paqueteResult
      const { data: canchas, error: canchasError } = canchaResult

      if (catError) {
        console.error('Error loading categories:', catError)
        throw catError
      }
      if (pqsError) {
        console.error('Error loading packages:', pqsError)
        throw pqsError
      }
      if (canchasError) {
        console.error('Error loading courts:', canchasError)
        throw canchasError
      }

      setCategorias(cats || [])
      setPaquetes(pqs || [])
      setCanchas(canchas || [])

      console.log('✅ Configuration data loaded successfully')
      setError(null)
    } catch (err) {
      console.error('❌ Error en fetchData:', err)
      setError('Error al cargar configuración: ' + err.message)
    } finally {
      // 🔧 IMPORTANTE: Siempre terminar loading
      setLoading(false)
    }
  }

  const handleSaveClubConfig = async (config) => {
    try {
      setError(null)
      console.log('🔄 Guardando configuración del club:', config)
      console.log('🏢 Organización actual en store:', organization)

      // Mapear campos de configuración a campos de organizaciones
      const organizationUpdates = {}

      // Si es información básica del club (campos directos)
      if (config.nombre) organizationUpdates.nombre = config.nombre
      if (config.direccion !== undefined)
        organizationUpdates.direccion = config.direccion
      if (config.telefono !== undefined)
        organizationUpdates.telefono = config.telefono
      if (config.email !== undefined) organizationUpdates.email = config.email
      if (config.website !== undefined)
        organizationUpdates.sitio_web = config.website
      if (config.zona_horaria)
        organizationUpdates.zona_horaria = config.zona_horaria

      // Obtener configuración actual para merger
      const { data: currentOrg, error: currentError } =
        await db.getCurrentOrganization()
      if (currentError) {
        console.error('❌ Error obteniendo organización actual:', currentError)
        throw new Error('No se pudo obtener la información de la organización')
      }

      if (!currentOrg) {
        console.error('❌ No se encontró la organización actual')
        throw new Error('No se encontró la organización. Verifica tu sesión.')
      }

      let currentConfig = {}
      try {
        currentConfig = currentOrg?.configuracion
          ? JSON.parse(currentOrg.configuracion)
          : {}
      } catch (err) {
        console.warn(
          '⚠️ Error parsing current config JSON, starting fresh:',
          err
        )
        currentConfig = {}
      }

      // Si es configuración de pagos
      if (config.paymentConfig) {
        // Moneda va en campo directo
        if (config.paymentConfig.moneda)
          organizationUpdates.moneda = config.paymentConfig.moneda

        // Resto de configuración de pagos va en campo JSON
        currentConfig.pagos = {
          iva_porcentaje: config.paymentConfig.iva_porcentaje || 18,
          modos_pago: config.paymentConfig.modos_pago || [
            'efectivo',
            'transferencia',
            'tarjeta'
          ],
          dias_vencimiento: config.paymentConfig.dias_vencimiento || 30
        }
      }

      // Si es configuración de notificaciones
      if (config.notificationConfig) {
        currentConfig.notificaciones = {
          alertas_vencimiento:
            config.notificationConfig.alertas_vencimiento || 7,
          recordatorios_pago: config.notificationConfig.recordatorios_pago || 3,
          notificaciones_nuevos_alumnos:
            config.notificationConfig.notificaciones_nuevos_alumnos !== false,
          email_notificaciones:
            config.notificationConfig.email_notificaciones || false
        }
      }

      // Si es configuración de colores de categorías
      if (config.categoryColors) {
        currentConfig.colores_categorias = config.categoryColors
      }

      // Si hay cambios en la configuración JSON, guardarla
      if (
        config.paymentConfig ||
        config.notificationConfig ||
        config.categoryColors
      ) {
        organizationUpdates.configuracion = JSON.stringify(currentConfig)
      }

      // Actualizar solo si hay campos para actualizar
      if (Object.keys(organizationUpdates).length > 0) {
        console.log('📝 Actualizando organización con:', organizationUpdates)
        const { data, error } = await db.updateOrganization(organizationUpdates)

        console.log('📋 Resultado de updateOrganization - data:', data)
        console.log('📋 Resultado de updateOrganization - error:', error)

        if (error) {
          console.error('❌ Error específico en updateOrganization:', error)
          throw error
        }

        if (!data) {
          console.warn('⚠️ updateOrganization devolvió null/undefined')
          throw new Error(
            'La actualización no devolvió datos. Posible problema de permisos.'
          )
        }

        console.log('✅ Actualización exitosa, datos devueltos:', data)

        // Recargar la organización para actualizar el estado
        if (user?.id) {
          console.log('🔄 Recargando organización en el store...')
          const { loadUserOrganization } = useStore.getState()
          await loadUserOrganization(user.id)
          console.log('✅ Organización recargada en el store')
        }

        console.log('✅ Configuración actualizada en organizaciones:', data)
      } else {
        console.log('⚠️ No hay campos para actualizar')
      }

      // También mantener la actualización en localStorage para compatibilidad
      updateClubConfig(config)

      setSuccess('Configuración guardada correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('❌ Error al guardar configuración:', err)
      setError('Error al guardar configuración: ' + err.message)
      setTimeout(() => setError(null), 5000)
    }
  }

  // Función para subir logo del club
  const handleLogoUpload = async (file) => {
    console.log('🚀 handleLogoUpload called with:', {
      file: file?.name,
      organization: organization?.id_organizacion,
      user: user?.id
    })

    if (!file) {
      console.log('❌ No file provided')
      setError('No se seleccionó ningún archivo')
      return
    }

    if (!organization?.id_organizacion) {
      console.log('❌ No organization found')
      setError('No se encontró información de la organización')
      return
    }

    setUploadingLogo(true)
    setError(null)

    try {
      // Validar tipo de archivo
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Solo se permiten archivos PNG y JPG')
      }

      // Validar tamaño (máximo 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('El archivo no puede ser mayor a 5MB')
      }

      // Si ya existe un logo, eliminarlo primero
      if (organization.logo) {
        console.log('🗑️ Eliminando logo anterior:', organization.logo)
        await deleteFile('logos', organization.logo)
      }

      // Usar estructura de carpetas: organizationId/logo.extension
      const fileExtension = file.name.split('.').pop().toLowerCase()
      const fileName = `${organization.id_organizacion}/logo.${fileExtension}`

      console.log('📤 Subiendo nuevo logo:', fileName)
      // Subir archivo al bucket con la estructura de carpetas
      const { error: uploadError } = await uploadFile('logos', fileName, file)
      if (uploadError) throw uploadError

      console.log('📝 Actualizando referencia en base de datos')
      // Usar la función auxiliar para actualizar la organización
      const { data: rpcData, error: updateError } = await supabase.rpc(
        'update_organization_logo',
        {
          org_id: organization.id_organizacion,
          logo_url: fileName
        }
      )

      if (updateError) throw updateError

      if (!rpcData) {
        throw new Error('No se pudo actualizar el logo en la base de datos')
      }

      console.log('🔄 Recargando organización')
      // Recargar la organización para actualizar el sidebar
      if (user?.id) {
        const { loadUserOrganization } = useStore.getState()
        await loadUserOrganization(user.id)
      }

      setSuccess('Logo actualizado correctamente')
      setLogoFile(null)
    } catch (err) {
      console.error('❌ Error al subir logo:', err)
      setError('Error al subir logo: ' + err.message)
    } finally {
      setUploadingLogo(false)
    }
  }

  // Función para eliminar logo
  const handleDeleteLogo = async () => {
    if (!organization?.logo || !organization?.id_organizacion) return

    if (
      !window.confirm('¿Estás seguro de que quieres eliminar el logo del club?')
    )
      return

    setUploadingLogo(true)
    setError(null)

    try {
      console.log('🗑️ Eliminando logo del storage:', organization.logo)
      // Eliminar archivo del storage
      const { error: deleteError } = await deleteFile(
        'logos',
        organization.logo
      )
      if (deleteError) {
        console.warn('⚠️ Error al eliminar archivo del storage:', deleteError)
        // Continuar aunque falle el borrado del archivo
      }

      console.log('📝 Eliminando referencia en base de datos')
      // Usar la función auxiliar para actualizar la organización
      const { data: rpcData, error: updateError } = await supabase.rpc(
        'update_organization_logo',
        {
          org_id: organization.id_organizacion,
          logo_url: null
        }
      )

      if (updateError) throw updateError

      if (!rpcData) {
        throw new Error('No se pudo eliminar el logo de la base de datos')
      }

      console.log('🔄 Recargando organización')
      // Recargar la organización para actualizar el sidebar
      if (user?.id) {
        const { loadUserOrganization } = useStore.getState()
        await loadUserOrganization(user.id)
      }

      setSuccess('Logo eliminado correctamente')
    } catch (err) {
      console.error('❌ Error al eliminar logo:', err)
      setError('Error al eliminar logo: ' + err.message)
    } finally {
      setUploadingLogo(false)
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

  // Función para generar código automático de cancha
  const generateCanchaCode = () => {
    const existingCodes = canchas
      .map((cancha) => cancha.codigo || '')
      .filter((code) => code.startsWith('CAN'))
    let nextNumber = 1

    // Encontrar el próximo número disponible
    while (
      existingCodes.includes(`CAN${nextNumber.toString().padStart(3, '0')}`)
    ) {
      nextNumber++
    }

    return `CAN${nextNumber.toString().padStart(3, '0')}`
  }

  const handleAddCancha = async (data) => {
    try {
      console.log('Agregando cancha:', data)
      setError(null)

      // Generar código automáticamente
      const codigoGenerado = generateCanchaCode()
      console.log('Código generado automáticamente:', codigoGenerado)

      // Limpiar y validar datos según la estructura real de la BD
      const cleanedData = {
        nombre: data.nombre?.toString().trim(),
        tipo_superficie: data.tipo_superficie?.toString().trim() || 'cristal',
        techada: data.techada === 'true' || data.techada === true,
        iluminacion: data.iluminacion === 'true' || data.iluminacion === true,
        capacidad_maxima: parseInt(data.capacidad_maxima) || 4,
        precio_por_hora: parseFloat(data.precio_por_hora) || null,
        codigo: codigoGenerado,
        estado: data.estado?.toString().trim() || 'DISPONIBLE'
      }

      // Validar campos requeridos
      const requiredFields = ['nombre', 'tipo_superficie']
      const missingFields = requiredFields.filter(
        (field) => !cleanedData[field]
      )

      if (missingFields.length > 0) {
        throw new Error(`Campos faltantes: ${missingFields.join(', ')}`)
      }

      console.log('Datos limpios para agregar cancha:', cleanedData)
      const { data: result, error } = await db.addCancha(cleanedData)
      if (error) {
        console.error('Error en addCancha:', error)
        throw error
      }

      console.log('Cancha agregada exitosamente')
      setShowCanchaModal(false)
      fetchData()
      setSuccess(`Cancha creada correctamente con código: ${codigoGenerado}`)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err) {
      console.error('Error completo:', err)
      setError('Error al crear cancha: ' + err.message)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleUpdateCancha = async (id_cancha, data) => {
    try {
      console.log('Actualizando cancha:', { id_cancha, data })
      setError(null)

      // Limpiar y validar datos según la estructura real de la BD
      // Nota: El código no se actualiza, es inmutable una vez generado
      const cleanedData = {
        nombre: data.nombre?.toString().trim(),
        tipo_superficie: data.tipo_superficie?.toString().trim() || 'cristal',
        techada: data.techada === 'true' || data.techada === true,
        iluminacion: data.iluminacion === 'true' || data.iluminacion === true,
        capacidad_maxima: parseInt(data.capacidad_maxima) || 4,
        precio_por_hora: parseFloat(data.precio_por_hora) || null,
        estado: data.estado?.toString().trim() || 'DISPONIBLE'
      }

      // Validar campos requeridos
      const requiredFields = ['nombre', 'tipo_superficie']
      const missingFields = requiredFields.filter(
        (field) => !cleanedData[field]
      )

      if (missingFields.length > 0) {
        throw new Error(`Campos faltantes: ${missingFields.join(', ')}`)
      }

      console.log('Datos limpios:', cleanedData)
      const { error } = await db.updateCancha(id_cancha, cleanedData)
      if (error) {
        console.error('Error en updateCancha:', error)
        throw error
      }

      console.log('Cancha actualizada exitosamente')
      setEditingCancha(null)
      fetchData()
      setSuccess('Cancha actualizada correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error completo:', err)
      setError('Error al actualizar cancha: ' + err.message)
      setTimeout(() => setError(null), 5000)
    }
  }

  const handleDeleteCancha = async (id_cancha) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta cancha?'))
      return

    try {
      const { error } = await db.deleteCancha(id_cancha)
      if (error) throw error
      fetchData()
      setSuccess('Cancha eliminada correctamente')
    } catch (err) {
      setError('Error al eliminar cancha: ' + err.message)
    }
  }

  // Función para cerrar modales
  const closeModals = () => {
    console.log('Cerrando modales')
    setShowCategoryModal(false)
    setEditingCategory(null)
    setShowPaqueteModal(false)
    setEditingPaquete(null)
    setShowCanchaModal(false)
    setEditingCancha(null)
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

  // Campos ahora están definidos fuera del componente para evitar recalculos

  const tabs = [
    { id: 'club', label: 'Club', icon: Building },
    { id: 'plan', label: 'Plan', icon: Shield },
    { id: 'categorias', label: 'Categorías', icon: Users },
    { id: 'paquetes', label: 'Paquetes', icon: Package },
    { id: 'canchas', label: 'Canchas', icon: MapPin },
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
    <div
      className={`flex flex-col flex-1 h-full p-6 ${designTokens.backgrounds.page}`}
    >
      {/* Header */}
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1
            className={`${designTokens.typography.h1} ${designTokens.text.primary}`}
          >
            Configuración
          </h1>
          <p className={`${designTokens.text.secondary} mt-1`}>
            Gestiona la configuración del sistema
          </p>
        </div>
        <div className='flex items-center gap-2'>
          {success && (
            <Alert variant='success' className='text-sm'>
              {success}
            </Alert>
          )}
          {error && (
            <Alert variant='error' className='text-sm'>
              {error}
            </Alert>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={`${designTokens.borders.card} border-b mb-6`}>
        <nav className='-mb-px flex space-x-8'>
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  designTokens.transitions.colors
                } ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300'
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
            {/* Sección del Logo */}
            <Card>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between mb-3'>
                  <h3
                    className={`${designTokens.typography.h5} ${designTokens.text.primary} flex items-center gap-2`}
                  >
                    <Image className='w-5 h-5 text-indigo-600' />
                    Logo del Club
                  </h3>
                  {logoUrl && (
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={handleDeleteLogo}
                      disabled={uploadingLogo}
                      className='text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20'
                    >
                      <X className='w-3 h-3 mr-1' />
                      Eliminar
                    </Button>
                  )}
                </div>

                <div className='flex items-center gap-4'>
                  {/* Logo Actual - Más compacto */}
                  <div className='flex-shrink-0'>
                    <div className='w-16 h-16 border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden'>
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt='Logo del club'
                          className='w-full h-full object-contain'
                        />
                      ) : (
                        <Image className='w-8 h-8 text-gray-400' />
                      )}
                    </div>
                  </div>

                  {/* Subir Nuevo Logo - Más compacto */}
                  <div className='flex-1'>
                    <div className='border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-all duration-200'>
                      <input
                        type='file'
                        accept='.png,.jpg,.jpeg'
                        onChange={(e) => {
                          console.log('📁 File input onChange triggered')
                          const file = e.target.files[0]
                          if (file) {
                            console.log('📎 File selected:', {
                              name: file.name,
                              type: file.type,
                              size: file.size,
                              organization: organization?.id_organizacion
                            })
                            setLogoFile(file)
                            handleLogoUpload(file)
                          } else {
                            console.log('❌ No file selected')
                          }
                        }}
                        className='hidden'
                        id='logo-upload'
                        disabled={uploadingLogo}
                      />
                      <label
                        htmlFor='logo-upload'
                        className='cursor-pointer block'
                      >
                        <div className='flex items-center justify-center gap-2'>
                          {uploadingLogo ? (
                            <>
                              <div className='animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full' />
                              <span className='text-sm text-blue-600 font-medium'>
                                Subiendo...
                              </span>
                            </>
                          ) : (
                            <>
                              <Upload className='w-4 h-4 text-blue-600' />
                              <span className='text-sm text-blue-600 font-medium hover:text-blue-700'>
                                Subir nuevo logo
                              </span>
                            </>
                          )}
                        </div>
                        <p className='text-xs text-gray-500 mt-1'>
                          PNG, JPG • Máx. 5MB
                        </p>
                      </label>
                    </div>
                  </div>

                  {/* Estado del logo */}
                  <div className='flex-shrink-0 text-right'>
                    {logoUrl ? (
                      <div className='flex items-center gap-1 text-green-600'>
                        <div className='w-2 h-2 bg-green-500 rounded-full'></div>
                        <span className='text-xs font-medium'>Activo</span>
                      </div>
                    ) : (
                      <div className='flex items-center gap-1 text-gray-400'>
                        <div className='w-2 h-2 bg-gray-300 rounded-full'></div>
                        <span className='text-xs'>Sin logo</span>
                      </div>
                    )}
                  </div>
                </div>

                <p className='text-xs text-gray-500 dark:text-gray-400 mt-2 text-center'>
                  El logo aparecerá en el sidebar para todos los usuarios del
                  club
                </p>
              </CardContent>
            </Card>

            {/* Información del Club */}
            <Card>
              <CardContent className='p-6'>
                <h3
                  className={`${designTokens.typography.h5} ${designTokens.text.primary} mb-4`}
                >
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
                        setClubInfo({
                          ...clubInfo,
                          zona_horaria: e.target.value
                        })
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
                  <Button
                    variant='primary'
                    onClick={() => handleSaveClubConfig(clubInfo)}
                    className='flex items-center gap-2'
                  >
                    <Save className='w-4 h-4' />
                    Guardar Configuración
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuración del Plan */}
        {activeTab === 'plan' && (
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3
                  className={`${designTokens.typography.h5} ${designTokens.text.primary} mb-4 flex items-center gap-2`}
                >
                  <Shield className='w-5 h-5 text-indigo-600' />
                  Plan de Suscripción
                </h3>
                <PlanInfo />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gestión de Categorías */}
        {activeTab === 'categorias' && (
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex justify-between items-center mb-6'>
                  <h3
                    className={`${designTokens.typography.h5} ${designTokens.text.primary}`}
                  >
                    Categorías de Alumnos
                  </h3>
                  <Button
                    variant='primary'
                    size='sm'
                    onClick={() => setShowCategoryModal(true)}
                    className='flex items-center gap-2'
                  >
                    <Plus className='w-4 h-4' />
                    Nueva Categoría
                  </Button>
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
                        {editingCategory
                          ? 'Editar Categoría'
                          : 'Nueva Categoría'}
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gestión de Paquetes */}
        {activeTab === 'paquetes' && (
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex justify-between items-center mb-6'>
                  <h3
                    className={`${designTokens.typography.h5} ${designTokens.text.primary}`}
                  >
                    Gestión de Paquetes
                  </h3>
                  <Button
                    variant='primary'
                    size='sm'
                    onClick={() => setShowPaqueteModal(true)}
                    className='flex items-center gap-2'
                  >
                    <Plus className='w-4 h-4' />
                    Nuevo Paquete
                  </Button>
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
              </CardContent>
            </Card>
          </div>
        )}

        {/* Gestión de Canchas */}
        {activeTab === 'canchas' && (
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
                  <div>
                    <h3
                      className={`${designTokens.typography.h5} ${designTokens.text.primary} flex items-center gap-2`}
                    >
                      <MapPin className='w-5 h-5 text-indigo-600' />
                      Gestión de Canchas
                    </h3>
                    <p className={`${designTokens.text.secondary} mt-1`}>
                      Configura y gestiona las canchas disponibles para reservas
                    </p>
                    <p className='text-xs text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1'>
                      <span>💡</span>
                      <span>
                        El código se genera automáticamente (CAN001, CAN002,
                        etc.)
                      </span>
                    </p>
                  </div>
                  <Button
                    variant='primary'
                    size='sm'
                    onClick={() => setShowCanchaModal(true)}
                    className='flex items-center gap-2'
                  >
                    <Plus className='w-4 h-4' />
                    Nueva Cancha
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              {canchas.map((cancha) => (
                <Card key={cancha.id_cancha}>
                  <CardContent className='p-4'>
                    <div className='flex justify-between items-start mb-2'>
                      <div className='flex items-center gap-2'>
                        <div className='w-4 h-4 rounded bg-indigo-500'></div>
                        <div>
                          <h4
                            className={`${designTokens.typography.h6} ${designTokens.text.primary}`}
                          >
                            {cancha.nombre}
                          </h4>
                          {cancha.codigo && (
                            <p className='text-xs text-indigo-600 dark:text-indigo-400 font-mono'>
                              {cancha.codigo}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className='flex gap-1'>
                        <button
                          onClick={() => {
                            console.log('Editando cancha:', cancha)
                            setEditingCancha(cancha)
                          }}
                          className='p-1 text-gray-400 hover:text-blue-600'
                        >
                          <Edit2 className='w-4 h-4' />
                        </button>
                        <button
                          onClick={() => handleDeleteCancha(cancha.id_cancha)}
                          className='p-1 text-gray-400 hover:text-red-600'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                    <div className='space-y-1 text-sm'>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          Superficie:
                        </span>
                        <span className='font-medium capitalize'>
                          {cancha.tipo_superficie}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          Techada:
                        </span>
                        <span className='font-medium'>
                          {cancha.techada ? 'Sí' : 'No'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          Iluminación:
                        </span>
                        <span className='font-medium'>
                          {cancha.iluminacion ? 'Sí' : 'No'}
                        </span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          Capacidad:
                        </span>
                        <span className='font-medium'>
                          {cancha.capacidad_maxima || 4} personas
                        </span>
                      </div>
                      {cancha.precio_por_hora && cancha.precio_por_hora > 0 && (
                        <div className='flex justify-between'>
                          <span className='text-gray-600 dark:text-gray-400'>
                            Precio/hora:
                          </span>
                          <span className='font-medium text-green-600'>
                            €{cancha.precio_por_hora}
                          </span>
                        </div>
                      )}
                      <div className='flex justify-between'>
                        <span className='text-gray-600 dark:text-gray-400'>
                          Estado:
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            cancha.estado === 'DISPONIBLE'
                              ? 'bg-green-100 text-green-800'
                              : cancha.estado === 'MANTENIMIENTO'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {cancha.estado}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {canchas.length === 0 && (
              <div className='text-center py-12 text-gray-500 dark:text-gray-400'>
                <MapPin className='w-16 h-16 mx-auto mb-6 opacity-50' />
                <h4 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
                  No hay canchas configuradas
                </h4>
                <p className='text-sm mb-6'>
                  Agrega tu primera cancha para empezar a gestionar reservas
                </p>
                <Button
                  variant='primary'
                  size='default'
                  onClick={() => setShowCanchaModal(true)}
                  className='flex items-center gap-2 mx-auto'
                >
                  <Plus className='w-5 h-5' />
                  Agregar Primera Cancha
                </Button>
              </div>
            )}

            {/* Modal para nueva/editar cancha */}
            {(showCanchaModal || editingCancha) && (
              <div
                className='fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]'
                onClick={handleOverlayClick}
              >
                {console.log('Renderizando modal de cancha:', {
                  showCanchaModal,
                  editingCancha
                })}
                <div className='bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                    {editingCancha ? 'Editar Cancha' : 'Nueva Cancha'}
                  </h3>
                  {!editingCancha && (
                    <p className='text-xs text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-1'>
                      <span>💡</span>
                      <span>
                        El código se asignará automáticamente al crear la cancha
                      </span>
                    </p>
                  )}
                  {editingCancha && (
                    <p className='text-xs text-gray-600 dark:text-gray-400 mb-4 flex items-center gap-1'>
                      <span>ℹ️</span>
                      <span>Código actual: {editingCancha.codigo}</span>
                    </p>
                  )}
                  <GenericForm
                    fields={canchaFields}
                    initialValues={editingCancha || {}}
                    onSubmit={
                      editingCancha
                        ? (data) => {
                            console.log(
                              'Enviando datos de actualización:',
                              data
                            )
                            handleUpdateCancha(editingCancha.id_cancha, data)
                          }
                        : (data) => {
                            console.log('Enviando datos de creación:', data)
                            handleAddCancha(data)
                          }
                    }
                    onCancel={() => {
                      console.log('Cancelando formulario')
                      closeModals()
                    }}
                    submitText={editingCancha ? 'Actualizar' : 'Crear'}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Configuración de Colores */}
        {activeTab === 'colores' && (
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3
                  className={`${designTokens.typography.h5} ${designTokens.text.primary} mb-4`}
                >
                  Personalización de Colores por Categoría
                </h3>
                <CategoryColorConfig
                  categorias={categorias}
                  onSave={handleSaveClubConfig}
                  clubConfig={clubConfig}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuración de Pagos */}
        {activeTab === 'pagos' && (
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3
                  className={`${designTokens.typography.h5} ${designTokens.text.primary} mb-4`}
                >
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
                  <Button
                    variant='primary'
                    onClick={() => handleSaveClubConfig({ paymentConfig })}
                    className='flex items-center gap-2'
                  >
                    <Save className='w-4 h-4' />
                    Guardar Configuración
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuración de Notificaciones */}
        {activeTab === 'notificaciones' && (
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3
                  className={`${designTokens.typography.h5} ${designTokens.text.primary} mb-4`}
                >
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
                  <Button
                    variant='primary'
                    onClick={() => handleSaveClubConfig({ notificationConfig })}
                    className='flex items-center gap-2'
                  >
                    <Save className='w-4 h-4' />
                    Guardar Configuración
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuración de Tema */}
        {activeTab === 'tema' && (
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3
                  className={`${designTokens.typography.h5} ${designTokens.text.primary} mb-4`}
                >
                  Configuración de Tema
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <h4
                        className={`${designTokens.typography.h6} ${designTokens.text.primary}`}
                      >
                        Modo Oscuro
                      </h4>
                      <p className={`${designTokens.text.secondary}`}>
                        Cambiar entre tema claro y oscuro
                      </p>
                    </div>
                    <Button
                      variant='secondary'
                      size='sm'
                      onClick={toggleDarkMode}
                      className='p-3'
                    >
                      {isDarkMode ? (
                        <Sun className='w-6 h-6' />
                      ) : (
                        <Moon className='w-6 h-6' />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Configuración de Backup */}
        {activeTab === 'backup' && (
          <div className='space-y-6'>
            <Card>
              <CardContent className='p-6'>
                <h3
                  className={`${designTokens.typography.h5} ${designTokens.text.primary} mb-4`}
                >
                  Backup y Restauración
                </h3>

                {/* Instrucciones para convertir CSV a Excel */}
                <Alert
                  variant='info'
                  className='mb-6'
                  title='Cómo convertir CSV a Excel'
                >
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
                </Alert>

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
                    <Button
                      variant='primary'
                      onClick={handleExportData}
                      className='bg-green-600 hover:bg-green-700 flex items-center gap-2'
                    >
                      <Download className='w-4 h-4' />
                      Exportar Todas las Tablas (CSV)
                    </Button>
                  </div>
                  <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
                    <h4 className='font-medium text-gray-900 dark:text-white mb-2'>
                      Importar Datos
                    </h4>
                    <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                      Restaura datos desde archivos de backup (funcionalidad en
                      desarrollo)
                    </p>
                    <Button
                      variant='secondary'
                      disabled
                      className='cursor-not-allowed flex items-center gap-2'
                    >
                      <Upload className='w-4 h-4' />
                      Importar Datos (Próximamente)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
