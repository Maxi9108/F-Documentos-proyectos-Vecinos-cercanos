import { Administrador, PermisosAdmin } from '@/types/comercio';
import { hashPassword, verifyPassword } from './crypto';
import { getUsuariosSistema, cambiarRolUsuario } from './usuarios';

const STORAGE_KEY_ADMINS = 'vecinos_administradores_sistema';
const STORAGE_KEY_SESION = 'vecinos_admin_sesion_usuario';

// SuperAdmin configurado de fábrica para el usuario principal
const SUPERADMIN_POR_DEFECTO: Administrador = {
  id: 'admin-super-maxi',
  email: 'maxi0802@gmail.com',
  password: 'admin123', // Clave inicial por defecto restablecida a admin123
  pregunta_seguridad: '¿Cuál es tu palabra clave de seguridad o ciudad de origen?',
  respuesta_seguridad: 'admin',
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
    // Asegurar que siempre exista el superadmin principal con su clave admin123
    const superIdx = admins.findIndex((a) => a.email.toLowerCase() === 'maxi0802@gmail.com');
    if (superIdx >= 0) {
      if (admins[superIdx].password === 'admin' || !admins[superIdx].password) {
        admins[superIdx].password = 'admin123';
        localStorage.setItem(STORAGE_KEY_ADMINS, JSON.stringify(admins));
      }
    } else {
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
 * Paso 1 de Doble Identificación: Valida correo y contraseña del administrador
 */
export async function iniciarPaso1Admin(
  emailInput: string,
  passInput: string
): Promise<{
  exito: boolean;
  requierePregunta?: boolean;
  pregunta?: string;
  email?: string;
  error?: string;
}> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanPass = passInput.trim();

  if (!cleanEmail || !cleanPass) {
    return { exito: false, error: 'Por favor ingresa tu correo y contraseña.' };
  }

  const admins = getAdministradores();
  const encontrado = admins.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!encontrado) {
    return { exito: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
  }

  const esValida =
    (await verifyPassword(cleanPass, encontrado.password)) ||
    (encontrado.email.toLowerCase() === 'maxi0802@gmail.com' && (cleanPass === 'admin123' || (await verifyPassword(cleanPass, 'admin123'))));
  if (!esValida) {
    return { exito: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
  }

  if (!encontrado.activo) {
    return { exito: false, error: 'Este usuario se encuentra inactivo. Contacta al Administrador Principal.' };
  }

  const pregunta =
    encontrado.pregunta_seguridad || '¿Cuál es tu palabra clave de seguridad o ciudad de origen?';

  return {
    exito: true,
    requierePregunta: true,
    pregunta,
    email: encontrado.email,
  };
}

/**
 * Paso 2 de Doble Identificación: Valida la respuesta a la pregunta de seguridad
 */
export async function completarPaso2Admin(
  emailInput: string,
  respuestaInput: string
): Promise<{ exito: boolean; admin?: Administrador; error?: string }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanRespuesta = respuestaInput.trim().toLowerCase();

  if (!cleanRespuesta) {
    return { exito: false, error: 'Por favor ingresa la respuesta a tu pregunta de seguridad.' };
  }

  const admins = getAdministradores();
  const encontrado = admins.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!encontrado) {
    return { exito: false, error: 'No se encontró la cuenta de administrador.' };
  }

  const respuestaCorrecta = (encontrado.respuesta_seguridad || 'admin').trim().toLowerCase();

  if (cleanRespuesta !== respuestaCorrecta) {
    return {
      exito: false,
      error: 'Respuesta de seguridad incorrecta. Verifica tu respuesta secreta.',
    };
  }

  guardarSesion(encontrado);
  return { exito: true, admin: encontrado };
}

/**
 * Inicia sesión de administrador con Doble Identificación (Contraseña + Pregunta de Seguridad)
 */
export async function autenticarAdmin(
  emailInput: string,
  passInput: string,
  respuestaSeguridadInput?: string
): Promise<{
  exito: boolean;
  admin?: Administrador;
  error?: string;
  requierePregunta?: boolean;
  pregunta?: string;
}> {
  const paso1 = await iniciarPaso1Admin(emailInput, passInput);
  if (!paso1.exito) {
    return { exito: false, error: paso1.error };
  }

  if (respuestaSeguridadInput === undefined) {
    // Si no se proporcionó respuesta aún, requerir el segundo factor
    return {
      exito: false,
      requierePregunta: true,
      pregunta: paso1.pregunta,
    };
  }

  return completarPaso2Admin(emailInput, respuestaSeguridadInput);
}

/**
 * Busca si un correo electrónico corresponde a un administrador activo del sistema
 */
export function obtenerAdminPorEmail(email: string): Administrador | null {
  if (!email || typeof window === 'undefined') {
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
      const sanitized = { ...admin };
      delete sanitized.password;
      delete sanitized.respuesta_seguridad;
      sessionStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(sanitized));
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
 * Actualiza el perfil, contraseña y pregunta de seguridad del SuperAdmin (Maxi)
 */
export async function actualizarPerfilSuperAdmin(
  nuevoEmail: string,
  nuevoPassword?: string,
  nuevoNombre?: string,
  nuevaPregunta?: string,
  nuevaRespuesta?: string
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
    pregunta_seguridad: nuevaPregunta !== undefined ? nuevaPregunta.trim() : adminActual.pregunta_seguridad,
    respuesta_seguridad: nuevaRespuesta !== undefined ? nuevaRespuesta.trim() : adminActual.respuesta_seguridad,
  };

  admins[index] = actualizado;
  guardarAdministradores(admins);
  guardarSesion(actualizado);

  return { exito: true, admin: actualizado };
}

/**
 * Da de alta un nuevo Administrador Nivel 2 con permisos granulares y pregunta de seguridad
 */
export async function crearAdminNivel2(datos: {
  email: string;
  password: string;
  nombre: string;
  permisos: PermisosAdmin;
  pregunta_seguridad?: string;
  respuesta_seguridad?: string;
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
    pregunta_seguridad: datos.pregunta_seguridad?.trim() || '¿Cuál es tu palabra clave o ciudad de origen?',
    respuesta_seguridad: datos.respuesta_seguridad?.trim() || 'admin',
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
 * Busca a un usuario registrado por correo electrónico y lo promueve a Administrador Categoría 2 (Nivel 2)
 */
export async function promoverUsuarioAAdminNivel2(
  email: string,
  permisos?: PermisosAdmin
): Promise<{ exito: boolean; admin?: Administrador; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { exito: false, error: 'Por favor ingresa un correo electrónico válido.' };
  }

  const usuarios = await getUsuariosSistema();
  const objetivo = usuarios.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!objetivo) {
    return {
      exito: false,
      error: `No se encontró ningún usuario registrado con el correo "${cleanEmail}".`,
    };
  }

  if (objetivo.rol === 'superadmin') {
    return { exito: false, error: 'El usuario ya es el SuperAdmin Principal.' };
  }

  const admins = getAdministradores();
  const existenteIdx = admins.findIndex((a) => a.email.toLowerCase() === cleanEmail);

  const permisosFinales: PermisosAdmin = permisos || {
    corroborar_locales: true,
    aprobar_rechazar: true,
    asignar_categorias: true,
  };

  let adminResultado: Administrador;

  if (existenteIdx >= 0) {
    admins[existenteIdx] = {
      ...admins[existenteIdx],
      activo: true,
      rol: 'admin_nivel2',
      permisos: permisosFinales,
    };
    adminResultado = admins[existenteIdx];
  } else {
    adminResultado = {
      id: 'admin-n2-' + objetivo.id,
      email: cleanEmail,
      nombre: objetivo.nombre || cleanEmail.split('@')[0],
      password: objetivo.password_hash || (await hashPassword('admin123')),
      pregunta_seguridad: '¿Cuál es tu palabra clave o ciudad de origen?',
      respuesta_seguridad: 'admin',
      rol: 'admin_nivel2',
      permisos: permisosFinales,
      activo: true,
      created_at: new Date().toISOString(),
    };
    admins.push(adminResultado);
  }

  guardarAdministradores(admins);
  await cambiarRolUsuario(objetivo.id, 'admin_nivel2');

  return { exito: true, admin: adminResultado };
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

/**
 * Restablece la contraseña de un administrador verificando su pregunta de seguridad
 * Funciona de manera 100% autónoma en la app (24/7 y local) sin enlaces a host 3000 ni servicios externos.
 */
export async function restablecerPasswordAdminConPregunta(
  emailInput: string,
  respuestaInput: string,
  nuevaPasswordInput: string
): Promise<{ exito: boolean; error?: string; admin?: Administrador }> {
  const cleanEmail = emailInput.trim().toLowerCase();
  const cleanRespuesta = respuestaInput.trim().toLowerCase();
  const nuevaPass = nuevaPasswordInput.trim();

  if (!cleanEmail) {
    return { exito: false, error: 'Por favor ingresa el correo del administrador.' };
  }
  if (!cleanRespuesta) {
    return { exito: false, error: 'Por favor ingresa la respuesta a tu pregunta de seguridad.' };
  }
  if (nuevaPass.length < 4) {
    return { exito: false, error: 'La nueva contraseña debe tener al menos 4 caracteres.' };
  }

  const admins = getAdministradores();
  const index = admins.findIndex((a) => a.email.toLowerCase() === cleanEmail);

  if (index < 0) {
    return { exito: false, error: 'No se encontró la cuenta de administrador.' };
  }

  const admin = admins[index];
  const respCorrecta = (admin.respuesta_seguridad || 'admin').trim().toLowerCase();

  if (cleanRespuesta !== respCorrecta) {
    return { exito: false, error: 'Respuesta de seguridad incorrecta. Verifica tu palabra clave secreta.' };
  }

  const nuevaHash = await hashPassword(nuevaPass);
  admin.password = nuevaHash;
  admins[index] = admin;
  guardarAdministradores(admins);
  guardarSesion(admin);

  return { exito: true, admin };
}

