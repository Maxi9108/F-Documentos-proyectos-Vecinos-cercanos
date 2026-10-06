import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Shield,
  MapPin,
  Layers,
  Server,
  Lock,
  RefreshCw,
  Mail,
  ExternalLink,
  UserX,
} from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad | NeoFaro',
  description: 'Política de Privacidad de NeoFaro. Conoce cómo protegemos y gestionamos tu información.',
};

export default function PoliticaPrivacidadPage() {
  const emailContacto = 'lic.maxisanchez@gmail.com';
  const asuntoEmail = encodeURIComponent('Consulta sobre Política de Privacidad - NeoFaro');
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${emailContacto}&su=${asuntoEmail}`;
  const mailtoUrl = `mailto:${emailContacto}?subject=${asuntoEmail}`;

  return (
    <div className="min-h-screen bg-black text-zinc-100 py-12 px-4 sm:px-6 lg:px-8 selection:bg-cyan-500 selection:text-black">
      {/* Glow ambiental */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-violet-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto space-y-8">
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
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/40">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Política de Privacidad de NeoFaro
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Última actualización: Octubre 2026
              </p>
            </div>
          </div>
        </div>

        {/* Contenido principal de la Política */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed bg-zinc-950/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          {/* 1. Información que recopilamos */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              1. Información que recopilamos
            </h2>
            <p>
              NeoFaro recopila información de manera transparente para mejorar la experiencia del usuario. Esto puede incluir datos de ubicación aproximada o precisa (solo si el usuario otorga el permiso explícito en su dispositivo) para mostrar los comercios y servicios más cercanos.
            </p>
          </section>

          {/* 2. Uso de la información */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              2. Uso de la información
            </h2>
            <p>
              Los datos recopilados se utilizan exclusivamente para el funcionamiento interno de la aplicación, como la visualización de comercios en el mapa, cálculo de distancias y la gestión de filtros de búsqueda. No vendemos ni compartimos información personal con terceros para fines publicitarios.
            </p>
          </section>

          {/* 3. Proveedores de servicios de terceros */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              3. Proveedores de servicios de terceros
            </h2>
            <p>
              La aplicación puede utilizar servicios de terceros (como servicios de mapas o bases de datos) que pueden recopilar información utilizada para identificarlo. Estos servicios operan bajo sus propias políticas de privacidad.
            </p>
          </section>

          {/* 4. Seguridad */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              4. Seguridad
            </h2>
            <p>
              Valoramos su confianza al proporcionarnos su información personal y utilizamos medios comercialmente aceptables para protegerla. Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro.
            </p>
          </section>

          {/* 5. Cambios en esta política */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              5. Cambios en esta política
            </h2>
            <p>
              Podemos actualizar nuestra Política de Privacidad de vez en cuando. Se recomienda revisar esta página periódicamente para ver los cambios.
            </p>
          </section>

          {/* 6. Contacto */}
          <section className="space-y-3 pt-2 border-t border-zinc-800/80">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              6. Contacto
            </h2>
            <p className="leading-relaxed">
              Si tiene alguna pregunta o sugerencia sobre nuestra Política de Privacidad, no dude en contactarnos a{' '}
              <a
                href={gmailUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir correo en Gmail hacia lic.maxisanchez@gmail.com"
                className="text-cyan-400 font-bold hover:text-cyan-300 underline underline-offset-4 cursor-pointer inline-flex items-center gap-1"
              >
                <span>ayuda</span>
                <ExternalLink className="w-3 h-3 inline" />
              </a>
              .
            </p>

            {/* Tarjeta de contacto con acceso directo a Gmail */}
            <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-zinc-200">
                  Canal directo de correo:
                </p>
                <p className="text-xs font-mono text-cyan-300">
                  {emailContacto}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={gmailUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-md shadow-red-950/40 transition-all cursor-pointer"
                  title="Abrir redactor de Gmail en una nueva pestaña"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Enviar mail desde Gmail</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>

                <a
                  href={mailtoUrl}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-colors"
                  title="Abrir en tu cliente de correo predeterminado"
                >
                  <span>Otro cliente</span>
                </a>
              </div>
            </div>
          </section>

          {/* 7. Eliminación y Supresión de Datos (Google Play / App Store Compliance) */}
          <section className="space-y-3 pt-2 border-t border-zinc-800/80">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserX className="w-4 h-4 text-rose-400" />
              7. Eliminación de Cuentas y Supresión de Datos
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300">
              De conformidad con las políticas de Google Play Store, Apple App Store y regulaciones de privacidad, cualquier usuario puede solicitar y ejecutar la eliminación definitiva e inmediata de su cuenta y todos sus datos personales asociados:
            </p>
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-zinc-300">
                Puedes purgar tu usuario, contraseñas, ubicaciones y favoritos en tiempo real desde la sección dedicada.
              </p>
              <Link
                href="/eliminar-cuenta"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors shrink-0"
              >
                <span>Eliminar Cuenta y Datos</span>
                &rarr;
              </Link>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-500 pt-2 space-y-1">
          <p>
            NeoFaro &copy; {new Date().getFullYear()} — Comunidad de Vecinos y Comercios Cercanos.
          </p>
          <div className="flex items-center justify-center gap-3 text-[11px]">
            <Link href="/" className="text-zinc-400 hover:text-cyan-400 transition-colors">
              Inicio
            </Link>
            <span className="text-zinc-700">•</span>
            <Link href="/terminos-y-condiciones" className="text-zinc-400 hover:text-cyan-400 transition-colors">
              Términos y Condiciones
            </Link>
            <span className="text-zinc-700">•</span>
            <Link href="/eliminar-cuenta" className="text-zinc-400 hover:text-rose-400 transition-colors">
              Eliminar Cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
