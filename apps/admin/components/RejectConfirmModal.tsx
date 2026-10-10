'use client';

import React, { useState, useEffect } from 'react';
import { Comercio } from '@/types/comercio';
import { XCircle, X } from 'lucide-react';

interface RejectConfirmModalProps {
  isOpen: boolean;
  comercio: Comercio | null;
  onClose: () => void;
  onConfirm: (id: string, motivo: string) => Promise<void>;
  isRejecting: boolean;
}

export default function RejectConfirmModal({
  isOpen,
  comercio,
  onClose,
  onConfirm,
  isRejecting,
}: RejectConfirmModalProps) {
  const [motivo, setMotivo] = useState('Datos incompletos o fuera de zona barrial');

  useEffect(() => {
    if (isOpen) {
      setMotivo('Datos incompletos o fuera de zona barrial');
    }
  }, [isOpen]);

  if (!isOpen || !comercio) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Rechazar solicitud
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  Moderación del directorio
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isRejecting}
              className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Estás a punto de rechazar la solicitud de{' '}
            <strong className="text-zinc-900 dark:text-white font-semibold">
              &quot;{comercio.nombre}&quot;
            </strong>{' '}
            ({comercio.rubro}).
          </p>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Motivo de Rechazo:
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              disabled={isRejecting}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none font-medium"
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[
                'Datos incompletos o fuera de zona barrial',
                'Rubro no admitido',
                'Contacto no verificado',
              ].map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setMotivo(sug)}
                  className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[10px] text-zinc-600 dark:text-zinc-400 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isRejecting}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onConfirm(comercio.id, motivo)}
              disabled={isRejecting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              <span>{isRejecting ? 'Rechazando...' : 'Confirmar Rechazo'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
