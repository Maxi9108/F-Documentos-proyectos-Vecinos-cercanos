'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Comercio,
  NivelComercio,
  NIVELES_CONFIG,
  ComprobanteTransferencia,
  DebateInconveniente,
  ModificacionComercio,
  HorariosConfig,
  Producto,
  CalificacionComercio,
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
  guardarComercio,
  getCalificacionesComercio,
  reabrirUrgenciaComercio,
  eliminarComercio,
} from '@/lib/supabase';
import { hashPassword, verifyPassword } from '@/lib/crypto';
import { getCategorias } from '@/lib/categorias';
import { registrarEvento, getMetricasComercio } from '@/lib/analytics';
import { formatearHorariosLegibles, HORARIOS_DEFECTO } from '@/lib/horarios';
import { useUser } from '@/context/user-context';
import ContadorMembresia from '@/components/ContadorMembresia';
import NeoFaroLogo from '@/components/NeoFaroLogo';
import ModalCambiarPassword from '@/components/ModalCambiarPassword';
import SelectorHorariosAvanzados from '@/components/SelectorHorariosAvanzados';
import InputWhatsAppConPais from '@/components/InputWhatsAppConPais';
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
  EyeOff,
  X,
  Sparkles,
  Info,
  Star,
  Sun,
  Moon,
  Bike,
  Palmtree,
  Pill,
  AlertCircle,
  HelpCircle,
  Lock,
  Unlock,
  AlertOctagon,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  Trash2,
  Edit3,
  Key,
  LogOut,
  Package,
  ShoppingBag,
  ArrowUpRight,
  Tag,
  RefreshCw,
  Globe,
  Mail,
  ChevronRight,
  KeyRound,
  Search,
} from 'lucide-react';
import SelectorZonaEnvioWrapper from '@/components/SelectorZonaEnvioWrapper';

export default function MiComercioPage() {
  const { usuario, abrirModalSoporte } = useUser();
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [comercioSeleccionadoId, setComercioSeleccionadoId] = useState<string>('');
  const [cargando, setCargando] = useState(true);

  // Autenticación exclusiva para comercios
  const [comercioAutenticadoId, setComercioAutenticadoId] = useState<string | null>(null);
  const [loginComercioId, setLoginComercioId] = useState<string>('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [mostrarLoginPass, setMostrarLoginPass] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [modalElegirSucursalAbierto, setModalElegirSucursalAbierto] = useState(false);
  const [avisoCambioSucursal, setAvisoCambioSucursal] = useState<string | null>(null);

  // Modal de Baja Definitiva del Comercio por el propio comerciante
  const [modalBajaComercioAbierto, setModalBajaComercioAbierto] = useState(false);
  const [passBajaComercio, setPassBajaComercio] = useState('');
  const [motivoBajaComercio, setMotivoBajaComercio] = useState('Cierre de actividad / No deseo continuar en la plataforma');
  const [confirmarBajaCheckbox, setConfirmarBajaCheckbox] = useState(false);
  const [procesandoBajaComercio, setProcesandoBajaComercio] = useState(false);
  const [errorBajaComercio, setErrorBajaComercio] = useState<string | null>(null);

  // Método de identificación: 'email' (con mail registrado) | 'buscar' (por nombre y dirección)

  const [metodoIdentificacionLogin, setMetodoIdentificacionLogin] = useState<'email' | 'buscar'>('email');
  const [filtroBusquedaLogin, setFiltroBusquedaLogin] = useState('');

  // Modo de acceso no autenticado: 'ingresar' (login) | 'cargar' (alta)
  const [tabModoAcceso, setTabModoAcceso] = useState<'ingresar' | 'cargar'>('ingresar');
  const [requiereDefinirClave, setRequiereDefinirClave] = useState(false);
  const [nuevaClaveComercio, setNuevaClaveComercio] = useState('');
  const [confirmarNuevaClaveComercio, setConfirmarNuevaClaveComercio] = useState('');
  const [mostrarNuevaClave, setMostrarNuevaClave] = useState(false);

  // Pestañas del portal (5 pestañas)
  const [pestana, setPestana] = useState<'metricas' | 'modificar' | 'catalogo' | 'comprobantes' | 'debates'>('metricas');

  // Categorías disponibles para rubros
  const [categoriasRubro, setCategoriasRubro] = useState<string[]>([]);

  // Estados de Modificación de Comercio
  const [nombre, setNombre] = useState('');
  const [rubro, setRubro] = useState('');
  const [direccion, setDireccion] = useState('');
  const [localidad, setLocalidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  const [otrosLinks, setOtrosLinks] = useState('');
  const [tipoAtencion, setTipoAtencion] = useState<'local_fisico' | 'solo_envio' | 'ambos'>('local_fisico');
  const [radioKm, setRadioKm] = useState(3);
  const [coberturaPoligono, setCoberturaPoligono] = useState<[number, number][]>([]);
  const [zonaEnvioConfirmada, setZonaEnvioConfirmada] = useState(true);
  const [zonaEnvioDescripcion, setZonaEnvioDescripcion] = useState('');
  const [enVacaciones, setEnVacaciones] = useState(false);
  const [vacacionesDesde, setVacacionesDesde] = useState('');
  const [vacacionesHasta, setVacacionesHasta] = useState('');
  const [mensajeVacaciones, setMensajeVacaciones] = useState('');
  const [cerradoMomentaneo, setCerradoMomentaneo] = useState(false);
  const [motivoCierreMomentaneo, setMotivoCierreMomentaneo] = useState('');
  const [modalidadVacaciones, setModalidadVacaciones] = useState<'descanso_total' | 'mostrar_con_aviso'>('mostrar_con_aviso');
  const [estaDeTurno, setEstaDeTurno] = useState(false);

  // Horarios avanzados con soporte para trasnoche y día por día
  const [horariosConfig, setHorariosConfig] = useState<HorariosConfig>(HORARIOS_DEFECTO);

  // Solicitudes de modificación previas
  const [solicitudesMod, setSolicitudesMod] = useState<ModificacionComercio[]>([]);
  const [enviandoMod, setEnviandoMod] = useState(false);
  const [mensajeModExito, setMensajeModExito] = useState<string | null>(null);

  // Estados de Catálogo de Productos (con ventana de 30 días)
  const [productos, setProductos] = useState<Producto[]>([]);
  const [guardandoCatalogo, setGuardandoCatalogo] = useState(false);
  const [mensajeCatalogoExito, setMensajeCatalogoExito] = useState<string | null>(null);
  const [modalProductoAbierto, setModalProductoAbierto] = useState(false);
  const [productoEditandoId, setProductoEditandoId] = useState<string | null>(null);
  const [prodNombre, setProdNombre] = useState('');
  const [prodPrecio, setProdPrecio] = useState('');
  const [prodDescripcion, setProdDescripcion] = useState('');
  const [prodCategoria, setProdCategoria] = useState('');
  const [prodEsOferta, setProdEsOferta] = useState(false);
  const [prodPrecioOferta, setProdPrecioOferta] = useState('');
  const [prodAgotado, setProdAgotado] = useState(false);
  const [prodHoraVencimiento, setProdHoraVencimiento] = useState('');
  const [prodUnidadesLimitadas, setProdUnidadesLimitadas] = useState('');

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

  // Estados de Calificaciones Vecinales Privadas (Solo visible para Comercio y Admin)
  const [calificacionesComercio, setCalificacionesComercio] = useState<CalificacionComercio[]>([]);
  const [levantandoUrgencia, setLevantandoUrgencia] = useState(false);

  // Carga inicial de datos
  useEffect(() => {
    async function inicializar() {
      setCargando(true);
      const lista = await getComercios();
      setComercios(lista);

      const cats = getCategorias().map((c) => c.nombre);
      setCategoriasRubro(cats);

      // Verificar si hay sesión previa guardada en sessionStorage
      const sesionGuardada = typeof window !== 'undefined' ? sessionStorage.getItem('vecinos_comercio_auth_id') : null;

      if (lista.length > 0) {
        setLoginComercioId(lista[0].id);
        const inicial = lista.find((c) => c.id === sesionGuardada) || lista[0];
        if (sesionGuardada && lista.some((c) => c.id === sesionGuardada)) {
          setComercioAutenticadoId(sesionGuardada);
          setComercioSeleccionadoId(sesionGuardada);
          cargarDatosFormulario(inicial);
        } else {
          if (sesionGuardada && typeof window !== 'undefined') {
            sessionStorage.removeItem('vecinos_comercio_auth_id');
          }
          setComercioSeleccionadoId(inicial.id);
          cargarDatosFormulario(inicial);
        }
      }
      setCargando(false);
    }
    inicializar();
  }, []);

  const comercioActual = comercios.find((c) => c.id === comercioSeleccionadoId);

  // Locales que coinciden con el email ingresado en el login
  const comerciosConMismoMail = useMemo(() => {
    const mailLimpio = loginEmail.trim().toLowerCase();
    if (!mailLimpio) return [];
    return comercios.filter(
      (c) =>
        (c.email_comercio && c.email_comercio.trim().toLowerCase() === mailLimpio) ||
        (c.email && c.email.trim().toLowerCase() === mailLimpio)
    );
  }, [loginEmail, comercios]);

  // Comercio identificado en el formulario de login (por mail registrado o selección con dirección)
  const comercioIdentificado = useMemo(() => {
    const mailLimpio = loginEmail.trim().toLowerCase();
    if (metodoIdentificacionLogin === 'email' && mailLimpio) {
      if (loginComercioId) {
        const match = comercios.find((c) => c.id === loginComercioId);
        if (
          match &&
          ((match.email_comercio && match.email_comercio.trim().toLowerCase() === mailLimpio) ||
           (match.email && match.email.trim().toLowerCase() === mailLimpio))
        ) {
          return match;
        }
      }
      return (
        comercios.find(
          (c) =>
            (c.email_comercio && c.email_comercio.trim().toLowerCase() === mailLimpio) ||
            (c.email && c.email.trim().toLowerCase() === mailLimpio)
        ) || null
      );
    }
    return comercios.find((c) => c.id === loginComercioId) || null;
  }, [loginEmail, loginComercioId, comercios, metodoIdentificacionLogin]);

  // Locales / Sucursales del comercio autenticado actual (para alternar sucursales con el mismo mail, teléfono o nombre)
  const misSucursales = useMemo(() => {
    if (!comercioActual && !comercioAutenticadoId) return [];
    const base = comercioActual || comercios.find((c) => c.id === comercioAutenticadoId);
    if (!base) return [];

    const mail = (base.email_comercio || base.email || loginEmail || '').trim().toLowerCase();
    const tel = (base.whatsapp || base.telefono || '').replace(/\D/g, '');
    const nombreLimpio = base.nombre.trim().toLowerCase();

    return comercios.filter((c) => {
      if (c.id === base.id) return true;
      const cMail = (c.email_comercio || c.email || '').trim().toLowerCase();
      if (mail && cMail && mail === cMail) return true;
      const cTel = (c.whatsapp || c.telefono || '').replace(/\D/g, '');
      if (tel && cTel && tel.length >= 8 && tel === cTel) return true;
      if (nombreLimpio && c.nombre.trim().toLowerCase() === nombreLimpio) return true;
      return false;
    });
  }, [comercioActual, comercioAutenticadoId, comercios, loginEmail]);



  // Lista de comercios filtrados con dirección visible para evitar confusión por nombres repetidos
  const comerciosFiltradosLogin = useMemo(() => {
    const q = filtroBusquedaLogin.trim().toLowerCase();
    if (!q) return comercios;
    return comercios.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        c.rubro.toLowerCase().includes(q) ||
        c.direccion.toLowerCase().includes(q) ||
        (c.localidad && c.localidad.toLowerCase().includes(q))
    );
  }, [comercios, filtroBusquedaLogin]);

  // Cargar datos del comercio en los campos del formulario
  const cargarDatosFormulario = (comercio: Comercio) => {
    setNombre(comercio.nombre || '');
    setRubro(comercio.rubro || 'Almacén');
    setDireccion(comercio.direccion || '');
    setLocalidad(comercio.localidad || '');
    setTelefono(comercio.telefono || '');
    setEmail(comercio.email || comercio.email_comercio || '');
    setWhatsapp(comercio.whatsapp || comercio.telefono || '');
    setDescripcion(comercio.descripcion || '');
    setSitioWeb(comercio.sitio_web || '');
    setInstagram(comercio.instagram || '');
    setTiktok(comercio.tiktok || '');
    setFacebook(comercio.facebook || '');
    setOtrosLinks(comercio.otros_links || '');
    setTipoAtencion(comercio.tipo_atencion || 'local_fisico');
    setRadioKm(comercio.radio_entrega_metros ? comercio.radio_entrega_metros / 1000 : 3);
    setCoberturaPoligono(comercio.cobertura_poligono || []);
    setZonaEnvioConfirmada(true);
    setZonaEnvioDescripcion(comercio.zona_envio_descripcion || '');
    setEnVacaciones(Boolean(comercio.en_vacaciones));
    setVacacionesDesde(comercio.vacaciones_desde || '');
    setVacacionesHasta(comercio.vacaciones_hasta || '');
    setMensajeVacaciones(comercio.mensaje_vacaciones || '');
    setModalidadVacaciones(comercio.modalidad_vacaciones || 'mostrar_con_aviso');
    setCerradoMomentaneo(Boolean(comercio.cerrado_momentaneo));
    setMotivoCierreMomentaneo(comercio.motivo_cierre_momentaneo || '');
    setEstaDeTurno(Boolean(comercio.esta_de_turno));

    // Cargar o inicializar horarios avanzados
    if (comercio.horarios_config) {
      setHorariosConfig(comercio.horarios_config);
    } else {
      setHorariosConfig(HORARIOS_DEFECTO);
    }

    // Cargar productos del catálogo
    setProductos(comercio.productos || []);

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

      // 4. Calificaciones vecinales (Privadas)
      const califs = await getCalificacionesComercio(comercioSeleccionadoId);
      setCalificacionesComercio(califs);
    }

    cargarRelacionados();
  }, [comercioSeleccionadoId]);

  // Manejar login de comercio seguro (sin backdoors y validado en servidor / local)
  const handleLoginComercio = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const mailLimpio = loginEmail.trim().toLowerCase();
    let com: Comercio | null = null;

    if (metodoIdentificacionLogin === 'email') {
      if (loginComercioId) {
        const candidato = comercios.find((c) => c.id === loginComercioId);
        if (
          candidato &&
          ((candidato.email_comercio && candidato.email_comercio.trim().toLowerCase() === mailLimpio) ||
           (candidato.email && candidato.email.trim().toLowerCase() === mailLimpio))
        ) {
          com = candidato;
        }
      }
      if (!com && mailLimpio) {
        com = comercios.find(
          (c) =>
            (c.email_comercio && c.email_comercio.trim().toLowerCase() === mailLimpio) ||
            (c.email && c.email.trim().toLowerCase() === mailLimpio)
        ) || null;
      }
    } else {
      com = comercios.find((c) => c.id === loginComercioId) || null;
    }

    if (!com && !mailLimpio && !loginComercioId) {
      setLoginError('Por favor ingresa el email registrado de tu comercio o selecciona tu local.');
      return;
    }

    try {
      const res = await fetch('/api/auth-comercio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comercioId: com?.id || loginComercioId || undefined,
          email: mailLimpio || com?.email_comercio || com?.email || undefined,
          password: loginPassword,
          clientStoredHash: com?.password_comercio || undefined,
          comercioFallback: com || undefined,
        }),
      });

      const data = await res.json();

      if (data.ok && data.comercio) {
        setComercioAutenticadoId(data.comercio.id);
        setComercioSeleccionadoId(data.comercio.id);
        setComercios((prev) => {
          const index = prev.findIndex((c) => c.id === data.comercio.id);
          if (index >= 0) {
            const copia = [...prev];
            copia[index] = { ...copia[index], ...data.comercio };
            return copia;
          }
          return [data.comercio, ...prev];
        });
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('vecinos_comercio_auth_id', data.comercio.id);
        }
        cargarDatosFormulario(data.comercio);
        setLoginPassword('');
        setLoginError(null);
        setRequiereDefinirClave(false);


        // Si el comerciante tiene múltiples sucursales, abrir modal para que pueda elegir de la lista con cuál trabajar
        const targetMail = (data.comercio.email_comercio || data.comercio.email || mailLimpio || '').trim().toLowerCase();
        const targetTel = (data.comercio.whatsapp || data.comercio.telefono || '').replace(/\D/g, '');
        const sucursalesDetectadas = comercios.filter((c) => {
          if (c.id === data.comercio.id) return true;
          const cMail = (c.email_comercio || c.email || '').trim().toLowerCase();
          if (targetMail && cMail && targetMail === cMail) return true;
          const cTel = (c.whatsapp || c.telefono || '').replace(/\D/g, '');
          if (targetTel && cTel && targetTel.length >= 8 && targetTel === cTel) return true;
          return false;
        });
        if (sucursalesDetectadas.length > 1) {
          setModalElegirSucursalAbierto(true);
        }
        return;
      }



      // Si el comercio no tiene contraseña configurada todavía, solicitar definirla de inmediato
      if (data.requiereDefinirPassword || (com && !com.password_comercio)) {
        if (com) {
          setLoginComercioId(com.id);
        }
        setRequiereDefinirClave(true);
        setLoginError(null);
        return;
      }

      // Fallback criptográfico SHA-256 local
      if (com?.password_comercio) {
        const esValida = await verifyPassword(loginPassword, com.password_comercio);
        if (esValida) {
          setComercioAutenticadoId(com.id);
          setComercioSeleccionadoId(com.id);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('vecinos_comercio_auth_id', com.id);
          }
          cargarDatosFormulario(com);
          setLoginPassword('');
          setLoginError(null);
          setRequiereDefinirClave(false);
          return;
        }
      }

      setLoginError(data.error || 'Contraseña incorrecta. Por favor ingresa la contraseña que pusiste al registrar tu comercio.');
    } catch (err) {
      // Fallback offline
      if (com?.password_comercio) {
        const esValida = await verifyPassword(loginPassword, com.password_comercio);
        if (esValida) {
          setComercioAutenticadoId(com.id);
          setComercioSeleccionadoId(com.id);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('vecinos_comercio_auth_id', com.id);
          }
          cargarDatosFormulario(com);
          setLoginPassword('');
          setLoginError(null);
          return;
        }
      }
      setLoginError('Error de conexión o contraseña incorrecta.');
    }
  };

  // Manejar definición de contraseña inicial para comercios que aún no tenían clave
  const handleDefinirClaveInicial = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (nuevaClaveComercio.length < 4) {
      setLoginError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }
    if (nuevaClaveComercio !== confirmarNuevaClaveComercio) {
      setLoginError('Las contraseñas no coinciden. Por favor repítela con exactitud.');
      return;
    }

    const mailLimpio = loginEmail.trim().toLowerCase();
    const com = comercios.find(
      (c) =>
        c.id === loginComercioId ||
        (mailLimpio &&
          ((c.email_comercio && c.email_comercio.trim().toLowerCase() === mailLimpio) ||
           (c.email && c.email.trim().toLowerCase() === mailLimpio)))
    );
    if (!com) {
      setLoginError('No se encontró el comercio seleccionado.');
      return;
    }

    const hashed = await hashPassword(nuevaClaveComercio);
    const comActualizado: Comercio = {
      ...com,
      password_comercio: hashed,
    };

    await guardarComercio(comActualizado);
    setComercios((prev) => prev.map((c) => (c.id === com.id ? comActualizado : c)));
    setComercioAutenticadoId(com.id);
    setComercioSeleccionadoId(com.id);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vecinos_comercio_auth_id', com.id);
    }
    cargarDatosFormulario(comActualizado);
    setRequiereDefinirClave(false);
    setNuevaClaveComercio('');
    setConfirmarNuevaClaveComercio('');
    setLoginError(null);
  };

  // Cerrar sesión del comercio
  const handleCerrarSesion = () => {
    setComercioAutenticadoId(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('vecinos_comercio_auth_id');
    }
  };

  // Dar de baja el comercio por el propio comerciante
  const handleDarDeBajaComercio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercioActual) return;
    setErrorBajaComercio(null);

    if (!confirmarBajaCheckbox) {
      setErrorBajaComercio('Debes marcar la casilla confirmando que comprendes el carácter permanente e irreversible de esta acción.');
      return;
    }

    setProcesandoBajaComercio(true);
    try {
      // Si el comercio tiene contraseña configurada, verificarla antes de proceder
      if (comercioActual.password_comercio && passBajaComercio) {
        const passValida = await verifyPassword(passBajaComercio, comercioActual.password_comercio);
        if (!passValida && passBajaComercio !== comercioActual.password_comercio) {
          setErrorBajaComercio('La contraseña ingresada es incorrecta.');
          setProcesandoBajaComercio(false);
          return;
        }
      }

      await eliminarComercio(comercioActual.id);
      registrarEvento('visita_comercio', comercioActual.id, comercioActual.nombre, {
        accion: 'baja_voluntaria_comerciante',
        motivo: motivoBajaComercio,
      });

      // Limpiar estados locales
      setModalBajaComercioAbierto(false);
      setComercioAutenticadoId(null);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('vecinos_comercio_auth_id');
      }

      alert(`"${comercioActual.nombre}" ha sido dado de baja permanentemente del sistema.`);
      window.location.href = '/';
    } catch (err: any) {
      setErrorBajaComercio(err?.message || 'Error al procesar la baja del comercio');
    } finally {
      setProcesandoBajaComercio(false);
    }
  };

  // Manejar cambio de comercio en el selector (para admin o si tiene varios)
  const handleCambiarComercio = (id: string) => {
    setComercioSeleccionadoId(id);
    setComercioAutenticadoId(id);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('vecinos_comercio_auth_id', id);
    }
    const encontrado = comercios.find((c) => c.id === id);
    if (encontrado) {
      cargarDatosFormulario(encontrado);
      setMensajeModExito(null);
      setMensajeCompExito(null);
      setMensajeCatalogoExito(null);
      setAvisoCambioSucursal(`Ahora estás gestionando: ${encontrado.nombre} — 📍 ${encontrado.direccion}`);
      setTimeout(() => setAvisoCambioSucursal(null), 4000);
    }
  };


  // Regla de modificación de catálogo (1 vez por mes / 30 días)
  const ultimaModCatalogo = comercioActual?.fecha_ultima_modificacion_catalogo
    ? new Date(comercioActual.fecha_ultima_modificacion_catalogo).getTime()
    : 0;
  const diasDesdeUltimaModCatalogo = ultimaModCatalogo
    ? Math.floor((Date.now() - ultimaModCatalogo) / (1000 * 60 * 60 * 24))
    : 999;
  const puedeModificarCatalogo = diasDesdeUltimaModCatalogo >= 30;
  const diasRestantesCatalogo = Math.max(0, 30 - diasDesdeUltimaModCatalogo);
  const fechaProximaHabilitacionCatalogo = ultimaModCatalogo
    ? new Date(ultimaModCatalogo + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  // Límites según el nivel del comercio
  const nivelActual = comercioActual?.nivel || 'standar';
  const limiteProductos = NIVELES_CONFIG[nivelActual]?.limiteProductos || 20;

  // Abrir modal de nuevo producto o edición
  const handleAbrirModalProducto = (producto?: Producto) => {
    if (!puedeModificarCatalogo) {
      alert(`El catálogo está bloqueado. Podrás volver a actualizar productos y precios en ${diasRestantesCatalogo} días.`);
      return;
    }
    if (producto) {
      setProductoEditandoId(producto.id);
      setProdNombre(producto.nombre);
      setProdPrecio(String(producto.precio));
      setProdDescripcion(producto.descripcion || '');
      setProdCategoria(producto.categoria || '');
      setProdEsOferta(Boolean(producto.es_oferta));
      setProdPrecioOferta(producto.precio_oferta ? String(producto.precio_oferta) : '');
      setProdAgotado(Boolean(producto.agotado));
      setProdHoraVencimiento(producto.hora_vencimiento_oferta || '');
      setProdUnidadesLimitadas(producto.unidades_limitadas ? String(producto.unidades_limitadas) : '');
    } else {
      if (productos.length >= limiteProductos) {
        alert(`Has alcanzado el límite máximo de ${limiteProductos} productos para tu plan ${nivelActual.toUpperCase()}. Mejora tu plan a Premium o Gold para ampliar el catálogo.`);
        return;
      }
      setProductoEditandoId(null);
      setProdNombre('');
      setProdPrecio('');
      setProdDescripcion('');
      setProdCategoria(comercioActual?.rubro || '');
      setProdEsOferta(false);
      setProdPrecioOferta('');
      setProdAgotado(false);
      setProdHoraVencimiento('');
      setProdUnidadesLimitadas('');
    }
    setModalProductoAbierto(true);
  };

  // Guardar producto en la lista local con validación de ofertas semanales (5 para Premium, 20 para Gold)
  const handleGuardarProductoItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodNombre.trim() || !prodPrecio) return;

    const numPrecio = Number(prodPrecio);
    const numOferta = prodEsOferta && prodPrecioOferta ? Number(prodPrecioOferta) : undefined;

    // Validación de límites de ofertas por plan
    if (prodEsOferta) {
      if (nivelActual === 'standar') {
        alert('El Plan Standar no incluye ofertas destacadas. Actualiza a Premium (5 ofertas semanales) o Gold (20 ofertas semanales).');
        return;
      }
      const maxOfertas = NIVELES_CONFIG[nivelActual]?.limiteOfertasSemanales || 0;
      const otrasOfertas = productos.filter((p) => p.es_oferta && p.id !== productoEditandoId);
      if (otrasOfertas.length >= maxOfertas) {
        alert(`Has alcanzado el límite máximo de ${maxOfertas} ofertas semanales para el Plan ${nivelActual.toUpperCase()}.\n\nCada oferta dura 7 días. Pasados los 7 días se borran automáticamente dejando lugar libre para nuevas ofertas.`);
        return;
      }
    }

    const fechaOfertaActual = prodEsOferta ? new Date().toISOString() : undefined;
    // Vigencia semanal: 7 días continuos desde el momento de alta o la fecha especificada
    const vencimientoSemanal7Dias = prodEsOferta
      ? (prodHoraVencimiento || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      : undefined;

    if (productoEditandoId) {
      setProductos((prev) =>
        prev.map((p) =>
          p.id === productoEditandoId
            ? {
                ...p,
                nombre: prodNombre.trim(),
                precio: numPrecio,
                descripcion: prodDescripcion.trim() || undefined,
                categoria: prodCategoria.trim() || undefined,
                es_oferta: prodEsOferta,
                precio_oferta: numOferta,
                fecha_oferta: prodEsOferta ? (p.fecha_oferta || fechaOfertaActual) : undefined,
                hora_vencimiento_oferta: vencimientoSemanal7Dias,
                duracion_horas_oferta: prodEsOferta ? 168 : undefined,
                agotado: prodAgotado,
                fecha_agotado: prodAgotado ? (p.fecha_agotado || new Date().toISOString()) : undefined,
                unidades_limitadas: prodEsOferta && prodUnidadesLimitadas ? Number(prodUnidadesLimitadas) : undefined,
              }
            : p
        )
      );
    } else {
      const nuevo: Producto = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        comercio_id: comercioActual?.id || '',
        nombre: prodNombre.trim(),
        precio: numPrecio,
        descripcion: prodDescripcion.trim() || undefined,
        categoria: prodCategoria.trim() || undefined,
        es_oferta: prodEsOferta,
        precio_oferta: numOferta,
        fecha_oferta: fechaOfertaActual,
        hora_vencimiento_oferta: vencimientoSemanal7Dias,
        duracion_horas_oferta: prodEsOferta ? 168 : undefined,
        agotado: prodAgotado,
        fecha_agotado: prodAgotado ? new Date().toISOString() : undefined,
        unidades_limitadas: prodEsOferta && prodUnidadesLimitadas ? Number(prodUnidadesLimitadas) : undefined,
      };
      setProductos((prev) => [...prev, nuevo]);
    }

    setModalProductoAbierto(false);
  };

  // Eliminar producto de la lista
  const handleEliminarProducto = (id: string) => {
    if (!puedeModificarCatalogo) {
      alert(`El catálogo está bloqueado para modificaciones durante 30 días.`);
      return;
    }
    if (confirm('¿Deseas eliminar este producto del catálogo?')) {
      setProductos((prev) => prev.filter((p) => p.id !== id));
    }
  };

  // Guardar catálogo definitivo en base de datos (fija la fecha de 30 días)
  const handlePublicarCatalogoMensual = async () => {
    if (!comercioActual) return;
    if (!puedeModificarCatalogo) {
      alert(`Tu catálogo se encuentra dentro del ciclo protegido de 30 días. Próxima actualización disponible en ${diasRestantesCatalogo} días.`);
      return;
    }

    if (
      !confirm(
        '¿Deseas publicar y fijar este catálogo por los próximos 30 días? La política comunitaria permite 1 actualización mensual para mantener estabilidad de precios ante los vecinos.'
      )
    ) {
      return;
    }

    setGuardandoCatalogo(true);
    setMensajeCatalogoExito(null);

    const ahoraIso = new Date().toISOString();
    const comercioActualizado: Comercio = {
      ...comercioActual,
      productos,
      tiene_catalogo: productos.length > 0,
      fecha_ultima_modificacion_catalogo: ahoraIso,
    };

    const res = await guardarComercio(comercioActualizado);
    setGuardandoCatalogo(false);

    if (res.success) {
      setComercios((prev) => prev.map((c) => (c.id === comercioActual.id ? comercioActualizado : c)));
      cargarDatosFormulario(comercioActualizado);
      registrarEvento('catalogo_actualizado_mensual', comercioActual.id, comercioActual.nombre, {
        total_productos: productos.length,
      });
      setMensajeCatalogoExito(
        '¡Catálogo mensual actualizado y publicado con éxito! Ha quedado fijado por los próximos 30 días.'
      );
    } else {
      alert('Ocurrió un inconveniente al guardar el catálogo. Por favor reintenta.');
    }
  };

  // Enviar Modificaciones para Aprobación del Administrador
  const handleSubmitModificaciones = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comercioActual) return;

    if (!telefono.trim()) {
      alert('El teléfono de contacto es obligatorio.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      alert('El correo electrónico es obligatorio y debe tener un formato válido.');
      return;
    }

    if (tipoAtencion !== 'local_fisico') {
      if (coberturaPoligono.length > 0 && coberturaPoligono.length < 3) {
        alert('El polígono de zona de reparto debe tener al menos 3 puntos para cerrar el área. Agrega más puntos y pulsa "Cerrar Zona", o selecciona "Radio en Kilómetros".');
        setEnviandoMod(false);
        return;
      }
      if (radioKm <= 0 && (!coberturaPoligono || coberturaPoligono.length < 3)) {
        alert('Por favor define un radio de entrega en kilómetros válido (mayor a 0).');
        setEnviandoMod(false);
        return;
      }
    }

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

    // Resumen legible del horario para compatibilidad
    const horarioResumen = formatearHorariosLegibles(horariosConfig);

    const cambios: Partial<Comercio> = {
      nombre: nombre.trim(),
      rubro: rubro.trim(),
      direccion: direccion.trim(),
      localidad: localidad.trim() || undefined,
      telefono: telefono.trim(),
      email: email.trim().toLowerCase(),
      email_comercio: email.trim().toLowerCase(),
      sitio_web: sitioWeb.trim() || undefined,
      instagram: instagram.trim() || undefined,
      tiktok: tiktok.trim() || undefined,
      facebook: facebook.trim() || undefined,
      otros_links: otrosLinks.trim() || undefined,
      whatsapp: whatsapp.trim() || telefono.trim(),
      descripcion: descripcion.trim(),
      horario: horarioResumen,
      horarios_config: horariosConfig,
      tipo_atencion: tipoAtencion,
      radio_entrega_metros: tipoAtencion !== 'local_fisico' ? Math.round(radioKm * 1000) : 0,
      cobertura_poligono: tipoAtencion !== 'local_fisico' && coberturaPoligono.length >= 3 ? coberturaPoligono : undefined,
      zona_envio_descripcion: tipoAtencion !== 'local_fisico' ? zonaEnvioDescripcion.trim() : '',
      en_vacaciones: enVacaciones,
      modalidad_vacaciones: enVacaciones ? modalidadVacaciones : undefined,
      dias_vacaciones_acumulados: enVacaciones ? diasTotalesVac : 0,
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
      contador_urgencias_mes: cerradoMomentaneo
        ? (comercioActual.contador_urgencias_mes || 0) + (comercioActual.cerrado_momentaneo ? 0 : 1)
        : comercioActual.contador_urgencias_mes,
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

    setEnviandoMod(true);
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

  // Acción directa para levantar el cierre de urgencia y reabrir de inmediato
  const handleLevantarUrgencia = async () => {
    if (!comercioActual) return;
    if (confirm('¿Confirmas que deseas levantar la urgencia y reabrir tu local de inmediato? Tu comercio volverá a figurar abierto en el mapa.')) {
      setLevantandoUrgencia(true);
      await reabrirUrgenciaComercio(comercioActual.id);
      setCerradoMomentaneo(false);
      setMotivoCierreMomentaneo('');
      const c = await getComercios();
      setComercios(c);
      const act = c.find((x) => x.id === comercioActual.id);
      if (act) cargarDatosFormulario(act);
      setLevantandoUrgencia(false);
    }
  };

  const solicitudPendiente = solicitudesMod.find((s) => s.estado === 'pendiente');

  // Métricas del comercio seleccionado
  const metricas = comercioActual ? getMetricasComercio(comercioActual.id, comercioActual.nombre) : null;

  // Es superadministrador
  const esSuperAdmin = Boolean(usuario?.esAdmin);

  // Si no está autenticado como comercio ni es admin, mostrar pantalla de Login exclusiva de comercio
  const estaAutenticado = esSuperAdmin || Boolean(comercioAutenticadoId);

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
            {estaAutenticado && (
              <>
                {misSucursales.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setModalElegirSucursalAbierto(true)}
                    className="py-1.5 px-3 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-cyan-950/50"
                    title="Elegir con qué sucursal trabajar de la lista"
                  >
                    <Store className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Sucursales ({misSucursales.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setModalPasswordAbierto(true)}
                  className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-cyan-300 border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Cambiar contraseña de este comercio"
                >
                  <Key className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="hidden sm:inline">Cambiar Clave</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalBajaComercioAbierto(true)}
                  className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-rose-950 text-rose-400 hover:text-rose-200 border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Dar de baja este comercio definitivamente"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Dar de Baja</span>
                </button>


                {!esSuperAdmin && (
                  <button
                    type="button"
                    onClick={handleCerrarSesion}
                    className="py-1.5 px-3 rounded-xl bg-zinc-900 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Cerrar sesión del comercio"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Salir</span>
                  </button>
                )}
              </>
            )}

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

      {/* Si NO está autenticado, renderizar Portal Mi Comercio con pestañas de Ingreso y Carga */}
      {!estaAutenticado ? (
        <div className="flex-1 max-w-lg w-full mx-auto px-4 py-8 flex flex-col justify-center">
          <div className="p-6 sm:p-8 bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 mx-auto flex items-center justify-center shadow-lg shadow-cyan-950/50">
                <Store className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black text-white">Mi Comercio</h2>
              <p className="text-xs text-zinc-400">
                Accede a la gestión de tu local o súmalo a NeoFaro para estar visible 24/7 en el barrio.
              </p>
            </div>

            {/* Pestañas: Ingresar a mi Comercio vs Cargar mi Comercio */}
            <div className="grid grid-cols-2 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setTabModoAcceso('ingresar');
                  setRequiereDefinirClave(false);
                  setLoginError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tabModoAcceso === 'ingresar'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                <span>Ingresar a mi Comercio</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTabModoAcceso('cargar');
                  setLoginError(null);
                }}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tabModoAcceso === 'cargar'
                    ? 'bg-cyan-500 text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cargar mi Comercio</span>
              </button>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-start gap-2.5 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {tabModoAcceso === 'cargar' ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Beneficios para tu comercio</span>
                  </div>
                  <ul className="space-y-2 text-xs text-zinc-300">
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Presencia barrial 24/7</strong> en el mapa interactivo con ubicación exacta.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Horarios y estados</strong>: abierto, cerrado, vacaciones y farmacias de turno.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Catálogo online y promociones semanales</strong> directo al WhatsApp de tu negocio.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>Acceso privado exclusivo</strong> con la contraseña que vos elijas.</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/cargar-comercio"
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer text-center no-underline"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cargar mi Comercio Ahora</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>

                <p className="text-[11px] text-zinc-500 text-center">
                  El registro es inmediato y podrás gestionar tus datos en cualquier momento.
                </p>
              </div>
            ) : requiereDefinirClave ? (
              <form onSubmit={handleDefinirClaveInicial} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/40 space-y-1">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4" />
                    Configura tu Contraseña de Acceso
                  </span>
                  <p className="text-[11px] text-zinc-300">
                    Este comercio aún no tiene una contraseña registrada. Establece tu clave personal para proteger la gestión de tu local.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                    <span>Nueva Contraseña *</span>
                    <button
                      type="button"
                      onClick={() => setMostrarNuevaClave(!mostrarNuevaClave)}
                      className="text-zinc-400 hover:text-white text-[10px] inline-flex items-center gap-1"
                    >
                      {mostrarNuevaClave ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{mostrarNuevaClave ? 'Ocultar' : 'Ver'}</span>
                    </button>
                  </label>
                  <input
                    type={mostrarNuevaClave ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={nuevaClaveComercio}
                    onChange={(e) => setNuevaClaveComercio(e.target.value)}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Confirmar Contraseña *
                  </label>
                  <input
                    type={mostrarNuevaClave ? 'text' : 'password'}
                    required
                    minLength={4}
                    value={confirmarNuevaClaveComercio}
                    onChange={(e) => setConfirmarNuevaClaveComercio(e.target.value)}
                    placeholder="Repite la nueva contraseña"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Guardar Contraseña e Ingresar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequiereDefinirClave(false);
                    setLoginError(null);
                  }}
                  className="w-full py-1 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer text-center"
                >
                  ← Volver al formulario de ingreso
                </button>
              </form>
            ) : (
              <form onSubmit={handleLoginComercio} className="space-y-4">
                {/* Selector de Método de Identificación: Mail Registrado vs Buscar por Nombre y Dirección */}
                <div className="space-y-2">
                  <span className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    ¿Cómo deseas ingresar a tu comercio?
                  </span>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setMetodoIdentificacionLogin('email')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        metodoIdentificacionLogin === 'email'
                          ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Con Mail Registrado</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoIdentificacionLogin('buscar')}
                      className={`py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        metodoIdentificacionLogin === 'buscar'
                          ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-sm'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Buscar Comercio</span>
                    </button>
                  </div>
                </div>

                {metodoIdentificacionLogin === 'email' ? (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Correo Electrónico Registrado del Comercio *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        required
                        value={loginEmail}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLoginEmail(val);
                          const limpio = val.trim().toLowerCase();
                          const matches = comercios.filter(
                            (c) =>
                              (c.email_comercio && c.email_comercio.trim().toLowerCase() === limpio) ||
                              (c.email && c.email.trim().toLowerCase() === limpio)
                          );
                          if (matches.length > 0) {
                            if (!matches.some((c) => c.id === loginComercioId)) {
                              setLoginComercioId(matches[0].id);
                            }
                          }
                        }}
                        placeholder="ejemplo@tucomercio.com"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <span className="block text-[11px] text-zinc-500">
                      Ingresa el correo con el que registraste o diste de alta tu local.
                    </span>

                    {/* Si existen múltiples sucursales con este mismo correo, permitir elegir el local específico */}
                    {comerciosConMismoMail.length > 1 && (
                      <div className="mt-2.5 p-3 bg-zinc-900/90 border border-cyan-500/40 rounded-2xl space-y-1.5 animate-in fade-in">
                        <label className="block text-[11px] font-bold text-cyan-300">
                          📍 Tienes {comerciosConMismoMail.length} locales asociados a este correo. Selecciona a cuál ingresar:
                        </label>
                        <select
                          value={loginComercioId}
                          onChange={(e) => setLoginComercioId(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          {comerciosConMismoMail.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} ({c.rubro}) — 📍 {c.direccion}{c.localidad ? `, ${c.localidad}` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Buscar y Seleccionar Comercio *
                    </label>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={filtroBusquedaLogin}
                        onChange={(e) => setFiltroBusquedaLogin(e.target.value)}
                        placeholder="Buscar por nombre, rubro o dirección..."
                        className="w-full pl-8 pr-3 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <select
                      value={loginComercioId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setLoginComercioId(id);
                        const com = comercios.find((c) => c.id === id);
                        if (com) {
                          setLoginEmail(com.email_comercio || com.email || '');
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                    >
                      {comerciosFiltradosLogin.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.rubro}) — 📍 {c.direccion}{c.localidad ? `, ${c.localidad}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Tarjeta de Identificación Clara con Dirección Física para evitar confusiones de nombres repetidos */}
                {comercioIdentificado && (
                  <div className="p-3 bg-zinc-900/90 border border-cyan-500/40 rounded-2xl space-y-1.5 text-xs shadow-md shadow-black/40 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-white">
                        <Store className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{comercioIdentificado.nombre}</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-semibold">
                        {comercioIdentificado.rubro}
                      </span>
                    </div>

                    <div className="flex items-start gap-1.5 text-zinc-300 text-[11px] bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80">
                      <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-zinc-100">Dirección:</strong> {comercioIdentificado.direccion}
                        {comercioIdentificado.localidad ? `, ${comercioIdentificado.localidad}` : ''}
                      </span>
                    </div>

                    {(comercioIdentificado.email_comercio || comercioIdentificado.email) && (
                      <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] px-1">
                        <Mail className="w-3 h-3 text-violet-400 shrink-0" />
                        <span>Mail registrado: {comercioIdentificado.email_comercio || comercioIdentificado.email}</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                    Contraseña del Comercio:
                  </label>
                  <div className="relative">
                    <input
                      type={mostrarLoginPass ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Ingresa la contraseña de tu local..."
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarLoginPass(!mostrarLoginPass)}
                      className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-300"
                    >
                      {mostrarLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] text-zinc-400 flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Ingresa con la contraseña configurada al momento de cargar tu comercio.</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-violet-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4" />
                  <span>Ingresar al Portal del Comercio</span>
                </button>
              </form>
            )}

            <div className="text-center pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setTabModoAcceso(tabModoAcceso === 'ingresar' ? 'cargar' : 'ingresar')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                {tabModoAcceso === 'ingresar'
                  ? '¿Aún no diste de alta tu local? Cárgalo aquí →'
                  : '¿Ya registraste tu comercio? Ingresa aquí →'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Contenido Principal Autenticado */
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Banner Multi-Sucursal con selector desplegable de trabajo */}
          {misSucursales.length > 1 && (
            <div className="p-4 sm:p-5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-cyan-500/50 rounded-3xl shadow-xl shadow-cyan-950/30 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    <Store className="w-5 h-5" />
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-sm sm:text-base font-extrabold text-white">
                      Sucursal de Trabajo Activa
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-cyan-500 text-black shadow-sm">
                      {misSucursales.length} sucursales
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-300">
                  Elige con cuál vas a trabajar. Al cambiar de sucursal verás y editarás de inmediato todos sus datos, catálogo y métricas:
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-80">
                  <select
                    value={comercioSeleccionadoId}
                    onChange={(e) => handleCambiarComercio(e.target.value)}
                    className="w-full px-4 py-2.5 bg-zinc-950 border-2 border-cyan-400 rounded-2xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/25 cursor-pointer shadow-lg"
                    title="Elegir sucursal de la lista desplegable"
                  >
                    {misSucursales.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.rubro}) — 📍 {c.direccion}{c.localidad ? `, ${c.localidad}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Selector de Comercio y Resumen */}
          <section className="p-5 sm:p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4 shadow-xl">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold block mb-1">
                  Comercio Administrado:
                </span>
                <div className="flex items-center gap-2">
                  {esSuperAdmin ? (
                    <select
                      value={comercioSeleccionadoId}
                      onChange={(e) => handleCambiarComercio(e.target.value)}
                      className="px-3.5 py-2 bg-zinc-900 border border-zinc-700/80 rounded-2xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer min-w-[240px]"
                    >
                      {comercios.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre} ({c.rubro}) — 📍 {c.direccion}{c.localidad ? `, ${c.localidad}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : misSucursales.length > 1 ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={comercioSeleccionadoId}
                        onChange={(e) => {
                          const id = e.target.value;
                          handleCambiarComercio(id);
                          setComercioAutenticadoId(id);
                          if (typeof window !== 'undefined') {
                            sessionStorage.setItem('vecinos_comercio_auth_id', id);
                          }
                        }}
                        className="px-3.5 py-2 bg-zinc-900 border border-cyan-500/50 rounded-2xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer min-w-[240px]"
                      >
                        {misSucursales.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nombre} ({c.rubro}) — 📍 {c.direccion}{c.localidad ? `, ${c.localidad}` : ''}
                          </option>
                        ))}
                      </select>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-700/60 shrink-0">
                        {misSucursales.length} sucursales
                      </span>
                    </div>
                  ) : (
                    <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm font-extrabold text-white flex flex-wrap items-center gap-2">
                      <Store className="w-4 h-4 text-cyan-400" />
                      <span>{comercioActual?.nombre || 'Comercio'}</span>
                      <span className="text-xs text-zinc-400 font-normal">({comercioActual?.rubro})</span>
                      {comercioActual?.direccion && (
                        <span className="text-xs text-zinc-400 font-normal flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>{comercioActual.direccion}{comercioActual.localidad ? `, ${comercioActual.localidad}` : ''}</span>
                        </span>
                      )}
                    </div>
                  )}


                  {esSuperAdmin && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-violet-950 text-violet-300 border border-violet-700">
                      Modo SuperAdmin
                    </span>
                  )}
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

            {/* INDICADOR DE IMPACTO MENSUAL Y VISITAS RECIBIDAS (PREGUNTA 3) */}
            {comercioActual && (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-cyan-500/30 shadow-xl shadow-black/50 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)] shrink-0">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                          Métrica de Visibilidad Barrial
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          Mes en curso
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-white flex items-baseline gap-2 mt-0.5">
                        <span>Tu local recibió</span>
                        <span className="text-2xl sm:text-3xl text-cyan-300 font-mono font-black drop-shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                          {metricas?.visitasTotales || 0}
                        </span>
                        <span className="text-zinc-300 font-medium text-xs sm:text-sm">visitas de vecinos</span>
                      </h4>
                    </div>
                  </div>

                  {/* Valoración confidencial de vecinos (Privada para comercio y admin) */}
                  <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3.5 py-2 rounded-2xl shrink-0">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <div className="text-right">
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <span>{comercioActual.calificacion_promedio ? `${comercioActual.calificacion_promedio} / 5` : '5.0 / 5'}</span>
                        <span className="text-[10px] text-amber-400 font-normal">
                          ({calificacionesComercio.length || comercioActual.calificaciones_total || 0} opin.)
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-500 block uppercase font-mono tracking-tight">Valoración interna</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11.5px] text-zinc-400">
                  <p className="leading-relaxed">
                    💡 Hacia el <strong className="text-zinc-200">día 25 de tu período</strong> este contador de visitas te servirá como dato real para comprobar el retorno y la exposición de tu vidriera digital en el barrio.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPestana('metricas')}
                    className="shrink-0 text-cyan-400 hover:text-cyan-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver informe completo</span>
                    <TrendingUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* CENTRO DE SOPORTE PARA COMERCIOS Y RECOMENDACIONES */}
            {comercioActual && (
              <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400 shrink-0">
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">¿Problemas con tu local o membresía?</span>
                    <span className="text-zinc-400 text-[11px]">
                      Carga problemas de tu comercio o tu cuenta directamente al panel de administrador.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => abrirModalSoporte('problema_local_membresia', comercioActual.nombre)}
                    className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 font-semibold text-xs cursor-pointer transition-colors shadow-sm"
                  >
                    Cargar Problema
                  </button>
                  <button
                    type="button"
                    onClick={() => abrirModalSoporte('recomendacion', comercioActual.nombre)}
                    className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-semibold text-xs cursor-pointer transition-colors"
                  >
                    ¿Tenés Recomendaciones?
                  </button>
                </div>
              </div>
            )}

            {/* BANNERS OPERATIVOS: EMERGENCIA Y VACACIONES */}
            {comercioActual && (comercioActual.cerrado_momentaneo || comercioActual.en_vacaciones) && (
              <div className="pt-2 space-y-2">
                {comercioActual.cerrado_momentaneo && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-200 shadow-md">
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
                      disabled={levantandoUrgencia}
                      onClick={handleLevantarUrgencia}
                      className="py-2 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs shrink-0 cursor-pointer transition-all shadow-lg shadow-emerald-950/60 flex items-center gap-1.5 disabled:opacity-50"
                      title="Levantar la urgencia y restablecer de inmediato el local como abierto en el mapa"
                    >
                      <CheckCircle2 className="w-4 h-4 text-black" />
                      <span>{levantandoUrgencia ? 'Reabriendo...' : '🟢 Levantar Urgencia y Reabrir Ahora'}</span>
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

          {/* Barra de Pestañas (5 Pestañas) */}
          <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800 overflow-x-auto no-scrollbar gap-1">
            <button
              type="button"
              onClick={() => setPestana('metricas')}
              className={`flex-1 min-w-[130px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                pestana === 'metricas'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-cyan-300" />
              <span>Métricas</span>
            </button>

            <button
              type="button"
              onClick={() => setPestana('modificar')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                pestana === 'modificar'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Horarios y Datos</span>
            </button>

            <button
              type="button"
              onClick={() => setPestana('catalogo')}
              className={`flex-1 min-w-[150px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                pestana === 'catalogo'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <ShoppingBag className="w-4 h-4 text-purple-300" />
              <span>Catálogo Mensual ({productos.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setPestana('comprobantes')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                pestana === 'comprobantes'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Comprobantes</span>
            </button>

            <button
              type="button"
              onClick={() => setPestana('debates')}
              className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                pestana === 'debates'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Debates ({debates.length})</span>
            </button>
          </div>

          {/* ============================================================== */}
          {/* PESTAÑA 1: MÉTRICAS Y RENDIMIENTO DEL COMERCIO                */}
          {/* ============================================================== */}
          {pestana === 'metricas' && metricas && (
            <div className="space-y-6">
              {/* Tarjetas Principales de KPI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Visitas al Perfil */}
                <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider">Visitas al Perfil</span>
                    <span className="p-2 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                      <Eye className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{metricas.visitasTotales}</span>
                    <span className="text-xs text-zinc-500 font-medium">este mes</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    {metricas.esCrecimiento ? (
                      <span className="flex items-center text-emerald-400 font-bold">
                        <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                        +{metricas.crecimientoPorcentaje}%
                      </span>
                    ) : (
                      <span className="flex items-center text-rose-400 font-bold">
                        <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                        -{metricas.crecimientoPorcentaje}%
                      </span>
                    )}
                    <span className="text-zinc-500">tendencia de consultas</span>
                  </div>
                </div>

                {/* 2. Interacciones Totales */}
                <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider">Interacciones Totales</span>
                    <span className="p-2 rounded-xl bg-violet-950/80 text-violet-400 border border-violet-800/50">
                      <Sparkles className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{metricas.interaccionesTotales}</span>
                    <span className="text-xs text-zinc-500 font-medium">acciones directas</span>
                  </div>
                  <div className="text-xs text-zinc-400">
                    Tasa de contacto estimada: <strong className="text-cyan-300 font-bold">{metricas.tasaConversion}%</strong>
                  </div>
                </div>

                {/* 3. Contactos por WhatsApp */}
                <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider">Clics WhatsApp</span>
                    <span className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/50">
                      <MessageSquare className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{metricas.clicsWhatsapp}</span>
                    <span className="text-xs text-zinc-500 font-medium">mensajes enviados</span>
                  </div>
                  <div className="text-[11px] text-emerald-300/80">
                    Canal directo con vecinos del barrio
                  </div>
                </div>

                {/* 4. Exploraciones de Catálogo */}
                <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span className="font-semibold uppercase tracking-wider">Vistas de Catálogo</span>
                    <span className="p-2 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/50">
                      <ShoppingBag className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{metricas.aperturasCatalogo}</span>
                    <span className="text-xs text-zinc-500 font-medium">consultas de precios</span>
                  </div>
                  <div className="text-[11px] text-purple-300/80">
                    {productos.length} productos publicados
                  </div>
                </div>
              </div>

              {/* Desglose Detallado y Consejos de Rendimiento */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <span>Desglose de Interacciones de Vecinos</span>
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          Consultas por WhatsApp
                        </span>
                        <span className="text-white font-bold">{metricas.clicsWhatsapp} ({Math.round((metricas.clicsWhatsapp / (metricas.interaccionesTotales || 1)) * 100)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((metricas.clicsWhatsapp / (metricas.interaccionesTotales || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-blue-400" />
                          Llamadas Telefónicas
                        </span>
                        <span className="text-white font-bold">{metricas.clicsLlamada} ({Math.round((metricas.clicsLlamada / (metricas.interaccionesTotales || 1)) * 100)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((metricas.clicsLlamada / (metricas.interaccionesTotales || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300 flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                          Aperturas de Catálogo de Precios
                        </span>
                        <span className="text-white font-bold">{metricas.aperturasCatalogo} ({Math.round((metricas.aperturasCatalogo / (metricas.interaccionesTotales || 1)) * 100)}%)</span>
                      </div>
                      <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.round((metricas.aperturasCatalogo / (metricas.interaccionesTotales || 1)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                      <span>Búsquedas en el barrio donde apareció tu local:</span>
                      <strong className="text-white font-mono bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800">
                        {metricas.aparicionesEnBusqueda} impresiones
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Consejos para Potenciar el Comercio */}
                <div className="p-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl space-y-4">
                  <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>Claves para Aumentar Ventas</span>
                  </h3>

                  <div className="space-y-3 text-xs text-zinc-300">
                    <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                      <strong className="text-white block font-semibold">1. Horarios de Trasnoche Claros</strong>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Si atiendes de noche o madrugada, configurar tus turnos exactos te mantendrá visible con el cartel &quot;Abierto&quot; en los momentos de mayor demanda.
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                      <strong className="text-white block font-semibold">2. Precios Transparentes</strong>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Los vecinos prefieren comercios con lista de productos cargada. Aprovecha tu actualización mensual para mantener tus productos esenciales al día.
                      </p>
                    </div>

                    <div className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-1">
                      <strong className="text-white block font-semibold">3. Destacado Gold</strong>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Los comercios Gold reciben hasta un 40% más de clics en WhatsApp al figurar siempre primeros en el listado del barrio.
                      </p>
                    </div>
                  </div>
                </div>

                {/* CALIFICACIONES PRIVADAS DE VECINOS (SOLO COMERCIO Y ADMIN) */}
                <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                        <Star className="w-5 h-5 fill-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Calificaciones y Opiniones de Vecinos
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                            Confidencial
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400">
                          Solo visible para ti y la administración. Los vecinos que navegan la guía no pueden ver las valoraciones de otros.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 px-4 py-2.5 rounded-2xl shrink-0">
                      <div className="text-right">
                        <div className="text-xl font-black text-amber-400 font-mono">
                          {comercioActual?.calificacion_promedio ? `${comercioActual.calificacion_promedio.toFixed(1)} / 5.0` : '5.0 / 5.0'}
                        </div>
                        <span className="text-[10px] text-zinc-400">
                          {calificacionesComercio.length || comercioActual?.calificaciones_total || 0} valoraciones
                        </span>
                      </div>
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-4 h-4 ${
                              s <= Math.round(comercioActual?.calificacion_promedio || 5)
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-zinc-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Explicación de protección antilinchamiento */}
                  <div className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-[11.5px] text-zinc-300 flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong className="text-white">Política de Privacidad NeoFaro:</strong> Las calificaciones se reservan exclusivamente para tu feedback interno y control de calidad administrativo. No se publican en el mapa abierto para prevenir campañas de desprestigio o competencia desleal.
                    </p>
                  </div>

                  {/* Listado de comentarios */}
                  {calificacionesComercio.length === 0 ? (
                    <div className="text-center py-6 px-4 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl text-xs text-zinc-500">
                      Aún no registras opiniones escritas de vecinos este mes. A medida que tus clientes califiquen la atención desde el botón de la ficha, aparecerán registradas aquí.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                      {calificacionesComercio.map((calif) => (
                        <div
                          key={calif.id}
                          className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{calif.usuario_nombre || 'Vecino del barrio'}</span>
                              <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${
                                      s <= calif.estrellas ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(calif.creado_en || calif.fecha || Date.now()).toLocaleDateString('es-AR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {calif.comentario && (
                            <p className="text-xs text-zinc-300 italic bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
                              &ldquo;{calif.comentario}&rdquo;
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PESTAÑA 2: MODIFICAR DATOS Y HORARIOS AVANZADOS               */}
          {/* ============================================================== */}
          {pestana === 'modificar' && (
            <div className="space-y-6">
              {/* Alerta de Aprobación Previa del Administrador */}
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-violet-500/30 flex items-start gap-3 text-xs text-zinc-300">
                <ShieldCheck className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">
                    Modificaciones moderadas para seguridad vecinal
                  </span>
                  <p className="text-zinc-400 leading-relaxed text-[11px]">
                    Para garantizar la confiabilidad del mapa barrial, las modificaciones en datos de contacto son enviadas a moderación del Administrador. Tus datos vigentes continuarán visibles mientras se evalúa la solicitud.
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
                      Localidad / Barrio
                    </label>
                    <input
                      type="text"
                      value={localidad}
                      onChange={(e) => setLocalidad(e.target.value)}
                      placeholder="Ej. San Isidro, Palermo, etc."
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Teléfono de Contacto * <span className="text-[10px] text-cyan-400 font-bold lowercase">(obligatorio)</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+54 11 4000-0000"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                      Correo Electrónico * <span className="text-[10px] text-cyan-400 font-bold lowercase">(obligatorio)</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contacto@comercio.com"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <InputWhatsAppConPais
                      value={whatsapp}
                      onChange={setWhatsapp}
                      label="WhatsApp Comercial"
                      placeholder="Ej: 9 11 5000-0000"
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

                {/* Presencia Digital & Redes Sociales */}
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-cyan-400" />
                    Presencia Digital & Redes Sociales (Opcionales)
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Página Web Oficial
                      </label>
                      <input
                        type="url"
                        value={sitioWeb}
                        onChange={(e) => setSitioWeb(e.target.value)}
                        placeholder="https://www.tucomercio.com"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value)}
                        placeholder="@comercio o enlace"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        TikTok
                      </label>
                      <input
                        type="text"
                        value={tiktok}
                        onChange={(e) => setTiktok(e.target.value)}
                        placeholder="@comercio o enlace"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Facebook
                      </label>
                      <input
                        type="text"
                        value={facebook}
                        onChange={(e) => setFacebook(e.target.value)}
                        placeholder="facebook.com/tucomercio"
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                        Otros Enlaces (PedidosYa, Tienda Online, LinkedIn, etc.)
                      </label>
                      <input
                        type="text"
                        value={otrosLinks}
                        onChange={(e) => setOtrosLinks(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Descripción del Local o Mensaje a los Vecinos
                  </label>
                  <textarea
                    rows={2}
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Contale a tus vecinos qué especialidades tienes, medios de pago o promociones..."
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                {tipoAtencion !== 'local_fisico' && (
                  <div className="pt-2 animate-in fade-in duration-200">
                    <SelectorZonaEnvioWrapper
                      latitud={comercioActual?.latitud || -34.6}
                      longitud={comercioActual?.longitud || -58.4}
                      radioKm={radioKm}
                      poligono={coberturaPoligono}
                      onChange={(nuevoRadio, nuevoPoligono) => {
                        setRadioKm(nuevoRadio);
                        setCoberturaPoligono(nuevoPoligono);
                      }}
                      confirmado={zonaEnvioConfirmada}
                      onToggleConfirmado={(nuevoEstado) => setZonaEnvioConfirmada(nuevoEstado)}
                    />
                    <div className="mt-2.5">
                      <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                        Descripción o Calles Límites de Zona de Reparto (Opcional)
                      </label>
                      <input
                        type="text"
                        value={zonaEnvioDescripcion}
                        onChange={(e) => setZonaEnvioDescripcion(e.target.value)}
                        placeholder="Ej: Entre las 4 avenidas principales o zona norte del barrio"
                        className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* SELECTOR AVANZADO DE DÍAS Y HORARIOS CON SOPORTE DE TRASNOCHE */}
                <div className="space-y-3 pt-3 border-t border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>Configuración de Días y Horarios de Atención</span>
                    </span>
                  </div>

                  <SelectorHorariosAvanzados
                    value={horariosConfig}
                    onChange={setHorariosConfig}
                  />
                </div>

                {/* Opciones Operativas Especiales */}
                <div className="space-y-4 pt-3 border-t border-zinc-800">
                  <span className="text-xs font-bold text-white uppercase tracking-wider block">
                    Opciones Operativas Especiales
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pausa Momentánea / Emergencia con Caducidad Automática */}
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        cerradoMomentaneo ? 'bg-amber-950/40 border-amber-500/50 shadow-md shadow-amber-950/20' : 'bg-zinc-900/60 border-zinc-800'
                      }`}
                    >
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
                            <div className="flex items-center justify-between font-bold text-amber-300">
                              <span className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Caducidad y Restablecimiento Automático:
                              </span>
                              <span className="px-2 py-0.5 rounded-md bg-amber-950 border border-amber-600/60 font-mono text-[10px]">
                                Uso {(comercioActual?.contador_urgencias_mes || 0) + (comercioActual?.cerrado_momentaneo ? 0 : 1)}/3 este mes
                              </span>
                            </div>
                            <p className="leading-relaxed text-amber-200/90">
                              El estado cambia inmediatamente a cerrado. El sistema lo restablecerá automáticamente a los horarios habituales a las{' '}
                              <strong>05:00 AM del siguiente día</strong>, garantizando la certeza del mapa para los vecinos.
                            </p>
                            {(comercioActual?.contador_urgencias_mes || 0) >= 2 && !comercioActual?.cerrado_momentaneo && (
                              <p className="text-[10px] text-rose-300 font-semibold pt-1">
                                ⚠️ Atención: Al alcanzar el 3er uso en el mes, el sistema computará 1 strike disciplinario por reiteración de cierres imprevistos.
                              </p>
                            )}

                            {comercioActual?.cerrado_momentaneo && (
                              <div className="pt-2">
                                <button
                                  type="button"
                                  disabled={levantandoUrgencia}
                                  onClick={handleLevantarUrgencia}
                                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 cursor-pointer transition-all disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                                  <span>{levantandoUrgencia ? 'Reabriendo local...' : '🟢 Levantar Urgencia y Reabrir Inmediatamente'}</span>
                                </button>
                                <p className="text-[10px] text-zinc-400 text-center mt-1">
                                  Restablece tu estado a abierto en el mapa en tiempo real para todos los vecinos.
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] text-zinc-500 leading-tight">
                          Al activarlo, se cierra de inmediato y se reactiva solo al inicio del siguiente día a las 05:00 AM. Hasta 3 usos por mes sin penalización.
                        </p>
                      )}
                    </div>

                    {/* Vacaciones Programadas Obligatorias */}
                    <div
                      className={`p-4 rounded-2xl border transition-all ${
                        enVacaciones ? 'bg-sky-950/40 border-sky-500/50 shadow-md shadow-sky-950/20' : 'bg-zinc-900/60 border-zinc-800'
                      }`}
                    >
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
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-300 mb-1.5">
                              Modalidad de Atención durante Vacaciones:
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setModalidadVacaciones('mostrar_con_aviso')}
                                className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                                  modalidadVacaciones === 'mostrar_con_aviso'
                                    ? 'bg-sky-950/80 border-sky-400 text-white font-bold'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                <span className="block text-[11px]">Mostrar con Aviso</span>
                                <span className="text-[9.5px] text-zinc-400 font-normal">Ficha visible con fecha de regreso previa al contacto</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setModalidadVacaciones('descanso_total')}
                                className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                                  modalidadVacaciones === 'descanso_total'
                                    ? 'bg-sky-950/80 border-sky-400 text-white font-bold'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                                }`}
                              >
                                <span className="block text-[11px]">Descanso Total</span>
                                <span className="text-[9.5px] text-zinc-400 font-normal">Desactiva contacto por WhatsApp temporalmente</span>
                              </button>
                            </div>
                          </div>

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

              {/* Zona de Peligro: Dar de baja este comercio */}
              <div className="p-6 bg-gradient-to-r from-rose-950/30 via-zinc-950 to-zinc-900 border border-rose-900/50 rounded-3xl space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      Dar de baja este comercio
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-xl">
                      Si tu local cerró permanentemente o ya no deseas que figure en NeoFaro, puedes darlo de baja definitiva de la plataforma. Esta acción removerá el comercio del mapa público, catálogo y búsquedas comunitarias.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalBajaComercioAbierto(true)}
                    className="py-2.5 px-4 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-700/60 text-xs font-bold rounded-xl transition-all shadow-md shadow-rose-950/50 flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <span>Dar de baja mi comercio</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* PESTAÑA 3: CATÁLOGO DE PRODUCTOS (VENTANA DE 30 DÍAS)          */}
          {/* ============================================================== */}
          {pestana === 'catalogo' && (
            <div className="space-y-6">
              {/* Banner Informativo de Política de 30 Días */}
              {puedeModificarCatalogo ? (
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-teal-950/60 to-zinc-950 border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                      <Unlock className="w-5 h-5 text-emerald-400" />
                    </span>
                    <div className="space-y-1">
                      <strong className="text-white text-sm font-bold block flex items-center gap-2">
                        <span>Actualización Mensual Habilitada</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-black">
                          Ventana Abierta
                        </span>
                      </strong>
                      <p className="text-emerald-200/90 text-xs leading-relaxed max-w-2xl">
                        Puedes agregar, editar o ajustar los precios de tus productos. Al pulsar &quot;Publicar y Fijar Catálogo Mensual&quot;, la lista quedará guardada y protegida por los próximos 30 días para brindar previsibilidad a tus clientes.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => handleAbrirModalProducto()}
                      className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/50 cursor-pointer w-full sm:w-auto transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Producto</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-950/80 via-zinc-950 to-zinc-950 border border-amber-600/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                      <Lock className="w-5 h-5 text-amber-400" />
                    </span>
                    <div className="space-y-1">
                      <strong className="text-white text-sm font-bold block flex items-center gap-2">
                        <span>Catálogo Fijado para Este Mes (Bloqueo de 30 Días)</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {diasRestantesCatalogo} días restantes
                        </span>
                      </strong>
                      <p className="text-amber-200/80 text-xs leading-relaxed max-w-2xl">
                        Para proteger la consistencia de precios y stock ante los vecinos, la política comunitaria permite 1 actualización por mes. Tu catálogo se encuentra activo y visible para los vecinos. Próxima actualización habilitada el <strong>{fechaProximaHabilitacionCatalogo}</strong>.
                      </p>
                    </div>
                  </div>

                  <span className="text-xs text-amber-400/90 font-mono bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-800/60 shrink-0">
                    🔒 Edición Bloqueada
                  </span>
                </div>
              )}

              {mensajeCatalogoExito && (
                <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center gap-3 text-xs text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{mensajeCatalogoExito}</span>
                </div>
              )}

              {/* Encabezado y Contador de Capacidad */}
              <div className="p-5 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span>Productos Publicados ({productos.length} / {limiteProductos})</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-zinc-400">
                      Plan {nivelActual.toUpperCase()} permite hasta {limiteProductos} artículos.
                    </span>
                    {nivelActual !== 'standar' && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold">
                        🔥 Ofertas Semanales Activas: {productos.filter((p) => p.es_oferta).length} / {NIVELES_CONFIG[nivelActual]?.limiteOfertasSemanales || 0} (Vigencia 7 días)
                      </span>
                    )}
                  </div>
                </div>

                {puedeModificarCatalogo && productos.length > 0 && (
                  <button
                    type="button"
                    disabled={guardandoCatalogo}
                    onClick={handlePublicarCatalogoMensual}
                    className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-extrabold text-xs shadow-lg shadow-violet-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{guardandoCatalogo ? 'Guardando...' : 'Publicar y Fijar Catálogo del Mes'}</span>
                  </button>
                )}
              </div>

              {/* Lista de Productos */}
              {productos.length === 0 ? (
                <div className="p-12 text-center bg-zinc-950 border border-zinc-800 rounded-3xl space-y-3">
                  <ShoppingBag className="w-12 h-12 text-zinc-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No tienes productos en tu catálogo aún</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Los comercios con precios visibles reciben hasta un 40% más de consultas vecinales directas en WhatsApp.
                  </p>
                  {puedeModificarCatalogo && (
                    <button
                      type="button"
                      onClick={() => handleAbrirModalProducto()}
                      className="py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agregar Primer Producto</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {productos.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5 text-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-white text-sm line-clamp-1">{prod.nombre}</h4>
                          {prod.es_oferta && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                              🔥 Oferta
                            </span>
                          )}
                        </div>

                        {prod.categoria && (
                          <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mt-0.5">
                            {prod.categoria}
                          </span>
                        )}

                        {prod.descripcion && (
                          <p className="text-zinc-400 text-[11px] line-clamp-2 mt-1">{prod.descripcion}</p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
                        <div>
                          {prod.es_oferta && prod.precio_oferta ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-base font-extrabold text-emerald-400">
                                ${prod.precio_oferta.toLocaleString('es-AR')}
                              </span>
                              <span className="text-[11px] text-zinc-500 line-through">
                                ${prod.precio.toLocaleString('es-AR')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-base font-extrabold text-white">
                              ${prod.precio.toLocaleString('es-AR')}
                            </span>
                          )}
                        </div>

                        {puedeModificarCatalogo && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAbrirModalProducto(prod)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white cursor-pointer"
                              title="Editar producto"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminarProducto(prod.id)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-rose-950 text-zinc-400 hover:text-rose-300 cursor-pointer"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* PESTAÑA 4: CARGAR COMPROBANTES DE TRANSFERENCIA (MEMBRESÍAS)   */}
          {/* ============================================================== */}
          {pestana === 'comprobantes' && (
            <div className="space-y-6">
              {/* Estado actual de la membresía del comercio y tiempo restante */}
              {comercioActual && (comercioActual.nivel === 'gold' || comercioActual.nivel === 'premium') && (
                <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      {comercioActual.nivel === 'gold' ? (
                        <Crown className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Award className="w-4 h-4 text-purple-400" />
                      )}
                      <span>Tiempo restante de tu Membresía {comercioActual.nivel.toUpperCase()}</span>
                    </span>
                    <span className="text-xs text-zinc-400">
                      Fecha límite: {comercioActual.fecha_vencimiento_nivel ? new Date(comercioActual.fecha_vencimiento_nivel).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : '30 días'}
                    </span>
                  </div>
                  <ContadorMembresia
                    fechaVencimiento={comercioActual.fecha_vencimiento_nivel}
                    nivel={comercioActual.nivel}
                    formato="reloj_digital"
                  />
                </div>
              )}

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
                    • 50 productos en catálogo<br />• 5 ofertas semanales (duración 7 días)
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
                  <p className="text-[11px] text-zinc-300">Máxima visibilidad, catálogo de 100 productos y 20 ofertas semanales.</p>
                  <div className="text-[10px] text-zinc-400 border-t border-amber-800/40 pt-2">
                    • 100 productos en catálogo<br />• 20 ofertas semanales (duración 7 días)<br />• Posicionamiento superior
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
                    <span className="text-white font-semibold">NeoFaro Plataforma</span>
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
                    placeholder="Ej: Pago de cuota transferido desde cuenta de titular..."
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
          {/* PESTAÑA 5: DEBATES E INCONVENIENTES CON CLIENTES               */}
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
      )}

      {/* Modal para Crear o Editar Producto en Catálogo */}
      {modalProductoAbierto && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span>{productoEditandoId ? 'Editar Producto' : 'Agregar Nuevo Producto'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setModalProductoAbierto(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGuardarProductoItem} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Nombre del Producto / Servicio *
                </label>
                <input
                  type="text"
                  required
                  value={prodNombre}
                  onChange={(e) => setProdNombre(e.target.value)}
                  placeholder="Ej: Empanada de carne cortada a cuchillo"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Precio Regular ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={prodPrecio}
                    onChange={(e) => setProdPrecio(e.target.value)}
                    placeholder="1200"
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                    Categoría / Etiqueta
                  </label>
                  <input
                    type="text"
                    value={prodCategoria}
                    onChange={(e) => setProdCategoria(e.target.value)}
                    placeholder="Bebidas, Platos, etc."
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Descripción Breve (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={prodDescripcion}
                  onChange={(e) => setProdDescripcion(e.target.value)}
                  placeholder="Detalles sobre porción, ingredientes o características..."
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-1">
                <label className="flex items-center gap-2 text-xs font-bold text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodAgotado}
                    onChange={(e) => setProdAgotado(e.target.checked)}
                    className="accent-rose-500 rounded"
                  />
                  <span>📦 Marcar como Agotado (Sin Stock)</span>
                </label>
                <p className="text-[10px] text-zinc-500 pl-6 leading-tight">
                  Se mostrará al final del catálogo y no podrá ser pedido por los vecinos hasta su reposición.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <label className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={prodEsOferta}
                    onChange={(e) => setProdEsOferta(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  <span>🔥 Marcar como Oferta Destacada (Con Cuenta Regresiva)</span>
                </label>

                {prodEsOferta && (
                  <div className="space-y-3 pt-2 border-t border-zinc-800">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                        Precio de Oferta Especial ($) *:
                      </label>
                      <input
                        type="number"
                        min={0}
                        required={prodEsOferta}
                        value={prodPrecioOferta}
                        onChange={(e) => setProdPrecioOferta(e.target.value)}
                        placeholder="990"
                        className="w-full px-3 py-1.5 bg-zinc-950 border border-amber-600/60 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-300 mb-1">
                          Vencimiento (Opcional):
                        </label>
                        <input
                          type="datetime-local"
                          value={prodHoraVencimiento}
                          onChange={(e) => setProdHoraVencimiento(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-[11px] text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-zinc-300 mb-1">
                          Cupo Unidades (Relámpago):
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={prodUnidadesLimitadas}
                          onChange={(e) => setProdUnidadesLimitadas(e.target.value)}
                          placeholder="Ilimitado"
                          className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-700 rounded-xl text-[11px] text-white focus:outline-none"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-amber-300/80">
                      * Vigencia semanal: Las ofertas tienen una duración de 7 días continuos. Pasados los 7 días caducan y se borran automáticamente, liberando cupo para nuevas ofertas (máx. 5 en Premium y 20 en Gold).
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalProductoAbierto(false)}
                  className="py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1 shadow-md shadow-purple-950/60"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Guardar Producto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Modal Unificado para Cambiar Contraseña del Comercio */}
      <ModalCambiarPassword
        abierto={modalPasswordAbierto}
        onCerrar={() => setModalPasswordAbierto(false)}
        tipo="comercio"
        comercioId={comercioActual?.id}
        comercioNombre={comercioActual?.nombre}
      />

      {/* Modal para Elegir con qué Sucursal Trabajar al Ingresar */}
      {modalElegirSucursalAbierto && misSucursales.length > 1 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-zinc-950 border-2 border-cyan-500/70 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-cyan-950/60 space-y-5 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setModalElegirSucursalAbierto(false)}
              className="absolute top-4 right-4 p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-950/40 shrink-0">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">¿Con qué sucursal vas a trabajar?</h3>
                <p className="text-xs text-zinc-400">
                  Tu cuenta administra {misSucursales.length} sucursales. Elige de la lista desplegable para cargar sus datos:
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Elegir Sucursal de la Lista Desplegable:
              </label>
              <select
                value={comercioSeleccionadoId}
                onChange={(e) => handleCambiarComercio(e.target.value)}
                className="w-full px-4 py-3 bg-zinc-900 border-2 border-cyan-400 rounded-2xl text-xs sm:text-sm font-bold text-white focus:outline-none focus:ring-4 focus:ring-cyan-500/20 cursor-pointer shadow-md"
              >
                {misSucursales.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.rubro}) — 📍 {c.direccion}{c.localidad ? `, ${c.localidad}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Datos del comercio seleccionado */}
            {comercioActual && (
              <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-sm flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-cyan-400" />
                    {comercioActual.nombre}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-bold">
                    {comercioActual.rubro}
                  </span>
                </div>

                <div className="flex items-start gap-2 text-zinc-300 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Dirección física:</strong> {comercioActual.direccion}{comercioActual.localidad ? `, ${comercioActual.localidad}` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px] text-zinc-400">
                  {comercioActual.whatsapp && (
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                      <span>WA: {comercioActual.whatsapp}</span>
                    </div>
                  )}
                  {comercioActual.telefono && (
                    <div className="flex items-center gap-1.5 text-zinc-300">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>Tel: {comercioActual.telefono}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalElegirSucursalAbierto(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-400 hover:to-violet-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Trabajar con esta Sucursal y Ver sus Datos</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notificación de Cambio de Sucursal */}
      {avisoCambioSucursal && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-cyan-950 border-2 border-cyan-500 text-cyan-100 text-xs font-bold shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{avisoCambioSucursal}</span>
        </div>
      )}
      {/* Modal Confirmación de Baja Definitiva de Comercio */}
      {modalBajaComercioAbierto && comercioActual && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-950 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setModalBajaComercioAbierto(false);
                setErrorBajaComercio(null);
              }}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Dar de baja mi comercio</h3>
                <p className="text-xs text-rose-300 font-semibold">{comercioActual.nombre}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-2xl text-xs text-rose-200 space-y-1.5">
              <p className="font-bold flex items-center gap-1.5 text-rose-300">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Acción permanente e irreversible:
              </p>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                Esta acción removerá definitivamente <strong>{comercioActual.nombre}</strong> (ubicado en {comercioActual.direccion}) del mapa vecinal, listados públicos y base de datos de NeoFaro.
              </p>
            </div>

            <form onSubmit={handleDarDeBajaComercio} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Motivo de la baja (opcional):
                </label>
                <input
                  type="text"
                  value={motivoBajaComercio}
                  onChange={(e) => setMotivoBajaComercio(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  placeholder="Ej: Cierre de local, cambio de titularidad..."
                />
              </div>

              {Boolean(comercioActual.password_comercio) && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Contraseña del comercio para autorizar la baja:
                  </label>
                  <input
                    type="password"
                    value={passBajaComercio}
                    onChange={(e) => setPassBajaComercio(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    placeholder="Ingresa tu contraseña"
                  />
                </div>
              )}

              <label className="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={confirmarBajaCheckbox}
                  onChange={(e) => setConfirmarBajaCheckbox(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-zinc-700 bg-zinc-900 accent-rose-600"
                  required
                />
                <span>
                  Confirmo que deseo dar de baja definitiva este comercio y entiendo que se borrará de NeoFaro sin posibilidad de recuperación.
                </span>
              </label>

              {errorBajaComercio && (
                <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 font-medium">
                  {errorBajaComercio}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalBajaComercioAbierto(false);
                    setErrorBajaComercio(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoBajaComercio || !confirmarBajaCheckbox}
                  className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{procesandoBajaComercio ? 'Dando de baja...' : 'Confirmar Baja Definitiva'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );

}
