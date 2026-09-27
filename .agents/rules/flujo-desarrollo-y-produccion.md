# Protocolo Obligatorio de Desarrollo y Despliegue

## 1. Entorno de Desarrollo Local
- Todas las modificaciones, pruebas y nuevas características deben desarrollarse y validarse primero en el entorno local:
  - **PWA (Vecin@s Conectad@s)**: `http://localhost:3000` (`apps/pwa`)
  - **Panel Administrador**: `http://localhost:3001` (`apps/admin`)

## 2. Validación Local
- Antes de dar por concluida una tarea, se debe ejecutar y verificar localmente el funcionamiento mediante:
  - Servidor de desarrollo (`npm run dev`)
  - Verificación estática de tipos (`npx tsc --noEmit`) para asegurar 0 errores de compilación.

## 3. Autorización Previa Obligatoria para Producción 24/7 (Vercel)
- **NUNCA** realizar `git push origin main` o despliegues automáticos a la aplicación 24/7 en producción sin consultar.
- Una vez finalizada y probada la tarea en local (`localhost:3000` y `localhost:3001`), se debe presentar el resumen de lo realizado y **solicitar autorización explícita al usuario** antes de subir o desplegar los cambios en la página 24/7.
