'use client';

import { Calendar } from 'lucide-react';

/**
 * Filtro de "Desde" / "Hasta" reutilizado en toda pantalla que consulta la BD.
 * Por defecto se inicializa con lib/dates.ts#rangoMesActual (1° del mes → hoy).
 */
export default function RangoFechas({
  fechaDesde,
  fechaHasta,
  onFechaDesde,
  onFechaHasta,
}: {
  fechaDesde: string;
  fechaHasta: string;
  onFechaDesde: (v: string) => void;
  onFechaHasta: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2 text-muted">
        <Calendar size={14} strokeWidth={1.6} />
        <span className="text-xs uppercase tracking-[0.1em]">Periodo</span>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted uppercase tracking-[0.1em]">Desde</label>
        <input
          type="date"
          value={fechaDesde}
          max={fechaHasta || undefined}
          onChange={(e) => onFechaDesde(e.target.value)}
          className="field py-2 text-sm"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-muted uppercase tracking-[0.1em]">Hasta</label>
        <input
          type="date"
          value={fechaHasta}
          min={fechaDesde || undefined}
          onChange={(e) => onFechaHasta(e.target.value)}
          className="field py-2 text-sm"
        />
      </div>
    </div>
  );
}
