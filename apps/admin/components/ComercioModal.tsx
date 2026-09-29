'use client';

import React, { useState, useEffect } from 'react';
import { Comercio, CreateComercioInput, RUBROS_PREDEFINIDOS } from '@/types/comercio';
import SelectorMapaCoordenadasWrapper from './SelectorMapaCoordenadasWrapper';
import SelectorZonaEnvioWrapper from './SelectorZonaEnvioWrapper';
import { X, Store, Tag, MapPin, Phone, Mail, Globe, CheckCircle2, AlertCircle, Save, Bike } from 'lucide-react';

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
  const [localidad, setLocalidad] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');
  const [facebook, setFacebook] = useState('');
  const [otrosLinks, setOtrosLinks] = useState('');
  const [estaAbierto, setEstaAbierto] = useState(true);
  const [latitud, setLatitud] = useState<number>(-34.6037);
  const [longitud, setLongitud] = useState<number>(-58.4212);

  // Delivery / Envíos
  const [tipoAtencion, setTipoAtencion] = useState<'local_fisico' | 'solo_envio' | 'ambos'>('local_fisico');
  const [radioKm, setRadioKm] = useState(3);
  const [coberturaPoligono, setCoberturaPoligono] = useState<[number, number][]>([]);
  const [zonaEnvioConfirmada, setZonaEnvioConfirmada] = useState(true);

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
        setLocalidad(comercioToEdit.localidad || '');
        setTelefono(comercioToEdit.telefono || '');
        setEmail(comercioToEdit.email || comercioToEdit.email_comercio || '');
        setSitioWeb(comercioToEdit.sitio_web || '');
        setInstagram(comercioToEdit.instagram || '');
        setTiktok(comercioToEdit.tiktok || '');
        setFacebook(comercioToEdit.facebook || '');
        setOtrosLinks(comercioToEdit.otros_links || '');
        setEstaAbierto(comercioToEdit.esta_abierto);
        setLatitud(comercioToEdit.latitud);
        setLongitud(comercioToEdit.longitud);
        setTipoAtencion(comercioToEdit.tipo_atencion || 'local_fisico');
        setRadioKm(comercioToEdit.radio_entrega_metros ? comercioToEdit.radio_entrega_metros / 1000 : 3);
        setCoberturaPoligono(comercioToEdit.cobertura_poligono || []);
        setZonaEnvioConfirmada(true);
      } else {
        setNombre('');
        setRubro('Almacén');
        setOtroRubro('');
        setDireccion('');
        setLocalidad('');
        setTelefono('');
        setEmail('');
        setSitioWeb('');
        setInstagram('');
        setTiktok('');
        setFacebook('');
        setOtrosLinks('');
        setEstaAbierto(true);
        setLatitud(-34.6037);
        setLongitud(-58.4212);
        setTipoAtencion('local_fisico');
        setRadioKm(3);
        setCoberturaPoligono([]);
        setZonaEnvioConfirmada(true);
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
    if (!telefono.trim()) {
      setErrorValidacion('El teléfono de contacto es obligatorio.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorValidacion('El correo electrónico es obligatorio y debe tener formato válido.');
      return;
    }
    if (tipoAtencion !== 'local_fisico' && !zonaEnvioConfirmada) {
      setErrorValidacion('Por favor confirma la zona de envíos en el mapa antes de guardar este paso.');
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
      localidad: localidad.trim() || undefined,
      telefono: telefono.trim(),
      email: email.trim().toLowerCase(),
      email_comercio: email.trim().toLowerCase(),
      sitio_web: sitioWeb.trim() || undefined,
      instagram: instagram.trim() || undefined,
      tiktok: tiktok.trim() || undefined,
      facebook: facebook.trim() || undefined,
      otros_links: otrosLinks.trim() || undefined,
      tipo_atencion: tipoAtencion,
      radio_entrega_metros: tipoAtencion !== 'local_fisico' ? Math.round(radioKm * 1000) : 0,
      cobertura_poligono: tipoAtencion !== 'local_fisico' && coberturaPoligono.length >= 3 ? coberturaPoligono : undefined,
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

          {/* Dirección y Localidad */}
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
                Barrio o Localidad (Opcional)
              </label>
              <input
                type="text"
                value={localidad}
                onChange={(e) => setLocalidad(e.target.value)}
                placeholder="Ej. Caballito, Palermo, Centro..."
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Teléfono y Correo Electrónico (AMBOS OBLIGATORIOS) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Teléfono de Contacto * <span className="text-[10px] text-indigo-500 font-bold uppercase">(Obligatorio)</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. +54 11 4567-8901"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Correo Electrónico * <span className="text-[10px] text-indigo-500 font-bold uppercase">(Obligatorio)</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="comercio@ejemplo.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Redes Sociales y Página Web (Opcionales) */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-500" />
              Presencia Digital & Redes Sociales (Opcionales)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Página Web Oficial
                </label>
                <input
                  type="url"
                  value={sitioWeb}
                  onChange={(e) => setSitioWeb(e.target.value)}
                  placeholder="https://www.tucomercio.com"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Usuario o Link de Instagram
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@comercio o enlace"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  TikTok
                </label>
                <input
                  type="text"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="@comercio o enlace"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Facebook
                </label>
                <input
                  type="text"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="facebook.com/tucomercio"
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  Otros Enlaces (LinkedIn, PedidosYa, etc.)
                </label>
                <input
                  type="text"
                  value={otrosLinks}
                  onChange={(e) => setOtrosLinks(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Modalidad de Envíos y Delimitación en el Mapa */}
          <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Bike className="w-4 h-4 text-amber-500" />
              Modalidad de Atención y Envíos a Domicilio
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTipoAtencion('local_fisico')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  tipoAtencion === 'local_fisico'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Solo Local Físico
              </button>

              <button
                type="button"
                onClick={() => setTipoAtencion('ambos')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  tipoAtencion === 'ambos'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Local y Envíos
              </button>

              <button
                type="button"
                onClick={() => setTipoAtencion('solo_envio')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  tipoAtencion === 'solo_envio'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800'
                }`}
              >
                Solo Envíos
              </button>
            </div>

            {tipoAtencion !== 'local_fisico' && (
              <div className="pt-2">
                <SelectorZonaEnvioWrapper
                  latitud={latitud}
                  longitud={longitud}
                  radioKm={radioKm}
                  poligono={coberturaPoligono}
                  onChange={(nuevoRadio, nuevoPoligono) => {
                    setRadioKm(nuevoRadio);
                    setCoberturaPoligono(nuevoPoligono);
                  }}
                  confirmado={zonaEnvioConfirmada}
                  onToggleConfirmado={(nuevoEstado) => setZonaEnvioConfirmada(nuevoEstado)}
                />
              </div>
            )}
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
