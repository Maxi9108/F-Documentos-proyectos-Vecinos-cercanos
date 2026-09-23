'use client';

import React, { useState } from 'react';
import { Share2, Check, Copy } from 'lucide-react';

export default function BotonCompartirApp() {
  const [copiado, setCopiado] = useState(false);

  const handleCompartir = async () => {
    const url = typeof window !== 'undefined' ? window.location.origin : '';
    const shareData = {
      title: 'NeoFaro — Descubrí tu barrio, cerca y sin vueltas',
      text: '¡Entrá a NeoFaro para ver los comercios abiertos, ofertas y farmacias de turno en tu barrio!',
      url: url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        // Si el usuario canceló el share nativo, no hacemos nada
        if ((err as Error)?.name === 'AbortError') return;
      }
    }

    // Respaldo para navegadores de escritorio o sin soporte de Web Share
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 3000);
      } catch {
        prompt('Copia este enlace para compartir:', url);
      }
    } else {
      prompt('Copia este enlace para compartir:', url);
    }
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleCompartir}
        title="Compartir NeoFaro por WhatsApp, redes o copiar enlace"
        className="py-1.5 sm:py-2 px-2.5 sm:px-3 bg-gradient-to-r from-cyan-600/20 to-violet-600/20 hover:from-cyan-600/30 hover:to-violet-600/30 border border-cyan-400/40 text-cyan-300 hover:text-white font-semibold rounded-xl transition-all flex items-center gap-1.5 text-xs shadow-sm hover:shadow-cyan-950/40 cursor-pointer"
      >
        {copiado ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-bold">¡Copiado!</span>
          </>
        ) : (
          <>
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Compartir</span>
          </>
        )}
      </button>

      {/* Mini popup flotante si se copió al portapapeles */}
      {copiado && (
        <div className="absolute top-full mt-1.5 right-0 z-50 px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-200 text-[11px] font-medium whitespace-nowrap shadow-xl flex items-center gap-1 animate-in fade-in duration-200">
          <Copy className="w-3 h-3 text-emerald-400" />
          <span>¡Enlace listo para enviar por WhatsApp!</span>
        </div>
      )}
    </div>
  );
}
