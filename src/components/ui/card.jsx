import React from 'react'
import { componentClasses } from '../../lib/designTokens'

export function Card({ children, className = '', ...props }) {
  return (
    <div className={`${componentClasses.mainCard} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '', ...props }) {
  return (
    <div className={`${componentClasses.cardHeader} ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '', ...props }) {
  return (
    <h2
      className={`${componentClasses.cardHeaderTitle} ${className}`}
      {...props}
    >
      {children}
    </h2>
  )
}

export function CardSubtitle({ children, className = '', ...props }) {
  return (
    <p
      className={`${componentClasses.cardHeaderSubtitle} ${className}`}
      {...props}
    >
      {children}
    </p>
  )
}

export function CardContent({ children, className = '', ...props }) {
  return (
    <div className={`${componentClasses.cardContent} ${className}`} {...props}>
      {children}
    </div>
  )
}
