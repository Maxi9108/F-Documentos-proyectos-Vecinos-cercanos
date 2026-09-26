import { UsuarioSistema, EstadoUsuario, RolUsuario } from '@/types/comercio';
import { supabase, isSupabaseConfigured } from './supabase';

const STORAGE_KEY_USUARIOS = 'vecinos_usuarios_registrados';

// Usuarios iniciales de ejemplo para tener histórico y probar filtros en el panel admin
const USUARIOS_INICIALES: UsuarioSistema[] = [
  {
    id: 'usr-admin-1',
    email: 'maxi0802@gmail.com',
    nombre: 'Maxi (SuperAdmin)',
    rol: 'superadmin',
    estado: 'activo',
    fecha_registro: '2026-01-01T12:00:00.000Z',
    ultimo_acceso: new Date().toISOString(),
  },
  {
    id: 'usr-com-1',
    email: 'panaderia.espiga@gmail.com',
    nombre: 'Carlos Rossi (Panadería La Espiga)',
    rol: 'comerciante',
    estado: 'activo',
    comercio_nombre: 'Panadería La Espiga Dorada',
    fecha_registro: '2026-02-10T14:30:00.000Z',
    ultimo_acceso: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'usr-vecino-1',
    email: 'mariana.lopez@yahoo.com.ar',
    nombre: 'Mariana López',
    rol: 'usuario',
    estado: 'activo',
    fecha_registro: '2026-02-15T09:15:00.000Z',
    ultimo_acceso: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'usr-vecino-2',
    email: 'juanperez.spam@gmail.com',
    nombre: 'Juan Pérez (Reportado)',
    rol: 'usuario',
    estado: 'bloqueado',
    motivo_estado: 'Múltiples reportes falsos y conducta indebida en debates comunitarios',
    fecha_registro: '2026-02-18T18:20:00.000Z',
    ultimo_acceso: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'usr-vecino-3',
    email: 'roberto_antiguo@hotmail.com',
    nombre: 'Roberto Fernández',
    rol: 'usuario',
    estado: 'baja',
    motivo_estado: 'Baja voluntaria solicitada por cambio de barrio',
    fecha_registro: '2026-01-20T11:00:00.000Z',
    ultimo_acceso: '2026-02-05T16:45:00.000Z',
  },
];

/**
 * Obtiene todos los usuarios registrados del sistema (Supabase con fallback a LocalStorage)
 */
export async function getUsuariosSistema(): Promise<UsuarioSistema[]> {
  let usuariosLocales: UsuarioSistema[] = USUARIOS_INICIALES;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USUARIOS);
      if (raw) {
        usuariosLocales = JSON.parse(raw);
      } else {
        localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(USUARIOS_INICIALES));
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

      if (!error && data && data.length > 0) {
        // Fusionar sin duplicar
        const combinados = [...data];
        usuariosLocales.forEach((ul) => {
          if (!combinados.some((c) => c.email.toLowerCase() === ul.email.toLowerCase())) {
            combinados.push(ul);
          }
        });
        return combinados;
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
