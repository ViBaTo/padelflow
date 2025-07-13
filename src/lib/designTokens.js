// Design Tokens y clases reutilizables para el proyecto
export const designTokens = {
  // Fondos y gradientes
  backgrounds: {
    page: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900',
    card: 'bg-white dark:bg-gray-800',
    header: 'bg-gradient-to-r from-blue-500 to-indigo-600',
    success: 'bg-green-50 dark:bg-green-900/20',
    error: 'bg-red-50 dark:bg-red-900/50',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    info: 'bg-blue-50 dark:bg-blue-900/20'
  },

  // Bordes y sombras
  borders: {
    card: 'border border-gray-200 dark:border-gray-700',
    input: 'border border-gray-300 dark:border-gray-600',
    success: 'border border-green-200 dark:border-green-800',
    error: 'border border-red-200 dark:border-red-800',
    warning: 'border border-yellow-200 dark:border-yellow-800',
    info: 'border border-blue-200 dark:border-blue-800'
  },

  shadows: {
    card: 'shadow-xl',
    elevated: 'shadow-lg hover:shadow-xl',
    button: 'shadow-lg hover:shadow-xl'
  },

  // Esquinas redondeadas
  rounded: {
    card: 'rounded-2xl',
    input: 'rounded-lg',
    button: 'rounded-lg',
    small: 'rounded-lg',
    large: 'rounded-3xl'
  },

  // Textos
  text: {
    primary: 'text-gray-900 dark:text-white font-sans',
    secondary: 'text-gray-600 dark:text-gray-400 font-sans',
    muted: 'text-gray-500 dark:text-gray-400 font-sans',
    success: 'text-green-700 dark:text-green-300 font-sans',
    error: 'text-red-700 dark:text-red-300 font-sans',
    warning: 'text-yellow-700 dark:text-yellow-300 font-sans',
    info: 'text-blue-700 dark:text-blue-300 font-sans'
  },

  // Tipografía específica con Nunito Sans - Versión compacta
  typography: {
    h1: 'text-2xl font-bold font-sans tracking-tight',
    h2: 'text-xl font-bold font-sans tracking-tight',
    h3: 'text-lg font-bold font-sans tracking-tight',
    h4: 'text-base font-semibold font-sans',
    h5: 'text-sm font-semibold font-sans',
    h6: 'text-sm font-semibold font-sans',
    body: 'text-sm font-normal font-sans',
    caption: 'text-xs font-normal font-sans',
    small: 'text-xs font-normal font-sans',
    lead: 'text-base font-normal font-sans leading-relaxed'
  },

  // Estados de focus
  focus: {
    input: 'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    button:
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
    success: 'focus:ring-2 focus:ring-green-500 focus:border-transparent',
    error: 'focus:ring-2 focus:ring-red-500 focus:border-transparent'
  },

  // Transiciones
  transitions: {
    colors: 'transition-colors duration-200',
    all: 'transition-all duration-200',
    shadow: 'transition-shadow duration-200'
  }
}

// Clases compuestas para componentes comunes
export const componentClasses = {
  // Cards principales
  mainCard: `${designTokens.backgrounds.card} ${designTokens.rounded.card} ${designTokens.shadows.card} ${designTokens.borders.card} overflow-hidden`,

  // Headers de cards
  cardHeader: `${designTokens.backgrounds.header} p-4`,
  cardHeaderTitle: 'text-lg font-bold text-white mb-1 font-sans',
  cardHeaderSubtitle: 'text-blue-100 font-sans text-sm',

  // Contenido de cards
  cardContent: 'p-4',

  // Inputs
  input: `w-full px-3 py-2 ${designTokens.borders.input} ${designTokens.rounded.input} ${designTokens.focus.input} ${designTokens.backgrounds.card} ${designTokens.text.primary} placeholder-gray-500 dark:placeholder-gray-400 ${designTokens.transitions.colors}`,

  inputError: `w-full px-3 py-2 border-red-500 dark:border-red-400 ${designTokens.rounded.input} ${designTokens.focus.error} ${designTokens.backgrounds.card} ${designTokens.text.primary} placeholder-gray-500 dark:placeholder-gray-400 ${designTokens.transitions.colors}`,

  inputSuccess: `w-full px-3 py-2 border-green-500 dark:border-green-400 ${designTokens.rounded.input} ${designTokens.focus.success} ${designTokens.backgrounds.card} ${designTokens.text.primary} placeholder-gray-500 dark:placeholder-gray-400 ${designTokens.transitions.colors}`,

  // Labels
  label: `block text-sm font-medium ${designTokens.text.primary} mb-2 font-sans`,

  // Botones
  primaryButton: `w-full text-white font-medium py-2 px-4 ${designTokens.rounded.button} ${designTokens.transitions.all} ${designTokens.shadows.button} flex items-center justify-center space-x-2 ${designTokens.focus.button} disabled:cursor-not-allowed font-sans`,

  secondaryButton: `px-3 py-1.5 ${designTokens.borders.input} ${designTokens.rounded.button} ${designTokens.backgrounds.card} ${designTokens.text.primary} hover:bg-gray-50 dark:hover:bg-gray-700 ${designTokens.transitions.colors} ${designTokens.focus.button} font-sans`,

  // Estados de mensaje
  successMessage: `${designTokens.backgrounds.success} ${designTokens.borders.success} ${designTokens.rounded.input} p-3 flex items-center space-x-2`,
  errorMessage: `${designTokens.backgrounds.error} ${designTokens.borders.error} ${designTokens.rounded.input} p-3 flex items-center space-x-2`,
  warningMessage: `${designTokens.backgrounds.warning} ${designTokens.borders.warning} ${designTokens.rounded.input} p-3 flex items-center space-x-2`,
  infoMessage: `${designTokens.backgrounds.info} ${designTokens.borders.info} ${designTokens.rounded.input} p-3 flex items-center space-x-2`,

  // Layout
  pageContainer: `min-h-screen ${designTokens.backgrounds.page}`,
  centeredContainer:
    'flex items-start justify-center p-3 pt-6 lg:p-6 lg:pt-8 min-h-screen',
  maxWidthContainer: 'w-full max-w-lg',

  // Grids responsivos
  twoColumnGrid: 'min-h-screen grid lg:grid-cols-2',

  // Divisores
  divider: 'border-t border-gray-200 dark:border-gray-700',

  // Loading spinner
  spinner:
    'w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'
}

// Funciones helper para estados dinámicos
export const getButtonGradient = (isLoading = false, variant = 'primary') => {
  if (isLoading) {
    return 'linear-gradient(to right, #9ca3af, #6b7280)'
  }

  switch (variant) {
    case 'primary':
      return 'linear-gradient(to right, #3b82f6, #4f46e5)'
    case 'success':
      return 'linear-gradient(to right, #10b981, #059669)'
    case 'danger':
      return 'linear-gradient(to right, #ef4444, #dc2626)'
    default:
      return 'linear-gradient(to right, #3b82f6, #4f46e5)'
  }
}

export const getButtonHoverGradient = (variant = 'primary') => {
  switch (variant) {
    case 'primary':
      return 'linear-gradient(to right, #2563eb, #3730a3)'
    case 'success':
      return 'linear-gradient(to right, #059669, #047857)'
    case 'danger':
      return 'linear-gradient(to right, #dc2626, #b91c1c)'
    default:
      return 'linear-gradient(to right, #2563eb, #3730a3)'
  }
}
