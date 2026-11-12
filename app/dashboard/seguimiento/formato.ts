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
    // Clases .badge-* definidas en app/globals.css (placa con LED de estado)
    case 'Finalizado':
      return 'badge-ok';
    case 'Pagado':
    case 'Entregado':
      return 'badge-info';
    case 'En proceso':
    case 'Parcial':
      return 'badge-progress';
    default:
      return 'badge-pending';
  }
}
