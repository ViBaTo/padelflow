# ⚙️ Configuración del Sistema - LaPala Club

## 📋 **Índice**

1. [Configuración Inicial](#configuración-inicial)
2. [Gestión de Usuarios](#gestión-de-usuarios)
3. [Configuración del Club](#configuración-del-club)
4. [Gestión de Categorías](#gestión-de-categorías)
5. [Personalización de Colores](#personalización-de-colores)
6. [Configuración de Pagos](#configuración-de-pagos)
7. [Configuración de Notificaciones](#configuración-de-notificaciones)
8. [Seguridad](#seguridad)
9. [Tema de la Interfaz](#tema-de-la-interfaz)
10. [Backup y Restauración](#backup-y-restauración)

---

## 🔧 **Configuración Inicial**

### **Requisitos Previos**

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conexión a internet
- Credenciales de acceso al sistema

### **Primer Acceso**

1. Navegar a la URL del sistema
2. Crear cuenta de administrador
3. Configurar información básica del club
4. Importar datos iniciales (opcional)

---

## 👥 **Gestión de Usuarios**

### **Crear Cuenta de Administrador**

1. Ir a la página de registro
2. Completar formulario con:
   - Nombre completo
   - Email
   - Teléfono
   - Contraseña
3. Confirmar registro
4. Iniciar sesión automáticamente

### **Cambiar Contraseña**

1. Ir a **Configuración** → **Seguridad**
2. Ingresar contraseña actual
3. Ingresar nueva contraseña
4. Confirmar nueva contraseña
5. Guardar cambios

---

## 🏢 **Configuración del Club**

### **Información Básica**

- **Nombre del Club**: Nombre oficial del establecimiento
- **Dirección**: Dirección física completa
- **Teléfono**: Número de contacto principal
- **Email**: Email de contacto oficial
- **Zona Horaria**: Configuración de hora local

### **Zonas Horarias Disponibles**

- Ecuador (GMT-5)
- Nueva York (GMT-5/-4)
- Los Ángeles (GMT-8/-7)
- Madrid (GMT+1/+2)

### **Uso**

Esta información se utiliza en:

- Reportes y documentos
- Configuración de horarios
- Comunicaciones automáticas
- Personalización de la interfaz

---

## 🏷️ **Gestión de Categorías**

### **Crear Nueva Categoría**

1. Ir a **Configuración** → **Categorías**
2. Hacer clic en **"Nueva Categoría"**
3. Completar formulario:
   - **Nombre**: Nombre de la categoría
   - **Descripción**: Descripción opcional
   - **Tipo**: Alumno o Profesor
4. Guardar categoría

### **Editar Categoría**

1. Hacer clic en el ícono de editar (lápiz)
2. Modificar campos necesarios
3. Guardar cambios

### **Eliminar Categoría**

1. Hacer clic en el ícono de eliminar (papelera)
2. Confirmar eliminación
3. La categoría se elimina permanentemente

### **Tipos de Categorías**

- **Alumnos**: Categorías para estudiantes (ej: Principiante, Intermedio, Avanzado)
- **Profesores**: Categorías para instructores (ej: Instructor, Entrenador, Master)

### **Campos por Categoría**

- **Nombre**: Identificador de la categoría
- **Descripción**: Información adicional (opcional)
- **Tipo**: Alumno o Profesor

### **Uso en el Sistema**

- Clasificación automática de usuarios
- Filtros en reportes
- Configuración de permisos
- Organización visual

---

## 🎨 **Personalización de Colores**

### **Configuración Automática**

El sistema asigna colores automáticamente basándose en:

- **Tipo de categoría**: Hombre, Mujer, Niño, etc.
- **Nombre de categoría**: Hash único para consistencia

### **Personalización Manual**

1. Ir a **Configuración** → **Colores**
2. Seleccionar categoría a personalizar
3. Elegir color de fondo
4. Guardar configuración

### **Colores Predefinidos por Tipo**

- **Hombre**: Azul
- **Mujer**: Rosa
- **Niño**: Verde
- **Mixto**: Púrpura
- **Otros**: Gris

### **Funcionalidades**

- **Edición Individual**: Personalizar cada categoría
- **Restablecer Automático**: Volver a colores generados
- **Guardado Persistente**: Configuración guardada automáticamente
- **Aplicación Global**: Colores aplicados en todo el sistema

---

## 💳 **Configuración de Pagos**

### **Configuración de IVA**

- **Porcentaje de IVA**: Configurar porcentaje aplicable
- **Moneda**: USD, EUR, PEN
- **Días de Vencimiento**: Días por defecto para pagos

### **Monedas Disponibles**

- USD ($) - Dólar estadounidense
- EUR (€) - Euro
- PEN (S/) - Sol peruano

### **Aplicación en el Sistema**

- **Cálculo Automático**: IVA aplicado automáticamente
- **Formato de Precios**: Moneda configurada en toda la interfaz
- **Alertas de Vencimiento**: Basadas en días configurados
- **Reportes Financieros**: Con moneda y IVA correctos

---

## 🔔 **Configuración de Notificaciones**

### **Alertas de Vencimiento**

- **Días antes de vencimiento**: Configurar cuántos días antes alertar
- **Recordatorios de pago**: Configurar frecuencia de recordatorios

### **Notificaciones del Sistema**

- **Nuevos alumnos**: Notificar cuando se registren nuevos alumnos
- **Email**: Habilitar notificaciones por correo electrónico

### **Parámetros Configurables**

- **Alertas de Vencimiento**: 7 días por defecto
- **Recordatorios de Pago**: 3 días por defecto
- **Notificaciones Nuevos Alumnos**: Activado por defecto
- **Email Notificaciones**: Desactivado por defecto

### **Impacto en el Sistema**

- **Dashboard**: Alertas mostradas según configuración
- **Reportes**: Filtros basados en configuraciones
- **Comunicaciones**: Automatización de recordatorios
- **Experiencia de Usuario**: Personalización de notificaciones

---

## 🔒 **Seguridad**

### **Cambio de Contraseña**

1. Ir a **Configuración** → **Seguridad**
2. Ingresar contraseña actual
3. Ingresar nueva contraseña
4. Confirmar nueva contraseña
5. Guardar cambios

### **Recomendaciones de Seguridad**

- Usar contraseñas fuertes (mínimo 8 caracteres)
- Incluir mayúsculas, minúsculas, números y símbolos
- Cambiar contraseña regularmente
- No compartir credenciales

### **Gestión de Contraseñas**

- **Validación**: Confirmación de contraseña
- **Seguridad**: Integración con Supabase Auth

### **Características de Seguridad**

- **Validación en Tiempo Real**: Verificación de coincidencia
- **Mensajes de Error**: Información clara sobre errores
- **Integración Segura**: Con sistema de autenticación
- **Feedback Inmediato**: Confirmación de cambios

---

## 🌙 **Tema de la Interfaz**

### **Modo Oscuro/Claro**

1. Ir a **Configuración** → **Tema**
2. Hacer clic en el botón de tema
3. El cambio se aplica inmediatamente
4. La preferencia se guarda automáticamente

### **Características del Tema**

- **Modo Claro**: Fondo blanco, texto oscuro
- **Modo Oscuro**: Fondo oscuro, texto claro
- **Persistencia**: La preferencia se mantiene entre sesiones

### **Iconos Dinámicos**: Sol/Luna según el modo

### **Transición Suave**: Cambio visual fluido

### **Preferencia Guardada**: Recordar elección del usuario

### **Accesibilidad**: Mejora la experiencia visual

---

## 💾 **Backup y Restauración**

### **Exportación de Datos**

#### **Exportar Todas las Tablas (CSV)**

1. Ir a **Configuración** → **Backup**
2. Hacer clic en **"Exportar Todas las Tablas (CSV)"**
3. El sistema descargará archivos CSV separados para cada tabla
4. Los archivos incluyen la fecha de exportación

#### **Tablas Exportadas**

- **Alumnos**: Datos de todos los estudiantes
- **Profesores**: Información de instructores
- **Paquetes**: Paquetes de clases disponibles
- **Precios**: Configuración de precios
- **Modos de Pago**: Métodos de pago aceptados
- **Gestores**: Usuarios administradores
- **Categorías**: Categorías de alumnos/profesores
- **Pagos**: Historial de transacciones
- **Resumen**: Resúmenes financieros
- **Inscripciones**: Registros de matrículas

### **Conversión de CSV a Excel**

#### **Método 1 - Microsoft Excel**

1. Abrir Microsoft Excel
2. Ir a **Datos** → **Obtener datos** → **Desde archivo** → **Desde texto/CSV**
3. Seleccionar el archivo CSV descargado
4. Configurar la codificación como **UTF-8**
5. Hacer clic en **Cargar**

#### **Método 2 - Google Sheets**

1. Abrir Google Sheets
2. Ir a **Archivo** → **Importar**
3. Subir el archivo CSV
4. Configurar las opciones de importación
5. Hacer clic en **Importar datos**

#### **Método 3 - LibreOffice Calc**

1. Abrir LibreOffice Calc
2. Ir a **Archivo** → **Abrir**
3. Seleccionar el archivo CSV
4. Configurar el delimitador como **coma (,)**
5. Hacer clic en **Aceptar**

### **Ventajas del Formato CSV**

- **Compatibilidad universal**: Funciona en cualquier software de hojas de cálculo
- **Archivos separados**: Cada tabla en su propio archivo para mejor organización
- **Fácil manipulación**: Los datos se pueden editar, filtrar y analizar fácilmente
- **Tamaño reducido**: Archivos más pequeños que formatos propietarios

### **Restauración de Datos**

- **Funcionalidad en desarrollo**: La importación de backups estará disponible en futuras versiones
- **Contacto técnico**: Para restauraciones urgentes, contactar al equipo de desarrollo

---

## 🔧 **Solución de Problemas**

### **Problemas Comunes**

#### **Error al Exportar Datos**

- Verificar conexión a internet
- Comprobar permisos de descarga del navegador
- Intentar exportar tablas individuales

#### **Archivos CSV No Se Abren Correctamente**

- Verificar que el software de hojas de cálculo soporte UTF-8
- Intentar abrir con un editor de texto primero
- Usar el método de importación en lugar de abrir directamente

#### **Problemas de Codificación**

- Los archivos CSV usan codificación UTF-8
- Configurar el software para usar UTF-8 al importar
- En Excel, usar la función "Obtener datos" en lugar de abrir directamente

### **Contacto de Soporte**

- **Email**: [email de soporte]
- **Teléfono**: [número de soporte]
- **Horarios**: [horarios de atención]

---

## 📈 **Mejores Prácticas**

### **Backup Regular**

- Exportar datos semanalmente
- Guardar archivos en ubicación segura
- Verificar que los archivos se descarguen correctamente

### **Organización de Archivos**

- Crear carpetas por fecha de exportación
- Mantener copias de seguridad en múltiples ubicaciones
- Documentar cambios importantes en los datos

### **Seguridad de Datos**

- No compartir archivos de backup por email
- Usar servicios de almacenamiento seguro
- Eliminar archivos antiguos regularmente

---

_Documento actualizado: [Fecha]_
_Versión del sistema: [Versión]_

_Esta configuración completa permite a los gestores del club personalizar el sistema según sus necesidades específicas, manteniendo la flexibilidad y facilidad de uso._ 🏓
