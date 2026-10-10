import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Comercio, CreateComercioInput, UpdateComercioInput, ReporteComercio } from '@/types/comercio';
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
 * Obtiene todos los comercios ordenados por nombre
 */
export async function getComercios(): Promise<Comercio[]> {
  if (!isSupabaseConfigured) {
    return [...memoryStore].sort((a, b) => a.nombre.localeCompare(b.nombre));
  }

  try {
    const { data, error } = await supabase
      .from('comercios')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      console.warn('[Supabase Admin] Error al obtener comercios:', error.message);
      return [...memoryStore];
    }

    const sanitized = ((data as Comercio[]) || [])
      .filter((c) => c.estado_aprobacion !== 'eliminado')
      .map((c) => {
        const copy = { ...c };
        delete (copy as Record<string, unknown>).password_comercio;
        return copy;
      });
    return sanitized;
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
 * Elimina un comercio por ID
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

