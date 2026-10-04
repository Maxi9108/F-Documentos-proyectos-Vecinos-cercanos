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
        const reales: UsuarioSistema[] = [];
        (data as any[]).forEach((dbU) => {
          if (!EMAILS_MOCK_PURGAR.has((dbU.email || '').toLowerCase())) {
            const esVerificado = Boolean(
              dbU.verificado || (dbU.motivo_estado && dbU.motivo_estado.includes('[VERIFICADO]'))
            );
            let visitasCount = 1;
            if (typeof dbU.visitas === 'number') {
              visitasCount = dbU.visitas;
            } else if (dbU.motivo_estado && dbU.motivo_estado.includes('[VISITAS:')) {
              const match = dbU.motivo_estado.match(/\[VISITAS:(\d+)\]/);
              if (match) visitasCount = parseInt(match[1], 10);
            }

            reales.push({
              id: dbU.id,
              email: dbU.email,
              nombre: dbU.nombre,
              rol: dbU.rol || 'usuario',
              estado: dbU.estado || 'activo',
              motivo_estado: dbU.motivo_estado || undefined,
              comercio_id: dbU.comercio_id || undefined,
              comercio_nombre: dbU.comercio_nombre || undefined,
              fecha_registro: dbU.fecha_registro,
              ultimo_acceso: dbU.ultimo_acceso || undefined,
              verificado: esVerificado,
              visitas: visitasCount,
            });
          }
        });

        // Fusionar con usuarios locales sin duplicados y manteniendo conteos más recientes
        const mapa = new Map<string, UsuarioSistema>();
        reales.forEach((u) => mapa.set(u.email.toLowerCase(), u));

        usuariosLocales.forEach((ul) => {
          const key = ul.email.toLowerCase();
          if (!mapa.has(key)) {
            mapa.set(key, ul);
          } else {
            const remoto = mapa.get(key)!;
            // Preservar estado verificado o conteo mayor
            if (ul.verificado) remoto.verificado = true;
            if (ul.visitas && ul.visitas > (remoto.visitas || 0)) {
              remoto.visitas = ul.visitas;
            }
            if (ul.ultimo_acceso && (!remoto.ultimo_acceso || new Date(ul.ultimo_acceso) > new Date(remoto.ultimo_acceso))) {
              remoto.ultimo_acceso = ul.ultimo_acceso;
            }
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
  usuario: Partial<UsuarioSistema> & { id: string; email: string }
): Promise<void> {
  const cleanEmail = usuario.email.toLowerCase().trim();
  let visitasFinal = usuario.visitas || 1;

  if (typeof window !== 'undefined') {
    try {
      const lista = await getUsuariosSistema();
      const idx = lista.findIndex((u) => u.email.toLowerCase() === cleanEmail);
      if (idx >= 0) {
        visitasFinal = (lista[idx].visitas || 1);
        lista[idx] = {
          ...lista[idx],
          ...usuario,
          visitas: visitasFinal,
          verificado: usuario.verificado !== undefined ? usuario.verificado : lista[idx].verificado,
        };
      } else {
        const nuevoUsr: UsuarioSistema = {
          nombre: cleanEmail.split('@')[0],
          rol: 'usuario',
          estado: 'activo',
          fecha_registro: new Date().toISOString(),
          ultimo_acceso: new Date().toISOString(),
          verificado: false,
          visitas: 1,
          ...usuario,
          id: usuario.id,
          email: cleanEmail,
        };
        lista.unshift(nuevoUsr);
      }
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(lista));
    } catch (e) {
      console.warn('[Usuarios] Error al persistir usuario local:', e);
    }
  }

  if (isSupabaseConfigured) {
    try {
      const payload: Record<string, unknown> = {
        id: usuario.id,
        email: cleanEmail,
        nombre: usuario.nombre,
        rol: usuario.rol,
        estado: usuario.estado,
        motivo_estado: usuario.motivo_estado,
        comercio_id: usuario.comercio_id,
        fecha_registro: usuario.fecha_registro,
        ultimo_acceso: usuario.ultimo_acceso || new Date().toISOString(),
      };

      const { error } = await supabase.from('usuarios').upsert(payload);
      if (error) {
        console.warn('[Usuarios] Aviso al guardar usuario en Supabase:', error.message);
      }
    } catch (supaErr) {
      console.warn('[Usuarios] Supabase upsert error no crítico:', supaErr);
    }
  }
}

/**
 * Registra una visita o acceso de un usuario incrementando su contador y actualizando su fecha de último acceso
 */
export async function registrarVisitaUsuario(email: string): Promise<void> {
  if (!email) return;
  const cleanEmail = email.toLowerCase().trim();

  try {
    const lista = await getUsuariosSistema();
    const idx = lista.findIndex((u) => u.email.toLowerCase() === cleanEmail);
    if (idx >= 0) {
      const nuevoTotalVisitas = (lista[idx].visitas || 0) + 1;
      const ahora = new Date().toISOString();
      lista[idx].visitas = nuevoTotalVisitas;
      lista[idx].ultimo_acceso = ahora;

      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(lista));
      }

      if (isSupabaseConfigured) {
        // Actualizar último acceso en Supabase
        await supabase
          .from('usuarios')
          .update({ ultimo_acceso: ahora })
          .eq('email', cleanEmail);
      }
    }
  } catch (e) {
    console.warn('[Usuarios] Error al registrar visita de usuario:', e);
  }
}

/**
 * Alterna el estado de verificación de un usuario (Verificado / Sin Verificar)
 */
export async function alternarVerificacionUsuario(
  id: string,
  verificado: boolean
): Promise<{ exito: boolean; error?: string }> {
  try {
    const lista = await getUsuariosSistema();
    const idx = lista.findIndex((u) => u.id === id);

    if (idx < 0) {
      return { exito: false, error: 'Usuario no encontrado.' };
    }

    lista[idx].verificado = verificado;

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(lista));
    }

    if (isSupabaseConfigured) {
      // 1. Intentar actualizar columna 'verificado'
      const { error } = await supabase
        .from('usuarios')
        .update({ verificado })
        .eq('id', id);

      // 2. Si la columna aún no existe en Supabase, persistir el marcador en motivo_estado
      if (error && error.code === 'PGRST204') {
        let motivoBase = (lista[idx].motivo_estado || '').replace(/\[VERIFICADO\]/g, '').trim();
        if (verificado) {
          motivoBase = `${motivoBase} [VERIFICADO]`.trim();
        }
        await supabase
          .from('usuarios')
          .update({ motivo_estado: motivoBase || null })
          .eq('id', id);
      }
    }

    return { exito: true };
  } catch (err: any) {
    return { exito: false, error: err?.message || 'Error al cambiar estado de verificación.' };
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
      // Preservar marcador [VERIFICADO] si existía
      const teniaVerificado = lista[idx].motivo_estado?.includes('[VERIFICADO]');
      let motivoFinal = motivo;
      if (teniaVerificado && !motivoFinal.includes('[VERIFICADO]')) {
        motivoFinal = `${motivoFinal} [VERIFICADO]`.trim();
      }
      lista[idx].motivo_estado = motivoFinal;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(lista));
    }

    if (isSupabaseConfigured) {
      await supabase
        .from('usuarios')
        .update({
          estado: nuevoEstado,
          motivo_estado: lista[idx].motivo_estado || null,
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
 * Elimina definitivamente a un usuario del sistema y de la base de datos de Supabase
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
      // Limpiar posibles tokens residuales de este email
      localStorage.removeItem('vecinos_token_' + objetivo.email.toLowerCase());
    }

    if (isSupabaseConfigured) {
      // Eliminar de Supabase por ID y por Email para asegurar 100% de purga en la base remota
      await supabase.from('usuarios').delete().eq('id', id);
      if (objetivo.email) {
        await supabase.from('usuarios').delete().eq('email', objetivo.email.toLowerCase());
      }
      await supabase.from('tokens_registro').delete().eq('email', objetivo.email.toLowerCase());
    }

    return { exito: true };
  } catch (err: any) {
    return { exito: false, error: err?.message || 'Error al eliminar usuario de la base de datos.' };
  }
}
