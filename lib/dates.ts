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
