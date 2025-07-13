import React from 'react'
import { componentClasses, designTokens } from '../../lib/designTokens'

export function Input({
  label,
  error,
  success,
  helperText,
  className = '',
  ...props
}) {
  const getInputClass = () => {
    if (error) return componentClasses.inputError
    if (success) return componentClasses.inputSuccess
    return componentClasses.input
  }

  const inputId = props.id || props.name

  return (
    <div className='w-full'>
      {label && (
        <label htmlFor={inputId} className={componentClasses.label}>
          {label}
          {success && (
            <span className={`ml-2 text-sm ${designTokens.text.success}`}>
              ✓ {typeof success === 'string' ? success : 'Válido'}
            </span>
          )}
          {error && (
            <span className={`ml-2 text-sm ${designTokens.text.error}`}>
              ✗ Error
            </span>
          )}
        </label>
      )}

      <input
        id={inputId}
        className={`${getInputClass()} ${className}`}
        {...props}
      />

      {error && (
        <p className={`mt-1 text-sm ${designTokens.text.error}`}>{error}</p>
      )}

      {success && typeof success === 'string' && (
        <p className={`mt-1 text-sm ${designTokens.text.success}`}>
          ✓ {success}
        </p>
      )}

      {helperText && !error && !success && (
        <p className={`mt-1 text-xs ${designTokens.text.muted}`}>
          {helperText}
        </p>
      )}
    </div>
  )
}

export function Label({ children, htmlFor, className = '', ...props }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`${componentClasses.label} ${className}`}
      {...props}
    >
      {children}
    </label>
  )
}
