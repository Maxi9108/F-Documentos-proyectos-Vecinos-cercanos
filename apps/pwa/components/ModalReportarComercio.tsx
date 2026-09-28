'use client';

import React, { useState, useEffect } from 'react';
import {
  Comercio,
  MotivoReporte,
  MOTIVOS_REPORTE_CONFIG,
} from '@/types/comercio';
import { getBrowserFingerprint } from '@/lib/fingerprint';
import {
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  X,
  Send,
  Info,
  MapPin,
  Lock,
} from 'lucide-react';

interface ModalReportarComercioProps {
  isOpen: boolean;
  onClose: () => void;
  comercio: Comercio | null;
  onReporteEnviado?: (comercioId: string, enCuarentena: boolean) => void;
}

export default function ModalReportarComercio({
  isOpen,
  onClose,
  comercio,
  onReporteEnviado,
}: ModalReportarComercioProps) {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<MotivoReporte | null>(null);
  const [honeypot, setHoneypot] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bloqueadoPor30Dias, setBloqueadoPor30Dias] = useState<number | null>(null);
  const [resultado, setResultado] = useState<{
    tipo: 'exito' | 'error';
    mensaje: string;
    enCuarentena?: boolean;
  } | null>(null);

  // Reset y comprobación de límite de 30 días al abrir
  useEffect(() => {
    if (isOpen && comercio) {
      setMotivoSeleccionado(null);
      setHoneypot('');
      setResultado(null);
      setIsSubmitting(false);

      try {
        const lastReport = localStorage.getItem(`neofaro_reporte_${comercio.id}`);
        if (lastReport) {
          const timestamp = parseInt(lastReport, 10);
          const msTranscurridos = Date.now() - timestamp;
          const ms30Dias = 30 * 24 * 60 * 60 * 1000;
          if (msTranscurridos < ms30Dias) {
            const diasRestantes = Math.ceil((ms30Dias - msTranscurridos) / (24 * 60 * 60 * 1000));
            setBloqueadoPor30Dias(diasRestantes);
          } else {
            setBloqueadoPor30Dias(null);
          }
        } else {
          setBloqueadoPor30Dias(null);
        }
      } catch {
        setBloqueadoPor30Dias(null);
      }
    }
  }, [isOpen, comercio]);

  if (!isOpen || !comercio) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoSeleccionado || bloqueadoPor30Dias) return;

    setIsSubmitting(true);
    setResultado(null);

    try {
      // 1. Obtener huella digital del navegador del cliente
      const fingerprint = await getBrowserFingerprint();

      // 2. Enviar reporte a la API del servidor
      const res = await fetch('/api/reportes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comercio_id: comercio.id,
          motivo: motivoSeleccionado,
          fingerprint,
          honeypot,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setResultado({
          tipo: 'error',
          mensaje: data.error || 'No se pudo procesar tu reporte. Por favor, reintenta más tarde.',
        });
      } else {
        // Guardar marca local para regla de 30 días
        try {
          localStorage.setItem(`neofaro_reporte_${comercio.id}`, Date.now().toString());
          setBloqueadoPor30Dias(30);
        } catch {
          // Ignorar error de almacenamiento
        }

        setResultado({
          tipo: 'exito',
          mensaje: data.mensaje || '¡Gracias! Tu reporte ha sido registrado.',
          enCuarentena: data.enCuarentena,
        });

        if (onReporteEnviado) {
          onReporteEnviado(comercio.id, Boolean(data.enCuarentena));
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión con el servidor.';
      setResultado({
        tipo: 'error',
        mensaje: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const motivosList = Object.entries(MOTIVOS_REPORTE_CONFIG) as [
    MotivoReporte,
    { label: string; descripcion: string }
  ][];

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Sugerir corrección o reportar
              </h2>
              <p className="text-xs text-zinc-400">
                Ayuda a la comunidad barrial a mantener la información precisa.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha del Comercio */}
        <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
            Comercio reportado
          </span>
          <h3 className="text-sm font-bold text-white">{comercio.nombre}</h3>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="truncate">{comercio.direccion}</span>
          </p>
        </div>

        {/* Si ya se completó el envío */}
        {resultado?.tipo === 'exito' ? (
          <div className="py-6 px-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-bold text-white">¡Agradecemos tu colaboración!</h4>
            <p className="text-xs text-emerald-200/90 leading-relaxed max-w-sm mx-auto">
              {resultado.mensaje}
            </p>
            {resultado.enCuarentena && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-[11px] text-rose-200 font-medium">
                🛡️ El comercio ha sido retirado preventivamente del mapa y derivado al panel de moderación comunitaria.
              </div>
            )}
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
              >
                Entendido, cerrar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo Honeypot Oculto (Anti-Bots) */}
            <div style={{ display: 'none' }} aria-hidden="true">
              <label htmlFor="website_hp">No llenar si eres humano</label>
              <input
                id="website_hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 mb-2">
                Selecciona el problema verificado:
              </label>

              {/* Opciones Cerradas (Sin Texto Libre) */}
              <div className="space-y-2">
                {motivosList.map(([key, config]) => {
                  const isChecked = motivoSeleccionado === key;
                  return (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-amber-950/40 border-amber-500/60 text-white shadow-md shadow-amber-950/20'
                          : 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800/80 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="motivo_reporte"
                        value={key}
                        checked={isChecked}
                        onChange={() => setMotivoSeleccionado(key)}
                        className="mt-0.5 accent-amber-500 cursor-pointer"
                      />
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold block">{config.label}</span>
                        <p className="text-[11px] text-zinc-400 leading-tight">
                          {config.descripcion}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Aviso de Límite de 30 días alcanzado */}
            {bloqueadoPor30Dias !== null && (
              <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/50 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-white block">Reporte reciente registrado</span>
                  <p className="text-[11px] text-amber-200/90 leading-tight">
                    Ya enviaste una sugerencia sobre este local desde este dispositivo. Para proteger a los comerciantes barriales contra sabotajes, podrás volver a reportar dentro de <strong className="text-white underline">{bloqueadoPor30Dias} {bloqueadoPor30Dias === 1 ? 'día' : 'días'}</strong>.
                  </p>
                </div>
              </div>
            )}

            {/* Mensaje de Error si ocurrió */}
            {resultado?.tipo === 'error' && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p>{resultado.mensaje}</p>
              </div>
            )}

            {/* Aviso informativo de reglas */}
            <div className="p-3 rounded-2xl bg-zinc-900/40 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
              <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Política comunitaria anti-spam:</span>
              </div>
              <p className="leading-tight">
                Para prevenir reportes maliciosos, cada dispositivo solo puede reportar un mismo local cada 30 días. Se requieren 3 reportes independientes en un plazo de 15 días para aplicar una cuarentena preventiva.
              </p>
            </div>

            {/* Footer con reCAPTCHA / Badge Anti-Bot y Botones */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Protección Anti-Bot & Fingerprint
                </span>
                <span className="text-zinc-600">reCAPTCHA v3 / Invisible</span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={!motivoSeleccionado || isSubmitting || Boolean(bloqueadoPor30Dias)}
                  className="py-2.5 px-5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:pointer-events-none text-black font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-amber-950/40 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : bloqueadoPor30Dias ? (
                    <span>Límite de 30 días activo</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar reporte</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
