'use client';

import React from 'react';
import { Store, Plus, Database, CheckCircle2, XCircle, Tag, RefreshCw, LogOut } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

interface AdminHeaderProps {
  totalComercios: number;
  totalAbiertos: number;
  totalCerrados: number;
  totalRubros: number;
  totalCuarentena?: number;
  onNuevoComercio: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onLogout?: () => void;
}

export default function AdminHeader({
  totalComercios,
  totalAbiertos,
  totalCerrados,
  totalRubros,
  totalCuarentena = 0,
  onNuevoComercio,
  onRefresh,
  isLoading,
  onLogout,
}: AdminHeaderProps) {
  return (
    <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Fila superior: Título, estado y acción principal */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">
                  Directorio Savio
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 uppercase tracking-wider">
                  Admin Panel
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Gestión de comercios barriales en tiempo real
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Indicador de Supabase */}
            <div className="text-xs">
              {isSupabaseConfigured ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Supabase Activo
                </span>
              ) : (
                <span
                  title="Configura las credenciales en apps/admin/.env.local para vincular a tu proyecto real"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-medium cursor-help"
                >
                  <Database className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  Modo Memoria / Demo
                </span>
              )}
            </div>

            {/* Botón Refrescar */}
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Recargar comercios"
              className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            {/* Botón Descargar Respaldo */}
            <a
              href="http://localhost:3000/api/backup?download=true"
              target="_blank"
              rel="noopener noreferrer"
              title="Descargar copia de seguridad completa (se genera automáticamente cada 12h)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-xs font-semibold transition-colors no-underline cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>Respaldar BD</span>
            </a>

            {/* Botón Nuevo Comercio */}
            <button
              type="button"
              onClick={onNuevoComercio}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Comercio</span>
            </button>

            {/* Botón Cerrar Sesión */}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Cerrar sesión de administrador"
                className="flex items-center gap-1.5 px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}
          </div>
        </div>

        {/* Fila inferior: Tarjetas de estadísticas resumidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-zinc-100 dark:border-zinc-800/80">
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200/70 dark:border-zinc-800">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs font-medium">
              <span>Total Comercios</span>
              <Store className="w-3.5 h-3.5" />
            </div>
            <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {totalComercios}
            </p>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              <span>Abiertos</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
              {totalAbiertos}
            </p>
          </div>

          <div className="bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/40">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400 text-xs font-medium">
              <span>Cerrados</span>
              <XCircle className="w-3.5 h-3.5" />
            </div>
            <p className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1">
              {totalCerrados}
            </p>
          </div>

          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center justify-between text-indigo-700 dark:text-indigo-400 text-xs font-medium">
              <span>Rubros Activos</span>
              <Tag className="w-3.5 h-3.5" />
            </div>
            <p className="text-xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
              {totalRubros}
            </p>
          </div>
        </div>

        {/* Alerta Destacada en Rojo para Cuarentena en Puerto 3001 */}
        {totalCuarentena > 0 && (
          <div className="mt-3.5 p-3 rounded-2xl bg-rose-950/80 border-2 border-rose-500 flex items-center justify-between gap-3 text-xs text-rose-200 shadow-lg shadow-rose-950/50 animate-pulse">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div>
                <strong className="text-white font-bold block sm:inline mr-1">
                  🚨 Comercios en Cuarentena Preventiva ({totalCuarentena}):
                </strong>
                <span>
                  Han acumulado 3 strikes de reportes comunitarios en menos de 15 días y fueron ocultados del mapa para revisión.
                </span>
              </div>
            </div>
            <span className="font-black text-[10px] uppercase bg-rose-600 text-white px-2.5 py-1 rounded-full shrink-0">
              Revisar Abajo
            </span>
          </div>
        )}
      </div>
    </header>
  );
}
