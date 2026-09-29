'use client';

import React, { useState } from 'react';
import { Comercio, Producto } from '@/types/comercio';
import {
  X,
  Phone,
  MapPin,
  Clock,
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Tag,
  ExternalLink,
  Bike,
  Crown,
  Award,
  Pill,
  Sun,
  Moon,
  AlertCircle,
  Palmtree,
  Info,
  Heart,
  Navigation,
  Flag,
  Plus,
  Minus,
  ShoppingCart,
  Send,
  Flame,
  Compass,
  Globe,
  Mail,
} from 'lucide-react';
import { registrarEvento } from '@/lib/analytics';
import { useUser } from '@/context/user-context';
import { calcularDistanciaKm, formatearDistancia, estimarTiempo } from '@/lib/geolocation';
import { verificarComercioAbierto } from '@/lib/horarios';
import ModalCrearDebate from '@/components/ModalCrearDebate';
import OfertaCountdown from '@/components/OfertaCountdown';

interface ModalDetalleComercioProps {
  comercio: Comercio | null;
  onClose: () => void;
  onVerEnMapa: (comercio: Comercio) => void;
  onReportar?: (comercio: Comercio) => void;
}

export default function ModalDetalleComercio({
  comercio,
  onClose,
  onVerEnMapa,
  onReportar,
}: ModalDetalleComercioProps) {
  const { esFavorito, toggleFavorito, ubicacionReferencia } = useUser();

  // Pestaña activa con sincronización cuando cambia el comercio
  const [pestanaActiva, setPestanaActiva] = useState<'ofertas' | 'catalogo' | 'info'>('catalogo');
  const [modalDebateAbierto, setModalDebateAbierto] = useState(false);

  // Estado para el Pedido en 1 Clic por WhatsApp
  const [pedidoItems, setPedidoItems] = useState<Record<string, number>>({});
  const [modalidadPedido, setModalidadPedido] = useState<'mostrador' | 'envio'>('mostrador');

  const cambiarCantidad = (prodId: string, delta: number) => {
    setPedidoItems((prev) => {
      const actual = prev[prodId] || 0;
      const nueva = Math.max(0, actual + delta);
      if (nueva === 0) {
        const copia = { ...prev };
        delete copia[prodId];
        return copia;
      }
      return { ...prev, [prodId]: nueva };
    });
  };

  React.useEffect(() => {
    setPedidoItems({});
    if (comercio?.productos?.some((p) => p.es_oferta)) {
      setPestanaActiva('ofertas');
    } else {
      setPestanaActiva('catalogo');
    }
  }, [comercio]);

  if (!comercio) return null;

  const tieneCatalogo = Boolean(comercio.tiene_catalogo && comercio.productos && comercio.productos.length > 0);
  const nivel = comercio.nivel || 'standar';
  const maxOfertas = nivel === 'gold' ? 5 : nivel === 'premium' ? 2 : 0;
  const ofertas = (comercio.productos?.filter((p) => p.es_oferta) || []).slice(0, maxOfertas > 0 ? maxOfertas : undefined);
  const esFav = esFavorito(comercio.id);

  // Distancia calculada en tiempo real
  const distanciaKm = ubicacionReferencia
    ? calcularDistanciaKm(
        ubicacionReferencia.latitud,
        ubicacionReferencia.longitud,
        comercio.latitud,
        comercio.longitud
      )
    : null;
  const distanciaFormateada = distanciaKm !== null ? formatearDistancia(distanciaKm) : null;
  const tiempoEstimado = distanciaKm !== null ? estimarTiempo(distanciaKm) : null;
  
  const cleanPhone = comercio.telefono ? comercio.telefono.replace(/[^0-9+]/g, '') : '';
  const cleanWhatsapp = comercio.whatsapp ? comercio.whatsapp.replace(/[^0-9+]/g, '') : cleanPhone;

  // Enlace directo a WhatsApp con mensaje para el comercio
  const whatsappGeneralUrl = `https://wa.me/${cleanWhatsapp.replace('+', '')}?text=${encodeURIComponent(
    `¡Hola ${comercio.nombre}! Te contacto desde la app NeoFaro para hacerte una consulta.`
  )}`;

  // Enlace directo a WhatsApp para un producto puntual
  const getWhatsappProductoUrl = (producto: Producto) => {
    const precioTxt = producto.es_oferta && producto.precio_oferta
      ? `$${producto.precio_oferta.toLocaleString('es-AR')}`
      : `$${producto.precio.toLocaleString('es-AR')}`;

    const mensaje = `¡Hola ${comercio.nombre}! Vi en NeoFaro el producto "${producto.nombre}" (${precioTxt}) y quisiera consultar stock / disponibilidad.`;
    return `https://wa.me/${cleanWhatsapp.replace('+', '')}?text=${encodeURIComponent(mensaje)}`;
  };

  // Cálculo de totales del pedido estructurado
  const totalItemsEnPedido = Object.values(pedidoItems).reduce((sum, c) => sum + c, 0);
  const totalMontoPedido = Object.entries(pedidoItems).reduce((sum, [id, cant]) => {
    const prod = comercio.productos?.find((p) => p.id === id);
    if (!prod) return sum;
    const precio = prod.es_oferta && prod.precio_oferta ? prod.precio_oferta : prod.precio;
    return sum + precio * cant;
  }, 0);

  const generarMensajePedidoWp = () => {
    const lineas: string[] = [];
    lineas.push(`¡Hola ${comercio.nombre}! 👋 Quiero realizar un pedido desde la app NeoFaro:\n`);

    Object.entries(pedidoItems).forEach(([id, cant]) => {
      const prod = comercio.productos?.find((p) => p.id === id);
      if (prod) {
        const precio = prod.es_oferta && prod.precio_oferta ? prod.precio_oferta : prod.precio;
        lineas.push(`• ${cant}x ${prod.nombre} - $${(precio * cant).toLocaleString('es-AR')}`);
      }
    });

    lineas.push(
      `\n📌 Modalidad: ${
        modalidadPedido === 'mostrador'
          ? 'Retiro por mostrador'
          : 'Envío a domicilio (a coordinar entrega)'
      }`
    );
    lineas.push(`💰 Total estimado: $${totalMontoPedido.toLocaleString('es-AR')} (Precios de referencia)`);
    lineas.push(`\n¿Tienen disponibilidad para prepararlo? ¡Muchas gracias!`);

    return `https://wa.me/${cleanWhatsapp.replace('+', '')}?text=${encodeURIComponent(lineas.join('\n'))}`;
  };

  // Badge de Estado Operativo en tiempo real con soporte de trasnoche
  const infoHorario = verificarComercioAbierto(comercio);

  let estadoBadgeTexto = infoHorario.badgeTexto;
  let estadoBadgeClases = infoHorario.estaAbierto
    ? infoHorario.esTrasnoche
      ? 'bg-violet-950/80 text-violet-300 border-violet-500/50 shadow-sm shadow-violet-950/50'
      : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/60'
    : 'bg-zinc-900 text-zinc-400 border-zinc-800';

  if (comercio.cerrado_momentaneo) {
    estadoBadgeTexto = 'Cerrado Momentáneamente';
    estadoBadgeClases = 'bg-amber-950/60 text-amber-300 border-amber-800/60';
  } else if (comercio.en_vacaciones) {
    estadoBadgeTexto = 'En Receso por Vacaciones';
    estadoBadgeClases = 'bg-sky-950/60 text-sky-300 border-sky-800/60';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      {/* Contenedor Principal del Modal Split-View */}
      <div
        className="relative w-full max-w-5xl lg:max-w-6xl h-[92vh] sm:h-[88vh] bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col lg:grid lg:grid-cols-12 overflow-hidden text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================== */}
        {/* COLUMNA IZQUIERDA (PC/Tablet): Datos del Comercio y Contacto   */}
        {/* En móvil se visualiza como panel deslizable / sección de datos  */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border-b lg:border-b-0 lg:border-r border-zinc-800/80 p-5 sm:p-6 flex flex-col justify-between overflow-y-auto shrink-0 max-h-[45vh] lg:max-h-full">
          <div className="space-y-4">
            {/* Fila de Badges: Rubro, Nivel, Estado, Distancia y Botón de Favorito */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  {comercio.rubro}
                </span>

                {/* Insignia de Nivel */}
                {comercio.nivel === 'gold' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/40">
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    Gold
                  </span>
                )}
                {comercio.nivel === 'premium' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                    Premium
                  </span>
                )}

                {/* Estado Operativo */}
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoBadgeClases}`}>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      comercio.esta_abierto && !comercio.cerrado_momentaneo && !comercio.en_vacaciones
                        ? 'bg-emerald-400 animate-pulse'
                        : comercio.cerrado_momentaneo
                        ? 'bg-amber-400'
                        : comercio.en_vacaciones
                        ? 'bg-sky-400'
                        : 'bg-zinc-500'
                    }`}
                  />
                  {estadoBadgeTexto}
                </span>

                {/* Distancia Satelital GPS */}
                {distanciaFormateada && tiempoEstimado && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-950/70 border border-cyan-800/60 text-cyan-300">
                    <Navigation className="w-3 h-3 text-cyan-400" />
                    {distanciaFormateada} ({tiempoEstimado.aPie})
                  </span>
                )}
              </div>

              {/* Botón de Favorito */}
              <button
                type="button"
                onClick={() => toggleFavorito(comercio.id)}
                title={esFav ? 'Quitar de mis favoritos' : 'Guardar en mis locales favoritos'}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                  esFav
                    ? 'bg-rose-950/70 border-rose-500/60 text-rose-300 shadow-sm shadow-rose-950/40'
                    : 'bg-zinc-850 hover:bg-zinc-800 border-zinc-700/80 text-zinc-300 hover:text-rose-400'
                }`}
              >
                <Heart className={`w-4 h-4 ${esFav ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span className="hidden sm:inline">{esFav ? 'Favorito' : 'Guardar'}</span>
              </button>
            </div>

            {/* Distinción de Nivel (Prestigio barrial público, sin exponer el vencimiento del plan) */}
            {(comercio.nivel === 'gold' || comercio.nivel === 'premium') && (
              <div className="mt-1 mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    comercio.nivel === 'gold'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  }`}
                >
                  {comercio.nivel === 'gold' ? (
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Award className="w-3.5 h-3.5 text-purple-400" />
                  )}
                  <span>Comercio Destacado {comercio.nivel === 'gold' ? 'Gold' : 'Premium'}</span>
                </span>
              </div>
            )}

            {/* Nombre del Comercio */}
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white leading-tight">
                {comercio.nombre}
              </h2>
              {comercio.descripcion && (
                <p className="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
                  {comercio.descripcion}
                </p>
              )}
            </div>

            {/* BANNERS OPERATIVOS DESTACADOS */}
            {/* Banner: Farmacia de Turno */}
            {comercio.esta_de_turno && (
              <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-between text-emerald-200 text-xs shadow-md shadow-emerald-950/40">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-emerald-400 animate-pulse shrink-0" />
                  <div>
                    <span className="font-bold text-emerald-300 block text-xs">¡FARMACIA DE TURNO 24HS!</span>
                    <span className="text-[11px] text-emerald-200/90">Guardia continua de atención hoy en el barrio.</span>
                  </div>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 shrink-0">
                  24 HS
                </span>
              </div>
            )}

            {/* Banner: Cerrado por Emergencia con Caducidad Automática */}
            {comercio.cerrado_momentaneo && (
              <div className="p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/50 flex items-start gap-2.5 text-amber-200 text-xs shadow-sm">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-300 block">Cierre Temporal por Emergencia</span>
                  <p className="text-[11px] text-amber-200/90 leading-tight">
                    {comercio.motivo_cierre_momentaneo || 'Atención en pausa por inconvenientes operativos.'}
                  </p>
                  {comercio.reapertura_emergencia_programada && (
                    <div className="text-[11px] text-amber-300 font-mono flex items-center gap-1.5 pt-0.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Restablecimiento automático a horarios habituales: {new Date(comercio.reapertura_emergencia_programada).toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })} a las 06:00 hs.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Banner: En Vacaciones Programadas */}
            {comercio.en_vacaciones && (
              <div className="p-3.5 rounded-2xl bg-sky-950/60 border border-sky-500/50 flex items-start gap-2.5 text-sky-200 text-xs shadow-sm">
                <Palmtree className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-sky-300 block">Receso por Vacaciones Programadas</span>
                  <p className="text-[11px] text-sky-200/90 leading-tight">
                    {comercio.vacaciones_desde ? `Desde el ${new Date(comercio.vacaciones_desde).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}` : ''}
                    {comercio.vacaciones_hasta ? ` hasta el ${new Date(comercio.vacaciones_hasta).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })} (Día de Retorno)` : ''}
                    {comercio.mensaje_vacaciones ? ` — "${comercio.mensaje_vacaciones}"` : ''}
                  </p>
                  {comercio.vacaciones_hasta && (
                    <p className="text-[10.5px] text-sky-400 font-medium">
                      El local se volverá a visibilizar y abrir automáticamente en la fecha de retorno indicada.
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Tarjeta de Ubicación y Delivery */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-2 text-xs">
              <div className="flex items-start gap-2 text-zinc-300">
                {comercio.tipo_atencion === 'solo_envio' ? (
                  <>
                    <Bike className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold text-cyan-300 block">
                        {comercio.zona_envio_descripcion ? `Zona de entrega: ${comercio.zona_envio_descripcion}` : 'Servicio a domicilio sin atención al público'}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {comercio.localidad ? `Zona / Localidad: ${comercio.localidad}` : 'Dirección particular reservada por seguridad'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-semibold block">
                        {comercio.direccion}
                        {comercio.localidad && (
                          <span className="text-zinc-400 font-normal"> ({comercio.localidad})</span>
                        )}
                      </span>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${comercio.latitud},${comercio.longitud}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1 mt-0.5"
                      >
                        <ExternalLink className="w-3 h-3" /> Cómo llegar con Google Maps
                      </a>
                    </div>
                  </>
                )}
              </div>

              {Boolean(comercio.radio_entrega_metros && comercio.radio_entrega_metros > 0) && (
                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-cyan-300 text-[11px]">
                  <Bike className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Radio de entrega: {(comercio.radio_entrega_metros! / 1000).toFixed(1)} km a la redonda
                  </span>
                </div>
              )}

              {Boolean(comercio.cobertura_poligono && comercio.cobertura_poligono.length >= 3) && (
                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-amber-300 text-[11px]">
                  <Compass className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Zona de reparto delimitada en mapa (perímetro personalizado)</span>
                </div>
              )}
            </div>

            {/* Tarjeta de Horarios (Estructurados, Cortados o Continuos) */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-xs">
              <span className="text-zinc-400 font-semibold flex items-center gap-1.5 mb-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Horarios de Atención:
              </span>
              {comercio.horarios_config?.resumenFormateado ? (
                <div className="space-y-1.5 pl-1">
                  <p className="text-zinc-200 text-xs font-medium leading-relaxed">
                    {comercio.horarios_config.resumenFormateado}
                  </p>
                  <p className="text-[10px] text-cyan-400/80">
                    * Estado actual verificado en tiempo real con soporte de días especiales y trasnoche.
                  </p>
                </div>
              ) : comercio.tiene_horario_cortado ? (
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-400" /> Mañana
                    </span>
                    <span className="text-xs font-bold text-zinc-200 block mt-0.5">
                      {comercio.horario_manana || '08:30 - 13:00'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                      <Moon className="w-3 h-3 text-violet-400" /> Tarde
                    </span>
                    <span className="text-xs font-bold text-zinc-200 block mt-0.5">
                      {comercio.horario_tarde || '16:30 - 20:30'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-300 pl-5 leading-relaxed text-[11px]">
                  {comercio.horario || 'Consultar directamente con el comercio.'}
                </p>
              )}
            </div>

            {/* Presencia Digital & Redes Sociales */}
            {(comercio.sitio_web || comercio.instagram || comercio.tiktok || comercio.facebook || comercio.email || comercio.email_comercio || comercio.otros_links) && (
              <div className="p-3.5 rounded-2xl bg-zinc-900/70 border border-zinc-800 text-xs space-y-2">
                <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Presencia Digital & Contacto:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {comercio.sitio_web && (
                    <a
                      href={comercio.sitio_web.startsWith('http') ? comercio.sitio_web : `https://${comercio.sitio_web}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-cyan-500/50 text-cyan-300 text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Web
                    </a>
                  )}
                  {comercio.instagram && (
                    <a
                      href={comercio.instagram.startsWith('http') ? comercio.instagram : `https://instagram.com/${comercio.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-pink-500/50 text-pink-300 text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                    >
                      <span className="font-bold text-[10px]">IG</span>
                      {comercio.instagram.startsWith('@') ? comercio.instagram : `@${comercio.instagram.replace(/https?:\/\/(www\.)?instagram\.com\/?/, '')}`}
                    </a>
                  )}
                  {comercio.tiktok && (
                    <a
                      href={comercio.tiktok.startsWith('http') ? comercio.tiktok : `https://tiktok.com/@${comercio.tiktok.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-500 text-zinc-200 text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                    >
                      <span className="font-bold text-[10px]">TT</span>
                      TikTok
                    </a>
                  )}
                  {comercio.facebook && (
                    <a
                      href={comercio.facebook.startsWith('http') ? comercio.facebook : `https://facebook.com/${comercio.facebook}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-blue-500/50 text-blue-300 text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                    >
                      <span className="font-bold text-[10px]">FB</span>
                      Facebook
                    </a>
                  )}
                  {(comercio.email || comercio.email_comercio) && (
                    <a
                      href={`mailto:${comercio.email || comercio.email_comercio}`}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 text-indigo-300 text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                      title={comercio.email || comercio.email_comercio}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Email
                    </a>
                  )}
                  {comercio.otros_links && (
                    <a
                      href={comercio.otros_links.startsWith('http') ? comercio.otros_links : `https://${comercio.otros_links}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-cyan-500/50 text-zinc-300 text-[11px] font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                      Otros Links
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Botones de Acción (Llamar, WhatsApp, Mapa) */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-2 mt-4">
            {cleanWhatsapp && (
              comercio.en_vacaciones && comercio.modalidad_vacaciones === 'descanso_total' ? (
                <div className="w-full py-2.5 px-4 bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl border border-zinc-700 flex items-center justify-center gap-2 cursor-not-allowed text-center">
                  <Palmtree className="w-4 h-4 text-sky-400" />
                  Contacto en Pausa (Descanso Total)
                </div>
              ) : (
                <a
                  href={whatsappGeneralUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => registrarEvento('clic_whatsapp', comercio.id, comercio.nombre, { canal: 'modal_lateral' })}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 cursor-pointer no-underline"
                >
                  <MessageSquare className="w-4 h-4" />
                  Consultar o Pedir por WhatsApp
                </a>
              )
            )}

            <div className="flex items-center gap-2">
              {comercio.telefono && (
                <a
                  href={`tel:${cleanPhone}`}
                  onClick={() => registrarEvento('clic_llamada', comercio.id, comercio.nombre)}
                  className="flex-1 py-2 px-3 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 no-underline"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-400" />
                  Llamar ({cleanPhone})
                </a>
              )}

              <button
                type="button"
                onClick={() => {
                  onVerEnMapa(comercio);
                  onClose();
                }}
                className="flex-1 py-2 px-3 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                Ubicar en Mapa
              </button>
            </div>

            {/* Botón de Iniciar Debate / Reportar Inconveniente */}
            <button
              type="button"
              onClick={() => setModalDebateAbierto(true)}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900/90 hover:bg-amber-950/40 border border-zinc-800 hover:border-amber-700/50 text-zinc-400 hover:text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Reportar inconveniente / Abrir debate</span>
            </button>

            {/* Enlace discreto de Sugerir corrección */}
            {onReportar && (
              <div className="pt-1 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => onReportar(comercio)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded-lg hover:bg-zinc-800/60"
                  title="Sugerir corrección o reportar problema sobre este comercio"
                >
                  <Flag className="w-3 h-3 text-zinc-500" />
                  <span>Sugerir corrección de datos</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* COLUMNA DERECHA (PC/Tablet): El Escaparate Visual (Fotos/Ofertas) */}
        {/* En móvil ocupa la pantalla completa de forma prominente        */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 bg-zinc-950 flex flex-col h-full overflow-hidden flex-1">
          {/* Cabecera Superior del Escaparate: Pestañas y Botón Cerrar */}
          <div className="flex items-center justify-between border-b border-zinc-800/90 px-4 sm:px-6 py-2.5 bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
              {ofertas.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPestanaActiva('ofertas')}
                  className={`py-2 px-3 sm:px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                    pestanaActiva === 'ofertas'
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${pestanaActiva === 'ofertas' ? 'text-black' : 'text-amber-400'}`} />
                  Ofertas Especiales ({ofertas.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => setPestanaActiva('catalogo')}
                className={`py-2 px-3 sm:px-4 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                  pestanaActiva === 'catalogo'
                    ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                Catálogo ({comercio.productos?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setPestanaActiva('info')}
                className={`lg:hidden py-2 px-3 text-xs font-semibold rounded-xl flex items-center gap-1 transition-all cursor-pointer ${
                  pestanaActiva === 'info'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                Datos
              </button>
            </div>

            {/* Botón Cerrar (X) Destacado */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
              aria-label="Cerrar ventana de detalles"
              title="Cerrar (Esc)"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Área de Visualización de Productos y Fotos con Scroll Dedicado */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* VISTA 1: OFERTAS ESPECIALES CON FOTOS GRANDES */}
            {pestanaActiva === 'ofertas' && (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Promociones y Descuentos Activos
                    </h3>
                    <p className="text-xs text-zinc-400">
                      Precios promocionales y ofertas especiales vigentes en el local.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ofertas.map((producto) => (
                    <article
                      key={producto.id}
                      className="group bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 rounded-2xl overflow-hidden transition-all flex flex-col justify-between shadow-lg hover:shadow-amber-500/5"
                    >
                      {/* Imagen con Etiqueta de Descuento */}
                      <div className="relative w-full h-44 sm:h-48 bg-zinc-950 overflow-hidden">
                        {producto.imagen_url ? (
                          <img
                            src={producto.imagen_url}
                            alt={producto.nombre}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                            <ShoppingBag className="w-10 h-10" />
                          </div>
                        )}
                        <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-amber-500 text-black font-black text-xs shadow-md flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          {producto.descuento_porcentaje ? `${producto.descuento_porcentaje}% OFF` : 'OFERTA'}
                        </div>
                        <div className="absolute top-3 right-3 shadow-md">
                          <OfertaCountdown horaVencimiento={producto.hora_vencimiento_oferta} compact />
                        </div>
                        {producto.categoria && (
                          <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-[10px] font-semibold text-zinc-300 border border-white/10">
                            {producto.categoria}
                          </span>
                        )}
                      </div>

                      {/* Info de Producto y Precios */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-white group-hover:text-amber-300 transition-colors mb-1">
                            {producto.nombre}
                          </h4>
                          {producto.descripcion && (
                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                              {producto.descripcion}
                            </p>
                          )}
                        </div>

                        {/* Indicador en vivo de tiempo restante de la oferta */}
                        <div className="my-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 shadow-xs">
                          <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                            <span>Vence en:</span>
                          </span>
                          <OfertaCountdown horaVencimiento={producto.hora_vencimiento_oferta} compact />
                        </div>

                        <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                          <div>
                            {producto.precio_oferta && producto.precio_oferta < producto.precio && (
                              <span className="text-xs text-zinc-500 line-through mr-1.5 block">
                                ${producto.precio.toLocaleString('es-AR')}
                              </span>
                            )}
                            <span className="text-lg font-black text-amber-400 font-mono">
                              ${(producto.precio_oferta || producto.precio).toLocaleString('es-AR')}
                            </span>
                          </div>

                          {producto.agotado ? (
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-500 font-bold text-xs border border-zinc-700">
                              Agotado
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(producto.id, -1)}
                                disabled={!pedidoItems[producto.id]}
                                className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-20 text-white flex items-center justify-center cursor-pointer transition-colors"
                                title="Quitar unidad"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-mono font-bold text-xs text-white">
                                {pedidoItems[producto.id] || 0}
                              </span>
                              <button
                                type="button"
                                onClick={() => cambiarCantidad(producto.id, 1)}
                                className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold flex items-center justify-center cursor-pointer transition-colors"
                                title="Agregar al pedido"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* VISTA 2: CATÁLOGO COMPLETO DE ARTÍCULOS */}
            {pestanaActiva === 'catalogo' && (
              <div>
                {!tieneCatalogo ? (
                  <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/30">
                    <ShoppingBag className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                    <h4 className="text-base font-bold text-zinc-200 mb-1">
                      Catálogo en Digitalización
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                      Este comerciante aún no ha cargado sus productos digitales. Puedes comunicarte directamente por WhatsApp para consultar lista de precios y stock.
                    </p>
                    {cleanWhatsapp && (
                      <a
                        href={whatsappGeneralUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors no-underline shadow-md shadow-emerald-950/50"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Preguntar por WhatsApp
                      </a>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                          <ShoppingBag className="w-4 h-4 text-violet-400" />
                          Catálogo de Artículos y Precios
                        </h3>
                        <p className="text-xs text-zinc-400">
                          {comercio.productos?.length} artículos publicados — Precios de referencia
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[...(comercio.productos || [])]
                        .sort((a, b) => (a.agotado ? 1 : 0) - (b.agotado ? 1 : 0))
                        .map((producto) => (
                        <article
                          key={producto.id}
                          className={`group bg-zinc-900/90 border rounded-2xl overflow-hidden transition-all flex flex-col justify-between ${
                            producto.agotado ? 'border-zinc-800/50 opacity-60' : 'border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          {/* Foto de Producto */}
                          {producto.imagen_url && (
                            <div className="relative w-full h-40 sm:h-44 bg-zinc-950 overflow-hidden">
                              <img
                                src={producto.imagen_url}
                                alt={producto.nombre}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                              {producto.es_oferta && (
                                <>
                                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-amber-500 text-black font-black text-[11px] shadow-lg flex items-center gap-1">
                                    <Tag className="w-3 h-3" />
                                    OFERTA
                                  </div>
                                  <div className="absolute top-2.5 right-2.5 shadow-md">
                                    <OfertaCountdown horaVencimiento={producto.hora_vencimiento_oferta} compact />
                                  </div>
                                </>
                              )}
                              {producto.categoria && (
                                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-sm text-[10px] font-semibold text-zinc-300">
                                  {producto.categoria}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="p-4 flex-1 flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-sm text-white group-hover:text-violet-300 transition-colors mb-1">
                                {producto.nombre}
                              </h4>
                              {producto.descripcion && (
                                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-2">
                                  {producto.descripcion}
                                </p>
                              )}
                            </div>

                            {/* Indicador en vivo si el artículo tiene oferta activa */}
                            {producto.es_oferta && (
                              <div className="my-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2 shadow-xs">
                                <span className="text-[11px] font-semibold text-amber-300 flex items-center gap-1.5">
                                  <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                                  <span>Oferta disponible:</span>
                                </span>
                                <OfertaCountdown horaVencimiento={producto.hora_vencimiento_oferta} compact />
                              </div>
                            )}

                            <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                              <div>
                                {producto.es_oferta && producto.precio_oferta ? (
                                  <>
                                    <span className="text-xs text-zinc-500 line-through mr-1.5 block">
                                      ${producto.precio.toLocaleString('es-AR')}
                                    </span>
                                    <span className="text-lg font-black text-amber-400 font-mono">
                                      ${producto.precio_oferta.toLocaleString('es-AR')}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-lg font-bold text-white font-mono">
                                    ${producto.precio.toLocaleString('es-AR')}
                                  </span>
                                )}
                              </div>

                              {producto.agotado ? (
                                <span className="px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-500 font-bold text-xs border border-zinc-700">
                                  Agotado
                                </span>
                              ) : (
                                <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                                  <button
                                    type="button"
                                    onClick={() => cambiarCantidad(producto.id, -1)}
                                    disabled={!pedidoItems[producto.id]}
                                    className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-20 text-white flex items-center justify-center cursor-pointer transition-colors"
                                    title="Quitar unidad"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center font-mono font-bold text-xs text-white">
                                    {pedidoItems[producto.id] || 0}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => cambiarCantidad(producto.id, 1)}
                                    className="w-7 h-7 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold flex items-center justify-center cursor-pointer transition-colors"
                                    title="Agregar al pedido"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* VISTA 3: DATOS DEL LOCAL (Accesible desde móvil o cuando se selecciona Datos) */}
            {pestanaActiva === 'info' && (
              <div className="space-y-4 text-xs text-zinc-300">
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-violet-400" />
                    Dirección y Localización
                  </h4>
                  <p className="text-zinc-200">
                    {comercio.direccion}
                    {comercio.localidad && (
                      <span className="text-zinc-400"> — {comercio.localidad}</span>
                    )}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${comercio.latitud},${comercio.longitud}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold inline-flex items-center gap-1.5 no-underline mt-2 shadow-md shadow-cyan-950/40"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Abrir en Google Maps
                  </a>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <h4 className="font-bold text-sm text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" />
                    Horarios de Atención
                  </h4>
                  {comercio.tiene_horario_cortado ? (
                    <div className="space-y-1">
                      <p>🌅 Turno Mañana: <strong>{comercio.horario_manana || '08:30 - 13:00'}</strong></p>
                      <p>🌆 Turno Tarde: <strong>{comercio.horario_tarde || '16:30 - 20:30'}</strong></p>
                    </div>
                  ) : (
                    <p>{comercio.horario || 'Consultar con el comercio.'}</p>
                  )}
                </div>

                {/* Enlaces y Redes Sociales en la Ficha */}
                {(comercio.sitio_web || comercio.instagram || comercio.tiktok || comercio.facebook || comercio.email || comercio.email_comercio || comercio.otros_links) && (
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2.5">
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-cyan-400" />
                      Redes Sociales y Enlaces Oficiales
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {comercio.sitio_web && (
                        <a
                          href={comercio.sitio_web.startsWith('http') ? comercio.sitio_web : `https://${comercio.sitio_web}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-cyan-500/50 text-cyan-300 font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                        >
                          <Globe className="w-3.5 h-3.5" />
                          Sitio Web
                        </a>
                      )}
                      {comercio.instagram && (
                        <a
                          href={comercio.instagram.startsWith('http') ? comercio.instagram : `https://instagram.com/${comercio.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-pink-500/50 text-pink-300 font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                        >
                          Instagram ({comercio.instagram})
                        </a>
                      )}
                      {comercio.tiktok && (
                        <a
                          href={comercio.tiktok.startsWith('http') ? comercio.tiktok : `https://tiktok.com/@${comercio.tiktok.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                        >
                          TikTok ({comercio.tiktok})
                        </a>
                      )}
                      {comercio.facebook && (
                        <a
                          href={comercio.facebook.startsWith('http') ? comercio.facebook : `https://facebook.com/${comercio.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-blue-500/50 text-blue-300 font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                        >
                          Facebook
                        </a>
                      )}
                      {(comercio.email || comercio.email_comercio) && (
                        <a
                          href={`mailto:${comercio.email || comercio.email_comercio}`}
                          className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-indigo-500/50 text-indigo-300 font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {comercio.email || comercio.email_comercio}
                        </a>
                      )}
                      {comercio.otros_links && (
                        <a
                          href={comercio.otros_links.startsWith('http') ? comercio.otros_links : `https://${comercio.otros_links}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 font-medium inline-flex items-center gap-1.5 transition-colors no-underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Más Enlaces
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  {comercio.telefono && (
                    <a
                      href={`tel:${cleanPhone}`}
                      className="flex-1 py-3 px-4 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 no-underline transition-colors"
                    >
                      <Phone className="w-4 h-4 text-zinc-400" />
                      Llamar ({cleanPhone})
                    </a>
                  )}

                  {cleanWhatsapp && (
                    <a
                      href={whatsappGeneralUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 no-underline transition-colors shadow-lg shadow-emerald-950/50"
                    >
                      <MessageSquare className="w-4 h-4" />
                      WhatsApp
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Barra de Pedido en 1 Clic por WhatsApp */}
          {totalItemsEnPedido > 0 && (
            <div className="p-3.5 sm:p-4 bg-zinc-950/95 backdrop-blur-md border-t border-cyan-500/30 rounded-b-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 font-black flex items-center justify-center text-xs border border-cyan-500/30 shadow-sm">
                    {totalItemsEnPedido}
                  </span>
                  <div>
                    <span className="text-sm font-black text-white block font-mono">
                      ${totalMontoPedido.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] text-zinc-400">Precios de referencia</span>
                  </div>
                </div>

                <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setModalidadPedido('mostrador')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      modalidadPedido === 'mostrador' ? 'bg-cyan-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Mostrador
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalidadPedido('envio')}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                      modalidadPedido === 'envio' ? 'bg-cyan-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Envío
                  </button>
                </div>
              </div>

              {cleanWhatsapp ? (
                <a
                  href={generarMensajePedidoWp()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-2 transition-all no-underline"
                >
                  <Send className="w-4 h-4" />
                  <span>Pedir por WhatsApp en 1 Clic</span>
                </a>
              ) : (
                <span className="text-xs text-zinc-400 italic">WhatsApp no disponible</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Debate e Inconveniente (Privado) */}
      {modalDebateAbierto && (
        <ModalCrearDebate
          comercio={comercio}
          onClose={() => setModalDebateAbierto(false)}
        />
      )}
    </div>
  );
}
