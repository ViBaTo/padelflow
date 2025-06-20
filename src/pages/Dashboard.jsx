import { useEffect, useState } from 'react'
import { db, supabase } from '../lib/supabase'
import { formatCurrency } from '../lib/utils'
import { DashboardCard } from '../components/DashboardCard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Users,
  Calendar,
  GraduationCap,
  TrendingUp,
  Clock,
  MapPin,
  Package
} from 'lucide-react'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
)

export function Dashboard() {
  const [inscripciones, setInscripciones] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [paquetes, setPaquetes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeEnrollments, setActiveEnrollments] = useState([])
  const [activePage, setActivePage] = useState(1)
  const itemsPerPage = 5
  const totalPages = Math.ceil(activeEnrollments.length / itemsPerPage)
  const paginatedEnrollments = activeEnrollments.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  )

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [
          { data: inscData, error: inscError },
          { data: alsData, error: alsError },
          { data: pqsData, error: pqsError }
        ] = await Promise.all([
          supabase.from('inscripciones').select('*'), // Same as pagos page
          db.getAlumnos(),
          db.getPaquetes()
        ])

        console.log('Inscripciones:', inscData)
        console.log('Alumnos:', alsData)
        console.log('Paquetes:', pqsData)

        if (inscError || alsError || pqsError) {
          throw inscError || alsError || pqsError
        }

        setInscripciones(inscData || [])
        setAlumnos(alsData || [])
        setPaquetes(pqsData || [])

        const { data, error } = await db.getVistaInscripcionesActivas()
        if (!error) {
          setActiveEnrollments(data || [])
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getAlumnoNombre = (cedula) =>
    alumnos.find((a) => a.cedula === cedula)?.nombre_completo || cedula

  const getPaqueteNombre = (codigo) =>
    paquetes.find((p) => p.codigo === codigo)?.nombre || codigo

  const getPaqueteClases = (codigo) =>
    paquetes.find((p) => p.codigo === codigo)?.numero_clases || 0

  const getStatusColor = (status) => {
    switch (status) {
      case 'activo':
        return 'bg-green-100 text-green-800'
      case 'próximo a vencer':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressPercentage = (used, total) => {
    if (!total) return 0
    return Math.round((used / total) * 100)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha'
    return new Date(dateString).toLocaleDateString('es-ES')
  }

  if (isLoading) {
    return <div className='p-8 text-center'>Cargando...</div>
  }

  const totalInscripciones = inscripciones.length
  const inscripcionesActivas = inscripciones.filter(
    (i) => i.estado === 'activo'
  ).length
  const inscripcionesVencidas = inscripciones.filter(
    (i) => i.estado !== 'activo'
  ).length
  const totalIngresos = inscripciones
    .filter((i) => i.pagado)
    .reduce((sum, i) => {
      const paquete = paquetes.find((p) => p.codigo === i.codigo_paquete)
      const totalPaquete = paquete
        ? paquete.precio_con_iva * paquete.numero_clases
        : 0
      return sum + totalPaquete
    }, 0)

  const activeCount = activeEnrollments.filter(
    (e) => e.status === 'activo'
  ).length
  const expiringCount = activeEnrollments.filter(
    (e) => e.status === 'próximo a vencer'
  ).length
  const totalAlumnos = alumnos.length

  const groupedList = []
  const grouped = {}
  activeEnrollments.forEach((enr) => {
    const key = enr.studentName
    if (!grouped[key]) {
      grouped[key] = {
        studentName: enr.studentName,
        paquetes: []
      }
    }
    grouped[key].paquetes.push(enr.packageName)
  })
  for (const key in grouped) {
    groupedList.push(grouped[key])
  }

  // Calcular ingresos por mes
  const ingresosPorMes = Array(12).fill(0)
  inscripciones
    .filter((i) => i.pagado)
    .forEach((i) => {
      const paquete = paquetes.find((p) => p.codigo === i.codigo_paquete)
      if (!paquete || !i.fecha_inscripcion) return
      const fecha = new Date(i.fecha_inscripcion)
      const mes = fecha.getMonth() // 0 = enero
      ingresosPorMes[mes] += paquete.precio_con_iva * paquete.numero_clases
    })

  // Calcular variaciones reales para cada tarjeta
  // 1. Inscripciones: comparar este mes vs mes anterior
  const now = new Date()
  const thisMonth = now.getMonth()
  const lastMonth = (thisMonth - 1 + 12) % 12
  const inscripcionesEsteMes = inscripciones.filter((i) => {
    if (!i.fecha_inscripcion) return false
    const fecha = new Date(i.fecha_inscripcion)
    return (
      fecha.getMonth() === thisMonth &&
      fecha.getFullYear() === now.getFullYear()
    )
  }).length
  const inscripcionesMesAnterior = inscripciones.filter((i) => {
    if (!i.fecha_inscripcion) return false
    const fecha = new Date(i.fecha_inscripcion)
    return (
      fecha.getMonth() === lastMonth &&
      fecha.getFullYear() === now.getFullYear()
    )
  }).length
  const inscTrend =
    inscripcionesMesAnterior === 0
      ? 0
      : ((inscripcionesEsteMes - inscripcionesMesAnterior) /
          inscripcionesMesAnterior) *
        100

  // 2. Alumnos: comparar este mes vs mes anterior (por fecha_registro si existe)
  const alumnosEsteMes = alumnos.filter((a) => {
    if (!a.fecha_registro) return false
    const fecha = new Date(a.fecha_registro)
    return (
      fecha.getMonth() === thisMonth &&
      fecha.getFullYear() === now.getFullYear()
    )
  }).length
  const alumnosMesAnterior = alumnos.filter((a) => {
    if (!a.fecha_registro) return false
    const fecha = new Date(a.fecha_registro)
    return (
      fecha.getMonth() === lastMonth &&
      fecha.getFullYear() === now.getFullYear()
    )
  }).length
  const alumnosTrend =
    alumnosMesAnterior === 0
      ? 0
      : ((alumnosEsteMes - alumnosMesAnterior) / alumnosMesAnterior) * 100

  // 3. Próximas a vencer: comparar con el mes anterior
  const expiringEsteMes = activeEnrollments.filter((e) => {
    if (!e.fecha_vencimiento) return false
    const fecha = new Date(e.fecha_vencimiento)
    return (
      fecha.getMonth() === thisMonth &&
      fecha.getFullYear() === now.getFullYear() &&
      (fecha - now) / (1000 * 60 * 60 * 24) <= 7
    )
  }).length
  const expiringMesAnterior = activeEnrollments.filter((e) => {
    if (!e.fecha_vencimiento) return false
    const fecha = new Date(e.fecha_vencimiento)
    return (
      fecha.getMonth() === lastMonth &&
      fecha.getFullYear() === now.getFullYear() &&
      (fecha - now) / (1000 * 60 * 60 * 24) <= 7
    )
  }).length
  const expiringTrend =
    expiringMesAnterior === 0
      ? 0
      : ((expiringEsteMes - expiringMesAnterior) / expiringMesAnterior) * 100

  // 4. Ingresos: comparar este mes vs mes anterior
  const ingresosEsteMes = ingresosPorMes[thisMonth]
  const ingresosMesAnterior = ingresosPorMes[lastMonth]
  const ingresosTrend =
    ingresosMesAnterior === 0
      ? 0
      : ((ingresosEsteMes - ingresosMesAnterior) / ingresosMesAnterior) * 100

  return (
    <div className='space-y-8 px-2 py-4 sm:px-4 md:px-8 bg-gray-50 min-w-0'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600 mt-1'>
          Gestión de inscripciones activas a paquetes de clases.
        </p>
      </div>
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6'>
        <DashboardCard
          title='Total Inscripciones'
          value={totalInscripciones}
          description='Registradas en el sistema'
          icon={Package}
        />
        <DashboardCard
          title='Total Estudiantes'
          value={totalAlumnos}
          description='Miembros registrados'
          icon={Users}
        />
        <DashboardCard
          title='Próximas a vencer'
          value={expiringCount}
          description='Vencen en 7 días o menos'
          icon={Clock}
        />
        <DashboardCard
          title='Ingresos Totales'
          value={`$${totalIngresos.toLocaleString()}`}
          description='Recaudado del sistema'
          icon={TrendingUp}
        />
      </div>
      <div className='bg-white rounded-xl border border-gray-200 p-4 sm:p-6 w-full min-w-0'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>
          Ingresos por mes
        </h2>
        <div className='w-full h-32 min-w-0'>
          <Line
            data={{
              labels: [
                'Ene',
                'Feb',
                'Mar',
                'Abr',
                'May',
                'Jun',
                'Jul',
                'Ago',
                'Sep',
                'Oct',
                'Nov',
                'Dic'
              ],
              datasets: [
                {
                  label: 'Ingresos',
                  data: ingresosPorMes,
                  borderColor: 'rgba(37, 99, 235, 1)',
                  backgroundColor: 'rgba(37, 99, 235, 0.1)',
                  tension: 0.4,
                  fill: true,
                  pointRadius: 3,
                  pointHoverRadius: 5,
                  pointBackgroundColor: 'rgba(37, 99, 235, 1)',
                  borderWidth: 1
                }
              ]
            }}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                title: { display: false },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  titleColor: 'white',
                  bodyColor: 'white',
                  borderColor: 'rgba(37, 99, 235, 1)',
                  borderWidth: 1,
                  cornerRadius: 8,
                  displayColors: false,
                  callbacks: {
                    label: function (context) {
                      return `Ingresos: $${context.parsed.y.toLocaleString()}`
                    }
                  }
                }
              },
              scales: {
                x: {
                  beginAtZero: true,
                  grid: {
                    display: false
                  },
                  ticks: {
                    maxRotation: 0,
                    minRotation: 0,
                    font: {
                      size: 10
                    }
                  }
                },
                y: {
                  beginAtZero: true,
                  min: 0,
                  max: 10000,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                  },
                  ticks: {
                    font: {
                      size: 10
                    },
                    callback: function (value) {
                      return '$' + value.toLocaleString()
                    }
                  }
                }
              },
              interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
              },
              elements: {
                line: {
                  borderWidth: 1
                },
                point: {
                  hoverRadius: 6
                }
              }
            }}
          />
        </div>
      </div>
      <div className='w-full min-w-0'>
        <Card className='w-full min-w-0'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Package className='w-5 h-5 text-blue-600 flex-shrink-0' />
              <span className='truncate'>Inscripciones a Paquetes Activos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className='space-y-4 overflow-y-auto min-w-0'
              style={{ maxHeight: 350 }}
            >
              {activeEnrollments.map((enrollment) => {
                const daysToExpire = enrollment.fecha_vencimiento
                  ? Math.ceil(
                      (new Date(enrollment.fecha_vencimiento) - new Date()) /
                        (1000 * 60 * 60 * 24)
                    )
                  : null
                const status =
                  daysToExpire !== null && daysToExpire <= 7
                    ? 'próximo a vencer'
                    : 'activo'
                const progress = getProgressPercentage(
                  enrollment.clases_utilizadas,
                  enrollment.clases_totales
                )
                return (
                  <div
                    key={enrollment.id_inscripcion}
                    className='flex flex-col sm:flex-row sm:justify-between sm:items-stretch p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3 min-w-0'
                  >
                    <div className='flex flex-col flex-1 min-w-0 gap-1'>
                      <div className='text-sm font-semibold text-gray-900 truncate'>
                        {enrollment.nombre_completo}
                      </div>
                      <div className='text-xs text-gray-600 truncate'>
                        {enrollment.paquete}
                      </div>
                      <div className='flex items-center justify-between text-xs text-gray-600 mt-2 mb-1'>
                        <span>Progreso</span>
                        <span className='flex-shrink-0'>
                          {enrollment.clases_utilizadas}/
                          {enrollment.clases_totales} clases
                        </span>
                      </div>
                      <div className='w-full bg-gray-200 rounded-full h-2'>
                        <div
                          className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className='flex flex-row sm:flex-col sm:items-end sm:justify-between gap-2 sm:gap-0 sm:min-w-[120px] sm:pl-4'>
                      <div className='text-xs text-gray-600 flex-shrink-0'>
                        Vence: {formatDate(enrollment.fecha_vencimiento)}
                      </div>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          status
                        )} flex-shrink-0`}
                      >
                        {status}
                      </span>
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
