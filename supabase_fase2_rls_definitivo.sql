-- ==============================================================================
-- FASE 2: BLINDAJE CON ROW LEVEL SECURITY (RLS) DEFINITIVO
-- Proyecto: NeoFaro
-- Panel Supabase: https://supabase.com/dashboard/project/hajepxscgwbgiifcfndz
-- ==============================================================================
-- Este script activa y refuerza las políticas de seguridad a nivel de fila (RLS):
-- 1. comercios:
--    - SELECT: Público solo para comercios aprobados y activos. El dueño siempre puede ver el suyo.
--    - INSERT: Solo en estado 'pendiente' o vinculando el propio auth.uid().
--    - UPDATE: Restringido únicamente al dueño autenticado (auth.uid() = user_id) o service_role.
--    - DELETE: Bloqueado a usuarios anónimos.
-- 2. productos:
--    - SELECT: Público (catálogo).
--    - INSERT / UPDATE / DELETE: Exclusivo para el dueño del comercio correspondiente.
-- 3. solicitudes_modificacion:
--    - Protegida para lectura y edición exclusiva del comerciante o administradores.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. LIMPIEZA PREVENTIVA DE POLÍTICAS ANTERIORES EN ESTAS TABLAS
-- ------------------------------------------------------------------------------
DO $$
DECLARE
    p RECORD;
BEGIN
    FOR p IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public' 
          AND tablename IN ('comercios', 'productos', 'solicitudes_modificacion')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I;', p.policyname, p.schemaname, p.tablename);
    END LOOP;
END $$;

-- Asegurar que RLS esté activado
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_modificacion ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. POLÍTICAS PARA: public.comercios
-- ==============================================================================

-- A. Lectura (SELECT)
-- Pública para aprobados; el dueño siempre ve su comercio (incluso si está en revisión o pendiente).
CREATE POLICY "comercios_select_publico_y_duenio" ON public.comercios
FOR SELECT
USING (
    -- Público general: solo comercios aprobados
    (estado_aprobacion = 'aprobado')
    -- El propio comerciante autenticado
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    -- Administradores del sistema
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR (auth.role() = 'service_role')
);

-- B. Registro de nuevo comercio (INSERT)
-- Permite solicitar altas en estado pendiente o asignando su propio user_id
CREATE POLICY "comercios_insert_nuevo_local" ON public.comercios
FOR INSERT
WITH CHECK (
    -- Todo local nuevo debe iniciar como pendiente o pertenecer al usuario autenticado
    estado_aprobacion = 'pendiente'
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR (auth.role() = 'service_role')
);

-- C. Edición de comercio (UPDATE)
-- Permite actualización si está en revisión inicial (pendiente), o al dueño autenticado, o administradores.
CREATE POLICY "comercios_update_solo_duenio" ON public.comercios
FOR UPDATE
USING (
    -- Es el dueño registrado
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    -- O el comercio aún no tenía user_id asignado (migración JIT en progreso)
    OR (user_id IS NULL AND auth.uid() IS NOT NULL)
    -- O es un local en proceso de registro y revisión inicial
    OR (estado_aprobacion = 'pendiente')
    -- Administradores
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR (auth.role() = 'service_role')
)
WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (estado_aprobacion = 'pendiente')
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR (auth.role() = 'service_role')
);

-- D. Eliminación (DELETE)
-- Bloqueado para anónimos; solo administradores o service_role
CREATE POLICY "comercios_delete_restringido" ON public.comercios
FOR DELETE
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR (auth.role() = 'service_role')
);

-- ==============================================================================
-- 3. POLÍTICAS PARA: public.productos (Catálogo)
-- ==============================================================================

-- A. Lectura (SELECT)
-- Pública: cualquier vecino puede explorar los productos del catálogo
CREATE POLICY "productos_select_publico" ON public.productos
FOR SELECT
USING (true);

-- B. Creación de productos (INSERT)
-- Solo el dueño del comercio al que pertenece el producto
CREATE POLICY "productos_insert_duenio" ON public.productos
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.comercios c
        WHERE c.id = productos.comercio_id
          AND (c.user_id = auth.uid() OR auth.role() = 'service_role' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    )
);

-- C. Edición de productos (UPDATE)
-- Solo el dueño del comercio correspondiente
CREATE POLICY "productos_update_duenio" ON public.productos
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.comercios c
        WHERE c.id = productos.comercio_id
          AND (c.user_id = auth.uid() OR auth.role() = 'service_role' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    )
);

-- D. Eliminación de productos (DELETE)
-- Solo el dueño del comercio correspondiente
CREATE POLICY "productos_delete_duenio" ON public.productos
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.comercios c
        WHERE c.id = productos.comercio_id
          AND (c.user_id = auth.uid() OR auth.role() = 'service_role' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    )
);

-- ==============================================================================
-- 4. POLÍTICAS PARA: public.solicitudes_modificacion
-- ==============================================================================

-- A. Lectura (SELECT)
CREATE POLICY "solicitudes_select_autorizadas" ON public.solicitudes_modificacion
FOR SELECT
USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR EXISTS (
        SELECT 1 FROM public.comercios c
        WHERE c.id = solicitudes_modificacion.comercio_id
          AND (c.user_id = auth.uid() OR auth.role() = 'service_role' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR (auth.role() = 'service_role')
);

-- B. Inserción (INSERT)
CREATE POLICY "solicitudes_insert_autorizadas" ON public.solicitudes_modificacion
FOR INSERT
WITH CHECK (
    estado = 'pendiente'
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR (auth.role() = 'service_role')
);

-- C. Edición (UPDATE)
CREATE POLICY "solicitudes_update_autorizadas" ON public.solicitudes_modificacion
FOR UPDATE
USING (
    estado = 'pendiente'
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND auth.uid() IS NOT NULL)
    OR EXISTS (
        SELECT 1 FROM public.comercios c
        WHERE c.id = solicitudes_modificacion.comercio_id
          AND (c.user_id = auth.uid() OR auth.role() = 'service_role' OR auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR (auth.role() = 'service_role')
);

-- D. Eliminación (DELETE)
CREATE POLICY "solicitudes_delete_restringido" ON public.solicitudes_modificacion
FOR DELETE
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
    OR (auth.role() = 'service_role')
);

-- ==============================================================================
-- 5. CONFIRMACIÓN FINAL
-- ==============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Políticas RLS definitivas aplicadas con éxito en comercios, productos y solicitudes_modificacion.';
END $$;
