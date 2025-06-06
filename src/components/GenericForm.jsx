import React from 'react'
import { useForm } from 'react-hook-form'

export function GenericForm({
  fields,
  initialValues = {},
  onSubmit,
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-4'>
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
                className='border p-2 rounded'
                defaultValue={initialValues[field.name] || ''}
              >
                <option value=''>Selecciona...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === 'textarea' ? (
              <textarea
                {...register(field.name, { required: field.required })}
                className='border p-2 rounded resize-none'
                placeholder={field.placeholder || ''}
                defaultValue={initialValues[field.name] || ''}
                rows={3}
              />
            ) : field.type === 'checkbox' ? (
              <input
                type='checkbox'
                {...register(field.name)}
                className='border p-2 rounded'
                defaultChecked={!!initialValues[field.name]}
              />
            ) : (
              <input
                type={field.type}
                {...register(field.name, { required: field.required })}
                className='border p-2 rounded'
                placeholder={field.placeholder || ''}
                defaultValue={initialValues[field.name] || ''}
              />
            )}
            {errors[field.name] && (
              <span className='text-xs text-red-500'>
                Este campo es obligatorio
              </span>
            )}
          </div>
        )
      )}
      <button
        type='submit'
        className='w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg mt-4 shadow-sm transition'
      >
        {submitText}
      </button>
    </form>
  )
}
