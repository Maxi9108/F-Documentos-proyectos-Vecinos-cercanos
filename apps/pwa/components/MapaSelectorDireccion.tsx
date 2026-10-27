'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polygon,
  Polyline,
  useMap,
  useMapEvents,
  ZoomControl,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Search,
  MapPin,
  Loader2,
  Navigation,
  CheckCircle2,
  AlertCircle,
  Sun,
  Moon,
  Bike,
  Hexagon,
  Undo2,
  Trash2,
  Check,
  Unlock,
} from 'lucide-react';

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
  poligono?: [number, number][];
  onPoligonoChange?: (poligono: [number, number][]) => void;
  modoZona?: 'radio' | 'poligono';
  onModoZonaChange?: (modo: 'radio' | 'poligono') => void;
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

// Icono para los vértices del polígono
function createVertexIcon(index: number) {
  const html = `
    <div class="w-6 h-6 rounded-full bg-amber-500 border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black text-white cursor-pointer select-none transition-transform hover:scale-125" title="Vértice ${index + 1} (arrastra para ajustar posición)">
      ${index + 1}
    </div>
  `;
  return L.divIcon({
    html,
    className: 'vertex-pin',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

// Subcomponente para mover la cámara suavemente al cambiar coordenadas
function CentrarMapa({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 15, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

// Manejador de clics directos sobre el mapa (ubica local o agrega puntos según el modo)
function ClickMapaListener({
  onMapClick,
  modoPoligonoActivo,
  onAddPoint,
}: {
  onMapClick: (lat: number, lng: number) => void;
  modoPoligonoActivo: boolean;
  onAddPoint: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (modoPoligonoActivo) {
        onAddPoint(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
      } else {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
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
  poligono = [],
  onPoligonoChange,
  modoZona,
  onModoZonaChange,
}: MapaSelectorDireccionProps) {
  const [busqueda, setBusqueda] = useState(direccionTexto || '');
  const [cargando, setCargando] = useState(false);
  const [resultados, setResultados] = useState<ResultadoNominatim[]>([]);
  const [mensajeEstado, setMensajeEstado] = useState<string | null>(null);
  const [modoOscuro, setModoOscuro] = useState(true);

  // Modo de cobertura de zona: 'radio' (circular) o 'poligono' (puntos)
  const [modoZonaInterno, setModoZonaInterno] = useState<'radio' | 'poligono'>(
    modoZona || (poligono && poligono.length >= 3 ? 'poligono' : 'radio')
  );

  useEffect(() => {
    if (modoZona && modoZona !== modoZonaInterno) {
      setModoZonaInterno(modoZona);
    }
  }, [modoZona]);

  // Bandera para evitar que useEffect cierre la zona automáticamente mientras el usuario dibuja
  const interactuandoRef = useRef(false);

  // Puntos del polígono y estado de cierre (la zona solo se cierra cuando el usuario pulsa 'Cerrar Polígono')
  const [puntosPoligono, setPuntosPoligono] = useState<[number, number][]>(poligono || []);
  const [zonaCerrada, setZonaCerrada] = useState<boolean>(Boolean(poligono && poligono.length >= 3));

  // Solo precargar cerrado si viene un polígono ya guardado desde la base de datos (p. ej. edición)
  useEffect(() => {
    if (interactuandoRef.current) {
      // El usuario está dibujando en el mapa: NO cerrar automáticamente
      return;
    }
    if (poligono && poligono.length >= 3) {
      setPuntosPoligono(poligono);
      setZonaCerrada(true);
    }
  }, [poligono]);

  useEffect(() => {
    if (direccionTexto !== undefined && direccionTexto !== busqueda) {
      setBusqueda(direccionTexto);
    }
  }, [direccionTexto]);

  const markerRef = useRef<L.Marker | null>(null);
  const pinIcon = useMemo(() => createDraggablePin(), []);

  // Cambiar modo de zona (radio o polígono)
  const handleCambioModoZona = (nuevoModo: 'radio' | 'poligono') => {
    setModoZonaInterno(nuevoModo);
    if (onModoZonaChange) {
      onModoZonaChange(nuevoModo);
    }
  };

  // Agregar punto al polígono: el usuario puede poner cuantos puntos quiera sin que se cierre solo
  const handleAddPoint = (lat: number, lng: number) => {
    interactuandoRef.current = true;
    if (zonaCerrada) return;
    const nuevo = [...puntosPoligono, [lat, lng] as [number, number]];
    setPuntosPoligono(nuevo);
    if (onPoligonoChange) {
      onPoligonoChange(nuevo);
    }
  };

  // Cerrar zona poligonal: la zona se cierra cuando se pone "Cerrar Polígono"
  const handleCerrarZona = () => {
    if (puntosPoligono.length < 3) return;
    setZonaCerrada(true);
    if (onPoligonoChange) {
      onPoligonoChange(puntosPoligono);
    }
  };

  // Deshacer último punto del polígono
  const handleUndoPoint = () => {
    interactuandoRef.current = true;
    if (puntosPoligono.length === 0) return;
    const nuevo = puntosPoligono.slice(0, -1);
    setPuntosPoligono(nuevo);
    if (nuevo.length < 3) {
      setZonaCerrada(false);
    }
    if (onPoligonoChange) {
      onPoligonoChange(nuevo);
    }
  };

  // Limpiar todos los puntos del polígono
  const handleClearPolygon = () => {
    interactuandoRef.current = true;
    setPuntosPoligono([]);
    setZonaCerrada(false);
    if (onPoligonoChange) {
      onPoligonoChange([]);
    }
  };

  // Generar un hexágono regular centrado en el comercio
  const handleGenerarHexagono = () => {
    interactuandoRef.current = true;
    const rKm = Math.max(0.5, (radioEntregaMetros || 3000) / 1000);
    const puntos: [number, number][] = [];
    for (let i = 0; i < 6; i++) {
      const angulo = (i * 60) * (Math.PI / 180);
      const deltaLat = (rKm / 110.574) * Math.cos(angulo);
      const deltaLng = (rKm / (111.320 * Math.cos(latitud * (Math.PI / 180)))) * Math.sin(angulo);
      puntos.push([
        Number((latitud + deltaLat).toFixed(6)),
        Number((longitud + deltaLng).toFixed(6)),
      ]);
    }
    setPuntosPoligono(puntos);
    setZonaCerrada(true);
    if (onPoligonoChange) {
      onPoligonoChange(puntos);
    }
  };

  // Arrastre manual de vértice
  const handleVertexDragEnd = (index: number, newLat: number, newLng: number) => {
    const copia: [number, number][] = [...puntosPoligono];
    copia[index] = [Number(newLat.toFixed(6)), Number(newLng.toFixed(6))];
    setPuntosPoligono(copia);
    if (onPoligonoChange) {
      onPoligonoChange(copia);
    }
  };

  // Buscar dirección con Nominatim
  const buscarDireccion = async (queryTexto: string) => {
    if (!queryTexto || queryTexto.trim().length < 3) return;

    setCargando(true);
    setMensajeEstado(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        queryTexto
      )}&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: { 'Accept-Language': 'es' },
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
  const modoPoligonoActivo = Boolean(mostrarRadio && modoZonaInterno === 'poligono' && !zonaCerrada);

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

      {/* PANEL SUPERIOR DE COBERTURA DE ENVÍOS: Radio (km) o Polígono por Puntos */}
      {mostrarRadio && (
        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-cyan-500/30 space-y-3 shadow-lg animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-cyan-400" />
              Radio / Zona de Cobertura de Envíos
            </span>

            {/* Alternador de Modo: Radio o Polígono */}
            <div className="flex items-center p-0.5 bg-zinc-950 border border-zinc-800 rounded-xl">
              <button
                type="button"
                onClick={() => handleCambioModoZona('radio')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  modoZonaInterno === 'radio'
                    ? 'bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>⭕ Radio (km)</span>
              </button>

              <button
                type="button"
                onClick={() => handleCambioModoZona('poligono')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  modoZonaInterno === 'poligono'
                    ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Hexagon className="w-3.5 h-3.5" />
                <span>⬡ Polígono por Puntos</span>
              </button>
            </div>
          </div>

          {/* MODO RADIO: Selector de km con presets y barra deslizadora */}
          {modoZonaInterno === 'radio' && onRadioChange && (
            <div className="space-y-2.5 pt-1 border-t border-zinc-800/80 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs text-zinc-300">
                  Radio circular de reparto: <strong className="text-cyan-400 font-mono">{radioKmActual.toFixed(1)} km</strong>{' '}
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

          {/* MODO POLÍGONO: Herramientas de delimitación por esquinas/puntos */}
          {modoZonaInterno === 'poligono' && (
            <div className="space-y-2.5 pt-1 border-t border-zinc-800/80 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-zinc-300">Puntos del polígono:</span>
                  {zonaCerrada && puntosPoligono.length >= 3 ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Polígono cerrado ({puntosPoligono.length} puntos)
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      {puntosPoligono.length === 0
                        ? 'Haz clic en el mapa para marcar puntos'
                        : `${puntosPoligono.length} puntos marcados (agrega los que quieras y pulsa Cerrar Polígono)`}
                    </span>
                  )}
                </div>

                {/* Botones de acción del polígono */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {!zonaCerrada ? (
                    <button
                      type="button"
                      onClick={handleCerrarZona}
                      disabled={puntosPoligono.length < 3}
                      className={`py-1 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                        puntosPoligono.length >= 3
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-950/50'
                          : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
                      }`}
                      title={
                        puntosPoligono.length >= 3
                          ? 'Cierra el polígono uniendo el último punto con el primero'
                          : 'Marca al menos 3 puntos en el mapa para poder cerrar el polígono'
                      }
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        Cerrar Polígono {puntosPoligono.length >= 3 ? `(${puntosPoligono.length} puntos)` : `(${puntosPoligono.length}/3 mín)`}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setZonaCerrada(false)}
                      className="py-1 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Permite agregar más puntos o ajustar los existentes"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Agregar Más Puntos</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleGenerarHexagono}
                    className="py-1 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Genera un hexágono simétrico de 6 puntos en torno a tu comercio"
                  >
                    <Hexagon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Hexágono</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleUndoPoint}
                    disabled={puntosPoligono.length === 0}
                    className="py-1 px-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Eliminar último punto marcado"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Deshacer</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleClearPolygon}
                    disabled={puntosPoligono.length === 0}
                    className="py-1 px-2 rounded-lg bg-zinc-800 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-300 border border-zinc-700 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Borrar todos los puntos del mapa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpiar</span>
                  </button>
                </div>
              </div>
            </div>
          )}
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
            modoPoligonoActivo={modoPoligonoActivo}
            onAddPoint={handleAddPoint}
          />

          {/* Modo Radio: Círculo de cobertura/envíos */}
          {mostrarRadio && modoZonaInterno === 'radio' && radioEntregaMetros && radioEntregaMetros > 0 && (
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

          {/* Modo Polígono: Vértices interactivos, líneas y área sombreada */}
          {mostrarRadio && modoZonaInterno === 'poligono' && (
            <>
              {/* Marcadores de vértices interactivos */}
              {puntosPoligono.map((pt, idx) => (
                <Marker
                  key={`vertex-${idx}-${pt[0]}-${pt[1]}`}
                  position={pt}
                  draggable={true}
                  icon={createVertexIcon(idx)}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const pos = marker.getLatLng();
                      handleVertexDragEnd(idx, pos.lat, pos.lng);
                    },
                  }}
                />
              ))}

              {/* Si no está cerrada aún: trazo de polilínea abierto */}
              {!zonaCerrada && puntosPoligono.length >= 2 && (
                <Polyline
                  positions={puntosPoligono}
                  pathOptions={{
                    color: '#f59e0b',
                    weight: 3,
                    dashArray: '6, 6',
                  }}
                />
              )}

              {/* Previsualización del cierre con línea punteada al punto inicial */}
              {!zonaCerrada && puntosPoligono.length >= 3 && (
                <Polyline
                  positions={[puntosPoligono[puntosPoligono.length - 1], puntosPoligono[0]]}
                  pathOptions={{
                    color: '#10b981',
                    weight: 2,
                    dashArray: '4, 4',
                  }}
                />
              )}

              {/* Cuando está cerrada: Polígono completo sombreado */}
              {zonaCerrada && puntosPoligono.length >= 3 && (
                <Polygon
                  positions={puntosPoligono}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.28,
                    weight: 3,
                  }}
                />
              )}
            </>
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
            {modoPoligonoActivo ? (
              <span>
                💡 <strong>Modo Polígono:</strong> Haz clic en el mapa para marcar todos los puntos que quieras. Al terminar, presiona <strong>&quot;Cerrar Polígono&quot;</strong> arriba.
              </span>
            ) : (
              <span>
                💡 <strong>Tip:</strong> Puedes <strong>arrastrar el pin</strong> para fijar la puerta de tu local.
                {mostrarRadio && modoZonaInterno === 'radio' && (
                  <span className="text-cyan-400 font-semibold ml-1">
                    • Círculo celeste: radio de {radioKmActual.toFixed(1)} km.
                  </span>
                )}
                {mostrarRadio && modoZonaInterno === 'poligono' && zonaCerrada && (
                  <span className="text-amber-400 font-semibold ml-1">
                    • Polígono cerrado ({puntosPoligono.length} puntos).
                  </span>
                )}
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
