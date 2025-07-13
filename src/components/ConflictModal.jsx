import {
  AlertTriangle,
  Clock,
  User,
  MapPin,
  CheckCircle,
  Calendar
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from './ui/dialog'
import { Button } from './ui/button'
import { designTokens, componentClasses } from '../lib/designTokens'

export function ConflictModal({
  open,
  onClose,
  conflictData,
  onForceSave,
  onApplySuggestion
}) {
  if (!conflictData) return null

  const { eventData, conflicts, warnings, suggestions } = conflictData

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle
            className={`${designTokens.typography.h3} ${designTokens.text.primary} flex items-center space-x-2`}
          >
            <AlertTriangle className='w-6 h-6 text-red-500' />
            <span>Conflictos Detectados</span>
          </DialogTitle>
          <DialogDescription className={designTokens.text.secondary}>
            Se han detectado conflictos o advertencias para el evento que
            intentas crear.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Información del evento */}
          <div
            className={`${designTokens.backgrounds.info} ${designTokens.borders.info} ${designTokens.rounded.card} p-4`}
          >
            <h4
              className={`${designTokens.typography.h5} ${designTokens.text.primary} mb-3`}
            >
              Evento a crear:
            </h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div className='flex items-center space-x-2'>
                <Calendar className='w-4 h-4 text-gray-400' />
                <span className={designTokens.text.secondary}>
                  {format(eventData.date, 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <Clock className='w-4 h-4 text-gray-400' />
                <span className={designTokens.text.secondary}>
                  {eventData.startTime} - {eventData.endTime}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <User className='w-4 h-4 text-gray-400' />
                <span className={designTokens.text.secondary}>
                  {eventData.type}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <MapPin className='w-4 h-4 text-gray-400' />
                <span className={designTokens.text.secondary}>
                  {eventData.cancha}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de conflictos */}
          {conflicts && conflicts.length > 0 && (
            <div>
              <h4
                className={`${designTokens.typography.h5} ${designTokens.text.error} mb-3 flex items-center`}
              >
                <AlertTriangle className='w-4 h-4 mr-2' />
                Conflictos que impiden guardar:
              </h4>
              <div className='space-y-2'>
                {conflicts.map((conflict, index) => (
                  <div key={index} className={componentClasses.errorMessage}>
                    <AlertTriangle className='w-4 h-4 text-red-500 flex-shrink-0' />
                    <p className={`${designTokens.text.error} text-sm`}>
                      {conflict}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lista de advertencias */}
          {warnings && warnings.length > 0 && (
            <div>
              <h4
                className={`${designTokens.typography.h5} ${designTokens.text.warning} mb-3 flex items-center`}
              >
                <AlertTriangle className='w-4 h-4 mr-2' />
                Advertencias:
              </h4>
              <div className='space-y-2'>
                {warnings.map((warning, index) => (
                  <div key={index} className={componentClasses.warningMessage}>
                    <AlertTriangle className='w-4 h-4 text-yellow-500 flex-shrink-0' />
                    <p className={`${designTokens.text.warning} text-sm`}>
                      {warning}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sugerencias de horarios alternativos */}
          {suggestions && suggestions.length > 0 && (
            <div>
              <h4
                className={`${designTokens.typography.h5} ${designTokens.text.success} mb-3 flex items-center`}
              >
                <CheckCircle className='w-4 h-4 mr-2' />
                Horarios alternativos disponibles:
              </h4>
              <div className='space-y-2'>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`${componentClasses.successMessage} hover:bg-green-100 dark:hover:bg-green-800/30 ${designTokens.transitions.colors} cursor-pointer`}
                    onClick={() => onApplySuggestion(suggestion)}
                  >
                    <Clock className='w-4 h-4 text-green-600 flex-shrink-0' />
                    <div className='flex-1'>
                      <div className='flex justify-between items-center'>
                        <span
                          className={`${designTokens.text.success} font-medium`}
                        >
                          {suggestion.startTime} - {suggestion.endTime}
                        </span>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='text-green-600 hover:text-green-800 h-auto p-1'
                          onClick={(e) => {
                            e.stopPropagation()
                            onApplySuggestion(suggestion)
                          }}
                        >
                          Usar este horario
                        </Button>
                      </div>
                      {suggestion.warnings &&
                        suggestion.warnings.length > 0 && (
                          <div className='mt-2 text-xs text-yellow-600'>
                            Advertencias: {suggestion.warnings.join(', ')}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className='flex flex-col sm:flex-row gap-3'>
          <Button variant='outline' onClick={onClose} className='flex-1'>
            Cancelar
          </Button>

          {conflicts && conflicts.length === 0 && (
            <Button
              onClick={onForceSave}
              className='flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
            >
              Guardar con advertencias
            </Button>
          )}

          {conflicts && conflicts.length > 0 && (
            <Button
              onClick={onForceSave}
              className='flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white'
            >
              Forzar guardado
            </Button>
          )}
        </DialogFooter>

        {/* Texto de ayuda */}
        <div
          className={`mt-4 text-xs ${designTokens.text.muted} text-center space-y-1`}
        >
          {conflicts && conflicts.length > 0 ? (
            <p>
              ⚠️ Forzar el guardado puede crear conflictos de horarios.
              Recomendamos usar uno de los horarios alternativos sugeridos.
            </p>
          ) : (
            <p>
              ℹ️ Se detectaron advertencias que no impiden crear el evento, pero
              es recomendable revisar la información.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
