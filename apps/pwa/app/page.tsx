import React from 'react';
import Link from 'next/link';
import DirectorioComercios from '@/components/DirectorioComercios';
import BarraUsuarioYUbicacion from '@/components/BarraUsuarioYUbicacion';
import NeoFaroLogo from '@/components/NeoFaroLogo';
import BotonCompartirApp from '@/components/BotonCompartirApp';
import { getComercios, isSupabaseConfigured } from '@/lib/supabase';
import { Database, Plus, ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const comercios = await getComercios();

  return (
    <main className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-cyan-400 selection:text-black">
      {/* Barra de Navegación Superior Oscura con Estética NeoFaro */}
      <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800/80 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
          {/* Fila 1: Logo y Acceso Rápido en Móvil */}
          <div className="flex items-center justify-between gap-2">
            <NeoFaroLogo size="md" showSlogan={true} />

            {/* Botones Móvil: Compartir y Sumar */}
            <div className="flex md:hidden items-center gap-1.5">
              <BotonCompartirApp />
              <Link
                href="/cargar-comercio"
                className="py-1.5 px-3 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-md shadow-violet-950/60 border border-cyan-400/30 flex items-center gap-1 text-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Sumar</span>
              </Link>
            </div>
          </div>

          {/* Fila 2 en Móvil / Derecha en Escritorio: Ubicación, Usuario, Sumar (Desktop) y Admin */}
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 text-xs flex-wrap">
            <BarraUsuarioYUbicacion />

            <Link
              href="/cargar-comercio"
              className="hidden md:flex py-2 px-3.5 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-md shadow-violet-950/60 hover:shadow-cyan-950/50 border border-cyan-400/30 items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Sumar mi Comercio</span>
            </Link>

            <Link
              href="/admin"
              title="Panel del Administrador Único"
              className="py-1.5 sm:py-2 px-2.5 sm:px-3 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/50 text-zinc-300 hover:text-white font-medium rounded-xl transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-cyan-400" />
              <span className="hidden sm:inline">Admin</span>
            </Link>

            <div className="hidden md:flex">
              <BotonCompartirApp />
            </div>

            {/* Indicador de conexión Supabase */}
            <div className="hidden md:flex items-center">
              {isSupabaseConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/60 text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Supabase Conectado
                </span>
              ) : (
                <span
                  title="Configura NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en apps/pwa/.env.local para vincular tu base de datos"
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-800 text-[11px] cursor-help"
                >
                  <Database className="w-3 h-3 text-cyan-400" />
                  Demo Local
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DirectorioComercios initialComercios={comercios} />
      </div>

      {/* Footer Oscuro */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="text-zinc-400 font-medium">
            <span className="text-white font-bold tracking-wider">NEOFARO.</span> &copy; {new Date().getFullYear()} — Descubrí tu barrio, cerca y sin vueltas.
          </p>
          <p className="text-[11px] text-zinc-500">
            Red comercial comunitaria con geolocalización satelital y promociones locales.
          </p>
        </div>
      </footer>
    </main>
  );
}
