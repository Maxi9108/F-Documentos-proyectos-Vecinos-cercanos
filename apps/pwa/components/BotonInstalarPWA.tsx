'use client';

import React, { useState, useEffect } from 'react';
import { Download, Smartphone, Check, Sparkles, X, Share } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function BotonInstalarPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [esInstalable, setEsInstalable] = useState(false);
  const [yaInstalada, setYaInstalada] = useState(false);
  const [esIOS, setEsIOS] = useState(false);
  const [modalIOSAbierto, setModalIOSAbierto] = useState(false);

  useEffect(() => {
    // Detectar si ya corre como app instalada (standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setYaInstalada(true);
      return;
    }

    // Detectar iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    if (isIosDevice) {
      setEsIOS(true);
      setEsInstalable(true);
    }

    // Capturar evento nativo de instalación en Chrome/Android/Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setEsInstalable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Escuchar cuando la app se instala con éxito
    window.addEventListener('appinstalled', () => {
      setYaInstalada(true);
      setEsInstalable(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstalar = async () => {
    if (esIOS) {
      setModalIOSAbierto(true);
      return;
    }

    if (!deferredPrompt) {
      // Fallback para navegadores donde el prompt automático no está disponible
      alert('Para instalar la aplicación, pulsa el menú de opciones de tu navegador (⋮) y selecciona "Instalar aplicación" o "Agregar a la pantalla de inicio".\n\nPróximamente también disponible directamente en Google Play Store.');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setYaInstalada(true);
        setEsInstalable(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.warn('Error al solicitar instalación PWA:', err);
    }
  };

  if (yaInstalada) {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-[11px] font-bold text-emerald-300">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span>App Instalada</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative inline-flex flex-col items-end">
        <button
          type="button"
          onClick={handleInstalar}
          title="Instalar NeoFaro en tu teléfono o computadora"
          className="relative group py-1.5 sm:py-2 px-2.5 sm:px-3.5 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:via-teal-500/30 hover:to-cyan-500/30 border border-emerald-400/50 hover:border-emerald-400 text-emerald-300 hover:text-white font-extrabold rounded-xl transition-all flex items-center gap-1.5 text-xs shadow-md shadow-emerald-950/30 cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="hidden sm:inline">Instalar App</span>
          <span className="sm:hidden">Instalar</span>

          {/* Badge 'Próximamente en Play Store' */}
          <span className="hidden md:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-black/60 text-amber-300 border border-amber-500/40 ml-1">
            <Sparkles className="w-2.5 h-2.5 text-amber-400" />
            Play Store Próx.
          </span>
        </button>
      </div>

      {/* Modal explicativo para dispositivos Apple iOS */}
      {modalIOSAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setModalIOSAbierto(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-2xl relative"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Instalar en tu iPhone o iPad</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalIOSAbierto(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                <div>
                  <p>Toca el botón <strong className="text-white">Compartir</strong> en la barra inferior de Safari.</p>
                  <Share className="w-4 h-4 text-cyan-400 mt-1" />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                <p>Desplaza hacia abajo y selecciona <strong className="text-white">&ldquo;Agregar a pantalla de inicio&rdquo; ➕</strong>.</p>
              </div>

              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
                ⭐ <strong className="text-amber-100">Próximamente disponible en Google Play Store</strong> para una instalación aún más directa en dispositivos Android.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setModalIOSAbierto(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs cursor-pointer transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
