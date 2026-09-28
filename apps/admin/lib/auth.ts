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
): Promise<{ ok: boolean; admin?: AdminSesion; error?: string }> {
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
        return { ok: false, error: 'Contraseña incorrecta.' };
      }
    } catch (err) {
      console.warn('[Admin Auth] Error consultando Supabase:', err);
    }
  }

  // 2. Fallback de fábrica para Maxi SuperAdmin (Clave predeterminada: admin)
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
    return { ok: false, error: 'Contraseña incorrecta. Recuerda que la clave por defecto es "admin".' };
  }

  return { ok: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
}
