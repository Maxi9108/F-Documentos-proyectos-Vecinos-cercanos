'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2, Navigation, CheckCircle2, AlertCircle, Sun, Moon, Bike } from 'lucide-react';

interface ResultadoNominatim {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    state?: string;
  };
}

export interface MapaSelectorDireccionProps {
  latitud: number;
  longitud: number;
  direccionTexto: string;
  onUbicacionChange: (lat: number, lng: number, direccionSugerida?: string) => void;
  radioEntregaMetros?: number;
  mostrarRadio?: boolean;
  onRadioChange?: (radioMetros: number) => void;
  ocultarBuscador?: boolean;
}

// Icono personalizado para el pin arrastrable del comercio
function createDraggablePin() {
  const html = `
    <div class="relative flex items-center justify-center animate-bounce">
      <div style="background-color: #4f46e5; box-shadow: 0 0 20px 4px rgba(79, 70, 229, 0.7);" class="w-11 h-11 rounded-full border-2 border-white flex items-center justify-center text-white transition-transform hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div style="border-top-color: #4f46e5;" class="absolute -bottom-2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px]"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'draggable-map-pin',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
  });
}

// Subcomponente para mover la cámara suavemente al cambiar coordenadas
function CentrarMapa({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

// Manejador de clics directos sobre el mapa para colocar el pin
function ClickMapaListener({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapaSelectorDireccion({
  latitud,
  longitud,
  direccionTexto,
  onUbicacionChange,
  radioEntregaMetros = 3000,
  mostrarRadio = false,
  onRadioChange,
  ocultarBuscador = false,
}: MapaSelectorDireccionProps) {
  const [busqueda, setBusqueda] = useState(direccionTexto || '');
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoNominatim[]>([]);
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null);
  const [modoOscuro, setModoOscuro] = useState(true);

  useEffect(() => {
    if (direccionTexto !== undefined && direccionTexto !== busqueda) {
      setBusqueda(direccionTexto);
    }
  }, [direccionTexto]);

  const markerRef = useRef<L.Marker | null>(null);
  const pinIcon = useMemo(() => createDraggablePin(), []);

  // Buscar dirección con el geocodificador Nominatim (OpenStreetMap en español)
  const buscarDireccion = async (queryTexto: string) => {
    if (!queryTexto || queryTexto.trim().length < 3) return;

    setCargando(true);
    setMensajeEstado(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        queryTexto
      )}&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'es',
        },
      });

      if (!response.ok) throw new Error('Error en el servicio de geocodificación');

      const data: ResultadoNominatim[] = await response.json();
      setResultados(data);

      if (data.length === 0) {
        setMensajeEstado('No se encontraron coordenadas para esta dirección. Prueba ajustando el nombre de calle y localidad.');
      }
    } catch (err) {
      console.warn('[Geocoding] Falló la búsqueda:', err);
      setMensajeEstado('Error al consultar el servicio de direcciones. Puedes colocar el pin manualmente en el mapa.');
    } finally {
      setCargando(false);
    }
  };

  // Geocodificación inversa cuando el comerciante arrastra el pin (forzada en español)
  const reverseGeocode = async (lat: number, lon: number) => {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`;
      const response = await fetch(url, {
        headers: { 'Accept-Language': 'es' },
      });
      if (response.ok) {
        const data = await response.json();
        const address = data.address;
        if (address) {
          const calle = address.road || '';
          const numero = address.house_number ? ` ${address.house_number}` : '';
          const barrio = address.neighbourhood || address.suburb || address.city || address.town || '';
          const dirLimpia = [calle + numero, barrio].filter(Boolean).join(', ');

          if (dirLimpia) {
            setBusqueda(dirLimpia);
            onUbicacionChange(lat, lon, dirLimpia);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('[ReverseGeocoding] Error:', e);
    }
    onUbicacionChange(lat, lon);
  };

  // Manejar selección de una dirección encontrada
  const seleccionarResultado = (item: ResultadoNominatim) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    setResultados([]);
    setBusqueda(item.display_name);
    onUbicacionChange(lat, lon, item.display_name);
    setMensajeEstado(`Ubicación fijada con éxito en ${item.display_name.slice(0, 45)}...`);
  };

  // Evento al terminar de arrastrar el pin
  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker != null) {
      const pos = marker.getLatLng();
      reverseGeocode(pos.lat, pos.lng);
    }
  }, []);

  const radioKmActual = Math.max(0.5, (radioEntregaMetros || 3000) / 1000);

  return (
    <div className="space-y-3">
      {/* Barra de Búsqueda Geográfica de Dirección (si no se oculta externamente) */}
      {!ocultarBuscador && (
        <div className="relative">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarDireccion(busqueda);
                  }
                }}
                placeholder="Escribe la dirección de tu local (ej. Av. Corrientes 1500, Balvanera)..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
              />
            </div>

            <button
              type="button"
              onClick={() => buscarDireccion(busqueda)}
              disabled={cargando}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-indigo-950/50 flex items-center gap-2 shrink-0 cursor-pointer"
            >
              {cargando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  Ubicar en el Mapa
                </>
              )}
            </button>
          </div>

          {/* Desplegable de Resultados Encontrados */}
          {resultados.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden divide-y divide-zinc-800">
              <div className="px-3 py-1.5 bg-zinc-950 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Sugerencias encontradas en el mapa
              </div>
              {resultados.map((item) => (
                <button
                  key={item.place_id}
                  type="button"
                  onClick={() => seleccionarResultado(item)}
                  className="w-full text-left p-3 hover:bg-zinc-800 transition-colors flex items-start gap-2.5 text-xs text-zinc-200 cursor-pointer"
                >
                  <MapPin className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {mensajeEstado && (
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2 text-xs text-zinc-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensajeEstado}</span>
        </div>
      )}

      {/* Selector interactivo de radio de entrega integrado */}
      {mostrarRadio && onRadioChange && (
        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-cyan-500/30 space-y-2.5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-cyan-400" />
              Radio de Entrega a Domicilio: <span className="text-cyan-400 font-mono">{radioKmActual.toFixed(1)} km</span>
              <span className="text-zinc-500 font-normal">({Math.round(radioKmActual * 1000)} metros)</span>
            </span>

            <div className="flex flex-wrap items-center gap-1">
              {[1, 2, 3, 5, 8, 10, 15].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => onRadioChange(km * 1000)}
                  className={`px-2 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    Math.round(radioKmActual) === km
                      ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700'
                  }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0.5"
              max="25"
              step="0.5"
              value={radioKmActual}
              onChange={(e) => onRadioChange(Math.round(parseFloat(e.target.value) * 1000))}
              className="flex-1 accent-cyan-500 cursor-pointer"
            />
            <div className="flex items-center gap-1 shrink-0">
              <input
                type="number"
                min="0.5"
                max="50"
                step="0.5"
                value={radioKmActual}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    onRadioChange(Math.round(val * 1000));
                  }
                }}
                className="w-16 px-2 py-1 bg-zinc-950 border border-zinc-700 rounded-lg text-xs text-white text-center font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-xs text-zinc-400">km</span>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor del Mapa Interactivo con Pin Arrastrable */}
      <div className="relative w-full h-[380px] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl z-0">
        {/* Selector de Tema de Mapa (Modo Oscuro / Calles Claras) */}
        <div className="absolute top-2.5 right-2.5 z-[500] flex items-center gap-1 pointer-events-auto">
          <button
            type="button"
            onClick={() => setModoOscuro(!modoOscuro)}
            title={modoOscuro ? 'Cambiar a Calles Claras (Español)' : 'Cambiar a Modo Oscuro (Español)'}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-950/90 hover:bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold shadow-lg backdrop-blur-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {modoOscuro ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px]">Calles Claras</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[11px]">Modo Oscuro</span>
              </>
            )}
          </button>
        </div>

        <MapContainer
          center={[latitud, longitud]}
          zoom={15}
          zoomControl={false}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          {/* Controles de Zoom en Español */}
          <ZoomControl zoomInTitle="Acercar mapa" zoomOutTitle="Alejar mapa" position="topleft" />

          {/* Cartografía OpenStreetMap en Español con soporte para vista nocturna o clara */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">Colaboradores de OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            subdomains={['a', 'b', 'c']}
            className={modoOscuro ? 'filter invert-[0.92] hue-rotate-180 brightness-95 contrast-125 saturate-[0.8]' : undefined}
          />

          <CentrarMapa lat={latitud} lng={longitud} />

          <ClickMapaListener
            onMapClick={(clickLat, clickLng) => {
              reverseGeocode(clickLat, clickLng);
            }}
          />

          {/* Círculo que marca el radio de cobertura/envíos en el mismo mapa */}
          {mostrarRadio && radioEntregaMetros && radioEntregaMetros > 0 && (
            <Circle
              center={[latitud, longitud]}
              radius={radioEntregaMetros}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#0891b2',
                fillOpacity: 0.18,
                weight: 2,
                dashArray: '6, 6',
              }}
            />
          )}

          {/* Pin interactivo y arrastrable de ubicación del local */}
          <Marker
            ref={markerRef}
            position={[latitud, longitud]}
            draggable={true}
            icon={pinIcon}
            eventHandlers={{
              dragend: handleDragEnd,
            }}
          />
        </MapContainer>

        {/* Guía superpuesta inferior */}
        <div className="absolute bottom-3 left-3 right-3 z-[400] bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300 pointer-events-auto shadow-lg">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            💡 <strong>Tip:</strong> Puedes <strong>arrastrar el pin</strong> o hacer clic en el mapa para ubicar la entrada exacta de tu local.
            {mostrarRadio && radioEntregaMetros && radioEntregaMetros > 0 && (
              <span className="text-cyan-400 font-semibold ml-1">
                • Círculo celeste: radio de {radioKmActual.toFixed(1)} km.
              </span>
            )}
          </span>
          <span className="font-mono text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
            {latitud.toFixed(4)}, {longitud.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
