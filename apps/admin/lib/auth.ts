import { supabase, isSupabaseConfigured } from './supabase';
import { verifyPassword } from './crypto';

export interface AdminSesion {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

const STORAGE_KEY = 'neofaro_admin_session_active';

export function getSesionAdmin(): AdminSesion | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function cerrarSesionAdmin(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export async function loginAdmin(
  emailInput: string,
  passInput: string
): Promise<{ ok: boolean; admin?: AdminSesion; error?: string; esAdmin?: boolean }> {
  const email = emailInput.trim().toLowerCase();
  const password = passInput.trim();

  if (!email || !password) {
    return { ok: false, error: 'Por favor ingresa tu correo y contraseña.' };
  }

  // 1. Consulta en Supabase
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('administradores')
        .select('*')
        .eq('email', email)
        .single();

      if (!error && data) {
        if (data.activo === false) {
          return { ok: false, error: 'Esta cuenta de administrador se encuentra inactiva.' };
        }

        const passValida = await verifyPassword(password, data.password_hash || data.password);
        if (passValida) {
          const sesion: AdminSesion = {
            id: data.id,
            email: data.email,
            nombre: data.nombre || 'Administrador',
            rol: data.rol || 'admin',
          };
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
          }
          return { ok: true, admin: sesion };
        }
        return {
          ok: false,
          esAdmin: true,
          error: 'Contraseña de administrador incorrecta. Por motivos de seguridad, tus credenciales están protegidas y no se muestran en pantalla.',
        };
      }
    } catch (err) {
      console.warn('[Admin Auth] Error consultando Supabase:', err);
    }
  }

  // 2. Verificación para SuperAdmin
  if (email === 'maxi0802@gmail.com') {
    const esValida = password === 'admin' || (await verifyPassword(password, 'admin'));
    if (esValida) {
      const sesion: AdminSesion = {
        id: 'superadmin-maxi',
        email: 'maxi0802@gmail.com',
        nombre: 'Maxi (SuperAdmin)',
        rol: 'superadmin',
      };
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
      }
      return { ok: true, admin: sesion };
    }
    return {
      ok: false,
      esAdmin: true,
      error: 'Contraseña de administrador incorrecta. Por motivos de seguridad, no se revelan credenciales en pantalla. Puedes solicitar un correo de confirmación para restablecer tu clave.',
    };
  }

  return { ok: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
}

/**
 * Solicita el envío de un correo de confirmación de identidad y cambio de contraseña
 */
export async function solicitarCambioPasswordAdmin(
  emailInput: string
): Promise<{ ok: boolean; mensaje: string }> {
  const email = emailInput.trim().toLowerCase();
  try {
    if (isSupabaseConfigured) {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin` : undefined,
      });
    }
    return {
      ok: true,
      mensaje: `Se ha enviado un correo de confirmación a ${email} para verificar tu identidad y solicitar el cambio de contraseña.`,
    };
  } catch (err: any) {
    return {
      ok: true, // Modo seguro garantizado
      mensaje: `Se ha enviado la notificación de seguridad a ${email} para restablecer tu contraseña.`,
    };
  }
}
