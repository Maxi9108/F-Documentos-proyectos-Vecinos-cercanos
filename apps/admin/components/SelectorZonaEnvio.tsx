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
  CheckCircle2,
  Trash2,
  Undo2,
  AlertCircle,
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

function createStoreIcon() {
  const html = `
    <div class="relative flex items-center justify-center">
      <div class="w-8 h-8 rounded-xl bg-indigo-600 shadow-xl border-2 border-white flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
          <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
          <path d="M2 7h20"/>
        </svg>
      </div>
      <div class="absolute -bottom-1 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-indigo-600"></div>
    </div>
  `;
  return L.divIcon({
    html,
    className: 'admin-store-center-pin',
    iconSize: [32, 38],
    iconAnchor: [16, 38],
  });
}

function createVertexIcon(index: number) {
  const html = `
    <div class="w-4 h-4 rounded-full bg-amber-500 border border-white shadow-md flex items-center justify-center text-[8px] font-black text-white">
      ${index + 1}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'admin-vertex-pin',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

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
  const prevPointsLength = useRef(polygonPoints.length);
  const prevRadius = useRef(radiusKm);
  const prevModo = useRef(modo);
  const prevCenterLat = useRef(center[0]);
  const prevCenterLng = useRef(center[1]);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch {}
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    const centerChanged = prevCenterLat.current !== center[0] || prevCenterLng.current !== center[1];
    const modoChanged = prevModo.current !== modo;
    const radiusChanged = prevRadius.current !== radiusKm;
    const pointsChanged = polygonPoints.length !== prevPointsLength.current;

    prevCenterLat.current = center[0];
    prevCenterLng.current = center[1];
    prevModo.current = modo;
    prevRadius.current = radiusKm;
    prevPointsLength.current = polygonPoints.length;

    try {
      const size = map.getSize();
      if (!size || size.x === 0 || size.y === 0) return;

      if (modo === 'poligono' && polygonPoints && polygonPoints.length >= 2) {
        if (pointsChanged || modoChanged || centerChanged) {
          const bounds = L.latLngBounds(polygonPoints);
          bounds.extend(L.latLng(center[0], center[1]));
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
          }
        }
      } else if (modo === 'radio') {
        if (radiusChanged || modoChanged || centerChanged) {
          const rKm = Math.max(radiusKm, 0.5);
          const deltaLat = rKm / 111.32;
          const cosLat = Math.cos((center[0] * Math.PI) / 180);
          const deltaLng = rKm / (111.32 * (Math.abs(cosLat) > 0.0001 ? Math.abs(cosLat) : 1));

          const southWest = L.latLng(center[0] - deltaLat, center[1] - deltaLng);
          const northEast = L.latLng(center[0] + deltaLat, center[1] + deltaLng);
          const bounds = L.latLngBounds(southWest, northEast);

          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 16 });
          }
        }
      }
    } catch (err) {
      console.warn('[Admin SelectorZonaEnvio] Error al autoajustar vista:', err);
    }
  }, [center[0], center[1], radiusKm, polygonPoints.length, modo, map]);

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
  const safePoligono: [number, number][] = Array.isArray(poligono) ? poligono : [];

  const [modo, setModo] = useState<'radio' | 'poligono'>(
    safePoligono.length >= 3 ? 'poligono' : 'radio'
  );

  const [inputKm, setInputKm] = useState<string>(radioKm ? radioKm.toString() : '3');
  const storeIcon = useMemo(() => createStoreIcon(), []);

  const validLat = typeof latitud === 'number' && !isNaN(latitud) ? latitud : -34.6037;
  const validLng = typeof longitud === 'number' && !isNaN(longitud) ? longitud : -58.4212;

  const handleRadioKmChange = (valStr: string) => {
    setInputKm(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed, poligono);
      if (confirmado) onToggleConfirmado(false);
    }
  };

  const handleAddPoint = (lat: number, lng: number) => {
    const nuevoPoligono: [number, number][] = [...poligono, [lat, lng]];
    onChange(radioKm, nuevoPoligono);
    if (confirmado) onToggleConfirmado(false);
  };

  const handleUndoPoint = () => {
    if (poligono.length === 0) return;
    const nuevoPoligono = poligono.slice(0, -1);
    onChange(radioKm, nuevoPoligono);
    if (confirmado) onToggleConfirmado(false);
  };

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
    <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-md">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <Bike className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Zona de Cobertura de Envíos
          </span>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
          <button
            type="button"
            onClick={() => setModo('radio')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              modo === 'radio'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Radio en Km (Sin Límite)
          </button>
          <button
            type="button"
            onClick={() => setModo('poligono')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              modo === 'poligono'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Marcar Calles / Polígono
          </button>
        </div>
      </div>

      {modo === 'radio' ? (
        <div className="flex items-center justify-between gap-2 text-xs bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800">
          <span className="text-zinc-400">Alcance de entrega en km:</span>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0.1"
              step="0.5"
              value={inputKm}
              onChange={(e) => handleRadioKmChange(e.target.value)}
              className="w-20 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs font-bold text-white text-right"
            />
            <span className="text-zinc-400 font-bold">km</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2 text-xs bg-zinc-900/60 p-2 rounded-xl border border-zinc-800">
          <span className="text-amber-300 font-medium">
            Clic en el mapa para marcar esquinas ({poligono.length} puntos)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndoPoint}
              disabled={poligono.length === 0}
              className="py-1 px-2 rounded-lg bg-zinc-800 text-zinc-300 text-[11px] disabled:opacity-40"
            >
              <Undo2 className="w-3 h-3 inline mr-1" /> Deshacer
            </button>
            <button
              type="button"
              onClick={handleClearPolygon}
              disabled={poligono.length === 0}
              className="py-1 px-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-rose-400 text-[11px] disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3 inline mr-1" /> Limpiar
            </button>
          </div>
        </div>
      )}

      <div className="relative w-full h-[220px] rounded-xl overflow-hidden border border-zinc-800 shadow-inner">
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
            polygonPoints={safePoligono}
            modo={modo}
          />

          <MapClickHandler onAddPoint={handleAddPoint} active={modo === 'poligono'} />
          <Marker position={[validLat, validLng]} icon={storeIcon} />

          {modo === 'radio' && (
            <Circle
              center={[validLat, validLng]}
              radius={(parseFloat(inputKm) || 3) * 1000}
              pathOptions={{
                color: '#6366f1',
                fillColor: '#6366f1',
                fillOpacity: 0.18,
                weight: 2,
                dashArray: '5, 5',
              }}
            />
          )}

          {modo === 'poligono' && (
            <>
              {safePoligono.map((pt, idx) => (
                <Marker key={`${pt[0]}-${pt[1]}-${idx}`} position={pt} icon={createVertexIcon(idx)} />
              ))}
              {safePoligono.length >= 3 && (
                <Polygon
                  positions={safePoligono}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.22,
                    weight: 2,
                  }}
                />
              )}
            </>
          )}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        {confirmado ? (
          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Zona confirmada ({modo === 'radio' ? `${inputKm} km` : `${poligono.length} puntos`})
          </span>
        ) : (
          <span className="text-xs text-amber-400 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Falta confirmar en el mapa
          </span>
        )}

        <button
          type="button"
          onClick={handleConfirmar}
          className={`py-1.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            confirmado
              ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
          }`}
        >
          {confirmado ? 'Reconfirmar' : 'Confirmar Este Paso'}
        </button>
      </div>
    </div>
  );
}
