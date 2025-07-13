import React from 'react'
import { designTokens } from '../../lib/designTokens'

export function Heading({ level = 2, children, className = '', ...props }) {
  const levels = {
    1: designTokens.typography.h1,
    2: designTokens.typography.h2,
    3: designTokens.typography.h3,
    4: designTokens.typography.h4,
    5: designTokens.typography.h5,
    6: designTokens.typography.h6
  }

  const Tag = `h${level}`
  const baseClasses = levels[level] || levels[2]

  return React.createElement(
    Tag,
    {
      className: `${baseClasses} ${designTokens.text.primary} ${className}`,
      ...props
    },
    children
  )
}

export function Text({
  variant = 'body',
  children,
  className = '',
  as = 'p',
  ...props
}) {
  const variants = {
    body: designTokens.typography.body,
    lead: designTokens.typography.lead,
    caption: designTokens.typography.caption,
    small: designTokens.typography.small
  }

  const baseClasses = variants[variant] || variants.body
  const textColor = designTokens.text.primary

  return React.createElement(
    as,
    {
      className: `${baseClasses} ${textColor} ${className}`,
      ...props
    },
    children
  )
}

export function Muted({ children, className = '', as = 'p', ...props }) {
  return React.createElement(
    as,
    {
      className: `${designTokens.typography.caption} ${designTokens.text.muted} ${className}`,
      ...props
    },
    children
  )
}

export function Lead({ children, className = '', as = 'p', ...props }) {
  return React.createElement(
    as,
    {
      className: `${designTokens.typography.lead} ${designTokens.text.primary} ${className}`,
      ...props
    },
    children
  )
}
