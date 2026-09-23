'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Comercio } from '@/types/comercio';
import { Loader2 } from 'lucide-react';

interface MapaWrapperProps {
  comercios: Comercio[];
  comercioSeleccionado: Comercio | null;
  onSelectComercio: (comercio: Comercio) => void;
  onOpenDetalle?: (comercio: Comercio) => void;
}

function SkeletonMapaConRespaldo() {
  const [demoraDetectada, setDemoraDetectada] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDemoraDetectada(true);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleIrALista = () => {
    const el = document.getElementById('comercio-list-section') || document.querySelector('section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full h-full min-h-[420px] rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col items-center justify-center text-zinc-400 gap-4 p-6 text-center shadow-inner relative overflow-hidden">
      <div className="p-4 rounded-full bg-zinc-800/80 border border-zinc-700/50 relative">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>

      <div>
        <p className="font-semibold text-sm text-zinc-200">
          {demoraDetectada ? 'Conexión móvil lenta detectada...' : 'Cargando mapa nocturno...'}
        </p>
        <p className="text-xs text-zinc-500 mt-1 max-w-xs">
          {demoraDetectada
            ? 'El mapa está demorando en cargar por tu señal de internet. Podés explorar los comercios directamente en la lista rápida abajo.'
            : 'Sincronizando comercios del barrio'}
        </p>
      </div>

      {demoraDetectada && (
        <button
          type="button"
          onClick={handleIrALista}
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all animate-in fade-in duration-300 cursor-pointer flex items-center gap-1.5"
        >
          <span>⚡ Ver Lista Rápida de Comercios</span>
        </button>
      )}
    </div>
  );
}

// Carga dinámica sin SSR para react-leaflet con skeleton oscuro y respaldo de lentitud
const MapaComercios = dynamic(() => import('./MapaComercios'), {
  ssr: false,
  loading: () => <SkeletonMapaConRespaldo />,
});

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class MapaErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('[MapaWrapper] Error capturado en el mapa:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-[420px] rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col items-center justify-center text-zinc-400 gap-3 p-6 text-center shadow-inner">
          <div className="p-3 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
            ⚠️
          </div>
          <div>
            <p className="font-semibold text-sm text-zinc-200">El mapa tuvo un retraso al inicializar</p>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Podés continuar explorando la lista de comercios abajo o reintentar cargar el mapa.
            </p>
          </div>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            Reintentar Mapa
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function MapaWrapper(props: MapaWrapperProps) {
  const [mapKey, setMapKey] = React.useState(0);

  return (
    <MapaErrorBoundary key={mapKey}>
      <MapaComercios key={mapKey} {...props} />
    </MapaErrorBoundary>
  );
}
