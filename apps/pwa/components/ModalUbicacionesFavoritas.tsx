'use client';

import React, { useState } from 'react';
import { useUser, UbicacionFavorita } from '@/context/user-context';
import {
  X,
  MapPin,
  Home,
  Briefcase,
  Navigation,
  Plus,
  Trash2,
  CheckCircle2,
  Compass,
  Star,
  Sparkles,
} from 'lucide-react';

export default function ModalUbicacionesFavoritas() {
  const {
    modalUbicacionesAbierto,
    cerrarModalUbicaciones,
    ubicaciones,
    agregarUbicacion,
    eliminarUbicacion,
    establecerPredeterminada,
    ubicacionReferencia,
    seleccionarUbicacionReferencia,
    posicionGps,
    activarGps,
    cargandoGps,
  } = useUser();

  const [modoCrear, setModoCrear] = useState(false);
  const [nombre, setNombre] = useState('Casa');
  const [tipo, setTipo] = useState<'casa' | 'trabajo' | 'otro'>('casa');
  const [direccion, setDireccion] = useState('');
  const [latitud, setLatitud] = useState<number>(-34.4845);
  const [longitud, setLongitud] = useState<number>(-58.718);
  const [esPredeterminada, setEsPredeterminada] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  if (!modalUbicacionesAbierto) return null;

  // Pre-llenar con el GPS actual
  const handleUsarGpsActual = async () => {
    let pos = posicionGps;
    if (!pos) {
      const ok = await activarGps();
      if (!ok) return;
      // Posición actualizada
    }
    if (posicionGps) {
      setLatitud(posicionGps.latitud);
      setLongitud(posicionGps.longitud);
      if (!direccion) {
        setDireccion(`Punto GPS (${posicionGps.latitud.toFixed(4)}, ${posicionGps.longitud.toFixed(4)})`);
      }
      setMensajeExito('Coordenadas satelitales GPS cargadas correctamente.');
      setTimeout(() => setMensajeExito(null), 2500);
    }
  };

  const handleGuardarNueva = (e: React.FormEvent) => {
    e.preventDefault();
    if (!direccion.trim()) return;

    agregarUbicacion({
      nombre: nombre.trim() || 'Mi Ubicación',
      tipo,
      direccion: direccion.trim(),
      latitud: Number(latitud),
      longitud: Number(longitud),
      es_predeterminada: esPredeterminada,
    });

    setModoCrear(false);
    setDireccion('');
    setMensajeExito('¡Ubicación guardada en tus favoritas!');
    setTimeout(() => setMensajeExito(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow de fondo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-violet-600/25 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          type="button"
          onClick={cerrarModalUbicaciones}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-md">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Mis Ubicaciones Favoritas</h2>
            <p className="text-xs text-zinc-400">
              Configura tu casa o trabajo para calcular distancias a comercios.
            </p>
          </div>
        </div>

        {mensajeExito && (
          <div className="mb-4 p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{mensajeExito}</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Ubicación satelital GPS en tiempo real */}
          <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-cyan-900/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Navigation className="w-4 h-4 text-cyan-400" />
                Rastreo Satelital GPS en Vivo
              </span>
              <button
                type="button"
                onClick={handleUsarGpsActual}
                disabled={cargandoGps}
                className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[11px] font-semibold transition-all shadow-sm cursor-pointer"
              >
                {cargandoGps ? 'Buscando satélites...' : 'Capturar Mi GPS'}
              </button>
            </div>
            {posicionGps ? (
              <p className="text-[11px] text-zinc-300">
                Señal activa: lat {posicionGps.latitud.toFixed(4)}, lon {posicionGps.longitud.toFixed(4)} (precisión: ±{posicionGps.precisionMetros}m).
              </p>
            ) : (
              <p className="text-[11px] text-zinc-400">
                Toca &quot;Capturar Mi GPS&quot; para obtener tu posición satelital exacta.
              </p>
            )}
          </div>

          {/* Formulario de agregar nueva ubicación */}
          {modoCrear ? (
            <form onSubmit={handleGuardarNueva} className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 className="text-xs font-bold text-violet-300 uppercase tracking-wider">
                  Nueva Ubicación Favorita
                </h3>
                <button
                  type="button"
                  onClick={() => setModoCrear(false)}
                  className="text-[11px] text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej: Casa, Trabajo, Dpto"
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">Tipo de Lugar</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                  >
                    <option value="casa">🏠 Casa</option>
                    <option value="trabajo">💼 Trabajo</option>
                    <option value="otro">📍 Otro punto</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-zinc-400 mb-1">Dirección o Referencia</label>
                <input
                  type="text"
                  required
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej: Av. San Martín 1500, Grand Bourg"
                  className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">Latitud</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={latitud}
                    onChange={(e) => setLatitud(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-zinc-400 mb-1">Longitud</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={longitud}
                    onChange={(e) => setLongitud(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="es_pred"
                  checked={esPredeterminada}
                  onChange={(e) => setEsPredeterminada(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="es_pred" className="text-xs text-zinc-300 cursor-pointer">
                  Marcar como mi ubicación predeterminada
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-cyan-950/50 cursor-pointer"
              >
                Guardar Ubicación
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (posicionGps) {
                  setLatitud(posicionGps.latitud);
                  setLongitud(posicionGps.longitud);
                }
                setModoCrear(true);
              }}
              className="w-full py-2.5 px-3 rounded-2xl border border-dashed border-zinc-700 hover:border-cyan-500 bg-zinc-900/50 hover:bg-zinc-900 text-xs font-semibold text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Agregar una Nueva Ubicación Favorita</span>
            </button>
          )}

          {/* Lista de Ubicaciones Guardadas */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
              Tus Lugares Guardados ({ubicaciones.length})
            </h3>

            {ubicaciones.length === 0 ? (
              <div className="p-6 text-center rounded-2xl border border-zinc-800 bg-zinc-900/40 text-xs text-zinc-400">
                <p>No tienes ubicaciones guardadas todavía.</p>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Guarda &quot;Casa&quot; o &quot;Trabajo&quot; para saber en cualquier momento qué comercios te quedan cerca.
                </p>
              </div>
            ) : (
              ubicaciones.map((u) => {
                const esActiva = ubicacionReferencia?.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      esActiva
                        ? 'bg-violet-950/40 border-violet-500/70 shadow-md shadow-violet-950/40'
                        : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center text-cyan-400 shrink-0">
                        {u.tipo === 'casa' ? (
                          <Home className="w-4 h-4" />
                        ) : u.tipo === 'trabajo' ? (
                          <Briefcase className="w-4 h-4" />
                        ) : (
                          <MapPin className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-white truncate">{u.nombre}</h4>
                          {u.es_predeterminada && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              Predeterminada
                            </span>
                          )}
                          {esActiva && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-500/30 text-violet-200 border border-violet-400/40">
                              Activa
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate">{u.direccion}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!esActiva && (
                        <button
                          type="button"
                          onClick={() =>
                            seleccionarUbicacionReferencia({
                              id: u.id,
                              nombre: `${u.nombre} (${u.direccion})`,
                              latitud: u.latitud,
                              longitud: u.longitud,
                              esGps: false,
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-gradient-to-r hover:from-violet-600 hover:to-cyan-600 text-zinc-200 hover:text-white text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Usar
                        </button>
                      )}

                      {!u.es_predeterminada && (
                        <button
                          type="button"
                          title="Hacer predeterminada"
                          onClick={() => establecerPredeterminada(u.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Eliminar"
                        onClick={() => eliminarUbicacion(u.id)}
                        className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
