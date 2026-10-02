import React from 'react';
import Link from 'next/link';
import DirectorioComercios from '@/components/DirectorioComercios';
import BarraUsuarioYUbicacion from '@/components/BarraUsuarioYUbicacion';
import NeoFaroLogo from '@/components/NeoFaroLogo';
import BotonCompartirApp from '@/components/BotonCompartirApp';
import { getComercios } from '@/lib/supabase';
import { Store } from 'lucide-react';

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

            {/* Botones Móvil: Compartir y Mi Comercio */}
            <div className="flex md:hidden items-center gap-1.5">
              <BotonCompartirApp />
              <Link
                href="/mi-comercio"
                title="Mi Comercio (Ingresar a tu local o cargarlo)"
                className="py-1.5 px-3 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-md shadow-violet-950/60 border border-cyan-400/30 flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-cyan-300" />
                <span>Mi Comercio</span>
              </Link>
            </div>
          </div>

          {/* Fila 2 en Móvil / Derecha en Escritorio: Ubicación, Usuario, Mi Comercio (Desktop) */}
          <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 text-xs flex-wrap">
            <BarraUsuarioYUbicacion />

            <Link
              href="/mi-comercio"
              title="Portal de Mi Comercio (Ingresar a tu local o cargarlo)"
              className="hidden md:flex py-2 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-md shadow-violet-950/60 hover:shadow-cyan-950/50 border border-cyan-400/30 items-center gap-2 cursor-pointer text-xs"
            >
              <Store className="w-4 h-4 text-cyan-300" />
              <span>Mi Comercio</span>
            </Link>

            <div className="hidden md:flex">
              <BotonCompartirApp />
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
          <div className="pt-2 flex items-center justify-center gap-4 text-[11px]">
            <Link href="/terminos-y-condiciones" className="text-zinc-400 hover:text-cyan-400 transition-colors">
              Términos y Condiciones (Deslinde)
            </Link>
            <span className="text-zinc-700">•</span>
            <Link href="/politica-de-privacidad" className="text-zinc-400 hover:text-cyan-400 transition-colors">
              Política de Privacidad
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
