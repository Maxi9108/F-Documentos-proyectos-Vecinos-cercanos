'use client';

import React, { useState, useMemo } from 'react';
import { Comercio } from '@/types/comercio';
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Store,
  X,
} from 'lucide-react';

interface ComerciosTableProps {
  comercios: Comercio[];
  onEdit: (comercio: Comercio) => void;
  onDelete: (comercio: Comercio) => void;
  onToggleEstado: (id: string, nuevoEstado: boolean) => void;
  isUpdatingEstadoId: string | null;
}

export default function ComerciosTable({
  comercios,
  onEdit,
  onDelete,
  onToggleEstado,
  isUpdatingEstadoId,
}: ComerciosTableProps) {
  const [busqueda, setBusqueda] = useState('');
  const [rubroFiltro, setRubroFiltro] = useState('Todos');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'abiertos' | 'cerrados'>('todos');

  // Obtener rubros únicos disponibles
  const rubrosDisponibles = useMemo(() => {
    const rubros = new Set<string>();
    comercios.forEach((c) => rubros.add(c.rubro));
    return ['Todos', ...Array.from(rubros).sort()];
  }, [comercios]);

  // Filtrado reactivo
  const comerciosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    return comercios.filter((c) => {
      const coincideBusqueda =
        query === '' ||
        c.nombre.toLowerCase().includes(query) ||
        c.rubro.toLowerCase().includes(query) ||
        c.direccion.toLowerCase().includes(query) ||
        (c.telefono && c.telefono.toLowerCase().includes(query));

      const coincideRubro = rubroFiltro === 'Todos' || c.rubro === rubroFiltro;

      const coincideEstado =
        estadoFiltro === 'todos' ||
        (estadoFiltro === 'abiertos' && c.esta_abierto) ||
        (estadoFiltro === 'cerrados' && !c.esta_abierto);

      return coincideBusqueda && coincideRubro && coincideEstado;
    });
  }, [comercios, busqueda, rubroFiltro, estadoFiltro]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800/80 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, rubro, dirección o teléfono..."
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {/* Filtro por Rubro */}
            <div className="relative">
              <select
                value={rubroFiltro}
                onChange={(e) => setRubroFiltro(e.target.value)}
                className="px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {rubrosDisponibles.map((r) => (
                  <option key={r} value={r}>
                    {r === 'Todos' ? 'Todos los rubros' : r}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro por Estado */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => setEstadoFiltro('todos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  estadoFiltro === 'todos'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setEstadoFiltro('abiertos')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  estadoFiltro === 'abiertos'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                Abiertos
              </button>
              <button
                type="button"
                onClick={() => setEstadoFiltro('cerrados')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  estadoFiltro === 'cerrados'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                Cerrados
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Comercios */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-zinc-50/70 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider font-semibold">
              <th className="py-3 px-4 sm:px-6">Comercio</th>
              <th className="py-3 px-4">Rubro</th>
              <th className="py-3 px-4">Ubicación & Teléfono</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-right pr-4 sm:pr-6">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
            {comerciosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <div className="max-w-xs mx-auto text-center space-y-2">
                    <Store className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700" />
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                      No se encontraron resultados
                    </p>
                    <p className="text-xs text-zinc-400">
                      Modifica los filtros o agrega un nuevo comercio para comenzar.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              comerciosFiltrados.map((comercio) => {
                const isChanging = isUpdatingEstadoId === comercio.id;
                return (
                  <tr
                    key={comercio.id}
                    className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors group"
                  >
                    {/* Nombre e ID */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                        {comercio.nombre}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono truncate max-w-[140px] sm:max-w-xs" title={comercio.id}>
                        {comercio.id}
                      </div>
                    </td>

                    {/* Rubro */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                        {comercio.rubro}
                      </span>
                    </td>

                    {/* Dirección y Contacto */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>{comercio.direccion}</span>
                        </div>
                        {comercio.telefono && (
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                            <Phone className="w-3 h-3 text-zinc-400 shrink-0" />
                            <span>{comercio.telefono}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-indigo-500 font-mono">
                          {comercio.latitud.toFixed(4)}, {comercio.longitud.toFixed(4)}
                        </div>
                      </div>
                    </td>

                    {/* Estado con Toggle interactivo de un clic */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onToggleEstado(comercio.id, !comercio.esta_abierto)}
                        disabled={isChanging}
                        title="Haz clic para alternar estado"
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all active:scale-95 ${
                          comercio.esta_abierto
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                        } ${isChanging ? 'opacity-50 cursor-wait' : ''}`}
                      >
                        {comercio.esta_abierto ? (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Abierto
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                            Cerrado
                          </>
                        )}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right pr-4 sm:pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(comercio)}
                          title="Editar comercio"
                          className="p-2 text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(comercio)}
                          title="Eliminar comercio"
                          className="p-2 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pie de tabla con conteo */}
      <div className="px-6 py-3.5 bg-zinc-50/50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
        <span>
          Mostrando <strong className="text-zinc-900 dark:text-white">{comerciosFiltrados.length}</strong> de {comercios.length} comercios
        </span>
        {comerciosFiltrados.length !== comercios.length && (
          <button
            type="button"
            onClick={() => {
              setBusqueda('');
              setRubroFiltro('Todos');
              setEstadoFiltro('todos');
            }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
