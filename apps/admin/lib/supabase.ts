import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Comercio, CreateComercioInput, UpdateComercioInput } from '@/types/comercio';
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

    return (data as Comercio[]) || [];
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
    const { error } = await supabase.from('comercios').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
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
