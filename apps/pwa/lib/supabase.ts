import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Comercio, NivelComercio } from '@/types/comercio';
import { MOCK_COMERCIOS } from './mock-comercios';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
);

// Cliente de Supabase exportado para uso general
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Verifica si los comercios con membresía Premium o Gold tienen su suscripción vencida
 * y los degrada automáticamente a Standar tanto en memoria como en almacenamiento.
 */
export function verificarYDegradarVencidos(comercios: Comercio[]): Comercio[] {
  const ahora = Date.now();
  let huboCambios = false;

  const resultado = comercios.map((comercio) => {
    if (
      comercio.nivel &&
      comercio.nivel !== 'standar' &&
      comercio.fecha_vencimiento_nivel
    ) {
      const fechaVencimiento = new Date(comercio.fecha_vencimiento_nivel).getTime();
      if (!isNaN(fechaVencimiento) && fechaVencimiento < ahora) {
        huboCambios = true;
        const degradado: Comercio = {
          ...comercio,
          nivel: 'standar',
        };

        // Actualizar en background en Supabase si está disponible
        if (isSupabaseConfigured) {
          Promise.resolve(
            supabase
              .from('comercios')
              .update({ nivel: 'standar' })
              .eq('id', comercio.id)
          ).catch(() => {});
        }

        return degradado;
      }
    }
    return comercio;
  });

  if (huboCambios && typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const actualizados = guardados.map((g) => {
          if (g.nivel && g.nivel !== 'standar' && g.fecha_vencimiento_nivel) {
            const fv = new Date(g.fecha_vencimiento_nivel).getTime();
            if (!isNaN(fv) && fv < ahora) {
              return { ...g, nivel: 'standar' as NivelComercio };
            }
          }
          return g;
        });
        localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(actualizados));
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al actualizar vencimientos:', e);
    }
  }

  return resultado;
}

/**
 * Obtiene los comercios de Supabase o provee fallback a datos locales
 * en caso de que no existan credenciales configuradas o la tabla esté vacía.
 */
export async function getComercios(): Promise<Comercio[]> {
  if (!isSupabaseConfigured) {
    return verificarYDegradarVencidos(MOCK_COMERCIOS);
  }

  try {
    const { data, error } = await supabase
      .from('comercios')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.warn('[Supabase] Error al consultar tabla "comercios":', error.message);
      return verificarYDegradarVencidos(MOCK_COMERCIOS);
    }

    if (!data || data.length === 0) {
      return verificarYDegradarVencidos(MOCK_COMERCIOS);
    }

    // Combinar los 20 comercios de prueba con los registros de Supabase evitando duplicados
    const mapa = new Map<string, Comercio>();
    MOCK_COMERCIOS.forEach((c) => mapa.set(c.id, c));

    (data as Comercio[]).forEach((dbItem) => {
      const existePorId = mapa.has(dbItem.id);
      const existePorNombre = Array.from(mapa.values()).find(
        (c) => c.nombre.trim().toLowerCase() === dbItem.nombre.trim().toLowerCase()
      );
      if (existePorId) {
        mapa.set(dbItem.id, { ...mapa.get(dbItem.id)!, ...dbItem });
      } else if (!existePorNombre) {
        mapa.set(dbItem.id, dbItem);
      }
    });

    return verificarYDegradarVencidos(Array.from(mapa.values()));
  } catch (err) {
    console.error('[Supabase] Error inesperado en la consulta:', err);
    return verificarYDegradarVencidos(MOCK_COMERCIOS);
  }
}

/**
 * Guarda o actualiza un comercio en Supabase y/o en el almacén local
 */
export async function guardarComercio(comercio: Comercio): Promise<{ success: boolean; error?: string }> {
  // 1. Guardar siempre en almacenamiento local para respuesta instantánea y soporte offline
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      const guardados: Comercio[] = guardadosRaw ? JSON.parse(guardadosRaw) : [];
      const index = guardados.findIndex((c) => c.id === comercio.id);
      if (index >= 0) {
        guardados[index] = comercio;
      } else {
        guardados.unshift(comercio);
      }
      localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
    } catch (e) {
      console.warn('[LocalStorage] No se pudo guardar en almacenamiento local:', e);
    }
  }

  // 2. Sincronizar en Supabase si está configurado
  if (isSupabaseConfigured) {
    try {
      const payload: Record<string, unknown> = {
        id: comercio.id,
        nombre: comercio.nombre,
        rubro: comercio.rubro,
        direccion: comercio.direccion,
        telefono: comercio.telefono || null,
        whatsapp: comercio.whatsapp || null,
        descripcion: comercio.descripcion || null,
        horario: comercio.horario || null,
        esta_abierto: comercio.esta_abierto ?? true,
        latitud: comercio.latitud,
        longitud: comercio.longitud,
        tiene_catalogo: comercio.tiene_catalogo ?? false,
        tipo_atencion: comercio.tipo_atencion || 'local_fisico',
        radio_entrega_metros: comercio.radio_entrega_metros || 0,
        zona_envio_descripcion: comercio.zona_envio_descripcion || '',
        estado_aprobacion: comercio.estado_aprobacion || 'aprobado',
        categoria_solicitada: comercio.categoria_solicitada || null,
        aprobado_por: comercio.aprobado_por || null,
        fecha_solicitud: comercio.fecha_solicitud || new Date().toISOString(),
        fecha_aprobacion: comercio.fecha_aprobacion || null,
        motivo_rechazo: comercio.motivo_rechazo || null,
        // Nivel y membresía
        nivel: comercio.nivel || 'standar',
        nivel_solicitado: comercio.nivel_solicitado || comercio.nivel || 'standar',
        fecha_inicio_nivel: comercio.fecha_inicio_nivel || null,
        fecha_vencimiento_nivel: comercio.fecha_vencimiento_nivel || null,
        fecha_ultima_renovacion: comercio.fecha_ultima_renovacion || null,
        // Horario cortado
        tiene_horario_cortado: comercio.tiene_horario_cortado ?? false,
        horario_manana: comercio.horario_manana || null,
        horario_tarde: comercio.horario_tarde || null,
        // Farmacia de turno
        esta_de_turno: comercio.esta_de_turno ?? false,
        fecha_turno: comercio.fecha_turno || null,
        // Cierre momentáneo
        cerrado_momentaneo: comercio.cerrado_momentaneo ?? false,
        motivo_cierre_momentaneo: comercio.motivo_cierre_momentaneo || null,
        // Vacaciones
        en_vacaciones: comercio.en_vacaciones ?? false,
        vacaciones_desde: comercio.vacaciones_desde || null,
        vacaciones_hasta: comercio.vacaciones_hasta || null,
        mensaje_vacaciones: comercio.mensaje_vacaciones || null,
      };

      const { error } = await supabase.from('comercios').upsert([payload]);

      if (error) {
        console.warn('[Supabase] Aviso al guardar comercio en la nube:', error.message);
        // Si falló por alguna columna que no existe aún en la tabla de Supabase, reintentar con campos base
        if (error.code === 'PGRST204') {
          const payloadBase = {
            id: comercio.id,
            nombre: comercio.nombre,
            rubro: comercio.rubro,
            direccion: comercio.direccion,
            latitud: comercio.latitud,
            longitud: comercio.longitud,
          };
          await supabase.from('comercios').upsert([payloadBase]);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[Supabase] Excepción al sincronizar en la nube:', msg);
    }
  }

  return { success: true };
}

/**
 * Aprueba un comercio pendiente y asigna opcionalmente su rubro final y su nivel de membresía
 */
export async function aprobarComercio(
  id: string,
  rubroAsignado?: string,
  aprobadoPor: string = 'maxi0802@gmail.com',
  nivelAsignado: NivelComercio = 'standar'
): Promise<{ success: boolean; error?: string }> {
  const ahora = new Date();
  const fechaAprobacion = ahora.toISOString();
  
  // Si se aprueba en Premium o Gold, se otorgan 30 días de vigencia
  let fechaVencimiento: string | null = null;
  let fechaInicioNivel: string = fechaAprobacion;
  if (nivelAsignado === 'premium' || nivelAsignado === 'gold') {
    const fv = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
    fechaVencimiento = fv.toISOString();
  }

  // 1. Actualizar en almacenamiento local
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].estado_aprobacion = 'aprobado';
          if (rubroAsignado) guardados[idx].rubro = rubroAsignado;
          guardados[idx].aprobado_por = aprobadoPor;
          guardados[idx].fecha_aprobacion = fechaAprobacion;
          guardados[idx].nivel = nivelAsignado;
          guardados[idx].fecha_inicio_nivel = fechaInicioNivel;
          guardados[idx].fecha_vencimiento_nivel = fechaVencimiento;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al aprobar comercio:', e);
    }
  }

  // 2. Actualizar en Supabase si está disponible
  if (isSupabaseConfigured) {
    try {
      const updates: Record<string, unknown> = {
        estado_aprobacion: 'aprobado',
        aprobado_por: aprobadoPor,
        fecha_aprobacion: fechaAprobacion,
        nivel: nivelAsignado,
        fecha_inicio_nivel: fechaInicioNivel,
        fecha_vencimiento_nivel: fechaVencimiento,
      };
      if (rubroAsignado) updates.rubro = rubroAsignado;

      await supabase.from('comercios').update(updates).eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Error al actualizar estado de aprobación:', err);
    }
  }

  return { success: true };
}

/**
 * Renueva la suscripción mensual de un comercio por N días (+30 días por defecto)
 */
export async function renovarMembresiaComercio(
  id: string,
  dias: number = 30,
  nivelObjetivo?: NivelComercio
): Promise<{ success: boolean; nuevaFechaVencimiento?: string; error?: string }> {
  const ahora = Date.now();
  let baseMs = ahora;

  // Buscar comercio actual en localStorage o Supabase para calcular fecha
  let nivelFinal: NivelComercio = nivelObjetivo || 'premium';

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const actual = guardados.find((c) => c.id === id);
        if (actual) {
          if (!nivelObjetivo && actual.nivel && actual.nivel !== 'standar') {
            nivelFinal = actual.nivel;
          } else if (actual.nivel_solicitado && actual.nivel_solicitado !== 'standar') {
            nivelFinal = actual.nivel_solicitado;
          }

          if (actual.fecha_vencimiento_nivel) {
            const fvMs = new Date(actual.fecha_vencimiento_nivel).getTime();
            if (!isNaN(fvMs) && fvMs > ahora) {
              baseMs = fvMs; // Si aún no venció, sumar desde la fecha existente
            }
          }
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al leer vencimiento:', e);
    }
  }

  const nuevaFecha = new Date(baseMs + dias * 24 * 60 * 60 * 1000).toISOString();
  const fechaRenovacion = new Date().toISOString();

  // Actualizar en localStorage
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].nivel = nivelFinal;
          guardados[idx].fecha_vencimiento_nivel = nuevaFecha;
          guardados[idx].fecha_ultima_renovacion = fechaRenovacion;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al renovar:', e);
    }
  }

  // Actualizar en Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          nivel: nivelFinal,
          fecha_vencimiento_nivel: nuevaFecha,
          fecha_ultima_renovacion: fechaRenovacion,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true, nuevaFechaVencimiento: nuevaFecha };
}

/**
 * Cambia el nivel de un comercio y ajusta su fecha de vencimiento según corresponda
 */
export async function cambiarNivelComercio(
  id: string,
  nuevoNivel: NivelComercio,
  diasVigencia: number = 30
): Promise<{ success: boolean; error?: string }> {
  const ahora = new Date();
  let fechaVencimiento: string | null = null;
  const fechaInicio = ahora.toISOString();

  if (nuevoNivel === 'premium' || nuevoNivel === 'gold') {
    const fv = new Date(ahora.getTime() + diasVigencia * 24 * 60 * 60 * 1000);
    fechaVencimiento = fv.toISOString();
  }

  // Actualizar en localStorage
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].nivel = nuevoNivel;
          guardados[idx].fecha_inicio_nivel = fechaInicio;
          guardados[idx].fecha_vencimiento_nivel = fechaVencimiento;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al cambiar nivel:', e);
    }
  }

  // Actualizar en Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          nivel: nuevoNivel,
          fecha_inicio_nivel: fechaInicio,
          fecha_vencimiento_nivel: fechaVencimiento,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

/**
 * Rechaza una solicitud de comercio
 */
export async function rechazarComercio(
  id: string,
  motivo: string = 'No cumple con las pautas de moderación'
): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].estado_aprobacion = 'rechazado';
          guardados[idx].motivo_rechazo = motivo;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al rechazar comercio:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('comercios').update({
        estado_aprobacion: 'rechazado',
        motivo_rechazo: motivo,
      }).eq('id', id);
    } catch (err) {
      console.warn('[Supabase] Error al rechazar en Supabase:', err);
    }
  }

  return { success: true };
}

/**
 * Elimina un comercio por su ID
 */
export async function eliminarComercio(id: string): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from('comercios').delete().eq('id', id);
      if (error) {
        return { success: false, error: error.message };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const filtrados = guardados.filter((c) => c.id !== id);
        localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(filtrados));
      }
    } catch (e) {
      console.warn('[LocalStorage] Error al eliminar:', e);
    }
  }

  return { success: true };
}

/**
 * Alterna el estado de cierre momentáneo por algún inconveniente imprevisto
 */
export async function toggleCerradoMomentaneo(
  id: string,
  cerrado: boolean,
  motivo?: string
): Promise<{ success: boolean; error?: string }> {
  const updates: Partial<Comercio> = {
    cerrado_momentaneo: cerrado,
    motivo_cierre_momentaneo: cerrado ? (motivo || 'Cerrado momentáneamente por inconveniente') : undefined,
  };

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx] = { ...guardados[idx], ...updates };
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error en toggleCerradoMomentaneo:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          cerrado_momentaneo: cerrado,
          motivo_cierre_momentaneo: cerrado ? (motivo || 'Cerrado momentáneamente por inconveniente') : null,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

/**
 * Alterna el estado de "De Turno" para farmacias
 */
export async function toggleFarmaciaTurno(
  id: string,
  estaDeTurno: boolean
): Promise<{ success: boolean; error?: string }> {
  const hoyStr = new Date().toISOString().split('T')[0];

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].esta_de_turno = estaDeTurno;
          guardados[idx].fecha_turno = estaDeTurno ? hoyStr : undefined;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error en toggleFarmaciaTurno:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          esta_de_turno: estaDeTurno,
          fecha_turno: estaDeTurno ? hoyStr : null,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

/**
 * Configura período de vacaciones para un comercio
 */
export async function configurarVacaciones(
  id: string,
  enVacaciones: boolean,
  desde?: string,
  hasta?: string,
  mensaje?: string
): Promise<{ success: boolean; error?: string }> {
  const updates: Partial<Comercio> = {
    en_vacaciones: enVacaciones,
    vacaciones_desde: enVacaciones ? desde : undefined,
    vacaciones_hasta: enVacaciones ? hasta : undefined,
    mensaje_vacaciones: enVacaciones ? (mensaje || 'Cerrado por vacaciones. ¡Pronto regresamos!') : undefined,
  };

  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx] = { ...guardados[idx], ...updates };
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error en configurarVacaciones:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          en_vacaciones: enVacaciones,
          vacaciones_desde: enVacaciones ? (desde || null) : null,
          vacaciones_hasta: enVacaciones ? (hasta || null) : null,
          mensaje_vacaciones: enVacaciones ? (mensaje || 'Cerrado por vacaciones. ¡Pronto regresamos!') : null,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}

/**
 * Reanuda la actividad y vuelve a cumplir con los horarios normales
 * Desactiva vacaciones y cierres momentáneos en un solo paso
 */
export async function reanudarHorarioNormal(id: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window !== 'undefined') {
    try {
      const guardadosRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (guardadosRaw) {
        const guardados: Comercio[] = JSON.parse(guardadosRaw);
        const idx = guardados.findIndex((c) => c.id === id);
        if (idx >= 0) {
          guardados[idx].cerrado_momentaneo = false;
          guardados[idx].motivo_cierre_momentaneo = undefined;
          guardados[idx].en_vacaciones = false;
          guardados[idx].vacaciones_desde = undefined;
          guardados[idx].vacaciones_hasta = undefined;
          guardados[idx].mensaje_vacaciones = undefined;
          guardados[idx].esta_abierto = true;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(guardados));
        }
      }
    } catch (e) {
      console.warn('[LocalStorage] Error en reanudarHorarioNormal:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('comercios')
        .update({
          cerrado_momentaneo: false,
          motivo_cierre_momentaneo: null,
          en_vacaciones: false,
          vacaciones_desde: null,
          vacaciones_hasta: null,
          mensaje_vacaciones: null,
          esta_abierto: true,
        })
        .eq('id', id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: msg };
    }
  }

  return { success: true };
}
