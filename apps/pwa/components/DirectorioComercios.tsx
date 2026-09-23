'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Comercio } from '@/types/comercio';
import FiltrosYBusqueda from './FiltrosYBusqueda';
import MapaWrapper from './MapaWrapper';
import TarjetaComercio from './TarjetaComercio';
import ModalDetalleComercio from './ModalDetalleComercio';
import PaletaOfertas from './PaletaOfertas';
import { Map, List, Store, Sparkles, Navigation } from 'lucide-react';

import { registrarEvento } from '@/lib/analytics';
import { useUser } from '@/context/user-context';
import { calcularDistanciaKm } from '@/lib/geolocation';

interface DirectorioComerciosProps {
  initialComercios: Comercio[];
}

export default function DirectorioComercios({
  initialComercios,
}: DirectorioComerciosProps) {
  // Pestaña principal activa: 'directorio' (Mapa + Lista) o 'ofertas' (Paleta de Ofertas)
  const [seccionActiva, setSeccionActiva] = useState<'directorio' | 'ofertas'>('directorio');

  // Estado con lista de comercios sincronizada con localStorage
  const [comercios, setComercios] = useState<Comercio[]>(initialComercios);

  useEffect(() => {
    registrarEvento('visita_portal');
  }, []);

  useEffect(() => {
    try {
      const localesRaw = localStorage.getItem('vecinos_comercios_nuevos');
      if (localesRaw) {
        const locales: Comercio[] = JSON.parse(localesRaw);
        if (locales.length > 0) {
          setComercios((prev) => {
            const combinados = [...prev];
            locales.forEach((nuevo) => {
              const idx = combinados.findIndex((c) => c.id === nuevo.id);
              if (idx >= 0) {
                combinados[idx] = nuevo;
              } else {
                combinados.unshift(nuevo);
              }
            });
            return combinados;
          });
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }, []);

  const [busqueda, setBusqueda] = useState('');
  const [rubroSeleccionado, setRubroSeleccionado] = useState('Todos');
  const [soloAbiertos, setSoloAbiertos] = useState(false);
  const [soloTurno, setSoloTurno] = useState(false);
  const [comercioSeleccionado, setComercioSeleccionado] = useState<Comercio | null>(null);
  const [comercioModal, setComercioModal] = useState<Comercio | null>(null);
  const [vistaMovil, setVistaMovil] = useState<'ambos' | 'mapa' | 'lista'>('ambos');

  const {
    favoritosIds,
    esFavorito,
    ubicacionReferencia,
    gpsActivo,
    activarGps,
  } = useUser();

  const [soloFavoritos, setSoloFavoritos] = useState(false);
  const [cercaDeMi, setCercaDeMi] = useState(false);
  const [radioKm, setRadioKm] = useState<number | null>(null);

  // Sincronizar cercaDeMi si el GPS satelital se activa externamente
  useEffect(() => {
    if (gpsActivo) {
      setCercaDeMi(true);
    }
  }, [gpsActivo]);

  const handleCercaDeMiChange = async (activar: boolean) => {
    setCercaDeMi(activar);
    if (activar && !gpsActivo && !ubicacionReferencia) {
      await activarGps();
    }
  };

  // Registrar búsqueda con debounce
  useEffect(() => {
    if (busqueda.trim().length >= 3) {
      const timer = setTimeout(() => {
        registrarEvento('busqueda_realizada', undefined, undefined, { query: busqueda.trim() });
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [busqueda]);

  // Solo comercios con estado aprobado (o sin campo de moderación previa) son públicos
  const comerciosAprobados = useMemo(() => {
    return comercios.filter((c) => !c.estado_aprobacion || c.estado_aprobacion === 'aprobado');
  }, [comercios]);

  // Calcular cantidad total de ofertas en todos los comercios aprobados
  const totalOfertas = useMemo(() => {
    let cuenta = 0;
    comerciosAprobados.forEach((c) => {
      if (c.productos) {
        cuenta += c.productos.filter((p) => p.es_oferta).length;
      }
    });
    return cuenta;
  }, [comerciosAprobados]);

  // Rubros únicos y conteos
  const rubrosDisponibles = useMemo(() => {
    const conteos: Record<string, number> = {};
    comerciosAprobados.forEach((c) => {
      conteos[c.rubro] = (conteos[c.rubro] || 0) + 1;
    });

    const lista = Object.entries(conteos).map(([rubro, cantidad]) => ({
      rubro,
      cantidad,
    }));

    return [{ rubro: 'Todos', cantidad: comerciosAprobados.length }, ...lista];
  }, [comerciosAprobados]);

  // Filtrado inteligente sobre comercios aprobados
  const comerciosFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase();

    let filtrados = comerciosAprobados.filter((comercio) => {
      // Coincidencia en datos del comercio
      const coincideComercio =
        query === '' ||
        comercio.nombre.toLowerCase().includes(query) ||
        comercio.rubro.toLowerCase().includes(query) ||
        comercio.direccion.toLowerCase().includes(query) ||
        (comercio.descripcion && comercio.descripcion.toLowerCase().includes(query));

      // Coincidencia en productos de su catálogo
      const coincideProductos = Boolean(
        query !== '' &&
          comercio.productos?.some(
            (p) =>
              p.nombre.toLowerCase().includes(query) ||
              (p.descripcion && p.descripcion.toLowerCase().includes(query)) ||
              (p.categoria && p.categoria.toLowerCase().includes(query))
          )
      );

      const coincideBusqueda = coincideComercio || coincideProductos;
      const coincideRubro = rubroSeleccionado === 'Todos' || comercio.rubro === rubroSeleccionado;
      const coincideAbierto = !soloAbiertos || (comercio.esta_abierto && !comercio.cerrado_momentaneo && !comercio.en_vacaciones);
      const coincideTurno = !soloTurno || Boolean(comercio.esta_de_turno);
      const coincideFavorito = !soloFavoritos || esFavorito(comercio.id);

      // Filtro por radio de cercanía satelital
      let coincideRadio = true;
      if (cercaDeMi && ubicacionReferencia && radioKm) {
        const d = calcularDistanciaKm(
          ubicacionReferencia.latitud,
          ubicacionReferencia.longitud,
          comercio.latitud,
          comercio.longitud
        );
        coincideRadio = d <= radioKm;
      }

      return (
        coincideBusqueda &&
        coincideRubro &&
        coincideAbierto &&
        coincideTurno &&
        coincideFavorito &&
        coincideRadio
      );
    });

    // Si Cerca de Mí o hay ubicación de referencia activa, ordenar los comercios por cercanía satelital
    if (cercaDeMi && ubicacionReferencia) {
      filtrados = [...filtrados].sort((a, b) => {
        const distA = calcularDistanciaKm(
          ubicacionReferencia.latitud,
          ubicacionReferencia.longitud,
          a.latitud,
          a.longitud
        );
        const distB = calcularDistanciaKm(
          ubicacionReferencia.latitud,
          ubicacionReferencia.longitud,
          b.latitud,
          b.longitud
        );
        return distA - distB;
      });
    } else {
      // Ordenamiento por defecto en la zona de búsqueda (hasta que se pongan restricciones de distancia):
      // 1° Comercios Favoritos del usuario (❤️)
      // 2° Comercios Gold (👑 primeros luego de los favoritos)
      // 3° Comercios Premium (💎)
      // 4° Comercios Standar
      filtrados = [...filtrados].sort((a, b) => {
        const favA = esFavorito(a.id) ? 1 : 0;
        const favB = esFavorito(b.id) ? 1 : 0;
        if (favA !== favB) {
          return favB - favA; // Favoritos primero
        }

        // Peso jerárquico por nivel de membresía
        const pesoNivel = (nivel?: string) => {
          if (nivel === 'gold') return 3;
          if (nivel === 'premium') return 2;
          return 1;
        };

        const pesoA = pesoNivel(a.nivel);
        const pesoB = pesoNivel(b.nivel);
        if (pesoA !== pesoB) {
          return pesoB - pesoA; // Gold antes que Premium, y Premium antes que Standar
        }

        // Desempate alfabético
        return a.nombre.localeCompare(b.nombre);
      });
    }

    return filtrados;
  }, [
    comerciosAprobados,
    busqueda,
    rubroSeleccionado,
    soloAbiertos,
    soloTurno,
    soloFavoritos,
    esFavorito,
    favoritosIds,
    cercaDeMi,
    radioKm,
    ubicacionReferencia,
  ]);

  // Acción al hacer clic en "Ver en mapa" desde tarjeta o modal
  const handleVerEnMapa = useCallback((comercio: Comercio) => {
    setComercioSeleccionado(comercio);
    setSeccionActiva('directorio');
    if (window.innerWidth < 1024) {
      const mapaElement = document.getElementById('seccion-mapa');
      if (mapaElement) {
        mapaElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, []);

  // Acción al hacer clic en un pin del mapa
  const handleSelectFromMap = useCallback((comercio: Comercio) => {
    setComercioSeleccionado(comercio);
    const cardElement = document.getElementById(`comercio-${comercio.id}`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Selector Principal de Secciones (Directorio & Mapa / Paleta de Ofertas) */}
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
          <button
            type="button"
            onClick={() => setSeccionActiva('directorio')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              seccionActiva === 'directorio'
                ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md shadow-violet-950/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Map className="w-4 h-4" />
            Mapa y Comercios
          </button>

          <button
            type="button"
            onClick={() => setSeccionActiva('ofertas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              seccionActiva === 'ofertas'
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            Paleta de Ofertas
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                seccionActiva === 'ofertas'
                  ? 'bg-black/20 text-black'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {totalOfertas}
            </span>
          </button>
        </div>
      </div>

      {/* Vista: Paleta de Ofertas */}
      {seccionActiva === 'ofertas' ? (
        <PaletaOfertas
          comercios={comercios}
          onSelectComercio={(comercio) => setComercioModal(comercio)}
          onVerEnMapa={handleVerEnMapa}
        />
      ) : (
        /* Vista: Directorio con Mapa y Lista */
        <>
          {/* Controles de Búsqueda y Filtros */}
          <section className="bg-zinc-900/90 p-4 sm:p-5 rounded-3xl border border-zinc-800/90 shadow-xl">
            <FiltrosYBusqueda
              busqueda={busqueda}
              onBusquedaChange={setBusqueda}
              rubrosDisponibles={rubrosDisponibles}
              rubroSeleccionado={rubroSeleccionado}
              onRubroChange={setRubroSeleccionado}
              soloAbiertos={soloAbiertos}
              onSoloAbiertosChange={setSoloAbiertos}
              soloTurno={soloTurno}
              onSoloTurnoChange={setSoloTurno}
              soloFavoritos={soloFavoritos}
              onSoloFavoritosChange={setSoloFavoritos}
              totalFavoritos={favoritosIds.length}
              cercaDeMi={cercaDeMi}
              onCercaDeMiChange={handleCercaDeMiChange}
              radioKm={radioKm}
              onRadioKmChange={setRadioKm}
              totalResultados={comerciosFiltrados.length}
            />
          </section>

          {/* Selector de vista para móviles */}
          <div className="flex lg:hidden items-center justify-between bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800">
            <button
              type="button"
              onClick={() => setVistaMovil('ambos')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                vistaMovil === 'ambos'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              Vista Dividida
            </button>
            <button
              type="button"
              onClick={() => setVistaMovil('mapa')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                vistaMovil === 'mapa'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              Solo Mapa
            </button>
            <button
              type="button"
              onClick={() => setVistaMovil('lista')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                vistaMovil === 'lista'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Solo Lista
            </button>
          </div>

          {/* Contenedor Principal: Mapa y Tarjetas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Mapa Interactivo Nocturno */}
            <section
              id="seccion-mapa"
              className={`lg:col-span-6 xl:col-span-7 lg:sticky lg:top-24 ${
                vistaMovil === 'lista' ? 'hidden lg:block' : 'block'
              }`}
            >
              <div className="h-[420px] lg:h-[calc(100vh-170px)] min-h-[420px] max-h-[780px] w-full">
                <MapaWrapper
                  comercios={comerciosFiltrados}
                  comercioSeleccionado={comercioSeleccionado}
                  onSelectComercio={handleSelectFromMap}
                  onOpenDetalle={(comercio) => setComercioModal(comercio)}
                />
              </div>
            </section>

            {/* Grilla de Tarjetas de Comercios */}
            <section
              className={`lg:col-span-6 xl:col-span-5 space-y-4 ${
                vistaMovil === 'mapa' ? 'hidden lg:block' : 'block'
              }`}
            >
              <div className="flex items-center justify-between text-xs font-medium text-zinc-400 px-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Mostrando <strong className="text-white">{comerciosFiltrados.length}</strong>{' '}
                    {comerciosFiltrados.length === 1 ? 'comercio' : 'comercios'}
                  </span>
                  {cercaDeMi && ubicacionReferencia ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded-md border border-cyan-800/50">
                      <Navigation className="w-3 h-3 text-cyan-400" />
                      Más cercanos primero (Satelital)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-800/50">
                      <span>👑 Favoritos & Gold primero</span>
                    </span>
                  )}
                  {soloFavoritos && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-800/50">
                      ❤️ Solo favoritos
                    </span>
                  )}
                </div>
                {comercioSeleccionado && (
                  <button
                    type="button"
                    onClick={() => setComercioSeleccionado(null)}
                    className="text-cyan-400 hover:text-cyan-300 hover:underline cursor-pointer shrink-0"
                  >
                    Restablecer foco en mapa
                  </button>
                )}
              </div>

              {comerciosFiltrados.length === 0 ? (
                <div className="p-10 text-center rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40">
                  <Store className="w-12 h-12 mx-auto text-zinc-600 mb-3" />
                  <h3 className="font-bold text-zinc-200 mb-1">
                    No se encontraron comercios
                  </h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4 leading-relaxed">
                    Prueba buscando otro producto, nombre o cambiando los filtros de rubro y apertura.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setBusqueda('');
                      setRubroSeleccionado('Todos');
                      setSoloAbiertos(false);
                    }}
                    className="text-xs font-semibold px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Restablecer filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                  {comerciosFiltrados.map((comercio) => (
                    <TarjetaComercio
                      key={comercio.id}
                      comercio={comercio}
                      isSelected={comercioSeleccionado?.id === comercio.id}
                      onVerEnMapa={handleVerEnMapa}
                      onOpenDetalle={(comercio) => setComercioModal(comercio)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}

      {/* Modal Desplegable de Detalles y Catálogo */}
      <ModalDetalleComercio
        comercio={comercioModal}
        onClose={() => setComercioModal(null)}
        onVerEnMapa={handleVerEnMapa}
      />
    </div>
  );
}
