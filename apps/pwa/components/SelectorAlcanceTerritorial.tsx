'use client';

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Building2,
  Layers,
  Flag,
  Globe,
  Plus,
  X,
  Check,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface SelectorAlcanceTerritorialProps {
  localidades: string[];
  partidos: string[];
  provincias: string[];
  enviosNacional: boolean;
  enviosExterior: boolean;
  alcanceInternacionalTipo?: 'todo_el_mundo' | 'latinoamerica' | 'paises_especificos';
  paises: string[];
  onChange: (nuevo: {
    localidades: string[];
    partidos: string[];
    provincias: string[];
    enviosNacional: boolean;
    enviosExterior: boolean;
    alcanceInternacionalTipo?: 'todo_el_mundo' | 'latinoamerica' | 'paises_especificos';
    paises: string[];
    descripcionGenerada: string;
  }) => void;
}

// Sugerencias comunes de localidades y barrios
const SUGERENCIAS_LOCALIDADES = [
  'Grand Bourg',
  'Pablo Nogués',
  'Los Polvorines',
  'San Miguel',
  'Don Torcuato',
  'Del Viso',
  'Tortuguitas',
  'Muñiz',
  'Bella Vista',
  'José C. Paz',
  'Boulogne',
  'Villa Adelina',
  'Palermo',
  'Belgrano',
  'Caballito',
];

// Sugerencias comunes de partidos y municipios
const SUGERENCIAS_PARTIDOS = [
  'Malvinas Argentinas',
  'San Miguel',
  'Escobar',
  'Tigre',
  'Pilar',
  'José C. Paz',
  'San Isidro',
  'Vicente López',
  'San Martín',
  'Morón',
  'Tres de Febrero',
  'Hurlingham',
  'Ituzaingó',
  'Moreno',
  'La Matanza',
  'Avellaneda',
  'Quilmes',
  'La Plata',
];

// 24 Provincias de Argentina
const PROVINCIAS_ARGENTINA = [
  'Buenos Aires',
  'Ciudad de Buenos Aires (CABA)',
  'Córdoba',
  'Santa Fe',
  'Mendoza',
  'Tucumán',
  'Entre Ríos',
  'Salta',
  'Misiones',
  'Chaco',
  'Corrientes',
  'Santiago del Estero',
  'San Juan',
  'Jujuy',
  'Río Negro',
  'Neuquén',
  'Formosa',
  'Chubut',
  'San Luis',
  'Catamarca',
  'La Rioja',
  'La Pampa',
  'Santa Cruz',
  'Tierra del Fuego',
];

// Sugerencias comunes de países
const SUGERENCIAS_PAISES = [
  'Brasil',
  'Colombia',
  'Uruguay',
  'Chile',
  'Paraguay',
  'Bolivia',
  'Perú',
  'México',
  'Estados Unidos',
  'España',
  'Ecuador',
];

export default function SelectorAlcanceTerritorial({
  localidades = [],
  partidos = [],
  provincias = [],
  enviosNacional = false,
  enviosExterior = false,
  alcanceInternacionalTipo = 'paises_especificos',
  paises = [],
  onChange,
}: SelectorAlcanceTerritorialProps) {
  const [nuevaLocalidad, setNuevaLocalidad] = useState('');
  const [nuevoPartido, setNuevoPartido] = useState('');
  const [busquedaProvincia, setBusquedaProvincia] = useState('');
  const [nuevoPais, setNuevoPais] = useState('');
  const [seccionAbierta, setSeccionAbierta] = useState<'todas' | 'localidades' | 'partidos' | 'provincias' | 'internacional'>('todas');

  // Función para generar la descripción legible en tiempo real
  const emitirCambio = (
    nextLoc: string[],
    nextPart: string[],
    nextProv: string[],
    nextNac: boolean,
    nextExt: boolean,
    nextExtTipo: 'todo_el_mundo' | 'latinoamerica' | 'paises_especificos',
    nextPaises: string[]
  ) => {
    const partes: string[] = [];

    if (nextLoc.length > 0) {
      partes.push(`Localidades: ${nextLoc.join(', ')}`);
    }
    if (nextPart.length > 0) {
      partes.push(`Partidos: ${nextPart.join(', ')}`);
    }
    if (nextProv.length > 0) {
      partes.push(`Provincias: ${nextProv.join(', ')}`);
    }
    if (nextNac) {
      partes.push('Todo el país (Argentina)');
    }
    if (nextExt) {
      if (nextExtTipo === 'todo_el_mundo') {
        partes.push('Internacional (Todo el mundo)');
      } else if (nextExtTipo === 'latinoamerica') {
        partes.push('Internacional (Latinoamérica)');
      } else if (nextPaises.length > 0) {
        partes.push(`Internacional: ${nextPaises.join(', ')}`);
      } else {
        partes.push('Envíos internacionales');
      }
    }

    const descripcionGenerada = partes.length > 0 ? partes.join(' • ') : '';

    onChange({
      localidades: nextLoc,
      partidos: nextPart,
      provincias: nextProv,
      enviosNacional: nextNac,
      enviosExterior: nextExt,
      alcanceInternacionalTipo: nextExtTipo,
      paises: nextPaises,
      descripcionGenerada,
    });
  };

  // --- LOCALIDADES ---
  const toggleLocalidad = (loc: string) => {
    const limpia = loc.trim();
    if (!limpia) return;
    const existe = localidades.some((l) => l.toLowerCase() === limpia.toLowerCase());
    const next = existe
      ? localidades.filter((l) => l.toLowerCase() !== limpia.toLowerCase())
      : [...localidades, limpia];
    emitirCambio(next, partidos, provincias, enviosNacional, enviosExterior, alcanceInternacionalTipo, paises);
  };

  const handleAgregarLocalidadManual = () => {
    if (!nuevaLocalidad.trim()) return;
    toggleLocalidad(nuevaLocalidad.trim());
    setNuevaLocalidad('');
  };

  // --- PARTIDOS ---
  const togglePartido = (part: string) => {
    const limpia = part.trim();
    if (!limpia) return;
    const existe = partidos.some((p) => p.toLowerCase() === limpia.toLowerCase());
    const next = existe
      ? partidos.filter((p) => p.toLowerCase() !== limpia.toLowerCase())
      : [...partidos, limpia];
    emitirCambio(localidades, next, provincias, enviosNacional, enviosExterior, alcanceInternacionalTipo, paises);
  };

  const handleAgregarPartidoManual = () => {
    if (!nuevoPartido.trim()) return;
    togglePartido(nuevoPartido.trim());
    setNuevoPartido('');
  };

  // --- PROVINCIAS ---
  const toggleProvincia = (prov: string) => {
    const limpia = prov.trim();
    if (!limpia) return;
    const existe = provincias.some((p) => p.toLowerCase() === limpia.toLowerCase());
    const next = existe
      ? provincias.filter((p) => p.toLowerCase() !== limpia.toLowerCase())
      : [...provincias, limpia];
    emitirCambio(localidades, partidos, next, enviosNacional, enviosExterior, alcanceInternacionalTipo, paises);
  };

  const provinciasFiltradas = useMemo(() => {
    if (!busquedaProvincia.trim()) return PROVINCIAS_ARGENTINA;
    const q = busquedaProvincia.toLowerCase();
    return PROVINCIAS_ARGENTINA.filter((p) => p.toLowerCase().includes(q));
  }, [busquedaProvincia]);

  // --- NACIONAL ---
  const toggleNacional = (valor: boolean) => {
    emitirCambio(localidades, partidos, provincias, valor, enviosExterior, alcanceInternacionalTipo, paises);
  };

  // --- EXTERIOR / INTERNACIONAL ---
  const toggleExterior = (valor: boolean) => {
    emitirCambio(localidades, partidos, provincias, enviosNacional, valor, alcanceInternacionalTipo, paises);
  };

  const setTipoInternacional = (tipo: 'todo_el_mundo' | 'latinoamerica' | 'paises_especificos') => {
    emitirCambio(localidades, partidos, provincias, enviosNacional, enviosExterior, tipo, paises);
  };

  const togglePais = (paisItem: string) => {
    const limpia = paisItem.trim();
    if (!limpia) return;
    const existe = paises.some((p) => p.toLowerCase() === limpia.toLowerCase());
    const next = existe
      ? paises.filter((p) => p.toLowerCase() !== limpia.toLowerCase())
      : [...paises, limpia];
    emitirCambio(localidades, partidos, provincias, enviosNacional, enviosExterior, alcanceInternacionalTipo, next);
  };

  const handleAgregarPaisManual = () => {
    if (!nuevoPais.trim()) return;
    togglePais(nuevoPais.trim());
    setNuevoPais('');
  };

  // Cantidad total de destinos seleccionados
  const totalDestinos =
    localidades.length +
    partidos.length +
    provincias.length +
    (enviosNacional ? 1 : 0) +
    (enviosExterior ? 1 : 0) +
    (enviosExterior && alcanceInternacionalTipo === 'paises_especificos' ? paises.length : 0);

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-zinc-950/90 border border-cyan-500/30 space-y-4 shadow-xl animate-in fade-in duration-200">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
        <div>
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Zonas de Envíos y Distribución Territorial
          </span>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Selecciona una o más zonas hacia donde envías tus productos (localidades, partidos, provincias, todo el país o al exterior).
          </p>
        </div>
        {totalDestinos > 0 && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 w-fit shrink-0">
            ✓ {totalDestinos} destino{totalDestinos !== 1 ? 's' : ''} configurado{totalDestinos !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* 1. LOCALIDADES O BARRIOS ESPECÍFICOS */}
      <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>1. Localidades o Barrios Específicos</span>
          </label>
          {localidades.length > 0 && (
            <span className="text-[10px] font-mono text-cyan-400 font-bold">
              {localidades.length} seleccionada{localidades.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Input manual */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nuevaLocalidad}
            onChange={(e) => setNuevaLocalidad(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAgregarLocalidadManual();
              }
            }}
            placeholder="Escribe una localidad o barrio (ej. Grand Bourg, Pablo Nogués)..."
            className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
          />
          <button
            type="button"
            onClick={handleAgregarLocalidadManual}
            className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Chips sugeridos rápidos */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-zinc-400 font-medium mr-1">Sugerencias:</span>
          {SUGERENCIAS_LOCALIDADES.map((loc) => {
            const activa = localidades.some((l) => l.toLowerCase() === loc.toLowerCase());
            return (
              <button
                key={loc}
                type="button"
                onClick={() => toggleLocalidad(loc)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                  activa
                    ? 'bg-cyan-500 text-black border-cyan-400 font-bold shadow-sm shadow-cyan-500/20'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                {activa ? '✓ ' : '+ '}
                {loc}
              </button>
            );
          })}
        </div>

        {/* Badges de seleccionadas */}
        {localidades.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/60">
            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider">Activas:</span>
            {localidades.map((loc) => (
              <span
                key={loc}
                className="px-2.5 py-0.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in"
              >
                <span>{loc}</span>
                <button
                  type="button"
                  onClick={() => toggleLocalidad(loc)}
                  className="hover:text-white text-cyan-400 font-bold cursor-pointer"
                  title="Quitar"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 2. PARTIDOS O MUNICIPIOS */}
      <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>2. Partidos o Municipios</span>
          </label>
          {partidos.length > 0 && (
            <span className="text-[10px] font-mono text-indigo-400 font-bold">
              {partidos.length} seleccionado{partidos.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Input manual */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={nuevoPartido}
            onChange={(e) => setNuevoPartido(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAgregarPartidoManual();
              }
            }}
            placeholder="Escribe un partido o municipio (ej. San Miguel, Malvinas Argentinas, Escobar)..."
            className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleAgregarPartidoManual}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar</span>
          </button>
        </div>

        {/* Chips sugeridos rápidos */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[10px] text-zinc-400 font-medium mr-1">Sugerencias:</span>
          {SUGERENCIAS_PARTIDOS.map((part) => {
            const activo = partidos.some((p) => p.toLowerCase() === part.toLowerCase());
            return (
              <button
                key={part}
                type="button"
                onClick={() => togglePartido(part)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                  activo
                    ? 'bg-indigo-500 text-white border-indigo-400 font-bold shadow-sm shadow-indigo-500/20'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                {activo ? '✓ ' : '+ '}
                {part}
              </button>
            );
          })}
        </div>

        {/* Badges de seleccionados */}
        {partidos.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/60">
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-wider">Activos:</span>
            {partidos.map((part) => (
              <span
                key={part}
                className="px-2.5 py-0.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in"
              >
                <span>{part}</span>
                <button
                  type="button"
                  onClick={() => togglePartido(part)}
                  className="hover:text-white text-indigo-400 font-bold cursor-pointer"
                  title="Quitar"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 3. PROVINCIAS DE ARGENTINA */}
      <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>3. Provincias Cubiertas</span>
          </label>
          {provincias.length > 0 && (
            <span className="text-[10px] font-mono text-amber-400 font-bold">
              {provincias.length} provincia{provincias.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Buscador de provincias */}
        <input
          type="text"
          value={busquedaProvincia}
          onChange={(e) => setBusquedaProvincia(e.target.value)}
          placeholder="Filtrar provincias (ej. Buenos Aires, Córdoba, Santa Fe)..."
          className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
        />

        {/* Listado de provincias interactivo */}
        <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1">
          {provinciasFiltradas.map((prov) => {
            const activa = provincias.some((p) => p.toLowerCase() === prov.toLowerCase());
            return (
              <button
                key={prov}
                type="button"
                onClick={() => toggleProvincia(prov)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  activa
                    ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-sm shadow-amber-500/20'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                {activa ? '✓ ' : ''}
                {prov}
              </button>
            );
          })}
        </div>

        {/* Badges de seleccionadas */}
        {provincias.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/60">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Activas:</span>
            {provincias.map((prov) => (
              <span
                key={prov}
                className="px-2.5 py-0.5 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in"
              >
                <span>{prov}</span>
                <button
                  type="button"
                  onClick={() => toggleProvincia(prov)}
                  className="hover:text-white text-amber-400 font-bold cursor-pointer"
                  title="Quitar"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. ALCANCE NACIONAL (ARGENTINA COMPLETA) */}
      <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        <label
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
            enviosNacional
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Flag className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-white block text-xs">
                4. Envíos a todo el País (Argentina Completa)
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Despachos a cualquier punto de Argentina mediante Correo Argentino, Andreani, OCA o encomiendas.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={enviosNacional}
            onChange={(e) => toggleNacional(e.target.checked)}
            className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
          />
        </label>
      </div>

      {/* 5. ALCANCE INTERNACIONAL / AL EXTERIOR */}
      <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <label
          className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
            enviosExterior
              ? 'bg-purple-950/60 border-purple-500/60 text-purple-200'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-purple-400 shrink-0" />
            <div>
              <span className="font-bold text-white block text-xs">
                5. Envíos al Exterior (Internacional)
              </span>
              <span className="text-[11px] text-zinc-400 block mt-0.5">
                Exportaciones, courier y paquetería internacional hacia otros países.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={enviosExterior}
            onChange={(e) => toggleExterior(e.target.checked)}
            className="w-4 h-4 accent-purple-500 rounded cursor-pointer"
          />
        </label>

        {/* Sub-opciones cuando está habilitado el exterior */}
        {enviosExterior && (
          <div className="p-3 rounded-xl bg-zinc-950 border border-purple-500/30 space-y-3 animate-in fade-in duration-150">
            <span className="text-[11px] font-bold text-zinc-300 block">
              Modalidad de Envíos Internacionales:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipoInternacional('todo_el_mundo')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  alcanceInternacionalTipo === 'todo_el_mundo'
                    ? 'bg-purple-900/50 border-purple-400 text-white font-bold ring-1 ring-purple-400/40'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-xs">🌍 Todo el Mundo</span>
                <span className="text-[10px] text-zinc-400">Sin límite de país</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoInternacional('latinoamerica')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  alcanceInternacionalTipo === 'latinoamerica'
                    ? 'bg-purple-900/50 border-purple-400 text-white font-bold ring-1 ring-purple-400/40'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-xs">🌎 Toda Latinoamérica</span>
                <span className="text-[10px] text-zinc-400">América Latina completa</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoInternacional('paises_especificos')}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  alcanceInternacionalTipo === 'paises_especificos'
                    ? 'bg-purple-900/50 border-purple-400 text-white font-bold ring-1 ring-purple-400/40'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <span className="text-xs">🌐 Países Específicos</span>
                <span className="text-[10px] text-zinc-400">Seleccionar uno o más</span>
              </button>
            </div>

            {/* Selector de Países Específicos */}
            {alcanceInternacionalTipo === 'paises_especificos' && (
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nuevoPais}
                    onChange={(e) => setNuevoPais(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAgregarPaisManual();
                      }
                    }}
                    placeholder="Escribe un país (ej. Brasil, Colombia, Estados Unidos)..."
                    className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAgregarPaisManual}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                {/* Sugerencias de países */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-zinc-400 font-medium mr-1">Sugerencias:</span>
                  {SUGERENCIAS_PAISES.map((p) => {
                    const activo = paises.some((item) => item.toLowerCase() === p.toLowerCase());
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePais(p)}
                        className={`px-2.5 py-0.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer border ${
                          activo
                            ? 'bg-purple-500 text-white border-purple-400 font-bold shadow-sm shadow-purple-500/20'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                        }`}
                      >
                        {activo ? '✓ ' : '+ '}
                        {p}
                      </button>
                    );
                  })}
                </div>

                {/* Badges de países seleccionados */}
                {paises.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-800/60">
                    <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Países:</span>
                    {paises.map((p) => (
                      <span
                        key={p}
                        className="px-2.5 py-0.5 rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-1.5 animate-in fade-in"
                      >
                        <span>{p}</span>
                        <button
                          type="button"
                          onClick={() => togglePais(p)}
                          className="hover:text-white text-purple-400 font-bold cursor-pointer"
                          title="Quitar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* RESUMEN DE COBERTURA EN TIEMPO REAL */}
      {totalDestinos > 0 ? (
        <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 text-xs text-cyan-200 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-white block">Resumen de Envíos Configurados:</span>
            <div className="text-[11px] leading-relaxed text-zinc-300">
              {localidades.length > 0 && (
                <div>
                  <strong className="text-cyan-400">Localidades:</strong> {localidades.join(', ')}
                </div>
              )}
              {partidos.length > 0 && (
                <div>
                  <strong className="text-indigo-400">Partidos / Municipios:</strong> {partidos.join(', ')}
                </div>
              )}
              {provincias.length > 0 && (
                <div>
                  <strong className="text-amber-400">Provincias:</strong> {provincias.join(', ')}
                </div>
              )}
              {enviosNacional && (
                <div>
                  <strong className="text-emerald-400">🇦🇷 Cobertura Nacional:</strong> Todo el país
                </div>
              )}
              {enviosExterior && (
                <div>
                  <strong className="text-purple-400">🌎 Envíos al Exterior:</strong>{' '}
                  {alcanceInternacionalTipo === 'todo_el_mundo'
                    ? 'Todo el mundo'
                    : alcanceInternacionalTipo === 'latinoamerica'
                    ? 'Toda Latinoamérica'
                    : paises.length > 0
                    ? paises.join(', ')
                    : 'Internacional'}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-400 flex items-center gap-2">
          <Info className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>
            Opcional: Si haces envíos más allá de tu zona inmediata, marca las localidades, partidos, provincias o países donde operas.
          </span>
        </div>
      )}
    </div>
  );
}
