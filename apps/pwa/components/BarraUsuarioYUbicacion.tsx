'use client';

import React from 'react';
import { useUser } from '@/context/user-context';
import {
  Navigation,
  MapPin,
  Heart,
  User,
  LogOut,
  ChevronDown,
  Sparkles,
  Compass,
} from 'lucide-react';

export default function BarraUsuarioYUbicacion() {
  const {
    usuario,
    estaAutenticado,
    abrirModalAuth,
    favoritosIds,
    ubicacionReferencia,
    gpsActivo,
    cargandoGps,
    activarGps,
    desactivarGps,
    abrirModalUbicaciones,
    ubicaciones,
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
        <button
          type="button"
          onClick={() => abrirModalAuth('login')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
        >
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 text-white flex items-center justify-center text-[10px] font-bold">
            {usuario.nombre ? usuario.nombre[0].toUpperCase() : 'U'}
          </div>
          <span className="max-w-[100px] truncate hidden md:inline">
            {usuario.nombre || usuario.email.split('@')[0]}
          </span>
          {favoritosIds.length > 0 && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
              <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
              {favoritosIds.length}
            </span>
          )}
        </button>
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
    </div>
  );
}
