'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polygon,
  Polyline,
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
  Sparkles,
  Check,
  Unlock,
  Hexagon,
  Layers,
  Globe,
  Building2,
  MapPin,
  Plus,
  X,
  Flag,
} from 'lucide-react';

export interface ZonasEnvioConfig {
  localidades?: string[];
  partidos?: string[];
  provincias?: string[];
  enviosNacional?: boolean;
  enviosExterior?: boolean;
  descripcionGenerada?: string;
}

interface SelectorZonaEnvioProps {
  latitud: number;
  longitud: number;
  radioKm: number;
  poligono: [number, number][];
  onChange: (
    nuevoRadioKm: number,
    nuevoPoligono: [number, number][],
    zonasConfig?: ZonasEnvioConfig
  ) => void;
  confirmado: boolean;
  onToggleConfirmado: (nuevoEstado: boolean) => void;
  initialDescripcion?: string;
  initialEnviosNacional?: boolean;
  initialEnviosExterior?: boolean;
  initialLocalidades?: string[];
  initialPartidos?: string[];
  initialProvincias?: string[];
  alcanceEnvio?: 'radio' | 'poligono' | 'territorial';
  onChangeAlcanceEnvio?: (modo: 'radio' | 'poligono' | 'territorial') => void;
  enviosNacional?: boolean;
  onChangeEnviosNacional?: (val: boolean) => void;
  enviosExterior?: boolean;
  onChangeEnviosExterior?: (val: boolean) => void;
  zonasDetalle?: string[] | { localidades?: string[]; partidos?: string[]; provincias?: string[] };
  onChangeZonasDetalle?: (val: any) => void;
  zonaDescripcion?: string;
  onChangeZonaDescripcion?: (val: string) => void;
}

// Icono para el local comercial / punto base
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

// Icono para los vértices del polígono
function createVertexIcon(index: number, esPrimerPuntoParaCerrar: boolean = false) {
  const bgColor = esPrimerPuntoParaCerrar ? 'bg-emerald-500 animate-pulse ring-4 ring-emerald-400/50' : 'bg-amber-500';
  const html = `
    <div class="w-6 h-6 rounded-full ${bgColor} border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black text-white cursor-pointer select-none transition-transform hover:scale-125" title="${esPrimerPuntoParaCerrar ? 'Clic para cerrar la zona con este punto' : `Punto ${index + 1}`}">
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

// Auto-ajustador de vista del mapa inteligente
function AutoAjustarVista({
  center,
  radiusKm,
  polygonPoints,
  modo,
  zonaCerrada,
}: {
  center: [number, number];
  radiusKm: number;
  polygonPoints: [number, number][];
  modo: 'radio' | 'poligono' | 'territorial';
  zonaCerrada: boolean;
}) {
  const map = useMap();
  const prevPointsLength = useRef(polygonPoints.length);
  const prevZonaCerrada = useRef(zonaCerrada);
  const prevRadius = useRef(radiusKm);
  const prevModo = useRef(modo);
  const prevCenterLat = useRef(center[0]);
  const prevCenterLng = useRef(center[1]);

  // Asegurar que Leaflet reconozca las dimensiones del contenedor al renderizarse
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
    const zonaCerradaChanged = prevZonaCerrada.current !== zonaCerrada;

    prevCenterLat.current = center[0];
    prevCenterLng.current = center[1];
    prevModo.current = modo;
    prevRadius.current = radiusKm;
    prevPointsLength.current = polygonPoints.length;
    prevZonaCerrada.current = zonaCerrada;

    try {
      const size = map.getSize();
      if (!size || size.x === 0 || size.y === 0) return;

      if (modo === 'poligono' && zonaCerrada && polygonPoints && polygonPoints.length >= 3) {
        if (zonaCerradaChanged || pointsChanged || modoChanged || centerChanged) {
          const bounds = L.latLngBounds(polygonPoints);
          bounds.extend(L.latLng(center[0], center[1]));
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [35, 35], maxZoom: 15 });
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
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
          }
        }
      }
    } catch (err) {
      console.warn('[SelectorZonaEnvio] Error al autoajustar vista:', err);
    }
  }, [center[0], center[1], radiusKm, polygonPoints.length, modo, zonaCerrada, map]);

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
  initialDescripcion,
  initialEnviosNacional = false,
  initialEnviosExterior = false,
  initialLocalidades = [],
  initialPartidos = [],
  initialProvincias = [],
}: SelectorZonaEnvioProps) {
  const safePoligono: [number, number][] = Array.isArray(poligono) ? poligono : [];

  const [modo, setModo] = useState<'radio' | 'poligono' | 'territorial'>(
    initialEnviosNacional || initialEnviosExterior || (initialLocalidades && initialLocalidades.length > 0) || (initialPartidos && initialPartidos.length > 0)
      ? 'territorial'
      : safePoligono.length >= 3
      ? 'poligono'
      : 'radio'
  );

  // Estado que define si el polígono actual ya fue cerrado
  const [zonaCerrada, setZonaCerrada] = useState<boolean>(
    Boolean(safePoligono.length >= 3)
  );

  const [inputKm, setInputKm] = useState<string>(
    radioKm && radioKm > 0 ? radioKm.toString() : '3'
  );

  // Estados territoriales
  const [localidades, setLocalidades] = useState<string[]>(initialLocalidades);
  const [nuevaLocalidad, setNuevaLocalidad] = useState('');

  const [partidos, setPartidos] = useState<string[]>(initialPartidos);
  const [nuevoPartido, setNuevoPartido] = useState('');

  const [provincias, setProvincias] = useState<string[]>(initialProvincias);
  const [nuevaProvincia, setNuevaProvincia] = useState('');

  const [enviosNacional, setEnviosNacional] = useState<boolean>(initialEnviosNacional);
  const [enviosExterior, setEnviosExterior] = useState<boolean>(initialEnviosExterior);

  const storeIcon = useMemo(() => createStoreIcon(), []);

  const validLat = typeof latitud === 'number' && !isNaN(latitud) ? latitud : -34.6037;
  const validLng = typeof longitud === 'number' && !isNaN(longitud) ? longitud : -58.4212;

  // Generador de descripción compilada de cobertura
  const compilarResumen = (
    r: number,
    pol: [number, number][],
    locs: string[],
    parts: string[],
    provs: string[],
    nac: boolean,
    ext: boolean,
    m: 'radio' | 'poligono' | 'territorial'
  ): string => {
    const partes: string[] = [];
    if (m === 'radio' && r > 0) {
      partes.push(`Radio de entrega: ${r} km`);
    } else if (m === 'poligono' && pol.length >= 3) {
      partes.push(`Zona delimitada en mapa (${pol.length} puntos)`);
    }
    if (locs.length > 0) {
      partes.push(`Localidades: ${locs.join(', ')}`);
    }
    if (parts.length > 0) {
      partes.push(`Partidos/Municipios: ${parts.join(', ')}`);
    }
    if (provs.length > 0) {
      partes.push(`Provincias: ${provs.join(', ')}`);
    }
    if (nac) {
      partes.push('Envíos a todo el país');
    }
    if (ext) {
      partes.push('Envíos al exterior / Internacional');
    }
    return partes.join(' • ');
  };

  const notificarCambios = (
    r: number,
    pol: [number, number][],
    locs: string[] = localidades,
    parts: string[] = partidos,
    provs: string[] = provincias,
    nac: boolean = enviosNacional,
    ext: boolean = enviosExterior,
    m: 'radio' | 'poligono' | 'territorial' = modo
  ) => {
    const desc = compilarResumen(r, pol, locs, parts, provs, nac, ext, m);
    onChange(r, pol, {
      localidades: locs,
      partidos: parts,
      provincias: provs,
      enviosNacional: nac,
      enviosExterior: ext,
      descripcionGenerada: desc,
    });
  };

  // Sincronizar inicial si polígono viene con puntos suficientes
  useEffect(() => {
    if (safePoligono.length >= 3) {
      setZonaCerrada(true);
      if (!confirmado) {
        onToggleConfirmado(true);
      }
    } else if (modo === 'radio') {
      if (!confirmado) {
        onToggleConfirmado(true);
      }
    }
  }, []);

  // Cambio de modo a Radio
  const handleSelectModoRadio = () => {
    setModo('radio');
    const parsed = parseFloat(inputKm) || 3;
    notificarCambios(parsed, poligono, localidades, partidos, provincias, enviosNacional, enviosExterior, 'radio');
    onToggleConfirmado(true);
  };

  // Cambio de modo a Polígono
  const handleSelectModoPoligono = () => {
    setModo('poligono');
    if (poligono.length >= 3 && zonaCerrada) {
      onToggleConfirmado(true);
    }
    notificarCambios(parseFloat(inputKm) || 3, poligono, localidades, partidos, provincias, enviosNacional, enviosExterior, 'poligono');
  };

  // Cambio de modo a Territorial / Puntos
  const handleSelectModoTerritorial = () => {
    setModo('territorial');
    onToggleConfirmado(true);
    notificarCambios(parseFloat(inputKm) || 3, poligono, localidades, partidos, provincias, enviosNacional, enviosExterior, 'territorial');
  };

  // Manejo de cambio de radio en km (permite valores mayores a 15 km: 20, 30, 50, etc.)
  const handleRadioKmChange = (valStr: string) => {
    setInputKm(valStr);
    const parsed = parseFloat(valStr);
    if (!isNaN(parsed) && parsed > 0) {
      notificarCambios(parsed, poligono, localidades, partidos, provincias, enviosNacional, enviosExterior, modo);
      onToggleConfirmado(true);
    }
  };

  // Manejo de agregar punto al polígono
  const handleAddPoint = (lat: number, lng: number) => {
    if (zonaCerrada) return;
    const nuevoPoligono: [number, number][] = [...poligono, [lat, lng]];
    notificarCambios(parseFloat(inputKm) || 3, nuevoPoligono);
  };

  // Cerrar la zona: une el último punto con el primero y marca todo el interior
  const handleCerrarZona = () => {
    if (poligono.length < 3) {
      alert('Para cerrar la zona debes marcar al menos 3 puntos en el mapa que delimiten las calles.');
      return;
    }
    setZonaCerrada(true);
    notificarCambios(parseFloat(inputKm) || 3, poligono);
    onToggleConfirmado(true);
  };

  // Reabrir zona para agregar o ajustar puntos
  const handleReabrirZona = () => {
    setZonaCerrada(false);
  };

  // Generar hexágono automático alrededor del comercio
  const handleGenerarHexagono = () => {
    const radioHex = parseFloat(inputKm) > 0 ? parseFloat(inputKm) : 2.5;
    const puntos: [number, number][] = [];
    
    // Generar 6 vértices equidistantes formando un hexágono regular
    for (let i = 0; i < 6; i++) {
      const angulo = (i * 60) * (Math.PI / 180);
      const deltaLat = (radioHex / 110.574) * Math.cos(angulo);
      const deltaLng = (radioHex / (111.320 * Math.cos(validLat * (Math.PI / 180)))) * Math.sin(angulo);
      puntos.push([
        Number((validLat + deltaLat).toFixed(6)),
        Number((validLng + deltaLng).toFixed(6)),
      ]);
    }

    setZonaCerrada(true);
    notificarCambios(parseFloat(inputKm) || 3, puntos);
    onToggleConfirmado(true);
  };

  // Deshacer último punto
  const handleUndoPoint = () => {
    if (poligono.length === 0) return;
    const nuevoPoligono = poligono.slice(0, -1);
    notificarCambios(parseFloat(inputKm) || 3, nuevoPoligono);
    if (nuevoPoligono.length < 3) {
      setZonaCerrada(false);
    }
  };

  // Limpiar polígono
  const handleClearPolygon = () => {
    notificarCambios(parseFloat(inputKm) || 3, []);
    setZonaCerrada(false);
  };

  // Arrastre manual de vértice para ajuste fino de esquinas
  const handleVertexDragEnd = (index: number, newLat: number, newLng: number) => {
    const copia = [...poligono];
    copia[index] = [Number(newLat.toFixed(6)), Number(newLng.toFixed(6))];
    notificarCambios(parseFloat(inputKm) || 3, copia);
    if (zonaCerrada) {
      onToggleConfirmado(true);
    }
  };

  // Helpers territoriales
  const handleAgregarLocalidad = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = nuevaLocalidad.trim();
    if (!clean || localidades.includes(clean)) return;
    const actualizadas = [...localidades, clean];
    setLocalidades(actualizadas);
    setNuevaLocalidad('');
    notificarCambios(parseFloat(inputKm) || 3, poligono, actualizadas);
  };

  const handleEliminarLocalidad = (item: string) => {
    const filtradas = localidades.filter((l) => l !== item);
    setLocalidades(filtradas);
    notificarCambios(parseFloat(inputKm) || 3, poligono, filtradas);
  };

  const handleAgregarPartido = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = nuevoPartido.trim();
    if (!clean || partidos.includes(clean)) return;
    const actualizadas = [...partidos, clean];
    setPartidos(actualizadas);
    setNuevoPartido('');
    notificarCambios(parseFloat(inputKm) || 3, poligono, localidades, actualizadas);
  };

  const handleEliminarPartido = (item: string) => {
    const filtradas = partidos.filter((p) => p !== item);
    setPartidos(filtradas);
    notificarCambios(parseFloat(inputKm) || 3, poligono, localidades, filtradas);
  };

  const handleAgregarProvincia = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = nuevaProvincia.trim();
    if (!clean || provincias.includes(clean)) return;
    const actualizadas = [...provincias, clean];
    setProvincias(actualizadas);
    setNuevaProvincia('');
    notificarCambios(parseFloat(inputKm) || 3, poligono, localidades, partidos, actualizadas);
  };

  const handleEliminarProvincia = (item: string) => {
    const filtradas = provincias.filter((p) => p !== item);
    setProvincias(filtradas);
    notificarCambios(parseFloat(inputKm) || 3, poligono, localidades, partidos, filtradas);
  };

  const handleToggleNacional = (valor: boolean) => {
    setEnviosNacional(valor);
    notificarCambios(parseFloat(inputKm) || 3, poligono, localidades, partidos, provincias, valor, enviosExterior);
  };

  const handleToggleExterior = (valor: boolean) => {
    setEnviosExterior(valor);
    notificarCambios(parseFloat(inputKm) || 3, poligono, localidades, partidos, provincias, enviosNacional, valor);
  };

  return (
    <div className="space-y-3 p-4 sm:p-5 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl">
      {/* Cabecera y Selector de Modalidad */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400 shrink-0">
            <Bike className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Límites y Cobertura de Envíos</span>
            </h4>
            <p className="text-[11px] text-zinc-400">
              Elegí un radio en km (sin tope de 15km), marcá puntos en el mapa o indicá localidades, partidos, provincias, país y exterior.
            </p>
          </div>
        </div>

        {/* Pestañas de Modo: Radio vs Polígono vs Zonas Territoriales */}
        <div className="flex items-center p-1 rounded-2xl bg-zinc-900 border border-zinc-800 self-stretch sm:self-auto flex-wrap gap-1">
          <button
            type="button"
            onClick={handleSelectModoRadio}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modo === 'radio'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Radio en Kilómetros
          </button>
          <button
            type="button"
            onClick={handleSelectModoPoligono}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              modo === 'poligono'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Marcar Puntos Mapa
          </button>
          <button
            type="button"
            onClick={handleSelectModoTerritorial}
            className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              modo === 'territorial'
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-cyan-300" />
            <span>Zonas / Exterior</span>
          </button>
        </div>
      </div>

      {/* Barra de Controles según modo */}
      {modo === 'radio' ? (
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 space-y-0.5">
            <span className="text-xs font-semibold text-zinc-200 block">
              Alcance de reparto en kilómetros:
            </span>
            <span className="text-[11px] text-zinc-400">
              Definí la distancia máxima a la redonda. Podés ingresar más de 15 km (ej: 20 km, 30 km, 50 km).
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
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

            <div className="flex items-center gap-1 flex-wrap">
              {[1, 2, 3, 5, 10, 15, 20, 25, 30, 50].map((sugerido) => (
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
      ) : modo === 'territorial' ? (
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-4 text-xs">
          {/* Toggles Nacional y Exterior */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
              enviosNacional ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-200' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center gap-2">
                <Flag className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-bold text-white block text-xs">Envíos a todo el País</span>
                  <span className="text-[10px] text-zinc-400">Correo Argentino, Andreani, encomiendas</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enviosNacional}
                onChange={(e) => handleToggleNacional(e.target.checked)}
                className="w-4 h-4 accent-cyan-500 rounded"
              />
            </label>

            <label className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
              enviosExterior ? 'bg-purple-950/60 border-purple-500/60 text-purple-200' : 'bg-zinc-950 border-zinc-800 text-zinc-400'
            }`}>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="font-bold text-white block text-xs">Envíos al Exterior (Internacional)</span>
                  <span className="text-[10px] text-zinc-400">Exportaciones y paquetería internacional</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enviosExterior}
                onChange={(e) => handleToggleExterior(e.target.checked)}
                className="w-4 h-4 accent-purple-500 rounded"
              />
            </label>
          </div>

          {/* Localidades o Barrios */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
              <MapPin className="w-3.5 h-3.5 text-cyan-400" />
              <span>Localidades / Barrios Específicos</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nuevaLocalidad}
                onChange={(e) => setNuevaLocalidad(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarLocalidad(); } }}
                placeholder="Ej: Vicente López, Olivos, Palermo, etc."
                className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => handleAgregarLocalidad()}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
            {localidades.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {localidades.map((loc) => (
                  <span key={loc} className="px-2 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-800/80 text-cyan-300 text-[11px] font-semibold flex items-center gap-1">
                    <span>{loc}</span>
                    <button type="button" onClick={() => handleEliminarLocalidad(loc)} className="text-zinc-400 hover:text-white">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Partidos o Municipios */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Partidos / Municipios / Departamentos</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nuevoPartido}
                onChange={(e) => setNuevoPartido(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarPartido(); } }}
                placeholder="Ej: San Isidro, San Martín, Tigre, Morón, etc."
                className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => handleAgregarPartido()}
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
            {partidos.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {partidos.map((part) => (
                  <span key={part} className="px-2 py-0.5 rounded-lg bg-violet-950/80 border border-violet-800/80 text-violet-300 text-[11px] font-semibold flex items-center gap-1">
                    <span>{part}</span>
                    <button type="button" onClick={() => handleEliminarPartido(part)} className="text-zinc-400 hover:text-white">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Provincias */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Provincias Cubiertas</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nuevaProvincia}
                onChange={(e) => setNuevaProvincia(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAgregarProvincia(); } }}
                placeholder="Ej: Buenos Aires, CABA, Córdoba, Santa Fe..."
                className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => handleAgregarProvincia()}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>
            {provincias.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                {provincias.map((prov) => (
                  <span key={prov} className="px-2 py-0.5 rounded-lg bg-amber-950/80 border border-amber-800/80 text-amber-300 text-[11px] font-semibold flex items-center gap-1">
                    <span>{prov}</span>
                    <button type="button" onClick={() => handleEliminarProvincia(prov)} className="text-zinc-400 hover:text-white">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white">Zona por Puntos:</span>
                {zonaCerrada && poligono.length >= 3 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/90 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Zona Cerrada y Cubierta ({poligono.length} puntos)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-950/90 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Marcando puntos ({poligono.length} en el mapa)
                  </span>
                )}
              </div>
              <span className="text-[11px] text-zinc-400 block">
                {zonaCerrada
                  ? 'El perímetro está cerrado y el interior sombreado representa tu área de entrega.'
                  : 'Hacé clic sobre el mapa para marcar las esquinas o límites. Al terminar, presioná "Cerrar Zona".'}
              </span>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Botón Cerrar Zona (si está abierto) o Reabrir (si está cerrado) */}
              {!zonaCerrada ? (
                <button
                  type="button"
                  onClick={handleCerrarZona}
                  disabled={poligono.length < 3}
                  className={`py-1.5 px-3.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                    poligono.length >= 3
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-zinc-950 shadow-emerald-950/50 animate-pulse'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
                  }`}
                  title={
                    poligono.length >= 3
                      ? 'Unir el último punto con el primero y cubrir toda la zona'
                      : 'Marcá al menos 3 puntos en el mapa para cerrar la zona'
                  }
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Cerrar Zona {poligono.length >= 3 ? '(Unir puntos)' : `(${poligono.length}/3)`}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleReabrirZona}
                  className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  title="Permite agregar más esquinas o ajustar puntos"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reabrir / Agregar Puntos</span>
                </button>
              )}

              {/* Botón Rápido: Generar Hexágono */}
              <button
                type="button"
                onClick={handleGenerarHexagono}
                className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                title="Genera un hexágono simétrico de 6 puntos en torno al local"
              >
                <Hexagon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Generar Hexágono</span>
              </button>

              <button
                type="button"
                onClick={handleUndoPoint}
                disabled={poligono.length === 0}
                className="py-1.5 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Elimina el último punto marcado"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>Deshacer</span>
              </button>

              <button
                type="button"
                onClick={handleClearPolygon}
                disabled={poligono.length === 0}
                className="py-1.5 px-2.5 rounded-xl bg-zinc-900 hover:bg-rose-950/80 text-zinc-400 hover:text-rose-300 border border-zinc-800 disabled:opacity-40 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                title="Borrar todos los puntos del mapa"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Limpiar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor del Mapa Interactivo */}
      <div className="relative w-full h-[360px] rounded-2xl overflow-hidden border border-zinc-800 shadow-inner">
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
            zonaCerrada={zonaCerrada}
          />

          {/* Capturador de clics solo si está en modo polígono y aún no está cerrado */}
          <MapClickHandler onAddPoint={handleAddPoint} active={modo === 'poligono' && !zonaCerrada} />

          {/* Marcador Central del Local o Punto Base */}
          <Marker position={[validLat, validLng]} icon={storeIcon} />

          {/* Modo Radio: Círculo de Cobertura */}
          {modo === 'radio' && (
            <Circle
              center={[validLat, validLng]}
              radius={(parseFloat(inputKm) || 3) * 1000}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#06b6d4',
                fillOpacity: 0.22,
                weight: 2.5,
                dashArray: '6, 6',
              }}
            />
          )}

          {/* Modo Polígono */}
          {modo === 'poligono' && (
            <>
              {/* Marcadores de vértices interactivos */}
              {safePoligono.map((pt, idx) => (
                <Marker
                  key={`vertex-${idx}-${pt[0]}-${pt[1]}`}
                  position={pt}
                  draggable={true}
                  icon={createVertexIcon(idx, idx === 0 && !zonaCerrada && safePoligono.length >= 3)}
                  eventHandlers={{
                    dragend: (e) => {
                      const marker = e.target;
                      const pos = marker.getLatLng();
                      handleVertexDragEnd(idx, pos.lat, pos.lng);
                    },
                    click: () => {
                      if (idx === 0 && !zonaCerrada && safePoligono.length >= 3) {
                        handleCerrarZona();
                      }
                    },
                  }}
                />
              ))}

              {/* Si NO está cerrada aún: trazo de polilínea abierto */}
              {!zonaCerrada && safePoligono.length >= 2 && (
                <Polyline
                  positions={safePoligono}
                  pathOptions={{
                    color: '#f59e0b',
                    weight: 3,
                    dashArray: '6, 6',
                  }}
                />
              )}

              {/* Previsualización del cierre con línea punteada al punto inicial */}
              {!zonaCerrada && safePoligono.length >= 3 && (
                <Polyline
                  positions={[safePoligono[safePoligono.length - 1], safePoligono[0]]}
                  pathOptions={{
                    color: '#10b981',
                    weight: 2,
                    dashArray: '4, 4',
                  }}
                />
              )}

              {/* Cuando está CERRADA: Polígono completo sombreado que cubre todo el interior */}
              {zonaCerrada && safePoligono.length >= 3 && (
                <Polygon
                  positions={safePoligono}
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
        </MapContainer>

        {/* Overlay informativo flotante sobre el mapa */}
        <div className="absolute top-3 left-3 z-[1000] pointer-events-none">
          <div className="px-3 py-1.5 rounded-xl bg-zinc-950/90 backdrop-blur-md border border-zinc-800 text-[11px] text-zinc-300 shadow-xl max-w-xs">
            {modo === 'radio' ? (
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
                <span>
                  Radio activo: <strong>{inputKm} km</strong> a la redonda
                </span>
              </span>
            ) : zonaCerrada && poligono.length >= 3 ? (
              <span className="flex items-center gap-2 text-emerald-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                <span>
                  Zona cerrada de <strong>{poligono.length} puntos</strong>. Área interior cubierta.
                </span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span>
                  {poligono.length < 3
                    ? `Marcá ${3 - poligono.length} punto(s) más para poder cerrar la zona`
                    : '¡Puntos listos! Hacé clic en "Cerrar Zona" para unir los puntos y cubrir el interior.'}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Estado y Confirmación */}
      <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-3">
        {modo === 'territorial' ? (
          <div className="flex items-center gap-2 p-2.5 px-3.5 rounded-2xl bg-violet-950/70 border border-violet-500/60 text-violet-200 text-xs w-full">
            <Globe className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold">
              {compilarResumen(parseFloat(inputKm) || 0, poligono, localidades, partidos, provincias, enviosNacional, enviosExterior, 'territorial') || 'Configura tus localidades, partidos, provincias, país o exterior arriba.'}
            </span>
          </div>
        ) : modo === 'radio' ? (
          <div className="flex items-center gap-2 p-2.5 px-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">
              Zona de entrega activa: <strong>{inputKm} km</strong> de cobertura a la redonda.
            </span>
          </div>
        ) : zonaCerrada && poligono.length >= 3 ? (
          <div className="flex items-center gap-2 p-2.5 px-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs w-full">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">
              ¡Zona delimitada y cerrada! <strong>{poligono.length} puntos</strong> unidos con todo el interior sombreado.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 px-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-300 text-xs w-full">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Marcá los puntos deseados en el mapa y pulsá el botón <strong>&quot;Cerrar Zona&quot;</strong> para completar el perímetro.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
