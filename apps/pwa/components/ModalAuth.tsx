'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/user-context';
import ModalCambiarPassword from './ModalCambiarPassword';
import {
  X,
  Mail,
  Lock,
  KeyRound,
  UserCheck,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export default function ModalAuth() {
  const {
    modalAuthAbierto,
    modalAuthModo,
    cerrarModalAuth,
    registrar,
    iniciarSesion,
    solicitarRecuperacionAdmin,
    restablecerPasswordAdminDirecto,
    usuario,
    cerrarSesion,
  } = useUser();

  const [modo, setModo] = useState<'registro' | 'login'>(modalAuthModo || 'registro');

  // Estados de Formulario de Registro Directo y Login
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [claveConfirmacion, setClaveConfirmacion] = useState('');

  // Estados de Recuperación de Administrador In-App
  const [modoRecuperarAdmin, setModoRecuperarAdmin] = useState(false);
  const [recuperarEmail, setRecuperarEmail] = useState('maxi0802@gmail.com');
  const [recuperarRespuesta, setRecuperarRespuesta] = useState('');
  const [recuperarNuevaClave, setRecuperarNuevaClave] = useState('');
  const [recuperarConfirmarClave, setRecuperarConfirmarClave] = useState('');

  // Feedback y loaders
  const [cargando, setCargando] = useState(false);
  const [enviandoRecuperacion, setEnviandoRecuperacion] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);

  // Sincronizar modo si cambia desde el contexto
  React.useEffect(() => {
    if (modalAuthModo) {
      setModo(modalAuthModo);
      setModoRecuperarAdmin(false);
      setMensajeError(null);
      setMensajeExito(null);
    }
  }, [modalAuthModo]);

  const handleRestablecerAdminDirecto = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    if (recuperarNuevaClave.length < 4) {
      setMensajeError('La nueva contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (recuperarNuevaClave !== recuperarConfirmarClave) {
      setMensajeError('Las contraseñas no coinciden. Por favor verifícalas.');
      return;
    }

    setCargando(true);
    const res = await restablecerPasswordAdminDirecto(
      recuperarEmail,
      recuperarRespuesta,
      recuperarNuevaClave
    );
    setCargando(false);

    if (res.ok) {
      setMensajeExito(res.mensaje);
      setModoRecuperarAdmin(false);
      setRecuperarRespuesta('');
      setRecuperarNuevaClave('');
      setRecuperarConfirmarClave('');
      setTimeout(() => {
        cerrarModalAuth();
      }, 1500);
    } else {
      setMensajeError(res.mensaje);
    }
  };

  // Registro Directo en 1 solo paso (inmediato, sin esperar tokens ni mails)
  const handleRegistroDirecto = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError(null);
    setMensajeExito(null);

    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'maxi0802@gmail.com') {
      setCargando(false);
      setMensajeError('Esta cuenta ya existe como Administrador. Ingresa en la pestaña "Ya tengo cuenta" con clave "admin".');
      return;
    }

    if (password.length < 4) {
      setMensajeError('La contraseña debe tener al menos 4 caracteres.');
      setCargando(false);
      return;
    }
    if (password !== claveConfirmacion) {
      setMensajeError('Las contraseñas no coinciden. Por favor verifica.');
      setCargando(false);
      return;
    }

    const res = await registrar(cleanEmail, password, claveConfirmacion, nombre);
    setCargando(false);

    if (res.ok) {
      setMensajeExito(res.mensaje || '¡Cuenta creada con éxito! Bienvenido/a a NeoFaro.');
      setTimeout(() => {
        cerrarModalAuth();
      }, 900);
    } else {
      setMensajeError(res.mensaje || 'Error al registrar la cuenta.');
    }
  };

  // Login Directo
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError(null);
    setMensajeExito(null);

    const res = await iniciarSesion(email, password);
    setCargando(false);

    if (res.ok) {
      setMensajeExito(res.mensaje || '¡Sesión iniciada correctamente!');
      setTimeout(() => {
        cerrarModalAuth();
      }, 900);
    } else {
      setMensajeError(res.mensaje || 'Error al iniciar sesión. Revisa tu correo y contraseña.');
    }
  };

  if (!modalAuthAbierto) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden text-zinc-100 max-h-[92vh] overflow-y-auto">
        {/* Glow decorativo de fondo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={cerrarModalAuth}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition-colors cursor-pointer z-10"
          aria-label="Cerrar modal"
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
              <p className="text-xs text-cyan-300 font-medium">{usuario.nombre}</p>
              <p className="text-xs text-zinc-400 font-mono mt-0.5">{usuario.email}</p>
            </div>

            {/* Card Exclusiva de Administrador */}
            {usuario.esAdmin && (
              <div className="p-3.5 bg-gradient-to-r from-violet-950/80 to-cyan-950/80 border border-violet-500/50 rounded-2xl text-xs space-y-2.5 text-left shadow-lg shadow-violet-950/40">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Cuenta con Rol Administrador
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600/40 text-violet-200 border border-violet-400/40 uppercase font-mono font-bold tracking-wider">
                    {usuario.rol || 'SuperAdmin'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Tienes permisos para moderar comercios, auditar reportes, gestionar categorías y finanzas.
                </p>
                <Link
                  href="/admin"
                  onClick={cerrarModalAuth}
                  className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shadow-md shadow-violet-950/50 cursor-pointer no-underline"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Ir al Panel de Administración</span>
                </Link>
              </div>
            )}

            <div className="p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-xs text-zinc-300 text-left space-y-1.5">
              <p className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>Beneficios de tu cuenta en NeoFaro:</span>
              </p>
              <p className="text-zinc-400 text-[11px]">
                • Tus locales favoritos guardados con corazón están sincronizados.
              </p>
              <p className="text-zinc-400 text-[11px]">
                • Puedes calificar comercios, canjear promociones y participar de la comunidad.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => setModalPasswordAbierto(true)}
                className="w-full py-2.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-cyan-300 border border-zinc-800 hover:border-cyan-500/50 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                <span>Cambiar Mi Contraseña</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  cerrarSesion();
                  cerrarModalAuth();
                }}
                className="w-full py-2 px-4 bg-zinc-900/60 hover:bg-zinc-800 text-rose-400 border border-zinc-800/80 hover:border-rose-900/50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Registro / Login Rápido */
          <div>
            {/* Encabezado */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600/30 to-cyan-500/30 border border-cyan-400/40 text-cyan-300 mb-3 shadow-lg shadow-violet-950/50">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {modo === 'registro' ? 'Crear Cuenta' : 'Iniciar Sesión'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                {modo === 'registro'
                  ? 'Regístrate directamente con tu correo y contraseña sin códigos de espera.'
                  : 'Ingresa con tu correo y contraseña para acceder a tus locales favoritos.'}
              </p>
            </div>

            {/* Selector de Pestañas: Crear Cuenta vs Ya tengo cuenta */}
            {!modoRecuperarAdmin && (
              <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 mb-4">
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
                  Crear Cuenta Directa
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
            )}

            {/* Mensajes de Feedback */}
            {mensajeError && (
              <div className="mb-4 space-y-2">
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{mensajeError}</span>
                </div>
                {email.trim().toLowerCase() === 'maxi0802@gmail.com' && (
                  <div className="space-y-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setRecuperarEmail(email.trim().toLowerCase());
                        setModoRecuperarAdmin(true);
                        setMensajeError(null);
                      }}
                      className="w-full py-2.5 px-3 bg-gradient-to-r from-violet-900/90 to-cyan-900/90 hover:from-violet-800 hover:to-cyan-800 border border-cyan-500/40 text-cyan-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-md"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Restablecer clave aquí en la app (con pregunta secreta)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {mensajeExito && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{mensajeExito}</span>
              </div>
            )}

            {/* MODO RECUPERAR ADMIN DIRECTO IN-APP */}
            {modoRecuperarAdmin ? (
              <form onSubmit={handleRestablecerAdminDirecto} className="space-y-3.5">
                <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-2xl text-xs space-y-1">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    Restablecer Clave de Administrador
                  </span>
                  <p className="text-[11px] text-zinc-400">
                    Cambia tu clave de manera instantánea respondiendo a tu palabra clave secreta de seguridad registrada.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Correo de Administrador
                  </label>
                  <input
                    type="email"
                    required
                    value={recuperarEmail}
                    onChange={(e) => setRecuperarEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="p-3 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block">
                    Pregunta de Seguridad Registrada:
                  </span>
                  <p className="text-xs font-semibold text-white">
                    ¿Cuál es tu palabra clave de seguridad o ciudad de origen?
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Tu Respuesta Secreta *
                  </label>
                  <input
                    type="text"
                    required
                    value={recuperarRespuesta}
                    onChange={(e) => setRecuperarRespuesta(e.target.value)}
                    placeholder="Ingresa tu respuesta de seguridad"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Nueva Contraseña *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={recuperarNuevaClave}
                      onChange={(e) => setRecuperarNuevaClave(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Confirmar Contraseña *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={4}
                      value={recuperarConfirmarClave}
                      onChange={(e) => setRecuperarConfirmarClave(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{cargando ? 'Restableciendo...' : 'Restablecer Contraseña e Iniciar Sesión'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModoRecuperarAdmin(false)}
                  className="w-full py-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
                >
                  ← Volver al login habitual
                </button>
              </form>
            ) : modo === 'registro' ? (
              <form onSubmit={handleRegistroDirecto} className="space-y-3.5">
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Sin tokens ni demoras: tu cuenta se activa inmediatamente al hacer clic.</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Nombre Completo o de Pila *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Laura González"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Mail className="w-3 h-3 text-cyan-400" />
                    <span>Correo Electrónico *</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>Contraseña Nueva *</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-violet-400" />
                      <span>Confirmar Contraseña *</span>
                    </label>
                    {password && claveConfirmacion && (
                      <span className={`text-[10px] font-bold ${password === claveConfirmacion ? 'text-cyan-400' : 'text-rose-400'}`}>
                        {password === claveConfirmacion ? '✓ Coinciden' : '✗ No coinciden'}
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    required
                    value={claveConfirmacion}
                    onChange={(e) => setClaveConfirmacion(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {cargando ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Creando tu cuenta...
                    </span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>Crear Cuenta y Entrar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </form>
            ) : null}

            {/* PESTAÑA 2: INICIAR SESIÓN */}
            {!modoRecuperarAdmin && modo === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5">
                {/* Atajo Rápido para SuperAdmin (Credenciales Protegidas) */}
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-300 font-bold flex items-center gap-1.5 text-[11px]">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Acceso Administrador</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('maxi0802@gmail.com');
                      }}
                      className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                    >
                      Autocompletar
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Cuenta: <span className="text-zinc-200 font-mono">maxi0802@gmail.com</span> (Credenciales protegidas)
                  </p>
                </div>

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
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>Contraseña</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                  {email.trim().toLowerCase() === 'maxi0802@gmail.com' && (
                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setRecuperarEmail('maxi0802@gmail.com');
                          setModoRecuperarAdmin(true);
                          setMensajeError(null);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                      >
                        ¿Olvidaste tu clave de administrador? Restablécela aquí
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {cargando ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      Iniciando sesión...
                    </span>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 text-cyan-200" />
                      <span>Iniciar Sesión</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Modal para cambiar contraseña */}
      <ModalCambiarPassword
        abierto={modalPasswordAbierto}
        onCerrar={() => setModalPasswordAbierto(false)}
        tipo="usuario"
      />
    </div>
  );
}
