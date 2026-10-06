import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Shield, MapPin, Database, UserCheck, Mail, Lock } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidad | NeoFaro',
  description: 'Conoce cómo NeoFaro protege y gestiona tus datos personales y permisos de ubicación.',
};

export default function PoliticaPrivacidadPage() {
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
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Política de Privacidad
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400">
                Última actualización: Septiembre de 2026 — Aplicación NeoFaro
              </p>
            </div>
          </div>
        </div>

        {/* Contenido */}
        <div className="space-y-6 text-sm text-zinc-300 leading-relaxed bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8">
          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              1. Uso de la Geolocalización y Ubicación GPS
            </h2>
            <p>
              NeoFaro utiliza el sensor de geolocalización o GPS de tu dispositivo <strong>exclusivamente</strong> para centrar el mapa interactivo y mostrar los comercios, ofertas y servicios más cercanos a tu ubicación en tiempo real.
            </p>
            <p className="text-zinc-400 text-xs">
              Tu ubicación física en tiempo real nunca es almacenada en nuestros servidores centrales ni es compartida con terceros ni con fines publicitarios.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              2. Datos Recopilados y Finalidad
            </h2>
            <p>
              Dependiendo del modo en que utilices NeoFaro, se pueden recopilar los siguientes datos:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300 text-xs sm:text-sm">
              <li><strong>Vecinos y usuarios generales:</strong> Correo electrónico y nombre público al registrarse voluntariamente para guardar ubicaciones favoritas o enviar reportes ciudadanos.</li>
              <li><strong>Comerciantes:</strong> Nombre del local, dirección, rubro comercial, teléfono, WhatsApp de atención y horarios comerciales para su difusión comunitaria en el mapa.</li>
              <li><strong>Datos técnicos y de seguridad:</strong> Dirección IP anónima y tokens de sesión para prevenir spam, fraudes o ataques de denegación de servicio.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              3. Seguridad y Protección de la Información
            </h2>
            <p>
              Toda la comunicación entre tu dispositivo y nuestros servidores se realiza mediante cifrado seguro HTTPS (TLS). Las contraseñas de acceso son transformadas mediante algoritmos criptográficos irreversibles con salt (SHA-256) antes de almacenarse en la base de datos protegida por políticas de Row Level Security (RLS).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-cyan-400" />
              4. Eliminación de Cuentas y Control de Datos
            </h2>
            <p>
              De conformidad con las políticas de Google Play Store, Apple App Store y normativas de protección de datos personales, cualquier usuario o comerciante tiene derecho a solicitar la baja definitiva o eliminación completa de su cuenta y datos asociados en cualquier momento.
            </p>
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-zinc-800 space-y-2">
              <p className="text-xs text-zinc-300">
                Puedes solicitar y ejecutar la supresión inmediata de tu cuenta, favoritos y ubicaciones ingresando con tus credenciales de acceso:
              </p>
              <Link
                href="/eliminar-cuenta"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
              >
                <span>Ir a la sección de Eliminación de Cuenta y Datos</span>
                &rarr;
              </Link>
            </div>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              5. Contacto del Responsable
            </h2>
            <p>
              Para cualquier consulta sobre esta Política de Privacidad o la gestión de tus datos en NeoFaro, puedes comunicarte con el equipo de soporte y administración:
            </p>
            <p className="text-cyan-400 font-medium">
              Correo de contacto: contacto@neofaro.com
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-zinc-500 pt-4">
          NeoFaro &copy; {new Date().getFullYear()} — Comunidad de Vecinos y Comercios Cercanos. Todos los derechos reservados.
        </div>
      </div>
    </div>
  );
}
