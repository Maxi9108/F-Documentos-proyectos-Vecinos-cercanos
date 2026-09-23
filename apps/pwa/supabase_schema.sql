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
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS en_vacaciones BOOLEAN DEFAULT false;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS vacaciones_desde DATE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS vacaciones_hasta DATE;
ALTER TABLE public.comercios ADD COLUMN IF NOT EXISTS mensaje_vacaciones TEXT;

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
