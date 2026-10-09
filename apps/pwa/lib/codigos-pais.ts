/**
 * Lista exhaustiva de códigos de llamada internacional y países de todo el mundo.
 * El país predefinido es Argentina (+54).
 */

export interface PaisTelefono {
  nombre: string;
  codigo: string; // ej: '+54'
  bandera: string; // ej: '🇦🇷'
  iso: string; // ej: 'AR'
}

export const PAIS_DEFAULT_ARGENTINA: PaisTelefono = {
  nombre: 'Argentina',
  codigo: '+54',
  bandera: '🇦🇷',
  iso: 'AR',
};

// Lista completa de países y territorios del mundo (ordenada alfabéticamente en español, con Argentina destacada)
export const TODOS_LOS_PAISES: PaisTelefono[] = [
  PAIS_DEFAULT_ARGENTINA,
  { nombre: 'Afganistán', codigo: '+93', bandera: '🇦🇫', iso: 'AF' },
  { nombre: 'Albania', codigo: '+355', bandera: '🇦🇱', iso: 'AL' },
  { nombre: 'Alemania', codigo: '+49', bandera: '🇩🇪', iso: 'DE' },
  { nombre: 'Andorra', codigo: '+376', bandera: '🇦🇩', iso: 'AD' },
  { nombre: 'Angola', codigo: '+244', bandera: '🇦🇴', iso: 'AO' },
  { nombre: 'Antigua y Barbuda', codigo: '+1268', bandera: '🇦🇬', iso: 'AG' },
  { nombre: 'Arabia Saudita', codigo: '+966', bandera: '🇸🇦', iso: 'SA' },
  { nombre: 'Argelia', codigo: '+213', bandera: '🇩🇿', iso: 'DZ' },
  { nombre: 'Armenia', codigo: '+374', bandera: '🇦🇲', iso: 'AM' },
  { nombre: 'Australia', codigo: '+61', bandera: '🇦🇺', iso: 'AU' },
  { nombre: 'Austria', codigo: '+43', bandera: '🇦🇹', iso: 'AT' },
  { nombre: 'Azerbaiyán', codigo: '+994', bandera: '🇦🇿', iso: 'AZ' },
  { nombre: 'Bahamas', codigo: '+1242', bandera: '🇧🇸', iso: 'BS' },
  { nombre: 'Bangladés', codigo: '+880', bandera: '🇧🇩', iso: 'BD' },
  { nombre: 'Barbados', codigo: '+1246', bandera: '🇧🇧', iso: 'BB' },
  { nombre: 'Baréin', codigo: '+973', bandera: '🇧🇭', iso: 'BH' },
  { nombre: 'Bélgica', codigo: '+32', bandera: '🇧🇪', iso: 'BE' },
  { nombre: 'Belice', codigo: '+501', bandera: '🇧🇿', iso: 'BZ' },
  { nombre: 'Benín', codigo: '+229', bandera: '🇧🇯', iso: 'BJ' },
  { nombre: 'Bielorrusia', codigo: '+375', bandera: '🇧🇾', iso: 'BY' },
  { nombre: 'Bolivia', codigo: '+591', bandera: '🇧🇴', iso: 'BO' },
  { nombre: 'Bosnia y Herzegovina', codigo: '+387', bandera: '🇧🇦', iso: 'BA' },
  { nombre: 'Botsuana', codigo: '+267', bandera: '🇧🇼', iso: 'BW' },
  { nombre: 'Brasil', codigo: '+55', bandera: '🇧🇷', iso: 'BR' },
  { nombre: 'Brunéi', codigo: '+673', bandera: '🇧🇳', iso: 'BN' },
  { nombre: 'Bulgaria', codigo: '+359', bandera: '🇧🇬', iso: 'BG' },
  { nombre: 'Burkina Faso', codigo: '+226', bandera: '🇧🇫', iso: 'BF' },
  { nombre: 'Burundi', codigo: '+257', bandera: '🇧🇮', iso: 'BI' },
  { nombre: 'Bután', codigo: '+975', bandera: '🇧🇹', iso: 'BT' },
  { nombre: 'Cabo Verde', codigo: '+238', bandera: '🇨🇻', iso: 'CV' },
  { nombre: 'Camboya', codigo: '+855', bandera: '🇰🇭', iso: 'KH' },
  { nombre: 'Camerún', codigo: '+237', bandera: '🇨🇲', iso: 'CM' },
  { nombre: 'Canadá', codigo: '+1', bandera: '🇨🇦', iso: 'CA' },
  { nombre: 'Catar', codigo: '+974', bandera: '🇶🇦', iso: 'QA' },
  { nombre: 'Chad', codigo: '+235', bandera: '🇹🇩', iso: 'TD' },
  { nombre: 'Chile', codigo: '+56', bandera: '🇨🇱', iso: 'CL' },
  { nombre: 'China', codigo: '+86', bandera: '🇨🇳', iso: 'CN' },
  { nombre: 'Chipre', codigo: '+357', bandera: '🇨🇾', iso: 'CY' },
  { nombre: 'Colombia', codigo: '+57', bandera: '🇨🇴', iso: 'CO' },
  { nombre: 'Comoras', codigo: '+269', bandera: '🇰🇲', iso: 'KM' },
  { nombre: 'Corea del Norte', codigo: '+850', bandera: '🇰🇵', iso: 'KP' },
  { nombre: 'Corea del Sur', codigo: '+82', bandera: '🇰🇷', iso: 'KR' },
  { nombre: 'Costa de Marfil', codigo: '+225', bandera: '🇨🇮', iso: 'CI' },
  { nombre: 'Costa Rica', codigo: '+506', bandera: '🇨🇷', iso: 'CR' },
  { nombre: 'Croacia', codigo: '+385', bandera: '🇭🇷', iso: 'HR' },
  { nombre: 'Cuba', codigo: '+53', bandera: '🇨🇺', iso: 'CU' },
  { nombre: 'Dinamarca', codigo: '+45', bandera: '🇩🇰', iso: 'DK' },
  { nombre: 'Dominica', codigo: '+1767', bandera: '🇩🇲', iso: 'DM' },
  { nombre: 'Ecuador', codigo: '+593', bandera: '🇪🇨', iso: 'EC' },
  { nombre: 'Egipto', codigo: '+20', bandera: '🇪🇬', iso: 'EG' },
  { nombre: 'El Salvador', codigo: '+503', bandera: '🇸🇻', iso: 'SV' },
  { nombre: 'Emiratos Árabes Unidos', codigo: '+971', bandera: '🇦🇪', iso: 'AE' },
  { nombre: 'Eritrea', codigo: '+291', bandera: '🇪🇷', iso: 'ER' },
  { nombre: 'Eslovaquia', codigo: '+421', bandera: '🇸🇰', iso: 'SK' },
  { nombre: 'Eslovenia', codigo: '+386', bandera: '🇸🇮', iso: 'SI' },
  { nombre: 'España', codigo: '+34', bandera: '🇪🇸', iso: 'ES' },
  { nombre: 'Estados Unidos', codigo: '+1', bandera: '🇺🇸', iso: 'US' },
  { nombre: 'Estonia', codigo: '+372', bandera: '🇪🇪', iso: 'EE' },
  { nombre: 'Esuatini', codigo: '+268', bandera: '🇸🇿', iso: 'SZ' },
  { nombre: 'Etiopía', codigo: '+251', bandera: '🇪🇹', iso: 'ET' },
  { nombre: 'Filipinas', codigo: '+63', bandera: '🇵🇭', iso: 'PH' },
  { nombre: 'Finlandia', codigo: '+358', bandera: '🇫🇮', iso: 'FI' },
  { nombre: 'Fiyi', codigo: '+679', bandera: '🇫🇯', iso: 'FJ' },
  { nombre: 'Francia', codigo: '+33', bandera: '🇫🇷', iso: 'FR' },
  { nombre: 'Gabón', codigo: '+241', bandera: '🇬🇦', iso: 'GA' },
  { nombre: 'Gambia', codigo: '+220', bandera: '🇬🇲', iso: 'GM' },
  { nombre: 'Georgia', codigo: '+995', bandera: '🇬🇪', iso: 'GE' },
  { nombre: 'Ghana', codigo: '+233', bandera: '🇬🇭', iso: 'GH' },
  { nombre: 'Granada', codigo: '+1473', bandera: '🇬🇩', iso: 'GD' },
  { nombre: 'Grecia', codigo: '+30', bandera: '🇬🇷', iso: 'GR' },
  { nombre: 'Guatemala', codigo: '+502', bandera: '🇬🇹', iso: 'GT' },
  { nombre: 'Guinea', codigo: '+224', bandera: '🇬🇳', iso: 'GN' },
  { nombre: 'Guinea-Bisáu', codigo: '+245', bandera: '🇬🇼', iso: 'GW' },
  { nombre: 'Guinea Ecuatorial', codigo: '+240', bandera: '🇬🇶', iso: 'GQ' },
  { nombre: 'Guyana', codigo: '+592', bandera: '🇬🇾', iso: 'GY' },
  { nombre: 'Haití', codigo: '+509', bandera: '🇭🇹', iso: 'HT' },
  { nombre: 'Honduras', codigo: '+504', bandera: '🇭🇳', iso: 'HN' },
  { nombre: 'Hong Kong', codigo: '+852', bandera: '🇭🇰', iso: 'HK' },
  { nombre: 'Hungría', codigo: '+36', bandera: '🇭🇺', iso: 'HU' },
  { nombre: 'India', codigo: '+91', bandera: '🇮🇳', iso: 'IN' },
  { nombre: 'Indonesia', codigo: '+62', bandera: '🇮🇩', iso: 'ID' },
  { nombre: 'Irak', codigo: '+964', bandera: '🇮🇶', iso: 'IQ' },
  { nombre: 'Irán', codigo: '+98', bandera: '🇮🇷', iso: 'IR' },
  { nombre: 'Irlanda', codigo: '+353', bandera: '🇮🇪', iso: 'IE' },
  { nombre: 'Islandia', codigo: '+354', bandera: '🇮🇸', iso: 'IS' },
  { nombre: 'Israel', codigo: '+972', bandera: '🇮🇱', iso: 'IL' },
  { nombre: 'Italia', codigo: '+39', bandera: '🇮🇹', iso: 'IT' },
  { nombre: 'Jamaica', codigo: '+1876', bandera: '🇯🇲', iso: 'JM' },
  { nombre: 'Japón', codigo: '+81', bandera: '🇯🇵', iso: 'JP' },
  { nombre: 'Jordania', codigo: '+962', bandera: '🇯🇴', iso: 'JO' },
  { nombre: 'Kazajistán', codigo: '+7', bandera: '🇰🇿', iso: 'KZ' },
  { nombre: 'Kenia', codigo: '+254', bandera: '🇰🇪', iso: 'KE' },
  { nombre: 'Kirguistán', codigo: '+996', bandera: '🇰🇬', iso: 'KG' },
  { nombre: 'Kiribati', codigo: '+686', bandera: '🇰🇮', iso: 'KI' },
  { nombre: 'Kuwait', codigo: '+965', bandera: '🇰🇼', iso: 'KW' },
  { nombre: 'Laos', codigo: '+856', bandera: '🇱🇦', iso: 'LA' },
  { nombre: 'Lesoto', codigo: '+266', bandera: '🇱🇸', iso: 'LS' },
  { nombre: 'Letonia', codigo: '+371', bandera: '🇱🇻', iso: 'LV' },
  { nombre: 'Líbano', codigo: '+961', bandera: '🇱🇧', iso: 'LB' },
  { nombre: 'Liberia', codigo: '+231', bandera: '🇱🇷', iso: 'LR' },
  { nombre: 'Libia', codigo: '+218', bandera: '🇱🇾', iso: 'LY' },
  { nombre: 'Liechtenstein', codigo: '+423', bandera: '🇱🇮', iso: 'LI' },
  { nombre: 'Lituania', codigo: '+370', bandera: '🇱🇹', iso: 'LT' },
  { nombre: 'Luxemburgo', codigo: '+352', bandera: '🇱🇺', iso: 'LU' },
  { nombre: 'Macao', codigo: '+853', bandera: '🇲🇴', iso: 'MO' },
  { nombre: 'Macedonia del Norte', codigo: '+389', bandera: '🇲🇰', iso: 'MK' },
  { nombre: 'Madagascar', codigo: '+261', bandera: '🇲🇬', iso: 'MG' },
  { nombre: 'Malasia', codigo: '+60', bandera: '🇲🇾', iso: 'MY' },
  { nombre: 'Malaui', codigo: '+265', bandera: '🇲🇼', iso: 'MW' },
  { nombre: 'Maldivas', codigo: '+960', bandera: '🇲🇻', iso: 'MV' },
  { nombre: 'Malí', codigo: '+223', bandera: '🇲🇱', iso: 'ML' },
  { nombre: 'Malta', codigo: '+356', bandera: '🇲🇹', iso: 'MT' },
  { nombre: 'Marruecos', codigo: '+212', bandera: '🇲🇦', iso: 'MA' },
  { nombre: 'Mauricio', codigo: '+230', bandera: '🇲🇺', iso: 'MU' },
  { nombre: 'Mauritania', codigo: '+222', bandera: '🇲🇷', iso: 'MR' },
  { nombre: 'México', codigo: '+52', bandera: '🇲🇽', iso: 'MX' },
  { nombre: 'Micronesia', codigo: '+691', bandera: '🇫🇲', iso: 'FM' },
  { nombre: 'Moldavia', codigo: '+373', bandera: '🇲🇩', iso: 'MD' },
  { nombre: 'Mónaco', codigo: '+377', bandera: '🇲🇨', iso: 'MC' },
  { nombre: 'Mongolia', codigo: '+976', bandera: '🇲🇳', iso: 'MN' },
  { nombre: 'Montenegro', codigo: '+382', bandera: '🇲🇪', iso: 'ME' },
  { nombre: 'Mozambique', codigo: '+258', bandera: '🇲🇿', iso: 'MZ' },
  { nombre: 'Myanmar', codigo: '+95', bandera: '🇲🇲', iso: 'MM' },
  { nombre: 'Namibia', codigo: '+264', bandera: '🇳🇦', iso: 'NA' },
  { nombre: 'Nauru', codigo: '+674', bandera: '🇳🇷', iso: 'NR' },
  { nombre: 'Nepal', codigo: '+977', bandera: '🇳🇵', iso: 'NP' },
  { nombre: 'Nicaragua', codigo: '+505', bandera: '🇳🇮', iso: 'NI' },
  { nombre: 'Níger', codigo: '+227', bandera: '🇳🇪', iso: 'NE' },
  { nombre: 'Nigeria', codigo: '+234', bandera: '🇳🇬', iso: 'NG' },
  { nombre: 'Noruega', codigo: '+47', bandera: '🇳🇴', iso: 'NO' },
  { nombre: 'Nueva Zelanda', codigo: '+64', bandera: '🇳🇿', iso: 'NZ' },
  { nombre: 'Omán', codigo: '+968', bandera: '🇴🇲', iso: 'OM' },
  { nombre: 'Países Bajos', codigo: '+31', bandera: '🇳🇱', iso: 'NL' },
  { nombre: 'Pakistán', codigo: '+92', bandera: '🇵🇰', iso: 'PK' },
  { nombre: 'Palaos', codigo: '+680', bandera: '🇵🇼', iso: 'PW' },
  { nombre: 'Palestina', codigo: '+970', bandera: '🇵🇸', iso: 'PS' },
  { nombre: 'Panamá', codigo: '+507', bandera: '🇵🇦', iso: 'PA' },
  { nombre: 'Papúa Nueva Guinea', codigo: '+675', bandera: '🇵🇬', iso: 'PG' },
  { nombre: 'Paraguay', codigo: '+595', bandera: '🇵🇾', iso: 'PY' },
  { nombre: 'Perú', codigo: '+51', bandera: '🇵🇪', iso: 'PE' },
  { nombre: 'Polonia', codigo: '+48', bandera: '🇵🇱', iso: 'PL' },
  { nombre: 'Portugal', codigo: '+351', bandera: '🇵🇹', iso: 'PT' },
  { nombre: 'Puerto Rico', codigo: '+1787', bandera: '🇵🇷', iso: 'PR' },
  { nombre: 'Reino Unido', codigo: '+44', bandera: '🇬🇧', iso: 'GB' },
  { nombre: 'República Centroafricana', codigo: '+236', bandera: '🇨🇫', iso: 'CF' },
  { nombre: 'República Checa', codigo: '+420', bandera: '🇨🇿', iso: 'CZ' },
  { nombre: 'República del Congo', codigo: '+242', bandera: '🇨🇬', iso: 'CG' },
  { nombre: 'República Democrática del Congo', codigo: '+243', bandera: '🇨🇩', iso: 'CD' },
  { nombre: 'República Dominicana', codigo: '+1809', bandera: '🇩🇴', iso: 'DO' },
  { nombre: 'Ruanda', codigo: '+250', bandera: '🇷🇼', iso: 'RW' },
  { nombre: 'Rumania', codigo: '+40', bandera: '🇷🇴', iso: 'RO' },
  { nombre: 'Rusia', codigo: '+7', bandera: '🇷🇺', iso: 'RU' },
  { nombre: 'Samoa', codigo: '+685', bandera: '🇼🇸', iso: 'WS' },
  { nombre: 'San Cristóbal y Nieves', codigo: '+1869', bandera: '🇰🇳', iso: 'KN' },
  { nombre: 'San Marino', codigo: '+378', bandera: '🇸🇲', iso: 'SM' },
  { nombre: 'San Vicente y las Granadinas', codigo: '+1784', bandera: '🇻🇨', iso: 'VC' },
  { nombre: 'Santa Lucía', codigo: '+1758', bandera: '🇱🇨', iso: 'LC' },
  { nombre: 'Santo Tomé y Príncipe', codigo: '+239', bandera: '🇸🇹', iso: 'ST' },
  { nombre: 'Senegal', codigo: '+221', bandera: '🇸🇳', iso: 'SN' },
  { nombre: 'Serbia', codigo: '+381', bandera: '🇷🇸', iso: 'RS' },
  { nombre: 'Seychelles', codigo: '+248', bandera: '🇸🇨', iso: 'SC' },
  { nombre: 'Sierra Leona', codigo: '+232', bandera: '🇸🇱', iso: 'SL' },
  { nombre: 'Singapur', codigo: '+65', bandera: '🇸🇬', iso: 'SG' },
  { nombre: 'Siria', codigo: '+963', bandera: '🇸🇾', iso: 'SY' },
  { nombre: 'Somalia', codigo: '+252', bandera: '🇸🇴', iso: 'SO' },
  { nombre: 'Sri Lanka', codigo: '+94', bandera: '🇱🇰', iso: 'LK' },
  { nombre: 'Sudáfrica', codigo: '+27', bandera: '🇿🇦', iso: 'ZA' },
  { nombre: 'Sudán', codigo: '+249', bandera: '🇸🇩', iso: 'SD' },
  { nombre: 'Sudán del Sur', codigo: '+211', bandera: '🇸🇸', iso: 'SS' },
  { nombre: 'Suecia', codigo: '+46', bandera: '🇸🇪', iso: 'SE' },
  { nombre: 'Suiza', codigo: '+41', bandera: '🇨🇭', iso: 'CH' },
  { nombre: 'Surinam', codigo: '+597', bandera: '🇸🇷', iso: 'SR' },
  { nombre: 'Tailandia', codigo: '+66', bandera: '🇹🇭', iso: 'TH' },
  { nombre: 'Taiwán', codigo: '+886', bandera: '🇹🇼', iso: 'TW' },
  { nombre: 'Tanzania', codigo: '+255', bandera: '🇹🇿', iso: 'TZ' },
  { nombre: 'Tayikistán', codigo: '+992', bandera: '🇹🇯', iso: 'TJ' },
  { nombre: 'Timor Oriental', codigo: '+670', bandera: '🇹🇱', iso: 'TL' },
  { nombre: 'Togo', codigo: '+228', bandera: '🇹🇬', iso: 'TG' },
  { nombre: 'Tonga', codigo: '+676', bandera: '🇹🇴', iso: 'TO' },
  { nombre: 'Trinidad y Tobago', codigo: '+1868', bandera: '🇹🇹', iso: 'TT' },
  { nombre: 'Túnez', codigo: '+216', bandera: '🇹🇳', iso: 'TN' },
  { nombre: 'Turkmenistán', codigo: '+993', bandera: '🇹🇲', iso: 'TM' },
  { nombre: 'Turquía', codigo: '+90', bandera: '🇹🇷', iso: 'TR' },
  { nombre: 'Tuvalu', codigo: '+688', bandera: '🇹🇻', iso: 'TV' },
  { nombre: 'Ucrania', codigo: '+380', bandera: '🇺🇦', iso: 'UA' },
  { nombre: 'Uganda', codigo: '+256', bandera: '🇺🇬', iso: 'UG' },
  { nombre: 'Uruguay', codigo: '+598', bandera: '🇺🇾', iso: 'UY' },
  { nombre: 'Uzbekistán', codigo: '+998', bandera: '🇺🇿', iso: 'UZ' },
  { nombre: 'Vanuatu', codigo: '+678', bandera: '🇻🇺', iso: 'VU' },
  { nombre: 'Vaticano', codigo: '+379', bandera: '🇻🇦', iso: 'VA' },
  { nombre: 'Venezuela', codigo: '+58', bandera: '🇻🇪', iso: 'VE' },
  { nombre: 'Vietnam', codigo: '+84', bandera: '🇻🇳', iso: 'VN' },
  { nombre: 'Yemen', codigo: '+967', bandera: '🇾🇪', iso: 'YE' },
  { nombre: 'Yibuti', codigo: '+253', bandera: '🇩🇯', iso: 'DJ' },
  { nombre: 'Zambia', codigo: '+260', bandera: '🇿🇲', iso: 'ZM' },
  { nombre: 'Zimbabue', codigo: '+263', bandera: '🇿🇼', iso: 'ZW' },
];

/**
 * Extrae el código de país y el número local desde un string completo de WhatsApp.
 * Si no tiene código o es vacío, asume Argentina (+54).
 */
export function extraerCodigoYNumero(whatsappCompleto: string = ''): {
  codigoPais: string;
  numeroLocal: string;
  pais: PaisTelefono;
} {
  const limpio = (whatsappCompleto || '').trim();
  if (!limpio) {
    return {
      codigoPais: PAIS_DEFAULT_ARGENTINA.codigo,
      numeroLocal: '',
      pais: PAIS_DEFAULT_ARGENTINA,
    };
  }

  // Ordenar países por longitud de código descendente para evitar colisiones
  const paisesOrdenados = [...TODOS_LOS_PAISES].sort(
    (a, b) => b.codigo.length - a.codigo.length
  );

  // Buscar coincidencia si empieza con '+'
  if (limpio.startsWith('+')) {
    for (const p of paisesOrdenados) {
      if (limpio.startsWith(p.codigo)) {
        const local = limpio.slice(p.codigo.length).trim();
        return {
          codigoPais: p.codigo,
          numeroLocal: local,
          pais: p,
        };
      }
    }
  }

  // Buscar coincidencia si empieza con el número del código sin '+'
  for (const p of paisesOrdenados) {
    const codSinPlus = p.codigo.replace('+', '');
    if (limpio.startsWith(codSinPlus) && limpio.length > codSinPlus.length + 5) {
      const local = limpio.slice(codSinPlus.length).trim();
      return {
        codigoPais: p.codigo,
        numeroLocal: local,
        pais: p,
      };
    }
  }

  // Por defecto Argentina (+54)
  return {
    codigoPais: PAIS_DEFAULT_ARGENTINA.codigo,
    numeroLocal: limpio,
    pais: PAIS_DEFAULT_ARGENTINA,
  };
}

/**
 * Combina el código de país con el número local para generar el formato internacional completo.
 */
export function formatearWhatsAppCompleto(
  codigoPais: string,
  numeroLocal: string
): string {
  const localLimpio = numeroLocal.trim();
  if (!localLimpio) return '';
  const cod = codigoPais.startsWith('+') ? codigoPais : `+${codigoPais}`;
  return `${cod} ${localLimpio}`;
}

/**
 * Genera la URL oficial de wa.me normalizada para cualquier país del mundo.
 * Aplica reglas especiales de la API de WhatsApp (por ejemplo, para Argentina +54 antepone '9'
 * y remueve '0' de larga distancia o '15' de celular).
 */
export function construirEnlaceWhatsApp(numeroCompleto: string, mensaje?: string): string {
  if (!numeroCompleto) return '';
  const parsed = extraerCodigoYNumero(numeroCompleto);
  let cod = parsed.codigoPais.replace('+', '');
  let local = parsed.numeroLocal.replace(/\D/g, '');


  if (!local) return '';

  if (cod === '54') {
    // Si empieza con 0 (prefijo interurbano), quitarlo
    if (local.startsWith('0')) {
      local = local.slice(1);
    }
    // Si no empieza con 9 (requerido por WhatsApp para móviles argentinos), anteponer 9 y quitar '15' si existe
    if (!local.startsWith('9')) {
      local = `9${local.replace(/^15/, '')}`;
    }
  }

  const numFinal = `${cod}${local}`;
  const base = `https://wa.me/${numFinal}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

