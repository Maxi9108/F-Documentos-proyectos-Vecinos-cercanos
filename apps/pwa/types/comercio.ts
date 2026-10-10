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
  // Gestión ágil de stock (Disponible / Agotado con reordenamiento y auto-archivo a 30 días)
  agotado?: boolean;
  fecha_agotado?: string;
  // Ofertas dinámicas con cuenta regresiva en vivo
  hora_vencimiento_oferta?: string;
  duracion_horas_oferta?: number;
  unidades_limitadas?: number;
}

export type NivelComercio = 'standar' | 'premium' | 'gold';

export interface NivelConfig {
  nombre: string;
  limiteProductos: number;
  limiteOfertasSemanales: number;
  limiteOfertasDiarias: number;
  requiereRenovacion: boolean;
  diasVigencia: number;
  diasDuracionOferta: number;
  badgeLabel: string;
  badgeColor: string;
  descripcion: string;
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
    descripcion: 'Catálogo de hasta 20 artículos esenciales para tu comercio.',
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
    descripcion: 'Catálogo de hasta 50 productos y 5 ofertas semanales con duración de 7 días.',
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
    descripcion: 'Máxima visibilidad: catálogo de hasta 100 productos y 20 ofertas semanales con duración de 7 días.',
  },
};

export type TipoAtencion = 'local_fisico' | 'solo_envio' | 'ambos';

export type EstadoAprobacion = 'pendiente' | 'aprobado' | 'rechazado' | 'eliminado';

export interface Comercio {
  id: string;
  nombre: string;
  rubro: string;
  direccion: string;
  localidad?: string;
  telefono: string;
  email?: string;
  // Enlaces y redes sociales
  sitio_web?: string;
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  otros_links?: string;
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
  // Cierre momentáneo por emergencia con caducidad automática
  cerrado_momentaneo?: boolean;
  motivo_cierre_momentaneo?: string;
  fecha_cierre_emergencia?: string;
  reapertura_emergencia_programada?: string;
  // Modo Vacaciones programadas obligatorias
  en_vacaciones?: boolean;
  vacaciones_desde?: string;
  vacaciones_hasta?: string;
  mensaje_vacaciones?: string;
  // Control de inactividad prolongada (+60 días) y tickets de baja
  oculto_por_inactividad?: boolean;
  ticket_baja_definitiva?: boolean;
  fecha_ticket_baja?: string;
  motivo_ticket_baja?: string;
  // Cuarentena preventiva por reportes comunitarios (3 strikes en 15 días)
  en_cuarentena?: boolean;
  fecha_cuarentena?: string;
  motivo_cuarentena?: string;
  strikes_reportes?: number;
  // Configuración avanzada de días y horarios (con soporte trasnoche)
  horarios_config?: HorariosConfig;
  // Credenciales exclusivas del comercio para portal mi-comercio
  email_comercio?: string;
  password_comercio?: string;
  // Control de modificación de catálogo (1 vez por mes / 30 días)
  fecha_ultima_modificacion_catalogo?: string;
  // Tratamiento diferencial de delivery / dark store (zona de cobertura y tarifas)
  cobertura_poligono?: [number, number][];
  tarifa_envio_base?: number;
  // Reglas de urgencia y strikes disciplinarios (3 urgencias/mes = 1 strike)
  contador_urgencias_mes?: number;
  mes_contador_urgencias?: string; // Formato "YYYY-MM"
  strikes_urgencia?: number;
  // Modalidades de vacaciones (descanso total vs mostrar con aviso)
  modalidad_vacaciones?: 'descanso_total' | 'mostrar_con_aviso';
  dias_vacaciones_acumulados?: number;
  // Desahogo / confirmación de operatividad ante cuarentena
  confirmado_operativo_cuarentena?: boolean;
  fecha_confirmacion_operativo?: string;
  // Pulso semanal de certeza
  pulso_semanal_estado?: 'normal' | 'especial' | 'pausado' | 'pendiente' | 'alerta';
  fecha_ultimo_pulso?: string;
  // Reputación dinámica (Oro, Plata, Bronce, Observación) y Onboarding antifraude
  reputacion_categoria?: 'oro' | 'plata' | 'bronce' | 'observacion';
  onboarding_verificado?: boolean;
  fecha_verificacion_presencial?: string;
  // Calificación vecinal interna (1 a 5 estrellas - Solo visible para Administradores y el Comercio)
  calificacion_promedio?: number;
  calificaciones_total?: number;
  estado?: 'activo' | 'inactivo' | 'suspendido' | 'pendiente';
  strikes_disciplinarios?: number;
}

export interface CalificacionComercio {
  id: string;
  comercio_id: string;
  comercio_nombre?: string;
  estrellas: number; // 1 a 5
  comentario?: string;
  fecha: string; // ISO 8601
  creado_en?: string;
  usuario_nombre?: string;
}

export type MotivoReporte =
  | 'cerro_definitivamente'
  | 'ubicacion_incorrecta'
  | 'telefono_no_existe'
  | 'horarios_incorrectos'
  | 'otro_problema';

export const MOTIVOS_REPORTE_CONFIG: Record<
  MotivoReporte,
  { label: string; descripcion: string }
> = {
  cerro_definitivamente: {
    label: 'Cerró definitivamente',
    descripcion: 'El local físico ya no existe o cesó sus actividades de forma permanente.',
  },
  ubicacion_incorrecta: {
    label: 'Ubicación incorrecta en el mapa',
    descripcion: 'El marcador o la dirección indicada no coinciden con el lugar real.',
  },
  telefono_no_existe: {
    label: 'El teléfono no existe',
    descripcion: 'El número no atiende, se encuentra dado de baja o es equivocado.',
  },
  horarios_incorrectos: {
    label: 'Horarios de atención falsos',
    descripcion: 'Figura como abierto pero el local está cerrado de forma recurrente.',
  },
  otro_problema: {
    label: 'Información desactualizada o engañosa',
    descripcion: 'Datos del comercio desvirtuados, rubro incorrecto o atención simulada.',
  },
};

export interface ReporteComercio {
  id: string;
  comercio_id: string;
  motivo: MotivoReporte;
  ip_usuario: string;
  fingerprint: string;
  fecha: string; // ISO 8601
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
  pregunta_seguridad?: string;
  respuesta_seguridad?: string;
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
  | 'comercio_rechazado'
  | 'comprobante_transferencia_enviado'
  | 'comprobante_aprobado'
  | 'comprobante_rechazado'
  | 'solicitud_modificacion_comercio'
  | 'modificacion_comercio_aprobada'
  | 'debate_iniciado'
  | 'debate_respondido'
  | 'debate_resuelto'
  | 'catalogo_actualizado_mensual';

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

// Comprobantes de transferencias para renovación de membresías Premium y Gold
export interface ComprobanteTransferencia {
  id: string;
  comercio_id: string;
  comercio_nombre: string;
  categoria_solicitada: NivelComercio; // 'premium' | 'gold'
  monto?: number;
  fecha_envio: string;
  fecha_creacion?: string;
  comprobante_url: string; // Base64 data URL o URL de archivo
  comprobante_nombre?: string;
  numero_operacion?: string;
  banco_origen?: string;
  notas?: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  motivo_rechazo?: string;
  aprobado_por?: string;
  revisado_por?: string;
  fecha_aprobacion?: string;
  fecha_revision?: string;
  meses_acreditados?: number;
}

// Debates e inconvenientes entre usuarios registrados y comercios
export type EstadoDebate = 'abierto' | 'en_revision' | 'resuelto';

export interface DebateInconveniente {
  id: string;
  comercio_id: string;
  comercio_nombre: string;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  usuario_telefono?: string;
  telefono_contacto?: string;
  motivo: string;
  descripcion: string;
  fecha_creacion: string;
  estado: EstadoDebate;
  respuesta_comercio?: string;
  fecha_respuesta?: string;
  nota_administrador?: string;
  nota_admin?: string;
  fecha_resolucion?: string;
}

// Modificaciones solicitadas por un comercio sujetas a aprobación del administrador
export interface ModificacionComercio {
  id: string;
  comercio_id: string;
  comercio_nombre: string;
  usuario_email?: string;
  fecha_solicitud: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  motivo_rechazo?: string;
  aprobado_por?: string;
  revisado_por?: string;
  fecha_aprobacion?: string;
  fecha_revision?: string;
  cambios: Partial<Comercio>;
  cambios_propuestos?: Partial<Comercio>;
  datos_anteriores?: Partial<Comercio>;
}

// Tokens de verificación para registro de usuarios
export interface TokenRegistro {
  email: string;
  nombre: string;
  token: string;
  expira: number; // Timestamp en ms
}

// ==============================================================================
// 15. ESTRUCTURA AVANZADA DE HORARIOS Y TRASNOCHE (Bares, Restoranes, Locales)
// ==============================================================================
export interface HorarioTurno {
  abre: string;   // Formato "HH:mm", ej: "20:00"
  cierra: string; // Formato "HH:mm", ej: "03:00"
  esTrasnoche?: boolean; // Verdadero si cierra al día siguiente (ej. 20:00 a 03:00)
}

export interface HorarioDia {
  abierto: boolean;
  turnos: HorarioTurno[]; // 1 turno = corrido, 2 turnos = mañana y tarde
}

export type DiaSemana =
  | 'lunes'
  | 'martes'
  | 'miercoles'
  | 'jueves'
  | 'viernes'
  | 'sabado'
  | 'domingo';

export interface HorariosConfig {
  modo: 'bloques' | 'personalizado';
  // Modo Bloques: Lun a Vie, Sábados y Domingos
  bloques?: {
    lunesViernes: HorarioDia;
    sabado: HorarioDia;
    domingoFeriados: HorarioDia;
  };
  // Modo Personalizado: Día por día específico
  dias?: {
    lunes: HorarioDia;
    martes: HorarioDia;
    miercoles: HorarioDia;
    jueves: HorarioDia;
    viernes: HorarioDia;
    sabado: HorarioDia;
    domingo: HorarioDia;
  };
  resumenFormateado?: string;
}

// ==============================================================================
// 16. GESTIÓN Y MODERACIÓN DE USUARIOS DEL SISTEMA
// ==============================================================================
export type RolUsuario = 'usuario' | 'comerciante' | 'admin_nivel2' | 'superadmin';
export type EstadoUsuario = 'activo' | 'bloqueado' | 'baja';

export interface UsuarioSistema {
  id: string;
  email: string;
  nombre: string;
  password_hash?: string;
  rol: RolUsuario;
  estado: EstadoUsuario;
  motivo_estado?: string;
  comercio_id?: string;
  comercio_nombre?: string;
  fecha_registro: string;
  ultimo_acceso?: string;
  verificado?: boolean;
  visitas?: number;
}

// ==============================================================================
// 17. TICKETS DE SOPORTE, PROBLEMAS Y RECOMENDACIONES
// ==============================================================================
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



