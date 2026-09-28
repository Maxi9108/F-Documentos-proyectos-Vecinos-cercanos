'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Comercio } from '@/types/comercio';
import FiltrosYBusqueda from './FiltrosYBusqueda';
import MapaWrapper from './MapaWrapper';
import TarjetaComercio from './TarjetaComercio';
import ModalDetalleComercio from './ModalDetalleComercio';
import ModalReportarComercio from './ModalReportarComercio';
import PaletaOfertas from './PaletaOfertas';
import Link from 'next/link';
import { Map, List, Store, Sparkles, Navigation, User, Compass, Radar } from 'lucide-react';

import { registrarEvento } from '@/lib/analytics';
import { useUser } from '@/context/user-context';
import { calcularDistanciaKm } from '@/lib/geolocation';
import { verificarComercioAbierto } from '@/lib/horarios';

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
  const [comercioAReportar, setComercioAReportar] = useState<Comercio | null>(null);
  // En móviles inicia por defecto en 'lista' para mayor rapidez y prolijidad visual
  const [vistaMovil, setVistaMovil] = useState<'ambos' | 'mapa' | 'lista'>('lista');

  const {
    favoritosIds,
    esFavorito,
    ubicacionReferencia,
    gpsActivo,
    activarGps,
    estaAutenticado,
    abrirModalAuth,
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

  // Solo comercios con estado aprobado, no ocultos por inactividad (+60 días) y no en cuarentena
  const comerciosAprobados = useMemo(() => {
    return comercios.filter(
      (c) =>
        (!c.estado_aprobacion || c.estado_aprobacion === 'aprobado') &&
        !c.oculto_por_inactividad &&
        !c.en_cuarentena
    );
  }, [comercios]);

  // Manejar resolución inmediata cuando un reporte activa la cuarentena
  const handleReporteEnviado = useCallback((comercioId: string, enCuarentena: boolean) => {
    if (enCuarentena) {
      setComercios((prev) =>
        prev.map((c) =>
          c.id === comercioId
            ? {
                ...c,
                en_cuarentena: true,
                motivo_cuarentena: 'Cuarentena preventiva: 3 reportes ciudadanos en menos de 15 días',
              }
            : c
        )
      );
      setComercios((prev) => [...prev]);
      setComercioModal(null);
      setComercioSeleccionado(null);
    }
  }, []);

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

  // Algoritmo de Smart Fallback Automático (1 km -> 2 km -> 3 km)
  // Si en el radio caminable (1 km) hay menos de 3 locales abiertos, se amplía proactivamente
  const { radioEfectivo, mensajeSmartFallback } = useMemo(() => {
    if (!cercaDeMi || !ubicacionReferencia) {
      return { radioEfectivo: radioKm, mensajeSmartFallback: null };
    }
    // Si el usuario fijó manualmente un radio específico, se respeta estrictamente
    if (radioKm !== null) {
      return { radioEfectivo: radioKm, mensajeSmartFallback: null };
    }

    const query = busqueda.trim().toLowerCase();
    const candidatos = comerciosAprobados.filter((comercio) => {
      const coincideComercio =
        query === '' ||
        comercio.nombre.toLowerCase().includes(query) ||
        comercio.rubro.toLowerCase().includes(query);
      const coincideRubro = rubroSeleccionado === 'Todos' || comercio.rubro === rubroSeleccionado;
      const coincideAbierto = !soloAbiertos || verificarComercioAbierto(comercio).estaAbierto;
      return coincideComercio && coincideRubro && coincideAbierto;
    });

    const en1km = candidatos.filter((c) => {
      const d = calcularDistanciaKm(ubicacionReferencia.latitud, ubicacionReferencia.longitud, c.latitud, c.longitud);
      return d <= 1;
    });

    if (en1km.length >= 3) {
      return { radioEfectivo: 1, mensajeSmartFallback: null };
    }

    const en2km = candidatos.filter((c) => {
      const d = calcularDistanciaKm(ubicacionReferencia.latitud, ubicacionReferencia.longitud, c.latitud, c.longitud);
      return d <= 2;
    });

    if (en2km.length >= 3) {
      return {
        radioEfectivo: 2,
        mensajeSmartFallback: 'Ampliamos automáticamente la búsqueda a 2 km para mostrarte más opciones disponibles en tu barrio.',
      };
    }

    return {
      radioEfectivo: 3,
      mensajeSmartFallback: 'Ampliamos la búsqueda a 3 km para asegurar locales y servicios abiertos disponibles.',
    };
  }, [cercaDeMi, ubicacionReferencia, radioKm, busqueda, comerciosAprobados, rubroSeleccionado, soloAbiertos]);

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
      // Compatibilidad inteligente con trasnoche y horarios estructurados
      const coincideAbierto = !soloAbiertos || verificarComercioAbierto(comercio).estaAbierto;
      const coincideTurno = !soloTurno || Boolean(comercio.esta_de_turno);
      const coincideFavorito = !soloFavoritos || esFavorito(comercio.id);

      // Filtro por radio de cercanía satelital (aplicando Smart Fallback o selección manual)
      let coincideRadio = true;
      if (cercaDeMi && ubicacionReferencia && radioEfectivo) {
        const d = calcularDistanciaKm(
          ubicacionReferencia.latitud,
          ubicacionReferencia.longitud,
          comercio.latitud,
          comercio.longitud
        );
        coincideRadio = d <= radioEfectivo;
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

          {/* Banner de Radio Inteligente (Smart Fallback 1km -> 2km -> 3km) */}
          {mensajeSmartFallback && (
            <div className="flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-zinc-900 to-violet-950/70 border border-cyan-500/30 text-cyan-200 text-xs shadow-lg animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-300">
                <Radar className="w-4 h-4 animate-spin-slow" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <span>Smart Radius Activo ({radioEfectivo} km)</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                    Fallback Automático
                  </span>
                </p>
                <p className="text-zinc-300 text-[11px] mt-0.5">
                  {mensajeSmartFallback}
                </p>
              </div>
            </div>
          )}

          {/* Selector de vista para móviles mejorado */}
          <div className="flex lg:hidden items-center justify-between bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 shadow-sm">
            <button
              type="button"
              onClick={() => setVistaMovil('lista')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                vistaMovil === 'lista'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista de Locales</span>
            </button>
            <button
              type="button"
              onClick={() => setVistaMovil('mapa')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                vistaMovil === 'mapa'
                  ? 'bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-md'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Solo Mapa</span>
            </button>
            <button
              type="button"
              onClick={() => setVistaMovil('ambos')}
              className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
                vistaMovil === 'ambos'
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>Dividida</span>
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
                      onReportar={(comercio) => setComercioAReportar(comercio)}
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
        onReportar={(comercio) => setComercioAReportar(comercio)}
      />

      {/* Modal para Reportar Problema o Sugerir Corrección */}
      <ModalReportarComercio
        isOpen={Boolean(comercioAReportar)}
        onClose={() => setComercioAReportar(null)}
        comercio={comercioAReportar}
        onReporteEnviado={handleReporteEnviado}
      />

      {/* Botón Flotante para Alternar Rápido Lista y Mapa en Celulares */}
      {seccionActiva === 'directorio' && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 lg:hidden pointer-events-auto">
          <button
            type="button"
            onClick={() => setVistaMovil((prev) => (prev === 'mapa' ? 'lista' : 'mapa'))}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-950/95 hover:bg-black text-white border border-cyan-500/50 shadow-2xl shadow-cyan-950/90 backdrop-blur-md text-xs font-bold transition-all active:scale-95 cursor-pointer hover:border-cyan-400 ring-2 ring-violet-500/20"
          >
            {vistaMovil === 'mapa' ? (
              <>
                <List className="w-4 h-4 text-cyan-400" />
                <span>Ver Lista de Locales</span>
              </>
            ) : (
              <>
                <Map className="w-4 h-4 text-violet-400" />
                <span>Ver en el Mapa</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Barra de Navegación Inferior Fija para Móviles (Bottom Dock Ergonomic) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/90 px-3 py-1.5 shadow-[0_-4px_20px_rgba(0,0,0,0.8)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* 1. Locales / Directorio */}
          <button
            type="button"
            onClick={() => {
              setSeccionActiva('directorio');
              setVistaMovil('lista');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              seccionActiva === 'directorio' && vistaMovil === 'lista'
                ? 'text-cyan-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <List className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Locales</span>
          </button>

          {/* 2. Mapa */}
          <button
            type="button"
            onClick={() => {
              setSeccionActiva('directorio');
              setVistaMovil('mapa');
            }}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              seccionActiva === 'directorio' && vistaMovil === 'mapa'
                ? 'text-violet-400 font-bold'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Map className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Mapa</span>
          </button>

          {/* 3. Ofertas Barriales */}
          <button
            type="button"
            onClick={() => setSeccionActiva('ofertas')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative cursor-pointer ${
              seccionActiva === 'ofertas'
                ? 'text-amber-400 font-bold'
                : 'text-zinc-500 hover:text-amber-300'
            }`}
          >
            <Sparkles className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Ofertas</span>
            {totalOfertas > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          {/* 4. Mi Comercio */}
          <Link
            href="/mi-comercio"
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-zinc-500 hover:text-cyan-400 transition-all cursor-pointer"
          >
            <Store className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">Comercio</span>
          </Link>

          {/* 5. Mi Cuenta / Login */}
          <button
            type="button"
            onClick={() => abrirModalAuth()}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-zinc-500 hover:text-white transition-all cursor-pointer"
          >
            <User className="w-5 h-5 mb-0.5" />
            <span className="text-[10px]">{estaAutenticado ? 'Perfil' : 'Ingresar'}</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
