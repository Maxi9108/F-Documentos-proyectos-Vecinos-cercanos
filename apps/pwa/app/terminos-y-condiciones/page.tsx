import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, FileText, CheckCircle2, AlertTriangle, Scale, HelpCircle } from 'lucide-react';

export const metadata = {
  title: 'Términos y Condiciones | NeoFaro',
  description: 'Términos y condiciones de uso de la plataforma hiperlocal NeoFaro y cláusulas de deslinde de responsabilidad.',
};

export default function TerminosYCondicionesPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Encabezado */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al Mapa del Barrio
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/50">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Términos y Condiciones de Uso
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Última actualización: Septiembre de 2026 — Plataforma NeoFaro
              </p>
            </div>
          </div>
        </div>

        {/* Tarjeta de Cláusula de Deslinde Resaltada */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-violet-950/60 via-zinc-900 to-cyan-950/60 border border-violet-500/30 shadow-xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/20 text-violet-300 border border-violet-500/30">
            <ShieldAlert className="w-4 h-4 text-cyan-400" />
            Cláusula de Garantía de Certeza y Deslinde de Responsabilidad
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed">
            <strong>NeoFaro</strong> actúa como una plataforma e infraestructura digital hiperlocal de descubrimiento, visibilidad y conexión directa. 
            El sello de verificación certifica la existencia física, actividad comercial y estado operativo constatado por nuestro equipo mediante protocolos antifraude y pulsos periódicos. 
            Sin embargo, <strong>NeoFaro no interviene como parte comercial</strong> en las operaciones, transacciones, cobros, entregas ni acuerdos pactados directamente entre los vecinos y los comercios.
          </p>
        </div>

        {/* Articulado de Términos */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-cyan-400" />
              1. Naturaleza del Servicio y Acceso sin Fricción
            </h2>
            <p>
              NeoFaro es una Progressive Web App (PWA) de acceso público y gratuito para los vecinos. El usuario puede buscar productos, consultar el catálogo barrial, visualizar comercios abiertos en tiempo real y conectarse directamente a través de WhatsApp sin intermediarios ni cobro de comisiones sobre ventas.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              2. Precios de Referencia y Transacciones Directas
            </h2>
            <p>
              Todos los precios, catálogos, combos y ofertas publicados en NeoFaro constituyen <strong>precios de referencia informativos</strong> suministrados y actualizados por los propios comerciantes.
            </p>
            <p className="text-xs text-zinc-400">
              Cualquier modificación o acuerdo de pago (efectivo, transferencia, billetera digital) se perfecciona exclusivamente de mutuo acuerdo entre el comerciante y el vecino al contactar vía WhatsApp o en el mostrador físico.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              3. Régimen Disciplinario, Strikes y Cuarentena Preventiva
            </h2>
            <p>
              Para preservar la confiabilidad del mapa hiperlocal y proteger a la comunidad de información falsa o engañosa, NeoFaro implementa un sistema riguroso de auditoría:
            </p>
            <ul className="list-disc list-inside space-y-1 text-xs text-zinc-400 pl-2">
              <li>Pulsos de verificación periódicos para ratificar operatividad del comercio.</li>
              <li>Protección anti-sabotaje de reportes comunitarios (máximo 1 reporte por dispositivo cada 30 días).</li>
              <li>Cuarentena preventiva automática ante 3 reportes independientes confirmados en un plazo de 15 días.</li>
              <li>Computo de strikes disciplinarios ante reiteración de cierres injustificados o incumplimientos de turnos acordados.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-400" />
              4. Modalidad de Retiro y Cobertura de Reparto
            </h2>
            <p>
              Para los comercios físicos con atención al público, el retiro por mostrador es la modalidad predeterminada. Para servicios de reparto a domicilio o dark stores (soda, gas, fletes, etc.), se exhiben zonas de cobertura y radios estimados sin exponer la dirección particular del proveedor. Los costos de envío y plazos de entrega son convenidos directamente entre las partes.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-cyan-400" />
              5. Contacto y Mediación Barrial
            </h2>
            <p>
              Ante cualquier inconsistencia o inconveniente de servicio con un comercio registrado, los usuarios disponen del canal de reportes y solicitudes de mediación barrial desde la propia aplicación.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-500 pt-4">
          NeoFaro &copy; {new Date().getFullYear()} — Descubrí tu barrio, cerca y sin vueltas.
        </div>
      </div>
    </div>
  );
}
