'use client';

import React, { useState, useMemo } from 'react';
import { Comercio, Producto } from '@/types/comercio';
import { Sparkles, Tag, Store, MapPin, MessageSquare, ShoppingBag, ArrowRight, Crown, Award } from 'lucide-react';
import OfertaCountdown from '@/components/OfertaCountdown';

interface OfertaConComercio {
  producto: Producto;
  comercio: Comercio;
}

interface PaletaOfertasProps {
  comercios: Comercio[];
  onSelectComercio: (comercio: Comercio) => void;
  onVerEnMapa: (comercio: Comercio) => void;
}

export default function PaletaOfertas({
  comercios,
  onSelectComercio,
  onVerEnMapa,
}: PaletaOfertasProps) {
  const [rubroFiltro, setRubroFiltro] = useState('Todos');

  // Recolectar todas las ofertas activas vinculadas con su comercio
  const todasLasOfertas = useMemo(() => {
    const listado: OfertaConComercio[] = [];
    comercios.forEach((comercio) => {
      // Regla de Negocio: Solo Premium (hasta 2) y Gold (hasta 5) pueden publicar ofertas en la paleta
      const nivel = comercio.nivel || 'standar';
      if (nivel === 'standar') return;

      const maxOfertas = nivel === 'gold' ? 5 : 2;

      if (comercio.productos && comercio.productos.length > 0) {
        comercio.productos
          .filter((p) => p.es_oferta)
          .slice(0, maxOfertas)
          .forEach((producto) => {
            listado.push({ producto, comercio });
          });
      }
    });

    // Ordenar ofertas: Gold primero, luego Premium
    listado.sort((a, b) => {
      const pesoA = a.comercio.nivel === 'gold' ? 2 : 1;
      const pesoB = b.comercio.nivel === 'gold' ? 2 : 1;
      return pesoB - pesoA;
    });

    return listado;
  }, [comercios]);

  // Rubros disponibles en ofertas
  const rubrosConOfertas = useMemo(() => {
    const setRubros = new Set<string>();
    todasLasOfertas.forEach((item) => setRubros.add(item.comercio.rubro));
    return ['Todos', ...Array.from(setRubros)];
  }, [todasLasOfertas]);

  // Filtrado por rubro seleccionado
  const ofertasFiltradas = useMemo(() => {
    if (rubroFiltro === 'Todos') return todasLasOfertas;
    return todasLasOfertas.filter((item) => item.comercio.rubro === rubroFiltro);
  }, [todasLasOfertas, rubroFiltro]);

  return (
    <div className="space-y-6">
      {/* Encabezado de la Paleta de Ofertas */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-violet-950/40 border border-amber-500/20 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Paleta de Descuentos Barriales
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Ofertas y Promociones del Barrio
          </h2>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg">
            Descubre todas las promociones activas publicadas por tus comerciantes vecinos. Precios especiales, combos y descuentos directos.
          </p>
        </div>

        <div className="px-4 py-2 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-center shrink-0">
          <span className="block text-2xl font-black text-amber-400 font-mono">
            {todasLasOfertas.length}
          </span>
          <span className="text-[11px] text-zinc-400 font-medium uppercase tracking-wider">
            Ofertas Activas
          </span>
        </div>
      </div>

      {/* Chips de filtro por rubro */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {rubrosConOfertas.map((rubro) => {
          const isSelected = rubroFiltro === rubro;
          const cantidad =
            rubro === 'Todos'
              ? todasLasOfertas.length
              : todasLasOfertas.filter((o) => o.comercio.rubro === rubro).length;

          return (
            <button
              key={rubro}
              type="button"
              onClick={() => setRubroFiltro(rubro)}
              className={`whitespace-nowrap px-4 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <span>{rubro}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isSelected ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {cantidad}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grilla visual de Ofertas */}
      {ofertasFiltradas.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-3xl bg-zinc-900/50 border border-zinc-800">
          <Tag className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
          <h3 className="font-bold text-base text-zinc-200 mb-1">
            No hay ofertas en este rubro
          </h3>
          <p className="text-xs text-zinc-400">
            Intenta seleccionando &quot;Todos&quot; para ver todas las promociones del barrio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ofertasFiltradas.map(({ producto, comercio }) => {
            const cleanWhatsapp = comercio.whatsapp
              ? comercio.whatsapp.replace(/[^0-9+]/g, '')
              : comercio.telefono
              ? comercio.telefono.replace(/[^0-9+]/g, '')
              : '';

            const precioTxt = producto.precio_oferta
              ? `$${producto.precio_oferta.toLocaleString('es-AR')}`
              : `$${producto.precio.toLocaleString('es-AR')}`;

            const mensajeWp = `¡Hola ${comercio.nombre}! Vi la oferta de "${producto.nombre}" en NeoFaro (${precioTxt}) y quiero encargarla / consultar stock.`;
            const wpUrl = `https://wa.me/${cleanWhatsapp.replace('+', '')}?text=${encodeURIComponent(mensajeWp)}`;

            return (
              <article
                key={producto.id}
                className="group relative rounded-3xl bg-zinc-900/80 border border-zinc-800/80 hover:border-amber-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-amber-500/5"
              >
                {/* Imagen de la oferta con etiqueta de descuento */}
                {producto.imagen_url ? (
                  <div className="relative w-full h-48 bg-zinc-950 overflow-hidden">
                    <img
                      src={producto.imagen_url}
                      alt={producto.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-xl bg-amber-500 text-black font-black text-xs shadow-lg flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      {producto.descuento_porcentaje ? `${producto.descuento_porcentaje}% OFF` : 'OFERTA'}
                    </div>
                    <div className="absolute top-3 right-3">
                      <OfertaCountdown horaVencimiento={producto.hora_vencimiento_oferta} compact />
                    </div>

                    {/* Badge del Comercio */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-1">
                      <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] font-semibold text-zinc-200 border border-white/10 flex items-center gap-1.5 truncate">
                        {comercio.nivel === 'gold' ? (
                          <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        ) : comercio.nivel === 'premium' ? (
                          <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        ) : (
                          <Store className="w-3 h-3 text-cyan-400 shrink-0" />
                        )}
                        <span className="truncate">{comercio.nombre}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-violet-600/80 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider shrink-0">
                        {comercio.rubro}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-950/70 border-b border-zinc-800/80 flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-zinc-900 text-[11px] font-semibold text-zinc-200 border border-zinc-800 flex items-center gap-1.5 truncate">
                      {comercio.nivel === 'gold' ? (
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      ) : comercio.nivel === 'premium' ? (
                        <Award className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      ) : (
                        <Store className="w-3 h-3 text-cyan-400 shrink-0" />
                      )}
                      <span className="truncate">{comercio.nombre}</span>
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500 text-black font-black text-xs flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {producto.descuento_porcentaje ? `${producto.descuento_porcentaje}% OFF` : 'OFERTA'}
                    </span>
                  </div>
                )}

                {/* Información del producto y precios */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-base text-white mb-1.5 group-hover:text-amber-400 transition-colors">
                      {producto.nombre}
                    </h3>
                    {producto.descripcion && (
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mb-3">
                        {producto.descripcion}
                      </p>
                    )}
                  </div>

                  <div>
                    {/* Countdown dinámico */}
                    <div className="mb-3">
                      <OfertaCountdown horaVencimiento={producto.hora_vencimiento_oferta} className="w-full justify-center" />
                    </div>

                    {/* Precios */}
                    <div className="pt-3 border-t border-zinc-800/80 flex items-baseline justify-between mb-4">
                      <div>
                        <span className="text-xs text-zinc-500 line-through mr-2">
                          ${producto.precio.toLocaleString('es-AR')}
                        </span>
                        <span className="text-xl font-black text-amber-400 font-mono">
                          ${(producto.precio_oferta || producto.precio).toLocaleString('es-AR')}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-400">
                        {comercio.esta_abierto ? 'Comercio Abierto' : 'Cerrado por ahora'}
                      </span>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectComercio(comercio)}
                        className="flex-1 py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                        Ver Comercio
                      </button>

                      {cleanWhatsapp && (
                        <a
                          href={wpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 no-underline shadow-md shadow-emerald-950/40"
                          title="Pedir o consultar por WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Pedir
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
