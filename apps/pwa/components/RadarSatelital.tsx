'use client';

import React, { useState, useMemo } from 'react';
import { Comercio } from '@/types/comercio';
import { UbicacionReferencia } from '@/context/user-context';
import { calcularDistanciaKm, calcularRumboGrados, formatearDistancia, estimarTiempo } from '@/lib/geolocation';
import { getRubroPinConfig } from './MapaComercios';
import {
  Navigation,
  MapPin,
  Compass,
  ShoppingBag,
  MessageSquare,
  Map,
  Crown,
  Award,
  Sparkles,
  Zap,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface RadarSatelitalProps {
  comercios: Comercio[];
  ubicacionReferencia: UbicacionReferencia | null;
  comercioSeleccionado: Comercio | null;
  onSelectComercio: (comercio: Comercio) => void;
  onOpenDetalle?: (comercio: Comercio) => void;
  onVolverAlMapa: () => void;
}

export default function RadarSatelital({
  comercios,
  ubicacionReferencia,
  comercioSeleccionado,
  onSelectComercio,
  onOpenDetalle,
  onVolverAlMapa,
}: RadarSatelitalProps) {
  const [radioMaxKm, setRadioMaxKm] = useState<number>(3); // 1, 3 o 5 km de alcance
  const [comercioActivo, setComercioActivo] = useState<Comercio | null>(
    comercioSeleccionado || comercios[0] || null
  );

  // Coordenadas del centro del radar (GPS del usuario o ubicación predeterminada)
  const centroLat = ubicacionReferencia?.latitud ?? -34.4828;
  const centroLng = ubicacionReferencia?.longitud ?? -58.7425;

  // Calcular distancias y posiciones polares (ángulo y distancia en píxeles) para cada comercio
  const blipsComercios = useMemo(() => {
    return comercios
      .map((c) => {
        const distanciaKm = calcularDistanciaKm(centroLat, centroLng, c.latitud, c.longitud);
        const rumbo = calcularRumboGrados(centroLat, centroLng, c.latitud, c.longitud);

        // Convertir rumbo a coordenadas polares en el radar (radio normalizado de 0 a 100%)
        // 0 grados = Norte (arriba), 90 = Este (derecha), 180 = Sur (abajo), 270 = Oeste (izquierda)
        const rad = ((rumbo - 90) * Math.PI) / 180;
        const normalizedDist = Math.min(distanciaKm / radioMaxKm, 1);
        const percentRadius = normalizedDist * 44; // Max 44% del radio para no salirse del círculo (50%)

        const xPercent = 50 + percentRadius * Math.cos(rad);
        const yPercent = 50 + percentRadius * Math.sin(rad);

        return {
          comercio: c,
          distanciaKm,
          distanciaFormateada: formatearDistancia(distanciaKm),
          rumbo,
          xPercent,
          yPercent,
          estaEnRango: distanciaKm <= radioMaxKm,
        };
      })
      .sort((a, b) => a.distanciaKm - b.distanciaKm);
  }, [comercios, centroLat, centroLng, radioMaxKm]);

  // Si cambia la selección externa
  React.useEffect(() => {
    if (comercioSeleccionado) {
      setComercioActivo(comercioSeleccionado);
    }
  }, [comercioSeleccionado]);

  const comercioDestacado = comercioActivo || blipsComercios[0]?.comercio || null;
  const distanciaDestacada = comercioDestacado
    ? formatearDistancia(calcularDistanciaKm(centroLat, centroLng, comercioDestacado.latitud, comercioDestacado.longitud))
    : '';
  const tiempoEstimado = comercioDestacado
    ? estimarTiempo(calcularDistanciaKm(centroLat, centroLng, comercioDestacado.latitud, comercioDestacado.longitud))
    : null;

  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between overflow-hidden relative shadow-2xl">
      {/* Barra Superior de Control del Radar */}
      <div className="p-3 bg-zinc-900/90 border-b border-zinc-800 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Zap className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white tracking-wide">Radar Satelital NeoFaro</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
                0% Datos
              </span>
            </div>
            <p className="text-[10px] text-zinc-400">
              {ubicacionReferencia?.esGps ? 'Centrado en tu señal satelital GPS' : 'Centrado en tu ubicación de referencia'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Selector de Rango */}
          <div className="flex items-center bg-zinc-800/80 p-0.5 rounded-xl border border-zinc-700/60 text-[11px] font-semibold">
            {[1, 3, 5].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setRadioMaxKm(km)}
                className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                  radioMaxKm === km ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {km}km
              </button>
            ))}
          </div>

          {/* Botón para volver al mapa satelital interactivo */}
          <button
            type="button"
            onClick={onVolverAlMapa}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-violet-950/70 hover:bg-violet-900 border border-violet-500/50 text-violet-200 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Map className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Ver Mapa</span>
          </button>
        </div>
      </div>

      {/* Pantalla Circular del Radar */}
      <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden select-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900/60 via-zinc-950 to-black">
        {/* Contenedor circular con aspecto 1:1 */}
        <div className="relative w-[280px] sm:w-[320px] md:w-[360px] h-[280px] sm:h-[320px] md:h-[360px] rounded-full border-2 border-cyan-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.15)]">
          {/* Anillos concéntricos de distancia */}
          <div className="absolute inset-[15%] rounded-full border border-cyan-500/20 border-dashed" />
          <div className="absolute inset-[33%] rounded-full border border-cyan-500/25" />
          <div className="absolute inset-[50%] rounded-full border border-cyan-500/20 border-dashed" />
          <div className="absolute inset-[70%] rounded-full border border-cyan-500/20" />

          {/* Ejes Norte-Sur / Este-Oeste */}
          <div className="absolute w-full h-[1px] bg-cyan-500/20" />
          <div className="absolute h-full w-[1px] bg-cyan-500/20" />

          {/* Letras de orientación */}
          <span className="absolute top-1 text-[10px] font-bold text-cyan-400/80">N</span>
          <span className="absolute bottom-1 text-[10px] font-bold text-cyan-400/80">S</span>
          <span className="absolute right-1.5 text-[10px] font-bold text-cyan-400/80">E</span>
          <span className="absolute left-1.5 text-[10px] font-bold text-cyan-400/80">O</span>

          {/* Etiquetas de escala en distancia */}
          <span className="absolute top-[28%] right-[52%] text-[9px] font-semibold text-zinc-500">
            {(radioMaxKm * 0.33).toFixed(1)}km
          </span>
          <span className="absolute top-[16%] right-[52%] text-[9px] font-semibold text-zinc-500">
            {(radioMaxKm * 0.66).toFixed(1)}km
          </span>
          <span className="absolute top-[3%] right-[52%] text-[9px] font-semibold text-zinc-500">
            {radioMaxKm}km
          </span>

          {/* Haz giratorio animado del radar */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none origin-center"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(6, 182, 212, 0.25) 360deg)',
              animation: 'spin 4s linear infinite',
            }}
          />

          {/* Centro del radar: Posición del Usuario */}
          <div className="relative z-20 flex flex-col items-center">
            <span className="absolute -inset-2 rounded-full bg-cyan-400/30 animate-ping" />
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-500 border border-white flex items-center justify-center text-white shadow-lg shadow-cyan-500/50">
              <Navigation className="w-3 h-3 text-white fill-white" />
            </div>
          </div>

          {/* Puntos / Blips de Comercios alrededor del centro */}
          {blipsComercios.map(({ comercio, distanciaFormateada, xPercent, yPercent, estaEnRango }) => {
            if (!estaEnRango) return null;
            const esSeleccionado = comercioDestacado?.id === comercio.id;
            const config = getRubroPinConfig(comercio.rubro, comercio.tipo_atencion);
            const esGold = comercio.nivel === 'gold';

            return (
              <button
                key={comercio.id}
                type="button"
                onClick={() => {
                  setComercioActivo(comercio);
                  onSelectComercio(comercio);
                }}
                style={{
                  top: `${yPercent}%`,
                  left: `${xPercent}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={`${comercio.nombre} (${distanciaFormateada})`}
                className={`absolute z-30 transition-all duration-300 cursor-pointer ${
                  esSeleccionado ? 'scale-125 z-40' : 'hover:scale-115'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  {esSeleccionado && (
                    <span className="absolute -inset-2 rounded-full bg-cyan-400/50 animate-ping" />
                  )}
                  <div
                    style={{
                      backgroundColor: config.color,
                      boxShadow: esSeleccionado
                        ? '0 0 16px 3px rgba(6, 182, 212, 0.9)'
                        : `0 0 8px 1px ${config.glowRgba}`,
                    }}
                    className={`w-6 h-6 rounded-full border-2 ${
                      esSeleccionado ? 'border-white ring-2 ring-cyan-400' : 'border-zinc-950'
                    } flex items-center justify-center text-[10px] text-white font-bold`}
                  >
                    {esGold ? '👑' : config.badgeEmoji}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ficha Inferior de Contacto Rápido del Comercio Seleccionado */}
      {comercioDestacado && (
        <div className="p-3.5 bg-zinc-900/95 border-t border-zinc-800 z-10 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-violet-950/70 border border-violet-800/40 text-violet-300 text-[10px] font-bold">
                  {comercioDestacado.rubro}
                </span>
                {comercioDestacado.nivel === 'gold' && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> Gold
                  </span>
                )}
                <span className="text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                  {distanciaDestacada} {tiempoEstimado?.aPie ? `(${tiempoEstimado.aPie})` : ''}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white truncate mt-1">{comercioDestacado.nombre}</h4>
              <p className="text-[11px] text-zinc-400 truncate">{comercioDestacado.direccion}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {comercioDestacado.whatsapp && (
                <a
                  href={`https://wa.me/${comercioDestacado.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors flex items-center justify-center shadow-md shadow-emerald-950/50"
                  title="WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                </a>
              )}
              {onOpenDetalle && (
                <button
                  type="button"
                  onClick={() => onOpenDetalle(comercioDestacado)}
                  className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Ver Ficha</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
