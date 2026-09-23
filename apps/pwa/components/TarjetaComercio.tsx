'use client';

import React from 'react';
import { Comercio, NivelComercio } from '@/types/comercio';
import {
  Phone,
  MapPin,
  Navigation,
  ShoppingBag,
  Sparkles,
  MessageSquare,
  Bike,
  Truck,
  Compass,
  Crown,
  Award,
  Pill,
  Sun,
  Moon,
  AlertCircle,
  Palmtree,
  Clock,
  Heart,
} from 'lucide-react';
import { registrarEvento } from '@/lib/analytics';
import { useUser } from '@/context/user-context';
import { calcularDistanciaKm, formatearDistancia, estimarTiempo } from '@/lib/geolocation';

interface TarjetaComercioProps {
  comercio: Comercio;
  isSelected?: boolean;
  onVerEnMapa: (comercio: Comercio) => void;
  onOpenDetalle: (comercio: Comercio) => void;
}

export default function TarjetaComercio({
  comercio,
  isSelected = false,
  onVerEnMapa,
  onOpenDetalle,
}: TarjetaComercioProps) {
  const cleanPhone = comercio.telefono ? comercio.telefono.replace(/[^0-9+]/g, '') : '';
  const cleanWhatsapp = comercio.whatsapp ? comercio.whatsapp.replace(/[^0-9+]/g, '') : cleanPhone;
  const nivel: NivelComercio = comercio.nivel || 'standar';

  const { esFavorito, toggleFavorito, ubicacionReferencia } = useUser();
  const esFav = esFavorito(comercio.id);

  // Distancia en tiempo real desde la ubicación de referencia (GPS o Casa/Trabajo)
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
  
  // Ofertas visibles solo si el comercio es Premium o Gold
  const ofertasPermitidas = nivel === 'gold' ? 5 : nivel === 'premium' ? 2 : 0;
  const ofertas = (comercio.productos?.filter((p) => p.es_oferta) || []).slice(0, ofertasPermitidas);
  const tieneEnvios = Boolean(comercio.radio_entrega_metros && comercio.radio_entrega_metros > 0);

  // Determinar clases de borde y sombreado según Nivel y Selección
  let bordeClases = 'border-zinc-800/80 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/50';
  if (isSelected) {
    bordeClases = 'border-violet-500 shadow-xl ring-2 ring-cyan-500/30 bg-zinc-900';
  } else if (nivel === 'gold') {
    bordeClases = 'border-amber-500/40 hover:border-amber-500 shadow-md shadow-amber-950/20';
  } else if (nivel === 'premium') {
    bordeClases = 'border-purple-500/40 hover:border-purple-500 shadow-md shadow-purple-950/20';
  }

  // Estado operativo legible
  let estadoBadgeTexto = comercio.esta_abierto ? 'Abierto' : 'Cerrado';
  let estadoBadgeClases = comercio.esta_abierto
    ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
    : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60';

  if (comercio.cerrado_momentaneo) {
    estadoBadgeTexto = 'Pausa Mom.';
    estadoBadgeClases = 'bg-amber-950/60 text-amber-300 border-amber-800/60';
  } else if (comercio.en_vacaciones) {
    estadoBadgeTexto = 'Vacaciones';
    estadoBadgeClases = 'bg-sky-950/60 text-sky-300 border-sky-800/60';
  }

  return (
    <article
      id={`comercio-${comercio.id}`}
      className={`group relative rounded-2xl p-5 transition-all duration-300 bg-zinc-900/90 border flex flex-col justify-between shadow-md ${bordeClases}`}
    >
      <div>
        {/* Cabecera: Rubro, Nivel, Estado y Botón de Favorito */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-violet-950/60 text-violet-300 border border-violet-800/40">
              {comercio.rubro}
            </span>

            {/* Insignia Gold / Premium */}
            {nivel === 'gold' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-950/40">
                <Crown className="w-3 h-3 text-amber-400" />
                Gold
              </span>
            )}
            {nivel === 'premium' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                <Award className="w-3 h-3 text-purple-400" />
                Premium
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {ofertas.length > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Sparkles className="w-3 h-3 text-amber-400" />
                {ofertas.length} {ofertas.length === 1 ? 'oferta' : 'ofertas'}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border ${estadoBadgeClases}`}>
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

            {/* Botón de Guardar en Favoritos */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorito(comercio.id);
              }}
              title={esFav ? 'Quitar de mis favoritos' : 'Guardar en mis locales favoritos'}
              className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                esFav
                  ? 'bg-rose-950/60 border-rose-500/60 text-rose-400 shadow-sm shadow-rose-950/40'
                  : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400 hover:text-rose-400 hover:border-zinc-600'
              }`}
            >
              <Heart
                className={`w-4 h-4 transition-transform ${
                  esFav ? 'fill-rose-500 text-rose-500 scale-110' : 'hover:scale-110'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Destacado: Farmacia de Turno 24hs */}
        {comercio.esta_de_turno && (
          <div className="mb-2.5 p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-center justify-between shadow-sm shadow-emerald-950/40">
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-emerald-400 animate-pulse" />
              ¡FARMACIA DE TURNO 24HS!
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200">
              Atención Continua
            </span>
          </div>
        )}

        {/* Banner: Cerrado momentáneamente */}
        {comercio.cerrado_momentaneo && (
          <div className="mb-2.5 p-2 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="leading-tight">
              <strong>Cerrado momentáneamente:</strong> {comercio.motivo_cierre_momentaneo || 'Inconveniente imprevisto.'}
            </span>
          </div>
        )}

        {/* Banner: Cerrado por Vacaciones */}
        {comercio.en_vacaciones && (
          <div className="mb-2.5 p-2 rounded-xl bg-sky-950/50 border border-sky-500/40 text-sky-200 text-xs flex items-center gap-2">
            <Palmtree className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="leading-tight">
              <strong>De vacaciones</strong> {comercio.vacaciones_hasta ? `hasta el ${comercio.vacaciones_hasta}` : ''}
              {comercio.mensaje_vacaciones ? ` — "${comercio.mensaje_vacaciones}"` : ''}
            </span>
          </div>
        )}

        {/* Badge de Modalidad de Atención */}
        {comercio.tipo_atencion === 'solo_envio' ? (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-[11px] font-bold">
              <Bike className="w-3.5 h-3.5" />
              Solo Envíos a Domicilio
            </span>
          </div>
        ) : comercio.tipo_atencion === 'ambos' ? (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-950/70 border border-indigo-800/60 text-indigo-300 text-[11px] font-bold">
              <Truck className="w-3.5 h-3.5" />
              Local a la Calle y Delivery
            </span>
          </div>
        ) : null}

        {/* Nombre del Comercio */}
        <h3
          onClick={() => onOpenDetalle(comercio)}
          className="text-lg font-bold text-white mb-1.5 group-hover:text-indigo-400 transition-colors cursor-pointer"
        >
          {comercio.nombre}
        </h3>

        {/* Descripción corta si existe */}
        {comercio.descripcion && (
          <p className="text-xs text-zinc-400 line-clamp-2 mb-3 leading-relaxed">
            {comercio.descripcion}
          </p>
        )}

        {/* Horarios (Cortados o Continuos) */}
        <div className="mb-3 p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/60 text-xs text-zinc-300">
          {comercio.tiene_horario_cortado ? (
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Horario Cortado:</span>
              <div className="flex items-center justify-between text-[11px] text-zinc-300">
                <span className="flex items-center gap-1">
                  <Sun className="w-3 h-3 text-amber-400" />
                  Mañana: {comercio.horario_manana || '08:30 - 13:00'}
                </span>
                <span className="flex items-center gap-1">
                  <Moon className="w-3 h-3 text-indigo-400" />
                  Tarde: {comercio.horario_tarde || '16:30 - 20:30'}
                </span>
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-[11px] text-zinc-400">
              <Clock className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>{comercio.horario || 'Horario no especificado'}</span>
            </p>
          )}
        </div>

        {/* Zona de Cobertura de Envíos */}
        {tieneEnvios && (
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800/90 text-xs text-zinc-300 space-y-1 mb-3.5">
            <p className="flex items-center gap-1.5 font-semibold text-cyan-300">
              <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Zona de entrega: {(comercio.radio_entrega_metros! / 1000).toFixed(1)} km de radio</span>
            </p>
            {comercio.zona_envio_descripcion && (
              <p className="text-[11px] text-zinc-400 pl-5 leading-tight">
                {comercio.zona_envio_descripcion}
              </p>
            )}
          </div>
        )}

        {/* Datos de contacto y ubicación */}
        <div className="space-y-1.5 text-xs text-zinc-400 mb-4">
          <p className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
            <span className="leading-snug text-zinc-300">{comercio.direccion}</span>
          </p>

          {/* Distancia Satelital GPS / Ubicación de Referencia */}
          {distanciaFormateada && tiempoEstimado && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 text-[11px] font-bold shadow-sm">
                <Navigation className="w-3 h-3 text-cyan-400" />
                <span>{distanciaFormateada}</span>
                <span className="text-cyan-400/80 font-normal">({tiempoEstimado.aPie})</span>
              </span>
            </div>
          )}

          {comercio.telefono && (
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-zinc-500 shrink-0" />
              <a
                href={`tel:${cleanPhone}`}
                className="hover:underline hover:text-cyan-400 text-zinc-400"
              >
                {comercio.telefono}
              </a>
            </p>
          )}
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="pt-3 border-t border-zinc-800/80 space-y-2">
        {/* Botón principal: Catálogo o Ficha */}
        <button
          type="button"
          onClick={() => onOpenDetalle(comercio)}
          className={`w-full py-2 px-3 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
            comercio.tiene_catalogo
              ? 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white shadow-md shadow-violet-950/50'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          {comercio.tiene_catalogo
            ? `Ver Catálogo y Precios (${comercio.productos?.length || 0})`
            : 'Ver Detalles del Comercio'}
        </button>

        {/* Botones secundarios: Ubicar en mapa / WhatsApp / Tel */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onVerEnMapa(comercio)}
            className={`flex-1 py-1.5 px-2.5 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              isSelected
                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                : 'bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            <Navigation className="w-3 h-3 text-cyan-400" />
            {tieneEnvios ? 'Ver radio en mapa' : 'Ubicar en mapa'}
          </button>

          {cleanWhatsapp && (
            <a
              href={`https://wa.me/${cleanWhatsapp.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => registrarEvento('clic_whatsapp', comercio.id, comercio.nombre, { canal: 'tarjeta_directa' })}
              title="Pedir por WhatsApp"
              className="p-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition-colors flex items-center justify-center cursor-pointer no-underline shadow-md shadow-emerald-950/40"
            >
              <MessageSquare className="w-4 h-4" />
            </a>
          )}

          {comercio.telefono && (
            <a
              href={`tel:${cleanPhone}`}
              onClick={() => registrarEvento('clic_llamada', comercio.id, comercio.nombre)}
              title="Llamar al local"
              className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center justify-center no-underline"
            >
              <Phone className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
