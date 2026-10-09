'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  TODOS_LOS_PAISES,
  PAIS_DEFAULT_ARGENTINA,
  PaisTelefono,
  extraerCodigoYNumero,
  formatearWhatsAppCompleto,
} from '@/lib/codigos-pais';
import { MessageSquare, ChevronDown, Search, Check } from 'lucide-react';

interface InputWhatsAppConPaisProps {
  value: string;
  onChange: (valorCompleto: string) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

export default function InputWhatsAppConPais({
  value,
  onChange,
  label = 'WhatsApp Comercial',
  placeholder = 'Ej: 9 11 5000-0000',
  helperText,
  disabled = false,
  required = false,
  className = '',
}: InputWhatsAppConPaisProps) {
  const datosIniciales = extraerCodigoYNumero(value);
  const [codigoSeleccionado, setCodigoSeleccionado] = useState<string>(
    datosIniciales.codigoPais || PAIS_DEFAULT_ARGENTINA.codigo
  );
  const [numeroLocal, setNumeroLocal] = useState<string>(datosIniciales.numeroLocal || '');
  const [dropdownAbierto, setDropdownAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const extraido = extraerCodigoYNumero(value);
    setCodigoSeleccionado(extraido.codigoPais || PAIS_DEFAULT_ARGENTINA.codigo);
    setNumeroLocal(extraido.numeroLocal);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAbierto(false);
      }
    }
    if (dropdownAbierto) {
      document.addEventListener('mousedown', handleClickOutside);
      setTimeout(() => {
        inputBusquedaRef.current?.focus();
      }, 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownAbierto]);

  const paisActual = useMemo(() => {
    return (
      TODOS_LOS_PAISES.find((p) => p.codigo === codigoSeleccionado) ||
      PAIS_DEFAULT_ARGENTINA
    );
  }, [codigoSeleccionado]);

  const paisesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return TODOS_LOS_PAISES;
    return TODOS_LOS_PAISES.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.includes(q) ||
        p.iso.toLowerCase().includes(q)
    );
  }, [busqueda]);

  const handleSeleccionarPais = (pais: PaisTelefono) => {
    setCodigoSeleccionado(pais.codigo);
    setDropdownAbierto(false);
    setBusqueda('');
    const full = formatearWhatsAppCompleto(pais.codigo, numeroLocal);
    onChange(full);
  };

  const handleNumeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;

    // Si el usuario pega un texto con prefijo internacional (+54, etc.)
    if (inputVal.trim().startsWith('+')) {
      const extraido = extraerCodigoYNumero(inputVal);
      if (extraido.codigoPais) {
        setCodigoSeleccionado(extraido.codigoPais);
        inputVal = extraido.numeroLocal;
      }
    }

    // Sanitizar permitiendo solo números, espacios, guiones y paréntesis
    const sanitizedVal = inputVal.replace(/[^\d\s\-()]/g, '');
    setNumeroLocal(sanitizedVal);
    const full = formatearWhatsAppCompleto(codigoSeleccionado, sanitizedVal);
    onChange(full);
  };

  const advertenciaArgentina = useMemo(() => {
    if (codigoSeleccionado === '+54') {
      const soloDigitos = (numeroLocal || '').replace(/\D/g, '');
      if (soloDigitos.startsWith('0')) {
        return 'Para WhatsApp en Argentina no uses el 0 inicial (ej: en lugar de 011 poné 9 11).';
      }
      if (soloDigitos.startsWith('15')) {
        return 'Para WhatsApp en Argentina no uses el 15 (ej: usá 9 11 + número).';
      }
    }
    return null;
  }, [codigoSeleccionado, numeroLocal]);

  const numeroLimpioDigitos = (numeroLocal || '').replace(/\D/g, '');
  const codigoLimpioDigitos = (codigoSeleccionado || '+54').replace(/\D/g, '');
  const linkWhatsAppPreview =
    numeroLimpioDigitos.length >= 6
      ? `https://wa.me/${codigoLimpioDigitos}${numeroLimpioDigitos}`
      : null;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </span>
          <span className="text-[10px] text-zinc-500 font-normal">
            Predefinido: Argentina (+54)
          </span>
        </label>
      )}

      <div className="relative flex rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all shadow-sm">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setDropdownAbierto(!dropdownAbierto)}
            className="h-full px-3 py-2.5 bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-white rounded-l-xl border-r border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer select-none shrink-0"
            title={`País: ${paisActual.nombre} (${paisActual.codigo})`}
          >
            <span className="text-base leading-none">{paisActual.bandera}</span>
            <span className="font-mono text-zinc-700 dark:text-zinc-200">{paisActual.codigo}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${
                dropdownAbierto ? 'rotate-180 text-indigo-500' : ''
              }`}
            />
          </button>

          {dropdownAbierto && (
            <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 max-h-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="p-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 sticky top-0 z-10">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={inputBusquedaRef}
                    type="text"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscar país o código (+54, Chile, etc)..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="overflow-y-auto max-h-64 divide-y divide-zinc-100 dark:divide-zinc-800">
                {paisesFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    No se encontró ningún país con "{busqueda}"
                  </div>
                ) : (
                  paisesFiltrados.map((p, idx) => {
                    const esSeleccionado = p.codigo === codigoSeleccionado;
                    const esArgentina = p.codigo === '+54' && p.iso === 'AR';
                    return (
                      <button
                        key={`${p.iso}-${p.codigo}-${idx}`}
                        type="button"
                        onClick={() => handleSeleccionarPais(p)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 ${
                          esSeleccionado
                            ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 font-bold'
                            : 'text-zinc-700 dark:text-zinc-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base shrink-0">{p.bandera}</span>
                          <span className="truncate">{p.nombre}</span>
                          {esArgentina && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-bold shrink-0">
                              Predeterminado
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <span className="font-mono text-[11px] text-zinc-400">
                            {p.codigo}
                          </span>
                          {esSeleccionado && (
                            <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          )}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative flex-1">
          <input
            type="tel"
            disabled={disabled}
            required={required}
            value={numeroLocal}
            onChange={handleNumeroChange}
            placeholder={placeholder}
            className="w-full px-3.5 py-2.5 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Advertencia preventiva para Argentina (evitar 0 o 15) */}
      {advertenciaArgentina && (
        <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-1.5 animate-in fade-in">
          <span className="shrink-0 text-sm">💡</span>
          <span>{advertenciaArgentina}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-zinc-500">
        <span>
          {helperText ||
            (codigoSeleccionado === '+54'
              ? 'Para Argentina incluye el código de área (ej: 9 11 5000-0000)'
              : `Ingresa tu número local sin el código de país (${codigoSeleccionado})`)}
        </span>
        {linkWhatsAppPreview && (
          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[10px] truncate">
            Directo: {codigoSeleccionado} {numeroLocal}
          </span>
        )}
      </div>
    </div>
  );
}
