export type NivelComercio = 'standar' | 'premium' | 'gold';

export interface NivelConfig {
  nombre: string;
  limiteProductos: number;
  limiteOfertasSemanales: number;
  limiteOfertasDiarias?: number;
  requiereRenovacion: boolean;
  diasVigencia: number;
  diasDuracionOferta: number;
  badgeLabel: string;
  badgeColor: string;
}

export const NIVELES_CONFIG: Record<NivelComercio, NivelConfig> = {
  standar: {
    nombre: 'Standar',
    limiteProductos: 20,
    limiteOfertasSemanales: 0,
    limiteOfertasDiarias: 0,
    requiereRenovacion: false,
    diasVigencia: 0,
    diasDuracionOferta: 0,
    badgeLabel: 'Standar',
    badgeColor: 'zinc',
  },
  premium: {
    nombre: 'Premium',
    limiteProductos: 50,
    limiteOfertasSemanales: 5,
    limiteOfertasDiarias: 5,
    requiereRenovacion: true,
    diasVigencia: 30,
    diasDuracionOferta: 7,
    badgeLabel: 'Premium',
    badgeColor: 'purple',
  },
  gold: {
    nombre: 'Gold',
    limiteProductos: 100,
    limiteOfertasSemanales: 20,
    limiteOfertasDiarias: 20,
    requiereRenovacion: true,
    diasVigencia: 30,
    diasDuracionOferta: 7,
    badgeLabel: 'Gold',
    badgeColor: 'amber',
  },
};

export interface Comercio {
  id: string;
  nombre: string;
  rubro: string;
  direccion: string;
  localidad?: string;
  telefono: string;
  whatsapp?: string;
  email?: string;
  email_comercio?: string;
  estado_aprobacion?: 'pendiente' | 'aprobado' | 'rechazado';
  fecha_creacion?: string;
  fecha_solicitud?: string;
  // Enlaces y redes sociales
  sitio_web?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  otros_links?: string;
  esta_abierto: boolean;
  latitud: number;
  longitud: number;
  radio_entrega_metros?: number;
  zona_envio_descripcion?: string;
  cobertura_poligono?: [number, number][];
  nivel?: NivelComercio;
  nivel_solicitado?: NivelComercio;
  fecha_inicio_nivel?: string;
  fecha_vencimiento_nivel?: string | null;
  fecha_ultima_renovacion?: string | null;
  // Horarios cortados
  tiene_horario_cortado?: boolean;
  horario_manana?: string;
  horario_tarde?: string;
  // Farmacia de Turno
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
  // Cuarentena preventiva por reportes comunitarios
  en_cuarentena?: boolean;
  fecha_cuarentena?: string;
  motivo_cuarentena?: string;
  strikes_reportes?: number;
  oculto_por_inactividad?: boolean;
  ticket_baja_definitiva?: boolean;
  motivo_ticket_baja?: string;
  // Tratamiento de delivery
  tipo_atencion?: 'local_fisico' | 'solo_envio' | 'ambos';
  tarifa_envio_base?: number;
  // Reglas de urgencia y strikes disciplinarios
  contador_urgencias_mes?: number;
  strikes_urgencia?: number;
  // Modalidades de vacaciones
  modalidad_vacaciones?: 'descanso_total' | 'mostrar_con_aviso';
  dias_vacaciones_acumulados?: number;
  // Desahogo / confirmación de operatividad ante cuarentena
  confirmado_operativo_cuarentena?: boolean;
  fecha_confirmacion_operativo?: string;
  // Pulso semanal de certeza
  pulso_semanal_estado?: 'normal' | 'especial' | 'pausado' | 'pendiente' | 'alerta';
  fecha_ultimo_pulso?: string;
  // Reputación dinámica y Onboarding antifraude
  reputacion_categoria?: 'oro' | 'plata' | 'bronce' | 'observacion';
  onboarding_verificado?: boolean;
  fecha_verificacion_presencial?: string;
  verificado_por_admin?: string;
  calificacion_promedio?: number;
  calificaciones_total?: number;
}

export interface CalificacionComercio {
  id: string;
  comercio_id: string;
  comercio_nombre?: string;
  estrellas: number;
  comentario?: string;
  fecha: string;
  usuario_nombre?: string;
}

export type MotivoReporte =
  | 'cerro_definitivamente'
  | 'ubicacion_incorrecta'
  | 'telefono_no_existe'
  | 'horarios_incorrectos'
  | 'otro_problema';

export interface ReporteComercio {
  id: string;
  comercio_id: string;
  motivo: MotivoReporte;
  ip_usuario: string;
  fingerprint: string;
  fecha: string;
}

export type CreateComercioInput = Omit<Comercio, 'id'>;

export type UpdateComercioInput = Partial<Omit<Comercio, 'id'>>;

export const RUBROS_PREDEFINIDOS = [
  'Almacén',
  'Panadería',
  'Farmacia',
  'Verdulería',
  'Carnicería',
  'Ferretería',
  'Cafetería',
  'Kiosco',
  'Gastronomía',
  'Librería',
  'Veterinaria',
  'Otro',
] as const;

export type Rubro = (typeof RUBROS_PREDEFINIDOS)[number] | string;

export type TipoTicketSoporte =
  | 'problema_local_membresia'
  | 'problema_cuenta'
  | 'recomendacion'
  | 'local_membresia'
  | 'cuenta'
  | 'otro';

export type OrigenTicketSoporte = 'usuario' | 'comercio';

export type EstadoTicketSoporte = 'pendiente' | 'en_revision' | 'resuelto' | 'descartado';

export interface TicketSoporte {
  id: string;
  tipo: TipoTicketSoporte;
  origen: OrigenTicketSoporte;
  nombre: string;
  email: string;
  telefono?: string;
  comercio_nombre?: string;
  comercio_id?: string;
  asunto: string;
  mensaje: string;
  estado: EstadoTicketSoporte;
  fecha_creacion: string;
  respuesta_admin?: string;
  notas_admin?: string;
  resuelto_por?: string;
  fecha_resolucion?: string;
}

