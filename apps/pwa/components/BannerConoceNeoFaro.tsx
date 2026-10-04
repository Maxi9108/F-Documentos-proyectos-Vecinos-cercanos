'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Compass,
  Store,
  Navigation,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  MapPin,
  Clock,
  PhoneCall,
  Info,
} from 'lucide-react';

export default function BannerConoceNeoFaro() {
  const [plegado, setPlegado] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    try {
      const guardado = localStorage.getItem('neofaro_banner_informativo_plegado');
      if (guardado === 'true') {
        setPlegado(true);
      }
    } catch {
      // Ignorar errores de acceso a localStorage en modo incógnito/privado
    }
  }, []);

  const togglePlegado = () => {
    setPlegado((prev) => {
      const nuevo = !prev;
      try {
        localStorage.setItem('neofaro_banner_informativo_plegado', String(nuevo));
      } catch {
        // Fallback silencioso
      }
      return nuevo;
    });
  };

  // Versión plegada compacta: barra interactiva elegante con estética neón
  if (isMounted && plegado) {
    return (
      <section
        aria-label="Conocé NeoFaro"
        className="w-full bg-gradient-to-r from-zinc-900/95 via-zinc-950 to-zinc-900/95 border border-zinc-800/90 hover:border-cyan-500/40 rounded-2xl p-3 sm:p-3.5 shadow-lg shadow-black/40 transition-all duration-300 flex items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600/20 to-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shrink-0 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)]">
            <Info className="w-4 h-4" />
          </div>
          <div className="truncate">
            <span className="font-bold text-white tracking-wide">¿Primera vez en NeoFaro?</span>
            <span className="text-zinc-400 hidden sm:inline ml-2">
              Descubrí qué somos, qué hacemos y cómo funciona la red barrial.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={togglePlegado}
          className="shrink-0 px-3.5 py-1.5 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-cyan-300 hover:text-cyan-200 border border-cyan-500/20 hover:border-cyan-400/40 font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <span>Conocer más</span>
          <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </section>
    );
  }

  // Versión desplegada: 3 tarjetas con badges, microdetalles e integración comunitaria
  return (
    <section
      aria-label="Presentación de NeoFaro: Qué somos, Qué hacemos y Cómo funciona"
      className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-zinc-900/95 via-zinc-950 to-zinc-900/95 border border-zinc-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl p-4 sm:p-6 transition-all duration-500"
    >
      {/* Resplandor decorativo de fondo */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Cabecera del Banner */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-zinc-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Guía Comunitaria
            </span>
            <span className="text-zinc-600 text-xs hidden sm:inline">•</span>
            <span className="text-zinc-400 text-xs hidden sm:inline">Tu barrio en tiempo real</span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Conocé</span>
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-violet-400 bg-clip-text text-transparent">
              NeoFaro
            </span>
          </h2>
          <p className="text-zinc-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            La plataforma vecinal inteligente que conecta tu día a día con los comercios, ofertas y servicios más cercanos.
          </p>
        </div>

        {/* Botón Plegar */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={togglePlegado}
            className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-600 text-zinc-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Plegar para ver directamente el panel de comercios"
          >
            <span>Plegar guía</span>
            <ChevronUp className="w-3.5 h-3.5 text-zinc-400" />
          </button>
        </div>
      </div>

      {/* Grid de 3 Tarjetas: Qué somos / Qué hacemos / Cómo funciona */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4.5 mt-5">
        {/* Tarjeta 1: ¿Qué somos? */}
        <div className="group rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-violet-500/40 p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.25)] group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-violet-400/90 px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20">
                01 • IDENTIDAD
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mb-2 group-hover:text-violet-200 transition-colors">
              ¿Qué somos?
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed mb-4">
              Somos una <strong className="text-zinc-100 font-semibold">red comunitaria barrial</strong> nacida para impulsar el comercio de cercanía y reconectar a los vecinos con los locales y oficios de su propia zona.
            </p>
          </div>

          <ul className="space-y-2 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400">
            <li className="flex items-start gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
              <span><strong className="text-zinc-200">100% Directo:</strong> Sin intermediarios ni comisiones abusivas sobre tus compras.</span>
            </li>
            <li className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0 mt-0.5" />
              <span><strong className="text-zinc-200">Colaborativo:</strong> Información y reseñas generadas y cuidadas por la comunidad.</span>
            </li>
          </ul>
        </div>

        {/* Tarjeta 2: ¿Qué hacemos? */}
        <div className="group rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-cyan-500/40 p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] group-hover:scale-105 transition-transform">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-cyan-400/90 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                02 • PROPÓSITO
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mb-2 group-hover:text-cyan-200 transition-colors">
              ¿Qué hacemos?
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed mb-4">
              Digitalizamos la vida de barrio: te mostramos <strong className="text-zinc-100 font-semibold">quién está abierto ahora</strong>, farmacias de turno, ofertas del día y cómo comunicarte de inmediato con cada negocio.
            </p>
          </div>

          <ul className="space-y-2 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400">
            <li className="flex items-start gap-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong className="text-zinc-200">Horarios certeros:</strong> Estado de apertura en vivo y guardias nocturnas.</span>
            </li>
            <li className="flex items-start gap-2">
              <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
              <span><strong className="text-zinc-200">Paleta de Ofertas:</strong> Promociones exclusivas para ahorrar comprando cerca.</span>
            </li>
          </ul>
        </div>

        {/* Tarjeta 3: ¿Cómo funciona? */}
        <div className="group rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)] group-hover:scale-105 transition-transform">
                <Navigation className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400/90 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                03 • DINÁMICA
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold text-white mb-2 group-hover:text-emerald-200 transition-colors">
              ¿Cómo funciona?
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed mb-4">
              En solo 3 pasos encontrás lo que necesitás a la vuelta de tu casa:
            </p>
          </div>

          <div className="space-y-2 border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400">
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span><strong className="text-zinc-200">Activá tu radio:</strong> Usá tu GPS o elegí 1 km, 2 km o 3 km de distancia.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span><strong className="text-zinc-200">Filtrá al instante:</strong> Por rubro, nombre de producto o locales abiertos.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <span><strong className="text-zinc-200">Contacto directo:</strong> Pedí por WhatsApp, llamá o llegá con el mapa.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pie interactivo del banner: Acceso para comerciantes y llamado a explorar */}
      <div className="relative z-10 mt-5 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-zinc-300 text-center sm:text-left">
          <Store className="w-4 h-4 text-cyan-400 shrink-0 hidden sm:block" />
          <span>
            ¿Tenés un comercio, negocio u oficio en el barrio?{' '}
            <strong className="text-white">Sumá tu local sin costo.</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Link
            href="/mi-comercio"
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold transition-all shadow-md shadow-violet-950/50 flex items-center justify-center gap-1.5 text-xs cursor-pointer"
          >
            <span>Publicar mi comercio</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
