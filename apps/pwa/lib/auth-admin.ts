import { Administrador, PermisosAdmin, RolAdmin } from '@/types/comercio';
import { hashPassword, verifyPassword } from './crypto';

const STORAGE_KEY_ADMINS = 'vecinos_administradores_sistema';
const STORAGE_KEY_SESION = 'vecinos_admin_sesion_usuario';

// SuperAdmin configurado de fábrica para el usuario principal
const SUPERADMIN_POR_DEFECTO: Administrador = {
  id: 'admin-super-maxi',
  email: 'maxi0802@gmail.com',
  password: 'admin', // Clave inicial por defecto, editable en cualquier momento
  nombre: 'Maxi (SuperAdmin)',
  rol: 'superadmin',
  permisos: {
    corroborar_locales: true,
    aprobar_rechazar: true,
    asignar_categorias: true,
    gestionar_equipo: true,
  },
  activo: true,
  created_at: '2026-01-01T00:00:00.000Z',
};

/**
 * Obtiene la lista de todos los administradores registrados
 */
export function getAdministradores(): Administrador[] {
  if (typeof window === 'undefined') return [SUPERADMIN_POR_DEFECTO];

  try {
    const raw = localStorage.getItem(STORAGE_KEY_ADMINS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify([SUPERADMIN_POR_DEFECTO]));
      return [SUPERADMIN_POR_DEFECTO];
    }
    const admins: Administrador[] = JSON.parse(raw);
    // Asegurar que siempre exista al menos un superadmin
    if (!admins.some((a) => a.rol === 'superadmin')) {
      admins.unshift(SUPERADMIN_POR_DEFECTO);
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
    }
    return admins;
  } catch (e) {
    console.warn('[AuthAdmin] Error al leer administradores:', e);
    return [SUPERADMIN_POR_DEFECTO];
  }
}

/**
 * Guarda la lista de administradores en almacenamiento persistente
 */
function guardarAdministradores(admins: Administrador[]): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
    } catch (e) {
      console.warn('[AuthAdmin] Error al guardar administradores:', e);
    }
  }
}

/**
 * Obtiene el administrador que actualmente tiene la sesión iniciada
 */
export function getAdminActual(): Administrador | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_SESION);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[AuthAdmin] Error al leer sesión activa:', e);
    return null;
  }
}

/**
 * Inicia sesión de administrador con Email y Contraseña
 */
export async function autenticarAdmin(
  emailInput: string,
  passInput: string
): Promise<{ exito: boolean; admin?: Administrador; error?: string }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPass = passInput.trim();

  if (!cleanEmail || !cleanPass) {
    return { exito: false, error: 'Por favor ingresa tu correo y contraseña.' };
  }

  const admins = getAdministradores();

  const encontrado = admins.find(
    (a) => a.email.toLowerCase() === cleanEmail
  );

  if (!encontrado) {
    return { exito: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
  }

  const esValida = await verifyPassword(cleanPass, encontrado.password);
  if (!esValida) {
    return { exito: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
  }

  if (!encontrado.activo) {
    return { exito: false, error: 'Este usuario se encuentra inactivo. Contacta al Administrador Principal.' };
  }

  guardarSesion(encontrado);
  return { exito: true, admin: encontrado };
}

/**
 * Busca si un correo electrónico corresponde a un administrador activo del sistema
 */
export function obtenerAdminPorEmail(email: string): Administrador | null {
  if (!email || typeof window === 'undefined') {
    // Si estamos en SSR o inicio, comprobar contra el superadmin por defecto
    const clean = (email || '').trim().toLowerCase();
    if (clean === SUPERADMIN_POR_DEFECTO.email.toLowerCase()) {
      return SUPERADMIN_POR_DEFECTO;
    }
    return null;
  }

  const clean = email.trim().toLowerCase();
  const admins = getAdministradores();
  const encontrado = admins.find((a) => a.email.toLowerCase() === clean && a.activo);
  if (encontrado) return encontrado;

  // Respaldo garantizado para el email principal
  if (clean === SUPERADMIN_POR_DEFECTO.email.toLowerCase()) {
    return SUPERADMIN_POR_DEFECTO;
  }

  return null;
}

/**
 * Guarda los datos de sesión en sessionStorage
 */
export function guardarSesion(admin: Administrador): void {
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(admin));
      sessionStorage.setItem('vecinos_admin_sesion', 'true');
    } catch (e) {
      console.warn('[AuthAdmin] Error al persistir sesión:', e);
    }
  }
}

/**
 * Cierra la sesión activa
 */
export function cerrarSesionAdmin(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STORAGE_KEY_SESION);
    sessionStorage.removeItem('vecinos_admin_sesion');
  }
}

/**
 * Actualiza el perfil y contraseña del SuperAdmin (Maxi)
 */
export async function actualizarPerfilSuperAdmin(
  nuevoEmail: string,
  nuevoPassword?: string,
  nuevoNombre?: string
): Promise<{ exito: boolean; admin?: Administrador; error?: string }> {
  const admins = getAdministradores();
  const index = admins.findIndex((a) => a.rol === 'superadmin');

  if (index < 0) {
    return { exito: false, error: 'No se encontró el usuario SuperAdmin.' };
  }

  const adminActual = admins[index];
  let passFinal = adminActual.password;
  if (nuevoPassword && nuevoPassword.trim()) {
    passFinal = await hashPassword(nuevoPassword.trim());
  }

  const actualizado: Administrador = {
    ...adminActual,
    email: nuevoEmail.trim().toLowerCase() || adminActual.email,
    nombre: nuevoNombre ? nuevoNombre.trim() : adminActual.nombre,
    password: passFinal,
  };

  admins[index] = actualizado;
  guardarAdministradores(admins);
  guardarSesion(actualizado);

  return { exito: true, admin: actualizado };
}

/**
 * Da de alta un nuevo Administrador Nivel 2 con permisos granulares
 */
export async function crearAdminNivel2(datos: {
  email: string;
  password: string;
  nombre: string;
  permisos: PermisosAdmin;
}): Promise<{ exito: boolean; admin?: Administrador; error?: string }> {
  const cleanEmail = datos.email.trim().toLowerCase();

  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { exito: false, error: 'El correo electrónico ingresado no es válido.' };
  }

  if (!datos.password || datos.password.length < 4) {
    return { exito: false, error: 'La contraseña debe tener al menos 4 caracteres.' };
  }

  const admins = getAdministradores();

  if (admins.some((a) => a.email.toLowerCase() === cleanEmail)) {
    return { exito: false, error: 'Ya existe un administrador con este correo electrónico.' };
  }

  const hashedPass = await hashPassword(datos.password.trim());

  const nuevo: Administrador = {
    id: 'admin-n2-' + Date.now(),
    email: cleanEmail,
    password: hashedPass,
    nombre: datos.nombre.trim() || 'Moderador Nivel 2',
    rol: 'admin_nivel2',
    permisos: datos.permisos,
    activo: true,
    created_at: new Date().toISOString(),
  };

  admins.push(nuevo);
  guardarAdministradores(admins);

  return { exito: true, admin: nuevo };
}

/**
 * Alterna el estado activo/inactivo de un moderador o actualiza sus datos
 */
export function actualizarAdmin(
  adminId: string,
  cambios: Partial<Administrador>
): { exito: boolean; error?: string } {
  const admins = getAdministradores();
  const index = admins.findIndex((a) => a.id === adminId);

  if (index < 0) return { exito: false, error: 'Administrador no encontrado.' };

  // Evitar desactivar al superadmin
  if (admins[index].rol === 'superadmin' && cambios.activo === false) {
    return { exito: false, error: 'No es posible desactivar la cuenta del Administrador Principal.' };
  }

  admins[index] = { ...admins[index], ...cambios };
  guardarAdministradores(admins);
  return { exito: true };
}

/**
 * Elimina un administrador Nivel 2
 */
export function eliminarAdmin(adminId: string): { exito: boolean; error?: string } {
  let admins = getAdministradores();
  const objetivo = admins.find((a) => a.id === adminId);

  if (!objetivo) return { exito: false, error: 'Administrador no encontrado.' };
  if (objetivo.rol === 'superadmin') {
    return { exito: false, error: 'No es posible eliminar al Administrador Principal.' };
  }

  admins = admins.filter((a) => a.id !== adminId);
  guardarAdministradores(admins);
  return { exito: true };
}
