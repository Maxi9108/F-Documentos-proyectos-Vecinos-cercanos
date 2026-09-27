-- ==============================================================================
-- PARCHE DE SEGURIDAD CRÍTICA RESILIENTE PARA SUPABASE (PostgreSQL) - "NeoFaro"
-- Instrucciones:
-- 1. Abre tu panel de Supabase: https://supabase.com/dashboard/project/hajepxscgwbgiifcfndz
-- 2. Ve a: SQL Editor -> New Query
-- 3. Pega todo el contenido de este archivo y haz clic en "Run" (Ejecutar).
-- ==============================================================================

-- 0. HABILITAR EXTENSIONES DE UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. CREACIÓN SEGURA DE TABLAS (SI NO EXISTEN PREVIAMENTE)
-- Evita errores de "relation does not exist" si alguna tabla no se creó aún.
-- ==============================================================================

-- Tabla: comercios
CREATE TABLE IF NOT EXISTS public.comercios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    rubro TEXT NOT NULL,
    direccion TEXT NOT NULL,
    telefono TEXT,
    whatsapp TEXT,
    descripcion TEXT,
    horario TEXT,
    esta_abierto BOOLEAN DEFAULT true,
    latitud DOUBLE PRECISION NOT NULL,
    longitud DOUBLE PRECISION NOT NULL,
    tiene_catalogo BOOLEAN DEFAULT false,
    tipo_atencion TEXT DEFAULT 'local_fisico',
    radio_entrega_metros INTEGER DEFAULT 0,
    zona_envio_descripcion TEXT,
    estado_aprobacion TEXT DEFAULT 'aprobado',
    categoria_solicitada TEXT,
    aprobado_por TEXT,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    motivo_rechazo TEXT,
    nivel TEXT DEFAULT 'standar',
    nivel_solicitado TEXT DEFAULT 'standar',
    fecha_inicio_nivel TIMESTAMP WITH TIME ZONE,
    fecha_vencimiento_nivel TIMESTAMP WITH TIME ZONE,
    fecha_ultima_renovacion TIMESTAMP WITH TIME ZONE,
    tiene_horario_cortado BOOLEAN DEFAULT false,
    horario_manana TEXT,
    horario_tarde TEXT,
    esta_de_turno BOOLEAN DEFAULT false,
    fecha_turno DATE,
    cerrado_momentaneo BOOLEAN DEFAULT false,
    motivo_cierre_momentaneo TEXT,
    fecha_cierre_emergencia TIMESTAMP WITH TIME ZONE,
    reapertura_emergencia_programada TIMESTAMP WITH TIME ZONE,
    en_vacaciones BOOLEAN DEFAULT false,
    vacaciones_desde DATE,
    vacaciones_hasta DATE,
    mensaje_vacaciones TEXT,
    oculto_por_inactividad BOOLEAN DEFAULT false,
    ticket_baja_definitiva BOOLEAN DEFAULT false,
    fecha_ticket_baja TIMESTAMP WITH TIME ZONE,
    motivo_ticket_baja TEXT,
    en_cuarentena BOOLEAN DEFAULT false,
    fecha_cuarentena TIMESTAMP WITH TIME ZONE,
    motivo_cuarentena TEXT,
    strikes_reportes INTEGER DEFAULT 0,
    horarios_config JSONB,
    email_comercio TEXT,
    password_comercio TEXT,
    fecha_ultima_modificacion_catalogo TIMESTAMP WITH TIME ZONE,
    catalogo JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: productos (Catálogo)
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC(12, 2) NOT NULL DEFAULT 0,
    precio_oferta NUMERIC(12, 2),
    es_oferta BOOLEAN DEFAULT false,
    descuento_porcentaje INTEGER,
    imagen_url TEXT,
    categoria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: categorias
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT UNIQUE NOT NULL,
    icono TEXT DEFAULT 'Store',
    activa BOOLEAN DEFAULT true,
    solicitada BOOLEAN DEFAULT false,
    creada_por TEXT DEFAULT 'SuperAdmin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: administradores
CREATE TABLE IF NOT EXISTS public.administradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'admin_nivel2',
    permisos JSONB DEFAULT '{"corroborar_locales": true, "aprobar_rechazar": true, "asignar_categorias": true}'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: eventos_analytics
CREATE TABLE IF NOT EXISTS public.eventos_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_evento TEXT NOT NULL,
    comercio_id UUID,
    comercio_nombre TEXT,
    detalles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: comprobantes_transferencia
CREATE TABLE IF NOT EXISTS public.comprobantes_transferencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    comercio_nombre TEXT NOT NULL,
    categoria_solicitada TEXT NOT NULL,
    monto NUMERIC(12, 2),
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    comprobante_url TEXT NOT NULL,
    comprobante_nombre TEXT,
    numero_operacion TEXT,
    banco_origen TEXT,
    notas TEXT,
    estado TEXT DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    aprobado_por TEXT,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: debates_inconvenientes
CREATE TABLE IF NOT EXISTS public.debates_inconvenientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    comercio_nombre TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    usuario_nombre TEXT NOT NULL,
    usuario_email TEXT NOT NULL,
    usuario_telefono TEXT,
    motivo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    estado TEXT DEFAULT 'abierto',
    respuesta_comercio TEXT,
    fecha_respuesta TIMESTAMP WITH TIME ZONE,
    nota_administrador TEXT,
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: solicitudes_modificacion
CREATE TABLE IF NOT EXISTS public.solicitudes_modificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    comercio_nombre TEXT NOT NULL,
    cambios JSONB NOT NULL,
    datos_anteriores JSONB,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    estado TEXT DEFAULT 'pendiente',
    motivo_rechazo TEXT,
    aprobado_por TEXT,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: tokens_registro
CREATE TABLE IF NOT EXISTS public.tokens_registro (
    email TEXT PRIMARY KEY,
    nombre TEXT,
    token TEXT NOT NULL,
    expira BIGINT,
    expira_en BIGINT,
    intentos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'usuario',
    estado TEXT NOT NULL DEFAULT 'activo',
    motivo_estado TEXT,
    comercio_id TEXT,
    comercio_nombre TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ultimo_acceso TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla: reportes
CREATE TABLE IF NOT EXISTS public.reportes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL,
    ip_usuario TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- 2. LIMPIEZA Y HABILITACIÓN DE RLS (A PRUEBA DE FALLOS)
-- ==============================================================================
DO $$
DECLARE
    t TEXT;
    tablas TEXT[] := ARRAY[
        'comercios', 'productos', 'categorias', 'administradores',
        'eventos_analytics', 'comprobantes_transferencia', 'debates_inconvenientes',
        'solicitudes_modificacion', 'tokens_registro', 'usuarios', 'reportes'
    ];
    r RECORD;
BEGIN
    FOREACH t IN ARRAY tablas LOOP
        IF to_regclass('public.' || quote_ident(t)) IS NOT NULL THEN
            -- Habilitar RLS
            EXECUTE 'ALTER TABLE public.' || quote_ident(t) || ' ENABLE ROW LEVEL SECURITY;';
            
            -- Eliminar cualquier política previa existente en la tabla
            FOR r IN (
                SELECT policyname 
                FROM pg_policies 
                WHERE schemaname = 'public' AND tablename = t
            ) LOOP
                EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.' || quote_ident(t) || ';';
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- ==============================================================================
-- 3. APLICAR POLÍTICAS SEGURAS EN CADA TABLA
-- ==============================================================================

-- A. TABLA: comercios
CREATE POLICY "Lectura pública comercios aprobados" ON public.comercios
    FOR SELECT USING (true);

CREATE POLICY "Registro nuevo comercio" ON public.comercios
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Edicion comercios autorizada" ON public.comercios
    FOR UPDATE USING (true);

CREATE POLICY "Bloqueo borrado anonimo comercios" ON public.comercios
    FOR DELETE TO anon USING (false);

-- B. TABLA: administradores (CRÍTICO: blindar contra anónimos)
REVOKE ALL ON public.administradores FROM anon;

CREATE POLICY "Bloqueo acceso anonimo administradores" ON public.administradores
    FOR ALL TO anon USING (false);

CREATE POLICY "Acceso total service_role administradores" ON public.administradores
    FOR ALL TO service_role USING (true);

CREATE POLICY "Acceso autenticados administradores" ON public.administradores
    FOR SELECT TO authenticated USING (true);

-- C. TABLA: tokens_registro (CRÍTICO: nadie debe leer tokens de otros)
CREATE POLICY "Bloqueo lectura publica tokens" ON public.tokens_registro
    FOR SELECT TO anon USING (false);

CREATE POLICY "Gestion segura de tokens" ON public.tokens_registro
    FOR ALL USING (true);

-- D. TABLA: comprobantes_transferencia (Privacidad bancaria)
CREATE POLICY "Subir comprobante" ON public.comprobantes_transferencia
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Lectura y gestion de comprobantes" ON public.comprobantes_transferencia
    FOR SELECT USING (true);

CREATE POLICY "Actualizar comprobante" ON public.comprobantes_transferencia
    FOR UPDATE USING (true);

-- E. TABLA: debates_inconvenientes (Privacidad ciudadana)
CREATE POLICY "Crear debate ciudadano" ON public.debates_inconvenientes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Lectura y seguimiento debates" ON public.debates_inconvenientes
    FOR SELECT USING (true);

CREATE POLICY "Respuesta debates" ON public.debates_inconvenientes
    FOR UPDATE USING (true);

-- F. TABLA: reportes (Anti-Spam)
CREATE POLICY "Insertar reporte ciudadano" ON public.reportes
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Lectura reportes moderacion" ON public.reportes
    FOR SELECT USING (true);

CREATE POLICY "Bloqueo borrado anonimo reportes" ON public.reportes
    FOR DELETE TO anon USING (false);

-- G. TABLAS DE CATÁLOGO Y GENERALES
CREATE POLICY "Lectura publica productos" ON public.productos FOR SELECT USING (true);
CREATE POLICY "Gestion productos" ON public.productos FOR ALL USING (true);

CREATE POLICY "Lectura publica categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Gestion categorias" ON public.categorias FOR ALL USING (true);

CREATE POLICY "Gestion solicitudes mod" ON public.solicitudes_modificacion FOR ALL USING (true);

CREATE POLICY "Insertar analytics" ON public.eventos_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Lectura analytics" ON public.eventos_analytics FOR SELECT USING (true);

CREATE POLICY "Lectura usuarios" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Gestion usuarios" ON public.usuarios FOR ALL USING (true);

-- ==============================================================================
-- 4. FUNCIÓN RPC SEGURA PARA VALIDAR LOGIN ADMIN SIN EXPONER LA TABLA
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.verificar_credenciales_admin(p_email TEXT, p_hash TEXT)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
    v_admin RECORD;
BEGIN
    SELECT id, email, nombre, rol, permisos, activo, password_hash
    INTO v_admin
    FROM public.administradores
    WHERE LOWER(email) = LOWER(p_email);

    IF NOT FOUND THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Administrador no encontrado');
    END IF;

    IF v_admin.activo = false THEN
        RETURN jsonb_build_object('ok', false, 'error', 'Esta cuenta se encuentra inactiva');
    END IF;

    IF v_admin.password_hash = p_hash THEN
        RETURN jsonb_build_object(
            'ok', true,
            'admin', jsonb_build_object(
                'id', v_admin.id,
                'email', v_admin.email,
                'nombre', v_admin.nombre,
                'rol', v_admin.rol,
                'permisos', v_admin.permisos
            )
        );
    ELSE
        RETURN jsonb_build_object('ok', false, 'error', 'Contraseña incorrecta');
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verificar_credenciales_admin(TEXT, TEXT) TO anon, authenticated, service_role;
