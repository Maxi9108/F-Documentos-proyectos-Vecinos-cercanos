'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polygon,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Bike,
  Compass,
  CheckCircle2,
  Trash2,
  Undo2,
  Maximize2,
  AlertCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface SelectorZonaEnvioProps {
  latitud: number;
  longitud: number;
  radioKm: number;
  poligono: [number, number][];
  onChange: (nuevoRadioKm: number, nuevoPoligono: [number, number][]) => void;
  confirmado: boolean;
  onToggleConfirmado: (nuevoEstado: boolean) => void;
}

// Icono para el local comercial
function createStoreIcon() {
  const html = `
    <div class="relative flex items-center justify-center">
      <div class="w-9 h-9 rounded-2xl bg-cyan-600 shadow-xl border-2 border-white flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
          <path d="M2 7h20"/>
        </svg>
      </div>
      <div class="absolute -bottom-1.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-cyan-600"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'store-center-pin',
    iconSize: [36, 42],
    iconAnchor: [18, 42],
  });
}

// Icono pequeño para los vértices del polígono
function createVertexIcon(index: number) {
  const html = `
    <div class="w-5 h-5 rounded-full bg-amber-500 border-2 border-white shadow-md flex items-center justify-center text-[9px] font-black text-white">
      ${index + 1}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'vertex-pin',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Capturador de clics para agregar vértices al polígono
function MapClickHandler({
  onAddPoint,
  active,
}: {
  onAddPoint: (lat: number, lng: number) => void;
  active: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onAddPoint(
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6))
      );
    },
  });
  return null;
}

// Auto-ajustador de vista del mapa
function AutoAjustarVista({
  center,
  radiusKm,
  polygonPoints,
  modo,
}: {
  center: [number, number];
  radiusKm: number;
  polygonPoints: [number, number][];
  modo: 'radio' | 'poligono';
}) {
  const map = useMap();

  useEffect(() => {
    if (modo === 'poligono' && polygonPoints.length >= 2) {
      const bounds = L.latLngBounds(polygonPoints);
      bounds.extend(center);
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
    } else if (modo === 'radio') {
      const circle = L.circle(center, { radius: Math.max(radiusKm, 0.5) * 1000 });
      map.fitBounds(circle.getBounds(), { padding: [30, 30], maxZoom: 16 });
    }
  }, [center, radiusKm, polygonPoints, modo, map]);

  return null;
}

export default function SelectorZonaEnvio({
  latitud,
  longitud,
  radioKm,
  poligono,
  onChange,
  confirmado,
  onToggleConfirmado,
}: SelectorZonaEnvioProps) {
  const [modo, setModo] = useState<'radio' | 'poligono'>(
    poligono && poligono.length >= 3 ? 'poligono' : 'radio'
  );

  const [inputKm, setInputKm] = useState<string>(radioKm ? radioKm.toString() : '3');
  const storeIcon = useMemo(() => createStoreIcon(), []);

  const validLat = typeof latitud === 'number' && !isNaN(latitud) ? latitud : -34.6037;
  const validLng = typeof longitud === 'number' && !isNaN(longitud) ? longitud : -58.4212;

  // Manejo de cambio de radio
  const handleRadioKmChange = (valStr: string) => {
    setInputKm(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed, poligono);
      if (confirmado) onToggleConfirmado(false); // Requiere volver a confirmar si cambió
    }
  };

  // Manejo de agregar punto al polígono
  const handleAddPoint = (lat: number, lng: number) => {
    const nuevoPoligono: [number, number][] = [...poligono, [lat, lng]];
    onChange(radioKm, nuevoPoligono);
    if (confirmado) onToggleConfirmado(false);
  };

  // Deshacer último punto
  const handleUndoPoint = () => {
    if (poligono.length === 0) return;
    const nuevoPoligono = poligono.slice(0, -1);
    onChange(radioKm, nuevoPoligono);
    if (confirmado) onToggleConfirmado(false);
  };

  // Limpiar polígono
  const handleClearPolygon = () => {
    onChange(radioKm, []);
    if (confirmado) onToggleConfirmado(false);
  };

  const handleConfirmar = () => {
    if (modo === 'poligono' && poligono.length < 3) {
      alert('Para confirmar el polígono debes marcar al menos 3 puntos en el mapa que delimiten las calles.');
      return;
    }
    const parsedKm = parseFloat(inputKm);
    if (modo === 'radio' && (isNaN(parsedKm) || parsedKm <= 0)) {
      alert('Por favor ingresa un alcance en kilómetros válido mayor a 0.');
      return;
    }
    onToggleConfirmado(true);
  };

  return (
    <div className="space-y-3 p-4 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl">
      {/* Cabecera y Selector de Modalidad */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Límites y Zona de Cobertura de Envíos
            </h4>
            <p className="text-[11px] text-zinc-400">
              Visualiza en el mapa el alcance y confirma este paso para habilitar los repartos.
            </p>
          </div>
        </div>

        {/* Pestañas de Modo */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-900 border border-zinc-800">
          <button
            type="button"
            onClick={() => setModo('radio')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modo === 'radio'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Radio en Kilómetros
          </button>
          <button
            type="button"
            onClick={() => setModo('poligono')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modo === 'poligono'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Dibujar Calles / Polígono
          </button>
        </div>
      </div>

      {/* Parámetros según modo */}
      {modo === 'radio' ? (
        <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 space-y-0.5">
            <span className="text-xs font-semibold text-zinc-200 block">
              Alcance en kilómetros (sin límite):
            </span>
            <span className="text-[11px] text-zinc-400">
              Puedes indicar 2 km, 5 km, 20 km o cualquier distancia según tu capacidad logística.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex items-center">
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={inputKm}
                onChange={(e) => handleRadioKmChange(e.target.value)}
                className="w-24 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs font-bold text-white text-right pr-9 focus:outline-none focus:border-cyan-500"
              />
              <span className="absolute right-3 text-xs font-bold text-zinc-400 pointer-events-none">
                km
              </span>
            </div>

            <div className="flex items-center gap-1">
              {[3, 5, 10, 15].map((sugerido) => (
                <button
                  key={sugerido}
                  type="button"
                  onClick={() => handleRadioKmChange(sugerido.toString())}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                    parseFloat(inputKm) === sugerido
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  {sugerido}k
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-0.5">
            <span className="font-semibold text-amber-300 flex items-center gap-1.5">
              <span>Modo Dibujo Activo:</span>
              <span className="text-zinc-300 font-bold">{poligono.length} puntos marcados</span>
            </span>
            <span className="text-[11px] text-zinc-400 block">
              Haz clic directamente en el mapa para marcar esquinas o avenidas límite de tu reparto.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleUndoPoint}
              disabled={poligono.length === 0}
              className="py-1.5 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Undo2 className="w-3.5 h-3.5" />
              Deshacer Punto
            </button>
            <button
              type="button"
              onClick={handleClearPolygon}
              disabled={poligono.length === 0}
              className="py-1.5 px-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-300 border border-zinc-800 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpiar
            </button>
          </div>
        </div>
      )}

      {/* Contenedor del Mapa Interactivo */}
      <div className="relative w-full h-[320px] rounded-2xl overflow-hidden border border-zinc-800 shadow-inner">
        <MapContainer
          center={[validLat, validLng]}
          zoom={14}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <AutoAjustarVista
            center={[validLat, validLng]}
            radiusKm={parseFloat(inputKm) || 3}
            polygonPoints={poligono}
            modo={modo}
          />

          <MapClickHandler onAddPoint={handleAddPoint} active={modo === 'poligono'} />

          {/* Marcador Central del Local */}
          <Marker position={[validLat, validLng]} icon={storeIcon} />

          {/* Modo Radio: Círculo de Cobertura */}
          {modo === 'radio' && (
            <Circle
              center={[validLat, validLng]}
              radius={(parseFloat(inputKm) || 3) * 1000}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#06b6d4',
                fillOpacity: 0.18,
                weight: 2,
                dashArray: '6, 6',
              }}
            />
          )}

          {/* Modo Polígono: Vértices y Polígono sombreado */}
          {modo === 'poligono' && (
            <>
              {poligono.map((pt, idx) => (
                <Marker key={`${pt[0]}-${pt[1]}-${idx}`} position={pt} icon={createVertexIcon(idx)} />
              ))}

              {poligono.length >= 3 && (
                <Polygon
                  positions={poligono}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.22,
                    weight: 2.5,
                  }}
                />
              )}
            </>
          )}
        </MapContainer>

        {/* Overlay informativo sobre el mapa */}
        <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-zinc-800 text-[11px] text-zinc-300 shadow-lg">
            {modo === 'radio' ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                Radio activo: <strong>{inputKm} km</strong> a la redonda
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {poligono.length < 3
                  ? `Haz clic en ${3 - poligono.length} puntos más para cerrar el polígono`
                  : `Polígono cerrado de ${poligono.length} límites de calles`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botón de Confirmación Obligatorio del Paso */}
      <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
        {confirmado ? (
          <div className="flex items-center gap-2 p-2.5 px-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs w-full sm:w-auto">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">
              ¡Zona de entrega confirmada! ({modo === 'radio' ? `${inputKm} km` : `${poligono.length} esquinas de límites`})
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-amber-400/90">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Debes confirmar la zona en el mapa para completar este paso.</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleConfirmar}
          className={`w-full sm:w-auto py-2.5 px-6 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
            confirmado
              ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-700'
              : 'bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-emerald-950/60 animate-pulse'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>{confirmado ? 'Volver a Confirmar Modificaciones' : 'Confirmar Este Paso en el Mapa'}</span>
        </button>
      </div>
    </div>
  );
}
