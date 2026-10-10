import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Comercio, CreateComercioInput, UpdateComercioInput, ReporteComercio, NivelComercio } from '@/types/comercio';
import { INITIAL_MOCK_COMERCIOS } from './mock-comercios';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('http') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// Almacén en memoria de respaldo para modo desarrollo/demo
let memoryStore: Comercio[] = [...INITIAL_MOCK_COMERCIOS];

/**
 * Obtiene todos los comercios ordenados por nombre, incorporando solicitudes de moderación
 */
export async function getComercios(): Promise<Comercio[]> {
  if (!isSupabaseConfigured) {
    return [...memoryStore]
      .filter((c) => c.estado_aprobacion !== 'eliminado')
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  try {
    // 1. Consultar solicitudes pendientes o registradas en Supabase
    const solsMap = new Map<string, any>();
    try {
      const { data: sols } = await supabase.from('solicitudes_modificacion').select('*');
      if (sols) {
        sols.forEach((s) => {
          if (s.estado !== 'eliminado') {
            solsMap.set(s.comercio_id, s);
          }
        });
      }
    } catch {
      // Continuar si falla solicitudes
    }

    const { data, error } = await supabase
      .from('comercios')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.warn('[Supabase Admin] Error al obtener comercios:', error.message);
      return [...memoryStore];
    }

    const mapa = new Map<string, Comercio>();

    ((data as Comercio[]) || []).forEach((c) => {
      if (c.estado_aprobacion === 'eliminado') return;
      const copy = { ...c };
      delete (copy as unknown as Record<string, unknown>).password_comercio;

      const sol = solsMap.get(copy.id);
      if (sol) {
        if (sol.estado === 'eliminado') return;
        if (sol.cambios && typeof sol.cambios === 'object') {
          Object.assign(copy, sol.cambios);
        }
        if (sol.estado === 'pendiente') {
          copy.estado_aprobacion = 'pendiente';
        } else if (sol.estado === 'rechazado') {
          copy.estado_aprobacion = 'rechazado';
          copy.motivo_rechazo = sol.motivo_rechazo || copy.motivo_rechazo;
        } else if (sol.estado === 'aprobado') {
          copy.estado_aprobacion = 'aprobado';
        }
      } else if (!copy.estado_aprobacion) {
        copy.estado_aprobacion = 'aprobado';
      }

      mapa.set(copy.id, copy);
    });

    // Incorporar solicitudes que aún no están en la tabla comercios
    solsMap.forEach((sol, comercioId) => {
      if (sol.estado === 'eliminado') return;
      if (!mapa.has(comercioId) && sol.cambios) {
        const item: Comercio = {
          id: comercioId,
          nombre: sol.comercio_nombre || sol.cambios.nombre || 'Nuevo Comercio',
          rubro: sol.cambios.rubro || 'General',
          direccion: sol.cambios.direccion || 'Sin dirección',
          telefono: sol.cambios.telefono || '',
          whatsapp: sol.cambios.whatsapp || '',
          latitud: sol.cambios.latitud || -34.6,
          longitud: sol.cambios.longitud || -58.4,
          esta_abierto: true,
          estado_aprobacion: sol.estado === 'rechazado' ? 'rechazado' : sol.estado === 'aprobado' ? 'aprobado' : 'pendiente',
          motivo_rechazo: sol.motivo_rechazo,
          ...sol.cambios,
        };
        delete (item as unknown as Record<string, unknown>).password_comercio;
        mapa.set(comercioId, item);
      }
    });

    return Array.from(mapa.values());
  } catch (err) {
    console.error('[Supabase Admin] Error inesperado:', err);
    return [...memoryStore];
  }
}

/**
 * Crea un nuevo comercio en Supabase
 */
export async function createComercio(input: CreateComercioInput): Promise<{ data: Comercio | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    const nuevo: Comercio = {
      ...input,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mock-${Date.now()}`,
    };
    memoryStore.unshift(nuevo);
    return { data: nuevo, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('comercios')
      .insert([input])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Comercio, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al crear comercio';
    return { data: null, error: msg };
  }
}

/**
 * Actualiza un comercio existente
 */
export async function updateComercio(
  id: string,
  input: UpdateComercioInput
): Promise<{ data: Comercio | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    const index = memoryStore.findIndex((c) => c.id === id);
    if (index === -1) {
      return { data: null, error: 'Comercio no encontrado' };
    }
    memoryStore[index] = { ...memoryStore[index], ...input };
    return { data: memoryStore[index], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('comercios')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Comercio, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error inesperado al actualizar comercio';
    return { data: null, error: msg };
  }
}

/**
 * Elimina un comercio por ID definitivamente en todas las tablas asociadas
 */
export async function deleteComercio(id: string): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured) {
    memoryStore = memoryStore.filter((c) => c.id !== id);
    return { success: true, error: null };
  }

  try {
    // 1. Limpieza de tablas relacionadas
    await supabase.from('solicitudes_modificacion').delete().or(`comercio_id.eq.${id},id.eq.${id}`);
    await supabase.from('debates_inconvenientes').delete().eq('comercio_id', id);
    await supabase.from('reportes').delete().eq('comercio_id', id);
    await supabase.from('productos').delete().eq('comercio_id', id);
    await supabase.from('comprobantes_transferencia').delete().eq('comercio_id', id);

    try {
      await supabase.from('calificaciones_comercios').delete().eq('comercio_id', id);
    } catch {
      // Ignorar si la tabla no existe en el esquema
    }

    // 2. Marcar como eliminado definitivo en Supabase
    await supabase.from('comercios').update({
      estado_aprobacion: 'eliminado',
      esta_abierto: false,
    }).eq('id', id);

    // 3. Intentar hard-delete si está permitido
    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (esUuid) {
      await supabase.from('comercios').delete().eq('id', id);
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al eliminar comercio';
    return { success: false, error: msg };
  }
}

/**
 * Rechaza una solicitud de comercio
 */
export async function rechazarComercio(
  id: string,
  motivo: string = 'No cumple con las pautas de moderación'
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const idx = memoryStore.findIndex((c) => c.id === id);
    if (idx >= 0) {
      memoryStore[idx].estado_aprobacion = 'rechazado';
      memoryStore[idx].motivo_rechazo = motivo;
    }
    return { success: true };
  }

  try {
    // 1. Actualizar solicitud de modificación
    await supabase
      .from('solicitudes_modificacion')
      .update({
        estado: 'rechazado',
        motivo_rechazo: motivo,
      })
      .or(`comercio_id.eq.${id},id.eq.${id}`);

    // 2. Actualizar estado_aprobacion en tabla comercios (sin motivo_rechazo)
    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (esUuid) {
      await supabase.from('comercios').update({
        estado_aprobacion: 'rechazado',
        esta_abierto: false,
      }).eq('id', id);
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al rechazar comercio';
    return { success: false, error: msg };
  }
}

/**
 * Aprueba una solicitud de comercio
 */
export async function aprobarComercio(
  id: string,
  nivel: NivelComercio = 'standar'
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    const idx = memoryStore.findIndex((c) => c.id === id);
    if (idx >= 0) {
      memoryStore[idx].estado_aprobacion = 'aprobado';
      memoryStore[idx].nivel = nivel;
      memoryStore[idx].esta_abierto = true;
    }
    return { success: true };
  }

  try {
    await supabase
      .from('solicitudes_modificacion')
      .update({
        estado: 'aprobado',
      })
      .or(`comercio_id.eq.${id},id.eq.${id}`);

    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    if (esUuid) {
      await supabase.from('comercios').update({
        estado_aprobacion: 'aprobado',
        nivel,
        esta_abierto: true,
      }).eq('id', id);
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al aprobar comercio';
    return { success: false, error: msg };
  }
}

/**
 * Alterna rápidamente el estado abierto/cerrado de un comercio
 */
export async function toggleComercioEstado(
  id: string,
  esta_abierto: boolean
): Promise<{ success: boolean; error: string | null }> {
  return (await updateComercio(id, { esta_abierto })).error
    ? { success: false, error: 'Error al cambiar estado' }
    : { success: true, error: null };
}

/**
 * Levanta la cuarentena de un comercio desde el panel de control admin (puerto 3001)
 */
export async function levantarCuarentena(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const updateRes = await updateComercio(id, {
    en_cuarentena: false,
    fecha_cuarentena: undefined,
    motivo_cuarentena: undefined,
    strikes_reportes: 0,
    esta_abierto: true,
  });

  if (isSupabaseConfigured) {
    try {
      await supabase.from('reportes').delete().eq('comercio_id', id);
    } catch {
      // ignorar
    }
  }

  return updateRes.error
    ? { success: false, error: updateRes.error }
    : { success: true, error: null };
}

/**
 * Obtiene los reportes asociados a un comercio para revisión
 */
export async function getReportesComercio(comercioId?: string): Promise<ReporteComercio[]> {
  if (!isSupabaseConfigured) {
    return [];
  }
  try {
    let query = supabase.from('reportes').select('*').order('fecha', { ascending: false });
    if (comercioId) {
      query = query.eq('comercio_id', comercioId);
    }
    const { data } = await query;
    return (data as ReporteComercio[]) || [];
  } catch {
    return [];
  }
}

