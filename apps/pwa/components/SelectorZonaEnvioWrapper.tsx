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

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[SelectorZonaEnvioWrapper] Error capturado en el mapa de cobertura:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-6 rounded-2xl bg-zinc-950 border border-zinc-800 text-center space-y-2">
          <p className="text-xs text-amber-400 font-medium">
            El mapa interactivo de cobertura tuvo una pausa temporal.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-xs text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Reintentar visualización
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function SelectorZonaEnvioWrapper(props: SelectorZonaEnvioWrapperProps) {
  return (
    <MapErrorBoundary>
      <SelectorZonaEnvio {...props} />
    </MapErrorBoundary>
  );
}
