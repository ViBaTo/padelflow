import React from 'react'
import {
  componentClasses,
  getButtonGradient,
  getButtonHoverGradient
} from '../../lib/designTokens'

export function Button({
  children,
  variant = 'primary',
  size = 'default',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const baseClasses =
    variant === 'primary'
      ? componentClasses.primaryButton
      : componentClasses.secondaryButton

  const sizeClasses = {
    sm: 'py-2 px-4 text-sm',
    default: 'py-4 px-6',
    lg: 'py-5 px-8 text-lg'
  }

  const widthClass = fullWidth ? 'w-full' : 'w-auto'

  const handleMouseEnter = (e) => {
    if (!isLoading && !disabled && variant === 'primary') {
      e.target.style.background = getButtonHoverGradient(variant)
    }
  }

  const handleMouseLeave = (e) => {
    if (!isLoading && !disabled && variant === 'primary') {
      e.target.style.background = getButtonGradient(isLoading, variant)
    }
  }

  const finalClasses =
    `${baseClasses} ${sizeClasses[size]} ${widthClass} ${className}`.replace(
      'w-full',
      widthClass
    ) // Replace default w-full with our width class

  const buttonStyle =
    variant === 'primary'
      ? {
          background: getButtonGradient(isLoading, variant)
        }
      : {}

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isLoading || disabled}
      className={finalClasses}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {isLoading ? <div className={componentClasses.spinner} /> : children}
    </button>
  )
}
