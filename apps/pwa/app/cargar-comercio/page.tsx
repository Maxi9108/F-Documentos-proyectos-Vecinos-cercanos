'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Comercio, Producto, NivelComercio, NIVELES_CONFIG, HorariosConfig } from '@/types/comercio';
import MapaSelectorWrapper from '@/components/MapaSelectorWrapper';
import { guardarComercio } from '@/lib/supabase';
import {
  Store,
  MapPin,
  Phone,
  MessageSquare,
  Clock,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Tag,
  Loader2,
  Bike,
  Truck,
  Compass,
  AlertCircle,
  Crown,
  Award,
  Check,
  ShieldCheck,
  Calendar,
  Info,
  Lock,
  Globe,
  Mail,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getCategorias } from '@/lib/categorias';
import { registrarEvento } from '@/lib/analytics';
import SelectorHorariosAvanzados from '@/components/SelectorHorariosAvanzados';
import SelectorZonaEnvioWrapper from '@/components/SelectorZonaEnvioWrapper';
import { obtenerHorariosConfigPorDefecto } from '@/lib/horarios';

export default function CargarComercioPage() {
  const router = useRouter();

  // Categorías dinámicas disponibles
  const [listaCategorias, setListaCategorias] = useState<string[]>([]);
  const [solicitaNuevaCategoria, setSolicitaNuevaCategoria] = useState(false);
  const [categoriaSolicitada, setCategoriaSolicitada] = useState('');

  // Estados del Comercio
  const [nombre, setNombre] = useState('');
  const [rubro, setRubro] = useState('Almacén');
  const [descripcion, setDescripcion] = useState('');
  const [direccion, setDireccion] = useState('Av. San Martín 1500');
  const [localidad, setLocalidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  // Redes Sociales y Presencia Digital (Opcionales)
  const [sitioWeb, setSitioWeb] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  const [otrosLinks, setOtrosLinks] = useState('');

  // Horarios estructurados con soporte de trasnoche
  const [horariosConfig, setHorariosConfig] = useState<HorariosConfig>(obtenerHorariosConfigPorDefecto());
  const [resumenHorarios, setResumenHorarios] = useState('Lun a Vie: 08:30 a 20:30 hs | Sáb: 09:00 a 13:30 hs | Dom: Cerrado');
  const [estaAbierto, setEstaAbierto] = useState(true);

  // Credenciales exclusivas para administrar el comercio en /mi-comercio
  const [emailComercio, setEmailComercio] = useState('');
  const [passwordComercio, setPasswordComercio] = useState('');
  const [confirmarPasswordComercio, setConfirmarPasswordComercio] = useState('');
  const [mostrarPass, setMostrarPass] = useState(false);

  // Farmacia de Turno (rubro Farmacia)
  const [estaDeTurno, setEstaDeTurno] = useState(false);

  // Cerrado Momentáneamente (por inconveniente)
  const [cerradoMomentaneo, setCerradoMomentaneo] = useState(false);
  const [motivoCierreMomentaneo, setMotivoCierreMomentaneo] = useState('');

  // Modo Vacaciones
  const [enVacaciones, setEnVacaciones] = useState(false);
  const [vacacionesDesde, setVacacionesDesde] = useState('');
  const [vacacionesHasta, setVacacionesHasta] = useState('');
  const [mensajeVacaciones, setMensajeVacaciones] = useState('');

  useEffect(() => {
    const cats = getCategorias().map((c) => c.nombre);
    setListaCategorias(cats);
  }, []);

  // Modalidad de Atención y Zona de Entrega (delimitación con mapa y confirmación)
  const [tipoAtencion, setTipoAtencion] = useState<'local_fisico' | 'solo_envio' | 'ambos'>('local_fisico');
  const [radioKm, setRadioKm] = useState(3);
  const [coberturaPoligono, setCoberturaPoligono] = useState<[number, number][]>([]);
  const [zonaEnvioConfirmada, setZonaEnvioConfirmada] = useState(true);
  const [zonaEnvioDescripcion, setZonaEnvioDescripcion] = useState('');

  // Coordenadas geográficas por defecto (centro de referencia)
  const [latitud, setLatitud] = useState(-34.6000);
  const [longitud, setLongitud] = useState(-58.4200);

  // Nivel / Membresía solicitada
  const [nivelSolicitado, setNivelSolicitado] = useState<NivelComercio>('standar');
  const nivelConfig = NIVELES_CONFIG[nivelSolicitado];
  const limiteProductos = nivelConfig.limiteProductos;
  const limiteOfertas = nivelConfig.limiteOfertasDiarias;

  // Sección de Catálogo
  const [deseaCatalogo, setDeseaCatalogo] = useState(false);
  const [productos, setProductos] = useState<Partial<Producto>[]>([
    {
      nombre: '',
      descripcion: '',
      precio: 0,
      es_oferta: false,
      precio_oferta: 0,
      imagen_url: '',
      categoria: '',
    },
  ]);

  // Estados de interfaz
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Manejador del cambio de ubicación desde el mapa interactivo
  const handleUbicacionChange = (nuevaLat: number, nuevaLng: number, direccionSugerida?: string) => {
    setLatitud(nuevaLat);
    setLongitud(nuevaLng);
    if (direccionSugerida) {
      setDireccion(direccionSugerida);
    }
  };

  // Cantidad de ofertas activas actualmente
  const totalOfertas = productos.filter((p) => p.es_oferta).length;

  // Agregar fila de producto al catálogo respetando el límite del nivel
  const agregarProducto = () => {
    if (productos.length >= limiteProductos) {
      setErrorMsg(
        `Has alcanzado el límite máximo de ${limiteProductos} productos para el nivel ${nivelConfig.nombre}. Puedes cambiar de nivel en el paso 2 si necesitas mayor capacidad.`
      );
      return;
    }

    setProductos([
      ...productos,
      {
        nombre: '',
        descripcion: '',
        precio: 0,
        es_oferta: false,
        precio_oferta: 0,
        imagen_url: '',
        categoria: '',
      },
    ]);
  };

  // Alternar estado de oferta respetando el límite diario del nivel
  const toggleOferta = (index: number) => {
    const prodActual = productos[index];
    const nuevoEstado = !prodActual?.es_oferta;

    if (nuevoEstado) {
      if (limiteOfertas === 0) {
        setErrorMsg(
          'El nivel Standar no incluye ofertas destacadas. Selecciona el nivel Premium (2/día) o Gold (5/día) en el paso 2 para publicar promociones barriales.'
        );
        return;
      }
      if (totalOfertas >= limiteOfertas) {
        setErrorMsg(
          `El nivel ${nivelConfig.nombre} permite como máximo ${limiteOfertas} ${
            limiteOfertas === 1 ? 'oferta' : 'ofertas'
          } por día.`
        );
        return;
      }
    }

    actualizarProducto(index, 'es_oferta', nuevoEstado);
  };

  // Eliminar producto del catálogo
  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  // Modificar campo de un producto
  const actualizarProducto = (index: number, campo: keyof Producto, valor: any) => {
    const copia = [...productos];
    copia[index] = { ...copia[index], [campo]: valor };
    setProductos(copia);
  };

  // Envío del Formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg('Por favor ingresa el nombre de tu comercio.');
      return;
    }

    if (!direccion.trim()) {
      setErrorMsg('Por favor indica una dirección válida en el mapa.');
      return;
    }

    if (!telefono.trim()) {
      setErrorMsg('El teléfono de contacto es obligatorio para que los vecinos y administradores puedan comunicarse.');
      return;
    }

    if (!emailComercio.trim() || !emailComercio.includes('@')) {
      setErrorMsg('El correo electrónico es obligatorio para la gestión y administración de tu comercio.');
      return;
    }

    if (!passwordComercio || passwordComercio.length < 4) {
      setErrorMsg('La contraseña de administración del comercio debe tener al menos 4 caracteres.');
      return;
    }

    if (passwordComercio !== confirmarPasswordComercio) {
      setErrorMsg('Las contraseñas no coinciden. Por favor confirma la contraseña exactamente igual.');
      return;
    }

    if (tipoAtencion !== 'local_fisico' && !zonaEnvioConfirmada) {
      setErrorMsg('Por favor confirma los límites y alcance de tu zona de envíos en el mapa haciendo clic en el botón "Confirmar Este Paso".');
      return;
    }

    setGuardando(true);

    const comercioId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `comercio-${Date.now()}`;

    const rubroFinal = solicitaNuevaCategoria && categoriaSolicitada.trim()
      ? categoriaSolicitada.trim()
      : rubro;

    // Formatear productos válidos si habilitó catálogo
    const productosValidos: Producto[] = deseaCatalogo
      ? productos
          .filter((p) => p.nombre && p.nombre.trim() !== '')
          .map((p, idx) => ({
            id: `prod-${comercioId}-${idx}`,
            comercio_id: comercioId,
            nombre: p.nombre!.trim(),
            descripcion: p.descripcion || '',
            precio: Number(p.precio) || 0,
            es_oferta: Boolean(p.es_oferta),
            precio_oferta: p.es_oferta ? Number(p.precio_oferta) || undefined : undefined,
            descuento_porcentaje:
              p.es_oferta && p.precio && p.precio_oferta
                ? Math.round(((Number(p.precio) - Number(p.precio_oferta)) / Number(p.precio)) * 100)
                : undefined,
            imagen_url: p.imagen_url || 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=600&auto=format&fit=crop&q=80',
            categoria: p.categoria || rubroFinal,
            fecha_oferta: p.es_oferta ? new Date().toISOString().split('T')[0] : undefined,
          }))
      : [];

    // Validar límites del nivel seleccionado antes de guardar
    if (deseaCatalogo && productosValidos.length > limiteProductos) {
      setErrorMsg(
        `Has ingresado ${productosValidos.length} productos, pero el nivel ${nivelConfig.nombre} solo permite hasta ${limiteProductos}. Reduce artículos o solicita un nivel superior.`
      );
      setGuardando(false);
      return;
    }

    const ofertasValidas = productosValidos.filter((p) => p.es_oferta);
    if (ofertasValidas.length > limiteOfertas) {
      setErrorMsg(
        `Has marcado ${ofertasValidas.length} ofertas, pero el nivel ${nivelConfig.nombre} permite como máximo ${limiteOfertas} ofertas diarias.`
      );
      setGuardando(false);
      return;
    }

    const nuevoComercio: Comercio = {
      id: comercioId,
      nombre: nombre.trim(),
      rubro: rubroFinal,
      direccion: direccion.trim(),
      localidad: localidad.trim() || undefined,
      telefono: telefono.trim(),
      whatsapp: whatsapp.trim() || telefono.trim(),
      descripcion: descripcion.trim(),
      horario: resumenHorarios,
      horarios_config: horariosConfig,
      email: emailComercio.trim().toLowerCase(),
      email_comercio: emailComercio.trim().toLowerCase(),
      sitio_web: sitioWeb.trim() || undefined,
      instagram: instagram.trim() || undefined,
      tiktok: tiktok.trim() || undefined,
      facebook: facebook.trim() || undefined,
      otros_links: otrosLinks.trim() || undefined,
      password_comercio: passwordComercio.trim(),
      fecha_ultima_modificacion_catalogo: deseaCatalogo && productosValidos.length > 0 ? new Date().toISOString() : undefined,
      esta_abierto: estaAbierto && !cerradoMomentaneo && !enVacaciones,
      latitud,
      longitud,
      tiene_catalogo: deseaCatalogo && productosValidos.length > 0,
      productos: productosValidos,
      tipo_atencion: tipoAtencion,
      radio_entrega_metros: tipoAtencion !== 'local_fisico' ? Math.round(radioKm * 1000) : 0,
      cobertura_poligono: tipoAtencion !== 'local_fisico' && coberturaPoligono.length >= 3 ? coberturaPoligono : undefined,
      zona_envio_descripcion: tipoAtencion !== 'local_fisico' ? zonaEnvioDescripcion.trim() : '',
      // Estado de moderación previa: todo local nuevo ingresa en pendiente
      estado_aprobacion: 'pendiente',
      categoria_solicitada: solicitaNuevaCategoria && categoriaSolicitada.trim() ? categoriaSolicitada.trim() : undefined,
      fecha_solicitud: new Date().toISOString(),
      // Niveles y membresía
      nivel: 'standar', // Comienza en standar hasta que el administrador acepte la solicitud
      nivel_solicitado: nivelSolicitado,
      // Farmacia de Turno
      esta_de_turno: rubroFinal === 'Farmacia' ? estaDeTurno : false,
      fecha_turno: rubroFinal === 'Farmacia' && estaDeTurno ? new Date().toISOString().split('T')[0] : undefined,
      // Cierre momentáneo
      cerrado_momentaneo: cerradoMomentaneo,
      motivo_cierre_momentaneo: cerradoMomentaneo ? motivoCierreMomentaneo.trim() : undefined,
      // Vacaciones
      en_vacaciones: enVacaciones,
      vacaciones_desde: enVacaciones ? vacacionesDesde : undefined,
      vacaciones_hasta: enVacaciones ? vacacionesHasta : undefined,
      mensaje_vacaciones: enVacaciones ? mensajeVacaciones.trim() : undefined,
    };

    const res = await guardarComercio(nuevoComercio);

    setGuardando(false);

    if (res.success) {
      registrarEvento('solicitud_comercio', nuevoComercio.id, nuevoComercio.nombre, {
        rubro: rubroFinal,
        categoria_solicitada: nuevoComercio.categoria_solicitada,
        tipo_atencion: tipoAtencion,
        nivel_solicitado: nivelSolicitado,
      });
      setExito(true);
    } else {
      setErrorMsg(res.error || 'Ocurrió un error al registrar el comercio.');
    }
  };

  return (
    <main className="min-h-screen bg-black text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Cabecera con retorno */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors bg-zinc-900 border border-zinc-800 px-3.5 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Mapa del Barrio
          </Link>

          <span className="text-xs font-medium px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Registro de Comerciantes
          </span>
        </div>

        {/* Título */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/40 via-zinc-900 to-zinc-950 border border-zinc-800">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Suma tu Comercio a NeoFaro
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl leading-relaxed">
            Descubrí tu barrio, cerca y sin vueltas. Publica tu negocio en el mapa interactivo para que los vecinos encuentren tus productos, horarios de atención, ofertas especiales y puedan comunicarse por WhatsApp.
          </p>
        </div>

        {/* Modal de Éxito al guardar */}
        {exito ? (
          <div className="p-8 rounded-3xl bg-zinc-900 border border-amber-500/40 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-800/70 mb-2">
                ⏳ Solicitud en proceso de moderación
              </span>
              <h2 className="text-2xl font-black text-white">¡Solicitud Enviada con Éxito!</h2>
            </div>
            <p className="text-sm text-zinc-300 max-w-md mx-auto leading-relaxed">
              Tu negocio <strong>{nombre}</strong> ha sido registrado. Para garantizar la calidad y veracidad del portal, un administrador corroborará los datos y activará la publicación en el mapa barrial a la brevedad.
            </p>

            {/* Resumen del Nivel Solicitado */}
            <div className="p-3.5 max-w-sm mx-auto rounded-2xl bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-300 space-y-1 text-center">
              <span className="text-[11px] text-zinc-400 block">Nivel de Membresía Solicitado:</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs uppercase tracking-wide border">
                {nivelSolicitado === 'gold' ? (
                  <span className="text-amber-300 bg-amber-500/10 border-amber-500/30 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5 text-amber-400" /> Nivel Gold
                  </span>
                ) : nivelSolicitado === 'premium' ? (
                  <span className="text-purple-300 bg-purple-500/10 border-purple-500/30 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-purple-400" /> Nivel Premium
                  </span>
                ) : (
                  <span className="text-zinc-300 bg-zinc-800 border-zinc-700 flex items-center gap-1">
                    <Store className="w-3.5 h-3.5 text-zinc-400" /> Nivel Standar
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1">
                {limiteProductos} artículos en catálogo · {limiteOfertas} ofertas diarias destacadas.
              </p>
            </div>

            {solicitaNuevaCategoria && categoriaSolicitada && (
              <div className="p-3 max-w-sm mx-auto rounded-2xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-400">
                <span className="text-zinc-300 font-semibold block mb-0.5">Categoría solicitada:</span>
                &quot;{categoriaSolicitada}&quot; (será evaluada para sumarse a la lista oficial).
              </div>
            )}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/"
                className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-lg"
              >
                Volver al Directorio y Mapa
              </Link>
              <button
                type="button"
                onClick={() => {
                  setNombre('');
                  setDescripcion('');
                  setSolicitaNuevaCategoria(false);
                  setCategoriaSolicitada('');
                  setExito(false);
                }}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-xs transition-colors cursor-pointer"
              >
                Cargar otro comercio
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* SECCIÓN 1: Datos Generales */}
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-indigo-400" />
                1. Datos del Comercio
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Nombre del Comercio *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. Panadería San Antonio o Reparto de Agua Los Andes"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Rubro / Categoría *
                    </label>
                    <button
                      type="button"
                      onClick={() => setSolicitaNuevaCategoria(!solicitaNuevaCategoria)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                    >
                      {solicitaNuevaCategoria ? 'Elegir de la lista' : '¿No figura tu rubro?'}
                    </button>
                  </div>

                  {!solicitaNuevaCategoria ? (
                    <select
                      value={rubro}
                      onChange={(e) => {
                        if (e.target.value === '__solicitar_nueva__') {
                          setSolicitaNuevaCategoria(true);
                        } else {
                          setRubro(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                    >
                      {listaCategorias.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                      <option value="__solicitar_nueva__">➕ Solicitar otra categoría...</option>
                    </select>
                  ) : (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <input
                        type="text"
                        required
                        value={categoriaSolicitada}
                        onChange={(e) => setCategoriaSolicitada(e.target.value)}
                        placeholder="Ej. Reparación de Celulares, Imprenta, Herrería..."
                        className="w-full px-3.5 py-2.5 bg-zinc-950 border border-indigo-500/50 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                      />
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                        El administrador revisará esta categoría y la sumará al directorio oficial.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Selector de Modalidad de Atención */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-zinc-300 mb-2">
                  Modalidad de Atención y Envíos *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTipoAtencion('local_fisico')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      tipoAtencion === 'local_fisico'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-bold">Local Físico</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 leading-tight">
                      Atención al público en local a la calle
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoAtencion('solo_envio')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      tipoAtencion === 'solo_envio'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bike className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold">Solo a Domicilio</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 leading-tight">
                      Reparto exclusivo / Sin local a la calle
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoAtencion('ambos')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      tipoAtencion === 'ambos'
                        ? 'bg-indigo-950/60 border-indigo-500 text-white shadow-md shadow-indigo-950/50 ring-1 ring-indigo-500/40'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold">Ambos (Local y Delivery)</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 leading-tight">
                      Atención en local y envíos con radio
                    </span>
                  </button>
                </div>
              </div>

              {/* Configuración de Zona de Cobertura si hace envíos con Mapa y Confirmación */}
              {tipoAtencion !== 'local_fisico' && (
                <div className="pt-2 animate-in fade-in duration-200">
                  <SelectorZonaEnvioWrapper
                    latitud={latitud}
                    longitud={longitud}
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
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Aclaración adicional de calles límites o zonas (opcional)
                    </label>
                    <input
                      type="text"
                      value={zonaEnvioDescripcion}
                      onChange={(e) => setZonaEnvioDescripcion(e.target.value)}
                      placeholder="Ej. Entre Av. San Martín, Colectora Oeste y vías del tren"
                      className="w-full px-3.5 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Descripción o reseña para los vecinos
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Cuenta a qué se dedica tu comercio, especialidades o historia..."
                  className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Teléfono y WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Teléfono fijo o celular * <span className="text-[10px] text-indigo-400 font-bold uppercase">(Obligatorio)</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="+54 11 4000-0000"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    WhatsApp para pedidos o consultas
                  </label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+54 9 11 5000-0000"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Presencia Digital & Redes Sociales (Opcionales) */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  Presencia Digital & Redes Sociales (Opcionales)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Página Web Oficial
                    </label>
                    <input
                      type="url"
                      value={sitioWeb}
                      onChange={(e) => setSitioWeb(e.target.value)}
                      placeholder="https://www.tucomercio.com"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
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
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
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
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
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
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                      Otros Enlaces (PedidosYa, Tienda Online, LinkedIn, etc.)
                    </label>
                    <input
                      type="text"
                      value={otrosLinks}
                      onChange={(e) => setOtrosLinks(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Sección de Horarios de Atención con Selector Avanzado */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Días y Horarios de Atención (Soporta Bares y Trasnoche)
                </label>

                <SelectorHorariosAvanzados
                  value={horariosConfig}
                  onChange={(nuevoConf, resumen) => {
                    setHorariosConfig(nuevoConf);
                    setResumenHorarios(resumen);
                  }}
                />
              </div>

              {/* Credenciales de Acceso para el Comerciante */}
              <div className="p-4 rounded-2xl bg-zinc-950/90 border border-violet-500/40 space-y-3 shadow-lg shadow-violet-950/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-cyan-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Credenciales de Gestión (Portal Mi Comercio)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Con estos datos podrás iniciar sesión en el portal para modificar tu negocio y ver estadísticas.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Correo Electrónico de Gestión *
                    </label>
                    <input
                      type="email"
                      required
                      value={emailComercio}
                      onChange={(e) => setEmailComercio(e.target.value)}
                      placeholder="tucorreo@comercio.com"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                      <span>Contraseña de Acceso *</span>
                      <button
                        type="button"
                        onClick={() => setMostrarPass(!mostrarPass)}
                        className="text-zinc-400 hover:text-white inline-flex items-center gap-1 text-[10px]"
                      >
                        {mostrarPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{mostrarPass ? 'Ocultar' : 'Ver'}</span>
                      </button>
                    </label>
                    <input
                      type={mostrarPass ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={passwordComercio}
                      onChange={(e) => setPasswordComercio(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                      Confirmar Contraseña *
                    </label>
                    <input
                      type={mostrarPass ? 'text' : 'password'}
                      required
                      minLength={4}
                      value={confirmarPasswordComercio}
                      onChange={(e) => setConfirmarPasswordComercio(e.target.value)}
                      placeholder="Repite la contraseña"
                      className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Casilla especial para Farmacias: ¿Está de Turno? */}
              {(rubro === 'Farmacia' || (solicitaNuevaCategoria && categoriaSolicitada.toLowerCase().includes('farmacia'))) && (
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        ¿Farmacia de Turno 24hs?
                      </span>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Activa esta opción si tu farmacia está cubriendo la guardia/turno nocturno hoy.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setEstaDeTurno(!estaDeTurno)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        estaDeTurno
                          ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/30'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      {estaDeTurno ? '● DE TURNO HOY' : '○ Turno regular'}
                    </button>
                  </div>
                </div>
              )}

              {/* Estado Operativo Inicial (Abierto, Cerrado momentáneamente, Vacaciones) */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <label className="block text-xs font-semibold text-zinc-300">
                  Estado de Atención Inicial
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEstaAbierto(true);
                      setCerradoMomentaneo(false);
                      setEnVacaciones(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      estaAbierto && !cerradoMomentaneo && !enVacaciones
                        ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Abierto Normal
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCerradoMomentaneo(true);
                      setEnVacaciones(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      cerradoMomentaneo
                        ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    Cerrado Momentáneo
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEnVacaciones(true);
                      setCerradoMomentaneo(false);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      enVacaciones
                        ? 'bg-indigo-950/60 border-indigo-800 text-indigo-300'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    Por Vacaciones
                  </button>
                </div>

                {cerradoMomentaneo && (
                  <div className="pt-2 border-t border-zinc-900">
                    <label className="block text-[11px] text-zinc-400 mb-1">
                      Motivo del cierre momentáneo (opcional)
                    </label>
                    <input
                      type="text"
                      value={motivoCierreMomentaneo}
                      onChange={(e) => setMotivoCierreMomentaneo(e.target.value)}
                      placeholder="Ej. Cerrado momentáneamente por corte de luz o reposición"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white"
                    />
                  </div>
                )}

                {enVacaciones && (
                  <div className="pt-2 border-t border-zinc-900 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Fecha de regreso estimada</label>
                      <input
                        type="date"
                        value={vacacionesHasta}
                        onChange={(e) => setVacacionesHasta(e.target.value)}
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1">Mensaje para tus vecinos</label>
                      <input
                        type="text"
                        value={mensajeVacaciones}
                        onChange={(e) => setMensajeVacaciones(e.target.value)}
                        placeholder="Ej. ¡Volvemos con todo el 1ro de Febrero!"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* SECCIÓN 2: Nivel y Plan de Membresía */}
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    2. Selecciona el Nivel de tu Comercio *
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Elige el plan que mejor se adapte a tus necesidades. La solicitud queda sujeta a aprobación por el Administrador.
                  </p>
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 w-fit">
                  Paso 2 de 4
                </span>
              </div>

              {/* Tarjetas de Selección de Niveles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
                {/* PLAN STANDAR */}
                <div
                  onClick={() => setNivelSolicitado('standar')}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    nivelSolicitado === 'standar'
                      ? 'bg-zinc-900 border-zinc-500 ring-2 ring-zinc-500/30 shadow-lg'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-zinc-800 text-zinc-300 border border-zinc-700">
                        Nivel Base
                      </span>
                      {nivelSolicitado === 'standar' && (
                        <div className="w-5 h-5 rounded-full bg-zinc-200 text-black flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white">Standar</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Para negocios de catálogo esencial.</p>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Catálogo de hasta <strong>20 artículos</strong></span>
                      </li>
                      <li className="flex items-center gap-2 text-zinc-500">
                        <span className="w-3.5 h-3.5 text-center shrink-0">✕</span>
                        <span>Sin ofertas destacadas diarias</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Ficha y ubicación en el mapa</span>
                      </li>
                      <li className="flex items-center gap-2 text-zinc-400">
                        <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        <span>Permanente (no expira)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* PLAN PREMIUM */}
                <div
                  onClick={() => setNivelSolicitado('premium')}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    nivelSolicitado === 'premium'
                      ? 'bg-purple-950/30 border-purple-500 ring-2 ring-purple-500/30 shadow-xl shadow-purple-950/50'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-purple-800/50 hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        Recomendado
                      </span>
                      {nivelSolicitado === 'premium' && (
                        <div className="w-5 h-5 rounded-full bg-purple-500 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                        Premium
                        <Award className="w-4 h-4 text-purple-400" />
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Mayor variedad y descuentos barriales.</p>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Catálogo de hasta <strong>50 artículos</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Hasta <strong>2 ofertas por día</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Insignia Premium en el directorio</span>
                      </li>
                      <li className="flex items-center gap-2 text-purple-300">
                        <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        <span>Renovación cada 30 días</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* PLAN GOLD */}
                <div
                  onClick={() => setNivelSolicitado('gold')}
                  className={`relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                    nivelSolicitado === 'gold'
                      ? 'bg-amber-950/30 border-amber-500 ring-2 ring-amber-500/40 shadow-xl shadow-amber-950/60'
                      : 'bg-zinc-950/70 border-zinc-800/80 hover:border-amber-700/50 hover:bg-zinc-900/50'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-400" />
                        Máxima Visibilidad
                      </span>
                      {nivelSolicitado === 'gold' && (
                        <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                        Gold
                        <Crown className="w-4 h-4 text-amber-400" />
                      </h3>
                      <p className="text-xs text-zinc-400 mt-0.5">Para comercios líderes del barrio.</p>
                    </div>
                    <ul className="space-y-2 text-xs text-zinc-300 pt-2 border-t border-zinc-800/80">
                      <li className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Catálogo completo hasta <strong>100 productos</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Hasta <strong>5 ofertas por día</strong></span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Insignia Gold destacada en mapa y lista</span>
                      </li>
                      <li className="flex items-center gap-2 text-amber-300">
                        <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>Renovación mensual (30 días)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Mensaje Aclaratorio de Renovación y Aprobación */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Condición de membresía:</strong> Los niveles Premium y Gold requieren ser aceptados por el administrador. Duran un mes (30 días). En caso de no renovarse al término del mes, el comercio pasa automáticamente al nivel Standar sin perder sus datos.
                </p>
              </div>
            </div>

            {/* SECCIÓN 3: Mapa y Evaluación de Direcciones en Tiempo Real */}
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" />
                  3. Ubicación en el Mapa en Tiempo Real
                </h2>
                <span className="text-[11px] text-zinc-400 font-mono">
                  {latitud.toFixed(4)}, {longitud.toFixed(4)}
                </span>
              </div>

              <p className="text-xs text-zinc-400 leading-relaxed">
                Escribe tu dirección para evaluarla automáticamente en el mapa. También puedes arrastrar el marcador con el mouse o pulsar sobre el mapa para fijar la entrada exacta de tu local.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Dirección que verán los vecinos *
                  </label>
                  <input
                    type="text"
                    required
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle y número de tu local..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Localidad / Barrio
                  </label>
                  <input
                    type="text"
                    value={localidad}
                    onChange={(e) => setLocalidad(e.target.value)}
                    placeholder="Ej. Belgrano, San Isidro..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Componente de Mapa Interactivo Geocodificador */}
              <MapaSelectorWrapper
                latitud={latitud}
                longitud={longitud}
                direccionTexto={direccion}
                onUbicacionChange={handleUbicacionChange}
                radioEntregaMetros={Math.round(radioKm * 1000)}
                mostrarRadio={tipoAtencion !== 'local_fisico'}
              />
            </div>

            {/* SECCIÓN 4: Catálogo Digital de Productos y Ofertas */}
            <div className="p-6 rounded-3xl bg-zinc-900/80 border border-zinc-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-amber-400" />
                      4. Catálogo y Ofertas (Opcional)
                    </h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">
                      Nivel {nivelConfig.nombre}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Permitido para {nivelConfig.nombre}: hasta <strong>{limiteProductos} productos</strong> y <strong>{limiteOfertas === 0 ? 'sin ofertas' : `${limiteOfertas} ofertas/día`}</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDeseaCatalogo(!deseaCatalogo)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    deseaCatalogo
                      ? 'bg-amber-500 text-black border-amber-400 font-bold'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  {deseaCatalogo ? 'Catálogo Habilitado' : 'Sin Catálogo por ahora'}
                </button>
              </div>

              {deseaCatalogo && (
                <div className="space-y-4 pt-2">
                  {/* Barra de progreso de cupos del plan */}
                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">Cupo de Artículos:</span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded-lg border ${
                        productos.length >= limiteProductos
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/60'
                          : 'bg-zinc-900 text-zinc-200 border-zinc-700'
                      }`}>
                        {productos.length} / {limiteProductos}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400">Ofertas Diarias Marcadas:</span>
                      <span className={`font-bold font-mono px-2 py-0.5 rounded-lg border ${
                        limiteOfertas === 0
                          ? 'bg-zinc-900 text-zinc-500 border-zinc-800'
                          : totalOfertas >= limiteOfertas
                          ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                          : 'bg-zinc-900 text-zinc-200 border-zinc-700'
                      }`}>
                        {totalOfertas} / {limiteOfertas}
                      </span>
                    </div>
                  </div>

                  {productos.map((prod, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-400">
                          Producto #{index + 1}
                        </span>
                        {productos.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarProducto(index)}
                            className="p-1 text-zinc-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Nombre del Producto
                          </label>
                          <input
                            type="text"
                            value={prod.nombre || ''}
                            onChange={(e) => actualizarProducto(index, 'nombre', e.target.value)}
                            placeholder="Ej. Medialunas de manteca x 12"
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Precio Regular ($)
                          </label>
                          <input
                            type="number"
                            value={prod.precio || ''}
                            onChange={(e) => actualizarProducto(index, 'precio', e.target.value)}
                            placeholder="8000"
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            URL de Imagen Ilustrativa
                          </label>
                          <input
                            type="url"
                            value={prod.imagen_url || ''}
                            onChange={(e) => actualizarProducto(index, 'imagen_url', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] text-zinc-400 mb-1">
                            Descripción breve
                          </label>
                          <input
                            type="text"
                            value={prod.descripcion || ''}
                            onChange={(e) => actualizarProducto(index, 'descripcion', e.target.value)}
                            placeholder="Masa hojaldrada, almíbar artesanal..."
                            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* Toggle de Oferta */}
                      <div className="pt-2 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => toggleOferta(index)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-semibold flex items-center gap-1.5 cursor-pointer ${
                            prod.es_oferta
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : limiteOfertas === 0
                              ? 'bg-zinc-900 text-zinc-600 border-zinc-800/60 opacity-60'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {prod.es_oferta
                            ? 'En Oferta Barrial'
                            : limiteOfertas === 0
                            ? 'Ofertas solo en Premium/Gold'
                            : 'Marcar como Oferta'}
                        </button>

                        {prod.es_oferta && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-400">Precio Oferta ($):</span>
                            <input
                              type="number"
                              value={prod.precio_oferta || ''}
                              onChange={(e) => actualizarProducto(index, 'precio_oferta', e.target.value)}
                              placeholder="6500"
                              className="w-28 px-3 py-1 bg-zinc-900 border border-amber-500/40 rounded-lg text-xs text-amber-300 font-bold font-mono"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    disabled={productos.length >= limiteProductos}
                    onClick={agregarProducto}
                    className="w-full py-2.5 px-4 rounded-xl border border-dashed border-zinc-800 hover:border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed bg-zinc-950 text-xs font-semibold text-zinc-300 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-indigo-400" />
                    {productos.length >= limiteProductos
                      ? `Límite del plan alcanzado (${limiteProductos} artículos)`
                      : `Agregar otro producto al catálogo (${productos.length}/${limiteProductos})`}
                  </button>
                </div>
              )}
            </div>

            {/* Botón de Envío */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <Link
                href="/"
                className="py-3 px-5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-semibold text-xs transition-colors"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={guardando}
                className="py-3 px-8 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 disabled:opacity-50 text-white font-bold text-sm transition-all shadow-xl shadow-cyan-950/60 flex items-center gap-2 cursor-pointer"
              >
                {guardando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Registrando en el mapa...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Publicar Comercio en el Barrio
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
