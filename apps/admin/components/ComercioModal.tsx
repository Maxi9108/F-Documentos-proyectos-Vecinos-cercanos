'use client';

import React, { useState, useEffect } from 'react';
import { Comercio, CreateComercioInput, RUBROS_PREDEFINIDOS } from '@/types/comercio';
import SelectorMapaCoordenadasWrapper from './SelectorMapaCoordenadasWrapper';
import { X, Store, Tag, MapPin, Phone, CheckCircle2, AlertCircle, Save } from 'lucide-react';

interface ComercioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateComercioInput) => Promise<boolean>;
  comercioToEdit?: Comercio | null;
}

export default function ComercioModal({
  isOpen,
  onClose,
  onSave,
  comercioToEdit,
}: ComercioModalProps) {
  const isEditing = Boolean(comercioToEdit);

  // Form states
  const [nombre, setNombre] = useState('');
  const [rubro, setRubro] = useState<string>('Almacén');
  const [otroRubro, setOtroRubro] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [estaAbierto, setEstaAbierto] = useState(true);
  const [latitud, setLatitud] = useState<number>(-34.6037);
  const [longitud, setLongitud] = useState<number>(-58.4212);

  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset or populate values when opening/changing
  useEffect(() => {
    if (isOpen) {
      if (comercioToEdit) {
        setNombre(comercioToEdit.nombre);
        const esPredefinido = (RUBROS_PREDEFINIDOS as readonly string[]).includes(comercioToEdit.rubro);
        if (esPredefinido) {
          setRubro(comercioToEdit.rubro);
          setOtroRubro('');
        } else {
          setRubro('Otro');
          setOtroRubro(comercioToEdit.rubro);
        }
        setDireccion(comercioToEdit.direccion);
        setTelefono(comercioToEdit.telefono || '');
        setEstaAbierto(comercioToEdit.esta_abierto);
        setLatitud(comercioToEdit.latitud);
        setLongitud(comercioToEdit.longitud);
      } else {
        setNombre('');
        setRubro('Almacén');
        setOtroRubro('');
        setDireccion('');
        setTelefono('');
        setEstaAbierto(true);
        setLatitud(-34.6037);
        setLongitud(-58.4212);
      }
      setErrorValidacion(null);
      setIsSubmitting(false);
    }
  }, [isOpen, comercioToEdit]);

  if (!isOpen) return null;

  const handleCoordinatesChange = (lat: number, lng: number) => {
    setLatitud(lat);
    setLongitud(lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);

    const rubroFinal = rubro === 'Otro' ? otroRubro.trim() : rubro;

    if (!nombre.trim()) {
      setErrorValidacion('El nombre del comercio es obligatorio.');
      return;
    }
    if (!rubroFinal) {
      setErrorValidacion('Debes especificar un rubro válido.');
      return;
    }
    if (!direccion.trim()) {
      setErrorValidacion('La dirección física es obligatoria.');
      return;
    }
    if (isNaN(latitud) || isNaN(longitud)) {
      setErrorValidacion('Las coordenadas de latitud y longitud deben ser valores numéricos.');
      return;
    }

    setIsSubmitting(true);
    const success = await onSave({
      nombre: nombre.trim(),
      rubro: rubroFinal,
      direccion: direccion.trim(),
      telefono: telefono.trim(),
      esta_abierto: estaAbierto,
      latitud: Number(latitud),
      longitud: Number(longitud),
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden my-8">
        {/* Cabecera del modal */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {isEditing ? 'Editar Comercio' : 'Nuevo Comercio'}
              </h2>
              <p className="text-xs text-zinc-500">
                {isEditing
                  ? 'Actualiza la información del establecimiento'
                  : 'Registra un nuevo negocio en el directorio barrial'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorValidacion && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorValidacion}</span>
            </div>
          )}

          {/* Nombre y Rubro */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Nombre del Comercio *
              </label>
              <div className="relative">
                <Store className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Panadería San José"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Rubro o Categoría *
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={rubro}
                  onChange={(e) => setRubro(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                >
                  {RUBROS_PREDEFINIDOS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Rubro personalizado si seleccionó 'Otro' */}
          {rubro === 'Otro' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Especificar otro rubro *
              </label>
              <input
                type="text"
                value={otroRubro}
                onChange={(e) => setOtroRubro(e.target.value)}
                placeholder="Ej. Peluquería, Zapatería..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                required
              />
            </div>
          )}

          {/* Dirección y Teléfono */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Dirección Física *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Ej. Av. San Martín 1420"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Teléfono de Contacto (Opcional)
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. +54 11 4567-8901"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Estado Operativo (Toggle Abierto / Cerrado) */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <CheckCircle2 className={`w-4 h-4 ${estaAbierto ? 'text-emerald-600' : 'text-zinc-400'}`} />
                Estado del Comercio
              </span>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                {estaAbierto
                  ? 'El comercio se mostrará como actualmente Abierto en la PWA'
                  : 'El comercio se indicará como Cerrado temporalmente'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEstaAbierto(!estaAbierto)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                estaAbierto ? 'bg-emerald-600' : 'bg-zinc-300 dark:bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  estaAbierto ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Selector de Coordenadas con Mapa Interactivo */}
          <div className="space-y-3 pt-1">
            <SelectorMapaCoordenadasWrapper
              latitud={latitud}
              longitud={longitud}
              onChange={handleCoordinatesChange}
            />

            {/* Inputs de coordenadas manuales */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Latitud
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={latitud}
                  onChange={(e) => setLatitud(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 mb-1">
                  Longitud
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={longitud}
                  onChange={(e) => setLongitud(parseFloat(e.target.value))}
                  className="w-full px-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Botones de acción al pie del formulario */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Comercio'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
