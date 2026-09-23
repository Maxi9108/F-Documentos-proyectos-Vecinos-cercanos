export type NivelComercio = 'standar' | 'premium' | 'gold';

export interface NivelConfig {
  nombre: string;
  limiteProductos: number;
  limiteOfertasDiarias: number;
  requiereRenovacion: boolean;
  diasVigencia: number;
  badgeLabel: string;
  badgeColor: string;
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
  },
  premium: {
    nombre: 'Premium',
    limiteProductos: 50,
    limiteOfertasDiarias: 2,
    requiereRenovacion: true,
    diasVigencia: 30,
    badgeLabel: 'Premium',
    badgeColor: 'purple',
  },
  gold: {
    nombre: 'Gold',
    limiteProductos: 100,
    limiteOfertasDiarias: 5,
    requiereRenovacion: true,
    diasVigencia: 30,
    badgeLabel: 'Gold',
    badgeColor: 'amber',
  },
};

export interface Comercio {
  id: string;
  nombre: string;
  rubro: string;
  direccion: string;
  telefono: string;
  esta_abierto: boolean;
  latitud: number;
  longitud: number;
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
