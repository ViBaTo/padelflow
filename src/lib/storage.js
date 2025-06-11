import { supabase } from './supabase'

// Función para obtener URL firmada
export const getSignedUrl = async (bucketName, filePath, expiresIn = 3600) => {
  if (!filePath) return null

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('Error generando URL firmada:', error)
      return null
    }
    return data.signedUrl
  } catch (error) {
    console.error('Error al obtener URL firmada:', error)
    return null
  }
}

// Función para extraer el path del archivo de la URL completa
export const extractFilePath = (url, bucketName) => {
  if (!url) return null
  // Si es una URL completa de Supabase, extraer solo el path
  const urlParts = url.split('/')
  const bucketIndex = urlParts.findIndex((part) => part === bucketName)
  if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
    return urlParts.slice(bucketIndex + 1).join('/')
  }
  // Si ya es solo el path, devolverlo tal como está
  return url
}

// Función para subir archivo
export const uploadFile = async (bucketName, filePath, file) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file)

    if (error) {
      console.error('Error al subir archivo:', error)
      return { error }
    }
    return { data }
  } catch (error) {
    console.error('Error inesperado al subir archivo:', error)
    return { error }
  }
}

// Función para eliminar archivo
export const deleteFile = async (bucketName, filePath) => {
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .remove([filePath])

    if (error) {
      console.error('Error al eliminar archivo:', error)
      return { error }
    }
    return { data }
  } catch (error) {
    console.error('Error inesperado al eliminar archivo:', error)
    return { error }
  }
}

// Función para listar archivos en un bucket
export const listFiles = async (bucketName, path = '') => {
  try {
    const { data, error } = await supabase.storage.from(bucketName).list(path)

    if (error) {
      console.error('Error al listar archivos:', error)
      return { error }
    }
    return { data }
  } catch (error) {
    console.error('Error inesperado al listar archivos:', error)
    return { error }
  }
}
