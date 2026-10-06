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
    console.warn('[Admin SelectorZonaEnvioWrapper] Error capturado en mapa de cobertura:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-center space-y-2">
          <p className="text-xs text-amber-400 font-medium">
            El mapa de cobertura tuvo una pausa temporal.
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-xs text-white rounded-lg hover:bg-zinc-700 transition-colors"
          >
            Reintentar mapa
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
