import { useEffect, useState } from 'react'
import { db, supabase } from '../lib/supabase'
import { formatCurrency, formatDateSafe } from '../lib/utils'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardSubtitle
} from '../components/ui/Card'

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Heading, Text, Muted } from '../components/ui/Typography'
import { componentClasses, designTokens } from '../lib/designTokens'
import {
  Users,
  Calendar,
  GraduationCap,
  TrendingUp,
  TrendingDown,
  Clock,
  MapPin,
  Package,
  DollarSign,
  Activity,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Filter,
  Download,
  Eye,
  BarChart3
} from 'lucide-react'

export function Dashboard() {
  const [inscripciones, setInscripciones] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [paquetes, setPaquetes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeEnrollments, setActiveEnrollments] = useState([])
  const [timeFilter, setTimeFilter] = useState('month') // 'day', 'month', 'year'

  useEffect(() => {
    async function loadDashboardData() {
      try {
        console.log('🔄 Cargando datos del dashboard...')

        const [
          { data: inscData, error: inscError },
          { data: alsData, error: alsError },
          { data: pqsData, error: pqsError }
        ] = await Promise.all([
          supabase.from('inscripciones').select('*'),
          db.getAlumnos(),
          db.getPaquetes()
        ])

        if (inscError || alsError || pqsError) {
          console.error('Errores en carga:', { inscError, alsError, pqsError })
          throw inscError || alsError || pqsError
        }

        console.log('📊 Datos cargados:', {
          inscripciones: inscData?.length || 0,
          alumnos: alsData?.length || 0,
          paquetes: pqsData?.length || 0
        })

        setInscripciones(inscData || [])
        setAlumnos(alsData || [])
        setPaquetes(pqsData || [])

        const { data, error } = await db.getVistaInscripcionesActivas()
        if (!error) {
          setActiveEnrollments(data || [])
        }
      } catch (error) {
        console.error('❌ Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Métricas clave del negocio
  const totalAlumnosActivos = alumnos.filter(
    (a) => a.estado === 'activo'
  ).length
  const inscripcionesActivas = inscripciones.filter(
    (i) => i.estado === 'activo'
  ).length
  const totalIngresos = inscripciones
    .filter((i) => i.pagado)
    .reduce((sum, i) => {
      const paquete = paquetes.find((p) => p.codigo === i.codigo_paquete)
      return (
        sum + (paquete ? paquete.precio_con_iva * paquete.numero_clases : 0)
      )
    }, 0)

  // Datos para gráfico de distribución de paquetes
  const paquetesDistribution = paquetes
    .map((paquete) => {
      const count = inscripciones.filter(
        (i) => i.codigo_paquete === paquete.codigo
      ).length
      const ingresos = inscripciones
        .filter((i) => i.codigo_paquete === paquete.codigo && i.pagado)
        .reduce(
          (sum, i) => sum + paquete.precio_con_iva * paquete.numero_clases,
          0
        )

      return {
        nombre: paquete.nombre,
        count,
        ingresos,
        precio: paquete.precio_con_iva
      }
    })
    .sort((a, b) => b.ingresos - a.ingresos)

  // Inscripciones recientes (últimas 5)
  const inscripcionesRecientes = inscripciones
    .sort(
      (a, b) => new Date(b.fecha_inscripcion) - new Date(a.fecha_inscripcion)
    )
    .slice(0, 5)

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getAlumnoNombre = (cedula) =>
    alumnos.find((a) => a.cedula === cedula)?.nombre_completo || 'Desconocido'

  const getPaqueteNombre = (codigo) =>
    paquetes.find((p) => p.codigo === codigo)?.nombre || 'Desconocido'

  // Procesar datos para el gráfico de ingresos
  const getRevenueChartData = () => {
    if (!inscripciones.length || !paquetes.length) {
      return {
        labels: [],
        datasets: []
      }
    }

    let periods = []
    let revenueData = []

    if (timeFilter === 'day') {
      // Últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = formatDateSafe(date)
        periods.push(
          date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
          })
        )

        const dayRevenue = inscripciones
          .filter((i) => {
            const inscDate = new Date(i.fecha_inscripcion)
              .toISOString()
              .split('T')[0]
            return inscDate === dateStr && i.pagado
          })
          .reduce((sum, i) => {
            const paquete = paquetes.find((p) => p.codigo === i.codigo_paquete)
            return (
              sum +
              (paquete ? paquete.precio_con_iva * paquete.numero_clases : 0)
            )
          }, 0)

        revenueData.push(dayRevenue)
      }
    } else if (timeFilter === 'month') {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const monthStr = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`
        periods.push(
          date.toLocaleDateString('es-ES', {
            month: 'short',
            year: 'numeric'
          })
        )

        const monthRevenue = inscripciones
          .filter((i) => {
            const inscDate = new Date(i.fecha_inscripcion)
            const inscMonthStr = `${inscDate.getFullYear()}-${String(
              inscDate.getMonth() + 1
            ).padStart(2, '0')}`
            return inscMonthStr === monthStr && i.pagado
          })
          .reduce((sum, i) => {
            const paquete = paquetes.find((p) => p.codigo === i.codigo_paquete)
            return (
              sum +
              (paquete ? paquete.precio_con_iva * paquete.numero_clases : 0)
            )
          }, 0)

        revenueData.push(monthRevenue)
      }
    } else {
      // Últimos 5 años
      for (let i = 4; i >= 0; i--) {
        const year = new Date().getFullYear() - i
        periods.push(year.toString())

        const yearRevenue = inscripciones
          .filter((i) => {
            const inscYear = new Date(i.fecha_inscripcion).getFullYear()
            return inscYear === year && i.pagado
          })
          .reduce((sum, i) => {
            const paquete = paquetes.find((p) => p.codigo === i.codigo_paquete)
            return (
              sum +
              (paquete ? paquete.precio_con_iva * paquete.numero_clases : 0)
            )
          }, 0)

        revenueData.push(yearRevenue)
      }
    }

    return {
      labels: periods,
      datasets: [
        {
          label: 'Ingresos',
          data: revenueData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: 'white',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            return `Ingresos: $${context.parsed.y.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        ticks: {
          callback: function (value) {
            return '$' + value.toLocaleString()
          }
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  }

  if (isLoading) {
    return (
      <div className={componentClasses.pageContainer}>
        <div className='flex items-center justify-center min-h-screen'>
          <div className='text-center'>
            <div className={componentClasses.spinner}></div>
            <Text className='mt-4'>Cargando dashboard...</Text>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={componentClasses.pageContainer}>
      <div className='p-3 lg:p-4 max-w-7xl mx-auto space-y-4'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <div>
            <Heading level={1} className='mb-1'>
              Dashboard del Negocio
            </Heading>
            <Text variant='lead' className={designTokens.text.secondary}>
              Métricas clave para la gestión de tu club de pádel
            </Text>
          </div>
          <div className='flex gap-2'>
            <Button variant='secondary' size='sm'>
              <Download className='w-4 h-4 mr-2' />
              Exportar
            </Button>
            <Button size='sm'>
              <BarChart3 className='w-4 h-4 mr-2' />
              Reportes
            </Button>
          </div>
        </div>

        {/* Métricas clave del negocio */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
          {/* Alumnos Activos */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Alumnos Activos
                  </Text>
                  <Heading level={2} className='mt-1 mb-1'>
                    {totalAlumnosActivos}
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <Users className='w-4 h-4 text-blue-500 mr-1' />
                    <span className={designTokens.text.info}>
                      Capacidad actual
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-xl'>
                  <Users className='w-5 h-5 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inscripciones Activas */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Inscripciones Activas
                  </Text>
                  <Heading level={2} className='mt-1 mb-1'>
                    {inscripcionesActivas}
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <Activity className='w-4 h-4 text-green-500 mr-1' />
                    <span className={designTokens.text.success}>
                      Flujo de caja
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-green-500 to-emerald-600 p-2 rounded-xl'>
                  <Activity className='w-5 h-5 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ingresos Totales */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Ingresos Totales
                  </Text>
                  <Heading level={2} className='mt-1 mb-1'>
                    ${totalIngresos.toLocaleString()}
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <TrendingUp className='w-4 h-4 text-green-500 mr-1' />
                    <span className={designTokens.text.success}>
                      Salud financiera
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-purple-500 to-violet-600 p-2 rounded-xl'>
                  <DollarSign className='w-5 h-5 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Paquete Más Popular */}
          <Card className='group hover:shadow-2xl transition-all duration-300'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <Text variant='caption' className={designTokens.text.muted}>
                    Paquete Top
                  </Text>
                  <Heading level={2} className='mt-1 mb-1 text-sm'>
                    {paquetesDistribution[0]?.nombre || 'N/A'}
                  </Heading>
                  <div className='flex items-center text-sm'>
                    <Package className='w-4 h-4 text-orange-500 mr-1' />
                    <span className={designTokens.text.warning}>
                      {paquetesDistribution[0]?.count || 0} inscripciones
                    </span>
                  </div>
                </div>
                <div className='bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-xl'>
                  <Package className='w-5 h-5 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sección principal con gráficos */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-4'>
          {/* Gráfico de ingresos */}
          <div className='lg:col-span-2'>
            <Card className='h-[400px] flex flex-col'>
              <CardHeader className='flex-shrink-0'>
                <div className='flex items-center justify-between'>
                  <div>
                    <CardTitle>Gráfico de Ingresos</CardTitle>
                    <CardSubtitle>
                      Análisis temporal de la salud financiera
                    </CardSubtitle>
                  </div>
                  <div className='flex items-center gap-2'>
                    <select
                      value={timeFilter}
                      onChange={(e) => setTimeFilter(e.target.value)}
                      className='px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
                    >
                      <option value='day'>7 días</option>
                      <option value='month'>12 meses</option>
                      <option value='year'>5 años</option>
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className='flex-1 flex flex-col'>
                <div className='flex-1 min-h-0'>
                  <Line data={getRevenueChartData()} options={chartOptions} />
                </div>
                <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0'>
                  <div className='flex items-center justify-between'>
                    <Text variant='small' className={designTokens.text.muted}>
                      Total acumulado: ${totalIngresos.toLocaleString()}
                    </Text>
                    <div className='flex items-center space-x-2'>
                      <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                      <Text variant='small' className={designTokens.text.muted}>
                        Ingresos por{' '}
                        {timeFilter === 'day'
                          ? 'día'
                          : timeFilter === 'month'
                          ? 'mes'
                          : 'año'}
                      </Text>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Distribución de paquetes */}
          <div>
            <Card className='h-[400px] flex flex-col'>
              <CardHeader className='flex-shrink-0'>
                <CardTitle>Distribución de Paquetes</CardTitle>
                <CardSubtitle>
                  Optimización de ofertas por popularidad
                </CardSubtitle>
              </CardHeader>
              <CardContent className='flex-1 flex flex-col p-4'>
                <div className='flex-1 overflow-y-auto space-y-3 pr-2 min-h-0'>
                  {paquetesDistribution.map((paquete, index) => {
                    const totalInscripciones = paquetesDistribution.reduce(
                      (sum, p) => sum + p.count,
                      0
                    )
                    const percentage =
                      totalInscripciones > 0
                        ? ((paquete.count / totalInscripciones) * 100).toFixed(
                            1
                          )
                        : 0

                    const colors = [
                      'bg-blue-500',
                      'bg-green-500',
                      'bg-purple-500',
                      'bg-orange-500',
                      'bg-red-500'
                    ]

                    return (
                      <div key={paquete.nombre} className='space-y-2'>
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center space-x-3'>
                            <div
                              className={`w-3 h-3 rounded-full ${colors[index]}`}
                            ></div>
                            <Text variant='caption' className='font-medium'>
                              {paquete.nombre}
                            </Text>
                          </div>
                          <div className='text-right'>
                            <Text variant='small' className='font-semibold'>
                              {paquete.count}
                            </Text>
                            <Text
                              variant='small'
                              className={designTokens.text.muted}
                            >
                              {percentage}%
                            </Text>
                          </div>
                        </div>
                        <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${colors[index]}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <div className='text-right'>
                          <Text
                            variant='small'
                            className={designTokens.text.success}
                          >
                            ${paquete.ingresos.toLocaleString()} generados
                          </Text>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actividad reciente */}
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardSubtitle>Últimas inscripciones y movimientos</CardSubtitle>
              </div>
              <Button variant='secondary' size='sm'>
                <Eye className='w-4 h-4 mr-2' />
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {inscripcionesRecientes.map((inscripcion, index) => {
                const alumno = getAlumnoNombre(inscripcion.cedula_alumno)
                const paquete = getPaqueteNombre(inscripcion.codigo_paquete)
                const paqueteInfo = paquetes.find(
                  (p) => p.codigo === inscripcion.codigo_paquete
                )
                const monto = paqueteInfo
                  ? paqueteInfo.precio_con_iva * paqueteInfo.numero_clases
                  : 0

                return (
                  <div
                    key={inscripcion.id_inscripcion}
                    className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                  >
                    <div className='flex items-center space-x-4'>
                      <div className='bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg'>
                        <CreditCard className='w-4 h-4 text-white' />
                      </div>
                      <div>
                        <Text className='font-medium'>{alumno}</Text>
                        <Text
                          variant='small'
                          className={designTokens.text.muted}
                        >
                          {paquete} •{' '}
                          {formatDate(inscripcion.fecha_inscripcion)}
                        </Text>
                      </div>
                    </div>
                    <div className='text-right'>
                      <Text className='font-semibold text-green-600'>
                        +${monto.toLocaleString()}
                      </Text>
                      <Text variant='small' className={designTokens.text.muted}>
                        {inscripcion.pagado ? 'Pagado' : 'Pendiente'}
                      </Text>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
