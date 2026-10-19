'use client';

import React, { useState, useEffect } from 'react';
import {
  HorariosConfig,
  HorarioDia,
  HorarioTurno,
  DiaSemana,
  HorarioEspecialFecha,
} from '@/types/comercio';
import {
  esHorarioTrasnoche,
  formatearHorariosLegibles,
  obtenerHorariosConfigPorDefecto,
  formatearFechaISO,
} from '@/lib/horarios';
import {
  Clock,
  Moon,
  Sun,
  Calendar,
  Check,
  AlertCircle,
  Sparkles,
  CalendarPlus,
  CalendarClock,
  Trash2,
  CalendarDays,
  Plus,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SelectorHorariosAvanzadosProps {
  value?: HorariosConfig;
  onChange: (config: HorariosConfig, resumenTexto: string) => void;
}

const DIAS_ORDEN: { clave: DiaSemana; etiqueta: string }[] = [
  { clave: 'lunes', etiqueta: 'Lunes' },
  { clave: 'martes', etiqueta: 'Martes' },
  { clave: 'miercoles', etiqueta: 'Miércoles' },
  { clave: 'jueves', etiqueta: 'Jueves' },
  { clave: 'viernes', etiqueta: 'Viernes' },
  { clave: 'sabado', etiqueta: 'Sábado' },
  { clave: 'domingo', etiqueta: 'Domingo' },
];

export default function SelectorHorariosAvanzados({
  value,
  onChange,
}: SelectorHorariosAvanzadosProps) {
  const [config, setConfig] = useState<HorariosConfig>(() => {
    return value || obtenerHorariosConfigPorDefecto();
  });

  // Estado para programar una fecha especial anticipada
  const [mostrarFormFecha, setMostrarFormFecha] = useState(false);
  const [fechaInput, setFechaInput] = useState('');
  const [tipoInput, setTipoInput] = useState<'cerrado' | 'horario_especial'>('cerrado');
  const [motivoInput, setMotivoInput] = useState('');
  const [turnosEspeciales, setTurnosEspeciales] = useState<HorarioTurno[]>([
    { abre: '09:00', cierra: '13:00', esTrasnoche: false },
  ]);
  const [tieneDosTurnosEspecial, setTieneDosTurnosEspecial] = useState(false);

  // Sincronizar si cambia el value externo (ej: cuando carga desde Supabase)
  useEffect(() => {
    if (value && JSON.stringify(value) !== JSON.stringify(config)) {
      setConfig(value);
    }
  }, [value]);

  // Notificar al padre cada vez que cambie config
  useEffect(() => {
    const resumen = formatearHorariosLegibles(config);
    onChange({ ...config, resumenFormateado: resumen }, resumen);
  }, [config]);

  // Actualizar modo (bloques vs personalizado)
  const setModo = (modo: 'bloques' | 'personalizado') => {
    setConfig((prev) => ({
      ...prev,
      modo,
    }));
  };

  // Actualizar un día en modo personalizado
  const actualizarDia = (dia: DiaSemana, nuevoDia: HorarioDia) => {
    setConfig((prev) => ({
      ...prev,
      dias: {
        ...(prev.dias || obtenerHorariosConfigPorDefecto().dias!),
        [dia]: nuevoDia,
      },
    }));
  };

  // Actualizar un bloque
  const actualizarBloque = (
    bloque: 'lunesViernes' | 'sabado' | 'domingoFeriados',
    nuevoBloque: HorarioDia
  ) => {
    setConfig((prev) => ({
      ...prev,
      bloques: {
        ...(prev.bloques || obtenerHorariosConfigPorDefecto().bloques!),
        [bloque]: nuevoBloque,
      },
    }));
  };

  const renderEditorDia = (
    titulo: string,
    diaConfig: HorarioDia,
    onModificar: (nuevo: HorarioDia) => void,
    descripcionExtra?: string
  ) => {
    const tieneDosTurnos = diaConfig.turnos.length > 1;

    const alternarAbierto = () => {
      if (diaConfig.abierto) {
        onModificar({ abierto: false, turnos: [] });
      } else {
        onModificar({
          abierto: true,
          turnos: [{ abre: '09:00', cierra: '20:00', esTrasnoche: false }],
        });
      }
    };

    const alternarCortado = () => {
      if (tieneDosTurnos) {
        // Pasar a 1 turno
        onModificar({
          ...diaConfig,
          turnos: [diaConfig.turnos[0] || { abre: '09:00', cierra: '20:00', esTrasnoche: false }],
        });
      } else {
        // Pasar a 2 turnos (mañana y tarde)
        const t1: HorarioTurno = { abre: '08:30', cierra: '13:00', esTrasnoche: false };
        const t2: HorarioTurno = { abre: '16:30', cierra: '20:30', esTrasnoche: false };
        onModificar({
          ...diaConfig,
          turnos: [t1, t2],
        });
      }
    };

    const cambiarHoraTurno = (
      index: number,
      campo: 'abre' | 'cierra',
      valor: string
    ) => {
      const turnos = [...diaConfig.turnos];
      if (!turnos[index]) return;
      turnos[index] = {
        ...turnos[index],
        [campo]: valor,
        esTrasnoche:
          campo === 'cierra'
            ? esHorarioTrasnoche(turnos[index].abre, valor)
            : esHorarioTrasnoche(valor, turnos[index].cierra),
      };
      onModificar({ ...diaConfig, turnos });
    };

    return (
      <div
        className={`p-3.5 rounded-2xl border transition-all ${
          diaConfig.abierto
            ? 'bg-zinc-900/90 border-zinc-700/80 shadow-md'
            : 'bg-zinc-950/60 border-zinc-800/60 opacity-70'
        }`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={alternarAbierto}
              className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                diaConfig.abierto
                  ? 'bg-cyan-500 border-cyan-400 text-black shadow-sm'
                  : 'bg-zinc-800 border-zinc-700 text-transparent'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </button>
            <span className="font-bold text-xs text-white tracking-wide">{titulo}</span>
            {descripcionExtra && (
              <span className="text-[10px] text-zinc-400 hidden sm:inline">
                ({descripcionExtra})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {diaConfig.abierto && (
              <button
                type="button"
                onClick={alternarCortado}
                className="text-[10px] font-semibold px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 cursor-pointer transition-colors"
              >
                {tieneDosTurnos ? 'Horario Cortado (2 turnos)' : 'Horario Corrido (1 turno)'}
              </button>
            )}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                diaConfig.abierto
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}
            >
              {diaConfig.abierto ? 'Abre' : 'Cerrado'}
            </span>
          </div>
        </div>

        {diaConfig.abierto && (
          <div className="space-y-2.5 pt-1">
            {diaConfig.turnos.map((turno, idx) => {
              const trasnoche = esHorarioTrasnoche(turno.abre, turno.cierra);

              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 sm:gap-3 p-2 bg-zinc-950/70 rounded-xl border border-zinc-800/80 flex-wrap"
                >
                  <span className="text-[11px] font-semibold text-zinc-400 min-w-[55px] flex items-center gap-1">
                    {idx === 0 ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-cyan-400" />}
                    <span>{tieneDosTurnos ? (idx === 0 ? 'Turno 1:' : 'Turno 2:') : 'Horario:'}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={turno.abre}
                      onChange={(e) => cambiarHoraTurno(idx, 'abre', e.target.value)}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="text-zinc-500 text-xs">a</span>
                    <input
                      type="time"
                      value={turno.cierra}
                      onChange={(e) => cambiarHoraTurno(idx, 'cierra', e.target.value)}
                      className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
                    />
                    <span className="text-zinc-500 text-xs">hs</span>
                  </div>

                  {trasnoche && (
                    <span
                      title="Cierra en la madrugada del día siguiente"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-950/80 border border-violet-500/50 text-[10px] font-bold text-violet-300 animate-pulse"
                    >
                      <Moon className="w-2.5 h-2.5 text-violet-400" />
                      <span>Trasnoche (cierra de madrugada)</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const bloques = config.bloques || obtenerHorariosConfigPorDefecto().bloques!;
  const dias = config.dias || obtenerHorariosConfigPorDefecto().dias!;

  return (
    <div className="space-y-4">
      {/* Selector de Modo */}
      <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
        <button
          type="button"
          onClick={() => setModo('bloques')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            config.modo === 'bloques'
              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Formato Rápido (Lun-Vie / Sáb / Dom)</span>
        </button>

        <button
          type="button"
          onClick={() => setModo('personalizado')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            config.modo === 'personalizado'
              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Día por Día Personalizado</span>
        </button>
      </div>

      {/* Editor según Modo */}
      {config.modo === 'bloques' ? (
        <div className="space-y-2.5">
          {renderEditorDia(
            'Lunes a Viernes',
            bloques.lunesViernes,
            (n) => actualizarBloque('lunesViernes', n),
            'Días hábiles'
          )}
          {renderEditorDia(
            'Sábados',
            bloques.sabado,
            (n) => actualizarBloque('sabado', n),
            'Fin de semana'
          )}
          {renderEditorDia(
            'Domingos y Feriados',
            bloques.domingoFeriados,
            (n) => actualizarBloque('domingoFeriados', n),
            'Atención dominical'
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          {DIAS_ORDEN.map(({ clave, etiqueta }) =>
            renderEditorDia(etiqueta, dias[clave], (n) => actualizarDia(clave, n))
          )}
        </div>
      )}

      {/* Resumen dinámico y aviso de trasnoche */}
      <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-2xl space-y-1">
        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
          Resumen semanal automático:
        </span>
        <p className="text-xs font-medium text-cyan-300">
          {formatearHorariosLegibles(config)}
        </p>
        <p className="text-[10px] text-zinc-500">
          * Si configuras horarios nocturnos (ej. 20:00 a 03:00), el sistema mantendrá tu local como
          abierto durante la madrugada en el mapa y la lista de comercios.
        </p>
      </div>

      {/* SECCIÓN: CIERRES O CAMBIOS DE HORARIO PROGRAMADOS CON ANTICIPACIÓN */}
      <div className="p-4 bg-zinc-900/90 border border-zinc-700/80 rounded-2xl space-y-3.5 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-white tracking-wide">
              Cierres o Cambios de Horario con Anticipación
            </span>
            {(config.fechas_especiales?.length || 0) > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                {config.fechas_especiales!.length}{' '}
                {config.fechas_especiales!.length === 1 ? 'fecha programada' : 'fechas programadas'}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMostrarFormFecha(!mostrarFormFecha)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer transition-all"
          >
            {mostrarFormFecha ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{mostrarFormFecha ? 'Cancelar' : 'Programar Fecha Especial'}</span>
          </button>
        </div>

        <p className="text-[11px] text-zinc-400 leading-relaxed">
          ¿Cierras por feriado, refacciones o necesitas atender en un horario distinto un día específico?
          Prográmalo con antelación. El sistema actualizará el estado automáticamente ese día y avisará a los vecinos previamente.
        </p>

        {/* Formulario para agregar nueva fecha especial */}
        {mostrarFormFecha && (
          <div className="p-4 bg-zinc-950 rounded-2xl border border-amber-600/40 space-y-3.5 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <CalendarPlus className="w-4 h-4 text-amber-400" />
              <span>Nueva Fecha Especial Programada</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  1. Fecha del evento o feriado:
                </label>
                <input
                  type="date"
                  min={formatearFechaISO(new Date())}
                  value={fechaInput}
                  onChange={(e) => setFechaInput(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  2. ¿Qué sucederá ese día?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoInput('cerrado')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      tipoInput === 'cerrado'
                        ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>🔴 Cerrado todo el día</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoInput('horario_especial')}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      tipoInput === 'horario_especial'
                        ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>🟡 Horario especial</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Configuración de turnos si es horario especial */}
            {tipoInput === 'horario_especial' && (
              <div className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-300">
                    Horario de atención para esa fecha:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (tieneDosTurnosEspecial) {
                        setTieneDosTurnosEspecial(false);
                        setTurnosEspeciales([turnosEspeciales[0] || { abre: '09:00', cierra: '13:00', esTrasnoche: false }]);
                      } else {
                        setTieneDosTurnosEspecial(true);
                        setTurnosEspeciales([
                          turnosEspeciales[0] || { abre: '08:30', cierra: '12:30', esTrasnoche: false },
                          { abre: '16:30', cierra: '20:30', esTrasnoche: false },
                        ]);
                      }
                    }}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-300 border border-zinc-700 cursor-pointer"
                  >
                    {tieneDosTurnosEspecial ? '1 solo turno' : '2 turnos (cortado)'}
                  </button>
                </div>

                <div className="space-y-2">
                  {turnosEspeciales.map((turno, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                      <span className="text-[11px] font-semibold text-zinc-400 min-w-[55px]">
                        {tieneDosTurnosEspecial ? (idx === 0 ? 'Turno 1:' : 'Turno 2:') : 'Horario:'}
                      </span>
                      <input
                        type="time"
                        value={turno.abre}
                        onChange={(e) => {
                          const copia = [...turnosEspeciales];
                          copia[idx] = { ...copia[idx], abre: e.target.value };
                          setTurnosEspeciales(copia);
                        }}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none"
                      />
                      <span className="text-zinc-500 text-xs">a</span>
                      <input
                        type="time"
                        value={turno.cierra}
                        onChange={(e) => {
                          const copia = [...turnosEspeciales];
                          copia[idx] = { ...copia[idx], cierra: e.target.value };
                          setTurnosEspeciales(copia);
                        }}
                        className="px-2 py-1 bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-mono font-bold text-white focus:outline-none"
                      />
                      <span className="text-zinc-500 text-xs">hs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Motivo o descripción */}
            <div>
              <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                3. Motivo o aviso para los vecinos (opcional):
              </label>
              <input
                type="text"
                value={motivoInput}
                onChange={(e) => setMotivoInput(e.target.value)}
                placeholder="Ej: Feriado Nacional, Inventario, Refacciones, Día personal"
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />

              {/* Chips rápidos de motivos comunes */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[10px] text-zinc-500 font-semibold">Sugerencias:</span>
                {[
                  'Feriado Nacional',
                  'Feriado Puente',
                  'Inventario',
                  'Refacciones',
                  'Día del Comercio',
                  'Asunto Personal',
                  'Horario de Víspera',
                ].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setMotivoInput(sug)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 cursor-pointer transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Botón Guardar Fecha */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setMostrarFormFecha(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!fechaInput}
                onClick={() => {
                  if (!fechaInput) return;
                  const nuevaItem: HorarioEspecialFecha = {
                    id: 'fe_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
                    fecha: fechaInput,
                    tipo: tipoInput,
                    motivo: motivoInput.trim() || undefined,
                    turnos: tipoInput === 'horario_especial' ? turnosEspeciales : undefined,
                  };
                  setConfig((prev) => {
                    const anteriores = (prev.fechas_especiales || []).filter((f) => f.fecha !== fechaInput);
                    const listaOrdenada = [...anteriores, nuevaItem].sort((a, b) => a.fecha.localeCompare(b.fecha));
                    return {
                      ...prev,
                      fechas_especiales: listaOrdenada,
                    };
                  });
                  setFechaInput('');
                  setMotivoInput('');
                  setTipoInput('cerrado');
                  setTurnosEspeciales([{ abre: '09:00', cierra: '13:00', esTrasnoche: false }]);
                  setTieneDosTurnosEspecial(false);
                  setMostrarFormFecha(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black cursor-pointer shadow-md shadow-amber-950/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Guardar Fecha Especial
              </button>
            </div>
          </div>
        )}

        {/* Lista de fechas especiales ya programadas */}
        <div className="space-y-2 pt-1">
          {(!config.fechas_especiales || config.fechas_especiales.length === 0) ? (
            <div className="p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/80 text-center">
              <p className="text-xs text-zinc-500">
                No tienes fechas especiales programadas.
              </p>
              <p className="text-[10px] text-zinc-600 mt-0.5">
                Puedes agregar días festivos, inventarios o cambios puntuales haciendo clic en &quot;Programar Fecha Especial&quot;.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {config.fechas_especiales.map((esp) => {
                const hoyISO = formatearFechaISO(new Date());
                const esPasado = esp.fecha < hoyISO;
                const esHoy = esp.fecha === hoyISO;

                const [y, m, d] = esp.fecha.split('-').map(Number);
                const fechaObj = new Date(y, m - 1, d, 12, 0, 0);
                const diaNombre = fechaObj.toLocaleDateString('es-AR', { weekday: 'long' });
                const fechaLegible = `${diaNombre.charAt(0).toUpperCase() + diaNombre.slice(1)} ${d}/${m}/${y}`;

                return (
                  <div
                    key={esp.id || esp.fecha}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 flex-wrap transition-all ${
                      esPasado
                        ? 'bg-zinc-950/40 border-zinc-800/60 opacity-60'
                        : esHoy
                        ? 'bg-amber-950/40 border-amber-500/60 shadow-sm shadow-amber-950/20'
                        : 'bg-zinc-950/80 border-zinc-800/90'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-white">
                          🗓️ {fechaLegible}
                        </span>

                        {esHoy && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                            ¡Es hoy!
                          </span>
                        )}

                        {esPasado && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-zinc-800 text-zinc-500">
                            Transcurrido
                          </span>
                        )}

                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            esp.tipo === 'cerrado'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {esp.tipo === 'cerrado' ? 'Cerrado todo el día' : 'Horario especial'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-zinc-300 flex-wrap">
                        {esp.tipo === 'horario_especial' && esp.turnos && (
                          <span className="text-cyan-300 font-mono text-[11px]">
                            Turnos: {esp.turnos.map((t) => `${t.abre} a ${t.cierra} hs`).join(' y ')}
                          </span>
                        )}

                        {esp.motivo && (
                          <span className="text-zinc-400 text-[11px] italic">
                            Motivo: &quot;{esp.motivo}&quot;
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setConfig((prev) => ({
                          ...prev,
                          fechas_especiales: (prev.fechas_especiales || []).filter(
                            (f) => f.id !== esp.id && f.fecha !== esp.fecha
                          ),
                        }));
                      }}
                      className="p-1.5 rounded-lg bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-400 border border-zinc-800 hover:border-rose-800/60 cursor-pointer transition-colors"
                      title="Eliminar fecha especial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
