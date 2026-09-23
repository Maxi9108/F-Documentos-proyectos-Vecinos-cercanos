'use client';

import React from 'react';
import { Search, X, Pill, Heart, Navigation, Compass } from 'lucide-react';

interface FiltrosYBusquedaProps {
  busqueda: string;
  onBusquedaChange: (valor: string) => void;
  rubrosDisponibles: { rubro: string; cantidad: number }[];
  rubroSeleccionado: string;
  onRubroChange: (rubro: string) => void;
  soloAbiertos: boolean;
  onSoloAbiertosChange: (soloAbiertos: boolean) => void;
  soloTurno: boolean;
  onSoloTurnoChange: (soloTurno: boolean) => void;
  soloFavoritos: boolean;
  onSoloFavoritosChange: (soloFavoritos: boolean) => void;
  totalFavoritos: number;
  cercaDeMi: boolean;
  onCercaDeMiChange: (cerca: boolean) => void;
  radioKm: number | null;
  onRadioKmChange: (radio: number | null) => void;
  totalResultados: number;
}

export default function FiltrosYBusqueda({
  busqueda,
  onBusquedaChange,
  rubrosDisponibles,
  rubroSeleccionado,
  onRubroChange,
  soloAbiertos,
  onSoloAbiertosChange,
  soloTurno,
  onSoloTurnoChange,
  soloFavoritos,
  onSoloFavoritosChange,
  totalFavoritos,
  cercaDeMi,
  onCercaDeMiChange,
  radioKm,
  onRadioKmChange,
  totalResultados,
}: FiltrosYBusquedaProps) {
  return (
    <div className="space-y-3">
      {/* Barra de Búsqueda y Toggles Principales */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
        {/* Input con icono */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => onBusquedaChange(e.target.value)}
            placeholder="Buscar por nombre, rubro, productos o calle..."
            className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all text-zinc-100 shadow-inner"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => onBusquedaChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-200 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Toggles de Filtro Rápido */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Toggle Cerca de Mí (GPS Satelital) */}
          <button
            type="button"
            onClick={() => onCercaDeMiChange(!cercaDeMi)}
            title="Activar rastreo satelital para ver comercios más cercanos a ti"
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
              cercaDeMi
                ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-300 shadow-sm shadow-cyan-950/50'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-cyan-800 hover:text-cyan-300'
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${cercaDeMi ? 'text-cyan-400 animate-pulse' : 'text-zinc-500'}`} />
            <span>Cerca de Mí</span>
          </button>

          {/* Toggle Mis Favoritos */}
          <button
            type="button"
            onClick={() => onSoloFavoritosChange(!soloFavoritos)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
              soloFavoritos
                ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 shadow-sm shadow-rose-950/50'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-rose-800 hover:text-rose-300'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${soloFavoritos ? 'fill-rose-500 text-rose-500' : 'text-zinc-500'}`} />
            <span>Favoritos</span>
            {totalFavoritos > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  soloFavoritos ? 'bg-rose-500/30 text-rose-200' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {totalFavoritos}
              </span>
            )}
          </button>

          {/* Toggle Solo Abiertos */}
          <button
            type="button"
            onClick={() => onSoloAbiertosChange(!soloAbiertos)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
              soloAbiertos
                ? 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300 shadow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                soloAbiertos ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            Abiertos
          </button>

          {/* Toggle Farmacias de Turno */}
          <button
            type="button"
            onClick={() => onSoloTurnoChange(!soloTurno)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none ${
              soloTurno
                ? 'bg-emerald-950/80 border-emerald-500/70 text-emerald-300 shadow-sm shadow-emerald-950/50'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Pill className={`w-3.5 h-3.5 ${soloTurno ? 'text-emerald-400 animate-pulse' : 'text-zinc-500'}`} />
            24hs
          </button>
        </div>
      </div>

      {/* Barra de Radio Satelital (visible cuando Cerca de Mí está activo) */}
      {cercaDeMi && (
        <div className="p-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Radio de distancia satelital:</span>
          </span>
          <div className="flex items-center gap-1.5">
            {[
              { label: 'Cualquier distancia', valor: null },
              { label: '< 1 km', valor: 1 },
              { label: '< 3 km', valor: 3 },
              { label: '< 5 km', valor: 5 },
            ].map((opcion) => {
              const seleccionado = radioKm === opcion.valor;
              return (
                <button
                  key={opcion.label}
                  type="button"
                  onClick={() => onRadioKmChange(opcion.valor)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    seleccionado
                      ? 'bg-cyan-600 text-white font-bold shadow-sm'
                      : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                  }`}
                >
                  {opcion.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selector Horizontal de Rubros */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        {rubrosDisponibles.map(({ rubro, cantidad }) => {
          const isSelected = rubroSeleccionado === rubro;
          return (
            <button
              key={rubro}
              type="button"
              onClick={() => onRubroChange(rubro)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60 ring-2 ring-cyan-500/40 font-semibold'
                  : 'bg-zinc-900/90 border border-zinc-800 text-zinc-300 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <span>{rubro}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {cantidad}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
