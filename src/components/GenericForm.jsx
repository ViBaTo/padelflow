import React from 'react'
import { useForm } from 'react-hook-form'
import { Button } from './ui/button'

export function GenericForm({
  fields,
  initialValues = {},
  onSubmit,
  onCancel,
  submitText = 'Guardar'
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: initialValues
  })

  // Reset form when initialValues change (para editar)
  React.useEffect(() => {
    reset(initialValues)
  }, [initialValues, reset])

  const handleFormSubmit = (data) => {
    onSubmit(data)
  }

  return (
    <form
      onSubmit={handleSubmit(handleFormSubmit)}
      className='flex flex-col gap-4'
    >
      {fields.map((field, idx) =>
        field.section ? (
          <div key={field.section + idx} className='mb-2'>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {field.section}
            </h3>
            {field.description && (
              <p className='text-sm text-gray-500 mb-2'>{field.description}</p>
            )}
          </div>
        ) : (
          <div key={field.name} className='flex flex-col gap-1'>
            <label className='text-sm font-medium text-gray-700 dark:text-gray-200'>
              {field.label}
              {field.required && <span className='text-red-500 ml-1'>*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                {...register(field.name, { required: field.required })}
                className='border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                defaultValue={
                  initialValues[field.name] !== undefined &&
                  initialValues[field.name] !== null
                    ? String(initialValues[field.name])
                    : ''
                }
              >
                <option value=''>Selecciona...</option>
                {field.options.map((opt) => {
                  const value = typeof opt === 'object' ? opt.value : opt
                  const label = typeof opt === 'object' ? opt.label : opt
                  return (
                    <option key={String(value)} value={String(value)}>
                      {label}
                    </option>
                  )
                })}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                {...register(field.name, { required: field.required })}
                className='border border-gray-300 dark:border-gray-600 p-2 rounded resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder={field.placeholder || ''}
                defaultValue={
                  initialValues[field.name] !== undefined &&
                  initialValues[field.name] !== null
                    ? initialValues[field.name]
                    : ''
                }
                rows={3}
              />
            ) : field.type === 'checkbox' ? (
              <input
                type='checkbox'
                {...register(field.name)}
                className='border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
                defaultChecked={
                  !!(initialValues[field.name] !== undefined &&
                  initialValues[field.name] !== null
                    ? initialValues[field.name]
                    : false)
                }
              />
            ) : (
              <input
                type={field.type}
                {...register(field.name, {
                  required: field.required,
                  valueAsNumber: field.type === 'number'
                })}
                className='border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder={field.placeholder || ''}
                defaultValue={
                  initialValues[field.name] !== undefined &&
                  initialValues[field.name] !== null
                    ? initialValues[field.name]
                    : ''
                }
              />
            )}
            {errors[field.name] && (
              <span className='text-xs text-red-500 dark:text-red-400'>
                {errors[field.name].type === 'required'
                  ? 'Este campo es obligatorio'
                  : errors[field.name].message || 'Campo inválido'}
              </span>
            )}
          </div>
        )
      )}
      <div className='flex gap-3 mt-4'>
        {onCancel && (
          <Button
            type='button'
            variant='secondary'
            onClick={onCancel}
            className='flex-1'
          >
            Cancelar
          </Button>
        )}
        <Button
          type='submit'
          variant='primary'
          className={onCancel ? 'flex-1' : 'w-full'}
        >
          {submitText}
        </Button>
      </div>
    </form>
  )
}
