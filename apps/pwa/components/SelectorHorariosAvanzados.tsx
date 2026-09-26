'use client';

import React, { useState, useEffect } from 'react';
import { HorariosConfig, HorarioDia, HorarioTurno, DiaSemana } from '@/types/comercio';
import {
  esHorarioTrasnoche,
  formatearHorariosLegibles,
  obtenerHorariosConfigPorDefecto,
} from '@/lib/horarios';
import { Clock, Moon, Sun, Calendar, Check, AlertCircle, Sparkles } from 'lucide-react';

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
          Resumen generado automáticamente:
        </span>
        <p className="text-xs font-medium text-cyan-300">
          {formatearHorariosLegibles(config)}
        </p>
        <p className="text-[10px] text-zinc-500">
          * Si configuras horarios nocturnos (ej. 20:00 a 03:00), el sistema mantendrá tu local como
          abierto durante la madrugada en el mapa y la lista de comercios.
        </p>
      </div>
    </div>
  );
}
