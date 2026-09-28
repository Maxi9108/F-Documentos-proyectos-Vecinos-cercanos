'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Flame } from 'lucide-react';

interface OfertaCountdownProps {
  horaVencimiento?: string; // Fecha ISO o timestamp
  className?: string;
  compact?: boolean;
}

export default function OfertaCountdown({
  horaVencimiento,
  className = '',
  compact = false,
}: OfertaCountdownProps) {
  const [tiempoRestante, setTiempoRestante] = useState<{
    horas: number;
    minutos: number;
    segundos: number;
    expirada: boolean;
  } | null>(null);

  useEffect(() => {
    function calcularRestante() {
      const ahora = new Date();
      let destino: Date;

      if (horaVencimiento) {
        destino = new Date(horaVencimiento);
      } else {
        // Por defecto: Las ofertas expiran en el reseteo diario a las 05:00 AM
        destino = new Date(ahora);
        if (ahora.getHours() >= 5) {
          // Próximo día a las 05:00 AM
          destino.setDate(destino.getDate() + 1);
        }
        destino.setHours(5, 0, 0, 0);
      }

      const diff = destino.getTime() - ahora.getTime();

      if (diff <= 0) {
        setTiempoRestante({ horas: 0, minutos: 0, segundos: 0, expirada: true });
        return;
      }

      const totalSegundos = Math.floor(diff / 1000);
      const horas = Math.floor(totalSegundos / 3600);
      const minutos = Math.floor((totalSegundos % 3600) / 60);
      const segundos = totalSegundos % 60;

      setTiempoRestante({ horas, minutos, segundos, expirada: false });
    }

    calcularRestante();
    const interval = setInterval(calcularRestante, 1000);
    return () => clearInterval(interval);
  }, [horaVencimiento]);

  if (!tiempoRestante) return null;

  if (tiempoRestante.expirada) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-400 border border-zinc-700">
        <Clock className="w-3 h-3 text-zinc-500" />
        Oferta finalizada
      </span>
    );
  }

  const pad = (n: number) => String(n).padStart(2, '0');

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 ${className}`}>
        <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
        <span>{pad(tiempoRestante.horas)}:{pad(tiempoRestante.minutos)}:{pad(tiempoRestante.segundos)}</span>
      </span>
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 shadow-sm ${className}`}>
      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
      <span className="font-mono">
        {tiempoRestante.horas}h {pad(tiempoRestante.minutos)}m {pad(tiempoRestante.segundos)}s restantes
      </span>
    </div>
  );
}
