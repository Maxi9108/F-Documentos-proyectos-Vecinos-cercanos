'use client';

import React, { useState } from 'react';
import { Comercio, DebateInconveniente } from '@/types/comercio';
import { useUser } from '@/context/user-context';
import { guardarDebate } from '@/lib/supabase';
import { registrarEvento } from '@/lib/analytics';
import {
  X,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Lock,
  MessageSquare,
  Phone,
  User,
  Send,
  Loader2,
} from 'lucide-react';

interface ModalCrearDebateProps {
  comercio: Comercio;
  onClose: () => void;
}

const MOTIVOS_PREDEFINIDOS = [
  'Demora excesiva en entrega o pedido',
  'Producto defectuoso o en mal estado',
  'Diferencia de precio o cobro incorrecto',
  'Falta de stock tras confirmar el pedido',
  'Atención inadecuada o falta de respuesta',
  'Inconveniente con forma de pago',
  'Otro inconveniente',
];

export default function ModalCrearDebate({ comercio, onClose }: ModalCrearDebateProps) {
  const { usuario, estaAutenticado, abrirModalAuth } = useUser();

  const [motivo, setMotivo] = useState(MOTIVOS_PREDEFINIDOS[0]);
  const [descripcion, setDescripcion] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!estaAutenticado || !usuario) {
    return (
      <div className="fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl text-center text-zinc-100">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900 hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7" />
          </div>

          <h3 className="text-lg font-bold text-white mb-2">Registro de Usuario Requerido</h3>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            Para iniciar un debate o reportar un inconveniente con <strong>{comercio.nombre}</strong> debes estar registrado con tu correo y nombre comprobados. Esto garantiza seriedad y mediación transparente.
          </p>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                abrirModalAuth('registro');
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-violet-950/50 cursor-pointer"
            >
              Crear Cuenta con Verificación
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                abrirModalAuth('login');
              }}
              className="w-full py-2 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold cursor-pointer"
            >
              Ya tengo cuenta (Iniciar Sesión)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!descripcion.trim() || descripcion.trim().length < 10) {
      setErrorMsg('Por favor describe el inconveniente con al menos 10 caracteres para que el comercio y el administrador puedan entender la situación.');
      return;
    }

    setCargando(true);

    const nuevoDebate: DebateInconveniente = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `debate-${Date.now()}`,
      comercio_id: comercio.id,
      comercio_nombre: comercio.nombre,
      usuario_id: usuario.id,
      usuario_nombre: usuario.nombre || usuario.email.split('@')[0],
      usuario_email: usuario.email,
      usuario_telefono: telefonoContacto.trim() || undefined,
      motivo,
      descripcion: descripcion.trim(),
      fecha_creacion: new Date().toISOString(),
      estado: 'abierto',
    };

    const res = await guardarDebate(nuevoDebate);
    setCargando(false);

    if (res.success) {
      registrarEvento('debate_iniciado', comercio.id, comercio.nombre, {
        motivo,
        usuario_email: usuario.email,
      });
      setEnviado(true);
      setTimeout(() => {
        onClose();
      }, 2400);
    } else {
      setErrorMsg(res.error || 'Ocurrió un error al registrar el debate.');
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden text-zinc-100 max-h-[90vh] overflow-y-auto">
        {/* Glow decorativo de fondo */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-900/80 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {enviado ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">¡Debate Registrado con Éxito!</h3>
            <p className="text-xs text-zinc-300 leading-relaxed max-w-sm mx-auto">
              Tu inconveniente ha sido enviado confidencialmente a <strong>{comercio.nombre}</strong> y el administrador de Vecin@s Conectad@s ha recibido una notificación prioritaria para mediar en la solución.
            </p>
            <div className="p-3 bg-zinc-900 rounded-2xl text-[11px] text-zinc-400 border border-zinc-800 inline-block">
              Solo tú, el comercio y el administrador pueden acceder a este expediente.
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  Iniciar Debate / Reportar Inconveniente
                </h3>
                <p className="text-xs text-zinc-400">
                  Comercio: <span className="text-cyan-300 font-semibold">{comercio.nombre}</span>
                </p>
              </div>
            </div>

            {/* Aviso de Confidencialidad y Privacidad */}
            <div className="mb-4 p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-[11px] text-zinc-300 space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Registro Privado y Supervisado</span>
              </div>
              <p className="text-zinc-400 text-[10.5px] leading-relaxed">
                Este debate generará un registro exclusivo para el comercio y llegará como notificación al administrador para mediar de forma justa. <strong>No es público para otros vecinos.</strong>
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Identidad del usuario */}
              <div className="p-2.5 bg-zinc-900/60 rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs">
                <span className="text-zinc-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-violet-400" />
                  <span>Usuario que reporta:</span>
                </span>
                <span className="font-semibold text-white font-mono">{usuario.nombre || usuario.email}</span>
              </div>

              {/* Selector de Motivo */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                  Motivo Principal del Inconveniente *
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {MOTIVOS_PREDEFINIDOS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Teléfono de contacto opcional */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-cyan-400" />
                  <span>Teléfono o WhatsApp de Contacto (Opcional)</span>
                </label>
                <input
                  type="tel"
                  value={telefonoContacto}
                  onChange={(e) => setTelefonoContacto(e.target.value)}
                  placeholder="Ej: +54 9 11 1234-5678"
                  className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Detalle del Inconveniente */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-amber-400" />
                  <span>Descripción del Problema *</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalla qué sucedió, número de pedido si lo tienes, y qué solución esperas del comercio..."
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-400 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-amber-950/60 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {cargando ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Enviando reporte...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Debate al Comercio y Administrador</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
