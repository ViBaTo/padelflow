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

export function Dashboard() {
  const [stats, setStats] = useState({
    alumnosActivos: 0,
    ingresosMes: 0,
    clasesProgramadas: 0
  })
  const [inscripciones, setInscripciones] = useState([])
  const [alumnos, setAlumnos] = useState([])
  const [paquetes, setPaquetes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeEnrollments, setActiveEnrollments] = useState([])

  useEffect(() => {
    async function loadDashboardData() {
      try {
        // Load all data exactly like in pagos page
        const [
          { data: statsData, error: statsError },
          { data: inscData, error: inscError },
          { data: alsData, error: alsError },
          { data: pqsData, error: pqsError }
        ] = await Promise.all([
          db.getResumen(),
          supabase.from('inscripciones').select('*'), // Same as pagos page
          db.getAlumnos(),
          db.getPaquetes()
        ])

        console.log('Stats data:', statsData)
        console.log('Inscripciones:', inscData)
        console.log('Alumnos:', alsData)
        console.log('Paquetes:', pqsData)

        if (statsError || inscError || alsError || pqsError) {
          throw statsError || inscError || alsError || pqsError
        }

        setStats(
          statsData[0] || {
            alumnosActivos: 0,
            ingresosMes: 0,
            clasesProgramadas: 0
          }
        )
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

  // Helper functions like in pagos page
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

  // Statistics like in pagos page
  const totalInscripciones = inscripciones.length
  const inscripcionesActivas = inscripciones.filter(
    (i) => i.estado === 'activo'
  ).length
  const inscripcionesVencidas = inscripciones.filter(
    (i) => i.estado !== 'activo'
  ).length
  const totalIngresos = inscripciones
    .filter((i) => i.pagado)
    .reduce((sum, i) => sum + (i.precio_pagado || 0), 0)

  const activeCount = activeEnrollments.filter(
    (e) => e.status === 'activo'
  ).length
  const expiringCount = activeEnrollments.filter(
    (e) => e.status === 'próximo a vencer'
  ).length
  const totalAlumnos = alumnos.length

  // Agrupar por nombre_completo
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

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-600 mt-1'>
          Gestión de inscripciones activas a paquetes de clases.
        </p>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <DashboardCard
          title='Total Inscripciones'
          value={totalInscripciones}
          description='Registradas en el sistema'
          icon={Package}
          trend={{ value: 5, isPositive: true }}
        />
        <DashboardCard
          title='Inscripciones Activas'
          value={inscripcionesActivas}
          description='Paquetes en curso'
          icon={Clock}
          trend={{ value: 2, isPositive: false }}
        />
        <DashboardCard
          title='Total Estudiantes'
          value={totalAlumnos}
          description='Miembros registrados'
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <DashboardCard
          title='Ingresos Totales'
          value={`$${totalIngresos.toLocaleString()}`}
          description='Recaudado del sistema'
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Active Enrollments */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Package className='w-5 h-5 text-blue-600' />
            Inscripciones a Paquetes Activos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
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
                  className='flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors'
                >
                  <div className='flex items-center gap-4 flex-1'>
                    <div className='min-w-0'>
                      <div className='text-sm font-semibold text-gray-900'>
                        {enrollment.nombre_completo}
                      </div>
                      <div className='text-xs text-gray-600'>
                        {enrollment.paquete}
                      </div>
                    </div>
                    <div className='flex-1 max-w-xs'>
                      <div className='flex items-center justify-between text-xs text-gray-600 mb-1'>
                        <span>Progreso</span>
                        <span>
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
                    <div className='text-right min-w-0'>
                      <div className='text-xs text-gray-600'>
                        Vence: {formatDate(enrollment.fecha_vencimiento)}
                      </div>
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
