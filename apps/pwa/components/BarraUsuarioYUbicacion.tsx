'use client';

import React from 'react';
import Link from 'next/link';
import { useUser } from '@/context/user-context';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  Navigation,
  MapPin,
  Heart,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Compass,
  ShieldCheck,
  Database,
  HelpCircle,
} from 'lucide-react';

export default function BarraUsuarioYUbicacion() {
  const {
    usuario,
    estaAutenticado,
    esAdmin,
    abrirModalAuth,
    favoritosIds,
    ubicacionReferencia,
    gpsActivo,
    cargandoGps,
    activarGps,
    desactivarGps,
    abrirModalUbicaciones,
    ubicaciones,
    abrirModalSoporte,
  } = useUser();

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      {/* Botón / Selector de Ubicación de Referencia */}
      <div className="relative flex items-center">
        {gpsActivo ? (
          <button
            type="button"
            onClick={desactivarGps}
            title="GPS satelital activo. Haz clic para desactivar."
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/80 border border-cyan-500/80 text-cyan-300 text-xs font-semibold shadow-md shadow-cyan-950/50 hover:bg-cyan-900/60 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <Navigation className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">GPS Satelital Activo</span>
            <span className="sm:hidden">GPS</span>
          </button>
        ) : ubicacionReferencia ? (
          <button
            type="button"
            onClick={abrirModalUbicaciones}
            title={`Ubicación de referencia: ${ubicacionReferencia.nombre}`}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-violet-950/70 border border-violet-500/60 text-violet-200 text-xs font-semibold shadow-sm hover:bg-violet-900/60 transition-all cursor-pointer"
          >
            <MapPin className="w-3.5 h-3.5 text-violet-400" />
            <span className="max-w-[100px] sm:max-w-[130px] truncate">{ubicacionReferencia.nombre}</span>
            <ChevronDown className="w-3 h-3 text-violet-400" />
          </button>
        ) : (
          <button
            type="button"
            onClick={activarGps}
            disabled={cargandoGps}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-cyan-300 text-xs font-semibold transition-all cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-400" />
            <span className="hidden sm:inline">{cargandoGps ? 'Buscando GPS...' : 'Activar GPS Satelital'}</span>
            <span className="sm:hidden">{cargandoGps ? 'Buscando...' : 'GPS'}</span>
          </button>
        )}

        {/* Botón para gestionar ubicaciones guardadas */}
        <button
          type="button"
          onClick={abrirModalUbicaciones}
          title="Mis Ubicaciones Guardadas (Casa, Trabajo)"
          className="ml-1 p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-cyan-300 transition-colors cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Botón de Cuenta de Usuario / Registro / Favoritos */}
      {estaAutenticado && usuario ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => abrirModalAuth('login')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-sm ${
              esAdmin
                ? 'bg-zinc-900 hover:bg-zinc-800 border-violet-500/60 text-zinc-100 ring-1 ring-violet-500/30'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-200'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${
                esAdmin
                  ? 'bg-gradient-to-tr from-amber-500 to-violet-600'
                  : 'bg-gradient-to-tr from-violet-600 to-cyan-500'
              }`}
            >
              {usuario.nombre ? usuario.nombre[0].toUpperCase() : 'U'}
            </div>
            <span className="max-w-[100px] truncate hidden md:inline">
              {usuario.nombre || usuario.email.split('@')[0]}
            </span>
            {esAdmin && (
              <span className="px-1.5 py-0.2 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40 text-[9px] font-bold uppercase tracking-wider">
                Admin
              </span>
            )}
            {favoritosIds.length > 0 && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                {favoritosIds.length}
              </span>
            )}
          </button>

          {/* Acceso al Panel de Administración (SOLO VISIBLE SI ES ADMINISTRADOR) */}
          {esAdmin && (
            <Link
              href="/admin"
              title="Panel del Administrador (Acceso Autorizado)"
              className="py-1.5 px-2.5 sm:px-3 bg-gradient-to-r from-violet-950/90 to-cyan-950/90 hover:from-violet-900 hover:to-cyan-900 border border-violet-500/60 hover:border-cyan-400 text-cyan-300 hover:text-white font-medium rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-violet-950/40 text-xs cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="font-bold">Panel Admin</span>
            </Link>
          )}

          {/* Indicador de Conexión a Base de Datos (SOLO VISIBLE SI ES ADMINISTRADOR) */}
          {esAdmin && (
            <div className="hidden lg:flex items-center" title="Estado de la base de datos (visible solo para administradores)">
              {isSupabaseConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/70 text-emerald-300 border border-emerald-800/70 text-[11px] font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Conectado
                </span>
              ) : (
                <span
                  title="Almacenamiento local seguro del dispositivo."
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 text-cyan-400 border border-zinc-800 text-[11px] font-mono cursor-default"
                >
                  <Database className="w-3 h-3 text-cyan-400" />
                  Almacenamiento Local
                </span>
              )}
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => abrirModalAuth('registro')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-gradient-to-r hover:from-violet-600 hover:to-cyan-600 hover:text-white border border-zinc-800 hover:border-violet-500/70 text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
        >
          <User className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ingresar</span>
        </button>
      )}
      {/* Botón de Ayuda, Soporte y Recomendaciones */}
      <button
        type="button"
        onClick={() => abrirModalSoporte('problema_local_membresia')}
        title="Problemas con tu local, cuenta o sugerencias"
        className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
      >
        <HelpCircle className="w-4 h-4 text-cyan-400" />
        <span className="hidden xl:inline">Ayuda / Sugerencias</span>
      </button>
    </div>
  );
}
