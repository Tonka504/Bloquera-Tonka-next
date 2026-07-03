'use client';

import { useEffect, useState } from 'react';
import { getReporteGeneral } from '../../actions';

export default function ReportesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cargarReporte = async () => {
    const result = await getReporteGeneral();
    if (result.success) {
      setData(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarReporte();
  }, []);

  if (loading) {
    return <div className="p-8">Cargando reporte...</div>;
  }

  if (!data) {
    return <div className="p-8 text-red-500">Error al cargar el reporte</div>;
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Reporte General</h1>
        <p className="text-slate-500">Resumen completo de tu bloquera</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Ventas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-sm text-slate-500">Total Ventas</p>
          <p className="text-4xl font-bold text-emerald-600 mt-2">
            L. {data.totalVentas.toLocaleString()}
          </p>
        </div>

        {/* Gastos */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-sm text-slate-500">Total Gastos</p>
          <p className="text-4xl font-bold text-red-600 mt-2">
            L. {data.totalGastos.toLocaleString()}
          </p>
        </div>

        {/* Ganancia */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-sm text-slate-500">Ganancia Neta</p>
          <p className={`text-4xl font-bold mt-2 ${data.ganancia >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            L. {data.ganancia.toLocaleString()}
          </p>
        </div>

        {/* Bloques en Stock */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-sm text-slate-500">Bloques en Stock</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            {data.totalBloquesStock.toLocaleString()} und
          </p>
        </div>

        {/* Facturas Emitidas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-sm text-slate-500">Facturas Emitidas</p>
          <p className="text-4xl font-bold text-slate-900 mt-2">
            {data.totalFacturas}
          </p>
        </div>

        {/* Pedidos Pendientes */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-sm text-slate-500">Pedidos Pendientes</p>
          <p className="text-4xl font-bold text-amber-600 mt-2">
            {data.totalPedidosPendientes}
          </p>
        </div>

      </div>
    </div>
  );
}