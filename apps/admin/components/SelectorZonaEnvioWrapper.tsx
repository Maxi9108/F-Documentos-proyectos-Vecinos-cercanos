'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

interface SelectorZonaEnvioWrapperProps {
  latitud: number;
  longitud: number;
  radioKm: number;
  poligono: [number, number][];
  onChange: (nuevoRadioKm: number, nuevoPoligono: [number, number][]) => void;
  confirmado: boolean;
  onToggleConfirmado: (nuevoEstado: boolean) => void;
}

const SelectorZonaEnvio = dynamic(() => import('./SelectorZonaEnvio'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[220px] rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-400 gap-2 animate-pulse">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      <p className="text-xs text-zinc-400">Cargando mapa de cobertura...</p>
    </div>
  ),
});

export default function SelectorZonaEnvioWrapper(props: SelectorZonaEnvioWrapperProps) {
  return <SelectorZonaEnvio {...props} />;
}
