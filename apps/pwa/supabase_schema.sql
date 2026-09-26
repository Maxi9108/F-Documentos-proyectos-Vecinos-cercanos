-- ==============================================================================
-- Esquema de Base de Datos para "Vecin@s Conectad@s" en Supabase (PostgreSQL)
-- Copia y pega este script en: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Habilitar extensión para generar UUIDs automáticamente
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabla Principal: comercios
CREATE TABLE IF NOT EXISTS public.comercios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    tipo_atencion TEXT DEFAULT 'local_fisico', -- 'local_fisico', 'solo_envio', 'ambos'
    radio_entrega_metros INTEGER DEFAULT 0,    -- Radio de cobertura de envío en metros (ej. 3000)
    zona_envio_descripcion TEXT,               -- Calles o límites de la zona de reparto
    estado_aprobacion TEXT DEFAULT 'aprobado', -- 'pendiente', 'aprobado', 'rechazado'
    categoria_solicitada TEXT,                 -- Categoría sugerida por el comerciante
    aprobado_por TEXT,                         -- Email del moderador que aprobó
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    motivo_rechazo TEXT,
    -- Niveles de comercio y membresía mensual
    nivel TEXT DEFAULT 'standar',              -- 'standar', 'premium', 'gold'
    nivel_solicitado TEXT DEFAULT 'standar',   -- Nivel pedido en el registro
    fecha_inicio_nivel TIMESTAMP WITH TIME ZONE,
    fecha_vencimiento_nivel TIMESTAMP WITH TIME ZONE,
    fecha_ultima_renovacion TIMESTAMP WITH TIME ZONE,
    -- Horarios cortados (mañana y tarde)
    tiene_horario_cortado BOOLEAN DEFAULT false,
    horario_manana TEXT,
    horario_tarde TEXT,
    -- Farmacia de turno (para rubro Farmacia)
    esta_de_turno BOOLEAN DEFAULT false,
    fecha_turno DATE,
    -- Cierre momentáneo por inconveniente
    cerrado_momentaneo BOOLEAN DEFAULT false,
    motivo_cierre_momentaneo TEXT,
    -- Cierre por vacaciones
    en_vacaciones BOOLEAN DEFAULT false,
    vacaciones_desde DATE,
    vacaciones_hasta DATE,
    mensaje_vacaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla comercios ya existía, añadir las columnas actualizadas:
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS tipo_atencion TEXT DEFAULT 'local_fisico';
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS radio_entrega_metros INTEGER DEFAULT 0;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS zona_envio_descripcion TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS estado_aprobacion TEXT DEFAULT 'aprobado';
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS categoria_solicitada TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS aprobado_por TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS nivel TEXT DEFAULT 'standar';
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS nivel_solicitado TEXT DEFAULT 'standar';
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS fecha_inicio_nivel TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS fecha_vencimiento_nivel TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS fecha_ultima_renovacion TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS tiene_horario_cortado BOOLEAN DEFAULT false;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS horario_manana TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS horario_tarde TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS esta_de_turno BOOLEAN DEFAULT false;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS fecha_turno DATE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS cerrado_momentaneo BOOLEAN DEFAULT false;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS motivo_cierre_momentaneo TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS fecha_cierre_emergencia TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS reapertura_emergencia_programada TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS en_vacaciones BOOLEAN DEFAULT false;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS vacaciones_desde DATE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS vacaciones_hasta DATE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS mensaje_vacaciones TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS oculto_por_inactividad BOOLEAN DEFAULT false;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS ticket_baja_definitiva BOOLEAN DEFAULT false;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS fecha_ticket_baja TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS motivo_ticket_baja TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS en_cuarentena BOOLEAN DEFAULT false;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS fecha_cuarentena TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS motivo_cuarentena TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS strikes_reportes INTEGER DEFAULT 0;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS horarios_config JSONB;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS email_comercio TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS password_comercio TEXT;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS fecha_ultima_modificacion_catalogo TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS catalogo JSONB;

-- 3. Tabla Secundaria: productos (catálogo y ofertas)
CREATE TABLE IF NOT EXISTS public.productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 4. Tabla de Categorías Oficiales y Homologadas
CREATE TABLE IF NOT EXISTS public.categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre TEXT UNIQUE NOT NULL,
    icono TEXT DEFAULT 'Store',
    activa BOOLEAN DEFAULT true,
    solicitada BOOLEAN DEFAULT false,
    creada_por TEXT DEFAULT 'SuperAdmin',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Administradores del Sistema (SuperAdmin y Nivel 2)
CREATE TABLE IF NOT EXISTS public.administradores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'admin_nivel2', -- 'superadmin' o 'admin_nivel2'
    permisos JSONB DEFAULT '{"corroborar_locales": true, "aprobar_rechazar": true, "asignar_categorias": true}'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar SuperAdmin principal inicial (Maxi) si no existe
INSERT INTO public.administradores (email, password_hash, nombre, rol, permisos)
VALUES (
    'maxi0802@gmail.com',
    'admin',
    'Maxi (SuperAdmin)',
    'superadmin',
    '{"corroborar_locales": true, "aprobar_rechazar": true, "asignar_categorias": true, "gestionar_equipo": true}'::jsonb
)
ON CONFLICT (email) DO NOTHING;

-- 6. Tabla de Analítica y Registro de Eventos
CREATE TABLE IF NOT EXISTS public.eventos_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_evento TEXT NOT NULL,
    comercio_id UUID,
    comercio_nombre TEXT,
    detalles JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Índices para optimizar búsquedas y moderación
CREATE INDEX IF NOT EXISTS idx_comercios_rubro ON public.comercios(rubro);
CREATE INDEX IF NOT EXISTS idx_comercios_abierto ON public.comercios(esta_abierto);
CREATE INDEX IF NOT EXISTS idx_comercios_estado ON public.comercios(estado_aprobacion);
CREATE INDEX IF NOT EXISTS idx_comercios_nivel ON public.comercios(nivel);
CREATE INDEX IF NOT EXISTS idx_comercios_vencimiento ON public.comercios(fecha_vencimiento_nivel);
CREATE INDEX IF NOT EXISTS idx_productos_comercio ON public.productos(comercio_id);
CREATE INDEX IF NOT EXISTS idx_productos_oferta ON public.productos(es_oferta);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo ON public.eventos_analytics(tipo_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON public.eventos_analytics(created_at);

-- Función para degradar automáticamente a 'standar' los comercios vencidos
CREATE OR REPLACE FUNCTION public.verificar_vencimientos_niveles()
RETURNS void AS $$
BEGIN
    UPDATE public.comercios
    SET nivel = 'standar'
    WHERE nivel IN ('premium', 'gold')
      AND fecha_vencimiento_nivel IS NOT NULL
      AND fecha_vencimiento_nivel < NOW();
END;
$$ LANGUAGE plpgsql;

-- 8. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.comercios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_analytics ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público para lectura y escritura
CREATE POLICY "Lectura comercios" ON public.comercios FOR SELECT USING (true);
CREATE POLICY "Escritura comercios" ON public.comercios FOR ALL USING (true);
CREATE POLICY "Lectura productos" ON public.productos FOR SELECT USING (true);
CREATE POLICY "Escritura productos" ON public.productos FOR ALL USING (true);
CREATE POLICY "Lectura categorias" ON public.categorias FOR SELECT USING (true);
CREATE POLICY "Escritura categorias" ON public.categorias FOR ALL USING (true);
CREATE POLICY "Lectura admins" ON public.administradores FOR SELECT USING (true);
CREATE POLICY "Escritura admins" ON public.administradores FOR ALL USING (true);
CREATE POLICY "Lectura eventos" ON public.eventos_analytics FOR SELECT USING (true);
CREATE POLICY "Escritura eventos" ON public.eventos_analytics FOR ALL USING (true);

-- 9. Tabla de Comprobantes de Transferencias (Pagos de Membresías)
CREATE TABLE IF NOT EXISTS public.comprobantes_transferencia (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    comercio_nombre TEXT NOT NULL,
    categoria_solicitada TEXT NOT NULL, -- 'premium' o 'gold'
    monto NUMERIC(12, 2),
    fecha_envio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    comprobante_url TEXT NOT NULL,
    comprobante_nombre TEXT,
    numero_operacion TEXT,
    banco_origen TEXT,
    notas TEXT,
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
    motivo_rechazo TEXT,
    aprobado_por TEXT,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Tabla de Debates e Inconvenientes (Privado entre Usuario, Comercio y Administrador)
CREATE TABLE IF NOT EXISTS public.debates_inconvenientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    comercio_nombre TEXT NOT NULL,
    usuario_id TEXT NOT NULL,
    usuario_nombre TEXT NOT NULL,
    usuario_email TEXT NOT NULL,
    usuario_telefono TEXT,
    motivo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    estado TEXT DEFAULT 'abierto', -- 'abierto', 'en_revision', 'resuelto'
    respuesta_comercio TEXT,
    fecha_respuesta TIMESTAMP WITH TIME ZONE,
    nota_administrador TEXT,
    fecha_resolucion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Tabla de Solicitudes de Modificación de Datos del Comercio
CREATE TABLE IF NOT EXISTS public.solicitudes_modificacion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    comercio_nombre TEXT NOT NULL,
    cambios JSONB NOT NULL,
    datos_anteriores JSONB,
    fecha_solicitud TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
    motivo_rechazo TEXT,
    aprobado_por TEXT,
    fecha_aprobacion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. Tabla de Tokens de Verificación de Email para Registro
CREATE TABLE IF NOT EXISTS public.tokens_registro (
    email TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    token TEXT NOT NULL,
    expira BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices adicionales
CREATE INDEX IF NOT EXISTS idx_comprobantes_estado ON public.comprobantes_transferencia(estado);
CREATE INDEX IF NOT EXISTS idx_comprobantes_comercio ON public.comprobantes_transferencia(comercio_id);
CREATE INDEX IF NOT EXISTS idx_debates_comercio ON public.debates_inconvenientes(comercio_id);
CREATE INDEX IF NOT EXISTS idx_debates_estado ON public.debates_inconvenientes(estado);
CREATE INDEX IF NOT EXISTS idx_modificaciones_comercio ON public.solicitudes_modificacion(comercio_id);
CREATE INDEX IF NOT EXISTS idx_modificaciones_estado ON public.solicitudes_modificacion(estado);

-- RLS para las nuevas tablas
ALTER TABLE public.comprobantes_transferencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debates_inconvenientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes_modificacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tokens_registro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura comprobantes" ON public.comprobantes_transferencia FOR SELECT USING (true);
CREATE POLICY "Escritura comprobantes" ON public.comprobantes_transferencia FOR ALL USING (true);
CREATE POLICY "Lectura debates" ON public.debates_inconvenientes FOR SELECT USING (true);
CREATE POLICY "Escritura debates" ON public.debates_inconvenientes FOR ALL USING (true);
CREATE POLICY "Lectura solicitudes mod" ON public.solicitudes_modificacion FOR SELECT USING (true);
CREATE POLICY "Escritura solicitudes mod" ON public.solicitudes_modificacion FOR ALL USING (true);
CREATE POLICY "Lectura tokens" ON public.tokens_registro FOR SELECT USING (true);
CREATE POLICY "Escritura tokens" ON public.tokens_registro FOR ALL USING (true);

-- 14. Tabla de Reportes Ciudadanos / Sugerir Corrección
CREATE TABLE IF NOT EXISTS public.reportes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    comercio_id UUID REFERENCES public.comercios(id) ON DELETE CASCADE,
    motivo TEXT NOT NULL, -- 'cerro_definitivamente', 'ubicacion_incorrecta', 'telefono_no_existe', 'horarios_incorrectos', 'otro_problema'
    ip_usuario TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para búsquedas rápidas anti-spam y ventana de 15/30 días
CREATE INDEX IF NOT EXISTS idx_reportes_comercio_fecha ON public.reportes(comercio_id, fecha);
CREATE INDEX IF NOT EXISTS idx_reportes_ip_fp ON public.reportes(ip_usuario, fingerprint, comercio_id);

ALTER TABLE public.reportes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura reportes" ON public.reportes FOR SELECT USING (true);
CREATE POLICY "Escritura reportes" ON public.reportes FOR ALL USING (true);

-- ==============================================================================
-- FUNCIÓN & TRIGGER: Control Anti-Spam y Cuarentena Automática por 3 Strikes
-- Cuenta usuarios únicos (por fingerprint o IP) en una ventana de 15 días.
-- Al alcanzar 3 reportes válidos, actualiza el comercio a estado 'cuarentena'.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_verificar_reportes_cuarentena()
RETURNS TRIGGER AS $$
DECLARE
    v_reportes_unicos INTEGER;
BEGIN
    -- Contar reportes de usuarios distintos (por fingerprint o IP) en los últimos 15 días
    SELECT COUNT(DISTINCT COALESCE(NULLIF(fingerprint, ''), ip_usuario))
    INTO v_reportes_unicos
    FROM public.reportes
    WHERE comercio_id = NEW.comercio_id
      AND fecha >= (NOW() - INTERVAL '15 days');

    -- Si alcanza 3 o más reportes válidos en la ventana de 15 días, pasa automáticamente a cuarentena
    IF v_reportes_unicos >= 3 THEN
        UPDATE public.comercios
        SET en_cuarentena = true,
            fecha_cuarentena = NOW(),
            motivo_cuarentena = 'Cuarentena preventiva: ' || v_reportes_unicos || ' reportes ciudadanos en menos de 15 días',
            strikes_reportes = v_reportes_unicos,
            updated_at = NOW()
        WHERE id = NEW.comercio_id;
    ELSE
        -- Actualizar contador informativo de strikes
        UPDATE public.comercios
        SET strikes_reportes = v_reportes_unicos,
            updated_at = NOW()
        WHERE id = NEW.comercio_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_verificar_reportes_cuarentena ON public.reportes;
CREATE TRIGGER trg_verificar_reportes_cuarentena
AFTER INSERT ON public.reportes
FOR EACH ROW
EXECUTE FUNCTION public.fn_verificar_reportes_cuarentena();

-- ==============================================================================
-- 9. Tabla de Usuarios Registrados del Sistema
-- Administrada desde el panel con soporte para bloqueo, baja y borrado definitivo.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL DEFAULT 'usuario', -- 'usuario', 'comerciante', 'admin', 'superadmin'
    estado TEXT NOT NULL DEFAULT 'activo', -- 'activo', 'bloqueado', 'baja'
    motivo_estado TEXT,
    comercio_id TEXT,
    comercio_nombre TEXT,
    fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ultimo_acceso TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en usuarios
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura pública de usuarios" ON public.usuarios FOR SELECT USING (true);
CREATE POLICY "Gestión completa de usuarios" ON public.usuarios FOR ALL USING (true);

-- ==============================================================================
-- 10. Tabla de Tokens de Registro y Verificación por Email
-- Los tokens nunca se muestran en pantalla, viajan por correo para autenticar.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.tokens_registro (
    email TEXT PRIMARY KEY,
    token TEXT NOT NULL,
    expira_en BIGINT NOT NULL,
    intentos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tokens_registro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Gestión de tokens" ON public.tokens_registro FOR ALL USING (true);



