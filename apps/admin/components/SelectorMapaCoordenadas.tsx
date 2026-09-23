'use client';

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

interface SelectorMapaProps {
  latitud: number;
  longitud: number;
  onChange: (lat: number, lng: number) => void;
}

// Generador de pin interactivo para selección
function createPinIcon() {
  const html = `
    <div class="relative flex items-center justify-center animate-bounce">
      <div class="w-8 h-8 rounded-full bg-indigo-600 shadow-xl border-2 border-white flex items-center justify-center text-white">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div class="absolute -bottom-1.5 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-indigo-600"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-map-pin',
    iconSize: [32, 38],
    iconAnchor: [16, 38],
  });
}

// Componente para capturar clics en el mapa
function LocationClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(
        Number(e.latlng.lat.toFixed(6)),
        Number(e.latlng.lng.toFixed(6))
      );
    },
  });
  return null;
}

export default function SelectorMapaCoordenadas({
  latitud,
  longitud,
  onChange,
}: SelectorMapaProps) {
  const pinIcon = useMemo(() => createPinIcon(), []);

  // Coordenadas válidas o fallback al centro de referencia
  const validLat = typeof latitud === 'number' && !isNaN(latitud) && latitud !== 0 ? latitud : -34.6037;
  const validLng = typeof longitud === 'number' && !isNaN(longitud) && longitud !== 0 ? longitud : -58.4212;

  const handleMarkerDragEnd = (event: L.DragEndEvent) => {
    const marker = event.target;
    const position = marker.getLatLng();
    onChange(
      Number(position.lat.toFixed(6)),
      Number(position.lng.toFixed(6))
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span className="flex items-center gap-1.5 font-medium text-zinc-700 dark:text-zinc-300">
          <MapPin className="w-3.5 h-3.5 text-indigo-500" />
          Ubicación en el mapa
        </span>
        <span className="text-[11px] text-indigo-600 dark:text-indigo-400">
          Clic en el mapa o arrastra el marcador
        </span>
      </div>

      <div className="relative w-full h-[220px] rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-inner">
        <MapContainer
          center={[validLat, validLng]}
          zoom={15}
          scrollWheelZoom={false}
          className="w-full h-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <LocationClickHandler onLocationSelect={onChange} />

          <Marker
            position={[validLat, validLng]}
            icon={pinIcon}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDragEnd,
            }}
          />
        </MapContainer>
      </div>
    </div>
  );
}
