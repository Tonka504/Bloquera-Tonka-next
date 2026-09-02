/**
 * Rango de fechas por defecto para las pantallas que consultan la base de datos:
 * del primero del mes actual hasta hoy.
 */
export function rangoMesActual(): { fechaDesde: string; fechaHasta: string } {
  const hoy = new Date();
  const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  return {
    fechaDesde: formatFechaISO(primerDia),
    fechaHasta: formatFechaISO(hoy),
  };
}

function formatFechaISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

/**
 * Convierte un rango "YYYY-MM-DD" a un texto legible en español, ej:
 * "1 – 2 de septiembre de 2026" o "28 de agosto – 2 de septiembre de 2026"
 * o "1 de septiembre de 2025 – 2 de septiembre de 2026" si cruza de año.
 */
export function formatRangoLegible(fechaDesde: string, fechaHasta: string): string {
  if (!fechaDesde || !fechaHasta) return '';
  const [y1, m1, d1] = fechaDesde.split('-').map(Number);
  const [y2, m2, d2] = fechaHasta.split('-').map(Number);
  if (!y1 || !y2) return '';

  const mismoAnio = y1 === y2;
  const mismoMes = mismoAnio && m1 === m2;

  if (mismoMes) {
    return `${d1} – ${d2} de ${MESES_LARGOS[m2 - 1]} de ${y2}`;
  }
  if (mismoAnio) {
    return `${d1} de ${MESES_LARGOS[m1 - 1]} – ${d2} de ${MESES_LARGOS[m2 - 1]} de ${y2}`;
  }
  return `${d1} de ${MESES_LARGOS[m1 - 1]} de ${y1} – ${d2} de ${MESES_LARGOS[m2 - 1]} de ${y2}`;
}
