export interface Producto {
  id: string;
  comercio_id: string;
  nombre: string;
  descripcion?: string;
  precio: number;
  precio_oferta?: number;
  es_oferta: boolean;
  descuento_porcentaje?: number;
  imagen_url?: string;
  categoria?: string;
  fecha_oferta?: string;
}

export type NivelComercio = 'standar' | 'premium' | 'gold';

export interface NivelConfig {
  nombre: string;
  limiteProductos: number;
  limiteOfertasDiarias: number;
  requiereRenovacion: boolean;
  diasVigencia: number;
  badgeLabel: string;
  badgeColor: string;
  descripcion: string;
}

export const NIVELES_CONFIG: Record<NivelComercio, NivelConfig> = {
  standar: {
    nombre: 'Standar',
    limiteProductos: 20,
    limiteOfertasDiarias: 0,
    requiereRenovacion: false,
    diasVigencia: 0,
    badgeLabel: 'Standar',
    badgeColor: 'zinc',
    descripcion: 'Catálogo de hasta 20 artículos esenciales para tu comercio.',
  },
  premium: {
    nombre: 'Premium',
    limiteProductos: 50,
    limiteOfertasDiarias: 2,
    requiereRenovacion: true,
    diasVigencia: 30,
    badgeLabel: 'Premium',
    badgeColor: 'purple',
    descripcion: 'Catálogo de hasta 50 productos y hasta 2 ofertas barriales por día.',
  },
  gold: {
    nombre: 'Gold',
    limiteProductos: 100,
    limiteOfertasDiarias: 5,
    requiereRenovacion: true,
    diasVigencia: 30,
    badgeLabel: 'Gold',
    badgeColor: 'amber',
    descripcion: 'Máxima visibilidad: catálogo de hasta 100 productos y 5 ofertas diarias destacadas.',
  },
};

export type TipoAtencion = 'local_fisico' | 'solo_envio' | 'ambos';

export type EstadoAprobacion = 'pendiente' | 'aprobado' | 'rechazado';

export interface Comercio {
  id: string;
  nombre: string;
  rubro: string;
  direccion: string;
  telefono: string;
  esta_abierto: boolean;
  latitud: number;
  longitud: number;
  // Campos extendidos
  descripcion?: string;
  horario?: string;
  whatsapp?: string;
  tiene_catalogo?: boolean;
  productos?: Producto[];
  // Campos para venta a domicilio y cobertura
  tipo_atencion?: TipoAtencion;
  radio_entrega_metros?: number;
  zona_envio_descripcion?: string;
  // Campos de moderación y aprobación
  estado_aprobacion?: EstadoAprobacion;
  categoria_solicitada?: string;
  aprobado_por?: string;
  fecha_solicitud?: string;
  fecha_aprobacion?: string;
  motivo_rechazo?: string;
  // Campos de Nivel / Categoría de membresía
  nivel?: NivelComercio;
  nivel_solicitado?: NivelComercio;
  fecha_inicio_nivel?: string;
  fecha_vencimiento_nivel?: string | null;
  fecha_ultima_renovacion?: string | null;
  // Horarios cortados (turno mañana y tarde)
  tiene_horario_cortado?: boolean;
  horario_manana?: string;
  horario_tarde?: string;
  // Farmacia de Turno (solo farmacias)
  esta_de_turno?: boolean;
  fecha_turno?: string;
  // Cierre momentáneo por inconveniente
  cerrado_momentaneo?: boolean;
  motivo_cierre_momentaneo?: string;
  // Modo Vacaciones
  en_vacaciones?: boolean;
  vacaciones_desde?: string;
  vacaciones_hasta?: string;
  mensaje_vacaciones?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
  icono?: string;
  solicitada?: boolean;
  creada_por?: string;
  creada_at?: string;
}

export type RolAdmin = 'superadmin' | 'admin_nivel2';

export interface PermisosAdmin {
  corroborar_locales: boolean;
  aprobar_rechazar: boolean;
  asignar_categorias: boolean;
  gestionar_equipo?: boolean;
}

export interface Administrador {
  id: string;
  email: string;
  password?: string;
  nombre: string;
  rol: RolAdmin;
  permisos: PermisosAdmin;
  activo: boolean;
  created_at: string;
}

export type TipoEvento =
  | 'visita_portal'
  | 'visita_comercio'
  | 'clic_whatsapp'
  | 'clic_llamada'
  | 'apertura_catalogo'
  | 'busqueda_realizada'
  | 'solicitud_comercio'
  | 'comercio_aprobado'
  | 'comercio_rechazado';

export interface EventoAnalytics {
  id: string;
  tipo_evento: TipoEvento;
  comercio_id?: string;
  comercio_nombre?: string;
  detalles?: Record<string, unknown>;
  timestamp: string;
}

export type Rubro = 
  | 'Todos'
  | 'Almacén'
  | 'Panadería'
  | 'Farmacia'
  | 'Verdulería'
  | 'Carnicería'
  | 'Ferretería'
  | 'Cafetería'
  | 'Kiosco'
  | 'Gastronomía'
  | 'Reparto de Agua y Bebidas'
  | string;
