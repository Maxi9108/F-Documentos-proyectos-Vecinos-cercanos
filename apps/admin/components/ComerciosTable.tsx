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
  AlertTriangle,
  Palmtree,
  Clock,
  Bike,
  ShieldAlert,
  Activity,
  Sparkles,
} from 'lucide-react';

interface ComerciosTableProps {
  comercios: Comercio[];
  onEdit: (comercio: Comercio) => void;
  onDelete: (comercio: Comercio) => void;
  onAprobar?: (comercio: Comercio) => void;
  onRechazar?: (comercio: Comercio) => void;
  onToggleEstado: (id: string, nuevoEstado: boolean) => void;
  onLevantarCuarentena?: (comercio: Comercio) => void;
  isUpdatingEstadoId: string | null;
}

export default function ComerciosTable({
  comercios,
  onEdit,
  onDelete,
  onAprobar,
  onRechazar,
  onToggleEstado,
  onLevantarCuarentena,
  isUpdatingEstadoId,
}: ComerciosTableProps) {
  const [busqueda, setBusqueda] = useState('');
  const [rubroFiltro, setRubroFiltro] = useState('Todos');
  const [estadoFiltro, setEstadoFiltro] = useState<
    'todos' | 'abiertos' | 'cerrados' | 'pendientes' | 'rechazados' | 'cuarentena' | 'emergencia' | 'inactivos' | 'pulso_pendiente'
  >('todos');

  // Obtener rubros únicos disponibles
  const rubrosDisponibles = useMemo(() => {
    const rubros = new Set<string>();
    comercios.forEach((c) => rubros.add(c.rubro));
    return ['Todos', ...Array.from(rubros).sort()];
  }, [comercios]);

  // Métricas operativas de certeza barrial
  const totalPendientes = useMemo(
    () => comercios.filter((c) => c.estado_aprobacion === 'pendiente').length,
    [comercios]
  );
  const totalRechazados = useMemo(
    () => comercios.filter((c) => c.estado_aprobacion === 'rechazado').length,
    [comercios]
  );
  const totalCuarentena = useMemo(
    () => comercios.filter((c) => Boolean(c.en_cuarentena)).length,
    [comercios]
  );
  const totalEmergencia = useMemo(
    () => comercios.filter((c) => Boolean(c.cerrado_momentaneo)).length,
    [comercios]
  );
  const totalInactivos = useMemo(
    () =>
      comercios.filter(
        (c) =>
          Boolean(c.oculto_por_inactividad) ||
          Boolean(c.ticket_baja_definitiva) ||
          (Boolean(c.en_vacaciones) && c.modalidad_vacaciones === 'descanso_total')
      ).length,
    [comercios]
  );
  const totalPulsoPendiente = useMemo(
    () =>
      comercios.filter(
        (c) => c.pulso_semanal_estado === 'alerta' || c.pulso_semanal_estado === 'pendiente'
      ).length,
    [comercios]
  );

  const tieneAlertasOperativas =
    totalPendientes > 0 || totalCuarentena > 0 || totalEmergencia > 0 || totalInactivos > 0 || totalPulsoPendiente > 0;

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
        (estadoFiltro === 'abiertos' && c.esta_abierto && !c.en_cuarentena && !c.cerrado_momentaneo) ||
        (estadoFiltro === 'cerrados' && !c.esta_abierto && !c.en_cuarentena) ||
        (estadoFiltro === 'pendientes' && c.estado_aprobacion === 'pendiente') ||
        (estadoFiltro === 'rechazados' && c.estado_aprobacion === 'rechazado') ||
        (estadoFiltro === 'cuarentena' && Boolean(c.en_cuarentena)) ||
        (estadoFiltro === 'emergencia' && Boolean(c.cerrado_momentaneo)) ||
        (estadoFiltro === 'inactivos' &&
          (Boolean(c.oculto_por_inactividad) ||
            Boolean(c.ticket_baja_definitiva) ||
            (Boolean(c.en_vacaciones) && c.modalidad_vacaciones === 'descanso_total'))) ||
        (estadoFiltro === 'pulso_pendiente' &&
          (c.pulso_semanal_estado === 'alerta' || c.pulso_semanal_estado === 'pendiente'));

      return coincideBusqueda && coincideRubro && coincideEstado;
    });
  }, [comercios, busqueda, rubroFiltro, estadoFiltro]);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden space-y-0">
      {/* BANDEJA DE CERTEZA BARRIAL Y ALERTAS OPERATIVAS */}
      {tieneAlertasOperativas && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-b border-zinc-800 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-white tracking-wide">
                  Bandeja de Certeza Barrial & Alertas Operativas
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Eventos en tiempo real que requieren atención de moderación o soporte
                </p>
              </div>
            </div>
            {estadoFiltro !== 'todos' && (
              <button
                type="button"
                onClick={() => setEstadoFiltro('todos')}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer"
              >
                Ver todos
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {totalCuarentena > 0 && (
              <button
                type="button"
                onClick={() => setEstadoFiltro('cuarentena')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  estadoFiltro === 'cuarentena'
                    ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                    : 'bg-rose-950/70 hover:bg-rose-900/80 text-rose-200 border border-rose-600/60'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>{totalCuarentena} en Cuarentena Preventiva</span>
              </button>
            )}

            {totalEmergencia > 0 && (
              <button
                type="button"
                onClick={() => setEstadoFiltro('emergencia')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  estadoFiltro === 'emergencia'
                    ? 'bg-amber-600 text-white ring-2 ring-amber-400'
                    : 'bg-amber-950/70 hover:bg-amber-900/80 text-amber-200 border border-amber-600/60'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{totalEmergencia} Cierres por Emergencia</span>
              </button>
            )}

            {totalInactivos > 0 && (
              <button
                type="button"
                onClick={() => setEstadoFiltro('inactivos')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  estadoFiltro === 'inactivos'
                    ? 'bg-sky-600 text-white ring-2 ring-sky-400'
                    : 'bg-sky-950/70 hover:bg-sky-900/80 text-sky-200 border border-sky-600/60'
                }`}
              >
                <Palmtree className="w-3.5 h-3.5 text-sky-400" />
                <span>{totalInactivos} Inactivos / Descanso total</span>
              </button>
            )}

            {totalPulsoPendiente > 0 && (
              <button
                type="button"
                onClick={() => setEstadoFiltro('pulso_pendiente')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                  estadoFiltro === 'pulso_pendiente'
                    ? 'bg-violet-600 text-white ring-2 ring-violet-400'
                    : 'bg-violet-950/70 hover:bg-violet-900/80 text-violet-200 border border-violet-600/60'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-violet-400" />
                <span>{totalPulsoPendiente} Pulso semanal pendiente</span>
              </button>
            )}
          </div>
        </div>
      )}

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

          <div className="flex flex-wrap items-center gap-2.5">
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
            <div className="flex flex-wrap bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700">
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
              <button
                type="button"
                onClick={() => setEstadoFiltro('pendientes')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  estadoFiltro === 'pendientes'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : totalPendientes > 0
                    ? 'text-amber-500 font-extrabold bg-amber-500/10 hover:bg-amber-500/20'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <span>Pendientes</span>
                {totalPendientes > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-black animate-pulse">
                    {totalPendientes}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setEstadoFiltro('rechazados')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  estadoFiltro === 'rechazados'
                    ? 'bg-rose-700 text-white shadow-xs font-bold'
                    : totalRechazados > 0
                    ? 'text-rose-400 font-bold'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <span>Rechazados</span>
                {totalRechazados > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-600 text-white">
                    {totalRechazados}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setEstadoFiltro('cuarentena')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  estadoFiltro === 'cuarentena'
                    ? 'bg-rose-600 text-white shadow-xs font-bold'
                    : totalCuarentena > 0
                    ? 'text-rose-500 font-extrabold bg-rose-500/10 hover:bg-rose-500/20'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <span>Cuarentena</span>
                {totalCuarentena > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {totalCuarentena}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setEstadoFiltro('emergencia')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  estadoFiltro === 'emergencia'
                    ? 'bg-amber-600 text-white shadow-xs font-bold'
                    : totalEmergencia > 0
                    ? 'text-amber-500 font-bold'
                    : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <span>Emergencia</span>
                {totalEmergencia > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-amber-500 text-black">
                    {totalEmergencia}
                  </span>
                )}
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
                const esCuarentena = Boolean(comercio.en_cuarentena);

                return (
                  <tr
                    key={comercio.id}
                    className={`transition-colors group ${
                      esCuarentena
                        ? 'bg-rose-50/90 dark:bg-rose-950/40 border-l-4 border-l-rose-500 hover:bg-rose-100/90 dark:hover:bg-rose-950/60'
                        : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* Nombre e ID */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="font-semibold text-zinc-900 dark:text-white group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                        <span>{comercio.nombre}</span>
                        {comercio.onboarding_verificado && (
                          <span className="text-emerald-500" title="Verificado presencialmente">
                            <Sparkles className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      {/* Estado de Aprobación */}
                      {comercio.estado_aprobacion === 'pendiente' && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ⏳ Pendiente de moderación
                          </span>
                        </div>
                      )}
                      {comercio.estado_aprobacion === 'rechazado' && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            ✕ Rechazado {comercio.motivo_rechazo ? `(${comercio.motivo_rechazo})` : ''}
                          </span>
                        </div>
                      )}

                      {/* Alerta de Cuarentena en Rojo */}
                      {esCuarentena && (
                        <div className="mt-1 space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-rose-600 text-white animate-pulse">
                            🚨 EN CUARENTENA ({comercio.strikes_reportes || 3} strikes)
                          </span>
                          {comercio.motivo_cuarentena && (
                            <p className="text-[10px] text-rose-700 dark:text-rose-300 font-medium leading-tight">
                              {comercio.motivo_cuarentena}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Cierre de Emergencia */}
                      {comercio.cerrado_momentaneo && (
                        <div className="mt-1 space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-600 text-white">
                            <AlertTriangle className="w-3 h-3 text-amber-200" />
                            <span>CIERRE EMERGENCIA ({comercio.contador_urgencias_mes || 1}/3 este mes)</span>
                          </span>
                          {comercio.motivo_cierre_momentaneo && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-300 font-medium leading-tight">
                              {comercio.motivo_cierre_momentaneo}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Vacaciones */}
                      {comercio.en_vacaciones && (
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              comercio.modalidad_vacaciones === 'descanso_total'
                                ? 'bg-sky-800 text-white'
                                : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                            }`}
                          >
                            <Palmtree className="w-3 h-3" />
                            <span>
                              Vacaciones {comercio.modalidad_vacaciones === 'descanso_total' ? '(Descanso Total)' : '(Con aviso)'}
                            </span>
                          </span>
                        </div>
                      )}

                      {/* Inactividad prolongada */}
                      {comercio.oculto_por_inactividad && (
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-400" />
                            <span>Inactivo (+60 días)</span>
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Rubro */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                          {comercio.rubro}
                        </span>
                        {comercio.tipo_atencion === 'solo_envio' && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800"
                            title="Modalidad exclusiva de envíos a domicilio"
                          >
                            <Bike className="w-3 h-3" />
                            <span>Envíos</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Dirección y Contacto */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                          <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span>
                            {comercio.tipo_atencion === 'solo_envio'
                              ? 'Zona de entrega barrial (Dirección privada)'
                              : comercio.direccion}
                          </span>
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
                      {esCuarentena ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-sm shadow-rose-950/50">
                          <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                          En Cuarentena
                        </span>
                      ) : (
                        <div className="space-y-1">
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

                          {comercio.pulso_semanal_estado && comercio.pulso_semanal_estado !== 'normal' && (
                            <div>
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  comercio.pulso_semanal_estado === 'alerta'
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                }`}
                              >
                                <Clock className="w-2.5 h-2.5" />
                                <span>Pulso {comercio.pulso_semanal_estado}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="py-3.5 px-4 text-right pr-4 sm:pr-6 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {esCuarentena && onLevantarCuarentena && (
                          <button
                            type="button"
                            onClick={() => onLevantarCuarentena(comercio)}
                            className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1 cursor-pointer"
                            title="Levantar cuarentena y volver a habilitar en el mapa"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Liberar Cuarentena</span>
                          </button>
                        )}
                        {comercio.estado_aprobacion === 'pendiente' && (
                          <>
                            {onAprobar && (
                              <button
                                type="button"
                                onClick={() => onAprobar(comercio)}
                                className="py-1 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                title="Aprobar comercio"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aprobar</span>
                              </button>
                            )}
                            {onRechazar && (
                              <button
                                type="button"
                                onClick={() => onRechazar(comercio)}
                                className="py-1 px-2.5 rounded-xl bg-zinc-800 hover:bg-rose-950/60 text-zinc-300 hover:text-rose-300 border border-zinc-700 hover:border-rose-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Rechazar solicitud"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Rechazar</span>
                              </button>
                            )}
                          </>
                        )}
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
