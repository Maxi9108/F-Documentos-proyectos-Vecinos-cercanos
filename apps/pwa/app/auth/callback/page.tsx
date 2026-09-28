'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles, ShieldCheck, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function procesarSesion() {
      if (!supabase) {
        setErrorMensaje('El servicio de base de datos no está disponible.');
        return;
      }

      try {
        // Verificar si hay parámetros de error en la URL
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const errorDesc = params.get('error_description') || params.get('error');
          if (errorDesc) {
            setErrorMensaje(decodeURIComponent(errorDesc));
            return;
          }
        }

        // Obtener la sesión actual resuelta por Supabase desde el fragmento o código
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setErrorMensaje(error.message);
          return;
        }

        if (session && !cancelado) {
          // Sesión exitosa, redirigir al inicio
          router.replace('/');
          return;
        }

        // Si aún no está listo el token en getSession, esperar brevemente al listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
          if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && newSession && !cancelado) {
            router.replace('/');
          }
        });

        // Timeout de seguridad de 8 segundos si no se recibe sesión
        const timeout = setTimeout(() => {
          if (!cancelado) {
            router.replace('/');
          }
        }, 8000);

        return () => {
          authListener?.subscription?.unsubscribe();
          clearTimeout(timeout);
        };
      } catch (err: any) {
        if (!cancelado) {
          setErrorMensaje(err?.message || 'Error inesperado al procesar el inicio de sesión.');
        }
      }
    }

    procesarSesion();

    return () => {
      cancelado = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="relative w-full max-w-sm bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center overflow-hidden">
        {/* Glows decorativos */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-violet-600/30 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-cyan-500/25 rounded-full blur-2xl pointer-events-none" />

        {errorMensaje ? (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-950/80 border border-rose-600/50 flex items-center justify-center text-rose-400 shadow-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">No se pudo autenticar</h2>
              <p className="text-xs text-rose-300 mt-1 leading-relaxed">{errorMensaje}</p>
            </div>
            <button
              onClick={() => router.replace('/')}
              className="w-full py-2.5 px-4 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-xl border border-zinc-700 transition-all cursor-pointer"
            >
              Volver a la aplicación
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 animate-spin blur-md opacity-60" />
              <div className="relative w-12 h-12 rounded-2xl bg-zinc-950 border border-zinc-700 flex items-center justify-center text-cyan-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Iniciando sesión</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                Conectando con tu cuenta y preparando tus accesos...
              </p>
            </div>
            <div className="flex justify-center pt-2">
              <div className="w-6 h-6 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
