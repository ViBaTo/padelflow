import { TrendingUp, TrendingDown } from 'lucide-react'

export function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  trend
}) {
  return (
    <div className='p-4 sm:p-6 bg-white rounded-lg shadow dark:bg-gray-800 min-w-0'>
      <div className='flex items-center justify-between gap-3'>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-medium text-gray-500 dark:text-gray-400 truncate'>
            {title}
          </p>
          <p className='mt-2 text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white truncate'>
            {value}
          </p>
          <p className='text-sm text-gray-600 dark:text-gray-400 mt-1 truncate'>
            {description}
          </p>
        </div>
        <div className='flex flex-col items-end flex-shrink-0'>
          <div className='p-2 sm:p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg'>
            <Icon className='w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400' />
          </div>
          {trend && (
            <div className='flex items-center mt-2 text-sm'>
              {trend.isPositive ? (
                <TrendingUp className='w-4 h-4 text-green-500 mr-1 flex-shrink-0' />
              ) : (
                <TrendingDown className='w-4 h-4 text-red-500 mr-1 flex-shrink-0' />
              )}
              <span
                className={`${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                } flex-shrink-0`}
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
