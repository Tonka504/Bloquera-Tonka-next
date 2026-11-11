// Utilidades de presentación compartidas por la lista y el detalle de Seguimiento.

export const TIPOS_BLOQUE = [
  { value: 'bloque_de_4"', label: 'Bloque de 4"' },
  { value: 'bloque_de_5"', label: 'Bloque de 5"' },
  { value: 'bloque_de_6"', label: 'Bloque de 6"' },
];

export const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Tarjeta', 'Otro'] as const;

export const nombreBloque = (tipo: string) => tipo.replace('bloque_de_', 'Bloque de ');

export const dinero = (n: number) =>
  `L. ${Number(n).toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const entero = (n: number) => Number(n).toLocaleString('es-HN');

// 'YYYY-MM-DD' -> dd/mm/aaaa sin conversión de zona horaria.
export const fechaCorta = (f: string) => {
  const [y, m, d] = (f || '').split('-');
  return y && m && d ? `${d}/${m}/${y}` : f;
};

// Fecha local de hoy en formato YYYY-MM-DD (toISOString usaría UTC y en la
// noche de Honduras ya marcaría el día siguiente).
export const hoyLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function estiloEstado(estado: string) {
  switch (estado) {
    case 'Finalizado':
      return 'text-emerald-800 border-emerald-800/30 bg-emerald-50';
    case 'Pagado':
    case 'Entregado':
      return 'text-sky-900 border-sky-900/20 bg-sky-50';
    case 'En proceso':
    case 'Parcial':
      return 'text-brand-accent border-brand-accent/30 bg-brand-accent-soft';
    default:
      return 'text-[#8a8175] border-brand-line bg-white';
  }
}
