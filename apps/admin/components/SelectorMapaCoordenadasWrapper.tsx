'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';

interface SelectorMapaProps {
  latitud: number;
  longitud: number;
  onChange: (lat: number, lng: number) => void;
}

const DynamicSelectorMapa = dynamic(
  () => import('./SelectorMapaCoordenadas'),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[220px] rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center gap-2 text-zinc-400">
        <MapPin className="w-6 h-6 animate-pulse text-indigo-500" />
        <span className="text-xs">Cargando mapa interactivo...</span>
      </div>
    ),
  }
);

export default function SelectorMapaCoordenadasWrapper(props: SelectorMapaProps) {
  return <DynamicSelectorMapa {...props} />;
}
