import { EventoAnalytics, TipoEvento, Comercio } from '@/types/comercio';

const STORAGE_KEY_EVENTOS = 'vecinos_analytics_eventos';

// Eventos de muestra iniciales para tener histórico visual realista al ingresar
const EVENTOS_INICIALES: EventoAnalytics[] = [
  {
    id: 'ev-init-1',
    tipo_evento: 'visita_portal',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    detalles: { origen: 'acceso_directo' },
  },
  {
    id: 'ev-init-2',
    tipo_evento: 'busqueda_realizada',
    timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    detalles: { query: 'Panadería' },
  },
  {
    id: 'ev-init-3',
    tipo_evento: 'clic_whatsapp',
    comercio_nombre: 'Panadería La Espiga Dorada',
    timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString(),
    detalles: { canal: 'whatsapp_general' },
  },
  {
    id: 'ev-init-4',
    tipo_evento: 'apertura_catalogo',
    comercio_nombre: 'Farmacia San Cayetano',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    detalles: { pestana: 'ofertas' },
  },
  {
    id: 'ev-init-5',
    tipo_evento: 'visita_portal',
    timestamp: new Date(Date.now() - 3600000 * 0.8).toISOString(),
    detalles: { origen: 'compartido' },
  },
];

/**
 * Obtiene el listado completo de eventos registrados
 */
export function getEventos(): EventoAnalytics[] {
  if (typeof window === 'undefined') return EVENTOS_INICIALES;

  try {
    const raw = localStorage.getItem(STORAGE_KEY_EVENTOS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_EVENTOS, JSON.stringify(EVENTOS_INICIALES));
      return EVENTOS_INICIALES;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[Analytics] Error al leer eventos:', e);
    return EVENTOS_INICIALES;
  }
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
  const nuevoEvento: EventoAnalytics = {
    id: 'ev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    tipo_evento,
    comercio_id,
    comercio_nombre,
    detalles,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const eventos = getEventos();
      // Guardar los últimos 300 eventos para no sobrecargar almacenamiento
      const actualizados = [nuevoEvento, ...eventos].slice(0, 300);
      localStorage.setItem(STORAGE_KEY_EVENTOS, JSON.stringify(actualizados));
    } catch (e) {
      console.warn('[Analytics] Error al persistir evento:', e);
    }
  }

  return nuevoEvento;
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
 * Genera el reporte textual diario formateado para que Maxi lo copie o envíe
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

  return `📊 INFORME DIARIO DE ACTIVIDAD - VECIN@S CONECTAD@S
📅 Fecha: ${fechaHoy}
👤 Administrador Principal: maxi0802@gmail.com

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
Generado automáticamente desde el Panel de Control Vecin@s Conectad@s.`;
}
