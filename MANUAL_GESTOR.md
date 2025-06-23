# 📋 Manual del Gestor - LaPala Club

## 🎯 **Guía de Inicio Rápido**

Este manual te ayudará a comenzar a usar el sistema de gestión de LaPala Club desde el primer día.

---

## 🚀 **Primeros Pasos**

### **1. Crear una Cuenta**

Si es la primera vez que usas el sistema:

1. **Accede a la URL** del sistema
2. **Haz clic en "Registrarse"** o "Crear cuenta"
3. **Completa el formulario**:
   - **Email**: Tu correo electrónico
   - **Contraseña**: Crea una contraseña segura
   - **Confirmar contraseña**: Repite la contraseña
4. **Haz clic en "Crear cuenta"**
5. **¡Listo!** Ya puedes iniciar sesión con tus credenciales

### **2. Acceso al Sistema**

- **URL**: [URL del sistema] (se proporcionará al implementar)
- **Usuario**: Tu email registrado
- **Contraseña**: La contraseña que creaste

### **3. Configuración Inicial**

Al entrar por primera vez, verás el **Dashboard principal** con:

- Métricas del club
- Gráfico de ingresos
- Lista de inscripciones activas

**Nota**: Si el dashboard aparece vacío, es normal. Los datos aparecerán conforme vayas registrando información.

---

## 📊 **Dashboard - Tu Centro de Control**

### **¿Qué ves en el Dashboard?**

- **Total Inscripciones**: Número total de inscripciones registradas
- **Total Estudiantes**: Alumnos registrados en el club
- **Próximas a vencer**: Paquetes que vencen en 7 días o menos
- **Ingresos Totales**: Dinero recaudado del sistema

### **Gráfico de Ingresos**

- Muestra los ingresos por mes
- Te ayuda a identificar tendencias
- Útil para planificación financiera

### **Lista de Inscripciones Activas**

- Alumnos con paquetes vigentes
- Progreso de clases utilizadas
- Fechas de vencimiento
- Estados (activo/próximo a vencer)

---

## 👥 **Gestión de Alumnos**

### **Agregar un Alumno Individual**

1. Ve a **"Alumnos"** en el menú lateral
2. Haz clic en **"Nuevo Estudiante"**
3. Completa los campos:
   - **Cédula**: Número de identificación
   - **Nombre completo**: Nombre y apellidos
   - **Teléfono**: Número de contacto
   - **Fecha registro**: Fecha de ingreso al club
   - **Estado**: ACTIVO o INACTIVO
4. Haz clic en **"Añadir estudiante"**

### **Importar Alumnos en Lote** ⭐ (Recomendado)

Si tienes muchos alumnos, usa la importación masiva:

1. Ve a **"Alumnos"** → **"Importar CSV"**
2. Descarga la **"Plantilla Básica"** o **"Datos de Demo"**
3. Completa el archivo con tus datos
4. Sube el archivo al sistema
5. ¡Listo! Todos tus alumnos estarán registrados

**Campos requeridos en el CSV:**

- `cedula` - Número de identificación
- `nombre_completo` - Nombre y apellidos
- `telefono` - Número de contacto
- `fecha_registro` - Fecha de ingreso (YYYY-MM-DD)
- `estado` - ACTIVO o INACTIVO

### **Buscar y Filtrar Alumnos**

- **Búsqueda**: Escribe nombre o teléfono en el campo de búsqueda
- **Filtros**: Usa el botón "Filtros" para ver solo activos/inactivos
- **Ver detalles**: Haz clic en "Ver" para ver información completa del alumno

---

## 📦 **Gestión de Paquetes**

### **Crear un Paquete de Clases**

1. Ve a **"Paquetes"** en el menú lateral
2. Haz clic en **"Nuevo Paquete"**
3. Completa la información:
   - **Código**: Identificador único (ej: PAQ001)
   - **Nombre**: Nombre del paquete (ej: "Paquete Básico")
   - **Número de clases**: Cuántas clases incluye
   - **Precio sin IVA**: Precio base
   - **Precio con IVA**: Precio final
   - **Estado**: ACTIVO o INACTIVO
4. Haz clic en **"Crear paquete"**

### **Ejemplos de Paquetes:**

- **Paquete Básico**: 4 clases - $80
- **Paquete Intermedio**: 8 clases - $150
- **Paquete Avanzado**: 12 clases - $200

---

## 💳 **Sistema de Pagos e Inscripciones**

### **Registrar una Inscripción**

1. Ve a **"Pagos"** en el menú lateral
2. Haz clic en **"Nueva Inscripción"**
3. Selecciona:
   - **Alumno**: Busca y selecciona el estudiante
   - **Paquete**: Elige el paquete de clases
   - **Fecha de inscripción**: Cuándo se registró
   - **Fecha de vencimiento**: Cuándo vence el paquete
   - **Estado de pago**: PAGADO o PENDIENTE
4. Haz clic en **"Registrar inscripción"**

### **Seguimiento de Pagos**

- **Pagos pendientes**: Aparecen en rojo
- **Pagos realizados**: Aparecen en verde
- **Vencimientos**: Se muestran alertas automáticas

---

## 👨‍🏫 **Gestión de Profesores**

### **Agregar un Profesor**

1. Ve a **"Profesores"** en el menú lateral
2. Haz clic en **"Nuevo Profesor"**
3. Completa:
   - **ID Profesor**: Identificador único del profesor
   - **Nombre completo**: Nombre y apellidos
   - **Teléfono**: Número de contacto
   - **Nivel**: Selecciona el nivel (A, B, C, D)
   - **Puede academia**: Marca si puede dar clases de academia
   - **Fecha ingreso**: Fecha de incorporación
4. Haz clic en **"Añadir profesor"**

### **Sistema de Niveles**

- **Nivel A**: Profesores de mayor experiencia y certificación
- **Nivel B**: Profesores con experiencia intermedia
- **Nivel C**: Profesores con experiencia básica
- **Nivel D**: Profesores en formación

### **Filtros y Búsqueda**

- **Por nombre**: Busca profesores por nombre
- **Por teléfono**: Busca por número de contacto
- **Por nivel**: Filtra por nivel específico (A, B, C, D)

---

## 📅 **Calendario y Eventos**

### **Ver el Calendario**

- Ve a **"Calendario"** en el menú lateral
- Visualiza horarios y eventos del club
- Útil para planificación semanal

---

## ⚙️ **Configuración del Sistema**

### **⚠️ Importante: Solo Disponible en Escritorio**

La página de configuración **solo está disponible en dispositivos de escritorio** (computadoras y laptops). Si intentas acceder desde un móvil, serás redirigido automáticamente al dashboard.

**¿Por qué esta restricción?**

- La configuración tiene múltiples pestañas y formularios complejos
- Se requiere pantalla completa para una gestión eficiente
- Es una función administrativa que debe realizarse desde dispositivos seguros

### **Gestión de Categorías**

1. Ve a **"Configuración"** en el menú lateral (solo visible en escritorio)
2. **Categorías**: Define niveles de experiencia (Principiante, Intermedio, Avanzado)
3. **Paquetes**: Gestiona los paquetes de clases disponibles
4. **Configuración general**: Ajustes del sistema

### **Gestión de Paquetes desde Configuración**

1. Ve a **"Configuración"** → **"Paquetes"**
2. **Crear paquete**: Haz clic en "Nuevo Paquete"
3. **Editar paquete**: Haz clic en el ícono de editar
4. **Eliminar paquete**: Haz clic en el ícono de eliminar

**Campos importantes:**

- **Código**: Identificador único (ej: PAQ001)
- **Nombre**: Nombre descriptivo del paquete
- **Tipo de servicio**: Academia, Condicionamiento Físico, etc.
- **Número de clases**: Cantidad incluida
- **Precio con IVA**: Precio final
- **Estado**: Activo/Inactivo

---

## 🔍 **Búsquedas y Reportes**

### **Búsquedas Rápidas**

- **Por nombre**: Escribe el nombre del alumno
- **Por teléfono**: Busca por número de contacto
- **Por estado**: Filtra activos/inactivos

### **Información Disponible**

- **Historial de pagos**: Todos los pagos registrados
- **Progreso de clases**: Cuántas clases ha usado cada alumno
- **Vencimientos**: Paquetes próximos a vencer
- **Ingresos**: Total recaudado por período

---

## 📱 **Uso Diario Recomendado**

### **Al Iniciar el Día:**

1. Revisa el **Dashboard** para ver métricas del día
2. Verifica **"Próximas a vencer"** para recordatorios
3. Revisa **"Pagos pendientes"** si los hay

### **Durante el Día:**

1. **Registra nuevos alumnos** cuando lleguen
2. **Actualiza pagos** cuando se realicen
3. **Registra inscripciones** a nuevos paquetes

### **Al Final del Día:**

1. Revisa el **Dashboard** para resumen del día
2. Verifica que todos los pagos estén registrados
3. Planifica para el día siguiente

---

## 🚨 **Alertas y Recordatorios**

### **Alertas Automáticas:**

- **Paquetes próximos a vencer**: 7 días antes
- **Pagos pendientes**: Se muestran en rojo
- **Alumnos inactivos**: Aparecen en la lista de inactivos

### **Qué Hacer con las Alertas:**

- **Vencimientos**: Contacta al alumno para renovación
- **Pagos pendientes**: Confirma si se realizó el pago
- **Alumnos inactivos**: Considera reactivarlos

---

## 💡 **Tips y Mejores Prácticas**

### **Organización de Datos:**

- **Usa códigos consistentes** para paquetes (PAQ001, PAQ002)
- **Mantén fechas actualizadas** de vencimientos
- **Registra pagos inmediatamente** cuando se realicen

### **Comunicación:**

- **Revisa regularmente** el dashboard
- **Usa las búsquedas** para encontrar información rápidamente
- **Mantén estados actualizados** (activo/inactivo)

### **Backup y Seguridad:**

- **Los datos se guardan automáticamente** en la nube
- **Acceso seguro** con usuario y contraseña
- **Información protegida** y respaldada

---

## 🆘 **Soporte y Ayuda**

### **Si tienes problemas:**

1. **Revisa este manual** primero
2. **Contacta al soporte técnico** si necesitas ayuda
3. **No borres datos** sin confirmar

### **Funciones Destacadas:**

- **Importación masiva**: Para migrar datos existentes
- **Búsquedas rápidas**: Para encontrar información
- **Alertas automáticas**: Para no perder vencimientos
- **Reportes en tiempo real**: Para tomar decisiones

---

## 📞 **Contacto de Soporte**

- **Email**: [email de soporte]
- **WhatsApp**: [número de soporte]
- **Horario**: [horarios de atención]

---

## 🔐 **Gestión de Cuenta y Seguridad**

### **Cambiar Contraseña**

1. Ve a **"Configuración"** en el menú lateral
2. Busca la sección **"Seguridad"** o **"Mi Cuenta"**
3. Haz clic en **"Cambiar contraseña"**
4. Ingresa tu contraseña actual
5. Crea una nueva contraseña segura
6. Confirma la nueva contraseña
7. Haz clic en **"Actualizar"**

### **Recuperar Contraseña**

Si olvidaste tu contraseña:

1. En la pantalla de login, haz clic en **"¿Olvidaste tu contraseña?"**
2. Ingresa tu email registrado
3. **Contacta al administrador** para restablecer tu contraseña

### **Cerrar Sesión**

- Haz clic en **"Cerrar sesión"** en el menú lateral
- O cierra el navegador (la sesión se cerrará automáticamente)

### **Seguridad Recomendada**

- **Usa contraseñas fuertes**: Mínimo 8 caracteres con letras, números y símbolos
- **No compartas** tu contraseña con nadie
- **Cierra sesión** cuando termines de usar el sistema
- **Usa dispositivos seguros** para acceder al sistema

---

_¡El sistema está diseñado para hacer tu trabajo más fácil y eficiente! 🏓_
