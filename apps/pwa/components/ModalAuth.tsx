'use client';

import React, { useState } from 'react';
import { useUser } from '@/context/user-context';
import { X, Mail, Lock, KeyRound, UserCheck, Sparkles, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function ModalAuth() {
  const {
    modalAuthAbierto,
    modalAuthModo,
    cerrarModalAuth,
    registrar,
    iniciarSesion,
    usuario,
    cerrarSesion,
  } = useUser();

  const [modo, setModo] = useState<'registro' | 'login'>(modalAuthModo || 'registro');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [claveConfirmacion, setClaveConfirmacion] = useState('');
  const [nombre, setNombre] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Sincronizar modo si cambia desde el contexto
  React.useEffect(() => {
    if (modalAuthModo) setModo(modalAuthModo);
  }, [modalAuthModo]);

  if (!modalAuthAbierto) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError(null);
    setMensajeExito(null);

    if (modo === 'registro') {
      const res = await registrar(email, password, claveConfirmacion, nombre);
      setCargando(false);
      if (res.ok) {
        setMensajeExito(res.mensaje || '¡Registro completado!');
        setTimeout(() => {
          cerrarModalAuth();
        }, 1400);
      } else {
        setMensajeError(res.mensaje || 'Error en el registro.');
      }
    } else {
      const res = await iniciarSesion(email, password);
      setCargando(false);
      if (res.ok) {
        setMensajeExito(res.mensaje || '¡Bienvenido/a!');
        setTimeout(() => {
          cerrarModalAuth();
        }, 1200);
      } else {
        setMensajeError(res.mensaje || 'Error al iniciar sesión.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden">
        {/* Glow decorativo de fondo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={cerrarModalAuth}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Si el usuario ya está conectado */}
        {usuario ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-violet-950/80 border border-violet-500/50 flex items-center justify-center text-violet-300 text-2xl font-bold shadow-lg shadow-violet-950/50">
              {usuario.nombre ? usuario.nombre[0].toUpperCase() : '👤'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Sesión Activa</h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{usuario.email}</p>
            </div>

            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-xs text-zinc-300 text-left space-y-1.5">
              <p className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Beneficios de tu cuenta en NeoFaro:</span>
              </p>
              <p className="text-zinc-400 text-[11px]">
                • Tus locales favoritos guardados con corazón están sincronizados.
              </p>
              <p className="text-zinc-400 text-[11px]">
                • Puedes guardar tus ubicaciones (Casa, Trabajo) para ver qué locales quedan cerca.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                cerrarSesion();
                cerrarModalAuth();
              }}
              className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-rose-400 border border-zinc-800 hover:border-rose-900/50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </div>
        ) : (
          /* Formulario de Registro / Login */
          <div>
            {/* Encabezado */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/40 text-cyan-400 mb-3 shadow-md shadow-violet-950/40">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {modo === 'registro' ? 'Crear Cuenta en NeoFaro' : 'Iniciar Sesión en NeoFaro'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                {modo === 'registro'
                  ? 'Descubrí tu barrio, cerca y sin vueltas. Guarda favoritos y rastrea locales cercanos.'
                  : 'Ingresa con tu correo y contraseña para acceder a tus favoritos guardados.'}
              </p>
            </div>

            {/* Selector de Pestañas */}
            <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setModo('registro');
                  setMensajeError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modo === 'registro'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Registrarme
              </button>
              <button
                type="button"
                onClick={() => {
                  setModo('login');
                  setMensajeError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modo === 'login'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Ya tengo cuenta
              </button>
            </div>

            {/* Mensajes de Feedback */}
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

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Nombre (opcional en registro) */}
              {modo === 'registro' && (
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Tu Nombre o Apodo (Opcional)
                  </label>
                  <input
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Laura, Martín, etc."
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-cyan-400" />
                  <span>Correo Electrónico</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-cyan-400" />
                  <span>Contraseña / Clave</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                />
              </div>

              {/* Clave de confirmación (solo en Registro) */}
              {modo === 'registro' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-violet-400" />
                      <span>Clave de Confirmación</span>
                    </label>
                    {password && claveConfirmacion && (
                      <span
                        className={`text-[10px] font-bold ${
                          password === claveConfirmacion ? 'text-cyan-400' : 'text-rose-400'
                        }`}
                      >
                        {password === claveConfirmacion ? '✓ Coinciden' : '✗ No coinciden'}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={claveConfirmacion}
                    onChange={(e) => setClaveConfirmacion(e.target.value)}
                    placeholder="Repite tu clave para confirmar"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                  />
                  <p className="text-[10.5px] text-zinc-500 mt-1">
                    Ingresa nuevamente tu clave elegida como clave de confirmación de seguridad.
                  </p>
                </div>
              )}

              {/* Botón Submit */}
              <button
                type="submit"
                disabled={cargando}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {cargando ? (
                  <span>Procesando...</span>
                ) : modo === 'registro' ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-cyan-200" />
                    <span>Confirmar Registro y Crear Cuenta</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 text-cyan-200" />
                    <span>Iniciar Sesión</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
