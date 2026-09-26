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
  ArrowLeft,
  Check,
  RefreshCw,
} from 'lucide-react';

export default function ModalAuth() {
  const {
    modalAuthAbierto,
    modalAuthModo,
    cerrarModalAuth,
    solicitarTokenRegistro,
    verificarTokenRegistro,
    completarRegistroConPassword,
    iniciarSesion,
    usuario,
    cerrarSesion,
  } = useUser();

  const [modo, setModo] = useState<'registro' | 'login'>(modalAuthModo || 'registro');

  // Pasos de Registro:
  // 1: Cargar Mail y Nombre -> 2: Comprobar Token -> 3: Poner Contraseña
  const [pasoRegistro, setPasoRegistro] = useState<1 | 2 | 3>(1);

  // Estados de Formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [tokenIngresado, setTokenIngresado] = useState('');
  const [password, setPassword] = useState('');
  const [claveConfirmacion, setClaveConfirmacion] = useState('');

  // Feedback y loaders
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);

  // Sincronizar modo si cambia desde el contexto
  React.useEffect(() => {
    if (modalAuthModo) {
      setModo(modalAuthModo);
      setPasoRegistro(1);
      setMensajeError(null);
      setMensajeExito(null);
    }
  }, [modalAuthModo]);

  if (!modalAuthAbierto) return null;

  // Paso 1: Enviar Token al Mail
  const handlePaso1SolicitarToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError(null);
    setMensajeExito(null);

    const res = await solicitarTokenRegistro(email, nombre);
    setCargando(false);

    if (res.ok) {
      setMensajeExito(res.mensaje || 'Código de comprobación enviado a tu correo.');
      setPasoRegistro(2);
    } else {
      setMensajeError(res.mensaje || 'Error al enviar código de comprobación.');
    }
  };

  // Paso 2: Comprobar Token
  const handlePaso2ValidarToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensajeError(null);
    setMensajeExito(null);

    const res = await verificarTokenRegistro(email, tokenIngresado);
    setCargando(false);

    if (res.ok) {
      setMensajeExito('¡Correo comprobado con éxito! Ahora define tu contraseña.');
      setPasoRegistro(3);
    } else {
      setMensajeError(res.mensaje || 'Código de verificación incorrecto.');
    }
  };

  // Paso 3: Establecer Contraseña y Finalizar
  const handlePaso3CompletarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeError(null);
    setMensajeExito(null);

    if (password.length < 4) {
      setMensajeError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (password !== claveConfirmacion) {
      setMensajeError('Las contraseñas no coinciden. Por favor verifica.');
      return;
    }

    setCargando(true);
    const res = await completarRegistroConPassword(email, tokenIngresado, password, nombre);
    setCargando(false);

    if (res.ok) {
      setMensajeExito(res.mensaje || '¡Registro completado exitosamente!');
      setTimeout(() => {
        cerrarModalAuth();
        setPasoRegistro(1);
      }, 1300);
    } else {
      setMensajeError(res.mensaje || 'Error al guardar la contraseña.');
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
      }, 1200);
    } else {
      setMensajeError(res.mensaje || 'Error al iniciar sesión. Revisa tu correo y contraseña.');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden text-zinc-100">
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
                <span>Beneficios de tu cuenta en Vecin@s Conectad@s:</span>
              </p>
              <p className="text-zinc-400 text-[11px]">
                • Tus locales favoritos guardados con corazón están sincronizados.
              </p>
              <p className="text-zinc-400 text-[11px]">
                • Puedes iniciar debates privados o reportar inconvenientes con los comercios.
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
          /* Formulario de Registro / Login */
          <div>
            {/* Encabezado */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/40 text-cyan-400 mb-3 shadow-md shadow-violet-950/40">
                <UserCheck className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {modo === 'registro' ? 'Registro de Usuario' : 'Iniciar Sesión'}
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                {modo === 'registro'
                  ? 'Completa tu información, comprueba tu email con un código token y establece tu contraseña.'
                  : 'Ingresa con tu correo y contraseña para acceder a tus favoritos y funciones comunitarias.'}
              </p>
            </div>

            {/* Selector de Pestañas */}
            <div className="flex bg-zinc-900 p-1 rounded-2xl border border-zinc-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setModo('registro');
                  setPasoRegistro(1);
                  setMensajeError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  modo === 'registro'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Crear Cuenta
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

            {/* Stepper visual para Registro */}
            {modo === 'registro' && (
              <div className="flex items-center justify-between mb-5 px-3 py-2 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl text-[11px]">
                <div className={`flex items-center gap-1.5 ${pasoRegistro >= 1 ? 'text-cyan-400 font-bold' : 'text-zinc-500'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${pasoRegistro >= 1 ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300' : 'bg-zinc-800 text-zinc-500'}`}>
                    1
                  </span>
                  <span>Datos</span>
                </div>
                <div className={`h-0.5 w-6 ${pasoRegistro >= 2 ? 'bg-cyan-500' : 'bg-zinc-800'}`} />
                <div className={`flex items-center gap-1.5 ${pasoRegistro >= 2 ? 'text-violet-400 font-bold' : 'text-zinc-500'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${pasoRegistro >= 2 ? 'bg-violet-500/20 border border-violet-400 text-violet-300' : 'bg-zinc-800 text-zinc-500'}`}>
                    2
                  </span>
                  <span>Token</span>
                </div>
                <div className={`h-0.5 w-6 ${pasoRegistro >= 3 ? 'bg-violet-500' : 'bg-zinc-800'}`} />
                <div className={`flex items-center gap-1.5 ${pasoRegistro === 3 ? 'text-emerald-400 font-bold' : 'text-zinc-500'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${pasoRegistro === 3 ? 'bg-emerald-500/20 border border-emerald-400 text-emerald-300' : 'bg-zinc-800 text-zinc-500'}`}>
                    3
                  </span>
                  <span>Clave</span>
                </div>
              </div>
            )}

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

            {/* MODO REGISTRO - PASO 1: MAIL Y NOMBRE */}
            {modo === 'registro' && pasoRegistro === 1 && (
              <form onSubmit={handlePaso1SolicitarToken} className="space-y-3.5">
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
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Se generará un código token de 6 dígitos que deberás comprobar en el siguiente paso antes de definir tu contraseña.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full mt-3 py-3 px-4 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {cargando ? (
                    <span>Generando código...</span>
                  ) : (
                    <>
                      <span>Comprobar Mail y Recibir Token</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODO REGISTRO - PASO 2: COMPROBAR TOKEN */}
            {modo === 'registro' && pasoRegistro === 2 && (
              <form onSubmit={handlePaso2ValidarToken} className="space-y-3.5">
                <div className="p-3.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-xs text-zinc-300 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400 font-semibold">
                    <Mail className="w-4 h-4 shrink-0" />
                    <span>Código de verificación enviado</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Hemos enviado un código PIN de 6 dígitos a <strong className="text-white font-mono">{email}</strong>.
                    Por favor revisa tu bandeja de entrada o carpeta de correo no deseado (spam) e ingrésalo a continuación para autenticar tu cuenta.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <KeyRound className="w-3 h-3 text-violet-400" />
                    <span>Ingresa el Token de 6 Dígitos *</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={tokenIngresado}
                    onChange={(e) => setTokenIngresado(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Ej: 123456"
                    className="w-full text-center text-lg tracking-widest font-mono font-bold px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-cyan-300 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPasoRegistro(1)}
                    className="py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-medium border border-zinc-800 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Volver</span>
                  </button>

                  <button
                    type="submit"
                    disabled={cargando || tokenIngresado.length !== 6}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {cargando ? (
                      <span>Validando...</span>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Validar Token y Continuar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* MODO REGISTRO - PASO 3: PONER CONTRASEÑA */}
            {modo === 'registro' && pasoRegistro === 3 && (
              <form onSubmit={handlePaso3CompletarPassword} className="space-y-3.5">
                <div className="p-2.5 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Correo comprobado con éxito. Ahora define tu contraseña de acceso:</span>
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
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {cargando ? (
                    <span>Guardando cuenta...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Finalizar Registro y Entrar</span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* MODO LOGIN DIRECTO */}
            {modo === 'login' && (
              <form onSubmit={handleLogin} className="space-y-3.5">
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
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {cargando ? (
                    <span>Iniciando sesión...</span>
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

