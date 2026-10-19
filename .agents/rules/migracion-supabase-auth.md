# Recordatorio de Arquitectura: Migración a Supabase Auth y Seguridad

Este documento registra la decisión de arquitectura y el estado de avance del Plan de Refuerzo de Seguridad en **NeoFaro**:

### 1. Migración Transparente JIT (Just-In-Time)
- **Estado:** Activo y verificado.
- **Funcionamiento:** 
  - Al ingresar a `/mi-comercio`, el sistema intenta autenticar con `supabase.auth.signInWithPassword`.
  - Si el comercio fue creado antes de la migración (cuenta legada), valida su contraseña existente mediante la API de verificación y, en ese mismo instante, **crea de forma transparente su cuenta en Supabase Auth (`supabase.auth.signUp`)** y vincula la columna `user_id` de `public.comercios` y `public.solicitudes_modificacion`.
  - Todo comercio nuevo registrado en `/cargar-comercio` ya nace directamente con su `user_id` enlazado a `auth.users`.
- **Beneficio:** Cero roturas, cero bloqueo para comerciantes antiguos y sin necesidad de manipulación manual de claves.

### 2. Dónde ubicar la clave `service_role` en Supabase si se requiere
- Si en futuras tareas se busca la clave `service_role` (por ejemplo, para Edge Functions o scripts de backend):
  - **No buscar en Vault / Bóveda:** En el panel de Supabase, `Integrations -> Vault` no contiene las API keys del proyecto.
  - **Ubicación real:** Menú lateral izquierdo -> Ícono de engranaje **⚙️ Project Settings** (al fondo de la barra) -> **API** -> Sección **Project API keys** -> fila **`service_role` (secret)**.
  - Gracias al flujo JIT, esta clave no es necesaria para el inicio de sesión ni para la gestión diaria de los comercios.

### 3. Tareas Pendientes para Continuar:
1. **Blindaje RLS de Tablas Satélite:**
   - Aplicar políticas RLS estrictas en:
     - `comprobantes_transferencia`: restringir lectura solo al comercio dueño (`c.user_id = auth.uid()`) y administradores.
     - `reportes`: restringir lectura solo a administradores (los vecinos solo pueden insertar reportes, no leerlos).
     - `categorias`: restringir creación, edición y borrado exclusivamente a administradores.
     - `debates_inconvenientes`: restringir respuestas a partes involucradas y administradores.
2. **Mover la Baja Definitiva de Comercio a Endpoint de Servidor Protegido:**
   - Implementar la ruta `/api/comercio/baja` que valide el token de autenticación del dueño y ejecute la baja atómica desde el backend en lugar de hacer borrados dispersos desde el navegador del cliente.
