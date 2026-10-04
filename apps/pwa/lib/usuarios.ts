import { UsuarioSistema, EstadoUsuario, RolUsuario } from '@/types/comercio';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY_USUARIOS = 'vecinos_usuarios_registrados';

// Lista inicial vacía para producción limpia sin datos falsos
const USUARIOS_INICIALES: UsuarioSistema[] = [];

// Emails de prueba históricos para purgar automáticamente del almacenamiento local
const EMAILS_MOCK_PURGAR = new Set([
  'panaderia.espiga@gmail.com',
  'mariana.lopez@yahoo.com.ar',
  'juanperez.spam@gmail.com',
  'roberto_antiguo@hotmail.com',
  'usuario.google@gmail.com',
  'usuario.apple@icloud.com',
]);

/**
 * Obtiene todos los usuarios registrados del sistema (100% reales desde Supabase y almacenamiento local)
 */
export async function getUsuariosSistema(): Promise<UsuarioSistema[]> {
  let usuariosLocales: UsuarioSistema[] = [];

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USUARIOS);
      if (raw) {
        const parseados: UsuarioSistema[] = JSON.parse(raw);
        // Purgar usuarios falsos de prueba si quedaron en el navegador
        usuariosLocales = parseados.filter((u) => !EMAILS_MOCK_PURGAR.has(u.email.toLowerCase()));
        localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuariosLocales));
      }
    } catch (e) {
      console.warn('[Usuarios] Error al leer usuarios de localStorage:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('fecha_registro', { ascending: false });

      if (!error && data) {
        // Filtrar cualquier email de prueba que hubiera quedado
        const reales = (data as UsuarioSistema[]).filter((u) => !EMAILS_MOCK_PURGAR.has(u.email.toLowerCase()));
        // Fusionar con usuarios locales sin duplicados
        const mapa = new Map<string, UsuarioSistema>();
        reales.forEach((u) => mapa.set(u.email.toLowerCase(), u));
        usuariosLocales.forEach((ul) => {
          if (!mapa.has(ul.email.toLowerCase())) {
            mapa.set(ul.email.toLowerCase(), ul);
          }
        });
        return Array.from(mapa.values());
      }
    } catch (supaErr) {
      console.warn('[Usuarios] Fallback local para usuarios:', supaErr);
    }
  }

  return usuariosLocales;
}

/**
 * Guarda o actualiza un usuario en la lista persistente
 */
export async function registrarOActualizarUsuario(
  usuario: UsuarioSistema
): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const lista = await getUsuariosSistema();
      const idx = lista.findIndex((u) => u.email.toLowerCase() === usuario.email.toLowerCase());
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], ...usuario };
      } else {
        lista.unshift(usuario);
      }
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(lista));
    } catch (e) {
      console.warn('[Usuarios] Error al persistir usuario local:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('usuarios').upsert({
        id: usuario.id,
        email: usuario.email.toLowerCase(),
        nombre: usuario.nombre,
        rol: usuario.rol,
        estado: usuario.estado,
        motivo_estado: usuario.motivo_estado,
        comercio_id: usuario.comercio_id,
        fecha_registro: usuario.fecha_registro,
        ultimo_acceso: usuario.ultimo_acceso || new Date().toISOString(),
      });
    } catch (supaErr) {
      console.warn('[Usuarios] Supabase upsert error no crítico:', supaErr);
    }
  }
}

/**
 * Cambia el estado de un usuario (activo, bloqueado o baja) con motivo explicativo
 */
export async function cambiarEstadoUsuario(
  id: string,
  nuevoEstado: EstadoUsuario,
  motivo?: string
): Promise<{ exito: boolean; error?: string }> {
  try {
    const lista = await getUsuariosSistema();
    const idx = lista.findIndex((u) => u.id === id);

    if (idx < 0) {
      return { exito: false, error: 'Usuario no encontrado.' };
    }

    if (lista[idx].rol === 'superadmin' && nuevoEstado !== 'activo') {
      return { exito: false, error: 'No es posible bloquear ni dar de baja la cuenta del SuperAdmin Principal.' };
    }

    lista[idx].estado = nuevoEstado;
    if (motivo !== undefined) {
      lista[idx].motivo_estado = motivo;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(lista));
    }

    if (isSupabaseConfigured) {
      await supabase
        .from('usuarios')
        .update({
          estado: nuevoEstado,
          motivo_estado: motivo,
        })
        .eq('id', id);
    }

    return { exito: true };
  } catch (err: any) {
    return { exito: false, error: err?.message || 'Error al modificar estado del usuario.' };
  }
}

/**
 * Cambia el rol de un usuario (ej. promover a admin_nivel2 o comerciante)
 */
export async function cambiarRolUsuario(
  id: string,
  nuevoRol: RolUsuario
): Promise<{ exito: boolean; error?: string }> {
  try {
    const lista = await getUsuariosSistema();
    const idx = lista.findIndex((u) => u.id === id);

    if (idx < 0) {
      return { exito: false, error: 'Usuario no encontrado.' };
    }

    if (lista[idx].rol === 'superadmin') {
      return { exito: false, error: 'No es posible modificar el rol del SuperAdmin Principal.' };
    }

    lista[idx].rol = nuevoRol;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(lista));
    }

    if (isSupabaseConfigured) {
      await supabase.from('usuarios').update({ rol: nuevoRol }).eq('id', id);
    }

    return { exito: true };
  } catch (err: any) {
    return { exito: false, error: err?.message || 'Error al cambiar rol del usuario.' };
  }
}

/**
 * Elimina definitivamente a un usuario del sistema para que pueda volver a registrarse desde cero
 */
export async function eliminarUsuarioDefinitivo(
  id: string
): Promise<{ exito: boolean; error?: string }> {
  try {
    const lista = await getUsuariosSistema();
    const objetivo = lista.find((u) => u.id === id);

    if (!objetivo) {
      return { exito: false, error: 'Usuario no encontrado.' };
    }

    if (objetivo.rol === 'superadmin') {
      return { exito: false, error: 'No está permitido eliminar la cuenta del SuperAdmin Principal.' };
    }

    const filtrados = lista.filter((u) => u.id !== id);

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(filtrados));
      // También limpiar posibles tokens residuales de este email
      localStorage.removeItem('vecinos_token_' + objetivo.email.toLowerCase());
    }

    if (isSupabaseConfigured) {
      await supabase.from('usuarios').delete().eq('id', id);
      await supabase.from('tokens_registro').delete().eq('email', objetivo.email.toLowerCase());
    }

    return { exito: true };
  } catch (err: any) {
    return { exito: false, error: err?.message || 'Error al eliminar usuario.' };
  }
}
