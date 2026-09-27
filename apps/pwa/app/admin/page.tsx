'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Comercio,
  Administrador,
  Categoria,
  PermisosAdmin,
  NivelComercio,
  NIVELES_CONFIG,
  ComprobanteTransferencia,
  DebateInconveniente,
  ModificacionComercio,
  EstadoDebate,
  UsuarioSistema,
  EstadoUsuario,
  RolUsuario,
} from '@/types/comercio';
import {
  getUsuariosSistema,
  cambiarEstadoUsuario,
  eliminarUsuarioDefinitivo,
} from '@/lib/usuarios';
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
  getComprobantesTransferencia,
  aprobarComprobanteTransferencia,
  rechazarComprobanteTransferencia,
  getDebates,
  actualizarEstadoDebate,
  getSolicitudesModificacion,
  aprobarSolicitudModificacion,
  rechazarSolicitudModificacion,
  calcularSiguienteDiaHabil6AM,
  reactivarComercioInactivo,
  confirmarBajaDefinitivaComercio,
  levantarCuarentenaAdmin,
  isSupabaseConfigured,
} from '@/lib/supabase';
import ContadorMembresia from '@/components/ContadorMembresia';
import { useUser } from '@/context/user-context';
import {
  getAdminActual,
  autenticarAdmin,
  cerrarSesionAdmin,
  actualizarPerfilSuperAdmin,
  crearAdminNivel2,
  getAdministradores,
  eliminarAdmin,
  actualizarAdmin,
  obtenerAdminPorEmail,
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
  Upload,
  DollarSign,
  Eye,
  X,
  MessageSquare,
  ZoomIn,
  ChevronRight,
  UserX,
  Ban,
} from 'lucide-react';

export default function AdminPage() {
  // Estado de Autenticación
  const [adminActual, setAdminActual] = useState<Administrador | null>(null);
  const [emailInput, setEmailInput] = useState('maxi0802@gmail.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Pestaña Activa
  const [pestanaActiva, setPestanaActiva] = useState<
    | 'pendientes'
    | 'activos'
    | 'inactivos'
    | 'transferencias'
    | 'modificaciones'
    | 'debates'
    | 'metricas'
    | 'categorias'
    | 'equipo'
    | 'perfil'
    | 'usuarios'
  >('pendientes');

  // Estados de Gestión de Usuarios Registrados
  const [usuariosSistema, setUsuariosSistema] = useState<UsuarioSistema[]>([]);
  const [busquedaUsuarios, setBusquedaUsuarios] = useState('');
  const [filtroEstadoUsuario, setFiltroEstadoUsuario] = useState<'todos' | 'activo' | 'bloqueado' | 'baja'>('todos');
  const [filtroRolUsuario, setFiltroRolUsuario] = useState<'todos' | 'usuario' | 'comerciante' | 'admin_nivel2' | 'superadmin'>('todos');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<UsuarioSistema | null>(null);
  const [tipoModalUsuario, setTipoModalUsuario] = useState<'bloquear' | 'baja' | 'eliminar' | null>(null);
  const [motivoAccionUsuario, setMotivoAccionUsuario] = useState('');
  const [procesandoUsuario, setProcesandoUsuario] = useState(false);
  const [mensajeUsuarioExito, setMensajeUsuarioExito] = useState<string | null>(null);

  // Datos
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [administradores, setAdministradores] = useState<Administrador[]>([]);
  const [metricas, setMetricas] = useState(getMetricasResumen());

  // Estados de Comprobantes de Transferencias
  const [comprobantes, setComprobantes] = useState<ComprobanteTransferencia[]>([]);
  const [filtroEstadoComp, setFiltroEstadoComp] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('todos');
  const [acreditandoCompId, setAcreditandoCompId] = useState<string | null>(null);
  const [imagenModalUrl, setImagenModalUrl] = useState<string | null>(null);
  const [motivoRechazoComp, setMotivoRechazoComp] = useState<{ [id: string]: string }>({});
  const [mostrarRechazoCompId, setMostrarRechazoCompId] = useState<string | null>(null);

  // Estados de Solicitudes de Modificación de Comercios
  const [solicitudesMod, setSolicitudesMod] = useState<ModificacionComercio[]>([]);
  const [procesandoModId, setProcesandoModId] = useState<string | null>(null);
  const [motivoRechazoMod, setMotivoRechazoMod] = useState<{ [id: string]: string }>({});
  const [mostrarRechazoModId, setMostrarRechazoModId] = useState<string | null>(null);

  // Estados de Debates e Inconvenientes de Clientes
  const [debates, setDebates] = useState<DebateInconveniente[]>([]);
  const [filtroEstadoDebate, setFiltroEstadoDebate] = useState<'todos' | 'abierto' | 'en_revision' | 'resuelto'>('todos');
  const [notaAdminDebate, setNotaAdminDebate] = useState<{ [id: string]: string }>({});
  const [procesandoDebateId, setProcesandoDebateId] = useState<string | null>(null);

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

  const { usuario, estaAutenticado, esAdmin, abrirModalAuth } = useUser();

  // Cargar sesión inicial
  useEffect(() => {
    // 1. Si el usuario ya está autenticado en la PWA y es administrador, autenticarlo inmediatamente
    if (usuario?.email) {
      const admin = obtenerAdminPorEmail(usuario.email);
      if (admin) {
        setAdminActual(admin);
        setPerfilEmail(admin.email);
        setPerfilNombre(admin.nombre);
        return;
      }
    }

    // 2. Si no, verificar sesión previa en sessionStorage
    const sesion = getAdminActual();
    if (sesion) {
      setAdminActual(sesion);
      setPerfilEmail(sesion.email);
      setPerfilNombre(sesion.nombre);
    }
  }, [usuario]);

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

    const comps = await getComprobantesTransferencia();
    setComprobantes(comps);

    const mods = await getSolicitudesModificacion();
    setSolicitudesMod(mods);

    const debs = await getDebates();
    setDebates(debs);

    const usrs = await getUsuariosSistema();
    setUsuariosSistema(usrs);

    setCargando(false);
  };

  // Filtrado y Acciones de Usuarios Registrados
  const usuariosFiltrados = useMemo(() => {
    return usuariosSistema.filter((u) => {
      if (busquedaUsuarios) {
        const query = busquedaUsuarios.toLowerCase();
        const coincideNombre = u.nombre.toLowerCase().includes(query);
        const coincideEmail = u.email.toLowerCase().includes(query);
        const coincideComercio = u.comercio_nombre?.toLowerCase().includes(query);
        if (!coincideNombre && !coincideEmail && !coincideComercio) return false;
      }
      if (filtroEstadoUsuario !== 'todos' && u.estado !== filtroEstadoUsuario) {
        return false;
      }
      if (filtroRolUsuario !== 'todos' && u.rol !== filtroRolUsuario) {
        return false;
      }
      return true;
    });
  }, [usuariosSistema, busquedaUsuarios, filtroEstadoUsuario, filtroRolUsuario]);

  const handleEjecutarAccionUsuario = async () => {
    if (!usuarioSeleccionado || !tipoModalUsuario) return;
    setProcesandoUsuario(true);
    setMensajeUsuarioExito(null);

    if (tipoModalUsuario === 'bloquear') {
      const res = await cambiarEstadoUsuario(
        usuarioSeleccionado.id,
        'bloqueado',
        motivoAccionUsuario.trim() || 'Bloqueado por el Administrador'
      );
      if (res.exito) {
        setMensajeUsuarioExito(`Usuario ${usuarioSeleccionado.nombre} ha sido bloqueado exitosamente.`);
        setUsuariosSistema(await getUsuariosSistema());
      } else {
        alert(res.error || 'Error al bloquear usuario');
      }
    } else if (tipoModalUsuario === 'baja') {
      const res = await cambiarEstadoUsuario(
        usuarioSeleccionado.id,
        'baja',
        motivoAccionUsuario.trim() || 'Baja administrativa'
      );
      if (res.exito) {
        setMensajeUsuarioExito(`Usuario ${usuarioSeleccionado.nombre} fue dado de baja.`);
        setUsuariosSistema(await getUsuariosSistema());
      } else {
        alert(res.error || 'Error al dar de baja al usuario');
      }
    } else if (tipoModalUsuario === 'eliminar') {
      const res = await eliminarUsuarioDefinitivo(usuarioSeleccionado.id);
      if (res.exito) {
        setMensajeUsuarioExito(
          `Usuario ${usuarioSeleccionado.nombre} ha sido eliminado definitivamente. Ahora puede volver a registrarse desde cero.`
        );
        setUsuariosSistema(await getUsuariosSistema());
      } else {
        alert(res.error || 'Error al eliminar usuario');
      }
    }

    setProcesandoUsuario(false);
    setTipoModalUsuario(null);
    setUsuarioSeleccionado(null);
    setMotivoAccionUsuario('');
  };

  const handleReactivarUsuario = async (u: UsuarioSistema) => {
    if (confirm(`¿Deseas reactivar al usuario ${u.nombre} (${u.email})? Volverá a tener acceso normal a la red.`)) {
      const res = await cambiarEstadoUsuario(u.id, 'activo');
      if (res.exito) {
        setUsuariosSistema(await getUsuariosSistema());
        setMensajeUsuarioExito(`Usuario ${u.nombre} reactivado correctamente.`);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const res = await autenticarAdmin(emailInput, passwordInput);
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

  // Filtrado de Comercios y Solicitudes
  const solicitudesPendientes = useMemo(() => {
    return comercios.filter((c) => c.estado_aprobacion === 'pendiente');
  }, [comercios]);

  const comprobantesPendientes = useMemo(() => {
    return comprobantes.filter((c) => c.estado === 'pendiente');
  }, [comprobantes]);

  const solicitudesModPendientes = useMemo(() => {
    return solicitudesMod.filter((s) => s.estado === 'pendiente');
  }, [solicitudesMod]);

  const debatesAbiertos = useMemo(() => {
    return debates.filter((d) => d.estado !== 'resuelto');
  }, [debates]);

  const ticketsInactividad = useMemo(() => {
    const ahora = Date.now();
    return comercios.filter((c) => {
      if (c.ticket_baja_definitiva || c.oculto_por_inactividad) return true;
      if (c.en_vacaciones && c.vacaciones_desde) {
        const msVac = ahora - new Date(c.vacaciones_desde).getTime();
        const dias = Math.floor(msVac / (1000 * 60 * 60 * 24));
        return dias > 60;
      }
      return false;
    });
  }, [comercios]);

  const comprobantesFiltrados = useMemo(() => {
    if (filtroEstadoComp === 'todos') return comprobantes;
    return comprobantes.filter((c) => c.estado === filtroEstadoComp);
  }, [comprobantes, filtroEstadoComp]);

  const debatesFiltrados = useMemo(() => {
    if (filtroEstadoDebate === 'todos') return debates;
    return debates.filter((d) => d.estado === filtroEstadoDebate);
  }, [debates, filtroEstadoDebate]);

  // Handler: Acreditar +1 Mes Extra al comercio
  const handleAcreditarMesExtra = async (comp: ComprobanteTransferencia) => {
    setAcreditandoCompId(comp.id);
    const res = await aprobarComprobanteTransferencia(comp.id, adminActual?.nombre || 'SuperAdmin');
    setAcreditandoCompId(null);

    if (res.success) {
      registrarEvento('comprobante_aprobado', comp.comercio_id, comp.comercio_nombre, {
        categoria: comp.categoria_solicitada,
        nuevaFechaVencimiento: res.nuevaFechaVencimiento,
      });
      alert(`¡+1 Mes Extra Acreditado con Éxito para "${comp.comercio_nombre}" en categoría ${comp.categoria_solicitada.toUpperCase()}!\n\nVigencia extendida hasta: ${res.nuevaFechaVencimiento ? new Date(res.nuevaFechaVencimiento).toLocaleDateString('es-AR') : '30 días'}.\nEl mes extra comienza a correr al finalizar el período actual para no perder nunca la categoría.`);
      recargarDatos();
    } else {
      alert(`Error al acreditar mes extra: ${res.error}`);
    }
  };

  // Handler: Rechazar Comprobante de Transferencia
  const handleRechazarComprobante = async (comp: ComprobanteTransferencia) => {
    const motivo = motivoRechazoComp[comp.id]?.trim() || prompt('Indica el motivo de rechazo del comprobante:', 'Comprobante no acreditado en cuenta bancaria');
    if (!motivo) return;

    const res = await rechazarComprobanteTransferencia(comp.id, motivo, adminActual?.nombre || 'SuperAdmin');
    if (res.success) {
      registrarEvento('comprobante_rechazado', comp.comercio_id, comp.comercio_nombre, { motivo });
      setMostrarRechazoCompId(null);
      recargarDatos();
    }
  };

  // Handler: Aprobar Modificaciones de Comercio
  const handleAprobarModificacion = async (sol: ModificacionComercio) => {
    setProcesandoModId(sol.id);
    const res = await aprobarSolicitudModificacion(sol.id, adminActual?.nombre || 'SuperAdmin');
    setProcesandoModId(null);

    if (res.success) {
      registrarEvento('modificacion_comercio_aprobada', sol.comercio_id, sol.comercio_nombre);
      alert(`¡Modificaciones aprobadas y aplicadas a "${sol.comercio_nombre}"!`);
      recargarDatos();
    } else {
      alert(`Error al aprobar modificaciones: ${res.error}`);
    }
  };

  // Handler: Rechazar Modificaciones de Comercio
  const handleRechazarModificacion = async (sol: ModificacionComercio) => {
    const motivo = motivoRechazoMod[sol.id]?.trim() || prompt('Indica el motivo de rechazo de las modificaciones:', 'Información no homologada o inconsistente');
    if (!motivo) return;

    const res = await rechazarSolicitudModificacion(sol.id, motivo, adminActual?.nombre || 'SuperAdmin');
    if (res.success) {
      setMostrarRechazoModId(null);
      recargarDatos();
    }
  };

  // Handler: Actualizar Estado de Debate
  const handleActualizarEstadoDebate = async (debateId: string, nuevoEstado: EstadoDebate) => {
    setProcesandoDebateId(debateId);
    const nota = notaAdminDebate[debateId]?.trim();
    const res = await actualizarEstadoDebate(debateId, nuevoEstado, nota);
    setProcesandoDebateId(null);

    if (res.success) {
      registrarEvento('debate_resuelto', '', '', { debateId, nuevoEstado });
      recargarDatos();
    }
  };

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
    const reaperturaProg = calcularSiguienteDiaHabil6AM();
    const reaperturaFormato = reaperturaProg.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });

    const motivo = prompt(
      `Motivo de cierre por emergencia para "${comercio.nombre}":\n\n(El sistema lo reabrirá automáticamente el próximo día hábil: ${reaperturaFormato})`,
      comercio.motivo_cierre_momentaneo || 'Corte de luz / Mantenimiento imprevisto'
    );
    if (motivo === null) return;
    const res = await toggleCerradoMomentaneo(comercio.id, true, motivo, reaperturaProg.toISOString());
    if (res.success) {
      registrarEvento('visita_comercio', comercio.id, comercio.nombre, {
        accion: 'cerrado_momentaneo',
        motivo,
        reapertura_programada: reaperturaProg.toISOString(),
      });
      setComercios((prev) =>
        prev.map((c) =>
          c.id === comercio.id
            ? {
                ...c,
                cerrado_momentaneo: true,
                motivo_cierre_momentaneo: motivo,
                fecha_cierre_emergencia: new Date().toISOString(),
                reapertura_emergencia_programada: reaperturaProg.toISOString(),
                esta_abierto: false,
              }
            : c
        )
      );
    }
  };

  const handleCargarVacaciones = async (comercio: Comercio) => {
    const hoy = new Date().toISOString().split('T')[0];
    const desde = prompt('Fecha de inicio de vacaciones (AAAA-MM-DD):', comercio.vacaciones_desde || hoy);
    if (!desde) return;
    const hasta = prompt(
      'Fecha obligatoria de Retorno (AAAA-MM-DD):\nEl comercio volverá a visibilizarse automáticamente llegada esta fecha.',
      comercio.vacaciones_hasta || ''
    );
    if (!hasta) {
      alert('La fecha de Retorno es obligatoria para programar el periodo de vacaciones.');
      return;
    }

    const msDiff = new Date(hasta).getTime() - new Date(desde).getTime();
    const dias = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    if (dias > 60) {
      const continua = confirm(
        `Atención: Has indicado un receso de ${dias} días (superior al límite de 60 días).\n` +
        `Los comercios con más de 60 días continuos en vacaciones se ocultan automáticamente del mapa y generan un ticket de revisión de baja definitiva.\n\n` +
        `¿Deseas continuar?`
      );
      if (!continua) return;
    }

    const mensaje = prompt('Mensaje para los clientes:', comercio.mensaje_vacaciones || 'Cerrado por descanso anual. ¡Nos vemos pronto!');

    const res = await configurarVacaciones(comercio.id, true, desde, hasta, mensaje || undefined);
    if (res.success) {
      registrarEvento('visita_comercio', comercio.id, comercio.nombre, {
        accion: 'cargar_vacaciones',
        desde,
        hasta,
      });
      const supera60 = dias > 60;
      setComercios((prev) =>
        prev.map((c) =>
          c.id === comercio.id
            ? {
                ...c,
                en_vacaciones: true,
                vacaciones_desde: desde,
                vacaciones_hasta: hasta,
                mensaje_vacaciones: mensaje || undefined,
                esta_abierto: false,
                oculto_por_inactividad: supera60 ? true : c.oculto_por_inactividad,
                ticket_baja_definitiva: supera60 ? true : c.ticket_baja_definitiva,
                fecha_ticket_baja: supera60 ? new Date().toISOString() : c.fecha_ticket_baja,
                motivo_ticket_baja: supera60 ? `Vacaciones programadas mayores a 60 días (${dias} días)` : c.motivo_ticket_baja,
              }
            : c
        )
      );
    }
  };

  const handleReactivarComercioInactivo = async (comercio: Comercio) => {
    if (confirm(`¿Reactivar el comercio "${comercio.nombre}" y volver a mostrarlo en el mapa público? Se removerá el ticket de baja y la marca de inactividad prolongada.`)) {
      const res = await reactivarComercioInactivo(comercio.id);
      if (res.success) {
        registrarEvento('visita_comercio', comercio.id, comercio.nombre, {
          accion: 'reactivar_inactivo',
        });
        setComercios((prev) =>
          prev.map((c) =>
            c.id === comercio.id
              ? {
                  ...c,
                  oculto_por_inactividad: false,
                  ticket_baja_definitiva: false,
                  en_vacaciones: false,
                  vacaciones_desde: undefined,
                  vacaciones_hasta: undefined,
                  cerrado_momentaneo: false,
                  motivo_cierre_momentaneo: undefined,
                  esta_abierto: true,
                }
              : c
          )
        );
      }
    }
  };

  const handleConfirmarBajaDefinitiva = async (comercio: Comercio) => {
    const motivo = prompt(
      `Motivo de baja definitiva para "${comercio.nombre}":`,
      'Inactividad prolongada mayor a 60 días sin reapertura ni contacto del titular'
    );
    if (!motivo) return;

    if (confirm(`¿Estás SEGURO de confirmar la baja definitiva de "${comercio.nombre}"? El local pasará a estado rechazado/inactivo permanentemente.`)) {
      const res = await confirmarBajaDefinitivaComercio(comercio.id, motivo);
      if (res.success) {
        registrarEvento('comercio_rechazado', comercio.id, comercio.nombre, {
          motivo,
          tipo: 'baja_definitiva_inactividad',
        });
        setComercios((prev) =>
          prev.map((c) =>
            c.id === comercio.id
              ? {
                  ...c,
                  estado_aprobacion: 'rechazado',
                  motivo_rechazo: motivo,
                  oculto_por_inactividad: true,
                  ticket_baja_definitiva: false,
                }
              : c
          )
        );
      }
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
  const handleActualizarPerfil = async (e: React.FormEvent) => {
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

    const res = await actualizarPerfilSuperAdmin(
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
  const handleCrearAdminNivel2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setN2Mensaje(null);

    const permisos: PermisosAdmin = {
      corroborar_locales: n2PermisoCorroborar,
      aprobar_rechazar: n2PermisoAprobar,
      asignar_categorias: n2PermisoCategorias,
    };

    const res = await crearAdminNivel2({
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

  // Si hay un usuario logueado en la PWA que NO es administrador, denegar acceso cortésmente
  if (usuario && !esAdmin && !adminActual) {
    return (
      <main className="min-h-screen bg-black text-zinc-100 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 shadow-2xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-950/60">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Acceso Restringido</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Tu cuenta activa (<span className="text-cyan-300 font-mono">{usuario.email}</span>) no tiene permisos de administrador.
            </p>
          </div>
          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-zinc-400 text-left space-y-1">
            <p className="font-semibold text-zinc-300">¿Eres el administrador?</p>
            <p className="text-[11px]">
              Cierra sesión e ingresa con tu cuenta autorizada (ej. <strong>maxi0802@gmail.com</strong>).
            </p>
          </div>
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => abrirModalAuth('login')}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl transition-all shadow-md cursor-pointer"
            >
              Cambiar de Cuenta / Iniciar Sesión
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-1.5 py-2 px-4 text-xs text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver al Mapa del Barrio
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
            {/* Monitor de Estado de Supabase para el Administrador */}
            {isSupabaseConfigured ? (
              <div
                title="Conexión en la nube con Supabase activa y sincronizada en tiempo real"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-xs font-semibold shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Supabase Conectado</span>
              </div>
            ) : (
              <div
                title="Operando en modo Local Storage / Demostración. Vincula tus credenciales en .env.local para activar Supabase."
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/70 text-amber-300 text-xs font-semibold"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Local</span>
              </div>
            )}

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
            onClick={() => setPestanaActiva('transferencias')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'transferencias'
                ? 'border-emerald-500 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Transferencias & Membresías
            {comprobantesPendientes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-black animate-pulse">
                {comprobantesPendientes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('modificaciones')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'modificaciones'
                ? 'border-violet-500 text-violet-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileText className="w-4 h-4 text-violet-400" />
            Modificaciones
            {solicitudesModPendientes.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-violet-500 text-white animate-pulse">
                {solicitudesModPendientes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('debates')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'debates'
                ? 'border-amber-500 text-amber-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Debates & Reclamos
            {debatesAbiertos.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-black animate-pulse">
                {debatesAbiertos.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('inactivos')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'inactivos'
                ? 'border-rose-500 text-rose-300'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <AlertCircle className="w-4 h-4 text-rose-400" />
            Tickets Inactividad (&gt;60d)
            {ticketsInactividad.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                {ticketsInactividad.length}
              </span>
            )}
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

          <button
            type="button"
            onClick={() => setPestanaActiva('usuarios')}
            className={`py-3 px-3.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              pestanaActiva === 'usuarios'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            Usuarios Registrados ({usuariosSistema.length})
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

                      {/* Alerta de Cierre Momentáneo / Emergencia */}
                      {comercio.cerrado_momentaneo && (
                        <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold block text-[11px]">Cerrado por Emergencia</span>
                            <p className="text-[10px] text-amber-300/90 leading-tight">
                              {comercio.motivo_cierre_momentaneo || 'Inconveniente operativo temporal'}
                            </p>
                            {comercio.reapertura_emergencia_programada && (
                              <p className="text-[9px] text-amber-400 font-mono mt-1 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-400" />
                                Caduca auto: {new Date(comercio.reapertura_emergencia_programada).toLocaleDateString('es-AR', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
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
                            {comercio.vacaciones_hasta && (
                              <p className="text-[9px] text-sky-400 font-medium mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-sky-400" />
                                Retorno: {comercio.vacaciones_hasta} (reapertura auto)
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Alerta de Cuarentena Preventiva por 3 Strikes */}
                      {comercio.en_cuarentena && (
                        <div className="p-3 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs flex items-start gap-2 shadow-lg shadow-rose-950/40">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-1 w-full">
                            <span className="font-extrabold block text-xs text-white flex items-center justify-between">
                              <span>🚨 En Cuarentena Preventiva ({comercio.strikes_reportes || 3} strikes)</span>
                              <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full">
                                Oculto en PWA
                              </span>
                            </span>
                            <p className="text-[10px] text-rose-300 leading-tight">
                              {comercio.motivo_cuarentena || 'Acumuló 3 reportes ciudadanos en menos de 15 días.'}
                            </p>
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm(`¿Levantar la cuarentena preventiva de "${comercio.nombre}" y restaurar su visibilidad pública en el mapa?`)) {
                                  await levantarCuarentenaAdmin(comercio.id);
                                  setComercios((prev) =>
                                    prev.map((c) =>
                                      c.id === comercio.id
                                        ? { ...c, en_cuarentena: false, motivo_cuarentena: undefined, fecha_cuarentena: undefined, strikes_reportes: 0, esta_abierto: true }
                                        : c
                                    )
                                  );
                                }
                              }}
                              className="mt-1.5 w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Liberar Cuarentena Ahora</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Alerta de Inactividad >60d */}
                      {comercio.oculto_por_inactividad && (
                        <div className="p-2.5 rounded-xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          <div className="space-y-0.5">
                            <span className="font-bold block text-[11px]">Oculto por Inactividad (&gt;60 días)</span>
                            <p className="text-[10px] text-rose-300/90 leading-tight">
                              {comercio.motivo_ticket_baja || 'Superó el plazo máximo de 60 días en vacaciones.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Botón especial: Volver a cumplir horarios normales */}
                      {(comercio.cerrado_momentaneo || comercio.en_vacaciones || comercio.oculto_por_inactividad) && (
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
                            title="Cierre por emergencia (caduca automáticamente a las 6 AM del próximo día hábil)"
                          >
                            <AlertCircle className="w-3 h-3" />
                            Cerrar Emergencia (6 AM)
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

        {/* PESTAÑA: TRANSFERENCIAS & MEMBRESÍAS */}
        {pestanaActiva === 'transferencias' && (
          <div className="space-y-6">
            {/* Cabecera y Explicación */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-950/40 via-zinc-950 to-zinc-900 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold text-white">Comprobantes de Transferencias Bancarias</h2>
                </div>
                <p className="text-xs text-zinc-300 max-w-2xl mt-1 leading-relaxed">
                  Los comercios que abonan su suscripción Premium o Gold envían sus comprobantes aquí. Al hacer clic en <strong>&ldquo;Acreditar +1 Mes Extra&rdquo;</strong>, la vigencia se extiende automáticamente por 30 días. Si la membresía aún está activa, el mes extra se encadena al finalizar el período actual para que nunca pierda su categoría.
                </p>
              </div>

              {/* Filtros de Comprobantes */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl shrink-0">
                {(['todos', 'pendiente', 'aprobado', 'rechazado'] as const).map((filtro) => (
                  <button
                    key={filtro}
                    type="button"
                    onClick={() => setFiltroEstadoComp(filtro)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      filtroEstadoComp === filtro
                        ? 'bg-emerald-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {filtro}
                    {filtro === 'pendiente' && comprobantesPendientes.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-black text-amber-400 font-black">
                        {comprobantesPendientes.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de Comprobantes */}
            {comprobantesFiltrados.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-zinc-950 border border-zinc-900 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">No hay comprobantes en esta vista</p>
                <p className="text-xs text-zinc-500">
                  {filtroEstadoComp === 'pendiente'
                    ? 'No hay comprobantes de pago pendientes de revisión.'
                    : 'No se encontraron registros de transferencias con el filtro seleccionado.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {comprobantesFiltrados.map((comp) => {
                  const esPendiente = comp.estado === 'pendiente';
                  const esAprobado = comp.estado === 'aprobado';
                  const esRechazado = comp.estado === 'rechazado';
                  const comercioRel = comercios.find((c) => c.id === comp.comercio_id);

                  return (
                    <div
                      key={comp.id}
                      className={`p-5 rounded-3xl border transition-all ${
                        esPendiente
                          ? 'bg-zinc-950 border-amber-500/40 shadow-lg shadow-amber-950/20'
                          : esAprobado
                          ? 'bg-zinc-950/80 border-emerald-500/30'
                          : 'bg-zinc-950/60 border-zinc-800'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{comp.comercio_nombre}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                comp.categoria_solicitada === 'gold'
                                  ? 'bg-amber-400 text-black'
                                  : comp.categoria_solicitada === 'premium'
                                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white'
                                  : 'bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              ★ {comp.categoria_solicitada}
                            </span>
                          </div>
                          <span className="text-[11px] text-zinc-500">
                            ID Comercio: {comp.comercio_id.slice(0, 8)}... • {new Date(comp.fecha_envio || comp.fecha_creacion || Date.now()).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} hs
                          </span>
                        </div>

                        {/* Estado */}
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                            esPendiente
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                              : esAprobado
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {esPendiente && '⏳ Pendiente'}
                          {esAprobado && '✅ Aprobado (+1 Mes)'}
                          {esRechazado && '❌ Rechazado'}
                        </span>
                      </div>

                      {/* Detalles Financieros y Comprobante */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 text-xs mb-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-zinc-400">
                            <span>Monto abonado:</span>
                            <span className="font-black text-emerald-400 text-sm">
                              ${comp.monto ? comp.monto.toLocaleString('es-AR') : '0'} ARS
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-400">
                            <span>N° Operación:</span>
                            <span className="font-mono text-zinc-200">{comp.numero_operacion || 'No especificado'}</span>
                          </div>
                          <div className="flex items-center justify-between text-zinc-400">
                            <span>Banco / Billetera:</span>
                            <span className="text-zinc-200">{comp.banco_origen || 'Transferencia'}</span>
                          </div>
                          {comp.meses_acreditados && (
                            <div className="flex items-center justify-between text-zinc-400">
                              <span>Período abonado:</span>
                              <span className="text-indigo-300 font-semibold">{comp.meses_acreditados} mes (30 días)</span>
                            </div>
                          )}
                        </div>

                        {/* Preview del Archivo / Imagen */}
                        <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-black/40 border border-zinc-800/80 text-center">
                          {comp.comprobante_url ? (
                            <div className="relative group cursor-pointer w-full flex flex-col items-center">
                              {comp.comprobante_url.startsWith('data:image') || comp.comprobante_url.startsWith('http') ? (
                                <div
                                  onClick={() => setImagenModalUrl(comp.comprobante_url)}
                                  className="relative w-full h-24 rounded-lg overflow-hidden border border-zinc-700/60 bg-zinc-900 group-hover:border-cyan-400 transition-all"
                                >
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={comp.comprobante_url}
                                    alt="Comprobante de pago"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                                    <ZoomIn className="w-4 h-4" />
                                    Ver comprobante
                                  </div>
                                </div>
                              ) : (
                                <a
                                  href={comp.comprobante_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline"
                                >
                                  <FileText className="w-4 h-4" />
                                  Abrir comprobante adjunto
                                </a>
                              )}
                              <span className="text-[10px] text-zinc-500 mt-1">Haz clic para ampliar comprobante</span>
                            </div>
                          ) : (
                            <div className="text-zinc-600 text-[11px] flex flex-col items-center gap-1">
                              <FileText className="w-5 h-5 text-zinc-600" />
                              Sin archivo adjunto
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Nota del Comercio */}
                      {comp.notas && (
                        <p className="text-xs text-zinc-400 italic bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800/40 mb-3">
                          &ldquo;{comp.notas}&rdquo;
                        </p>
                      )}

                      {/* Contador de tiempo actual del comercio */}
                      {comercioRel && (
                        <div className="p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/40 flex items-center justify-between gap-2 mb-3">
                          <div className="text-[11px] text-zinc-400">
                            Estado actual: <strong className="text-white uppercase">{comercioRel.nivel || 'standar'}</strong>
                          </div>
                          {comercioRel.fecha_vencimiento_nivel ? (
                            <ContadorMembresia
                              fechaVencimiento={comercioRel.fecha_vencimiento_nivel}
                              nivel={comercioRel.nivel || 'standar'}
                              formato="badge"
                            />
                          ) : (
                            <span className="text-[10px] text-zinc-500">Sin vencimiento</span>
                          )}
                        </div>
                      )}

                      {/* Metadatos de aprobación / rechazo */}
                      {esAprobado && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300 flex items-center justify-between">
                          <span>Aprobado por: <strong>{comp.revisado_por || 'Admin'}</strong></span>
                          <span>{comp.fecha_revision ? new Date(comp.fecha_revision).toLocaleDateString('es-AR') : ''}</span>
                        </div>
                      )}

                      {esRechazado && (
                        <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-xs text-rose-300">
                          <p><strong>Motivo de rechazo:</strong> {comp.motivo_rechazo || 'No especificado'}</p>
                          <span className="text-[10px] text-rose-400/80">Revisado por {comp.revisado_por || 'Admin'}</span>
                        </div>
                      )}

                      {/* Formulario de Rechazo desplegable */}
                      {mostrarRechazoCompId === comp.id && (
                        <div className="mt-3 p-3 rounded-2xl bg-rose-950/20 border border-rose-800/50 space-y-2">
                          <label className="block text-[11px] font-bold text-rose-300">Motivo del Rechazo:</label>
                          <input
                            type="text"
                            value={motivoRechazoComp[comp.id] || ''}
                            onChange={(e) =>
                              setMotivoRechazoComp((prev) => ({ ...prev, [comp.id]: e.target.value }))
                            }
                            placeholder="Ej: El importe no se acreditó en la cuenta bancaria"
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setMostrarRechazoCompId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRechazarComprobante(comp)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                            >
                              Confirmar Rechazo
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Botones de Acción */}
                      {esPendiente && mostrarRechazoCompId !== comp.id && (
                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                          <button
                            type="button"
                            disabled={acreditandoCompId === comp.id}
                            onClick={() => handleAcreditarMesExtra(comp)}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-black font-extrabold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer disabled:opacity-50"
                          >
                            <Sparkles className="w-4 h-4" />
                            {acreditandoCompId === comp.id ? 'Acreditando...' : 'Acreditar +1 Mes Extra'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setMostrarRechazoCompId(comp.id)}
                            className="py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-800/60 text-zinc-400 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}

                      {/* Cambio rápido de categoría manual por el admin */}
                      <div className="mt-3 pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
                        <span>Cambiar categoría manualmente:</span>
                        <div className="flex items-center gap-1">
                          {(['standar', 'premium', 'gold'] as const).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={async () => {
                                if (confirm(`¿Cambiar categoría de "${comp.comercio_nombre}" a ${cat.toUpperCase()} con 30 días de vigencia?`)) {
                                  await cambiarNivelComercio(comp.comercio_id, cat, 30);
                                  recargarDatos();
                                }
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all ${
                                comercioRel?.nivel === cat
                                  ? 'bg-white text-black'
                                  : 'bg-zinc-900 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: MODIFICACIONES DE COMERCIOS */}
        {pestanaActiva === 'modificaciones' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/40 via-zinc-950 to-zinc-900 border border-violet-500/30">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" />
                <h2 className="text-base font-bold text-white">Solicitudes de Modificación de Comercios</h2>
              </div>
              <p className="text-xs text-zinc-300 max-w-2xl mt-1 leading-relaxed">
                Los comercios cargan o modifican información desde su panel (teléfonos, horarios, descripción, redes, fotos). Todas las solicitudes requieren tu validación antes de impactar en la aplicación pública.
              </p>
            </div>

            {solicitudesMod.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-zinc-950 border border-zinc-900 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-violet-500/40 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">No hay solicitudes de modificación</p>
                <p className="text-xs text-zinc-500">
                  Cuando un comercio edite sus opciones o datos desde &ldquo;Mi Comercio&rdquo;, aparecerá aquí para tu aprobación.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {solicitudesMod.map((sol) => {
                  const esPendiente = sol.estado === 'pendiente';
                  const esAprobada = sol.estado === 'aprobado';
                  const esRechazada = sol.estado === 'rechazado';
                  const cambios = sol.cambios || sol.cambios_propuestos || {};
                  const comercioActual = comercios.find((c) => c.id === sol.comercio_id);

                  return (
                    <div
                      key={sol.id}
                      className={`p-6 rounded-3xl border transition-all ${
                        esPendiente
                          ? 'bg-zinc-950 border-violet-500/40 shadow-xl shadow-violet-950/20'
                          : esAprobada
                          ? 'bg-zinc-950/80 border-emerald-500/30'
                          : 'bg-zinc-950/60 border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base">{sol.comercio_nombre}</h3>
                            <span className="text-xs text-zinc-400">({sol.usuario_email || 'Comercio'})</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            Solicitado el {new Date(sol.fecha_solicitud).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} hs
                          </p>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            esPendiente
                              ? 'bg-violet-500/10 text-violet-300 border-violet-500/30 animate-pulse'
                              : esAprobada
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}
                        >
                          {esPendiente && '⏳ Pendiente de Aprobación'}
                          {esAprobada && '✅ Modificaciones Aprobadas'}
                          {esRechazada && '❌ Rechazado'}
                        </span>
                      </div>

                      {/* Comparativa de Cambios Propuestos */}
                      <div className="mb-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 overflow-hidden">
                        <div className="px-4 py-2.5 bg-zinc-900 border-b border-zinc-800 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Comparativa de Cambios Propuestos
                        </div>
                        <div className="p-4 space-y-3 text-xs">
                          {Object.entries(cambios).map(([clave, valorNuevo]) => {
                            if (valorNuevo === undefined || valorNuevo === null) return null;
                            const valorActual = comercioActual ? (comercioActual as unknown as Record<string, unknown>)[clave] : undefined;

                            return (
                              <div
                                key={clave}
                                className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/60 grid grid-cols-1 md:grid-cols-3 gap-2"
                              >
                                <span className="font-semibold text-zinc-400 capitalize">
                                  {clave.replace(/_/g, ' ')}:
                                </span>
                                <div className="text-zinc-500 line-through truncate">
                                  <span className="text-[10px] text-zinc-600 block uppercase font-mono">Actual</span>
                                  {String(valorActual || 'Sin especificar')}
                                </div>
                                <div className="text-emerald-300 font-medium">
                                  <span className="text-[10px] text-emerald-500/80 block uppercase font-mono">Propuesto</span>
                                  {String(valorNuevo)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Formulario de Rechazo */}
                      {mostrarRechazoModId === sol.id && (
                        <div className="mb-4 p-3 rounded-2xl bg-rose-950/20 border border-rose-800/50 space-y-2">
                          <label className="block text-[11px] font-bold text-rose-300">Motivo del Rechazo:</label>
                          <input
                            type="text"
                            value={motivoRechazoMod[sol.id] || ''}
                            onChange={(e) =>
                              setMotivoRechazoMod((prev) => ({ ...prev, [sol.id]: e.target.value }))
                            }
                            placeholder="Ej: El teléfono no coincide o los datos son incompletos"
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                          />
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              type="button"
                              onClick={() => setMostrarRechazoModId(null)}
                              className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRechazarModificacion(sol)}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
                            >
                              Confirmar Rechazo
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Botones de Aprobación */}
                      {esPendiente && mostrarRechazoModId !== sol.id && (
                        <div className="flex items-center gap-3 pt-3 border-t border-zinc-800">
                          <button
                            type="button"
                            disabled={procesandoModId === sol.id}
                            onClick={() => handleAprobarModificacion(sol)}
                            className="flex-1 py-2.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-950/60 cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                            {procesandoModId === sol.id ? 'Aplicando...' : 'Aprobar y Aplicar Cambios al Comercio'}
                          </button>

                          <button
                            type="button"
                            onClick={() => setMostrarRechazoModId(sol.id)}
                            className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-rose-950/30 border border-zinc-800 hover:border-rose-800/60 text-zinc-400 hover:text-rose-300 text-xs font-semibold transition-all cursor-pointer"
                          >
                            Rechazar Modificación
                          </button>
                        </div>
                      )}

                      {/* Metadatos */}
                      {esAprobada && (
                        <p className="text-xs text-emerald-400">
                          Aprobado por {sol.revisado_por || 'Admin'} el {sol.fecha_revision ? new Date(sol.fecha_revision).toLocaleDateString('es-AR') : ''}
                        </p>
                      )}
                      {esRechazada && (
                        <p className="text-xs text-rose-400">
                          Rechazado por {sol.revisado_por || 'Admin'}: {sol.motivo_rechazo}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA: DEBATES & RECLAMOS DE CLIENTES */}
        {pestanaActiva === 'debates' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-950 to-zinc-900 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h2 className="text-base font-bold text-white">Debates & Inconvenientes de Clientes</h2>
                </div>
                <p className="text-xs text-zinc-300 max-w-2xl mt-1 leading-relaxed">
                  Registro confidencial de problemas reportados por usuarios registrados. <strong>Sólo visible para el comercio involucrado y para el administrador</strong>. Permite mediar, verificar respuestas del comercio y dar por resuelto el caso.
                </p>
              </div>

              {/* Filtro de Debates */}
              <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl shrink-0">
                {(['todos', 'abierto', 'en_revision', 'resuelto'] as const).map((filtro) => (
                  <button
                    key={filtro}
                    type="button"
                    onClick={() => setFiltroEstadoDebate(filtro)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                      filtroEstadoDebate === filtro
                        ? 'bg-amber-500 text-black shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {filtro.replace('_', ' ')}
                    {filtro === 'abierto' && debatesAbiertos.length > 0 && (
                      <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-black text-amber-400 font-black">
                        {debatesAbiertos.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {debatesFiltrados.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-zinc-950 border border-zinc-900 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-amber-500/40 mx-auto" />
                <p className="text-sm font-semibold text-zinc-300">No hay debates en esta vista</p>
                <p className="text-xs text-zinc-500">
                  {filtroEstadoDebate === 'abierto'
                    ? 'Excelente: No hay reclamos ni inconvenientes abiertos en la plataforma.'
                    : 'No se encontraron registros de inconvenientes con el filtro actual.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {debatesFiltrados.map((deb) => {
                  const esAbierto = deb.estado === 'abierto';
                  const esRevision = deb.estado === 'en_revision';
                  const esResuelto = deb.estado === 'resuelto';

                  return (
                    <div
                      key={deb.id}
                      className={`p-6 rounded-3xl border transition-all ${
                        esAbierto
                          ? 'bg-zinc-950 border-amber-500/50 shadow-xl shadow-amber-950/20'
                          : esRevision
                          ? 'bg-zinc-950 border-cyan-500/40'
                          : 'bg-zinc-950/60 border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">{deb.comercio_nombre}</span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              {deb.motivo}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400">
                            Iniciado por: <strong className="text-white">{deb.usuario_nombre}</strong> ({deb.usuario_email})
                            {deb.telefono_contacto && ` • Tel: ${deb.telefono_contacto}`}
                          </p>
                          <span className="text-[11px] text-zinc-500">
                            {new Date(deb.fecha_creacion).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} hs
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            esAbierto
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 animate-pulse'
                              : esRevision
                              ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          }`}
                        >
                          {esAbierto && '⚠️ Abierto'}
                          {esRevision && '🔍 En Revisión'}
                          {esResuelto && '✅ Resuelto'}
                        </span>
                      </div>

                      {/* Descripción del Usuario */}
                      <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 mb-3 space-y-1">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                          Descripción del Inconveniente por el Vecino:
                        </span>
                        <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">
                          {deb.descripcion}
                        </p>
                      </div>

                      {/* Respuesta del Comercio */}
                      <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 mb-4 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-cyan-400 uppercase tracking-wider">
                            Respuesta del Comercio:
                          </span>
                          {deb.fecha_respuesta && (
                            <span className="text-zinc-500">
                              {new Date(deb.fecha_respuesta).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                            </span>
                          )}
                        </div>
                        {deb.respuesta_comercio ? (
                          <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                            {deb.respuesta_comercio}
                          </p>
                        ) : (
                          <p className="text-xs text-zinc-500 italic">
                            El comercio aún no ha emitido una respuesta en este registro.
                          </p>
                        )}
                      </div>

                      {/* Nota interna del Administrador y Acciones */}
                      <div className="pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={notaAdminDebate[deb.id] || deb.nota_admin || ''}
                            onChange={(e) =>
                              setNotaAdminDebate((prev) => ({ ...prev, [deb.id]: e.target.value }))
                            }
                            placeholder="Nota interna de mediación (opcional)..."
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {deb.estado !== 'en_revision' && deb.estado !== 'resuelto' && (
                            <button
                              type="button"
                              disabled={procesandoDebateId === deb.id}
                              onClick={() => handleActualizarEstadoDebate(deb.id, 'en_revision')}
                              className="px-3 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Poner en Revisión
                            </button>
                          )}

                          {deb.estado !== 'resuelto' ? (
                            <button
                              type="button"
                              disabled={procesandoDebateId === deb.id}
                              onClick={() => handleActualizarEstadoDebate(deb.id, 'resuelto')}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Marcar Resuelto
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={procesandoDebateId === deb.id}
                              onClick={() => handleActualizarEstadoDebate(deb.id, 'abierto')}
                              className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Reabrir Debate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

        {/* PESTAÑA: TICKETS DE INACTIVIDAD PROLONGADA (>60 DÍAS) */}
        {pestanaActiva === 'inactivos' && (
          <div className="space-y-6">
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-rose-950/40 via-zinc-950 to-zinc-900 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <AlertCircle className="w-5 h-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                      Tickets de Inactividad Prolongada (&gt; 60 días)
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white">
                        {ticketsInactividad.length}
                      </span>
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Locales que superaron los 60 días en receso o vacaciones. Han sido ocultados del mapa para proteger la veracidad del directorio barrial.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={recargarDatos}
                className="py-2 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl transition-colors shrink-0 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Actualizar lista
              </button>
            </div>

            {/* Protocolo Operativo Informativo */}
            <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Protocolo de Moderación para Inactividad Prolongada
              </h4>
              <p className="text-zinc-400 leading-relaxed text-[11px]">
                1. <strong>Contacto directo:</strong> Utiliza el botón de WhatsApp o Llamada para comunicarte con el titular del local y consultar si el negocio sigue activo.<br />
                2. <strong>Reactivar:</strong> Si el comercio volvió a atender o fue un error, pulsa <em>&quot;Reactivar y Visibilizar Local&quot;</em>. Se removerá el ticket y volverá a aparecer en el mapa.<br />
                3. <strong>Baja Definitiva:</strong> Si el comercio cerró definitivamente o no contesta, pulsa <em>&quot;Confirmar Baja Definitiva&quot;</em> para archivar el local y dejar registro del motivo.
              </p>
            </div>

            {ticketsInactividad.length === 0 ? (
              <div className="text-center py-16 px-4 rounded-3xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-white">¡No hay locales con inactividad crítica!</h3>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Ningún comercio ha permanecido más de 60 días continuos en modo vacaciones. Todos los negocios del mapa se encuentran dentro de los plazos comunitarios permitidos.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ticketsInactividad.map((comercio) => {
                  const telLimpio = (comercio.whatsapp || comercio.telefono || '').replace(/\D/g, '');
                  const textoMensaje = encodeURIComponent(
                    `Hola ${comercio.nombre}, te contactamos desde la administración de Vecinos Cercanos. Vemos que tu local lleva más de 60 días en receso/vacaciones y deseamos saber si continúan en actividad para reactivar tu publicación en el mapa.`
                  );

                  return (
                    <div
                      key={comercio.id}
                      className="bg-zinc-950 border border-rose-500/40 rounded-3xl p-5 space-y-4 shadow-xl flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 mb-1.5">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              Oculto por Inactividad (&gt;60 días)
                            </span>
                            <h3 className="text-xl font-bold text-white">{comercio.nombre}</h3>
                            <p className="text-xs text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                              <span className="truncate">{comercio.direccion}</span>
                            </p>
                          </div>

                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {comercio.rubro}
                          </span>
                        </div>

                        {/* Motivo e Información de Fechas */}
                        <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-semibold text-rose-300">Motivo del Ticket:</span>
                              <p className="text-zinc-300 text-[11px] mt-0.5">
                                {comercio.motivo_ticket_baja || 'Superó los 60 días continuos en vacaciones/receso.'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px]">
                            <div>
                              <span className="text-zinc-500 block">Inicio de Receso:</span>
                              <span className="text-zinc-300 font-mono">
                                {comercio.vacaciones_desde || comercio.fecha_cierre_emergencia || 'No registrado'}
                              </span>
                            </div>
                            <div>
                              <span className="text-zinc-500 block">Fecha Estipulada de Retorno:</span>
                              <span className="text-zinc-300 font-mono">
                                {comercio.vacaciones_hasta || 'Sin definir'}
                              </span>
                            </div>
                          </div>

                          {comercio.mensaje_vacaciones && (
                            <div className="pt-2 border-t border-zinc-800/80 text-[11px]">
                              <span className="text-zinc-500 block">Mensaje dejado por el comerciante:</span>
                              <span className="text-zinc-300 italic">
                                &quot;{comercio.mensaje_vacaciones}&quot;
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Canales de Contacto */}
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          {comercio.whatsapp && (
                            <a
                              href={`https://wa.me/${telLimpio}?text=${textoMensaje}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              Contactar WhatsApp ({comercio.whatsapp})
                            </a>
                          )}

                          {comercio.telefono && comercio.telefono !== comercio.whatsapp && (
                            <a
                              href={`tel:${comercio.telefono}`}
                              className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                              <Phone className="w-3.5 h-3.5 text-zinc-400" />
                              Llamar ({comercio.telefono})
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Botones de Resolución del Ticket */}
                      <div className="pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleReactivarComercioInactivo(comercio)}
                          className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Reactivar y Visibilizar Local
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmarBajaDefinitiva(comercio)}
                          className="py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-800/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-rose-400" />
                          Confirmar Baja Definitiva
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA: GESTIÓN DE USUARIOS REGISTRADOS                      */}
        {/* ============================================================== */}
        {pestanaActiva === 'usuarios' && (
          <div className="space-y-6">
            {/* Mensaje de feedback de acciones */}
            {mensajeUsuarioExito && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-3 text-xs text-emerald-200 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{mensajeUsuarioExito}</span>
              </div>
            )}

            {/* Cabecera y Resumen de Cuentas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Total Registrados</span>
                <div className="text-2xl font-black text-white">{usuariosSistema.length}</div>
                <span className="text-[11px] text-zinc-400">En la red comunitaria</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Cuentas Activas</span>
                <div className="text-2xl font-black text-emerald-400">
                  {usuariosSistema.filter((u) => u.estado === 'activo').length}
                </div>
                <span className="text-[11px] text-emerald-500/80">Acceso normal habilitado</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Bloqueados</span>
                <div className="text-2xl font-black text-rose-400">
                  {usuariosSistema.filter((u) => u.estado === 'bloqueado').length}
                </div>
                <span className="text-[11px] text-rose-400/80">Por moderación o reportes</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">En Baja</span>
                <div className="text-2xl font-black text-amber-400">
                  {usuariosSistema.filter((u) => u.estado === 'baja').length}
                </div>
                <span className="text-[11px] text-amber-400/80">Desactivados voluntario/admin</span>
              </div>
            </div>

            {/* Barra de Búsqueda y Filtros */}
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={busquedaUsuarios}
                    onChange={(e) => setBusquedaUsuarios(e.target.value)}
                    placeholder="Buscar por nombre, correo electrónico o comercio asociado..."
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={filtroEstadoUsuario}
                    onChange={(e) => setFiltroEstadoUsuario(e.target.value as any)}
                    className="flex-1 sm:flex-initial px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="todos">Todos los Estados</option>
                    <option value="activo">Solo Activos</option>
                    <option value="bloqueado">Solo Bloqueados</option>
                    <option value="baja">Solo en Baja</option>
                  </select>

                  <select
                    value={filtroRolUsuario}
                    onChange={(e) => setFiltroRolUsuario(e.target.value as any)}
                    className="flex-1 sm:flex-initial px-3 py-2.5 bg-zinc-900 border border-zinc-800 rounded-2xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="todos">Todos los Roles</option>
                    <option value="usuario">Vecinos / Clientes</option>
                    <option value="comerciante">Comerciantes</option>
                    <option value="admin_nivel2">Administradores (Nivel 2)</option>
                    <option value="superadmin">SuperAdmin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de Usuarios Registrados */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-xl">
              {usuariosFiltrados.length === 0 ? (
                <div className="p-12 text-center space-y-2">
                  <Users className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No se encontraron usuarios</h4>
                  <p className="text-xs text-zinc-400">Intenta modificando los términos de búsqueda o filtros.</p>
                </div>
              ) : (
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">Rol</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4">Registro / Acceso</th>
                        <th className="py-3 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80">
                      {usuariosFiltrados.map((u) => {
                        const esSuperAdminTarget = u.rol === 'superadmin';
                        return (
                          <tr key={u.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0">
                                  {u.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <span className="font-bold text-white block">{u.nombre}</span>
                                  <span className="text-[11px] text-zinc-400 font-mono block">{u.email}</span>
                                  {u.comercio_nombre && (
                                    <span className="text-[10px] text-cyan-400 flex items-center gap-1 mt-0.5">
                                      <Store className="w-3 h-3" />
                                      {u.comercio_nombre}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                                  u.rol === 'superadmin'
                                    ? 'bg-amber-950/80 text-amber-300 border-amber-600/50'
                                    : u.rol === 'admin_nivel2'
                                    ? 'bg-indigo-950/80 text-indigo-300 border-indigo-600/50'
                                    : u.rol === 'comerciante'
                                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600/50'
                                    : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                                }`}
                              >
                                {u.rol}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                                    u.estado === 'activo'
                                      ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                                      : u.estado === 'bloqueado'
                                      ? 'bg-rose-950/80 text-rose-300 border-rose-600/60'
                                      : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      u.estado === 'activo'
                                        ? 'bg-emerald-400'
                                        : u.estado === 'bloqueado'
                                        ? 'bg-rose-400'
                                        : 'bg-amber-400'
                                    }`}
                                  />
                                  <span>{u.estado.toUpperCase()}</span>
                                </span>
                                {u.motivo_estado && (
                                  <span className="block text-[10.5px] text-zinc-400 mt-1 max-w-xs italic line-clamp-1">
                                    {u.motivo_estado}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-zinc-400 text-[11px]">
                              <div>
                                <span>Alta: {new Date(u.fecha_registro).toLocaleDateString('es-AR')}</span>
                                {u.ultimo_acceso && (
                                  <span className="block text-[10px] text-zinc-500 font-mono">
                                    Último: {new Date(u.ultimo_acceso).toLocaleDateString('es-AR')}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right">
                              {esSuperAdminTarget ? (
                                <span className="text-[11px] text-zinc-500 italic">Cuenta Protegida</span>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  {u.estado !== 'activo' ? (
                                    <button
                                      type="button"
                                      onClick={() => handleReactivarUsuario(u)}
                                      className="py-1 px-2.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                      title="Reactivar cuenta de usuario"
                                    >
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Reactivar</span>
                                    </button>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUsuarioSeleccionado(u);
                                          setTipoModalUsuario('bloquear');
                                          setMotivoAccionUsuario('');
                                        }}
                                        className="py-1 px-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                        title="Bloquear acceso"
                                      >
                                        <Ban className="w-3.5 h-3.5 text-rose-400" />
                                        <span>Bloquear</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUsuarioSeleccionado(u);
                                          setTipoModalUsuario('baja');
                                          setMotivoAccionUsuario('');
                                        }}
                                        className="py-1 px-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-amber-300 border border-zinc-800 text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                                        title="Dar de baja de la plataforma"
                                      >
                                        <UserX className="w-3.5 h-3.5 text-amber-400" />
                                        <span>Baja</span>
                                      </button>
                                    </>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      setUsuarioSeleccionado(u);
                                      setTipoModalUsuario('eliminar');
                                    }}
                                    className="p-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950 text-zinc-500 hover:text-rose-400 border border-zinc-800 text-[11px] font-semibold cursor-pointer transition-colors"
                                    title="Borrado definitivo para permitir nuevo registro desde cero"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Acción sobre Usuario (Bloquear / Dar de Baja / Borrado Definitivo) */}
      {tipoModalUsuario && usuarioSeleccionado && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {tipoModalUsuario === 'bloquear' && <Ban className="w-4 h-4 text-rose-400" />}
                {tipoModalUsuario === 'baja' && <UserX className="w-4 h-4 text-amber-400" />}
                {tipoModalUsuario === 'eliminar' && <Trash2 className="w-4 h-4 text-rose-500" />}
                <span>
                  {tipoModalUsuario === 'bloquear' && 'Bloquear Usuario'}
                  {tipoModalUsuario === 'baja' && 'Dar de Baja Usuario'}
                  {tipoModalUsuario === 'eliminar' && 'Borrado Definitivo de Usuario'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setTipoModalUsuario(null);
                  setUsuarioSeleccionado(null);
                }}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold block">Usuario Objetivo:</span>
              <strong className="text-white block font-semibold">{usuarioSeleccionado.nombre}</strong>
              <span className="font-mono text-zinc-400 text-[11px]">{usuarioSeleccionado.email}</span>
            </div>

            {tipoModalUsuario === 'eliminar' ? (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-600/50 text-xs text-rose-200 space-y-2">
                <strong className="block font-bold">⚠️ Atención: Borrado Definitivo</strong>
                <p className="text-[11px] leading-relaxed">
                  Esta acción eliminará completamente la cuenta y liberará el correo electrónico{' '}
                  <strong className="text-white font-mono">{usuarioSeleccionado.email}</strong>, permitiendo que la persona pueda volver a registrarse desde cero y verificar su cuenta nuevamente si lo desea.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Motivo de la acción:
                </label>
                <input
                  type="text"
                  value={motivoAccionUsuario}
                  onChange={(e) => setMotivoAccionUsuario(e.target.value)}
                  placeholder={
                    tipoModalUsuario === 'bloquear'
                      ? 'Ej: Conducta indebida, reportes falsos reiterados'
                      : 'Ej: Desactivación por solicitud o inactividad'
                  }
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setTipoModalUsuario(null);
                  setUsuarioSeleccionado(null);
                }}
                className="py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={procesandoUsuario}
                onClick={handleEjecutarAccionUsuario}
                className={`py-2 px-4 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  tipoModalUsuario === 'eliminar'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-950/50'
                    : tipoModalUsuario === 'bloquear'
                    ? 'bg-rose-700 hover:bg-rose-600'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>
                  {procesandoUsuario
                    ? 'Procesando...'
                    : tipoModalUsuario === 'eliminar'
                    ? 'Confirmar Borrado Definitivo'
                    : tipoModalUsuario === 'bloquear'
                    ? 'Confirmar Bloqueo'
                    : 'Confirmar Baja'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Visualizar Comprobante en Alta Resolución */}
      {imagenModalUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setImagenModalUrl(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-800 rounded-3xl p-3 flex flex-col items-center overflow-hidden shadow-2xl"
          >
            <div className="w-full flex items-center justify-between pb-3 px-2 border-b border-zinc-800">
              <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                Comprobante de Transferencia Adjunto
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={imagenModalUrl}
                  download="comprobante-transferencia.png"
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-xs text-white border border-zinc-800 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </a>
                <button
                  type="button"
                  onClick={() => setImagenModalUrl(null)}
                  className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-2 overflow-auto max-h-[calc(90vh-70px)] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagenModalUrl}
                alt="Comprobante completo"
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
