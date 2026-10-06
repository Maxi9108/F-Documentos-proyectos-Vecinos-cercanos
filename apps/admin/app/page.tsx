'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Comercio, CreateComercioInput } from '@/types/comercio';
import {
  getComercios,
  createComercio,
  updateComercio,
  deleteComercio,
  toggleComercioEstado,
  levantarCuarentena,
} from '@/lib/supabase';
import {
  loginAdmin,
  verificarCredencialesAdmin,
  verificarPreguntaSeguridadAdmin,
  getSesionAdmin,
  cerrarSesionAdmin,
  solicitarCambioPasswordAdmin,
  restablecerPasswordAdminConPregunta,
  AdminSesion,
} from '@/lib/auth';
import AdminHeader from '@/components/AdminHeader';
import ComerciosTable from '@/components/ComerciosTable';
import ComercioModal from '@/components/ComercioModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { CheckCircle2, AlertCircle, X, ShieldCheck, Mail, Lock, HelpCircle, ChevronRight, Download, KeyRound } from 'lucide-react';

interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

export default function AdminDashboard() {
  // Autenticación de Administrador (2FA: Contraseña + Pregunta de Seguridad)
  const [adminSesion, setAdminSesion] = useState<AdminSesion | null>(null);
  const [isVerificandoSesion, setIsVerificandoSesion] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [pasoLogin, setPasoLogin] = useState<1 | 2>(1);
  const [preguntaSeguridad, setPreguntaSeguridad] = useState('');
  const [respuestaSeguridadInput, setRespuestaSeguridadInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Recuperación In-App de Contraseña de Administrador (100% interna)
  const [modoRecuperarPass, setModoRecuperarPass] = useState(false);
  const [recuperarRespuesta, setRecuperarRespuesta] = useState('');
  const [recuperarNuevaClave, setRecuperarNuevaClave] = useState('');
  const [recuperarConfirmarClave, setRecuperarConfirmarClave] = useState('');
  const [recuperarMensaje, setRecuperarMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);
  const [isRecuperando, setIsRecuperando] = useState(false);

  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Verificar sesión existente al montar
  useEffect(() => {
    const sesion = getSesionAdmin();
    setAdminSesion(sesion);
    setIsVerificandoSesion(false);
  }, []);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comercioToEdit, setComercioToEdit] = useState<Comercio | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [comercioToDelete, setComercioToDelete] = useState<Comercio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado de actualización inline
  const [isUpdatingEstadoId, setIsUpdatingEstadoId] = useState<string | null>(null);

  // Carga de comercios solo si está autenticado
  const cargarComercios = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getComercios();
      setComercios(data);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'No se pudieron cargar los comercios.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (adminSesion) {
      cargarComercios();
    }
  }, [adminSesion, cargarComercios]);

  // Restablecimiento directo de contraseña para Administradores con Pregunta de Seguridad (100% in-app)
  const handleRestablecerAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecuperarMensaje(null);
    const cleanMail = emailInput.trim().toLowerCase();
    if (!cleanMail || !cleanMail.includes('@')) {
      setRecuperarMensaje({ tipo: 'err', texto: 'Por favor ingresa un correo de administrador válido.' });
      return;
    }
    if (recuperarNuevaClave.length < 6) {
      setRecuperarMensaje({ tipo: 'err', texto: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }
    if (recuperarNuevaClave !== recuperarConfirmarClave) {
      setRecuperarMensaje({ tipo: 'err', texto: 'Las contraseñas no coinciden.' });
      return;
    }
    setIsRecuperando(true);
    const res = await restablecerPasswordAdminConPregunta(
      cleanMail,
      recuperarRespuesta.trim(),
      recuperarNuevaClave
    );
    setIsRecuperando(false);
    if (res.ok) {
      setRecuperarMensaje({
        tipo: 'ok',
        texto: '¡Contraseña restablecida con éxito! Ya puedes ingresar con tu nueva clave.',
      });
      setPasswordInput(recuperarNuevaClave);
      setTimeout(() => {
        setModoRecuperarPass(false);
        setRecuperarMensaje(null);
        setRecuperarRespuesta('');
        setRecuperarNuevaClave('');
        setRecuperarConfirmarClave('');
      }, 1800);
    } else {
      setRecuperarMensaje({
        tipo: 'err',
        texto: res.error || 'Respuesta de seguridad incorrecta o administrador no encontrado.',
      });
    }
  };

  // Paso 1 de Login: Validación de Email y Contraseña
  const handleLoginPaso1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const res = await verificarCredencialesAdmin(emailInput, passwordInput);
      if (res.ok) {
        setPreguntaSeguridad(
          res.pregunta || '¿Cuál es tu palabra clave de seguridad o ciudad de origen?'
        );
        setPasoLogin(2);
      } else {
        setAuthError(res.error || 'Credenciales inválidas.');
      }
    } catch {
      setAuthError('Error de conexión al autenticar.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Paso 2 de Login: Doble Identificación con Pregunta de Seguridad
  const handleLoginPaso2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoggingIn(true);
    try {
      const res = await verificarPreguntaSeguridadAdmin(emailInput, respuestaSeguridadInput);
      if (res.ok && res.admin) {
        setAdminSesion(res.admin);
        setPasswordInput('');
        setRespuestaSeguridadInput('');
        setPasoLogin(1);
      } else {
        setAuthError(res.error || 'Respuesta de seguridad incorrecta. Verifica tu respuesta secreta.');
      }
    } catch {
      setAuthError('Error al validar tu respuesta de seguridad.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVolverPaso1 = () => {
    setPasoLogin(1);
    setRespuestaSeguridadInput('');
    setAuthError(null);
  };

  const handleLogout = () => {
    cerrarSesionAdmin();
    setAdminSesion(null);
    setPasoLogin(1);
    setPasswordInput('');
    setRespuestaSeguridadInput('');
  };

  // Descarga de Planilla CSV con información pública y no privada
  const handleDescargarCSVPublico = () => {
    const encabezados = [
      'ID',
      'Nombre',
      'Rubro',
      'Dirección',
      'Localidad',
      'Categoría / Nivel',
      'Estado Abierto',
      'Estado Aprobación',
      'Teléfono',
      'WhatsApp',
      'Email Público',
      'Envíos a Domicilio',
      'Alcance de Envíos',
      'Strikes Reportes',
      'Strikes Urgencia',
      'En Cuarentena',
      'Sitio Web',
      'Instagram',
      'TikTok',
      'Facebook',
      'Otros Enlaces',
      'Fecha Creación',
    ];

    const filas = comercios.map((c) => [
      `"${(c.id || '').replace(/"/g, '""')}"`,
      `"${(c.nombre || '').replace(/"/g, '""')}"`,
      `"${(c.rubro || '').replace(/"/g, '""')}"`,
      `"${(c.direccion || '').replace(/"/g, '""')}"`,
      `"${(c.localidad || 'Barrio General').replace(/"/g, '""')}"`,
      `"${(c.nivel || 'standar').toUpperCase()}"`,
      `"${c.esta_abierto ? 'Abierto' : 'Cerrado'}"`,
      `"${(c.estado_aprobacion || 'aprobado').toUpperCase()}"`,
      `"${(c.telefono || '').replace(/"/g, '""')}"`,
      `"${(c.whatsapp || '').replace(/"/g, '""')}"`,
      `"${(c.email || c.email_comercio || '').replace(/"/g, '""')}"`,
      `"${c.tipo_atencion !== 'local_fisico' ? 'Sí' : 'No'}"`,
      `"${(c.cobertura_poligono && c.cobertura_poligono.length > 0
        ? `Polígono dibujado (${c.cobertura_poligono.length} puntos)`
        : c.radio_entrega_metros
        ? `${c.radio_entrega_metros / 1000} km`
        : 'Sin envíos'
      ).replace(/"/g, '""')}"`,
      `"${c.strikes_reportes || 0}"`,
      `"${c.strikes_urgencia || 0}"`,
      `"${c.en_cuarentena ? 'SÍ' : 'NO'}"`,
      `"${(c.sitio_web || '').replace(/"/g, '""')}"`,
      `"${(c.instagram || '').replace(/"/g, '""')}"`,
      `"${(c.tiktok || '').replace(/"/g, '""')}"`,
      `"${(c.facebook || '').replace(/"/g, '""')}"`,
      `"${(c.otros_links || '').replace(/"/g, '""')}"`,
      `"${c.fecha_creacion || c.fecha_solicitud || ''}"`,
    ]);

    const csvContenido = '\uFEFF' + [encabezados.join(';'), ...filas.map((f) => f.join(';'))].join('\r\n');
    const blob = new Blob([csvContenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `comercios_neofaro_admin_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Temporizador para auto-ocultar notificaciones
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Cálculos estadísticos para el header
  const totalComercios = comercios.length;
  const totalAbiertos = useMemo(() => comercios.filter((c) => c.esta_abierto && !c.en_cuarentena).length, [comercios]);
  const totalCerrados = totalComercios - totalAbiertos;
  const totalRubros = useMemo(() => new Set(comercios.map((c) => c.rubro)).size, [comercios]);
  const totalCuarentena = useMemo(() => comercios.filter((c) => Boolean(c.en_cuarentena)).length, [comercios]);

  // Levantar cuarentena de un comercio
  const handleLevantarCuarentena = async (comercio: Comercio) => {
    if (confirm(`¿Levantar la cuarentena preventiva de "${comercio.nombre}" y restaurar su visibilidad pública en el mapa?`)) {
      const res = await levantarCuarentena(comercio.id);
      if (res.success) {
        setComercios((prev) =>
          prev.map((c) =>
            c.id === comercio.id
              ? {
                  ...c,
                  en_cuarentena: false,
                  fecha_cuarentena: undefined,
                  motivo_cuarentena: undefined,
                  strikes_reportes: 0,
                  esta_abierto: true,
                }
              : c
          )
        );
        setNotification({
          type: 'success',
          message: `Cuarentena de "${comercio.nombre}" levantada exitosamente.`,
        });
      } else {
        setNotification({
          type: 'error',
          message: `Error al levantar cuarentena: ${res.error}`,
        });
      }
    }
  };

  // Abrir modal de creación
  const handleNuevoComercio = () => {
    setComercioToEdit(null);
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleEditarComercio = (comercio: Comercio) => {
    setComercioToEdit(comercio);
    setIsModalOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSaveComercio = async (data: CreateComercioInput): Promise<boolean> => {
    if (comercioToEdit) {
      // Actualización
      const res = await updateComercio(comercioToEdit.id, data);
      if (res.error) {
        setNotification({
          type: 'error',
          message: `Error al actualizar: ${res.error}`,
        });
        return false;
      }

      setComercios((prev) =>
        prev.map((c) => (c.id === comercioToEdit.id ? (res.data as Comercio) : c))
      );
      setNotification({
        type: 'success',
        message: `Comercio "${data.nombre}" actualizado correctamente.`,
      });
      return true;
    } else {
      // Creación
      const res = await createComercio(data);
      if (res.error || !res.data) {
        setNotification({
          type: 'error',
          message: `Error al crear: ${res.error || 'Desconocido'}`,
        });
        return false;
      }

      setComercios((prev) => [res.data as Comercio, ...prev]);
      setNotification({
        type: 'success',
        message: `Comercio "${data.nombre}" agregado al directorio.`,
      });
      return true;
    }
  };

  // Abrir modal de eliminación
  const handleDeletePrompt = (comercio: Comercio) => {
    setComercioToDelete(comercio);
    setIsDeleteModalOpen(true);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async (id: string) => {
    setIsDeleting(true);
    const res = await deleteComercio(id);
    setIsDeleting(false);

    if (res.success) {
      setComercios((prev) => prev.filter((c) => c.id !== id));
      setIsDeleteModalOpen(false);
      setComercioToDelete(null);
      setNotification({
        type: 'success',
        message: 'Comercio dado de baja con éxito.',
      });
    } else {
      setNotification({
        type: 'error',
        message: `Error al eliminar: ${res.error}`,
      });
    }
  };

  // Alternar estado abierto/cerrado directamente
  const handleToggleEstado = async (id: string, nuevoEstado: boolean) => {
    setIsUpdatingEstadoId(id);
    const res = await toggleComercioEstado(id, nuevoEstado);
    setIsUpdatingEstadoId(null);

    if (res.success) {
      setComercios((prev) =>
        prev.map((c) => (c.id === id ? { ...c, esta_abierto: nuevoEstado } : c))
      );
      setNotification({
        type: 'success',
        message: `Estado actualizado a ${nuevoEstado ? 'Abierto' : 'Cerrado'}.`,
      });
    } else {
      setNotification({
        type: 'error',
        message: `Error al cambiar estado: ${res.error}`,
      });
    }
  };

  if (isVerificandoSesion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (!adminSesion) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-4 text-white">
        <div className="w-full max-w-md bg-zinc-900/90 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg shadow-indigo-950/60">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              NeoFaro
            </h1>
            <p className="text-xs text-zinc-400">
              Panel Administrativo y Control de Certeza Barrial
            </p>
          </div>

          {modoRecuperarPass ? (
            <form onSubmit={handleRestablecerAdmin} className="space-y-4">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-800/40">
                <span className="font-semibold text-amber-300">Recuperación de Contraseña:</span>
                <span>Validación Secreta In-App</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                <p className="text-xs text-zinc-300 font-semibold">
                  Restablecimiento inmediato sin dependencias de correo
                </p>
                <p className="text-[11px] text-zinc-400">
                  Ingresa tu respuesta de seguridad secreta para definir tu nueva contraseña de administrador.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Correo de Administrador
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@neofaro.com"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                  Respuesta de Seguridad Secreta
                </label>
                <input
                  type="text"
                  required
                  value={recuperarRespuesta}
                  onChange={(e) => setRecuperarRespuesta(e.target.value)}
                  placeholder="Respuesta a tu pregunta de seguridad"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Responde a: <em>¿Cuál es tu palabra clave de seguridad o ciudad de origen?</em>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={recuperarNuevaClave}
                  onChange={(e) => setRecuperarNuevaClave(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  Confirmar Nueva Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={recuperarConfirmarClave}
                  onChange={(e) => setRecuperarConfirmarClave(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              {recuperarMensaje && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    recuperarMensaje.tipo === 'ok'
                      ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{recuperarMensaje.texto}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isRecuperando}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold text-sm rounded-xl transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{isRecuperando ? 'Restableciendo...' : 'Restablecer e Iniciar Sesión'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModoRecuperarPass(false);
                  setRecuperarMensaje(null);
                }}
                className="w-full py-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
              >
                ← Volver al formulario de ingreso
              </button>
            </form>
          ) : pasoLogin === 1 ? (
            <form onSubmit={handleLoginPaso1} className="space-y-4">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-lg border border-zinc-800">
                <span className="font-semibold text-indigo-400">Paso 1 de 2:</span>
                <span>Credenciales de acceso</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="admin@neofaro.com"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setModoRecuperarPass(true);
                      setRecuperarMensaje(null);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Ingresa tu contraseña de administrador"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>

              {authError && (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{authError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setModoRecuperarPass(true);
                      setRecuperarMensaje(null);
                    }}
                    className="w-full py-2 px-3 bg-zinc-900 hover:bg-zinc-800 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Restablecer contraseña con pregunta de seguridad</span>
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>{isLoggingIn ? 'Verificando...' : 'Continuar a Pregunta de Seguridad'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginPaso2} className="space-y-4">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 bg-indigo-950/50 px-3 py-1.5 rounded-lg border border-indigo-800/50">
                <span className="font-semibold text-indigo-300">Paso 2 de 2:</span>
                <span>Doble Factor de Seguridad</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider block">
                  Pregunta de Seguridad Registrada:
                </span>
                <p className="text-sm font-semibold text-white">
                  {preguntaSeguridad}
                </p>
                <p className="text-[11px] text-zinc-500">
                  Responde a tu pregunta secreta de administrador para confirmar tu identidad.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  Tu Respuesta Secreta
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={respuestaSeguridadInput}
                  onChange={(e) => setRespuestaSeguridadInput(e.target.value)}
                  placeholder="Ingresa tu respuesta de seguridad"
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isLoggingIn ? 'Verificando identidad...' : 'Confirmar e Ingresar al Panel'}</span>
              </button>

              <button
                type="button"
                onClick={handleVolverPaso1}
                className="w-full py-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
              >
                ← Volver a ingresar correo o contraseña
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Header superior y métricas */}
      <AdminHeader
        totalComercios={totalComercios}
        totalAbiertos={totalAbiertos}
        totalCerrados={totalCerrados}
        totalRubros={totalRubros}
        totalCuarentena={totalCuarentena}
        onNuevoComercio={handleNuevoComercio}
        onRefresh={cargarComercios}
        isLoading={isLoading}
        onLogout={handleLogout}
        onDescargarCSV={handleDescargarCSVPublico}
      />

      {/* Contenedor de notificación Toast flotante */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-rose-900 text-rose-100 border-rose-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 hover:opacity-75 rounded transition-opacity ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Área de Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ComerciosTable
          comercios={comercios}
          onEdit={handleEditarComercio}
          onDelete={handleDeletePrompt}
          onToggleEstado={handleToggleEstado}
          onLevantarCuarentena={handleLevantarCuarentena}
          isUpdatingEstadoId={isUpdatingEstadoId}
        />
      </main>

      {/* Modal de Creación / Edición */}
      <ComercioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveComercio}
        comercioToEdit={comercioToEdit}
      />

      {/* Modal de Confirmación de Baja */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        comercio={comercioToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setComercioToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-5 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            NeoFaro Admin &copy; {new Date().getFullYear()} — Plataforma de Infraestructura Hiperlocal
          </p>
        </div>
      </footer>
    </div>
  );
}
