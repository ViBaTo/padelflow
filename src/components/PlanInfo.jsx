import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardSubtitle
} from './ui/card'
import { Button } from './ui/button'
import { Heading, Text, Muted } from './ui/Typography'
import { componentClasses, designTokens } from '../lib/designTokens'
import {
  Crown,
  Users,
  GraduationCap,
  Building,
  TrendingUp,
  Check,
  Zap,
  Star
} from 'lucide-react'

export function PlanInfo() {
  const [planData, setPlanData] = useState(null)
  const [usage, setUsage] = useState({
    alumnos: 0,
    profesores: 0,
    canchas: 0
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadPlanData()
  }, [])

  const loadPlanData = async () => {
    try {
      setIsLoading(true)

      // Simular datos del plan (en producción vendría de la API)
      const mockPlanData = {
        nombre: 'Premium',
        descripcion: 'Plan completo para clubes profesionales',
        precio_mensual: 99,
        limite_alumnos: 500,
        limite_profesores: 20,
        limite_canchas: 10,
        soporte_prioritario: true,
        reportes_avanzados: true,
        api_acceso: true,
        integraciones_externas: true
      }

      // Obtener datos de uso actuales
      const [alumnosResult, profesoresResult] = await Promise.all([
        supabase
          .from('alumnos')
          .select('id_alumno', { count: 'exact', head: true }),
        supabase
          .from('usuarios')
          .select('auth_user_id', { count: 'exact', head: true })
          .eq('rol', 'PROFESOR')
      ])

      const currentUsage = {
        alumnos: alumnosResult.count || 0,
        profesores: profesoresResult.count || 0,
        canchas: 6 // Valor simulado
      }

      setPlanData(mockPlanData)
      setUsage(currentUsage)
    } catch (error) {
      console.error('Error loading plan data:', error)
      // En caso de error, usar datos por defecto
      setPlanData({
        nombre: 'Premium',
        descripcion: 'Plan completo para clubes profesionales',
        precio_mensual: 99,
        limite_alumnos: 500,
        limite_profesores: 20,
        limite_canchas: 10,
        soporte_prioritario: true,
        reportes_avanzados: true,
        api_acceso: true,
        integraciones_externas: true
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getUsagePercentage = (current, max) => {
    return Math.round((current / max) * 100)
  }

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50 dark:bg-red-900/20'
    if (percentage >= 70)
      return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20'
    return 'text-green-600 bg-green-50 dark:bg-green-900/20'
  }

  const getProgressBarColor = (percentage) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // Si está cargando, mostrar una versión simplificada sin skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className='flex items-center space-x-3'>
            <div className='bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-2xl'>
              <Crown className='w-6 h-6 text-white' />
            </div>
            <div>
              <CardTitle>Cargando...</CardTitle>
              <CardSubtitle>Obteniendo información del plan</CardSubtitle>
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!planData) {
    return null // No mostrar nada si no hay datos
  }

  const usageMetrics = [
    {
      icon: Users,
      label: 'Alumnos',
      current: usage.alumnos,
      max: planData.limite_alumnos,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      icon: GraduationCap,
      label: 'Profesores',
      current: usage.profesores,
      max: planData.limite_profesores,
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Building,
      label: 'Canchas',
      current: usage.canchas,
      max: planData.limite_canchas,
      color: 'from-purple-500 to-violet-600'
    }
  ]

  const features = [
    {
      name: 'Soporte prioritario',
      enabled: planData.soporte_prioritario,
      icon: Star
    },
    {
      name: 'Reportes avanzados',
      enabled: planData.reportes_avanzados,
      icon: TrendingUp
    },
    { name: 'Acceso API', enabled: planData.api_acceso, icon: Zap },
    {
      name: 'Integraciones',
      enabled: planData.integraciones_externas,
      icon: Check
    }
  ]

  return (
    <Card className='bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-3'>
            <div className='bg-gradient-to-br from-purple-500 to-violet-600 p-3 rounded-2xl'>
              <Crown className='w-6 h-6 text-white' />
            </div>
            <div>
              <CardTitle>Plan {planData.nombre}</CardTitle>
              <CardSubtitle>{planData.descripcion}</CardSubtitle>
            </div>
          </div>
          <div className='text-right'>
            <Heading level={3} className={designTokens.text.primary}>
              ${planData.precio_mensual}
            </Heading>
            <Muted>/mes</Muted>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Métricas de uso */}
        <div>
          <Muted className='mb-4'>Uso actual del plan</Muted>
          <div className='space-y-4'>
            {usageMetrics.map((metric) => {
              const percentage = getUsagePercentage(metric.current, metric.max)
              const IconComponent = metric.icon

              return (
                <div key={metric.label} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div
                        className={`bg-gradient-to-br ${metric.color} p-2 rounded-lg`}
                      >
                        <IconComponent className='w-4 h-4 text-white' />
                      </div>
                      <Text variant='caption' className='font-medium'>
                        {metric.label}
                      </Text>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Text variant='small' className={designTokens.text.muted}>
                        {metric.current} / {metric.max}
                      </Text>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(
                          percentage
                        )}`}
                      >
                        {percentage}%
                      </span>
                    </div>
                  </div>
                  <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor(
                        percentage
                      )}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Características del plan */}
        <div>
          <Muted className='mb-4'>Características incluidas</Muted>
          <div className='grid grid-cols-2 gap-3'>
            {features.map((feature) => {
              const IconComponent = feature.icon

              return (
                <div
                  key={feature.name}
                  className={`flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                    feature.enabled
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-400'
                  }`}
                >
                  <IconComponent className='w-4 h-4 flex-shrink-0' />
                  <Text variant='small' className='truncate'>
                    {feature.name}
                  </Text>
                </div>
              )
            })}
          </div>
        </div>

        {/* Botón de upgrade */}
        <div className='pt-4 border-t border-purple-200 dark:border-purple-800'>
          <Button className='w-full bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 border-0'>
            <TrendingUp className='w-4 h-4 mr-2' />
            Mejorar plan
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
