'use client';

import React, { useState, useEffect } from 'react';
import { NivelComercio } from '@/types/comercio';
import { Crown, Award, Clock, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';

interface ContadorMembresiaProps {
  fechaVencimiento?: string | null;
  nivel?: NivelComercio;
  formato?: 'badge' | 'tarjeta' | 'reloj_digital';
  className?: string;
}

interface TiempoRestante {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
  totalMs: number;
  estaVencido: boolean;
}

export default function ContadorMembresia({
  fechaVencimiento,
  nivel,
  formato = 'badge',
  className = '',
}: ContadorMembresiaProps) {
  const [tiempo, setTiempo] = useState<TiempoRestante | null>(null);

  useEffect(() => {
    if (!fechaVencimiento || (nivel !== 'premium' && nivel !== 'gold')) {
      setTiempo(null);
      return;
    }

    const calcular = () => {
      const ahora = Date.now();
      const meta = new Date(fechaVencimiento).getTime();

      if (isNaN(meta)) {
        setTiempo(null);
        return;
      }

      const diferencia = meta - ahora;

      if (diferencia <= 0) {
        setTiempo({
          dias: 0,
          horas: 0,
          minutos: 0,
          segundos: 0,
          totalMs: 0,
          estaVencido: true,
        });
        return;
      }

      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);

      setTiempo({
        dias,
        horas,
        minutos,
        segundos,
        totalMs: diferencia,
        estaVencido: false,
      });
    };

    calcular();
    const interval = setInterval(calcular, 1000);
    return () => clearInterval(interval);
  }, [fechaVencimiento, nivel]);

  if (!nivel || (nivel !== 'premium' && nivel !== 'gold')) {
    return null;
  }

  const esGold = nivel === 'gold';
  const nombreNivel = esGold ? 'Gold' : 'Premium';

  if (!tiempo) {
    return null;
  }

  // Si está vencido
  if (tiempo.estaVencido) {
    if (formato === 'badge') {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/60 text-rose-300 border border-rose-800/60 ${className}`}
        >
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          <span>Membresía {nombreNivel} vencida</span>
        </span>
      );
    }

    return (
      <div
        className={`p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-xs flex items-center justify-between gap-3 ${className}`}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <div>
            <span className="font-bold block">Membresía {nombreNivel} expirada</span>
            <span className="text-[11px] text-rose-300/80">
              Carga tu comprobante de pago para reactivar tu mes extra sin perder beneficios.
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Formato 1: Badge compacto (para listados y tarjetas)
  if (formato === 'badge') {
    return (
      <span
        title={`Tiempo restante en categoría ${nombreNivel}: ${tiempo.dias}d ${tiempo.horas}h ${tiempo.minutos}m ${tiempo.segundos}s`}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
          esGold
            ? 'bg-amber-950/70 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-950/40'
            : 'bg-purple-950/70 text-purple-300 border-purple-500/50 shadow-sm shadow-purple-950/40'
        } ${className}`}
      >
        {esGold ? (
          <Crown className="w-3 h-3 text-amber-400 shrink-0" />
        ) : (
          <Award className="w-3 h-3 text-purple-400 shrink-0" />
        )}
        <span className="tracking-wide">
          {nombreNivel}: {tiempo.dias}d {tiempo.horas}h restantes
        </span>
      </span>
    );
  }

  // Formato 2: Tarjeta informativa (para modales)
  if (formato === 'tarjeta') {
    return (
      <div
        className={`p-3.5 rounded-2xl border ${
          esGold
            ? 'bg-gradient-to-r from-amber-950/40 to-zinc-900 border-amber-500/40 text-amber-200'
            : 'bg-gradient-to-r from-purple-950/40 to-zinc-900 border-purple-500/40 text-purple-200'
        } ${className}`}
      >
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            {esGold ? (
              <Crown className="w-4 h-4 text-amber-400" />
            ) : (
              <Award className="w-4 h-4 text-purple-400" />
            )}
            <span className="text-xs font-bold uppercase tracking-wider">
              Categoría Destacada {nombreNivel}
            </span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-900/80 border border-zinc-700/60 text-zinc-300 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>1 Mes de Vigencia</span>
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center py-1">
          <div className="p-2 rounded-xl bg-black/40 border border-zinc-800">
            <span className="block text-lg font-mono font-bold text-white">{tiempo.dias}</span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-400">Días</span>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-zinc-800">
            <span className="block text-lg font-mono font-bold text-white">{String(tiempo.horas).padStart(2, '0')}</span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-400">Horas</span>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-zinc-800">
            <span className="block text-lg font-mono font-bold text-white">{String(tiempo.minutos).padStart(2, '0')}</span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-400">Min</span>
          </div>
          <div className="p-2 rounded-xl bg-black/40 border border-zinc-800">
            <span className="block text-lg font-mono font-bold text-cyan-400 animate-pulse">{String(tiempo.segundos).padStart(2, '0')}</span>
            <span className="text-[9px] uppercase tracking-wider text-zinc-400">Seg</span>
          </div>
        </div>

        <p className="text-[10px] text-zinc-400 mt-2 text-center">
          Tiempo restante del mes en esta sección. Al acreditarse una transferencia, se acumula +1 mes extra.
        </p>
      </div>
    );
  }

  // Formato 3: Reloj Digital (para portal del comercio y dashboard de administración)
  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border shadow-xl relative overflow-hidden ${
        esGold
          ? 'bg-gradient-to-br from-amber-950/50 via-zinc-950 to-zinc-950 border-amber-500/50 shadow-amber-950/20'
          : 'bg-gradient-to-br from-purple-950/50 via-zinc-950 to-zinc-950 border-purple-500/50 shadow-purple-950/20'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
              esGold
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
            }`}
          >
            {esGold ? <Crown className="w-4 h-4" /> : <Award className="w-4 h-4" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Membresía {nombreNivel} Activa</span>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h4>
            <p className="text-[11px] text-zinc-400">
              Contador de tiempo restante en la sección de 1 mes:
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>En Curso</span>
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 sm:gap-3 my-2">
        <div className="bg-black/60 border border-zinc-800/80 p-2.5 sm:p-3 rounded-2xl text-center shadow-inner">
          <span className="text-xl sm:text-2xl font-mono font-bold text-white block">{tiempo.dias}</span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Días</span>
        </div>
        <div className="bg-black/60 border border-zinc-800/80 p-2.5 sm:p-3 rounded-2xl text-center shadow-inner">
          <span className="text-xl sm:text-2xl font-mono font-bold text-white block">
            {String(tiempo.horas).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Horas</span>
        </div>
        <div className="bg-black/60 border border-zinc-800/80 p-2.5 sm:p-3 rounded-2xl text-center shadow-inner">
          <span className="text-xl sm:text-2xl font-mono font-bold text-white block">
            {String(tiempo.minutos).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Minutos</span>
        </div>
        <div className="bg-black/60 border border-zinc-800/80 p-2.5 sm:p-3 rounded-2xl text-center shadow-inner">
          <span className="text-xl sm:text-2xl font-mono font-bold text-cyan-400 block animate-pulse">
            {String(tiempo.segundos).padStart(2, '0')}
          </span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-semibold">Segundos</span>
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 gap-1.5">
        <span className="flex items-center gap-1 text-zinc-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Vence el: {fechaVencimiento ? new Date(fechaVencimiento).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Activo'}</span>
        </span>
        <span className="text-zinc-500 text-[10.5px]">
          Los meses extras acreditados comenzarán a correr al finalizar el período actual.
        </span>
      </div>
    </div>
  );
}
