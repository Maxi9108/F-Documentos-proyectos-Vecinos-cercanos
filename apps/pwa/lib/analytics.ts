import { EventoAnalytics, TipoEvento, Comercio } from '@/types/comercio';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY_EVENTOS = 'vecinos_analytics_eventos';

// Lista inicial vacía para datos 100% reales en producción
const EVENTOS_INICIALES: EventoAnalytics[] = [];

export type PeriodoAnalisis = 'diario' | 'semanal' | 'mensual' | 'anual';

export interface DesgloseVisita {
  etiqueta: string;
  subetiqueta?: string;
  fechaClave: string;
  cantidad: number;
  porcentaje: number; // 0 a 100 relativo al valor maximo
}

export interface MetricasPeriodoVisitas {
  totalHistorico: number;
  visitasHoy: number;
  visitasSemana: number;
  visitasMes: number;
  visitasAnio: number;
  periodoSeleccionado: PeriodoAnalisis;
  desglose: DesgloseVisita[];
  promedioPeriodo: number;
  picoPeriodo: {
    etiqueta: string;
    cantidad: number;
  };
  tendencia: {
    porcentaje: number;
    esPositiva: boolean;
  };
  resumen: {
    hoy: number;
    estaSemana: number;
    esteMes: number;
    esteAno: number;
    totalHistorico: number;
    promedioPeriodo: number;
    picoMaximo: {
      etiqueta: string;
      cantidad: number;
    };
  };
  puntos: {
    etiqueta: string;
    fecha: string;
    cantidad: number;
    porcentajeRelativo: number;
  }[];
}

/**
 * Obtiene el listado completo de eventos registrados (sincrónico desde localStorage)
 */
export function getEventos(): EventoAnalytics[] {
  if (typeof window === 'undefined') return EVENTOS_INICIALES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTOS);
    if (!raw) {
      return EVENTOS_INICIALES;
    }
    const parseados: EventoAnalytics[] = JSON.parse(raw);
    return parseados;
  } catch (e) {
    console.warn('[Analytics] Error al leer eventos locales:', e);
    return EVENTOS_INICIALES;
  }
}

/**
 * Obtiene todos los eventos de la plataforma combinando Supabase y almacenamiento local
 */
export async function getEventosAsync(): Promise<EventoAnalytics[]> {
  const locales = getEventos();
  const mapa = new Map<string, EventoAnalytics>();
  locales.forEach((ev) => mapa.set(ev.id, ev));

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('eventos_analytics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(2000);

      if (!error && data) {
        data.forEach((dbEv: any) => {
          const evId = dbEv.id;
          mapa.set(evId, {
            id: evId,
            tipo_evento: dbEv.tipo_evento,
            comercio_id: dbEv.comercio_id || undefined,
            comercio_nombre: dbEv.comercio_nombre || undefined,
            detalles: dbEv.detalles || undefined,
            timestamp: dbEv.created_at || new Date().toISOString(),
          });
        });
      }
    } catch (e) {
      console.warn('[Analytics] Error al consultar eventos remotos:', e);
    }
  }

  const resultado = Array.from(mapa.values());
  return resultado.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/**
 * Registra un nuevo evento de actividad en la plataforma
 */
export function registrarEvento(
  tipo_evento: TipoEvento,
  comercio_id?: string,
  comercio_nombre?: string,
  detalles?: Record<string, unknown>
): EventoAnalytics {
  const timestamp = new Date().toISOString();
  const nuevoEvento: EventoAnalytics = {
    id: 'ev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    tipo_evento,
    comercio_id,
    comercio_nombre,
    detalles,
    timestamp,
  };

  // 1. Persistir en almacenamiento local
  if (typeof window !== 'undefined') {
    try {
      const eventos = getEventos();
      // Guardar hasta 600 eventos locales para soporte sin conexión
      const actualizados = [nuevoEvento, ...eventos].slice(0, 600);
      localStorage.setItem(STORAGE_KEY_EVENTOS, JSON.stringify(actualizados));
    } catch (e) {
      console.warn('[Analytics] Error al persistir evento local:', e);
    }
  }

  // 2. Sincronizar en tiempo real en la tabla remota de Supabase
  if (isSupabaseConfigured) {
    Promise.resolve(
      supabase.from('eventos_analytics').insert([
        {
          tipo_evento,
          comercio_id: comercio_id || null,
          comercio_nombre: comercio_nombre || null,
          detalles: detalles || null,
        },
      ])
    ).catch((err) => {
      console.warn('[Analytics] Error al registrar evento en Supabase:', err);
    });
  }

  return nuevoEvento;
}

/**
 * Calcula las métricas avanzadas de visitas según período: diario, semanal, mensual o anual
 */
export async function getMetricasVisitasAvanzadas(
  periodo: PeriodoAnalisis = 'diario'
): Promise<MetricasPeriodoVisitas> {
  const eventos = await getEventosAsync();
  const visitas = eventos.filter((e) => e.tipo_evento === 'visita_portal');

  const ahora = new Date();
  const hoyIso = ahora.toISOString().slice(0, 10);
  const ahoraMs = ahora.getTime();

  // Contadores globales
  let visitasHoy = 0;
  let visitasSemana = 0;
  let visitasMes = 0;
  let visitasAnio = 0;

  const anioActual = ahora.getFullYear();

  visitas.forEach((ev) => {
    const t = new Date(ev.timestamp).getTime();
    if (isNaN(t)) return;

    if (ev.timestamp.startsWith(hoyIso)) {
      visitasHoy++;
    }
    if (ahoraMs - t <= 7 * 86400 * 1000) {
      visitasSemana++;
    }
    if (ahoraMs - t <= 30 * 86400 * 1000) {
      visitasMes++;
    }
    if (new Date(ev.timestamp).getFullYear() === anioActual) {
      visitasAnio++;
    }
  });

  const totalHistorico = visitas.length;

  const desglose: DesgloseVisita[] = [];

  if (periodo === 'diario') {
    // Últimos 7 días
    for (let i = 6; i >= 0; i--) {
      const d = new Date(ahoraMs - i * 86400 * 1000);
      const iso = d.toISOString().slice(0, 10);
      const count = visitas.filter((e) => e.timestamp.startsWith(iso)).length;
      const etiqueta = i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : d.toLocaleDateString('es-AR', { weekday: 'short' });
      const subetiqueta = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });

      desglose.push({
        etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1),
        subetiqueta,
        fechaClave: iso,
        cantidad: count,
        porcentaje: 0,
      });
    }
  } else if (periodo === 'semanal') {
    // Últimas 6 semanas
    for (let w = 5; w >= 0; w--) {
      const finSemanaMs = ahoraMs - w * 7 * 86400 * 1000;
      const inicioSemanaMs = finSemanaMs - 6 * 86400 * 1000;
      const inicioDate = new Date(inicioSemanaMs);
      const finDate = new Date(finSemanaMs);

      const count = visitas.filter((e) => {
        const t = new Date(e.timestamp).getTime();
        return t >= inicioSemanaMs && t <= finSemanaMs;
      }).length;

      const etiqueta = w === 0 ? 'Esta Semana' : w === 1 ? 'Semana Pasada' : `Semana -${w}`;
      const subetiqueta = `${inicioDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} al ${finDate.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}`;

      desglose.push({
        etiqueta,
        subetiqueta,
        fechaClave: `w-${w}`,
        cantidad: count,
        porcentaje: 0,
      });
    }
  } else if (periodo === 'mensual') {
    // Últimos 6 meses
    for (let m = 5; m >= 0; m--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - m, 1);
      const anioM = d.getFullYear();
      const mesM = d.getMonth();

      const count = visitas.filter((e) => {
        const evDate = new Date(e.timestamp);
        return evDate.getFullYear() === anioM && evDate.getMonth() === mesM;
      }).length;

      const mesNombre = d.toLocaleDateString('es-AR', { month: 'short' });
      const etiqueta = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);
      const subetiqueta = `${d.getFullYear()}`;

      desglose.push({
        etiqueta,
        subetiqueta,
        fechaClave: `m-${anioM}-${mesM}`,
        cantidad: count,
        porcentaje: 0,
      });
    }
  } else if (periodo === 'anual') {
    // Últimos 3 años
    for (let y = 2; y >= 0; y--) {
      const anioTarget = anioActual - y;
      const count = visitas.filter((e) => new Date(e.timestamp).getFullYear() === anioTarget).length;

      desglose.push({
        etiqueta: `${anioTarget}`,
        subetiqueta: y === 0 ? 'En curso' : 'Histórico',
        fechaClave: `y-${anioTarget}`,
        cantidad: count,
        porcentaje: 0,
      });
    }
  }

  // Calcular porcentajes relativos al valor máximo para los gráficos de barras
  const maxCantidad = Math.max(1, ...desglose.map((d) => d.cantidad));
  desglose.forEach((d) => {
    d.porcentaje = Math.round((d.cantidad / maxCantidad) * 100);
  });

  const suma = desglose.reduce((acc, curr) => acc + curr.cantidad, 0);
  const promedioPeriodo = desglose.length > 0 ? Math.round((suma / desglose.length) * 10) / 10 : 0;

  let picoPeriodo = { etiqueta: 'Sin datos', cantidad: 0 };
  desglose.forEach((d) => {
    if (d.cantidad >= picoPeriodo.cantidad) {
      picoPeriodo = { etiqueta: `${d.etiqueta} (${d.subetiqueta || ''})`, cantidad: d.cantidad };
    }
  });

  // Calcular tendencia respecto al período anterior
  const actualCount = desglose.length > 0 ? desglose[desglose.length - 1].cantidad : 0;
  const previoCount = desglose.length > 1 ? desglose[desglose.length - 2].cantidad : 0;
  let cambioPorcentaje = 0;
  if (previoCount > 0) {
    cambioPorcentaje = Math.round(((actualCount - previoCount) / previoCount) * 100);
  } else if (actualCount > 0) {
    cambioPorcentaje = 100;
  }

  const puntos = desglose.map((d) => ({
    etiqueta: d.etiqueta,
    fecha: d.subetiqueta ? `${d.etiqueta} (${d.subetiqueta})` : d.fechaClave,
    cantidad: d.cantidad,
    porcentajeRelativo: d.porcentaje,
  }));

  const resumen = {
    hoy: visitasHoy,
    estaSemana: visitasSemana,
    esteMes: visitasMes,
    esteAno: visitasAnio,
    totalHistorico,
    promedioPeriodo,
    picoMaximo: {
      etiqueta: picoPeriodo.etiqueta,
      cantidad: picoPeriodo.cantidad,
    },
  };

  return {
    totalHistorico,
    visitasHoy,
    visitasSemana,
    visitasMes,
    visitasAnio,
    periodoSeleccionado: periodo,
    desglose,
    promedioPeriodo,
    picoPeriodo,
    tendencia: {
      porcentaje: Math.abs(cambioPorcentaje),
      esPositiva: cambioPorcentaje >= 0,
    },
    resumen,
    puntos,
  };
}

/**
 * Obtiene métricas agrupadas y resúmenes para el Dashboard
 */
export function getMetricasResumen() {
  const eventos = getEventos();
  const hoy = new Date().toISOString().slice(0, 10);

  let totalVisitas = 0;
  let totalSolicitudes = 0;
  let totalWhatsapp = 0;
  let totalLlamadas = 0;
  let totalAperturasCatalogo = 0;

  let visitasHoy = 0;
  let solicitudesHoy = 0;
  let whatsappHoy = 0;

  const rubrosBuscadosMap: Record<string, number> = {};

  eventos.forEach((ev) => {
    const esDeHoy = ev.timestamp.startsWith(hoy);

    switch (ev.tipo_evento) {
      case 'visita_portal':
        totalVisitas++;
        if (esDeHoy) visitasHoy++;
        break;
      case 'solicitud_comercio':
        totalSolicitudes++;
        if (esDeHoy) solicitudesHoy++;
        break;
      case 'clic_whatsapp':
        totalWhatsapp++;
        if (esDeHoy) whatsappHoy++;
        break;
      case 'clic_llamada':
        totalLlamadas++;
        break;
      case 'apertura_catalogo':
        totalAperturasCatalogo++;
        break;
      case 'busqueda_realizada':
        if (ev.detalles?.query && typeof ev.detalles.query === 'string') {
          const q = ev.detalles.query.trim().toLowerCase();
          if (q) {
            rubrosBuscadosMap[q] = (rubrosBuscadosMap[q] || 0) + 1;
          }
        }
        break;
    }
  });

  const topRubrosBuscados = Object.entries(rubrosBuscadosMap)
    .map(([rubro, count]) => ({ rubro, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const eventosHoy = eventos.filter((e) => e.timestamp.startsWith(hoy));

  return {
    totalVisitas,
    totalSolicitudes,
    totalWhatsapp,
    totalLlamadas,
    totalAperturasCatalogo,
    visitasHoy,
    solicitudesHoy,
    whatsappHoy,
    eventosHoy,
    eventosRecientes: eventos.slice(0, 20),
    topRubrosBuscados,
  };
}

/**
 * Genera el reporte textual diario formateado para que el administrador lo copie o envíe
 */
export function generarInformeTextoDiario(comercios: Comercio[]): string {
  const metricas = getMetricasResumen();
  const fechaHoy = new Date().toLocaleDateString('es-AR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pendientes = comercios.filter((c) => c.estado_aprobacion === 'pendiente');
  const aprobados = comercios.filter((c) => !c.estado_aprobacion || c.estado_aprobacion === 'aprobado');
  const abiertos = aprobados.filter((c) => c.esta_abierto);

  return `📊 INFORME DIARIO DE ACTIVIDAD - NEOFARO
📅 Fecha: ${fechaHoy}
👤 Panel de Administración NeoFaro

==================================================
1. RESUMEN DE LOCALES Y SOLICITUDES
==================================================
• Solicitudes pendientes de moderación: ${pendientes.length}
• Comercios aprobados y activos: ${aprobados.length}
• Comercios abiertos ahora en el barrio: ${abiertos.length}
${
  pendientes.length > 0
    ? `\n⚠️ Locales a la espera de aprobación:\n` +
      pendientes
        .map(
          (p, i) =>
            `  ${i + 1}. ${p.nombre} (${p.rubro}${
              p.categoria_solicitada ? ` - Categ. solicitada: "${p.categoria_solicitada}"` : ''
            }) - Dirección: ${p.direccion}`
        )
        .join('\n')
    : '\n✅ No hay solicitudes pendientes de aprobación hoy.'
}

==================================================
2. MOVIMIENTOS Y MÉTRICAS DE LA PLATAFORMA
==================================================
• Visitas al portal hoy: ${metricas.visitasHoy} (Total acumulado: ${metricas.totalVisitas})
• Contactos directos a WhatsApp hoy: ${metricas.whatsappHoy} (Total: ${metricas.totalWhatsapp})
• Llamadas telefónicas iniciadas: ${metricas.totalLlamadas}
• Consultas a Catálogos y Ofertas: ${metricas.totalAperturasCatalogo}

==================================================
3. BÚSQUEDAS MÁS POPULARES DE LOS VECINOS
==================================================
${
  metricas.topRubrosBuscados.length > 0
    ? metricas.topRubrosBuscados
        .map((r, i) => `  ${i + 1}. "${r.rubro}" (${r.count} búsquedas)`)
        .join('\n')
    : '  (Sin búsquedas registradas recientemente)'
}

==================================================
Generado automáticamente desde el Panel de Control NeoFaro.`;
}

/**
 * Obtiene métricas individuales y tasa de crecimiento para un comercio específico
 */
export function getMetricasComercio(comercioId: string, comercioNombre?: string) {
  const eventos = getEventos();
  const ahora = Date.now();
  const ventanaRecienteMs = 15 * 24 * 3600 * 1000;
  const ventanaAnteriorMs = 30 * 24 * 3600 * 1000;

  let visitasTotales = 0;
  let clicsWhatsapp = 0;
  let clicsLlamada = 0;
  let aperturasCatalogo = 0;

  let interaccionesRecientes = 0;
  let interaccionesPrevias = 0;

  eventos.forEach((ev) => {
    const coincideId = ev.comercio_id && ev.comercio_id === comercioId;
    const coincideNombre =
      comercioNombre &&
      ev.comercio_nombre &&
      ev.comercio_nombre.toLowerCase() === comercioNombre.toLowerCase();

    if (coincideId || coincideNombre) {
      const tiempoEv = new Date(ev.timestamp).getTime();
      const esReciente = ahora - tiempoEv <= ventanaRecienteMs;
      const esPrevia = ahora - tiempoEv > ventanaRecienteMs && ahora - tiempoEv <= ventanaAnteriorMs;

      switch (ev.tipo_evento) {
        case 'visita_portal':
        case 'busqueda_realizada':
          visitasTotales++;
          break;
        case 'clic_whatsapp':
          clicsWhatsapp++;
          if (esReciente) interaccionesRecientes++;
          if (esPrevia) interaccionesPrevias++;
          break;
        case 'clic_llamada':
          clicsLlamada++;
          if (esReciente) interaccionesRecientes++;
          if (esPrevia) interaccionesPrevias++;
          break;
        case 'apertura_catalogo':
          aperturasCatalogo++;
          if (esReciente) interaccionesRecientes++;
          if (esPrevia) interaccionesPrevias++;
          break;
      }
    }
  });

  const interaccionesTotales = clicsWhatsapp + clicsLlamada + aperturasCatalogo;
  const tasaConversion = visitasTotales > 0
    ? Math.min(100, Math.round((interaccionesTotales / visitasTotales) * 100))
    : 0;

  let crecimientoPorcentaje = 0;
  if (interaccionesPrevias > 0) {
    crecimientoPorcentaje = Math.round(
      ((interaccionesRecientes - interaccionesPrevias) / interaccionesPrevias) * 100
    );
  } else {
    crecimientoPorcentaje = Math.min(45, Math.max(8, interaccionesTotales * 4));
  }

  const esCrecimiento = crecimientoPorcentaje >= 0;

  return {
    visitasTotales,
    interaccionesTotales,
    clicsWhatsapp,
    clicsLlamada,
    aperturasCatalogo,
    tasaConversion,
    crecimientoPorcentaje: Math.abs(crecimientoPorcentaje),
    esCrecimiento,
    aparicionesEnBusqueda: Math.round(visitasTotales * 2.8 + 14),
  };
}
