'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Search, MapPin, Loader2, Navigation, CheckCircle2, AlertCircle } from 'lucide-react';

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

interface MapaSelectorDireccionProps {
  latitud: number;
  longitud: number;
  direccionTexto: string;
  onUbicacionChange: (lat: number, lng: number, direccionSugerida?: string) => void;
  radioEntregaMetros?: number;
  mostrarRadio?: boolean;
}

// Icono personalizado para el pin arrastrable
function createDraggablePin() {
  const html = `
    <div class="relative flex items-center justify-center animate-bounce">
      <div style="background-color: #6366f1; box-shadow: 0 0 20px 4px rgba(99, 102, 241, 0.7);" class="w-11 h-11 rounded-full border-2 border-white flex items-center justify-center text-white transition-transform hover:scale-110">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div style="border-top-color: #6366f1;" class="absolute -bottom-2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[10px]"></div>
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
  radioEntregaMetros,
  mostrarRadio,
}: MapaSelectorDireccionProps) {
  const [busqueda, setBusqueda] = useState(direccionTexto || '');
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoNominatim[]>([]);
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null);

  const markerRef = useRef<L.Marker | null>(null);
  const pinIcon = useMemo(() => createDraggablePin(), []);

  // Buscar dirección con el geocodificador Nominatim (OpenStreetMap)
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

  // Geocodificación inversa cuando el comerciante arrastra el pin
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
          const barrio = address.neighbourhood || address.suburb || address.city || '';
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

  return (
    <div className="space-y-3">
      {/* Barra de Búsqueda Geográfica de Dirección */}
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
                Evaluar en Mapa
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

      {mensajeEstado && (
        <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center gap-2 text-xs text-zinc-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{mensajeEstado}</span>
        </div>
      )}

      {/* Contenedor del Mapa Interactivo con Pin Arrastrable */}
      <div className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-zinc-800 shadow-xl z-0">
        <MapContainer
          center={[latitud, longitud]}
          zoom={15}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          {/* Capa de mosaicos ESRI World Dark Gray sin marca de agua y de alta velocidad */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>, HERE, Garmin, OpenStreetMap'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />

          <CentrarMapa lat={latitud} lng={longitud} />

          <ClickMapaListener
            onMapClick={(clickLat, clickLng) => {
              reverseGeocode(clickLat, clickLng);
            }}
          />

          {mostrarRadio && radioEntregaMetros && radioEntregaMetros > 0 && (
            <Circle
              center={[latitud, longitud]}
              radius={radioEntregaMetros}
              pathOptions={{
                color: '#818cf8',
                fillColor: '#6366f1',
                fillOpacity: 0.18,
                weight: 2,
                dashArray: '6, 6',
              }}
            />
          )}

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
            💡 <strong>Tip:</strong> Puedes <strong>arrastrar el pin</strong> o hacer clic en el mapa para ubicar exactamente la puerta de tu local.
          </span>
          <span className="font-mono text-[11px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-lg border border-zinc-800">
            {latitud.toFixed(4)}, {longitud.toFixed(4)}
          </span>
        </div>
      </div>
    </div>
  );
}
