'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Comercio, Administrador, Categoria, PermisosAdmin, NivelComercio, NIVELES_CONFIG } from '@/types/comercio';
import {
  getComercios,
  eliminarComercio,
  guardarComercio,
  aprobarComercio,
  rechazarComercio,
  renovarMembresiaComercio,
  cambiarNivelComercio,
  toggleCerradoMomentaneo,
  toggleFarmaciaTurno,
  configurarVacaciones,
  reanudarHorarioNormal,
} from '@/lib/supabase';
import {
  getAdminActual,
  autenticarAdmin,
  cerrarSesionAdmin,
  actualizarPerfilSuperAdmin,
  crearAdminNivel2,
  getAdministradores,
  eliminarAdmin,
  actualizarAdmin,
} from '@/lib/auth-admin';
import {
  getCategorias,
  agregarCategoria,
  homologarCategoriaSolicitada,
  eliminarCategoria,
} from '@/lib/categorias';
import {
  getMetricasResumen,
  generarInformeTextoDiario,
  registrarEvento,
} from '@/lib/analytics';
import {
  ShieldCheck,
  Store,
  MapPin,
  Phone,
  Trash2,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Sparkles,
  ArrowLeft,
  Plus,
  KeyRound,
  LogOut,
  ExternalLink,
  Bike,
  Users,
  BarChart3,
  Clock,
  Copy,
  Check,
  Search,
  Mail,
  Lock,
  Tag,
  Activity,
  FileText,
  AlertTriangle,
  UserCheck,
  Crown,
  Award,
  Calendar,
  RefreshCw,
  Sun,
  Moon,
  Palmtree,
  Pill,
  AlertCircle,
  Database,
  Download,
} from 'lucide-react';

export default function AdminPage() {
  // Estado de Autenticación
  const [adminActual, setAdminActual] = useState<Administrador | null>(null);
  const [emailInput, setEmailInput] = useState('maxi0802@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Pestaña Activa
  const [pestanaActiva, setPestanaActiva] = useState<
    'pendientes' | 'activos' | 'metricas' | 'categorias' | 'equipo' | 'perfil'
  >('pendientes');

  // Datos
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [metricas, setMetricas] = useState(getMetricasResumen());

  // Estados de formularios y acciones
  const [filtroRubro, setFiltroRubro] = useState('Todos');
  const [filtroNivel, setFiltroNivel] = useState<'Todos' | 'standar' | 'premium' | 'gold' | 'por_vencer'>('Todos');
  const [busquedaActivos, setBusquedaActivos] = useState('');
  const [copiadoInforme, setCopiadoInforme] = useState(false);
  const [rubroAprobacion, setRubroAprobacion] = useState<Record<string, string>>({});
  const [nivelAprobacion, setNivelAprobacion] = useState<Record<string, NivelComercio>>({});
  const [renovandoId, setRenovandoId] = useState<string | null>(null);

  // Formulario Perfil SuperAdmin
  const [perfilEmail, setPerfilEmail] = useState('');
  const [perfilNombre, setPerfilNombre] = useState('');
  const [perfilPassActual, setPerfilPassActual] = useState('');
  const [perfilPassNuevo, setPerfilPassNuevo] = useState('');
  const [perfilPassConfirm, setPerfilPassConfirm] = useState('');
  const [perfilMensaje, setPerfilMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Formulario Admin Nivel 2
  const [n2Email, setN2Email] = useState('');
  const [n2Nombre, setN2Nombre] = useState('');
  const [n2Pass, setN2Pass] = useState('');
  const [n2PermisoCorroborar, setN2PermisoCorroborar] = useState(true);
  const [n2PermisoAprobar, setN2PermisoAprobar] = useState(true);
  const [n2PermisoCategorias, setN2PermisoCategorias] = useState(true);
  const [n2Mensaje, setN2Mensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Formulario Nueva Categoría
  const [nuevaCatNombre, setNuevaCatNombre] = useState('');
  const [catMensaje, setCatMensaje] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  // Cargar sesión inicial
  useEffect(() => {
    const sesion = getAdminActual();
    if (sesion) {
      setAdminActual(sesion);
      setPerfilEmail(sesion.email);
      setPerfilNombre(sesion.nombre);
    }
  }, []);

  // Cargar comercios y dependencias al autenticar
  useEffect(() => {
    if (adminActual) {
      recargarDatos();
    }
  }, [adminActual]);

  const recargarDatos = async () => {
    setCargando(true);
    const base = await getComercios();

    let lista = [...base];
    try {
      const localesRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (localesRaw) {
        const locales: Comercio[] = JSON.parse(localesRaw);
        locales.forEach((loc) => {
          const idx = lista.findIndex((c) => c.id === loc.id);
          if (idx >= 0) {
            lista[idx] = loc;
          } else {
            lista.unshift(loc);
          }
        });
      }
    } catch (e) {
      console.warn(e);
    }

    setComercios(lista);
    setCategorias(getCategorias());
    setAdministradores(getAdministradores());
    setMetricas(getMetricasResumen());
    setCargando(false);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const res = autenticarAdmin(emailInput, passwordInput);
    if (res.exito && res.admin) {
      setAdminActual(res.admin);
      setPerfilEmail(res.admin.email);
      setPerfilNombre(res.admin.nombre);
    } else {
      setLoginError(res.error || 'Credenciales incorrectas');
    }
  };

  const handleLogout = () => {
    cerrarSesionAdmin();
    setAdminActual(null);
    setPasswordInput('');
  };

  // Filtrado de Comercios
  const solicitudesPendientes = useMemo(() => {
    return comercios.filter((c) => c.estado_aprobacion === 'pendiente');
  }, [comercios]);

  const comerciosAprobados = useMemo(() => {
    return comercios.filter((c) => !c.estado_aprobacion || c.estado_aprobacion === 'aprobado');
  }, [comercios]);

  const comerciosActivosFiltrados = useMemo(() => {
    const q = busquedaActivos.trim().toLowerCase();
    const ahora = Date.now();

    return comerciosAprobados.filter((c) => {
      const coincideQ =
        q === '' ||
        c.nombre.toLowerCase().includes(q) ||
        c.rubro.toLowerCase().includes(q) ||
        c.direccion.toLowerCase().includes(q);
      const coincideR = filtroRubro === 'Todos' || c.rubro === filtroRubro;

      let coincideN = true;
      if (filtroNivel === 'standar') {
        coincideN = !c.nivel || c.nivel === 'standar';
      } else if (filtroNivel === 'premium') {
        coincideN = c.nivel === 'premium';
      } else if (filtroNivel === 'gold') {
        coincideN = c.nivel === 'gold';
      } else if (filtroNivel === 'por_vencer') {
        if (c.nivel && c.nivel !== 'standar' && c.fecha_vencimiento_nivel) {
          const fvMs = new Date(c.fecha_vencimiento_nivel).getTime();
          const diasRestantes = Math.ceil((fvMs - ahora) / (1000 * 60 * 60 * 24));
          coincideN = diasRestantes <= 7;
        } else {
          coincideN = false;
        }
      }

      return coincideQ && coincideR && coincideN;
    });
  }, [comerciosAprobados, busquedaActivos, filtroRubro, filtroNivel]);

  // Acciones de Moderación
  const handleAprobar = async (comercio: Comercio) => {
    const rubroFinal = rubroAprobacion[comercio.id] || comercio.rubro;
    const nivelFinal = nivelAprobacion[comercio.id] || comercio.nivel_solicitado || 'standar';

    await aprobarComercio(
      comercio.id,
      rubroFinal,
      adminActual?.email || 'maxi0802@gmail.com',
      nivelFinal
    );

    registrarEvento('comercio_aprobado', comercio.id, comercio.nombre, {
      rubro: rubroFinal,
      nivel: nivelFinal,
    });

    const ahora = new Date();
    const fechaAprobacion = ahora.toISOString();
    let fechaVencimiento: string | null = null;
    if (nivelFinal === 'premium' || nivelFinal === 'gold') {
      const fv = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
      fechaVencimiento = fv.toISOString();
    }

    setComercios((prev) =>
      prev.map((c) =>
        c.id === comercio.id
          ? {
              ...c,
              estado_aprobacion: 'aprobado',
              rubro: rubroFinal,
              nivel: nivelFinal,
              fecha_inicio_nivel: fechaAprobacion,
              fecha_vencimiento_nivel: fechaVencimiento,
              aprobado_por: adminActual?.email,
              fecha_aprobacion: fechaAprobacion,
            }
          : c
      )
    );
  };

  const handleRenovarMembresia = async (comercio: Comercio) => {
    setRenovandoId(comercio.id);
    const res = await renovarMembresiaComercio(comercio.id, 30);
    setRenovandoId(null);

    if (res.success && res.nuevaFechaVencimiento) {
      registrarEvento('visita_comercio', comercio.id, comercio.nombre, {
        accion: 'renovacion_30_dias',
        nuevaFecha: res.nuevaFechaVencimiento,
      });

      setComercios((prev) =>
        prev.map((c) =>
          c.id === comercio.id
            ? {
                ...c,
                nivel: (c.nivel && c.nivel !== 'standar' ? c.nivel : c.nivel_solicitado || 'premium'),
                fecha_vencimiento_nivel: res.nuevaFechaVencimiento,
                fecha_ultima_renovacion: new Date().toISOString(),
              }
            : c
        )
      );
    }
  };

  const handleCambiarNivelDirecto = async (comercio: Comercio, nuevoNivel: NivelComercio) => {
    const res = await cambiarNivelComercio(comercio.id, nuevoNivel, 30);
    if (res.success) {
      const ahora = new Date();
      let fv: string | null = null;
      if (nuevoNivel === 'premium' || nuevoNivel === 'gold') {
        const v = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000);
        fv = v.toISOString();
      }

      setComercios((prev) =>
        prev.map((c) =>
          c.id === comercio.id
            ? {
                ...c,
                nivel: nuevoNivel,
                fecha_inicio_nivel: ahora.toISOString(),
                fecha_vencimiento_nivel: fv,
              }
            : c
        )
      );
    }
  };

  const handleToggleFarmaciaTurno = async (comercio: Comercio) => {
    const nuevoEstado = !comercio.esta_de_turno;
    const res = await toggleFarmaciaTurno(comercio.id, nuevoEstado);
    if (res.success) {
      registrarEvento('visita_comercio', comercio.id, comercio.nombre, {
        accion: 'toggle_farmacia_turno',
        esta_de_turno: nuevoEstado,
      });
      setComercios((prev) =>
        prev.map((c) => (c.id === comercio.id ? { ...c, esta_de_turno: nuevoEstado } : c))
      );
    }
  };

  const handleCerrarMomentaneo = async (comercio: Comercio) => {
    const motivo = prompt(
      `Motivo de cierre temporal para "${comercio.nombre}":`,
      comercio.motivo_cierre_momentaneo || 'Corte de luz / Mantenimiento imprevisto'
    );
    if (motivo === null) return;
    const res = await toggleCerradoMomentaneo(comercio.id, true, motivo);
    if (res.success) {
      registrarEvento('visita_comercio', comercio.id, comercio.nombre, {
        accion: 'cerrado_momentaneo',
        motivo,
      });
      setComercios((prev) =>
        prev.map((c) =>
          c.id === comercio.id
            ? { ...c, cerrado_momentaneo: true, motivo_cierre_momentaneo: motivo, esta_abierto: false }
            : c
        )
      );
    }
  };

  const handleCargarVacaciones = async (comercio: Comercio) => {
    const hoy = new Date().toISOString().split('T')[0];
    const desde = prompt('Fecha de inicio de vacaciones (AAAA-MM-DD):', comercio.vacaciones_desde || hoy);
    if (!desde) return;
    const hasta = prompt('Fecha estimada de regreso (AAAA-MM-DD):', comercio.vacaciones_hasta || '');
    const mensaje = prompt('Mensaje para los clientes:', comercio.mensaje_vacaciones || 'Cerrado por descanso anual. ¡Nos vemos pronto!');

    const res = await configurarVacaciones(comercio.id, true, desde, hasta || undefined, mensaje || undefined);
    if (res.success) {
      registrarEvento('visita_comercio', comercio.id, comercio.nombre, {
        accion: 'cargar_vacaciones',
        desde,
        hasta,
      });
      setComercios((prev) =>
        prev.map((c) =>
          c.id === comercio.id
            ? {
                ...c,
                en_vacaciones: true,
                vacaciones_desde: desde,
                vacaciones_hasta: hasta || undefined,
                mensaje_vacaciones: mensaje || undefined,
                esta_abierto: false,
              }
            : c
        )
      );
    }
  };

  const handleReanudarHorarioNormal = async (comercio: Comercio) => {
    if (confirm(`¿Reanudar los horarios habituales de "${comercio.nombre}" y retirar el estado de cerrado / vacaciones?`)) {
      const res = await reanudarHorarioNormal(comercio.id);
      if (res.success) {
        registrarEvento('visita_comercio', comercio.id, comercio.nombre, {
          accion: 'reanudar_horario_normal',
        });
        setComercios((prev) =>
          prev.map((c) =>
            c.id === comercio.id
              ? {
                  ...c,
                  cerrado_momentaneo: false,
                  motivo_cierre_momentaneo: undefined,
                  en_vacaciones: false,
                  vacaciones_desde: undefined,
                  vacaciones_hasta: undefined,
                  mensaje_vacaciones: undefined,
                  esta_abierto: true,
                }
              : c
          )
        );
      }
    }
  };

  const handleRechazar = async (comercio: Comercio) => {
    const motivo = prompt(
      `Indica el motivo de rechazo para "${comercio.nombre}":`,
      'Datos incompletos o fuera de zona barrial'
    );
    if (!motivo) return;

    await rechazarComercio(comercio.id, motivo);
    registrarEvento('comercio_rechazado', comercio.id, comercio.nombre, { motivo });

    setComercios((prev) =>
      prev.map((c) =>
        c.id === comercio.id
          ? { ...c, estado_aprobacion: 'rechazado', motivo_rechazo: motivo }
          : c
      )
    );
  };

  const toggleEstadoComercio = async (comercio: Comercio) => {
    const actualizado = { ...comercio, esta_abierto: !comercio.esta_abierto };
    await guardarComercio(actualizado);
    setComercios((prev) => prev.map((c) => (c.id === comercio.id ? actualizado : c)));
  };

  const handleEliminar = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de que deseas eliminar permanentemente "${nombre}"?`)) {
      await eliminarComercio(id);
      setComercios((prev) => prev.filter((c) => c.id !== id));
    }
  };

  // Copiar reporte diario
  const handleCopiarReporteDiario = () => {
    const texto = generarInformeTextoDiario(comercios);
    navigator.clipboard.writeText(texto);
    setCopiadoInforme(true);
    setTimeout(() => setCopiadoInforme(false), 3000);
  };

  // Guardar Cambios de Perfil SuperAdmin
  const handleActualizarPerfil = (e: React.FormEvent) => {
    e.preventDefault();
    setPerfilMensaje(null);

    if (perfilPassNuevo && perfilPassNuevo !== perfilPassConfirm) {
      setPerfilMensaje({ tipo: 'err', texto: 'Las contraseñas nuevas no coinciden.' });
      return;
    }

    if (perfilPassNuevo && perfilPassNuevo.length < 4) {
      setPerfilMensaje({ tipo: 'err', texto: 'La nueva contraseña debe tener al menos 4 caracteres.' });
      return;
    }

    const res = actualizarPerfilSuperAdmin(
      perfilEmail,
      perfilPassNuevo || undefined,
      perfilNombre
    );

    if (res.exito && res.admin) {
      setAdminActual(res.admin);
      setPerfilPassActual('');
      setPerfilPassNuevo('');
      setPerfilPassConfirm('');
      setPerfilMensaje({ tipo: 'ok', texto: '¡Perfil y credenciales actualizadas correctamente!' });
    } else {
      setPerfilMensaje({ tipo: 'err', texto: res.error || 'Error al actualizar perfil' });
    }
  };

  // Crear Administrador Nivel 2
  const handleCrearAdminNivel2 = (e: React.FormEvent) => {
    e.preventDefault();
    setN2Mensaje(null);

    const permisos: PermisosAdmin = {
      corroborar_locales: n2PermisoCorroborar,
      aprobar_rechazar: n2PermisoAprobar,
      asignar_categorias: n2PermisoCategorias,
    };

    const res = crearAdminNivel2({
      email: n2Email,
      nombre: n2Nombre,
      password: n2Pass,
      permisos,
    });

    if (res.exito) {
      setN2Email('');
      setN2Nombre('');
      setN2Pass('');
      setAdministradores(getAdministradores());
      setN2Mensaje({ tipo: 'ok', texto: '¡Administrador Nivel 2 creado exitosamente!' });
    } else {
      setN2Mensaje({ tipo: 'err', texto: res.error || 'Error al crear moderador' });
    }
  };

  // Crear Categoría
  const handleCrearCategoria = (e: React.FormEvent) => {
    e.preventDefault();
    setCatMensaje(null);
    const res = agregarCategoria(nuevaCatNombre, adminActual?.nombre || 'SuperAdmin');
    if (res.exito) {
      setNuevaCatNombre('');
      setCategorias(getCategorias());
      setCatMensaje({ tipo: 'ok', texto: `Categoría "${res.categoria?.nombre}" agregada.` });
    } else {
      setCatMensaje({ tipo: 'err', texto: res.error || 'Error al crear categoría' });
    }
  };

  const handleHomologarCategoria = (solicitada: string) => {
    const res = homologarCategoriaSolicitada(solicitada, adminActual?.nombre || 'SuperAdmin');
    if (res.exito) {
      setCategorias(getCategorias());
      alert(`¡Categoría "${solicitada}" aprobada y añadida al listado oficial!`);
    } else {
      alert(res.error || 'No se pudo homologar la categoría.');
    }
  };

  // Pantalla de Login de Administrador
  if (!adminActual) {
    return (
      <main className="min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-600/20 text-cyan-400 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-950/60">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Panel de Administración
            </h1>
            <p className="text-xs text-zinc-400">
              Control de comercios, moderación de solicitudes e informes de NeoFaro.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-cyan-400" />
                Correo de Administrador
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="maxi0802@gmail.com"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                Contraseña
              </label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Ingresa tu contraseña"
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                SuperAdmin inicial configurado para: <strong>maxi0802@gmail.com</strong>
              </p>
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-950/60 cursor-pointer"
            >
              Ingresar al Panel
            </button>
          </form>

          <div className="pt-2 text-center border-t border-zinc-800/80">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Mapa del Barrio
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Dashboard de Administración Autenticado
  const esSuperAdmin = adminActual.rol === 'superadmin';

  return (
    <main className="min-h-screen bg-black text-zinc-100 flex flex-col">
      {/* Barra Superior del Panel */}
      <header className="sticky top-0 z-20 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
              title="Volver a la App"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-white">Centro de Control</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    esSuperAdmin
                      ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  {esSuperAdmin ? '👑 SuperAdmin' : '🛡️ Admin Nivel 2'}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">{adminActual.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/backup?download=true"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 no-underline"
              title="Descargar copia de seguridad completa en formato JSON (se genera también automáticamente cada 12 horas)"
            >
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Respaldar BD (12h)</span>
              <span className="sm:hidden">Respaldo</span>
            </a>

            <button
              type="button"
              onClick={handleCopiarReporteDiario}
              className="py-1.5 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {copiadoInforme ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiadoInforme ? '¡Reporte Copiado!' : 'Copiar Informe Diario'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>

        {/* Barra de Pestañas */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto border-t border-zinc-900 scrollbar-none">
          <button
            type="button"
            onClick={() => setPestanaActiva('pendientes')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'pendientes'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Solicitudes Pendientes
            {solicitudesPendientes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-black animate-pulse">
                {solicitudesPendientes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('activos')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'activos'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Store className="w-4 h-4" />
            Comercios Aprobados ({comerciosAprobados.length})
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('metricas')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'metricas'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Informes & Movimientos
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('categorias')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'categorias'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Tag className="w-4 h-4 text-indigo-400" />
            Gestión de Categorías ({categorias.length})
          </button>

          {esSuperAdmin && (
            <button
              type="button"
              onClick={() => setPestanaActiva('equipo')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                pestanaActiva === 'equipo'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-400" />
              Equipo (Admin Nivel 2)
            </button>
          )}

          {esSuperAdmin && (
            <button
              type="button"
              onClick={() => setPestanaActiva('perfil')}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                pestanaActiva === 'perfil'
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <KeyRound className="w-4 h-4 text-amber-400" />
              Mi Perfil & Contraseña
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* PESTAÑA 1: SOLICITUDES PENDIENTES */}
        {pestanaActiva === 'pendientes' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/30 to-zinc-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-400" />
                  Cola de Moderación: Comercios Pendientes ({solicitudesPendientes.length})
                </h2>
                <p className="text-xs text-zinc-400">
                  Verifica que los datos del negocio, ubicación y teléfonos sean correctos antes de habilitar su publicación en el barrio.
                </p>
              </div>

              <button
                type="button"
                onClick={recargarDatos}
                className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-xl transition-colors shrink-0"
              >
                Actualizar lista
              </button>
            </div>

            {solicitudesPendientes.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">¡No hay solicitudes pendientes!</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Todos los comercios registrados en el portal ya fueron moderados o aprobados.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {solicitudesPendientes.map((comercio) => {
                  const rubroActual = rubroAprobacion[comercio.id] || comercio.rubro;

                  return (
                    <div
                      key={comercio.id}
                      className="bg-zinc-950 border border-amber-500/40 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-1.5">
                              Esperando Aprobación
                            </span>
                            <h3 className="text-xl font-bold text-white">{comercio.nombre}</h3>
                          </div>
                          {comercio.tipo_atencion === 'solo_envio' && (
                            <span className="px-2.5 py-1 rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 text-xs font-bold flex items-center gap-1">
                              <Bike className="w-3.5 h-3.5" />
                              Solo Envíos
                            </span>
                          )}
                        </div>

                        {comercio.descripcion && (
                          <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/50 p-2.5 rounded-xl border border-zinc-800/50">
                            {comercio.descripcion}
                          </p>
                        )}

                        {/* Categoría Solicitada destacada */}
                        {comercio.categoria_solicitada && (
                          <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-500/40 space-y-1">
                            <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                              Categoría solicitada por el comerciante:
                            </span>
                            <p className="text-sm font-black text-white">
                              &quot;{comercio.categoria_solicitada}&quot;
                            </p>
                            <button
                              type="button"
                              onClick={() => handleHomologarCategoria(comercio.categoria_solicitada!)}
                              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium pt-1 block"
                            >
                              Sumar &quot;{comercio.categoria_solicitada}&quot; a las categorías oficiales del portal
                            </button>
                          </div>
                        )}

                        {/* Datos de contacto y ubicación */}
                        <div className="space-y-1.5 text-xs text-zinc-400">
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>{comercio.direccion}</span>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${comercio.latitud},${comercio.longitud}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] text-indigo-400 hover:underline flex items-center gap-0.5 ml-auto"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Ver en Mapa
                            </a>
                          </p>
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>Tel: {comercio.telefono} | WhatsApp: {comercio.whatsapp || 'No especificado'}</span>
                          </p>
                          {Boolean(comercio.radio_entrega_metros) && (
                            <p className="flex items-center gap-2 text-cyan-300">
                              <Bike className="w-4 h-4 shrink-0" />
                              <span>Radio de entrega: {(comercio.radio_entrega_metros! / 1000).toFixed(1)} km</span>
                            </p>
                          )}
                        </div>

                        {/* Selector para asignar o confirmar categoría oficial */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1">
                              Categoría Oficial a Asignar:
                            </label>
                            <select
                              value={rubroActual}
                              onChange={(e) =>
                                setRubroAprobacion((prev) => ({
                                  ...prev,
                                  [comercio.id]: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {categorias.map((c) => (
                                <option key={c.id} value={c.nombre}>
                                  {c.nombre}
                                </option>
                              ))}
                              {comercio.categoria_solicitada && !categorias.some((c) => c.nombre === comercio.categoria_solicitada) && (
                                <option value={comercio.categoria_solicitada}>
                                  {comercio.categoria_solicitada} (Solicitada)
                                </option>
                              )}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                              <span>Nivel de Membresía:</span>
                              <span className="text-[10px] text-amber-400 font-bold uppercase">
                                Pide: {comercio.nivel_solicitado || 'standar'}
                              </span>
                            </label>
                            <select
                              value={nivelAprobacion[comercio.id] || comercio.nivel_solicitado || 'standar'}
                              onChange={(e) =>
                                setNivelAprobacion((prev) => ({
                                  ...prev,
                                  [comercio.id]: e.target.value as NivelComercio,
                                }))
                              }
                              className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                            >
                              <option value="standar">Standar (Catálogo 20 · 0 ofertas)</option>
                              <option value="premium">Premium (Catálogo 50 · 2 ofertas/día · 30 días)</option>
                              <option value="gold">Gold (Catálogo 100 · 5 ofertas/día · 30 días)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Botones de Acción */}
                      <div className="pt-4 border-t border-zinc-800/80 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAprobar(comercio)}
                          className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-950/60 flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Aprobar Comercio
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRechazar(comercio)}
                          className="py-2.5 px-3 bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-800 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-4 h-4" />
                          Rechazar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: COMERCIOS APROBADOS Y ACTIVOS */}
        {pestanaActiva === 'activos' && (
          <div className="space-y-6">
            {/* Barra de Filtros y Búsqueda */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busquedaActivos}
                  onChange={(e) => setBusquedaActivos(e.target.value)}
                  placeholder="Buscar comercio aprobado por nombre o rubro..."
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Filtro por Nivel de Membresía */}
              <select
                value={filtroNivel}
                onChange={(e) => setFiltroNivel(e.target.value as any)}
                className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Todos">Todos los Niveles</option>
                <option value="gold">⭐ Solo Gold</option>
                <option value="premium">💎 Solo Premium</option>
                <option value="standar">🏷️ Solo Standar</option>
                <option value="por_vencer">⚠️ Por Vencer (≤ 7 días)</option>
              </select>

              <select
                value={filtroRubro}
                onChange={(e) => setFiltroRubro(e.target.value)}
                className="px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="Todos">Todos los Rubros</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.nombre}>
                    {c.nombre}
                  </option>
                ))}
              </select>

              <Link
                href="/cargar-comercio"
                className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                Nuevo Local
              </Link>
            </div>

            {/* Badges de Resumen de Niveles Activos */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-500 text-[11px]">Distribución:</span>
              <span className="px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Gold: {comerciosAprobados.filter((c) => c.nivel === 'gold').length}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 font-bold flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                Premium: {comerciosAprobados.filter((c) => c.nivel === 'premium').length}
              </span>
              <span className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-zinc-400" />
                Standar: {comerciosAprobados.filter((c) => !c.nivel || c.nivel === 'standar').length}
              </span>
            </div>

            {/* Lista de Comercios Activos */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comerciosActivosFiltrados.map((comercio) => {
                const fvMs = comercio.fecha_vencimiento_nivel ? new Date(comercio.fecha_vencimiento_nivel).getTime() : 0;
                const ahora = Date.now();
                const diasRestantes = fvMs ? Math.ceil((fvMs - ahora) / (1000 * 60 * 60 * 24)) : 0;
                const estaVencido = fvMs > 0 && fvMs < ahora;
                const nivelEfectivo = comercio.nivel || 'standar';
                const configNivel = NIVELES_CONFIG[nivelEfectivo];

                return (
                  <div
                    key={comercio.id}
                    className={`bg-zinc-950 rounded-3xl p-5 space-y-3.5 flex flex-col justify-between border transition-all ${
                      nivelEfectivo === 'gold'
                        ? 'border-amber-500/40 hover:border-amber-500 shadow-lg shadow-amber-950/20'
                        : nivelEfectivo === 'premium'
                        ? 'border-purple-500/40 hover:border-purple-500 shadow-lg shadow-purple-950/20'
                        : 'border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-2.5">
                      {/* Cabecera con Rubro y Badge de Nivel */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {comercio.rubro}
                          </span>

                          {/* Insignia de Nivel */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                              nivelEfectivo === 'gold'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : nivelEfectivo === 'premium'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                            }`}
                          >
                            {nivelEfectivo === 'gold' && <Crown className="w-3 h-3 text-amber-400" />}
                            {nivelEfectivo === 'premium' && <Award className="w-3 h-3 text-purple-400" />}
                            Nivel {configNivel.nombre}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleEstadoComercio(comercio)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer ${
                            comercio.esta_abierto
                              ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
                              : 'bg-zinc-900 text-zinc-500 border-zinc-800'
                          }`}
                        >
                          {comercio.esta_abierto ? '● Abierto' : '○ Cerrado'}
                        </button>
                      </div>

                      <h3 className="font-bold text-base text-white">{comercio.nombre}</h3>
                      <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span className="truncate">{comercio.direccion}</span>
                      </p>

                      {comercio.tipo_atencion === 'solo_envio' && (
                        <p className="text-[11px] text-cyan-400 flex items-center gap-1">
                          <Bike className="w-3.5 h-3.5" />
                          Solo Envíos (Radio: {(comercio.radio_entrega_metros! / 1000).toFixed(1)} km)
                        </p>
                      )}

                      {/* Horarios (Continuo o Cortado) */}
                      <div className="text-[11px] text-zinc-400 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80 space-y-1">
                        {comercio.tiene_horario_cortado ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Horario Cortado</span>
                            <div className="flex items-center justify-between text-zinc-200">
                              <span className="flex items-center gap-1">
                                <Sun className="w-3 h-3 text-amber-400" />
                                Mañ: {comercio.horario_manana || '08:30 - 13:00'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Moon className="w-3 h-3 text-indigo-400" />
                                Tard: {comercio.horario_tarde || '16:30 - 20:30'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-zinc-300">
                            <Clock className="w-3 h-3 text-zinc-500 shrink-0" />
                            <span>{comercio.horario || 'Horario no especificado'}</span>
                          </div>
                        )}
                      </div>

                      {/* Alerta de Cierre Momentáneo */}
                      {comercio.cerrado_momentaneo && (
                        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold block text-[11px]">Cerrado Momentáneamente</span>
                            <p className="text-[10px] text-amber-300/90 leading-tight">
                              {comercio.motivo_cierre_momentaneo || 'Inconveniente operativo temporal'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Alerta de Vacaciones */}
                      {comercio.en_vacaciones && (
                        <div className="p-2.5 rounded-xl bg-sky-950/40 border border-sky-500/40 text-sky-200 text-xs flex items-start gap-2">
                          <Palmtree className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold block text-[11px]">En Receso por Vacaciones</span>
                            <p className="text-[10px] text-sky-300/90 leading-tight">
                              {comercio.vacaciones_desde ? `Desde ${comercio.vacaciones_desde}` : ''}
                              {comercio.vacaciones_hasta ? ` hasta ${comercio.vacaciones_hasta}` : ''}
                              {comercio.mensaje_vacaciones ? ` — "${comercio.mensaje_vacaciones}"` : ''}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Botón especial: Volver a cumplir horarios normales */}
                      {(comercio.cerrado_momentaneo || comercio.en_vacaciones) && (
                        <button
                          type="button"
                          onClick={() => handleReanudarHorarioNormal(comercio)}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 transition-all cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Volver a cumplir horarios normales
                        </button>
                      )}

                      {/* Barra de Acciones Operativas Rápidas */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {comercio.rubro?.toLowerCase().includes('farmacia') && (
                          <button
                            type="button"
                            onClick={() => handleToggleFarmaciaTurno(comercio)}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors flex items-center gap-1 cursor-pointer ${
                              comercio.esta_de_turno
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 animate-pulse'
                                : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                            }`}
                            title="Indicar si está de turno 24 horas"
                          >
                            <Pill className="w-3 h-3 text-emerald-400" />
                            {comercio.esta_de_turno ? 'De Turno 24hs' : 'Marcar Turno'}
                          </button>
                        )}

                        {!comercio.cerrado_momentaneo && (
                          <button
                            type="button"
                            onClick={() => handleCerrarMomentaneo(comercio)}
                            className="px-2 py-1 rounded-lg text-[10px] font-medium bg-zinc-900 hover:bg-amber-950/30 text-zinc-400 hover:text-amber-300 border border-zinc-800 hover:border-amber-700/50 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Cierre momentáneo por imprevisto"
                          >
                            <AlertCircle className="w-3 h-3" />
                            Cerrar Momentáneo
                          </button>
                        )}

                        {!comercio.en_vacaciones && (
                          <button
                            type="button"
                            onClick={() => handleCargarVacaciones(comercio)}
                            className="px-2 py-1 rounded-lg text-[10px] font-medium bg-zinc-900 hover:bg-sky-950/30 text-zinc-400 hover:text-sky-300 border border-zinc-800 hover:border-sky-700/50 transition-colors flex items-center gap-1 cursor-pointer"
                            title="Cargar fechas de vacaciones"
                          >
                            <Palmtree className="w-3 h-3" />
                            Cargar Vacaciones
                          </button>
                        )}
                      </div>

                      {/* Estado de Membresía y Vencimiento */}
                      {nivelEfectivo !== 'standar' ? (
                        <div
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                            estaVencido
                              ? 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                              : diasRestantes <= 5
                              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
                              : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-zinc-400 block font-medium">Vigencia mensual:</span>
                            <div className="flex items-center gap-1 text-[11px] font-semibold">
                              <Calendar className="w-3 h-3 shrink-0" />
                              {estaVencido ? (
                                <span>Vencido (Degradado a Standar)</span>
                              ) : (
                                <span>Vence en {diasRestantes} días</span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={renovandoId === comercio.id}
                            onClick={() => handleRenovarMembresia(comercio)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                            title="Renovar suscripción mensual por 30 días"
                          >
                            <RefreshCw className={`w-3 h-3 ${renovandoId === comercio.id ? 'animate-spin' : ''}`} />
                            +30 Días
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-zinc-900/40 border border-zinc-800/60 text-[11px] text-zinc-400 flex items-center justify-between">
                          <span>Plan Standar Base (Permanente)</span>
                          <button
                            type="button"
                            onClick={() => handleCambiarNivelDirecto(comercio, 'premium')}
                            className="text-indigo-400 hover:text-indigo-300 font-semibold underline text-[11px] cursor-pointer"
                          >
                            Subir a Premium
                          </button>
                        </div>
                      )}

                      {/* Selector de Nivel Manual */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-zinc-500">Cambiar nivel:</span>
                        <select
                          value={nivelEfectivo}
                          onChange={(e) => handleCambiarNivelDirecto(comercio, e.target.value as NivelComercio)}
                          className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-semibold text-zinc-200 cursor-pointer focus:outline-none focus:border-indigo-500"
                        >
                          <option value="standar">Standar</option>
                          <option value="premium">Premium</option>
                          <option value="gold">Gold</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-zinc-500">
                        {comercio.productos?.length || 0} / {configNivel.limiteProductos} productos
                      </span>

                      <button
                        type="button"
                        onClick={() => handleEliminar(comercio.id, comercio.nombre)}
                        className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Eliminar comercio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: INFORMES & ANALÍTICAS DIARIAS */}
        {pestanaActiva === 'metricas' && (
          <div className="space-y-6">
            {/* Tarjetas KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Visitas al Portal
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white">{metricas.totalVisitas}</p>
                <span className="text-[11px] text-emerald-400 font-semibold">+{metricas.visitasHoy} hoy</span>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Nuevas Solicitudes
                </span>
                <p className="text-2xl sm:text-3xl font-black text-amber-400">{solicitudesPendientes.length}</p>
                <span className="text-[11px] text-zinc-400">pendientes de revisión</span>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Contactos a WhatsApp
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white">{metricas.totalWhatsapp}</p>
                <span className="text-[11px] text-emerald-400 font-semibold">+{metricas.whatsappHoy} hoy</span>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-indigo-400" />
                  Vistas de Catálogo
                </span>
                <p className="text-2xl sm:text-3xl font-black text-white">{metricas.totalAperturasCatalogo}</p>
                <span className="text-[11px] text-zinc-400">ofertas consultadas</span>
              </div>
            </div>

            {/* Generador de Informe Diario */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 to-zinc-900 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Informe Ejecutivo Diario para el Administrador
                </h3>
                <p className="text-xs text-zinc-300 max-w-xl mt-1 leading-relaxed">
                  Copia un reporte consolidado con las solicitudes del día, visitas vecinales, comercios abiertos y búsquedas destacadas para guardarlo o compartirlo.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopiarReporteDiario}
                className="py-2.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-indigo-950/60 cursor-pointer shrink-0"
              >
                {copiadoInforme ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiadoInforme ? '¡Informe Copiado al Portapapeles!' : 'Copiar Reporte Completo'}
              </button>
            </div>

            {/* Feed de Movimientos Recientes */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Movimientos en Tiempo Real de la Página
                </h3>

                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {metricas.eventosRecientes.map((ev) => (
                    <div
                      key={ev.id}
                      className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-white block">
                          {ev.tipo_evento === 'visita_portal' && '🌐 Vecino ingresó al portal'}
                          {ev.tipo_evento === 'clic_whatsapp' && `💬 Consulta por WhatsApp a "${ev.comercio_nombre || 'Comercio'}"`}
                          {ev.tipo_evento === 'clic_llamada' && `📞 Llamada telefónica a "${ev.comercio_nombre || 'Comercio'}"`}
                          {ev.tipo_evento === 'solicitud_comercio' && `⏳ Nueva solicitud: "${ev.comercio_nombre || 'Comercio'}"`}
                          {ev.tipo_evento === 'comercio_aprobado' && `✅ Local aprobado: "${ev.comercio_nombre || 'Comercio'}"`}
                          {ev.tipo_evento === 'busqueda_realizada' && `🔍 Búsqueda: "${ev.detalles?.query || ''}"`}
                          {ev.tipo_evento === 'apertura_catalogo' && `🛍️ Consulta catálogo de "${ev.comercio_nombre || 'Comercio'}"`}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          {new Date(ev.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Rubros y Términos más Buscados */}
              <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Search className="w-4 h-4 text-indigo-400" />
                  Rubros más Buscados por los Vecinos
                </h3>

                <div className="space-y-2">
                  {metricas.topRubrosBuscados.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-6 text-center">
                      Aún no hay búsquedas registradas hoy.
                    </p>
                  ) : (
                    metricas.topRubrosBuscados.map((item, idx) => (
                      <div
                        key={item.rubro}
                        className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-semibold text-zinc-200">
                          #{idx + 1} {item.rubro}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-[11px]">
                          {item.count} búsquedas
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 4: GESTIÓN DE CATEGORÍAS */}
        {pestanaActiva === 'categorias' && (
          <div className="space-y-6">
            {/* Formulario Agregar Categoría */}
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Crear Nueva Categoría Oficial
              </h3>

              <form onSubmit={handleCrearCategoria} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  required
                  value={nuevaCatNombre}
                  onChange={(e) => setNuevaCatNombre(e.target.value)}
                  placeholder="Ej. Cerrajería, Lavadero de Autos, Óptica..."
                  className="flex-1 px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Agregar Categoría
                </button>
              </form>

              {catMensaje && (
                <p
                  className={`text-xs ${
                    catMensaje.tipo === 'ok' ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {catMensaje.texto}
                </p>
              )}
            </div>

            {/* Listado de Categorías Oficiales */}
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                Categorías Disponibles en el Portal ({categorias.length})
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {categorias.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-semibold text-white truncate">{cat.nombre}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar categoría "${cat.nombre}"?`)) {
                          eliminarCategoria(cat.id);
                          setCategorias(getCategorias());
                        }
                      }}
                      className="text-zinc-500 hover:text-rose-400 p-1 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 5: EQUIPO Y ADMINISTRADORES NIVEL 2 */}
        {pestanaActiva === 'equipo' && esSuperAdmin && (
          <div className="space-y-6">
            {/* Formulario Agregar Admin Nivel 2 */}
            <div className="p-6 rounded-3xl bg-zinc-950 border border-cyan-500/30 space-y-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-cyan-400" />
                  Asignar Administrador de Nivel 2 (Moderador)
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Los administradores nivel 2 reciben acceso al panel para corroborar locales, verificar datos y aprobar comercios según los permisos asignados.
                </p>
              </div>

              <form onSubmit={handleCrearAdminNivel2} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={n2Email}
                      onChange={(e) => setN2Email(e.target.value)}
                      placeholder="moderador@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Nombre / Apodo *
                    </label>
                    <input
                      type="text"
                      required
                      value={n2Nombre}
                      onChange={(e) => setN2Nombre(e.target.value)}
                      placeholder="Ej. Carlos Moderador"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1">
                      Contraseña Asignada *
                    </label>
                    <input
                      type="password"
                      required
                      value={n2Pass}
                      onChange={(e) => setN2Pass(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>

                {/* Checkboxes de Permisos */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <span className="text-xs font-bold text-white block">Permisos Habilitados:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-zinc-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={n2PermisoCorroborar}
                        onChange={(e) => setN2PermisoCorroborar(e.target.checked)}
                        className="rounded accent-cyan-500"
                      />
                      <span>Corroborar datos de locales</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={n2PermisoAprobar}
                        onChange={(e) => setN2PermisoAprobar(e.target.checked)}
                        className="rounded accent-cyan-500"
                      />
                      <span>Aprobar / Rechazar comercios</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={n2PermisoCategorias}
                        onChange={(e) => setN2PermisoCategorias(e.target.checked)}
                        className="rounded accent-cyan-500"
                      />
                      <span>Asignar categorías a comercios</span>
                    </label>
                  </div>
                </div>

                {n2Mensaje && (
                  <p
                    className={`text-xs ${
                      n2Mensaje.tipo === 'ok' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {n2Mensaje.texto}
                  </p>
                )}

                <button
                  type="submit"
                  className="py-2.5 px-5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-cyan-950/60 cursor-pointer"
                >
                  Registrar Administrador Nivel 2
                </button>
              </form>
            </div>

            {/* Listado de Administradores Registrados */}
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                Administradores Actuales ({administradores.length})
              </h3>

              <div className="space-y-3">
                {administradores.map((admin) => (
                  <div
                    key={admin.id}
                    className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{admin.nombre}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            admin.rol === 'superadmin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {admin.rol === 'superadmin' ? 'SuperAdmin Principal' : 'Nivel 2'}
                        </span>
                      </div>
                      <p className="text-zinc-400 mt-0.5">{admin.email}</p>
                    </div>

                    {admin.rol !== 'superadmin' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            actualizarAdmin(admin.id, { activo: !admin.activo });
                            setAdministradores(getAdministradores());
                          }}
                          className={`py-1.5 px-3 rounded-xl font-medium ${
                            admin.activo
                              ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/60'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}
                        >
                          {admin.activo ? 'Activo' : 'Inactivo'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar administrador ${admin.email}?`)) {
                              eliminarAdmin(admin.id);
                              setAdministradores(getAdministradores());
                            }
                          }}
                          className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 6: MI PERFIL Y CONTRASEÑA */}
        {pestanaActiva === 'perfil' && esSuperAdmin && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  Perfil del Administrador Principal
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Aquí puedes cambiar el correo principal (actual: <strong>{adminActual.email}</strong>) y modificar la contraseña de acceso al panel.
                </p>
              </div>

              <form onSubmit={handleActualizarPerfil} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Correo del SuperAdmin *
                  </label>
                  <input
                    type="email"
                    required
                    value={perfilEmail}
                    onChange={(e) => setPerfilEmail(e.target.value)}
                    placeholder="maxi0802@gmail.com"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nombre o Firma *
                  </label>
                  <input
                    type="text"
                    required
                    value={perfilNombre}
                    onChange={(e) => setPerfilNombre(e.target.value)}
                    placeholder="Maxi"
                    className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-3 border-t border-zinc-800/80 space-y-3">
                  <span className="text-xs font-bold text-white block">
                    Modificar Contraseña de Acceso
                  </span>

                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">
                      Nueva Contraseña (dejar vacío si no deseas cambiarla)
                    </label>
                    <input
                      type="password"
                      value={perfilPassNuevo}
                      onChange={(e) => setPerfilPassNuevo(e.target.value)}
                      placeholder="Nueva contraseña segura"
                      className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {perfilPassNuevo && (
                    <div>
                      <label className="block text-xs text-zinc-400 mb-1">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        value={perfilPassConfirm}
                        onChange={(e) => setPerfilPassConfirm(e.target.value)}
                        placeholder="Repite la nueva contraseña"
                        className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {perfilMensaje && (
                  <p
                    className={`text-xs ${
                      perfilMensaje.tipo === 'ok' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {perfilMensaje.texto}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-indigo-950/60 cursor-pointer"
                >
                  Guardar Cambios de Perfil & Contraseña
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
