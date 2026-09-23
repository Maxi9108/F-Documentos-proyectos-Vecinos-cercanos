'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { obtenerUbicacionGpsActual, PosicionSatelital } from '@/lib/geolocation';
import { supabase } from '@/lib/supabase';

export interface Usuario {
  id: string;
  email: string;
  nombre?: string;
  creado_en: string;
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
  iniciarSesion: (email: string, password: string) => Promise<{ ok: boolean; mensaje?: string }>;
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
        setUsuario(JSON.parse(rawUser));
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

      const nuevoUsuario: Usuario = {
        id: 'usr_' + Date.now(),
        email: cleanEmail,
        nombre: nombre || cleanEmail.split('@')[0],
        creado_en: new Date().toISOString(),
      };

      setUsuario(nuevoUsuario);
      localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(nuevoUsuario));
      setModalAuthAbierto(false);
      return { ok: true, mensaje: '¡Cuenta creada con éxito! Bienvenido/a a Vecin@s Conectad@s.' };
    } catch (err: any) {
      return { ok: false, mensaje: err?.message || 'Ocurrió un error al registrarte.' };
    }
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

      const usuarioSesion: Usuario = {
        id: 'usr_' + Date.now(),
        email: cleanEmail,
        nombre: cleanEmail.split('@')[0],
        creado_en: new Date().toISOString(),
      };

      setUsuario(usuarioSesion);
      localStorage.setItem(STORAGE_KEYS.USUARIO, JSON.stringify(usuarioSesion));
      setModalAuthAbierto(false);
      return { ok: true, mensaje: '¡Sesión iniciada correctamente!' };
    } catch (err: any) {
      return { ok: false, mensaje: err?.message || 'Error al iniciar sesión.' };
    }
  };

  // Autenticación: Cerrar sesión
  const cerrarSesion = () => {
    setUsuario(null);
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

  return (
    <UserContext.Provider
      value={{
        usuario,
        estaAutenticado: Boolean(usuario),
        iniciarSesion,
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
