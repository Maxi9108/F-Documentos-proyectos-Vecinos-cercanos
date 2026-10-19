-- ==============================================================================
-- FASE 1: PREPARACIÓN DE ESQUEMA PARA SUPABASE AUTH (SIN ROTURAS)
-- Proyecto: NeoFaro
-- Panel Supabase: https://supabase.com/dashboard/project/hajepxscgwbgiifcfndz
-- ==============================================================================
-- Este script es 100% SEGURO Y NO DESTRUCTIVO:
-- 1. Agrega la columna 'user_id' a 'public.comercios' referenciando 'auth.users(id)'.
-- 2. Agrega la columna 'user_id' a 'public.solicitudes_modificacion' referenciando 'auth.users(id)'.
-- 3. Crea índices B-Tree para optimizar las consultas por usuario autenticado.
-- 4. PRESERVA intactas las columnas 'email_comercio' y 'password_comercio' para que la
--    aplicación actual siga funcionando al 100% mientras se ejecuta la migración.
-- ==============================================================================

-- 1. Agregar columna user_id en public.comercios
ALTER TABLE public.comercios 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Índice para consultas rápidas por dueño de comercio
CREATE INDEX IF NOT EXISTS idx_comercios_user_id ON public.comercios(user_id);

-- 3. Agregar columna user_id en public.solicitudes_modificacion
ALTER TABLE public.solicitudes_modificacion 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Índice para solicitudes de modificación por usuario
CREATE INDEX IF NOT EXISTS idx_solicitudes_modificacion_user_id ON public.solicitudes_modificacion(user_id);

-- 5. Mensaje de confirmación en la consola SQL de Supabase
DO $$
BEGIN
    RAISE NOTICE 'Fase 1 completada con éxito: user_id vinculado a auth.users e índices creados.';
END $$;
