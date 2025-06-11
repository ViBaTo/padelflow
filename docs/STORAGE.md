# Storage y URLs Firmadas

Este documento explica cómo usar las funcionalidades de storage de Supabase en el proyecto, específicamente para manejar archivos en buckets privados.

## Configuración

### Bucket de Comprobantes

El proyecto usa un bucket privado llamado `comprobantes` para almacenar archivos de comprobantes de pago. Este bucket tiene las siguientes políticas de seguridad:

- **SELECT**: Solo usuarios autenticados pueden acceder a los archivos
- **INSERT**: Solo usuarios autenticados pueden subir archivos
- **UPDATE**: Solo usuarios autenticados pueden actualizar archivos

## Utilidades de Storage

### Archivo: `src/lib/storage.js`

Este archivo contiene utilidades reutilizables para manejar el storage:

#### `getSignedUrl(bucketName, filePath, expiresIn = 3600)`

Genera una URL firmada para acceder a un archivo en un bucket privado.

```javascript
import { getSignedUrl } from '../lib/storage'

const signedUrl = await getSignedUrl('comprobantes', 'archivo.pdf', 3600)
// expiresIn está en segundos (por defecto 1 hora)
```

#### `extractFilePath(url, bucketName)`

Extrae el path del archivo de una URL completa de Supabase.

```javascript
import { extractFilePath } from '../lib/storage'

const path = extractFilePath(
  'https://.../comprobantes/archivo.pdf',
  'comprobantes'
)
// Retorna: 'archivo.pdf'
```

#### `uploadFile(bucketName, filePath, file)`

Sube un archivo al bucket especificado.

```javascript
import { uploadFile } from '../lib/storage'

const { data, error } = await uploadFile('comprobantes', 'mi-archivo.pdf', file)
```

#### `deleteFile(bucketName, filePath)`

Elimina un archivo del bucket.

```javascript
import { deleteFile } from '../lib/storage'

const { data, error } = await deleteFile(
  'comprobantes',
  'archivo-a-eliminar.pdf'
)
```

## Componente ComprobanteLink

### Archivo: `src/components/ComprobanteLink.jsx`

Componente reutilizable para mostrar enlaces a comprobantes con URLs firmadas.

```jsx
import { ComprobanteLink } from '../components/ComprobanteLink'

// Uso básico
<ComprobanteLink filePath="archivo.pdf" />

// Con bucket personalizado
<ComprobanteLink filePath="archivo.pdf" bucketName="mi-bucket" />

// Con clases CSS personalizadas
<ComprobanteLink filePath="archivo.pdf" className="mi-clase" />
```

### Estados del componente:

1. **Sin archivo**: Muestra "Sin comprobante"
2. **Cargando**: Muestra "Cargando enlace..."
3. **Error**: Muestra el mensaje de error
4. **Éxito**: Muestra el enlace "Ver comprobante" con el nombre del archivo

## Uso en el Módulo de Pagos

### Subida de Comprobantes

```javascript
// En el componente de pagos
const handleComprobanteUpload = async (id, file) => {
  const filePath = `${id}_${Date.now()}.${ext}`

  // Subir archivo
  const { error } = await uploadFile('comprobantes', filePath, file)

  if (!error) {
    // Guardar solo el path en la base de datos
    await supabase
      .from('inscripciones')
      .update({ comprobante: filePath })
      .eq('id_inscripcion', id)
  }
}
```

### Visualización de Comprobantes

```jsx
// En la tabla de pagos
<td>
  <ComprobanteLink filePath={inscripcion.comprobante} />
</td>
```

## Ventajas de las URLs Firmadas

1. **Seguridad**: Los archivos no son públicos, solo accesibles con URLs temporales
2. **Control de acceso**: Solo usuarios autenticados pueden generar URLs
3. **Expiración**: Las URLs tienen un tiempo de vida limitado
4. **Flexibilidad**: Puedes controlar cuándo y cómo se accede a los archivos

## Consideraciones Importantes

1. **Almacenamiento**: Guarda solo el path del archivo en la base de datos, no la URL completa
2. **Expiración**: Las URLs firmadas expiran (por defecto 1 hora), se regeneran automáticamente
3. **Errores**: Maneja los errores de generación de URLs firmadas
4. **Limpieza**: Si eliminas archivos del storage, limpia también la referencia en la base de datos

## Ejemplo Completo

```jsx
import { useState } from 'react'
import { ComprobanteLink } from '../components/ComprobanteLink'
import { uploadFile } from '../lib/storage'

function MiComponente() {
  const [archivo, setArchivo] = useState(null)
  const [filePath, setFilePath] = useState(null)

  const handleUpload = async (file) => {
    const path = `uploads/${Date.now()}_${file.name}`
    const { error } = await uploadFile('comprobantes', path, file)

    if (!error) {
      setFilePath(path)
    }
  }

  return (
    <div>
      <input type='file' onChange={(e) => handleUpload(e.target.files[0])} />
      <ComprobanteLink filePath={filePath} />
    </div>
  )
}
```
