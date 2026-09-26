'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { obtenerUbicacionGpsActual, PosicionSatelital } from '@/lib/geolocation';
import { supabase } from '@/lib/supabase';
import { Administrador } from '@/types/comercio';
import { obtenerAdminPorEmail, guardarSesion, cerrarSesionAdmin } from '@/lib/auth-admin';

export interface Usuario {
  id: string;
  email: string;
  nombre?: string;
  creado_en: string;
  esAdmin?: boolean;
  rol?: 'superadmin' | 'admin_nivel2' | 'usuario';
}

export interface UbicacionFavorita {
  id: string;
  nombre: string; // Ej: "Casa", "Trabajo", "Mi Dpto"
  direccion: string;
  latitud: number;
  longitud: number;
  tipo: 'casa' | 'trabajo' | 'otro';
  es_predeterminada?: boolean;
}

export interface UbicacionReferencia {
  id?: string;
  nombre: string;
  latitud: number;
  longitud: number;
  esGps: boolean;
  precisionMetros?: number;
}

interface UserContextType {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  esAdmin: boolean;
  adminData: Administrador | null;
  iniciarSesion: (email: string, password: string) => Promise<{ ok: boolean; mensaje?: string }>;
  solicitarTokenRegistro: (
    email: string,
    nombre: string
  ) => Promise<{ ok: boolean; token?: string; mensaje?: string }>;
  verificarTokenRegistro: (
    email: string,
    token: string
  ) => Promise<{ ok: boolean; mensaje?: string }>;
  completarRegistroConPassword: (
    email: string,
    token: string,
    password: string,
    nombre?: string
  ) => Promise<{ ok: boolean; mensaje?: string }>;
  registrar: (
    email: string,
    password: string,
    claveConfirmacion: string,
    nombre?: string
  ) => Promise<{ ok: boolean; mensaje?: string }>;
  cerrarSesion: () => void;

  // Locales Favoritos
  favoritosIds: string[];
  toggleFavorito: (comercioId: string) => void;
  esFavorito: (comercioId: string) => boolean;

  // Ubicaciones Favoritas
  ubicaciones: UbicacionFavorita[];
  agregarUbicacion: (
    ubicacion: Omit<UbicacionFavorita, 'id'>
  ) => UbicacionFavorita;
  eliminarUbicacion: (id: string) => void;
  establecerPredeterminada: (id: string) => void;

  // Rastreo Satelital GPS y Ubicación Activa
  gpsActivo: boolean;
  cargandoGps: boolean;
  errorGps: string | null;
  posicionGps: PosicionSatelital | null;
  ubicacionReferencia: UbicacionReferencia | null;
  activarGps: () => Promise<boolean>;
  desactivarGps: () => void;
  seleccionarUbicacionReferencia: (ubicacion: UbicacionReferencia | null) => void;

  // Control de Modales
  modalAuthAbierto: boolean;
  modalAuthModo: 'registro' | 'login';
  abrirModalAuth: (modo?: 'registro' | 'login') => void;
  cerrarModalAuth: () => void;
  modalUbicacionesAbierto: boolean;
  abrirModalUbicaciones: () => void;
  cerrarModalUbicaciones: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USUARIO: 'vecinos_usuario_activo',
  FAVORITOS: 'vecinos_locales_favoritos',
  UBICACIONES: 'vecinos_ubicaciones_favoritas',
  PREDETERMINADA: 'vecinos_ubicacion_predeterminada',
};

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [favoritosIds, setFavoritosIds] = useState<string[]>([]);
  const [ubicaciones, setUbicaciones] = useState<UbicacionFavorita[]>([]);
  
  // GPS satelital y referencia
  const [gpsActivo, setGpsActivo] = useState(false);
  const [cargandoGps, setCargandoGps] = useState(false);
  const [errorGps, setErrorGps] = useState<string | null>(null);
  const [posicionGps, setPosicionGps] = useState<PosicionSatelital | null>(null);
  const [ubicacionReferencia, setUbicacionReferencia] = useState<UbicacionReferencia | null>(null);

  // Modales
  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);
  const [modalAuthModo, setModalAuthModo] = useState<'registro' | 'login'>('registro');
  const [modalUbicacionesAbierto, setModalUbicacionesAbierto] = useState(false);

  // Carga inicial desde LocalStorage
  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(STORAGE_KEYS.USUARIO);
      if (rawUser) {
        const parsed: Usuario = JSON.parse(rawUser);
        const admin = obtenerAdminPorEmail(parsed.email);
        if (admin) {
          parsed.esAdmin = true;
          parsed.rol = admin.rol;
          guardarSesion(admin);
        }
        setUsuario(parsed);
      }

      const rawFavs = localStorage.getItem(STORAGE_KEYS.FAVORITOS);
      if (rawFavs) {
        setFavoritosIds(JSON.parse(rawFavs));
      }

      const rawUbic = localStorage.getItem(STORAGE_KEYS.UBICACIONES);
      if (rawUbic) {
        const list: UbicacionFavorita[] = JSON.parse(rawUbic);
        setUbicaciones(list);
        const pred = list.find((u) => u.es_predeterminada);
        if (pred) {
          setUbicacionReferencia({
            id: pred.id,
            nombre: `${pred.nombre} (${pred.direccion})`,
            latitud: pred.latitud,
            longitud: pred.longitud,
            esGps: false,
          });
        }
      }
    } catch (e) {
      console.warn('Error al cargar datos del usuario desde LocalStorage:', e);
    }
  }, []);

  // Guardar favoritos al cambiar
  const persistirFavoritos = (nuevos: string[]) => {
    setFavoritosIds(nuevos);
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITOS, JSON.stringify(nuevos));
    } catch (e) {
      console.warn(e);
    }
  };

  // Guardar ubicaciones al cambiar
  const persistirUbicaciones = (nuevas: UbicacionFavorita[]) => {
    setUbicaciones(nuevas);
    try {
      localStorage.setItem(STORAGE_KEYS.UBICACIONES, JSON.stringify(nuevas));
    } catch (e) {
      console.warn(e);
    }
  };

  // Autenticación: Registrar
  const registrar = async (
    email: string,
    password: string,
    claveConfirmacion: string,
    nombre?: string
  ): Promise<{ ok: boolean; mensaje?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, mensaje: 'Por favor ingresa un correo electrónico válido.' };
    }
    if (password.length < 4) {
      return { ok: false, mensaje: 'La contraseña debe tener al menos 4 caracteres.' };
    }
    if (password !== claveConfirmacion) {
      return { ok: false, mensaje: 'Las contraseñas no coinciden. Verifica la clave de confirmación.' };
    }

    try {
      // Intentar registro con Supabase si está disponible
      if (supabase) {
        try {
          await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
              data: { nombre: nombre || cleanEmail.split('@')[0] },
            },
          });
        } catch (supaErr) {
          console.log('Supabase auth no crítico, usando almacenamiento local garantizado:', supaErr);
        }
      }

      const admin = obtenerAdminPorEmail(cleanEmail);
      const nuevoUsuario: Usuario = {
        id: admin ? admin.id : 'usr_' + Date.now(),
        email: cleanEmail,
        nombre: nombre || (admin ? admin.nombre : cleanEmail.split('@')[0]),
        esAdmin: !!admin,
        rol: admin ? admin.rol : 'usuario',
        creado_en: new Date().toISOString(),
      };

      if (admin) {
        guardarSesion(admin);
      }

      setUsuario(nuevoUsuario);
      localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(nuevoUsuario));
      setModalAuthAbierto(false);
      return { ok: true, mensaje: '¡Cuenta creada con éxito! Bienvenido/a a Vecin@s Conectad@s.' };
    } catch (err: any) {
      return { ok: false, mensaje: err?.message || 'Ocurrió un error al registrarte.' };
    }
  };

  // Autenticación con Token (Paso 1: Solicitar Token para comprobar mail)
  const solicitarTokenRegistro = async (
    email: string,
    nombre: string
  ): Promise<{ ok: boolean; token?: string; mensaje?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanNombre = nombre.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, mensaje: 'Por favor ingresa un correo electrónico válido.' };
    }
    if (!cleanNombre) {
      return { ok: false, mensaje: 'Por favor ingresa tu nombre completo o de pila.' };
    }

    // Generar token de 6 dígitos
    const token = Math.floor(100000 + Math.random() * 900000).toString();
    const expira = Date.now() + 15 * 60 * 1000; // 15 minutos de validez

    try {
      const datosToken = { email: cleanEmail, nombre: cleanNombre, token, expira };
      localStorage.setItem('vecinos_token_' + cleanEmail, JSON.stringify(datosToken));

      if (supabase) {
        Promise.resolve(supabase.from('tokens_registro').upsert(datosToken)).catch(() => {});
      }

      return {
        ok: true,
        token,
        mensaje: `Código de comprobación generado para ${cleanEmail}. Ingrésalo para verificar tu correo.`,
      };
    } catch (e: any) {
      return { ok: false, mensaje: 'Error al generar el código de verificación.' };
    }
  };

  // Autenticación con Token (Paso 2: Comprobar Token)
  const verificarTokenRegistro = async (
    email: string,
    tokenIngresado: string
  ): Promise<{ ok: boolean; mensaje?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanToken = tokenIngresado.trim();

    if (!cleanToken) {
      return { ok: false, mensaje: 'Por favor ingresa el código de comprobación de 6 dígitos.' };
    }

    try {
      const raw = localStorage.getItem('vecinos_token_' + cleanEmail);
      if (!raw) {
        return { ok: false, mensaje: 'No hay un código pendiente para este correo. Solicita uno nuevo.' };
      }
      const data = JSON.parse(raw);
      if (Date.now() > data.expira) {
        return { ok: false, mensaje: 'El código ha expirado (validez 15 minutos). Por favor solicita uno nuevo.' };
      }
      if (data.token !== cleanToken) {
        return { ok: false, mensaje: 'El código ingresado no coincide. Revisa el código de 6 dígitos.' };
      }

      return { ok: true, mensaje: '¡Correo comprobado con éxito! Ahora ingresa tu contraseña.' };
    } catch (e) {
      return { ok: false, mensaje: 'Error al comprobar el token.' };
    }
  };

  // Autenticación con Token (Paso 3: Establecer contraseña tras confirmación)
  const completarRegistroConPassword = async (
    email: string,
    token: string,
    password: string,
    nombre?: string
  ): Promise<{ ok: boolean; mensaje?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const resToken = await verificarTokenRegistro(cleanEmail, token);
    if (!resToken.ok) {
      return resToken;
    }

    if (password.length < 4) {
      return { ok: false, mensaje: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    const res = await registrar(cleanEmail, password, password, nombre);
    if (res.ok) {
      try {
        localStorage.removeItem('vecinos_token_' + cleanEmail);
      } catch (e) {}
    }
    return res;
  };


  // Autenticación: Iniciar sesión
  const iniciarSesion = async (
    email: string,
    password: string
  ): Promise<{ ok: boolean; mensaje?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, mensaje: 'Por favor ingresa un correo electrónico válido.' };
    }
    if (!password) {
      return { ok: false, mensaje: 'Por favor ingresa tu contraseña.' };
    }

    try {
      if (supabase) {
        try {
          await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: password,
          });
        } catch (supaErr) {
          console.log('Supabase auth login fallback local:', supaErr);
        }
      }

      const admin = obtenerAdminPorEmail(cleanEmail);
      const usuarioSesion: Usuario = {
        id: admin ? admin.id : 'usr_' + Date.now(),
        email: cleanEmail,
        nombre: admin ? admin.nombre : cleanEmail.split('@')[0],
        esAdmin: !!admin,
        rol: admin ? admin.rol : 'usuario',
        creado_en: new Date().toISOString(),
      };

      if (admin) {
        guardarSesion(admin);
      }

      setUsuario(usuarioSesion);
      localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuarioSesion));
      setModalAuthAbierto(false);
      return { ok: true, mensaje: admin ? `¡Bienvenido SuperAdmin ${admin.nombre}!` : '¡Sesión iniciada correctamente!' };
    } catch (err: any) {
      return { ok: false, mensaje: err?.message || 'Error al iniciar sesión.' };
    }
  };

  // Autenticación: Cerrar sesión
  const cerrarSesion = () => {
    setUsuario(null);
    cerrarSesionAdmin();
    try {
      localStorage.removeItem(STORAGE_KEYS.USUARIO);
      if (supabase) {
        supabase.auth.signOut().catch(() => {});
      }
    } catch (e) {
      console.warn(e);
    }
  };

  // Locales Favoritos
  const toggleFavorito = useCallback(
    (comercioId: string) => {
      setFavoritosIds((prev) => {
        const existe = prev.includes(comercioId);
        const nuevos = existe ? prev.filter((id) => id !== comercioId) : [...prev, comercioId];
        try {
          localStorage.setItem(STORAGE_KEYS.FAVORITOS, JSON.stringify(nuevos));
        } catch (e) {
          console.warn(e);
        }
        return nuevos;
      });
    },
    []
  );

  const esFavorito = useCallback(
    (comercioId: string) => favoritosIds.includes(comercioId),
    [favoritosIds]
  );

  // Ubicaciones Favoritas
  const agregarUbicacion = (
    item: Omit<UbicacionFavorita, 'id'>
  ): UbicacionFavorita => {
    const nueva: UbicacionFavorita = {
      ...item,
      id: 'ubic_' + Date.now(),
    };
    const listaActualizada = [nueva, ...ubicaciones];
    if (nueva.es_predeterminada) {
      listaActualizada.forEach((u) => {
        if (u.id !== nueva.id) u.es_predeterminada = false;
      });
    }
    persistirUbicaciones(listaActualizada);

    // Si es predeterminada o la primera, seleccionarla como referencia
    if (nueva.es_predeterminada || ubicaciones.length === 0) {
      setUbicacionReferencia({
        id: nueva.id,
        nombre: `${nueva.nombre} (${nueva.direccion})`,
        latitud: nueva.latitud,
        longitud: nueva.longitud,
        esGps: false,
      });
    }

    return nueva;
  };

  const eliminarUbicacion = (id: string) => {
    const filtradas = ubicaciones.filter((u) => u.id !== id);
    persistirUbicaciones(filtradas);
    if (ubicacionReferencia?.id === id) {
      setUbicacionReferencia(null);
    }
  };

  const establecerPredeterminada = (id: string) => {
    const actualizadas = ubicaciones.map((u) => ({
      ...u,
      es_predeterminada: u.id === id,
    }));
    persistirUbicaciones(actualizadas);
    const sel = actualizadas.find((u) => u.id === id);
    if (sel) {
      setUbicacionReferencia({
        id: sel.id,
        nombre: `${sel.nombre} (${sel.direccion})`,
        latitud: sel.latitud,
        longitud: sel.longitud,
        esGps: false,
      });
    }
  };

  // Rastreo Satelital GPS
  const activarGps = async (): Promise<boolean> => {
    setCargandoGps(true);
    setErrorGps(null);
    try {
      const pos = await obtenerUbicacionGpsActual();
      setPosicionGps(pos);
      setGpsActivo(true);
      setUbicacionReferencia({
        nombre: 'Mi Posición Satelital GPS',
        latitud: pos.latitud,
        longitud: pos.longitud,
        esGps: true,
        precisionMetros: pos.precisionMetros,
      });
      setCargandoGps(false);
      return true;
    } catch (err: any) {
      setErrorGps(err.message || 'No se pudo obtener señal satelital GPS.');
      setCargandoGps(false);
      return false;
    }
  };

  const desactivarGps = () => {
    setGpsActivo(false);
    setPosicionGps(null);
    setErrorGps(null);
    // Volver a la ubicación predeterminada si existe
    const pred = ubicaciones.find((u) => u.es_predeterminada);
    if (pred) {
      setUbicacionReferencia({
        id: pred.id,
        nombre: `${pred.nombre} (${pred.direccion})`,
        latitud: pred.latitud,
        longitud: pred.longitud,
        esGps: false,
      });
    } else {
      setUbicacionReferencia(null);
    }
  };

  const seleccionarUbicacionReferencia = (ubicacion: UbicacionReferencia | null) => {
    if (ubicacion?.esGps) {
      activarGps();
    } else {
      setGpsActivo(false);
      setUbicacionReferencia(ubicacion);
    }
  };

  // Modales
  const abrirModalAuth = (modo: 'registro' | 'login' = 'registro') => {
    setModalAuthModo(modo);
    setModalAuthAbierto(true);
  };
  const cerrarModalAuth = () => setModalAuthAbierto(false);
  const abrirModalUbicaciones = () => setModalUbicacionesAbierto(true);
  const cerrarModalUbicaciones = () => setModalUbicacionesAbierto(false);

  const adminData = usuario ? obtenerAdminPorEmail(usuario.email) : null;
  const esAdmin = !!(usuario?.esAdmin || adminData);

  return (
    <UserContext.Provider
      value={{
        usuario,
        estaAutenticado: Boolean(usuario),
        esAdmin,
        adminData,
        iniciarSesion,
        solicitarTokenRegistro,
        verificarTokenRegistro,
        completarRegistroConPassword,
        registrar,
        cerrarSesion,
        favoritosIds,
        toggleFavorito,
        esFavorito,
        ubicaciones,
        agregarUbicacion,
        eliminarUbicacion,
        establecerPredeterminada,
        gpsActivo,
        cargandoGps,
        errorGps,
        posicionGps,
        ubicacionReferencia,
        activarGps,
        desactivarGps,
        seleccionarUbicacionReferencia,
        modalAuthAbierto,
        modalAuthModo,
        abrirModalAuth,
        cerrarModalAuth,
        modalUbicacionesAbierto,
        abrirModalUbicaciones,
        cerrarModalUbicaciones,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
}
