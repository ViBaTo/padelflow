import { useEffect, useState } from 'react'
import { getSignedUrl, extractFilePath } from '../lib/storage'

export function ComprobanteLink({
  filePath,
  className = '',
  bucketName = 'comprobantes'
}) {
  const [signedUrl, setSignedUrl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (filePath) {
      setLoading(true)
      setError(null)

      const path = extractFilePath(filePath, bucketName)
      if (path) {
        getSignedUrl(bucketName, path)
          .then((url) => {
            if (url) {
              setSignedUrl(url)
            } else {
              setError('Error al generar enlace')
            }
            setLoading(false)
          })
          .catch((err) => {
            console.error('Error al obtener URL firmada:', err)
            setError('Error al obtener enlace')
            setLoading(false)
          })
      } else {
        setError('Path de archivo inválido')
        setLoading(false)
      }
    }
  }, [filePath, bucketName])

  if (!filePath) {
    return <span className='text-gray-400'>Sin comprobante</span>
  }

  if (loading) {
    return <span className='text-blue-600'>Cargando enlace...</span>
  }

  if (error) {
    return <span className='text-red-500 text-sm'>{error}</span>
  }

  if (signedUrl) {
    return (
      <div className={className}>
        <a
          href={signedUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='text-blue-600 underline hover:text-blue-800'
        >
          Ver comprobante
        </a>
        <div className='text-xs text-gray-500 mt-1'>
          {filePath.split('/').pop()}
        </div>
      </div>
    )
  }

  return <span className='text-gray-400'>Error al cargar enlace</span>
}
