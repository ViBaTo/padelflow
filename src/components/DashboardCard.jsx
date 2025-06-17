import { TrendingUp, TrendingDown } from 'lucide-react'

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend
}) {
  return (
    <div className='p-6 bg-white rounded-lg shadow dark:bg-gray-800'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-gray-500 dark:text-gray-400'>
            {title}
          </p>
          <p className='mt-2 text-3xl font-semibold text-gray-900 dark:text-white'>
            {value}
          </p>
          <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
            {description}
          </p>
        </div>
        <div className='flex flex-col items-end'>
          <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
            <Icon className='w-6 h-6 text-blue-600 dark:text-blue-400' />
          </div>
          {trend && (
            <div className='flex items-center mt-2 text-sm'>
              {trend.isPositive ? (
                <TrendingUp className='w-4 h-4 text-green-500 mr-1' />
              ) : (
                <TrendingDown className='w-4 h-4 text-red-500 mr-1' />
              )}
              <span
                className={trend.isPositive ? 'text-green-600' : 'text-red-600'}
              >
                {trend.value}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
