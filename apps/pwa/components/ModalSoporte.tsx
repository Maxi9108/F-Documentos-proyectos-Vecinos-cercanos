'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/user-context';
import { crearTicketSoporte } from '@/lib/supabase';
import {
  TipoTicketSoporte,
  OrigenTicketSoporte,
} from '@/types/comercio';
import {
  X,
  Store,
  User,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Send,
  Phone,
  Mail,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';

interface ModalSoporteProps {
  isOpen: boolean;
  onClose: () => void;
  tipoInicial?: TipoTicketSoporte;
  origenInicial?: OrigenTicketSoporte;
  comercioNombreInicial?: string;
  comercioIdInicial?: string;
}

export default function ModalSoporte({
  isOpen,
  onClose,
  tipoInicial = 'problema_local_membresia',
  origenInicial = 'usuario',
  comercioNombreInicial = '',
  comercioIdInicial = '',
}: ModalSoporteProps) {
  const { usuario } = useUser();

  const [tipo, setTipo] = useState<TipoTicketSoporte>(tipoInicial);
  const [origen, setOrigen] = useState<OrigenTicketSoporte>(origenInicial);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [comercioNombre, setComercioNombre] = useState(comercioNombreInicial);
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');

  const [enviando, setEnviando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoTicketId, setExitoTicketId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTipo(tipoInicial);
      setOrigen(origenInicial);
      setComercioNombre(comercioNombreInicial);
      setExitoTicketId(null);
      setErrorMsg(null);

      if (usuario) {
        setNombre(usuario.nombre || '');
        setEmail(usuario.email || '');
      }
    }
  }, [isOpen, tipoInicial, origenInicial, comercioNombreInicial, usuario]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    const cleanNombre = nombre.trim();
    const cleanAsunto = asunto.trim();
    const cleanMensaje = mensaje.trim();

    if (!cleanNombre) {
      setErrorMsg('Por favor ingresa tu nombre completo.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido para recibir respuesta.');
      return;
    }
    if (tipo === 'problema_local_membresia' && !comercioNombre.trim()) {
      setErrorMsg('Por favor indica el nombre de tu local o comercio.');
      return;
    }
    if (!cleanAsunto) {
      setErrorMsg('Por favor indica el asunto o título del problema/recomendación.');
      return;
    }
    if (!cleanMensaje || cleanMensaje.length < 10) {
      setErrorMsg('Por favor escribe un detalle de al menos 10 caracteres.');
      return;
    }

    setEnviando(true);
    try {
      const res = await crearTicketSoporte({
        tipo,
        origen,
        nombre: cleanNombre,
        email: cleanEmail,
        telefono: telefono.trim() || undefined,
        comercio_nombre: comercioNombre.trim() || undefined,
        comercio_id: comercioIdInicial || undefined,
        asunto: cleanAsunto,
        mensaje: cleanMensaje,
      });

      if (res.ok && res.ticket) {
        setExitoTicketId(res.ticket.id);
        setMensaje('');
        setAsunto('');
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al enviar tu solicitud. Intenta nuevamente.');
      }
    } catch {
      setErrorMsg('Error de conexión al cargar la solicitud al panel de administrador.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Centro de Atención y Recomendaciones
              </h2>
              <p className="text-[11px] text-zinc-400">
                Se enviará directamente al panel del administrador
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 overflow-y-auto no-scrollbar space-y-4">
          {exitoTicketId ? (
            <div className="py-8 px-4 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 animate-in zoom-in">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">¡Recibido con éxito!</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Tu mensaje ha sido cargado al panel de administración. Nuestro equipo lo revisará a la brevedad y nos comunicaremos a tu correo{' '}
                  <strong className="text-white">{email}</strong>.
                </p>
                <div className="mt-3 inline-block px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 font-mono">
                  Identificador: {exitoTicketId}
                </div>
              </div>

              <div className="pt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setExitoTicketId(null);
                    onClose();
                  }}
                  className="py-2.5 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 transition-colors cursor-pointer"
                >
                  Entendido / Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Selector de Tipo de Solicitud */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('problema_local_membresia')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    tipo === 'problema_local_membresia'
                      ? 'bg-amber-950/50 border-amber-500 text-amber-300 shadow-md shadow-amber-950/40'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Store className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-bold leading-tight">Local o Membresía</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('problema_cuenta')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    tipo === 'problema_cuenta'
                      ? 'bg-cyan-950/50 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950/40'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-bold leading-tight">Problemas con tu Cuenta</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('recomendacion')}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1.5 ${
                    tipo === 'recomendacion'
                      ? 'bg-violet-950/50 border-violet-500 text-violet-300 shadow-md shadow-violet-950/40'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <Lightbulb className="w-4 h-4 shrink-0" />
                  <span className="text-[11px] font-bold leading-tight">¿Tenés Recomendaciones?</span>
                </button>
              </div>

              {/* Selector de Origen (Usuario o Comercio) */}
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-xs text-zinc-400 font-medium ml-1">¿Envías como?</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setOrigen('usuario')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      origen === 'usuario'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Usuario / Vecino
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrigen('comercio')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      origen === 'comercio'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Comercio / Local
                  </button>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Tu Nombre <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Correo Electrónico <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nombre@ejemplo.com"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                      Teléfono / WhatsApp <span className="text-zinc-600 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="tel"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. 11 5555-5555"
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {(tipo === 'problema_local_membresia' || origen === 'comercio') && (
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        Nombre del Comercio <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={comercioNombre}
                        onChange={(e) => setComercioNombre(e.target.value)}
                        placeholder="Ej. Panadería San Cayetano"
                        className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Asunto o Título breve <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={asunto}
                    onChange={(e) => setAsunto(e.target.value)}
                    placeholder={
                      tipo === 'problema_local_membresia'
                        ? 'Ej. Consulta sobre renovación de membresía Gold'
                        : tipo === 'problema_cuenta'
                        ? 'Ej. No puedo recuperar mi acceso o cambiar contraseña'
                        : 'Ej. Sugiero agregar la opción de filtrar por horario de trasnoche'
                    }
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                    Detalle del problema o recomendación <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe aquí con claridad los detalles para que el administrador pueda ayudarte rápidamente..."
                    className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 hover:from-cyan-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-950/60 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{enviando ? 'Enviando al Panel...' : 'Enviar al Administrador'}</span>
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
