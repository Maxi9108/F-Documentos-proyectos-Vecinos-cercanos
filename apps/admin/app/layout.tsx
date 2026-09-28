import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Panel Administrativo — NeoFaro',
  description: 'Gestión y administración del catálogo de comercios barriales — NeoFaro',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
