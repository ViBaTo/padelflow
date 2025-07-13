import React from 'react'
import { componentClasses, designTokens } from '../../lib/designTokens'
import { Check, X, AlertTriangle, Info } from 'lucide-react'

const alertIcons = {
  success: Check,
  error: X,
  warning: AlertTriangle,
  info: Info
}

const alertTextColors = {
  success: designTokens.text.success,
  error: designTokens.text.error,
  warning: designTokens.text.warning,
  info: designTokens.text.info
}

export function Alert({
  children,
  variant = 'info',
  title,
  showIcon = true,
  className = '',
  ...props
}) {
  const alertClasses = {
    success: componentClasses.successMessage,
    error: componentClasses.errorMessage,
    warning: componentClasses.warningMessage,
    info: componentClasses.infoMessage
  }

  const IconComponent = alertIcons[variant]

  return (
    <div className={`${alertClasses[variant]} ${className}`} {...props}>
      {showIcon && IconComponent && (
        <div className='flex-shrink-0'>
          <IconComponent className={`w-5 h-5 ${alertTextColors[variant]}`} />
        </div>
      )}
      <div className='flex-1'>
        {title && (
          <h4
            className={`text-sm font-semibold ${alertTextColors[variant]} mb-1`}
          >
            {title}
          </h4>
        )}
        <div className={`text-sm ${alertTextColors[variant]}`}>{children}</div>
      </div>
    </div>
  )
}
