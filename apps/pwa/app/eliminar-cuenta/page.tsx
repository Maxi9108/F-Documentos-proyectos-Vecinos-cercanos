import React from 'react';
import EliminarCuentaClient from './EliminarCuentaClient';

export const metadata = {
  title: 'Eliminación de Cuenta y Datos Personales | NeoFaro',
  description:
    'Solicita y gestiona la eliminación permanente e inmediata de tu cuenta de usuario y supresión de datos personales en NeoFaro.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function EliminarCuentaPage() {
  return <EliminarCuentaClient />;
}
