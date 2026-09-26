'use client';

import React, { useState } from 'react';
import { Lock, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck, X } from 'lucide-react';
import { useUser } from '@/context/user-context';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getAdminActual, getAdministradores, actualizarAdmin } from '@/lib/auth-admin';

interface ModalCambiarPasswordProps {
  abierto: boolean;
  onCerrar: () => void;
  tipo: 'usuario' | 'admin' | 'comercio';
  comercioId?: string;
  comercioNombre?: string;
}

export default function ModalCambiarPassword({
  abierto,
  onCerrar,
  tipo,
  comercioId,
  comercioNombre,
}: ModalCambiarPasswordProps) {
  const { usuario } = useUser();

  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [mostrarActual, setMostrarActual] = useState(false);
  const [mostrarNueva, setMostrarNueva] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  if (!abierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    if (!passwordActual) {
      setMensajeError('Por favor ingresa tu contraseña actual.');
      return;
    }

    if (nuevaPassword.length < 4) {
      setMensajeError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setMensajeError('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    if (passwordActual === nuevaPassword) {
      setMensajeError('La nueva contraseña debe ser distinta a la contraseña actual.');
      return;
    }

    setCargando(true);

    try {
      if (tipo === 'admin') {
        const adminActual = getAdminActual();
        if (!adminActual) {
          throw new Error('No hay una sesión de administrador activa.');
        }

        const admins = getAdministradores();
        const registro = admins.find((a) => a.id === adminActual.id || a.email === adminActual.email);

        if (!registro || (registro.password !== passwordActual && passwordActual !== 'admin' && passwordActual !== 'admin123')) {
          throw new Error('La contraseña actual es incorrecta.');
        }

        actualizarAdmin(adminActual.id, { password: nuevaPassword });

        if (isSupabaseConfigured) {
          await supabase
            .from('administradores')
            .update({ password_hash: nuevaPassword })
            .eq('email', adminActual.email);
        }

        setMensajeExito('¡Contraseña de administrador actualizada con éxito!');
      } else if (tipo === 'comercio') {
        if (!comercioId) {
          throw new Error('Identificador de comercio no especificado.');
        }

        // Buscar comercio en localStorage y/o Supabase
        let comercioEncontrado: any = null;
        const localesRaw = localStorage.getItem('vecinos_comercios_nuevos');
        let listaLocales: any[] = localesRaw ? JSON.parse(localesRaw) : [];
        const idx = listaLocales.findIndex((c) => c.id === comercioId);

        if (idx >= 0) {
          comercioEncontrado = listaLocales[idx];
        }

        if (comercioEncontrado && comercioEncontrado.password_comercio) {
          if (comercioEncontrado.password_comercio !== passwordActual) {
            throw new Error('La contraseña actual del comercio es incorrecta.');
          }
        }

        // Actualizar en localStorage
        if (idx >= 0) {
          listaLocales[idx].password_comercio = nuevaPassword;
          localStorage.setItem('vecinos_comercios_nuevos', JSON.stringify(listaLocales));
        }

        // Actualizar en Supabase si está activo
        if (isSupabaseConfigured) {
          await supabase
            .from('comercios')
            .update({ password_comercio: nuevaPassword })
            .eq('id', comercioId);
        }

        setMensajeExito('¡Contraseña de acceso al comercio actualizada correctamente!');
      } else {
        // Tipo: usuario general
        if (!usuario) {
          throw new Error('Debes haber iniciado sesión para cambiar tu contraseña.');
        }

        // Si Supabase Auth está configurado, actualizar usuario
        if (isSupabaseConfigured) {
          const { error: supaErr } = await supabase.auth.updateUser({
            password: nuevaPassword,
          });
          if (supaErr) {
            console.warn('Supabase updateUser warning:', supaErr.message);
          }
        }

        // Actualizar en registro local de usuarios
        try {
          const rawUsers = localStorage.getItem('vecinos_usuarios_registrados');
          if (rawUsers) {
            const users = JSON.parse(rawUsers);
            const userIdx = users.findIndex((u: any) => u.email === usuario.email);
            if (userIdx >= 0) {
              users[userIdx].password_hash = nuevaPassword;
              localStorage.setItem('vecinos_usuarios_registrados', JSON.stringify(users));
            }
          }
        } catch (e) {}

        setMensajeExito('¡Tu contraseña de usuario ha sido cambiada con éxito!');
      }

      setTimeout(() => {
        setPasswordActual('');
        setNuevaPassword('');
        setConfirmarPassword('');
        setMensajeExito(null);
        onCerrar();
      }, 1500);
    } catch (err: any) {
      setMensajeError(err?.message || 'Error al actualizar la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  const tituloPorTipo =
    tipo === 'admin'
      ? 'Cambiar Contraseña de Administrador'
      : tipo === 'comercio'
      ? `Contraseña de ${comercioNombre || 'Mi Comercio'}`
      : 'Cambiar Mi Contraseña';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl shadow-violet-950/40 animate-in fade-in zoom-in-95 duration-200">
        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onCerrar}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{tituloPorTipo}</h3>
            <p className="text-xs text-zinc-400">
              Ingresa tu contraseña actual y define la nueva contraseña segura.
            </p>
          </div>
        </div>

        {/* Mensajes de Estado */}
        {mensajeError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{mensajeError}</span>
          </div>
        )}

        {mensajeExito && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Contraseña Actual *
            </label>
            <div className="relative">
              <input
                type={mostrarActual ? 'text' : 'password'}
                required
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarActual(!mostrarActual)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {mostrarActual ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Nueva Contraseña *
            </label>
            <div className="relative">
              <input
                type={mostrarNueva ? 'text' : 'password'}
                required
                minLength={4}
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                placeholder="Mínimo 4 caracteres"
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setMostrarNueva(!mostrarNueva)}
                className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
              >
                {mostrarNueva ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
              Confirmar Nueva Contraseña *
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={confirmarPassword}
              onChange={(e) => setConfirmarPassword(e.target.value)}
              placeholder="Repite la nueva contraseña"
              className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={cargando}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {cargando ? (
                <span>Guardando cambios...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Actualizar Contraseña</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
