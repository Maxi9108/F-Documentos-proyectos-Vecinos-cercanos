'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Comercio,
  NivelComercio,
  NIVELES_CONFIG,
  ComprobanteTransferencia,
  DebateInconveniente,
  ModificacionComercio,
} from '@/types/comercio';
import {
  getComercios,
  getComprobantesTransferencia,
  guardarComprobanteTransferencia,
  getDebatesPorComercio,
  responderDebateComercio,
  actualizarEstadoDebate,
  getSolicitudesModificacion,
  guardarSolicitudModificacion,
  calcularSiguienteDiaHabil6AM,
  reanudarHorarioNormal,
  autoResolverCuarentenaComercio,
} from '@/lib/supabase';
import { getCategorias } from '@/lib/categorias';
import { registrarEvento } from '@/lib/analytics';
import ContadorMembresia from '@/components/ContadorMembresia';
import NeoFaroLogo from '@/components/NeoFaroLogo';
import {
  Store,
  ArrowLeft,
  Crown,
  Award,
  Upload,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Check,
  ShieldCheck,
  Calendar,
  DollarSign,
  FileText,
  Send,
  Eye,
  X,
  Sparkles,
  Info,
  Sun,
  Moon,
  Bike,
  Palmtree,
  Pill,
  AlertCircle,
  HelpCircle,
  Lock,
  AlertOctagon,
} from 'lucide-react';

export default function MiComercioPage() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [comercioSeleccionadoId, setComercioSeleccionadoId] = useState<string>('');
  const [cargando, setCargando] = useState(true);

  // Pestañas del portal
  const [pestana, setPestana] = useState<'modificar' | 'comprobantes' | 'debates'>('modificar');

  // Categorías disponibles para rubros
  const [categoriasRubro, setCategoriasRubro] = useState<string[]>([]);

  // Estados de Modificación de Comercio
  const [nombre, setNombre] = useState('');
  const [rubro, setRubro] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [horario, setHorario] = useState('');
  const [tieneHorarioCortado, setTieneHorarioCortado] = useState(false);
  const [horarioManana, setHorarioManana] = useState('');
  const [horarioTarde, setHorarioTarde] = useState('');
  const [tipoAtencion, setTipoAtencion] = useState<'local_fisico' | 'solo_envio' | 'ambos'>('local_fisico');
  const [radioKm, setRadioKm] = useState(3);
  const [zonaEnvioDescripcion, setZonaEnvioDescripcion] = useState('');
  const [enVacaciones, setEnVacaciones] = useState(false);
  const [vacacionesDesde, setVacacionesDesde] = useState('');
  const [vacacionesHasta, setVacacionesHasta] = useState('');
  const [mensajeVacaciones, setMensajeVacaciones] = useState('');
  const [cerradoMomentaneo, setCerradoMomentaneo] = useState(false);
  const [motivoCierreMomentaneo, setMotivoCierreMomentaneo] = useState('');
  const [estaDeTurno, setEstaDeTurno] = useState(false);

  // Solicitudes de modificación previas
  const [solicitudesMod, setSolicitudesMod] = useState<ModificacionComercio[]>([]);
  const [enviandoMod, setEnviandoMod] = useState(false);
  const [mensajeModExito, setMensajeModExito] = useState<string | null>(null);

  // Estados de Carga de Comprobante
  const [categoriaAbonada, setCategoriaAbonada] = useState<NivelComercio>('gold');
  const [monto, setMonto] = useState<string>('7900');
  const [numeroOperacion, setNumeroOperacion] = useState('');
  const [bancoOrigen, setBancoOrigen] = useState('');
  const [notasComprobante, setNotasComprobante] = useState('');
  const [comprobanteUrl, setComprobanteUrl] = useState<string>('');
  const [comprobanteNombre, setComprobanteNombre] = useState<string>('');
  const [enviandoComprobante, setEnviandoComprobante] = useState(false);
  const [mensajeCompExito, setMensajeCompExito] = useState<string | null>(null);
  const [comprobantesHistorial, setComprobantesHistorial] = useState<ComprobanteTransferencia[]>([]);
  const [imagenModalUrl, setImagenModalUrl] = useState<string | null>(null);

  // Estados de Debates
  const [debates, setDebates] = useState<DebateInconveniente[]>([]);
  const [respuestaTexto, setRespuestaTexto] = useState<{ [debateId: string]: string }>({});
  const [respondiendoDebateId, setRespondiendoDebateId] = useState<string | null>(null);

  // Carga inicial de datos
  useEffect(() => {
    async function inicializar() {
      setCargando(true);
      const lista = await getComercios();
      setComercios(lista);

      const cats = getCategorias().map((c) => c.nombre);
      setCategoriasRubro(cats);

      if (lista.length > 0) {
        // Intentar recuperar el último comercio seleccionado de localStorage
        const guardadoId = typeof window !== 'undefined' ? localStorage.getItem('vecinos_mi_comercio_id') : null;
        const inicial = lista.find((c) => c.id === guardadoId) || lista[0];
        setComercioSeleccionadoId(inicial.id);
        cargarDatosFormulario(inicial);
      }
      setCargando(false);
    }
    inicializar();
  }, []);

  const comercioActual = comercios.find((c) => c.id === comercioSeleccionadoId);

  // Cargar datos del comercio en los campos del formulario
  const cargarDatosFormulario = (comercio: Comercio) => {
    setNombre(comercio.nombre || '');
    setRubro(comercio.rubro || 'Almacén');
    setDireccion(comercio.direccion || '');
    setTelefono(comercio.telefono || '');
    setWhatsapp(comercio.whatsapp || comercio.telefono || '');
    setDescripcion(comercio.descripcion || '');
    setHorario(comercio.horario || '');
    setTieneHorarioCortado(Boolean(comercio.tiene_horario_cortado));
    setHorarioManana(comercio.horario_manana || '08:30 - 13:00');
    setHorarioTarde(comercio.horario_tarde || '16:30 - 20:30');
    setTipoAtencion(comercio.tipo_atencion || 'local_fisico');
    setRadioKm(comercio.radio_entrega_metros ? comercio.radio_entrega_metros / 1000 : 3);
    setZonaEnvioDescripcion(comercio.zona_envio_descripcion || '');
    setEnVacaciones(Boolean(comercio.en_vacaciones));
    setVacacionesDesde(comercio.vacaciones_desde || '');
    setVacacionesHasta(comercio.vacaciones_hasta || '');
    setMensajeVacaciones(comercio.mensaje_vacaciones || '');
    setCerradoMomentaneo(Boolean(comercio.cerrado_momentaneo));
    setMotivoCierreMomentaneo(comercio.motivo_cierre_momentaneo || '');
    setEstaDeTurno(Boolean(comercio.esta_de_turno));

    if (typeof window !== 'undefined') {
      localStorage.setItem('vecinos_mi_comercio_id', comercio.id);
    }
  };

  // Cargar comprobantes, modificaciones y debates cuando cambia el comercio
  useEffect(() => {
    if (!comercioSeleccionadoId) return;

    async function cargarRelacionados() {
      // 1. Comprobantes
      const todosComp = await getComprobantesTransferencia();
      setComprobantesHistorial(todosComp.filter((c) => c.comercio_id === comercioSeleccionadoId));

      // 2. Debates
      const debatesCom = await getDebatesPorComercio(comercioSeleccionadoId);
      setDebates(debatesCom);

      // 3. Modificaciones
      const todasMod = await getSolicitudesModificacion();
      setSolicitudesMod(todasMod.filter((s) => s.comercio_id === comercioSeleccionadoId));
    }

    cargarRelacionados();
  }, [comercioSeleccionadoId]);

  // Manejar cambio de comercio en el selector
  const handleCambiarComercio = (id: string) => {
    setComercioSeleccionadoId(id);
    const encontrado = comercios.find((c) => c.id === id);
    if (encontrado) {
      cargarDatosFormulario(encontrado);
      setMensajeModExito(null);
      setMensajeCompExito(null);
    }
  };

  // Enviar Modificaciones para Aprobación del Administrador
  const handleSubmitModificaciones = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercioActual) return;

    if (enVacaciones && !vacacionesHasta) {
      alert('Debes indicar obligatoriamente el día de Retorno para programar las vacaciones.');
      setEnviandoMod(false);
      return;
    }

    let supera60Dias = false;
    let diasTotalesVac = 0;
    if (enVacaciones && vacacionesHasta) {
      const hoyStr = new Date().toISOString().split('T')[0];
      const msIni = new Date(vacacionesDesde || hoyStr).getTime();
      const msFin = new Date(vacacionesHasta).getTime();
      diasTotalesVac = Math.round((msFin - msIni) / (1000 * 60 * 60 * 24));
      supera60Dias = diasTotalesVac > 60;
    }

    const fechaReapertura = cerradoMomentaneo
      ? (comercioActual.reapertura_emergencia_programada || calcularSiguienteDiaHabil6AM().toISOString())
      : undefined;

    const cambios: Partial<Comercio> = {
      nombre: nombre.trim(),
      rubro: rubro.trim(),
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      whatsapp: whatsapp.trim() || telefono.trim(),
      descripcion: descripcion.trim(),
      horario: tieneHorarioCortado ? `Mañana: ${horarioManana.trim()} | Tarde: ${horarioTarde.trim()}` : horario.trim(),
      tiene_horario_cortado: tieneHorarioCortado,
      horario_manana: tieneHorarioCortado ? horarioManana.trim() : undefined,
      horario_tarde: tieneHorarioCortado ? horarioTarde.trim() : undefined,
      tipo_atencion: tipoAtencion,
      radio_entrega_metros: tipoAtencion !== 'local_fisico' ? Math.round(radioKm * 1000) : 0,
      zona_envio_descripcion: tipoAtencion !== 'local_fisico' ? zonaEnvioDescripcion.trim() : '',
      en_vacaciones: enVacaciones,
      vacaciones_desde: enVacaciones ? (vacacionesDesde || new Date().toISOString().split('T')[0]) : undefined,
      vacaciones_hasta: enVacaciones ? vacacionesHasta : undefined,
      mensaje_vacaciones: enVacaciones ? mensajeVacaciones.trim() : undefined,
      oculto_por_inactividad: enVacaciones ? supera60Dias : false,
      ticket_baja_definitiva: enVacaciones ? supera60Dias : false,
      fecha_ticket_baja: (enVacaciones && supera60Dias) ? new Date().toISOString() : undefined,
      motivo_ticket_baja: (enVacaciones && supera60Dias)
        ? `Vacaciones programadas de ${diasTotalesVac} días (supera el límite de 60 días)`
        : undefined,
      cerrado_momentaneo: cerradoMomentaneo,
      motivo_cierre_momentaneo: cerradoMomentaneo ? motivoCierreMomentaneo.trim() : undefined,
      fecha_cierre_emergencia: cerradoMomentaneo ? (comercioActual.fecha_cierre_emergencia || new Date().toISOString()) : undefined,
      reapertura_emergencia_programada: fechaReapertura,
      esta_de_turno: rubro.toLowerCase().includes('farmacia') ? estaDeTurno : false,
    };

    const nuevaSolicitud: ModificacionComercio = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `mod-${Date.now()}`,
      comercio_id: comercioActual.id,
      comercio_nombre: comercioActual.nombre,
      fecha_solicitud: new Date().toISOString(),
      estado: 'pendiente',
      cambios,
      datos_anteriores: {
        nombre: comercioActual.nombre,
        rubro: comercioActual.rubro,
        direccion: comercioActual.direccion,
        telefono: comercioActual.telefono,
        horario: comercioActual.horario,
        descripcion: comercioActual.descripcion,
      },
    };

    const res = await guardarSolicitudModificacion(nuevaSolicitud);
    setEnviandoMod(false);

    if (res.success) {
      registrarEvento('solicitud_modificacion_comercio', comercioActual.id, comercioActual.nombre, { cambios });
      setMensajeModExito('¡Solicitud de modificación enviada exitosamente! El administrador revisará y aprobará los cambios a la brevedad.');
      setSolicitudesMod((prev) => [nuevaSolicitud, ...prev]);
    }
  };

  // Subir archivo de comprobante (convertir a Base64)
  const handleArchivoComprobante = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setComprobanteNombre(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setComprobanteUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Enviar Comprobante de Transferencia
  const handleSubmitComprobante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercioActual) return;

    if (!comprobanteUrl) {
      alert('Por favor adjunta la foto o captura del comprobante de transferencia.');
      return;
    }

    setEnviandoComprobante(true);
    setMensajeCompExito(null);

    const nuevoComp: ComprobanteTransferencia = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comp-${Date.now()}`,
      comercio_id: comercioActual.id,
      comercio_nombre: comercioActual.nombre,
      categoria_solicitada: categoriaAbonada,
      monto: Number(monto) || (categoriaAbonada === 'gold' ? 7900 : 4500),
      fecha_envio: new Date().toISOString(),
      comprobante_url: comprobanteUrl,
      comprobante_nombre: comprobanteNombre,
      numero_operacion: numeroOperacion.trim() || undefined,
      banco_origen: bancoOrigen.trim() || undefined,
      notas: notasComprobante.trim() || undefined,
      estado: 'pendiente',
    };

    const res = await guardarComprobanteTransferencia(nuevoComp);
    setEnviandoComprobante(false);

    if (res.success) {
      registrarEvento('comprobante_transferencia_enviado', comercioActual.id, comercioActual.nombre, {
        categoria: categoriaAbonada,
        monto: nuevoComp.monto,
      });
      setMensajeCompExito('¡Comprobante enviado al administrador! Se te acreditará +1 mes extra tan pronto sea verificado.');
      setComprobantesHistorial((prev) => [nuevoComp, ...prev]);
      setNumeroOperacion('');
      setNotasComprobante('');
      setComprobanteUrl('');
      setComprobanteNombre('');
    }
  };

  // Responder a un debate
  const handleResponderDebate = async (debateId: string) => {
    const respuesta = respuestaTexto[debateId]?.trim();
    if (!respuesta) return;

    setRespondiendoDebateId(debateId);
    const res = await responderDebateComercio(debateId, respuesta);
    setRespondiendoDebateId(null);

    if (res.success) {
      setDebates((prev) =>
        prev.map((d) =>
          d.id === debateId
            ? {
                ...d,
                respuesta_comercio: respuesta,
                fecha_respuesta: new Date().toISOString(),
                estado: 'en_revision',
              }
            : d
        )
      );
      setRespuestaTexto((prev) => ({ ...prev, [debateId]: '' }));
    }
  };

  // Marcar debate como resuelto
  const handleResolverDebate = async (debateId: string) => {
    const res = await actualizarEstadoDebate(debateId, 'resuelto', 'Resuelto por el comercio');
    if (res.success) {
      setDebates((prev) =>
        prev.map((d) =>
          d.id === debateId
            ? {
                ...d,
                estado: 'resuelto',
                fecha_resolucion: new Date().toISOString(),
              }
            : d
        )
      );
    }
  };

  const solicitudPendiente = solicitudesMod.find((s) => s.estado === 'pendiente');

  return (
    <main className="min-h-screen bg-black text-zinc-100 flex flex-col selection:bg-cyan-400 selection:text-black">
      {/* Header Superior */}
      <header className="sticky top-0 z-30 bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
              title="Volver al mapa principal"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <NeoFaroLogo size="sm" showSlogan={false} />
            <span className="hidden sm:inline-block text-zinc-600">|</span>
            <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
              <Store className="w-4 h-4 text-cyan-400" />
              <span>Portal de Mi Comercio</span>
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-cyan-300 border border-zinc-800 text-xs font-semibold flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Panel Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Selector de Comercio y Resumen */}
        <section className="p-5 sm:p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold block mb-1">
                Comercio Administrado:
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={comercioSeleccionadoId}
                  onChange={(e) => handleCambiarComercio(e.target.value)}
                  className="px-3.5 py-2 bg-zinc-900 border border-zinc-700/80 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer min-w-[240px]"
                >
                  {comercios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.rubro})
                    </option>
                  ))}
                </select>

                <Link
                  href="/cargar-comercio"
                  className="py-2 px-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-cyan-400 border border-zinc-800 text-xs font-bold transition-colors"
                  title="Sumar otro comercio a la plataforma"
                >
                  + Nuevo
                </Link>
              </div>
            </div>

            {comercioActual && (
              <div className="flex items-center gap-2 flex-wrap">
                {/* Badge de Estado de Aprobación o Cuarentena */}
                {comercioActual.en_cuarentena ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 bg-rose-950/80 text-rose-300 border-rose-500/80 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>En Cuarentena Preventiva (Oculto)</span>
                  </span>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                      comercioActual.estado_aprobacion === 'aprobado'
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                        : comercioActual.estado_aprobacion === 'rechazado'
                        ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                        : 'bg-amber-950/60 text-amber-300 border-amber-800/60 animate-pulse'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        comercioActual.estado_aprobacion === 'aprobado'
                          ? 'bg-emerald-400'
                          : comercioActual.estado_aprobacion === 'rechazado'
                          ? 'bg-rose-400'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span>
                      {comercioActual.estado_aprobacion === 'aprobado'
                        ? 'Aprobado y Visible en el Mapa'
                        : comercioActual.estado_aprobacion === 'rechazado'
                        ? 'Rechazado por Moderación'
                        : 'Pendiente de Aprobación del Admin'}
                    </span>
                  </span>
                )}

                {/* Badge de Nivel */}
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
                    comercioActual.nivel === 'gold'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : comercioActual.nivel === 'premium'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {comercioActual.nivel === 'gold' && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  {comercioActual.nivel === 'premium' && <Award className="w-3.5 h-3.5 text-purple-400" />}
                  <span>Categoría {comercioActual.nivel ? comercioActual.nivel.toUpperCase() : 'STANDAR'}</span>
                </span>
              </div>
            )}
          </div>

          {/* BANNER URGENTE: CUARENTENA PREVENTIVA POR REPORTES CIUDADANOS */}
          {comercioActual && comercioActual.en_cuarentena && (
            <div className="pt-2">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-950/90 via-red-950/80 to-zinc-950 border-2 border-rose-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-rose-200 shadow-xl shadow-rose-950/40 animate-in fade-in">
                <div className="flex items-start gap-3">
                  <span className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
                    <AlertOctagon className="w-6 h-6 text-rose-400" />
                  </span>
                  <div className="space-y-1">
                    <strong className="text-white text-sm font-bold block flex items-center gap-2">
                      <span>Aviso Urgente: Tu comercio se encuentra en Cuarentena Preventiva</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        Oculto del Mapa
                      </span>
                    </strong>
                    <p className="text-rose-200 text-xs leading-relaxed max-w-3xl">
                      Varios vecinos del barrio han reportado inconsistencias sobre tu local ({comercioActual.motivo_cuarentena || 'Múltiples reportes ciudadanos en menos de 15 días'}). Para proteger la veracidad del mapa barrial, tu comercio ha sido pausado temporalmente para el público.
                    </p>
                    <p className="text-[11px] text-rose-300/80 font-medium">
                      Si tu comercio continúa activo y atendiendo normalmente, pulsa el botón para auto-resolver este estado y restablecer la visibilidad de tu local de inmediato.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    if (
                      confirm(
                        '¿Confirmas que tu comercio sigue activo y operando con normalidad? Esta acción levantará la cuarentena preventiva y volverá a visibilizar tu comercio en el mapa del barrio.'
                      )
                    ) {
                      const res = await autoResolverCuarentenaComercio(comercioActual.id);
                      if (res.success) {
                        const c = await getComercios();
                        setComercios(c);
                        const act = c.find((x) => x.id === comercioActual.id);
                        if (act) cargarDatosFormulario(act);
                        alert(
                          '¡Excelente! Se ha confirmado que sigues operativo. Tu local vuelve a estar visible en el mapa del barrio.'
                        );
                      }
                    }
                  }}
                  className="py-3 px-5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shrink-0 cursor-pointer shadow-lg shadow-rose-950/60 transition-all flex items-center justify-center gap-2 self-stretch md:self-auto"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmar que sigo operativo</span>
                </button>
              </div>
            </div>
          )}

          {/* CONTADOR EN TIEMPO REAL DEL MES EN CURSO (PREMIUM Y GOLD) */}
          {comercioActual && (comercioActual.nivel === 'gold' || comercioActual.nivel === 'premium') && (
            <div className="pt-2">
              <ContadorMembresia
                fechaVencimiento={comercioActual.fecha_vencimiento_nivel}
                nivel={comercioActual.nivel}
                formato="reloj_digital"
              />
            </div>
          )}

          {/* BANNERS OPERATIVOS: EMERGENCIA Y VACACIONES */}
          {comercioActual && (comercioActual.cerrado_momentaneo || comercioActual.en_vacaciones) && (
            <div className="pt-2 space-y-2">
              {comercioActual.cerrado_momentaneo && (
                <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-amber-300 block">Cierre por Emergencia Activo:</strong>
                      <span>{comercioActual.motivo_cierre_momentaneo || 'Inconveniente imprevisto.'}</span>
                      {comercioActual.reapertura_emergencia_programada && (
                        <p className="text-[11px] text-amber-400/90 font-mono mt-0.5">
                          Restablecimiento automático: {new Date(comercioActual.reapertura_emergencia_programada).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })} a las 06:00 AM
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('¿Deseas restablecer de inmediato la atención normal del comercio?')) {
                        await reanudarHorarioNormal(comercioActual.id);
                        const c = await getComercios();
                        setComercios(c);
                        const act = c.find((x) => x.id === comercioActual.id);
                        if (act) cargarDatosFormulario(act);
                      }
                    }}
                    className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-extrabold text-xs shrink-0 cursor-pointer transition-all"
                  >
                    Reabrir Local Ahora
                  </button>
                </div>
              )}

              {comercioActual.en_vacaciones && (
                <div className="p-3.5 rounded-2xl bg-sky-950/60 border border-sky-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-sky-200">
                  <div className="flex items-start gap-2.5">
                    <Palmtree className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-sky-300 block">Receso por Vacaciones Programadas:</strong>
                      <span>
                        Día de Retorno: {comercioActual.vacaciones_hasta ? new Date(comercioActual.vacaciones_hasta).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin fecha'}
                        {comercioActual.mensaje_vacaciones ? ` — "${comercioActual.mensaje_vacaciones}"` : ''}
                      </span>
                      {comercioActual.oculto_por_inactividad ? (
                        <p className="text-[11px] text-rose-300 font-bold mt-0.5">
                          ⚠️ Local Oculto del Mapa (+60 días en vacaciones): Elevado a revisión de baja en el Panel Admin.
                        </p>
                      ) : (
                        <p className="text-[11px] text-sky-400 font-medium mt-0.5">
                          El sistema volverá a visibilizar y abrir el local automáticamente en la fecha de retorno.
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm('¿Deseas finalizar las vacaciones hoy y volver a abrir el local?')) {
                        await reanudarHorarioNormal(comercioActual.id);
                        const c = await getComercios();
                        setComercios(c);
                        const act = c.find((x) => x.id === comercioActual.id);
                        if (act) cargarDatosFormulario(act);
                      }
                    }}
                    className="py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs shrink-0 cursor-pointer transition-all"
                  >
                    Finalizar Vacaciones Hoy
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Barra de Pestañas */}
        <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar gap-1">
          <button
            type="button"
            onClick={() => setPestana('modificar')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              pestana === 'modificar'
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Modificar Datos y Opciones</span>
          </button>

          <button
            type="button"
            onClick={() => setPestana('comprobantes')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              pestana === 'comprobantes'
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Cargar Comprobantes de Transferencia</span>
          </button>

          <button
            type="button"
            onClick={() => setPestana('debates')}
            className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              pestana === 'debates'
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Debates de Clientes ({debates.length})</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* PESTAÑA 1: MODIFICAR DATOS Y OPCIONES (CON APROBACIÓN DEL ADMIN)*/}
        {/* ============================================================== */}
        {pestana === 'modificar' && (
          <div className="space-y-6">
            {/* Alerta de Aprobación Previa del Administrador */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-violet-500/30 flex items-start gap-3 text-xs text-zinc-300">
              <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-white block">
                  Cualquier modificación requiere aprobación del Administrador
                </span>
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Para proteger la seguridad de la comunidad barrial, todas las opciones y datos modificados son enviados a moderación. Tus datos actuales continuarán visibles para los vecinos hasta que el administrador verifique y apruebe los cambios.
                </p>
              </div>
            </div>

            {solicitudPendiente && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/50 flex items-start gap-3 text-xs text-amber-200">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Tienes una solicitud de modificación en revisión</span>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Enviada el {new Date(solicitudPendiente.fecha_solicitud).toLocaleString('es-AR')}. El administrador la está corroborando.
                  </p>
                </div>
              </div>
            )}

            {mensajeModExito && (
              <div className="p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/50 flex items-center gap-3 text-xs text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{mensajeModExito}</span>
              </div>
            )}

            <form onSubmit={handleSubmitModificaciones} className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-6">
              <h3 className="text-base font-bold text-white border-b border-zinc-800 pb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Datos Básicos y de Contacto</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Nombre del Comercio *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Rubro / Categoría Comercial *
                  </label>
                  <select
                    value={rubro}
                    onChange={(e) => setRubro(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    {categoriasRubro.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Dirección Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Teléfono de Llamada
                  </label>
                  <input
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    WhatsApp Comercial
                  </label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Modalidad de Atención
                  </label>
                  <select
                    value={tipoAtencion}
                    onChange={(e) => setTipoAtencion(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="local_fisico">Local Físico (Atención al público)</option>
                    <option value="solo_envio">Solo Envíos a Domicilio (Delivery)</option>
                    <option value="ambos">Ambos (Local Físico y Delivery)</option>
                  </select>
                </div>
              </div>

              {tipoAtencion !== 'local_fisico' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Radio de Envíos: {radioKm} km
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={15}
                      step={0.5}
                      value={radioKm}
                      onChange={(e) => setRadioKm(Number(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Descripción de Zona de Reparto
                    </label>
                    <input
                      type="text"
                      value={zonaEnvioDescripcion}
                      onChange={(e) => setZonaEnvioDescripcion(e.target.value)}
                      placeholder="Ej: Solo dentro de las 4 avenidas principales"
                      className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Horarios de Atención */}
              <div className="space-y-3 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Configuración de Horarios
                  </span>
                  <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={tieneHorarioCortado}
                      onChange={(e) => setTieneHorarioCortado(e.target.checked)}
                      className="rounded accent-violet-600"
                    />
                    <span>Atención con Horario Cortado (Mañana y Tarde)</span>
                  </label>
                </div>

                {tieneHorarioCortado ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Turno Mañana</span>
                      </label>
                      <input
                        type="text"
                        value={horarioManana}
                        onChange={(e) => setHorarioManana(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                        <Moon className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Turno Tarde</span>
                      </label>
                      <input
                        type="text"
                        value={horarioTarde}
                        onChange={(e) => setHorarioTarde(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">
                      Horario Corrido
                    </label>
                    <input
                      type="text"
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                      placeholder="Ej: Lunes a Sábados de 8:00 a 20:00"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                    />
                  </div>
                )}
              </div>

              {/* Opciones Operativas Especiales */}
              <div className="space-y-4 pt-3 border-t border-zinc-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Opciones Operativas Especiales
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Pausa Momentánea / Emergencia con Caducidad Automática */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    cerradoMomentaneo ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-950/20' : 'bg-zinc-900/60 border-zinc-800'
                  }`}>
                    <label className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={cerradoMomentaneo}
                        onChange={(e) => setCerradoMomentaneo(e.target.checked)}
                        className="accent-amber-500 rounded"
                      />
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Cerrado por Emergencia (Caducidad Automática)</span>
                    </label>

                    {cerradoMomentaneo ? (
                      <div className="space-y-2.5 pt-2 border-t border-amber-800/40">
                        <div>
                          <label className="block text-[11px] font-semibold text-amber-200 mb-1">
                            Motivo de la Emergencia:
                          </label>
                          <input
                            type="text"
                            value={motivoCierreMomentaneo}
                            onChange={(e) => setMotivoCierreMomentaneo(e.target.value)}
                            placeholder="Ej: Corte de suministro eléctrico o fuerza mayor"
                            className="w-full px-3 py-2 bg-zinc-950 border border-amber-700/60 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-900/30 border border-amber-600/40 text-[11px] text-amber-200 space-y-1">
                          <span className="font-bold flex items-center gap-1.5 text-amber-300">
                            <Clock className="w-3.5 h-3.5" />
                            Caducidad y Restablecimiento Automático:
                          </span>
                          <p className="leading-relaxed text-amber-200/90">
                            El estado cambia inmediatamente a cerrado. El sistema lo restablecerá automáticamente a los horarios habituales el <strong>{calcularSiguienteDiaHabil6AM().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })} a las 06:00 AM</strong>, eliminando el error humano del olvido.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 leading-tight">
                        Al activarlo, se cierra de inmediato y se reactiva solo al inicio del siguiente día hábil a las 06:00 AM.
                      </p>
                    )}
                  </div>

                  {/* Vacaciones Programadas Obligatorias */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    enVacaciones ? 'bg-sky-950/40 border-sky-500/50 shadow-md shadow-sky-950/20' : 'bg-zinc-900/60 border-zinc-800'
                  }`}>
                    <label className="flex items-center gap-2 text-xs font-bold text-sky-300 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={enVacaciones}
                        onChange={(e) => {
                          const activado = e.target.checked;
                          setEnVacaciones(activado);
                          if (activado && !vacacionesDesde) {
                            setVacacionesDesde(new Date().toISOString().split('T')[0]);
                          }
                        }}
                        className="accent-sky-500 rounded"
                      />
                      <Palmtree className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Vacaciones Programadas Obligatorias</span>
                    </label>

                    {enVacaciones ? (
                      <div className="space-y-2.5 pt-2 border-t border-sky-800/40">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                              Fecha de Inicio:
                            </label>
                            <input
                              type="date"
                              value={vacacionesDesde}
                              onChange={(e) => setVacacionesDesde(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-sky-300 mb-1">
                              Día de Retorno (*):
                            </label>
                            <input
                              type="date"
                              required
                              value={vacacionesHasta}
                              onChange={(e) => setVacacionesHasta(e.target.value)}
                              className="w-full px-2.5 py-1.5 bg-zinc-950 border border-sky-500 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-sky-400"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                            Mensaje para los Vecinos:
                          </label>
                          <input
                            type="text"
                            value={mensajeVacaciones}
                            onChange={(e) => setMensajeVacaciones(e.target.value)}
                            placeholder="Ej: Nos tomamos unos días de descanso. ¡Pronto regresamos!"
                            className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-400"
                          />
                        </div>

                        {/* Cálculo de Días y Regla de 60 Días */}
                        {(() => {
                          const msIni = new Date(vacacionesDesde || new Date().toISOString().split('T')[0]).getTime();
                          const msFin = vacacionesHasta ? new Date(vacacionesHasta).getTime() : 0;
                          const diasTot = msFin > msIni ? Math.round((msFin - msIni) / (1000 * 60 * 60 * 24)) : 0;
                          const supera60 = diasTot > 60;

                          return (
                            <div className="space-y-1.5">
                              {vacacionesHasta && (
                                <div className="text-[11px] text-sky-300 font-medium flex items-center justify-between">
                                  <span>Duración programada:</span>
                                  <strong className="font-mono bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                                    {diasTot} días
                                  </strong>
                                </div>
                              )}

                              {supera60 ? (
                                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-600/50 text-[11px] text-rose-200">
                                  <strong>⚠️ Atención (+60 días):</strong> Al superar los 60 días en vacaciones, el sistema ocultará automáticamente el local del mapa y levantará un ticket en el Panel Admin para revisión de baja definitiva.
                                </div>
                              ) : (
                                <p className="text-[10.5px] text-sky-400/90 leading-tight">
                                  Llegada la fecha de Retorno ({vacacionesHasta ? new Date(vacacionesHasta).toLocaleDateString('es-AR') : 'indicada'}), el sistema volverá a visibilizar y abrir el local automáticamente.
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    ) : (
                      <p className="text-[11px] text-zinc-500 leading-tight">
                        Requiere indicar el día de Retorno. Llegada esa fecha, el local se visibiliza automáticamente sin intervención.
                      </p>
                    )}
                  </div>
                </div>

                {/* Farmacia de Turno */}
                {rubro.toLowerCase().includes('farmacia') && (
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40">
                    <label className="flex items-center gap-2 text-xs font-bold text-emerald-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={estaDeTurno}
                        onChange={(e) => setEstaDeTurno(e.target.checked)}
                        className="accent-emerald-500"
                      />
                      <Pill className="w-4 h-4 text-emerald-400" />
                      <span>Farmacia de Turno (24 Horas)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Botón Guardar / Solicitar Aprobación */}
              <div className="pt-4 border-t border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  disabled={enviandoMod}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-violet-950/60 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{enviandoMod ? 'Enviando...' : 'Enviar Modificaciones para Aprobación'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: CARGAR COMPROBANTES DE TRANSFERENCIA (MEMBRESÍAS)   */}
        {/* ============================================================== */}
        {pestana === 'comprobantes' && (
          <div className="space-y-6">
            {/* Comparativa de Categorías y Planes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Standar */}
              <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Plan Standar</span>
                  <span className="text-xs font-bold text-zinc-400">Gratuito</span>
                </div>
                <div className="text-2xl font-black text-white">$0</div>
                <p className="text-[11px] text-zinc-400">Catálogo de hasta 20 productos esenciales. Sin límite de tiempo.</p>
                <div className="text-[10px] text-zinc-500 border-t border-zinc-800/80 pt-2">
                  • 20 productos en catálogo<br />• 0 ofertas destacadas
                </div>
              </div>

              {/* Premium */}
              <div className="p-5 rounded-3xl bg-purple-950/30 border border-purple-500/40 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> Plan Premium
                  </span>
                  <span className="text-xs font-bold text-purple-400">Mensual</span>
                </div>
                <div className="text-2xl font-black text-white">$4.500 <span className="text-xs text-zinc-400 font-normal">/ mes</span></div>
                <p className="text-[11px] text-zinc-300">Catálogo ampliado y ofertas barriales activas por 30 días.</p>
                <div className="text-[10px] text-zinc-400 border-t border-purple-800/40 pt-2">
                  • 50 productos en catálogo<br />• 2 ofertas barriales por día
                </div>
              </div>

              {/* Gold */}
              <div className="p-5 rounded-3xl bg-amber-950/30 border border-amber-500/50 space-y-3 relative overflow-hidden shadow-lg shadow-amber-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" /> Plan Gold Destacado
                  </span>
                  <span className="text-xs font-bold text-amber-400">Mensual</span>
                </div>
                <div className="text-2xl font-black text-white">$7.900 <span className="text-xs text-zinc-400 font-normal">/ mes</span></div>
                <p className="text-[11px] text-zinc-300">Máxima visibilidad, catálogo de 100 productos y 5 ofertas diarias.</p>
                <div className="text-[10px] text-zinc-400 border-t border-amber-800/40 pt-2">
                  • 100 productos en catálogo<br />• 5 ofertas diarias destacadas<br />• Posicionamiento superior
                </div>
              </div>
            </div>

            {/* Datos Bancarios de la Plataforma */}
            <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-4 h-4" />
                <span>Datos Oficiales para Transferencias Bancarias</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Banco / Entidad:</span>
                  <span className="text-white font-semibold">Banco Santander / MP</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Alias CBU:</span>
                  <span className="text-cyan-300 font-mono font-bold tracking-wider">VECINOS.CERCA.PAGO</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">CVU / CBU:</span>
                  <span className="text-zinc-300 font-mono text-[11px]">0000003100098765432100</span>
                </div>
                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800/80">
                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">Titular:</span>
                  <span className="text-white font-semibold">Vecin@s Conectad@s</span>
                </div>
              </div>
            </div>

            {mensajeCompExito && (
              <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-3 text-xs text-emerald-200">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{mensajeCompExito}</span>
              </div>
            )}

            {/* Formulario de Carga de Comprobante */}
            <form onSubmit={handleSubmitComprobante} className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Cargar Comprobante de Transferencia para el Administrador</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Categoría a Abonar */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Categoría a Adquirir / Renovar *
                  </label>
                  <select
                    value={categoriaAbonada}
                    onChange={(e) => {
                      const cat = e.target.value as NivelComercio;
                      setCategoriaAbonada(cat);
                      setMonto(cat === 'gold' ? '7900' : '4500');
                    }}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="premium">Categoría Premium ($4.500 / mes)</option>
                    <option value="gold">Categoría Gold Destacada ($7.900 / mes)</option>
                  </select>
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Monto Abonado ($) *
                  </label>
                  <input
                    type="number"
                    required
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>

                {/* N° Operación */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    N° de Operación / Transacción
                  </label>
                  <input
                    type="text"
                    value={numeroOperacion}
                    onChange={(e) => setNumeroOperacion(e.target.value)}
                    placeholder="Ej: 1982736450"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Adjuntar archivo */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Adjuntar Comprobante (Foto / Captura de Pantalla) *
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  required
                  onChange={handleArchivoComprobante}
                  className="w-full text-xs text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-violet-600 file:text-white hover:file:bg-violet-500 file:cursor-pointer cursor-pointer"
                />
                {comprobanteUrl && (
                  <div className="mt-3 flex items-center gap-3 p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                    <img
                      src={comprobanteUrl}
                      alt="Vista previa del comprobante"
                      className="w-16 h-16 object-cover rounded-xl border border-zinc-700"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-white block truncate max-w-xs">{comprobanteNombre || 'Comprobante adjunto'}</span>
                      <span className="text-emerald-400 font-bold text-[11px]">✓ Listo para enviar</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Notas Adicionales (Opcional)
                </label>
                <input
                  type="text"
                  value={notasComprobante}
                  onChange={(e) => setNotasComprobante(e.target.value)}
                  placeholder="Ej: Pago de cuota de Octubre transferido desde cuenta de Laura"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={enviandoComprobante}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{enviandoComprobante ? 'Enviando...' : 'Enviar Comprobante al Administrador'}</span>
                </button>
              </div>
            </form>

            {/* Historial de Comprobantes del Comercio */}
            <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Historial de Comprobantes Enviados</span>
              </h3>

              {comprobantesHistorial.length === 0 ? (
                <p className="text-xs text-zinc-500 py-3">No has cargado comprobantes de pago aún.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {comprobantesHistorial.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                          Plan {comp.categoria_solicitada}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            comp.estado === 'aprobado'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : comp.estado === 'rechazado'
                              ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                              : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          }`}
                        >
                          {comp.estado === 'aprobado'
                            ? 'Acreditado (+1 Mes Extra)'
                            : comp.estado === 'rechazado'
                            ? 'Rechazado'
                            : 'Pendiente de Revisión'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-zinc-400 text-[11px]">
                        <span>${comp.monto?.toLocaleString('es-AR') || '—'}</span>
                        <span>{new Date(comp.fecha_envio).toLocaleDateString('es-AR')}</span>
                      </div>

                      {comp.comprobante_url && (
                        <button
                          type="button"
                          onClick={() => setImagenModalUrl(comp.comprobante_url)}
                          className="w-full mt-1 py-1.5 px-2 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-cyan-400 text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer border border-zinc-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Imagen del Comprobante</span>
                        </button>
                      )}

                      {comp.motivo_rechazo && (
                        <p className="text-[10.5px] text-rose-300 italic pt-1 border-t border-zinc-800">
                          Motivo rechazo: {comp.motivo_rechazo}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: DEBATES E INCONVENIENTES CON CLIENTES               */}
        {/* ============================================================== */}
        {pestana === 'debates' && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-start gap-3 text-xs text-zinc-300">
              <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Registro Privado y Confidencial</span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Los inconvenientes reportados por usuarios registrados solo son visibles para tu comercio y para el administrador de la red para garantizar una mediación transparente y una rápida resolución.
                </p>
              </div>
            </div>

            {debates.length === 0 ? (
              <div className="p-12 text-center bg-zinc-950 border border-zinc-800 rounded-3xl space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">¡No tienes inconvenientes reportados!</h4>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Excelente atención. Tus clientes registrados no han abierto reclamos ni debates para este comercio.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {debates.map((debate) => (
                  <div
                    key={debate.id}
                    className="p-5 sm:p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                      <div>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {debate.motivo}
                        </span>
                        <h4 className="text-sm font-bold text-white mt-1">
                          Reportado por: <span className="text-cyan-300">{debate.usuario_nombre}</span> ({debate.usuario_email})
                        </h4>
                        {debate.usuario_telefono && (
                          <span className="text-[11px] text-zinc-400">Tel: {debate.usuario_telefono}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            debate.estado === 'resuelto'
                              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                              : debate.estado === 'en_revision'
                              ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                              : 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          }`}
                        >
                          {debate.estado === 'resuelto'
                            ? 'Resuelto'
                            : debate.estado === 'en_revision'
                            ? 'En Revisión / Respondido'
                            : 'Abierto'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(debate.fecha_creacion).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </div>

                    {/* Descripción del cliente */}
                    <div className="p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800/80 text-xs text-zinc-200">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider mb-1">
                        Mensaje del Cliente:
                      </span>
                      <p className="leading-relaxed whitespace-pre-wrap">{debate.descripcion}</p>
                    </div>

                    {/* Respuesta previa del comercio si existe */}
                    {debate.respuesta_comercio && (
                      <div className="p-3.5 bg-violet-950/30 rounded-2xl border border-violet-500/40 text-xs text-violet-200">
                        <span className="text-[10px] text-violet-400 block uppercase font-bold tracking-wider mb-1">
                          Tu Respuesta ({new Date(debate.fecha_respuesta || '').toLocaleDateString('es-AR')}):
                        </span>
                        <p className="leading-relaxed whitespace-pre-wrap">{debate.respuesta_comercio}</p>
                      </div>
                    )}

                    {/* Responder al debate */}
                    {debate.estado !== 'resuelto' && (
                      <div className="space-y-2 pt-2 border-t border-zinc-800/80">
                        <label className="block text-xs font-semibold text-zinc-300">
                          Escribir respuesta al cliente y al administrador:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={respuestaTexto[debate.id] || ''}
                            onChange={(e) =>
                              setRespuestaTexto({ ...respuestaTexto, [debate.id]: e.target.value })
                            }
                            placeholder="Explica la solución ofrecida o aclara el inconveniente..."
                            className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                          <button
                            type="button"
                            disabled={respondiendoDebateId === debate.id}
                            onClick={() => handleResponderDebate(debate.id)}
                            className="py-2 px-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Responder</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleResolverDebate(debate.id)}
                            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            title="Marcar como acordado y resuelto"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Solucionado</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal para Visualizar Comprobante en Grande */}
      {imagenModalUrl && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
          onClick={() => setImagenModalUrl(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 p-2">
            <button
              type="button"
              onClick={() => setImagenModalUrl(null)}
              className="absolute top-4 right-4 p-2 bg-zinc-900/90 text-white rounded-full hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={imagenModalUrl}
              alt="Comprobante de Transferencia Ampliado"
              className="max-h-[80vh] w-auto mx-auto rounded-2xl object-contain"
            />
          </div>
        </div>
      )}
    </main>
  );
}
