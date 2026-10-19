# Directriz de Aprobación Obligatoria de Cambios

## 1. Control y Supervisión por parte del Usuario
- El usuario ha solicitado expresamente tener el control manual sobre las modificaciones del proyecto.
- **Antes de editar archivos críticos o ejecutar comandos destructivos**, el agente debe:
  1. Explicar con claridad qué cambios se proponen y en qué archivos.
  2. Mostrar el fragmento o resumen del cambio (diff o plan).
  3. Esperar la validación y confirmación explícita del usuario antes de proceder a la aplicación automática.

## 2. Ejecución en Terminal y Base de Datos
- Las operaciones que afecten bases de datos (Supabase, borrados masivos, modificaciones de esquemas) o despliegues no deben ejecutarse de forma silenciosa.
- Se debe solicitar la anuencia del usuario detallando los datos y filas afectadas.
