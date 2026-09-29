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
    <div className="w-full h-[320px] rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center text-zinc-400 gap-3 animate-pulse">
      <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      <p className="text-xs text-zinc-400 font-medium">Cargando mapa de cobertura de envíos...</p>
    </div>
  ),
});

export default function SelectorZonaEnvioWrapper(props: SelectorZonaEnvioWrapperProps) {
  return <SelectorZonaEnvio {...props} />;
}
