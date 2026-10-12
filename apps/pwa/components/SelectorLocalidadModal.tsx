'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Comercio } from '@/types/comercio';
import {
  MapPin,
  Search,
  X,
  Compass,
  Sparkles,
  ChevronRight,
  Globe,
  Store,
  Navigation,
  CheckCircle2,
} from 'lucide-react';

export interface ZonaGeografica {
  nombre: string;
  tipo: 'localidad' | 'partido' | 'provincia' | 'barrio';
  provincia?: string;
  latitud: number;
  longitud: number;
  zoom?: number;
}

// Zonas y ciudades populares de Argentina precargadas para respuesta inmediata (0ms de latencia)
export const ZONAS_PRECARGADAS: ZonaGeografica[] = [
  // GBA Norte
  { nombre: 'Pilar Centro', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4586, longitud: -58.9142 },
  { nombre: 'Del Viso', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4447, longitud: -58.7997 },
  { nombre: 'Manuel Alberti', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4533, longitud: -58.7483 },
  { nombre: 'Presidente Derqui', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4786, longitud: -58.8353 },
  { nombre: 'Villa Rosa', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4172, longitud: -58.8789 },
  { nombre: 'Belén de Escobar', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.3486, longitud: -58.7917 },
  { nombre: 'Ingeniero Maschwitz', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.3847, longitud: -58.7397 },
  { nombre: 'Garín', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4258, longitud: -58.7183 },
  { nombre: 'Tigre Centro', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4261, longitud: -58.5797 },
  { nombre: 'Don Torcuato', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4983, longitud: -58.6253 },
  { nombre: 'Benavídez', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4072, longitud: -58.6833 },
  { nombre: 'General Pacheco', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4561, longitud: -58.6278 },
  { nombre: 'San Isidro', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.4719, longitud: -58.5286 },
  { nombre: 'Martínez', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4947, longitud: -58.5117 },
  { nombre: 'San Fernando', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.4419, longitud: -58.5583 },
  { nombre: 'Vicente López', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.5269, longitud: -58.4864 },
  { nombre: 'Olivos', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.5097, longitud: -58.4861 },
  { nombre: 'San Miguel', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.5428, longitud: -58.7125 },
  { nombre: 'Bella Vista', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.5667, longitud: -58.6833 },
  { nombre: 'Tortuguitas', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.4739, longitud: -58.7561 },
  { nombre: 'Los Polvorines', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.5083, longitud: -58.6944 },

  // CABA
  { nombre: 'Palermo', tipo: 'barrio', provincia: 'CABA', latitud: -34.5889, longitud: -58.4306 },
  { nombre: 'Belgrano', tipo: 'barrio', provincia: 'CABA', latitud: -34.5628, longitud: -58.4564 },
  { nombre: 'Caballito', tipo: 'barrio', provincia: 'CABA', latitud: -34.6186, longitud: -58.4439 },
  { nombre: 'Recoleta', tipo: 'barrio', provincia: 'CABA', latitud: -34.5875, longitud: -58.3975 },
  { nombre: 'Villa Urquiza', tipo: 'barrio', provincia: 'CABA', latitud: -34.5739, longitud: -58.4908 },
  { nombre: 'Flores', tipo: 'barrio', provincia: 'CABA', latitud: -34.6292, longitud: -58.4633 },
  { nombre: 'Almagro', tipo: 'barrio', provincia: 'CABA', latitud: -34.6108, longitud: -58.4239 },
  { nombre: 'Microcentro / Obelisco', tipo: 'barrio', provincia: 'CABA', latitud: -34.6037, longitud: -58.3816 },

  // GBA Oeste
  { nombre: 'Morón', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.6533, longitud: -58.6197 },
  { nombre: 'Castelar', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.6528, longitud: -58.6433 },
  { nombre: 'Ramos Mejía', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.6469, longitud: -58.5647 },
  { nombre: 'Haedo', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.6464, longitud: -58.5911 },
  { nombre: 'Ituzaingó', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.6583, longitud: -58.6694 },
  { nombre: 'Hurlingham', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.5939, longitud: -58.6367 },
  { nombre: 'Moreno', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.6508, longitud: -58.7906 },
  { nombre: 'Merlo', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.6653, longitud: -58.7289 },
  { nombre: 'San Justo (La Matanza)', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.6819, longitud: -58.5583 },
  { nombre: 'Caseros (Tres de Febrero)', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.6083, longitud: -58.5639 },
  { nombre: 'San Martín', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.5739, longitud: -58.5358 },

  // GBA Sur
  { nombre: 'Quilmes', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.7247, longitud: -58.2525 },
  { nombre: 'Bernal', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.7072, longitud: -58.2778 },
  { nombre: 'Lanús', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.7019, longitud: -58.3917 },
  { nombre: 'Banfield', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.7439, longitud: -58.3944 },
  { nombre: 'Lomas de Zamora', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.7608, longitud: -58.4028 },
  { nombre: 'Avellaneda', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.6617, longitud: -58.3667 },
  { nombre: 'Adrogué (Almirante Brown)', tipo: 'localidad', provincia: 'Buenos Aires', latitud: -34.7983, longitud: -58.3889 },
  { nombre: 'Berazategui', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.7639, longitud: -58.2139 },

  // Ciudades Principales e Interior
  { nombre: 'La Plata', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.9214, longitud: -57.9544 },
  { nombre: 'Mar del Plata', tipo: 'partido', provincia: 'Buenos Aires', latitud: -38.0055, longitud: -57.556 },
  { nombre: 'Bahía Blanca', tipo: 'partido', provincia: 'Buenos Aires', latitud: -38.7183, longitud: -62.266 },
  { nombre: 'Tandil', tipo: 'partido', provincia: 'Buenos Aires', latitud: -37.3217, longitud: -59.1332 },
  { nombre: 'Campana', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.1687, longitud: -58.9591 },
  { nombre: 'Zárate', tipo: 'partido', provincia: 'Buenos Aires', latitud: -34.0983, longitud: -59.0286 },
  { nombre: 'Córdoba Capital', tipo: 'provincia', provincia: 'Córdoba', latitud: -31.4201, longitud: -64.1888 },
  { nombre: 'Villa Carlos Paz', tipo: 'localidad', provincia: 'Córdoba', latitud: -31.4241, longitud: -64.4978 },
  { nombre: 'Rosario', tipo: 'provincia', provincia: 'Santa Fe', latitud: -32.9468, longitud: -60.6393 },
  { nombre: 'Santa Fe Capital', tipo: 'provincia', provincia: 'Santa Fe', latitud: -31.6333, longitud: -60.7 },
  { nombre: 'Mendoza Capital', tipo: 'provincia', provincia: 'Mendoza', latitud: -32.8895, longitud: -68.8458 },
  { nombre: 'San Miguel de Tucumán', tipo: 'provincia', provincia: 'Tucumán', latitud: -26.8083, longitud: -65.2176 },
  { nombre: 'Salta Capital', tipo: 'provincia', provincia: 'Salta', latitud: -24.7859, longitud: -65.4117 },
  { nombre: 'Neuquén Capital', tipo: 'provincia', provincia: 'Neuquén', latitud: -38.9516, longitud: -68.0591 },
  { nombre: 'San Carlos de Bariloche', tipo: 'localidad', provincia: 'Río Negro', latitud: -41.1335, longitud: -71.3103 },
];

// Regiones y agrupaciones visuales para exploración en tabs
const REGIONES_TABS = [
  { id: 'todos', nombre: 'Todas' },
  { id: 'gba_norte', nombre: 'GBA Norte' },
  { id: 'caba', nombre: 'CABA' },
  { id: 'gba_oeste', nombre: 'GBA Oeste' },
  { id: 'gba_sur', nombre: 'GBA Sur' },
  { id: 'interior', nombre: 'Interior & Provincias' },
];

interface SelectorLocalidadModalProps {
  abierto: boolean;
  onCerrar: () => void;
  comercios: Comercio[];
  onSeleccionarZona: (zona: ZonaGeografica) => void;
  zonaActualNombre?: string | null;
  onLimpiarZona?: () => void;
}

export default function SelectorLocalidadModal({
  abierto,
  onCerrar,
  comercios,
  onSeleccionarZona,
  zonaActualNombre,
  onLimpiarZona,
}: SelectorLocalidadModalProps) {
  const [busqueda, setBusqueda] = useState('');
  const [tabRegion, setTabRegion] = useState('todos');
  const [buscandoExterna, setBuscandoExterna] = useState(false);
  const [resultadosExternos, setResultadosExternos] = useState<ZonaGeografica[]>([]);

  // Extraer automáticamente localidades de los comercios registrados en el sistema
  const localidadesComercios = useMemo(() => {
    const mapa = new Map<string, { cantidad: number; lat: number; lng: number }>();
    comercios.forEach((c) => {
      const loc = (c.localidad || '').trim();
      if (loc && loc.length >= 3) {
        const existente = mapa.get(loc.toLowerCase());
        if (existente) {
          existente.cantidad += 1;
        } else {
          mapa.set(loc.toLowerCase(), {
            cantidad: 1,
            lat: c.latitud,
            lng: c.longitud,
          });
        }
      }
    });

    return Array.from(mapa.entries()).map(([nombreLower, data]) => {
      // Capitalizar nombre
      const formateado = nombreLower
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
      return {
        nombre: formateado,
        cantidad: data.cantidad,
        latitud: data.lat,
        longitud: data.lng,
      };
    }).sort((a, b) => b.cantidad - a.cantidad);
  }, [comercios]);

  // Búsqueda en vivo online (OpenStreetMap Nominatim) con debounce
  useEffect(() => {
    const query = busqueda.trim();
    if (!query || query.length < 3) {
      setResultadosExternos([]);
      setBuscandoExterna(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setBuscandoExterna(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=ar&limit=5`;
        const res = await fetch(url, {
          headers: { 'Accept-Language': 'es' },
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            const formateados: ZonaGeografica[] = data.map((item: any) => ({
              nombre: item.display_name.split(',')[0],
              tipo: 'localidad',
              provincia: item.display_name.split(',').slice(1, 3).join(',').trim(),
              latitud: parseFloat(item.lat),
              longitud: parseFloat(item.lon),
            }));
            setResultadosExternos(formateados);
          }
        }
      } catch (e) {
        console.warn('Error al buscar zona externa:', e);
      } finally {
        setBuscandoExterna(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [busqueda]);

  // Filtrado de las zonas precargadas según búsqueda y tab seleccionado
  const zonasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();

    return ZONAS_PRECARGADAS.filter((z) => {
      // Filtro de texto
      if (q) {
        const matchNombre = z.nombre.toLowerCase().includes(q);
        const matchProvincia = (z.provincia || '').toLowerCase().includes(q);
        const matchTipo = z.tipo.toLowerCase().includes(q);
        if (!matchNombre && !matchProvincia && !matchTipo) return false;
      }

      // Filtro de tab
      if (tabRegion === 'todos') return true;
      if (tabRegion === 'caba') return z.provincia === 'CABA';
      if (tabRegion === 'gba_norte') {
        return (
          z.provincia === 'Buenos Aires' &&
          ['Pilar', 'Del Viso', 'Manuel Alberti', 'Derqui', 'Villa Rosa', 'Escobar', 'Maschwitz', 'Garín', 'Tigre', 'Don Torcuato', 'Benavídez', 'Pacheco', 'San Isidro', 'Martínez', 'San Fernando', 'Vicente López', 'Olivos', 'San Miguel', 'Bella Vista', 'Tortuguitas', 'Los Polvorines'].some((k) =>
            z.nombre.includes(k)
          )
        );
      }
      if (tabRegion === 'gba_oeste') {
        return (
          z.provincia === 'Buenos Aires' &&
          ['Morón', 'Castelar', 'Ramos Mejía', 'Haedo', 'Ituzaingó', 'Hurlingham', 'Moreno', 'Merlo', 'San Justo', 'Caseros', 'San Martín'].some((k) =>
            z.nombre.includes(k)
          )
        );
      }
      if (tabRegion === 'gba_sur') {
        return (
          z.provincia === 'Buenos Aires' &&
          ['Quilmes', 'Bernal', 'Lanús', 'Banfield', 'Lomas de Zamora', 'Avellaneda', 'Adrogué', 'Berazategui'].some((k) =>
            z.nombre.includes(k)
          )
        );
      }
      if (tabRegion === 'interior') {
        return z.provincia !== 'CABA' && !['Pilar', 'Escobar', 'Tigre', 'San Isidro', 'Vicente López', 'Morón', 'Quilmes', 'Lanús', 'Lomas de Zamora'].some((k) => z.nombre.includes(k));
      }

      return true;
    });
  }, [busqueda, tabRegion]);

  if (!abierto) return null;

  const handleElegir = (zona: ZonaGeografica) => {
    onSeleccionarZona(zona);
    onCerrar();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-zinc-950 border border-cyan-500/40 rounded-3xl p-5 sm:p-7 shadow-[0_10px_50px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh] overflow-hidden space-y-4">
        {/* Glows de ambientación estética NeoFaro */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/60 shrink-0">
              <MapPin className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Elegir Localidad o Partido</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-bold hidden xs:inline">
                  🇦🇷 Argentina
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Ubicá tu barrio en el mapa sin necesidad de contar con GPS satelital.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCerrar}
            className="p-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Zona Actual Seleccionada (si existe) */}
        {zonaActualNombre && (
          <div className="p-3 bg-gradient-to-r from-violet-950/60 to-cyan-950/60 border border-cyan-500/50 rounded-2xl flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-cyan-300 font-bold truncate">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="truncate">Zona actual: <strong>{zonaActualNombre}</strong></span>
            </div>
            {onLimpiarZona && (
              <button
                type="button"
                onClick={() => {
                  onLimpiarZona();
                  onCerrar();
                }}
                className="text-[11px] text-zinc-400 hover:text-rose-400 underline cursor-pointer shrink-0"
              >
                Restablecer vista general
              </button>
            )}
          </div>
        )}

        {/* Input de Búsqueda en Vivo */}
        <div className="relative">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por localidad, partido o provincia (ej. Pilar, Banfield, Escobar, Rosario)..."
            className="w-full pl-10 pr-9 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all shadow-inner"
            autoFocus
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Tabs de Región / Zonas (visible cuando no se busca texto específico) */}
        {!busqueda && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            {REGIONES_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTabRegion(tab.id)}
                className={`py-1.5 px-3 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  tabRegion === tab.id
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60 ring-1 ring-cyan-400/40'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                }`}
              >
                {tab.nombre}
              </button>
            ))}
          </div>
        )}

        {/* Contenedor con Scroll para Resultados */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 max-h-[46vh] no-scrollbar">
          {/* SECCIÓN 1: Localidades con Comercios Registrados en NeoFaro */}
          {!busqueda && tabRegion === 'todos' && localidadesComercios.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                <span className="flex items-center gap-1 text-amber-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Localidades con comercios activos
                </span>
                <span className="text-[10px] text-zinc-500">Acceso directo</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {localidadesComercios.slice(0, 9).map((loc) => (
                  <button
                    key={loc.nombre}
                    type="button"
                    onClick={() =>
                      handleElegir({
                        nombre: loc.nombre,
                        tipo: 'localidad',
                        provincia: 'Buenos Aires',
                        latitud: loc.latitud,
                        longitud: loc.longitud,
                      })
                    }
                    className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-cyan-950/50 border border-zinc-800 hover:border-cyan-500/60 text-left transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-1.5 text-white font-bold text-xs group-hover:text-cyan-300 truncate">
                      <Store className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{loc.nombre}</span>
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1">
                      {loc.cantidad} {loc.cantidad === 1 ? 'comercio' : 'comercios'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 2: Resultados de Búsqueda Online Externa (si se escribió un término específico) */}
          {resultadosExternos.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>Resultados de búsqueda en Argentina:</span>
              </div>

              <div className="space-y-1.5">
                {resultadosExternos.map((res, idx) => (
                  <button
                    key={`ext-${idx}-${res.nombre}`}
                    type="button"
                    onClick={() => handleElegir(res)}
                    className="w-full p-2.5 rounded-xl bg-zinc-900/90 hover:bg-cyan-950/50 border border-zinc-800 hover:border-cyan-500/70 text-left transition-all flex items-center justify-between gap-2 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                          {res.nombre}
                        </p>
                        <p className="text-[10px] text-zinc-400 truncate">
                          {res.provincia || 'Argentina'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SECCIÓN 3: Lista de Zonas Precargadas Filtradas */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1 flex items-center justify-between">
              <span>{busqueda ? 'Lugares coincidentes:' : 'Selección rápida:'}</span>
              <span className="text-[10px] text-zinc-500 font-normal">{zonasFiltradas.length} zonas</span>
            </div>

            {zonasFiltradas.length === 0 && resultadosExternos.length === 0 && !buscandoExterna && (
              <div className="text-center py-6 px-4 bg-zinc-900/40 rounded-2xl border border-dashed border-zinc-800 text-xs text-zinc-400">
                No encontramos coincidencias exactas para &ldquo;{busqueda}&rdquo;. Probá con el nombre de la ciudad principal o partido.
              </div>
            )}

            <div className="space-y-1">
              {zonasFiltradas.map((zona) => {
                const esSeleccionada = zonaActualNombre === zona.nombre;
                return (
                  <button
                    key={`${zona.nombre}-${zona.provincia}`}
                    type="button"
                    onClick={() => handleElegir(zona)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 cursor-pointer group ${
                      esSeleccionada
                        ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-500/40'
                        : 'bg-zinc-900/70 hover:bg-zinc-800 border-zinc-800/80 hover:border-zinc-700 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center text-violet-400 group-hover:text-cyan-400 shrink-0">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                          {zona.nombre}
                        </p>
                        <p className="text-[10px] text-zinc-500 truncate">
                          {zona.tipo === 'barrio' ? 'Barrio' : zona.tipo === 'partido' ? 'Partido' : 'Localidad'} • {zona.provincia}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {esSeleccionada ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500 text-black font-bold">
                          Activa
                        </span>
                      ) : (
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-cyan-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="border-t border-zinc-800/80 pt-3 flex items-center justify-between text-[11px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>El mapa se centrará y ordenará los locales cercanos.</span>
          </span>
          <button
            type="button"
            onClick={onCerrar}
            className="text-xs text-zinc-400 hover:text-white font-semibold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
