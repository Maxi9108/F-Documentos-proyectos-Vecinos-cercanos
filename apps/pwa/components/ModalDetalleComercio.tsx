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
} from 'lucide-react';
import { registrarEvento } from '@/lib/analytics';
import { useUser } from '@/context/user-context';
import { calcularDistanciaKm, formatearDistancia, estimarTiempo } from '@/lib/geolocation';
import { verificarComercioAbierto } from '@/lib/horarios';
import ContadorMembresia from '@/components/ContadorMembresia';
import ModalCrearDebate from '@/components/ModalCrearDebate';

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

  React.useEffect(() => {
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

            {/* Contador de tiempo para comercios Premium y Gold (1 mes) */}
            {(comercio.nivel === 'gold' || comercio.nivel === 'premium') && (
              <ContadorMembresia
                fechaVencimiento={comercio.fecha_vencimiento_nivel}
                nivel={comercio.nivel}
                formato="tarjeta"
                className="mt-1 mb-2"
              />
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
                <MapPin className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block">{comercio.direccion}</span>
                  {comercio.tipo_atencion === 'solo_envio' ? (
                    <span className="text-[11px] text-cyan-400 italic">Venta y despacho exclusivo a domicilio</span>
                  ) : (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${comercio.latitud},${comercio.longitud}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" /> Cómo llegar con Google Maps
                    </a>
                  )}
                </div>
              </div>

              {Boolean(comercio.radio_entrega_metros && comercio.radio_entrega_metros > 0) && (
                <div className="pt-2 border-t border-zinc-800/80 flex items-center gap-2 text-cyan-300 text-[11px]">
                  <Bike className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Radio de entrega: {(comercio.radio_entrega_metros! / 1000).toFixed(1)} km a la redonda
                  </span>
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
          </div>

          {/* Botones de Acción (Llamar, WhatsApp, Mapa) */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-2 mt-4">
            {cleanWhatsapp && (
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
                            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                              {producto.descripcion}
                            </p>
                          )}
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

                          {cleanWhatsapp && (
                            <a
                              href={getWhatsappProductoUrl(producto)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 no-underline shadow-md shadow-emerald-950/40"
                              title="Pedir esta oferta por WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              Pedir
                            </a>
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
                          {comercio.productos?.length} artículos publicados
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {comercio.productos?.map((producto) => (
                        <article
                          key={producto.id}
                          className="group bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 rounded-2xl overflow-hidden transition-all flex flex-col justify-between"
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
                                <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-lg bg-amber-500 text-black font-black text-[11px] shadow-lg flex items-center gap-1">
                                  <Tag className="w-3 h-3" />
                                  OFERTA
                                </div>
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
                                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                                  {producto.descripcion}
                                </p>
                              )}
                            </div>

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

                              {cleanWhatsapp && (
                                <a
                                  href={getWhatsappProductoUrl(producto)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 px-3 rounded-xl bg-zinc-800 hover:bg-emerald-600 text-zinc-200 hover:text-white font-semibold text-xs transition-colors flex items-center gap-1.5 no-underline cursor-pointer"
                                  title="Consultar por este artículo"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  Consultar
                                </a>
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
                  <p className="text-zinc-200">{comercio.direccion}</p>
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

                {cleanWhatsapp && (
                  <a
                    href={whatsappGeneralUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 no-underline"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Contactar por WhatsApp
                  </a>
                )}
              </div>
            )}
          </div>
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
