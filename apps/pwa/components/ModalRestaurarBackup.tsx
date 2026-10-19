'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  Database,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  Loader2,
  Store,
  Users,
  RefreshCw,
} from 'lucide-react';

interface ModalRestaurarBackupProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ModalRestaurarBackup({
  isOpen,
  onClose,
  onSuccess,
}: ModalRestaurarBackupProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [datosParseados, setDatosParseados] = useState<any | null>(null);
  const [totalComercios, setTotalComercios] = useState(0);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [fechaRespaldo, setFechaRespaldo] = useState<string | null>(null);

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultadoExito, setResultadoExito] = useState<{
    comercios: number;
    usuarios: number;
    mensaje: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setResultadoExito(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Por favor selecciona un archivo con extensión .json');
      return;
    }

    setArchivo(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setDatosParseados(json);

        // Detectar formato del backup
        const coms = Array.isArray(json.datos?.comercios)
          ? json.datos.comercios
          : Array.isArray(json.comercios)
          ? json.comercios
          : [];

        const usrs = Array.isArray(json.datos?.usuarios)
          ? json.datos.usuarios
          : Array.isArray(json.usuarios)
          ? json.usuarios
          : [];

        setTotalComercios(coms.length);
        setTotalUsuarios(usrs.length);
        setFechaRespaldo(json.timestamp || json.fecha || null);

        if (coms.length === 0 && usrs.length === 0) {
          setError('El archivo JSON no contiene listas válidas de comercios ni de usuarios.');
        }
      } catch (err) {
        setError('El archivo seleccionado no tiene un formato JSON válido.');
        setDatosParseados(null);
      }
    };
    reader.readAsText(file);
  };

  const handleRestaurar = async () => {
    if (!datosParseados) return;

    try {
      setCargando(true);
      setError(null);

      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-action': 'true',
        },
        body: JSON.stringify(datosParseados),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar la restauración.');
      }

      setResultadoExito({
        comercios: data.estadisticas?.comerciosExitosos ?? totalComercios,
        usuarios: data.estadisticas?.usuariosExitosos ?? totalUsuarios,
        mensaje: data.mensaje || 'Base de datos restaurada correctamente.',
      });

      // Notificar al componente padre para que recargue datos
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado al restaurar.');
    } finally {
      setCargando(false);
    }
  };

  const handleCerrar = () => {
    setArchivo(null);
    setDatosParseados(null);
    setError(null);
    setResultadoExito(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-900 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800/80 text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">
                Restaurar Base de Datos
              </h3>
              <p className="text-xs text-zinc-400">
                Carga comercios y usuarios desde un respaldo JSON
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCerrar}
            disabled={cargando}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resultadoExito ? (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-900/60 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-emerald-300">
                  ¡Restauración Finalizada con Éxito!
                </h4>
                <p className="text-xs text-zinc-300 mt-1">
                  {resultadoExito.mensaje}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left pt-2">
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Comercios cargados</div>
                  <div className="text-lg font-bold text-emerald-400">
                    {resultadoExito.comercios}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                  <div className="text-xs text-zinc-400">Usuarios cargados</div>
                  <div className="text-lg font-bold text-cyan-400">
                    {resultadoExito.usuarios}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCerrar}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-900/30"
              >
                Aceptar y Ver Cambios
              </button>
            </div>
          ) : (
            <>
              {/* Selector de Archivo */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div
                onClick={() => !cargando && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  archivo
                    ? 'border-cyan-500/60 bg-cyan-950/20'
                    : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/30 hover:bg-zinc-900/50'
                }`}
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
                  {archivo ? (
                    <FileText className="w-6 h-6 text-cyan-400" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-zinc-400" />
                  )}
                </div>

                {archivo ? (
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {archivo.name}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {(archivo.size / 1024).toFixed(1)} KB · Haz clic para cambiar archivo
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-zinc-300">
                      Haz clic para seleccionar el archivo de respaldo (.json)
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">
                      El archivo que descargaste previamente con &quot;Respaldar BD&quot;
                    </p>
                  </div>
                )}
              </div>

              {/* Vista previa de los datos encontrados */}
              {datosParseados && (
                <div className="space-y-3 animate-fade-in">
                  <div className="text-xs font-semibold text-zinc-400 flex items-center justify-between">
                    <span>Contenido detectado en el archivo:</span>
                    {fechaRespaldo && (
                      <span className="text-zinc-500">
                        Fecha: {new Date(fechaRespaldo).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-950/70 text-emerald-400 border border-emerald-800/50">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400">Comercios</div>
                        <div className="text-base font-bold text-zinc-100">
                          {totalComercios}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-cyan-950/70 text-cyan-400 border border-cyan-800/50">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400">Usuarios</div>
                        <div className="text-base font-bold text-zinc-100">
                          {totalUsuarios}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/50 text-amber-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      Los registros se insertarán y actualizarán en Supabase por su ID único. No se borrarán datos existentes ni se duplicarán comercios.
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!resultadoExito && (
          <div className="p-4 border-t border-zinc-900 bg-zinc-900/30 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCerrar}
              disabled={cargando}
              className="py-2 px-4 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleRestaurar}
              disabled={cargando || !datosParseados || (totalComercios === 0 && totalUsuarios === 0)}
              className="py-2 px-4 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-cyan-900/20"
            >
              {cargando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Restaurando en Supabase...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Cargar y Restaurar</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
