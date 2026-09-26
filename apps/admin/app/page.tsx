'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Comercio, CreateComercioInput } from '@/types/comercio';
import {
  getComercios,
  createComercio,
  updateComercio,
  deleteComercio,
  toggleComercioEstado,
  levantarCuarentena,
} from '@/lib/supabase';
import AdminHeader from '@/components/AdminHeader';
import ComerciosTable from '@/components/ComerciosTable';
import ComercioModal from '@/components/ComercioModal';
import DeleteConfirmModal from '@/components/DeleteConfirmModal';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

interface NotificationState {
  type: 'success' | 'error';
  message: string;
}

export default function AdminDashboard() {
  const [comercios, setComercios] = useState<Comercio[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationState | null>(null);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comercioToEdit, setComercioToEdit] = useState<Comercio | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [comercioToDelete, setComercioToDelete] = useState<Comercio | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado de actualización inline
  const [isUpdatingEstadoId, setIsUpdatingEstadoId] = useState<string | null>(null);

  // Carga inicial de datos
  const cargarComercios = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getComercios();
      setComercios(data);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'No se pudieron cargar los comercios.',
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarComercios();
  }, [cargarComercios]);

  // Temporizador para auto-ocultar notificaciones
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Cálculos estadísticos para el header
  const totalComercios = comercios.length;
  const totalAbiertos = useMemo(() => comercios.filter((c) => c.esta_abierto && !c.en_cuarentena).length, [comercios]);
  const totalCerrados = totalComercios - totalAbiertos;
  const totalRubros = useMemo(() => new Set(comercios.map((c) => c.rubro)).size, [comercios]);
  const totalCuarentena = useMemo(() => comercios.filter((c) => Boolean(c.en_cuarentena)).length, [comercios]);

  // Levantar cuarentena de un comercio
  const handleLevantarCuarentena = async (comercio: Comercio) => {
    if (confirm(`¿Levantar la cuarentena preventiva de "${comercio.nombre}" y restaurar su visibilidad pública en el mapa?`)) {
      const res = await levantarCuarentena(comercio.id);
      if (res.success) {
        setComercios((prev) =>
          prev.map((c) =>
            c.id === comercio.id
              ? {
                  ...c,
                  en_cuarentena: false,
                  fecha_cuarentena: undefined,
                  motivo_cuarentena: undefined,
                  strikes_reportes: 0,
                  esta_abierto: true,
                }
              : c
          )
        );
        setNotification({
          type: 'success',
          message: `Cuarentena de "${comercio.nombre}" levantada exitosamente.`,
        });
      } else {
        setNotification({
          type: 'error',
          message: `Error al levantar cuarentena: ${res.error}`,
        });
      }
    }
  };

  // Abrir modal de creación
  const handleNuevoComercio = () => {
    setComercioToEdit(null);
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleEditarComercio = (comercio: Comercio) => {
    setComercioToEdit(comercio);
    setIsModalOpen(true);
  };

  // Guardar (Crear o Editar)
  const handleSaveComercio = async (data: CreateComercioInput): Promise<boolean> => {
    if (comercioToEdit) {
      // Actualización
      const res = await updateComercio(comercioToEdit.id, data);
      if (res.error) {
        setNotification({
          type: 'error',
          message: `Error al actualizar: ${res.error}`,
        });
        return false;
      }

      setComercios((prev) =>
        prev.map((c) => (c.id === comercioToEdit.id ? (res.data as Comercio) : c))
      );
      setNotification({
        type: 'success',
        message: `Comercio "${data.nombre}" actualizado correctamente.`,
      });
      return true;
    } else {
      // Creación
      const res = await createComercio(data);
      if (res.error || !res.data) {
        setNotification({
          type: 'error',
          message: `Error al crear: ${res.error || 'Desconocido'}`,
        });
        return false;
      }

      setComercios((prev) => [res.data as Comercio, ...prev]);
      setNotification({
        type: 'success',
        message: `Comercio "${data.nombre}" agregado al directorio.`,
      });
      return true;
    }
  };

  // Abrir modal de eliminación
  const handleDeletePrompt = (comercio: Comercio) => {
    setComercioToDelete(comercio);
    setIsDeleteModalOpen(true);
  };

  // Confirmar eliminación
  const handleConfirmDelete = async (id: string) => {
    setIsDeleting(true);
    const res = await deleteComercio(id);
    setIsDeleting(false);

    if (res.success) {
      setComercios((prev) => prev.filter((c) => c.id !== id));
      setIsDeleteModalOpen(false);
      setComercioToDelete(null);
      setNotification({
        type: 'success',
        message: 'Comercio dado de baja con éxito.',
      });
    } else {
      setNotification({
        type: 'error',
        message: `Error al eliminar: ${res.error}`,
      });
    }
  };

  // Alternar estado abierto/cerrado directamente
  const handleToggleEstado = async (id: string, nuevoEstado: boolean) => {
    setIsUpdatingEstadoId(id);
    const res = await toggleComercioEstado(id, nuevoEstado);
    setIsUpdatingEstadoId(null);

    if (res.success) {
      setComercios((prev) =>
        prev.map((c) => (c.id === id ? { ...c, esta_abierto: nuevoEstado } : c))
      );
      setNotification({
        type: 'success',
        message: `Estado actualizado a ${nuevoEstado ? 'Abierto' : 'Cerrado'}.`,
      });
    } else {
      setNotification({
        type: 'error',
        message: `Error al cambiar estado: ${res.error}`,
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Header superior y métricas */}
      <AdminHeader
        totalComercios={totalComercios}
        totalAbiertos={totalAbiertos}
        totalCerrados={totalCerrados}
        totalRubros={totalRubros}
        totalCuarentena={totalCuarentena}
        onNuevoComercio={handleNuevoComercio}
        onRefresh={cargarComercios}
        isLoading={isLoading}
      />

      {/* Contenedor de notificación Toast flotante */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
                : 'bg-rose-900 text-rose-100 border-rose-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="p-1 hover:opacity-75 rounded transition-opacity ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Área de Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <ComerciosTable
          comercios={comercios}
          onEdit={handleEditarComercio}
          onDelete={handleDeletePrompt}
          onToggleEstado={handleToggleEstado}
          onLevantarCuarentena={handleLevantarCuarentena}
          isUpdatingEstadoId={isUpdatingEstadoId}
        />
      </main>

      {/* Modal de Creación / Edición */}
      <ComercioModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveComercio}
        comercioToEdit={comercioToEdit}
      />

      {/* Modal de Confirmación de Baja */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        comercio={comercioToDelete}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setComercioToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-5 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>
            Directorio Savio Admin &copy; {new Date().getFullYear()} — Panel de gestión y control
          </p>
        </div>
      </footer>
    </div>
  );
}
