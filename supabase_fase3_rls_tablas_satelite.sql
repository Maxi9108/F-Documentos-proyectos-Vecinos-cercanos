-- ==============================================================================
-- FASE 3: BLINDAJE RLS — TABLAS SATÉLITE
-- Proyecto: NeoFaro
-- Panel Supabase: https://supabase.com/dashboard/project/hajepxscgwbgiifcfndz
-- Fecha: 2026-10-19
-- ==============================================================================
-- Este script aplica políticas de Row Level Security estrictas en las tablas
-- satélite que quedaron pendientes del plan de seguridad original:
--
--   1. comprobantes_transferencia — privacidad bancaria
--   2. reportes — privacidad ciudadana / anti-spam
--   3. categorias — integridad del catálogo
--   4. debates_inconvenientes — privacidad ciudadana
-- ==============================================================================

-- MACRO: is_admin() — helper interno para no repetir la condición en cada política
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    auth.role() = 'service_role'
    OR (auth.jwt() -> 'app_metadata' ->> 'role' = 'admin')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon, service_role;

-- ==============================================================================
-- 1. LIMPIEZA PREVENTIVA DE POLÍTICAS ANTERIORES EN ESTAS TABLAS
-- ==============================================================================
DO $$
DECLARE
    p RECORD;
BEGIN
    FOR p IN (
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN (
            'comprobantes_transferencia',
            'reportes',
            'categorias',
            'debates_inconvenientes'
          )
    ) LOOP
        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I.%I;',
            p.policyname, p.schemaname, p.tablename
        );
    END LOOP;
END $$;

ALTER TABLE public.comprobantes_transferencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reportes                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debates_inconvenientes     ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. comprobantes_transferencia — privacidad bancaria
-- ==============================================================================
CREATE POLICY "comprobantes_insert_duenio"
ON public.comprobantes_transferencia FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL OR public.is_admin());

CREATE POLICY "comprobantes_select_duenio_o_admin"
ON public.comprobantes_transferencia FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.comercios c
        WHERE c.id = comprobantes_transferencia.comercio_id
          AND c.user_id = auth.uid()
    )
);

CREATE POLICY "comprobantes_update_solo_admin"
ON public.comprobantes_transferencia FOR UPDATE
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "comprobantes_delete_solo_admin"
ON public.comprobantes_transferencia FOR DELETE
USING (public.is_admin());

-- ==============================================================================
-- 3. reportes — cualquiera puede denunciar, solo admins pueden leer
-- ==============================================================================
CREATE POLICY "reportes_insert_publico"
ON public.reportes FOR INSERT WITH CHECK (true);

CREATE POLICY "reportes_select_solo_admin"
ON public.reportes FOR SELECT USING (public.is_admin());

CREATE POLICY "reportes_update_solo_admin"
ON public.reportes FOR UPDATE
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "reportes_delete_solo_admin"
ON public.reportes FOR DELETE USING (public.is_admin());

-- ==============================================================================
-- 4. categorias — lectura pública, escritura solo admins
-- ==============================================================================
CREATE POLICY "categorias_select_publico"
ON public.categorias FOR SELECT USING (true);

CREATE POLICY "categorias_insert_solo_admin"
ON public.categorias FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "categorias_update_solo_admin"
ON public.categorias FOR UPDATE
USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "categorias_delete_solo_admin"
ON public.categorias FOR DELETE USING (public.is_admin());

-- ==============================================================================
-- 5. debates_inconvenientes — comercio involucrado y admins
-- ==============================================================================
CREATE POLICY "debates_insert_ciudadanos"
ON public.debates_inconvenientes FOR INSERT WITH CHECK (true);

CREATE POLICY "debates_select_comercio_o_admin"
ON public.debates_inconvenientes FOR SELECT
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.comercios c
        WHERE c.id = debates_inconvenientes.comercio_id
          AND c.user_id = auth.uid()
    )
);

CREATE POLICY "debates_update_comercio_o_admin"
ON public.debates_inconvenientes FOR UPDATE
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.comercios c
        WHERE c.id = debates_inconvenientes.comercio_id
          AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.comercios c
        WHERE c.id = debates_inconvenientes.comercio_id
          AND c.user_id = auth.uid()
    )
);

CREATE POLICY "debates_delete_solo_admin"
ON public.debates_inconvenientes FOR DELETE USING (public.is_admin());

-- ==============================================================================
-- 6. CONFIRMACIÓN FINAL
-- ==============================================================================
DO $$
BEGIN
    RAISE NOTICE 'Fase 3 completada: RLS estricto aplicado en comprobantes_transferencia, reportes, categorias y debates_inconvenientes.';
    RAISE NOTICE 'comprobantes_transferencia: privacidad bancaria activa.';
    RAISE NOTICE 'reportes: solo admins pueden leer denuncias.';
    RAISE NOTICE 'categorias: solo admins pueden crear/editar/borrar.';
    RAISE NOTICE 'debates_inconvenientes: solo el comercio y admins pueden leer/responder.';
END $$;
