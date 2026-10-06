'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@/context/user-context';
import { solicitarBajaYEliminacionCuenta } from '@/lib/usuarios';
import {
  ArrowLeft,
  Trash2,
  UserX,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldAlert,
  Database,
  RefreshCw,
  Sparkles,
  HelpCircle,
  FileText,
  UserCheck,
} from 'lucide-react';

const MOTIVOS_BAJA = [
  { id: 'no_uso', label: 'Ya no utilizo la aplicación con frecuencia' },
  { id: 'privacidad', label: 'Preocupación por mi privacidad y protección de datos' },
  { id: 'cambio_cuenta', label: 'Deseo crear una cuenta nueva con otro correo' },
  { id: 'problemas_tecnicos', label: 'Problemas técnicos o errores de funcionamiento' },
  { id: 'pocos_comercios', label: 'No encuentro suficientes comercios en mi zona' },
  { id: 'otro', label: 'Otro motivo' },
];

export default function EliminarCuentaClient() {
  const { usuario, estaAutenticado, cerrarSesion, abrirModalAuth } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [motivo, setMotivo] = useState(MOTIVOS_BAJA[0].label);
  const [comentarios, setComentarios] = useState('');
  const [confirmado, setConfirmado] = useState(false);

  // Estados de proceso y feedback
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eliminadoExitoso, setEliminadoExitoso] = useState(false);
  const [modoManual, setModoManual] = useState(false);

  // Pre-cargar el email del usuario logueado
  useEffect(() => {
    if (usuario?.email && !modoManual) {
      setEmail(usuario.email);
    }
  }, [usuario, modoManual]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!password) {
      setError('Debes ingresar tu contraseña para verificar tu identidad antes de eliminar la cuenta.');
      return;
    }

    if (!confirmado) {
      setError('Debes marcar la casilla confirmando que comprendes el carácter permanente e irreversible de esta acción.');
      return;
    }

    setCargando(true);

    try {
      // 1. Invocar endpoint API para eliminación segura en servidor
      let apiOk = false;
      try {
        const resApi = await fetch('/api/eliminar-cuenta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            motivo: `${motivo} ${comentarios ? `— Detalle: ${comentarios}` : ''}`.trim(),
          }),
        });

        const dataApi = await resApi.json();
        if (resApi.ok && dataApi.ok) {
          apiOk = true;
        } else if (resApi.status === 401 || resApi.status === 403) {
          setError(dataApi.error || 'Contraseña incorrecta. Por favor verifica tus credenciales.');
          setCargando(false);
          return;
        }
      } catch (errApi) {
        console.warn('[EliminarCuenta] Fallback cliente API:', errApi);
      }

      // 2. Ejecutar borrado local y sincronización con Supabase desde el cliente
      const resCliente = await solicitarBajaYEliminacionCuenta({
        email: cleanEmail,
        password,
        motivo: `${motivo} ${comentarios ? `— Detalle: ${comentarios}` : ''}`.trim(),
      });

      if (!resCliente.exito && !apiOk) {
        setError(resCliente.error || 'Error al procesar la solicitud de eliminación. Verifica tu contraseña.');
        setCargando(false);
        return;
      }

      // 3. Cerrar sesión y purgar estados si correspondía a la sesión activa
      if (usuario?.email?.toLowerCase() === cleanEmail) {
        cerrarSesion();
      }

      // Limpiar campos y marcar como exitoso
      setPassword('');
      setEliminadoExitoso(true);
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error inesperado al procesar la eliminación.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-rose-500 selection:text-white">
      {/* Fondo ambiental decorativo */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-rose-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-2xl mx-auto space-y-8">
        {/* Encabezado y Navegación */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Mapa del Barrio
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-950/40">
              <UserX className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Eliminación de Cuenta y Datos
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                NeoFaro &bull; Transparencia, privacidad y control total sobre tu información
              </p>
            </div>
          </div>
        </div>

        {/* PANTALLA DE ÉXITO TRAS ELIMINAR */}
        {eliminadoExitoso ? (
          <div className="bg-zinc-950/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                PROCESO COMPLETADO
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Tu cuenta y datos han sido eliminados definitivamente
              </h2>
              <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Hemos purgado satisfactoriamente tu usuario, contraseñas, historial de visitas, comercios favoritos y ubicaciones guardadas de nuestros servidores y del almacenamiento de este dispositivo.
              </p>
            </div>

            <div className="p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-left text-xs text-zinc-400 space-y-2">
              <p className="font-semibold text-zinc-300 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                Resumen de la supresión ejecutada:
              </p>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px] pl-1">
                <li>Cuenta eliminada de la base de datos central de NeoFaro.</li>
                <li>Tokens de autenticación revocados y dados de baja.</li>
                <li>Marcadores de comercios favoritos y ubicaciones locales borrados.</li>
                <li>Sesión cerrada en este dispositivo.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="py-3 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold rounded-xl transition-all shadow-lg shadow-cyan-950/50 text-xs sm:text-sm text-center"
              >
                Volver al Mapa del Barrio
              </Link>
              <button
                type="button"
                onClick={() => {
                  setEliminadoExitoso(false);
                  setConfirmado(false);
                  setEmail('');
                  setPassword('');
                  abrirModalAuth('registro');
                }}
                className="py-3 px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-semibold rounded-xl transition-all text-xs sm:text-sm text-center cursor-pointer"
              >
                Crear una nueva cuenta
              </button>
            </div>
          </div>
        ) : (
          /* FORMULARIO DE ELIMINACIÓN Y POLÍTICA */
          <div className="space-y-6">
            {/* Banner Informativo de Cumplimiento (Google Play / App Store / Privacidad) */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-950/40 via-zinc-900/80 to-zinc-950 border border-rose-500/30 space-y-3 shadow-xl backdrop-blur-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Política de Supresión de Datos y Borrado Permanente
              </div>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                De conformidad con las políticas de seguridad de datos de <strong>Google Play Store</strong>, <strong>Apple App Store</strong> y normativas vigentes de protección de datos personales, los usuarios de <strong>NeoFaro</strong> tienen derecho a solicitar el borrado total de su cuenta y de todos los datos recopilados en cualquier momento.
              </p>
              <div className="pt-1 text-xs text-zinc-400 space-y-1">
                <p className="text-zinc-300 font-medium">¿Qué datos se eliminan con este proceso?</p>
                <p>• <strong>Datos de perfil:</strong> Tu nombre público, correo electrónico y fecha de registro.</p>
                <p>• <strong>Credenciales:</strong> Contraseñas criptográficas y tokens de acceso.</p>
                <p>• <strong>Preferencias y personalizaciones:</strong> Tus comercios favoritos guardados y ubicaciones de referencia (Casa, Trabajo, GPS).</p>
                <p>• <strong>Sesión:</strong> Cierre de sesión inmediato en todos los navegadores y dispositivos.</p>
              </div>
            </div>

            {/* Tarjeta del Formulario */}
            <div className="bg-zinc-950/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-xl">
              <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-cyan-400" />
                  Identificación y Confirmación de Titularidad
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Para proteger tu cuenta contra borrados accidentales o no autorizados, debes ingresar tus credenciales de usuario y contraseña antes de proceder.
                </p>
              </div>

              {/* Si el usuario ya está conectado en el navegador */}
              {estaAutenticado && usuario && !modoManual ? (
                <div className="p-4 bg-zinc-900/80 rounded-2xl border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-cyan-500 flex items-center justify-center font-bold text-white text-sm shadow-md">
                      {usuario.nombre ? usuario.nombre[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white">{usuario.nombre || 'Usuario Activo'}</p>
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-mono">
                          Sesión Actual
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 font-mono">{usuario.email}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setModoManual(true);
                      setEmail('');
                      setPassword('');
                    }}
                    className="text-xs text-zinc-400 hover:text-white underline cursor-pointer text-left sm:text-right"
                  >
                    Borrar otra cuenta
                  </button>
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Campo Email / Usuario */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                    <span>Correo electrónico o Usuario registrado</span>
                    {modoManual && estaAutenticado && (
                      <button
                        type="button"
                        onClick={() => {
                          setModoManual(false);
                          if (usuario?.email) setEmail(usuario.email);
                        }}
                        className="text-[11px] text-cyan-400 hover:underline cursor-pointer"
                      >
                        Usar mi sesión actual
                      </button>
                    )}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      readOnly={estaAutenticado && !modoManual}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                        estaAutenticado && !modoManual
                          ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300 cursor-not-allowed'
                          : 'bg-zinc-900 border-zinc-800 text-white focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 placeholder:text-zinc-600'
                      }`}
                    />
                  </div>
                  {!estaAutenticado && (
                    <p className="text-[11px] text-zinc-500">
                      ¿Aún no tienes cuenta registrada en NeoFaro?{' '}
                      <button
                        type="button"
                        onClick={() => abrirModalAuth('registro')}
                        className="text-cyan-400 hover:underline font-semibold cursor-pointer"
                      >
                        Crear una cuenta aquí
                      </button>
                    </p>
                  )}
                </div>

                {/* Campo Contraseña */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Contraseña actual de la cuenta
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={mostrarPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña para autorizar"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-sm outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 placeholder:text-zinc-600 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarPassword(!mostrarPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Necesaria para verificar que eres el titular y prevenir eliminaciones indebidas.
                  </p>
                </div>

                {/* Selector de Motivo */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Motivo por el cual deseas eliminar tu cuenta (Opcional)
                  </label>
                  <select
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs sm:text-sm outline-none focus:border-cyan-500 transition-all cursor-pointer"
                  >
                    {MOTIVOS_BAJA.map((m) => (
                      <option key={m.id} value={m.label} className="bg-zinc-900 text-zinc-200">
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Comentarios Adicionales */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400">
                    Comentarios o sugerencias para el equipo (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={comentarios}
                    onChange={(e) => setComentarios(e.target.value)}
                    placeholder="¿Hay algo que podríamos haber hecho mejor?"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs outline-none focus:border-cyan-500 placeholder:text-zinc-600 transition-all resize-none"
                  />
                </div>

                {/* Checkbox de Confirmación Obligatorio */}
                <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmado}
                      onChange={(e) => setConfirmado(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-zinc-700 text-rose-500 focus:ring-rose-500 focus:ring-offset-zinc-950 bg-zinc-900 cursor-pointer"
                    />
                    <span className="text-xs text-zinc-200 leading-relaxed font-medium">
                      Confirmo de manera voluntaria que deseo eliminar permanentemente mi cuenta de NeoFaro y solicito la supresión total de mis datos personales. Entiendo que esta operación es <strong>inmediata e irreversible</strong>.
                    </span>
                  </label>
                </div>

                {/* Mensaje de Error si ocurre */}
                {error && (
                  <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <p className="leading-tight">{error}</p>
                  </div>
                )}

                {/* Botón de Eliminación Definitiva */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={cargando || !confirmado}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
                      cargando || !confirmado
                        ? 'bg-zinc-800 text-zinc-500 border border-zinc-700/50 cursor-not-allowed opacity-60'
                        : 'bg-gradient-to-r from-rose-600 via-rose-500 to-red-600 hover:from-rose-500 hover:to-red-500 text-white border border-rose-400/40 shadow-rose-950/60 active:scale-[0.99]'
                    }`}
                  >
                    {cargando ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Verificando credenciales y eliminando datos...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 text-white" />
                        <span>Eliminar mi Cuenta y Todos mis Datos Definitivamente</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Preguntas frecuentes y canales alternativos de soporte */}
            <div className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl space-y-4 text-xs text-zinc-400">
              <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Preguntas Frecuentes sobre la Supresión de Datos
              </h3>

              <div className="space-y-3 text-xs leading-relaxed">
                <div>
                  <p className="text-zinc-300 font-semibold">¿Cuánto tiempo tarda en hacerse efectiva la eliminación?</p>
                  <p className="text-zinc-400">
                    La eliminación es <strong>inmediata</strong>. En cuanto confirmas tu contraseña, el registro se borra de nuestros servidores y de tu dispositivo en tiempo real.
                  </p>
                </div>

                <div>
                  <p className="text-zinc-300 font-semibold">¿Puedo volver a registrarme con el mismo correo en el futuro?</p>
                  <p className="text-zinc-400">
                    Sí. Al no quedar ningún registro ni bloqueo activo, podrás registrarte nuevamente desde cero cuando desees volver a utilizar NeoFaro.
                  </p>
                </div>

                <div>
                  <p className="text-zinc-300 font-semibold">¿Tienes problemas o prefieres asistencia manual?</p>
                  <p className="text-zinc-400">
                    También puedes escribir directamente a nuestro correo de privacidad y soporte:{' '}
                    <a href="mailto:contacto@neofaro.com" className="text-cyan-400 hover:underline font-mono">
                      contacto@neofaro.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer con enlaces legales */}
        <div className="pt-6 border-t border-zinc-800/80 text-center text-xs text-zinc-500 space-y-2">
          <div className="flex items-center justify-center gap-4 text-[11px] flex-wrap">
            <Link href="/" className="text-zinc-400 hover:text-cyan-400 transition-colors">
              Inicio
            </Link>
            <span className="text-zinc-700">&bull;</span>
            <Link href="/terminos-y-condiciones" className="text-zinc-400 hover:text-cyan-400 transition-colors">
              Términos y Condiciones
            </Link>
            <span className="text-zinc-700">&bull;</span>
            <Link href="/politica-de-privacidad" className="text-zinc-400 hover:text-cyan-400 transition-colors">
              Política de Privacidad
            </Link>
          </div>
          <p className="text-[11px] text-zinc-600">
            NeoFaro &copy; {new Date().getFullYear()} &bull; Descubrí tu barrio, cerca y sin vueltas.
          </p>
        </div>
      </div>
    </div>
  );
}
