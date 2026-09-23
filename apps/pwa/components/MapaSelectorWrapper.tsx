'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

interface MapaSelectorWrapperProps {
  latitud: number;
  longitud: number;
  direccionTexto: string;
  onUbicacionChange: (lat: number, lng: number, direccionSugerida?: string) => void;
  radioEntregaMetros?: number;
  mostrarRadio?: boolean;
}

const MapaSelectorDireccion = dynamic(() => import('./MapaSelectorDireccion'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-400 gap-3 animate-pulse">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
      <p className="text-xs text-zinc-400 font-medium">Iniciando mapa geográfico...</p>
    </div>
  ),
});

export default function MapaSelectorWrapper(props: MapaSelectorWrapperProps) {
  return <MapaSelectorDireccion {...props} />;
}
