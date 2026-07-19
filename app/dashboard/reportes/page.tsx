'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, FileText, ShoppingCart, Users, BarChart3 } from 'lucide-react';
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
    return <div className="p-8 text-center text-slate-500">Cargando reporte...</div>;
  }

  if (!data) {
    return <div className="p-8 text-red-500">Error al cargar el reporte</div>;
  }

  // Calcular máximo para gráficos
  const maxVentasMes = Math.max(...data.ventasPorMes.map((v: any) => Number(v.total)), 1);
  const maxGastosCat = Math.max(...data.gastosPorCategoria.map((g: any) => Number(g.total)), 1);
  const maxTopClientes = Math.max(...data.topClientes.map((c: any) => Number(c.total)), 1);

  const formatMes = (mesStr: string) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const date = new Date(mesStr + '-01');
    return meses[date.getMonth()] || mesStr;
  };

  const getCategoriaColor = (categoria: string) => {
    const map: Record<string, string> = {
      'Materia Prima': 'bg-purple-500',
      'Mano de Obra': 'bg-orange-500',
      'Transporte': 'bg-cyan-500',
      'Servicios': 'bg-pink-500',
      'Otro': 'bg-slate-500',
    };
    return map[categoria] || 'bg-slate-500';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Reporte General</h1>
        <p className="text-slate-500">Resumen completo de tu bloquera</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Ventas</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">
                L. {data.totalVentas.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Total Gastos</p>
              <p className="text-3xl font-bold text-red-600 mt-1">
                L. {data.totalGastos.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
              <TrendingDown className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Ganancia Neta</p>
              <p className={`text-3xl font-bold mt-1 ${data.ganancia >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                L. {data.ganancia.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
              <DollarSign className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Bloques en Stock</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {data.totalBloquesStock.toLocaleString()} und
              </p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Package className="text-slate-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Facturas Emitidas</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                {data.totalFacturas}
              </p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center">
              <FileText className="text-slate-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Pedidos Pendientes</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">
                {data.totalPedidosPendientes}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
              <ShoppingCart className="text-amber-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Ventas por mes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-blue-600" size={20} />
            <h3 className="font-semibold text-lg text-slate-900">Ventas por Mes</h3>
          </div>

          {data.ventasPorMes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No hay datos de ventas</div>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {data.ventasPorMes.map((item: any, idx: number) => {
                const height = Math.max((Number(item.total) / maxVentasMes) * 100, 5);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex justify-center">
                      <div 
                        className="w-full max-w-[50px] bg-blue-600 rounded-t-xl transition-all hover:bg-blue-700"
                        style={{ height: `${height}%`, minHeight: '8px' }}
                        title={`L. ${Number(item.total).toLocaleString()}`}
                      />
                    </div>
                    <span className="text-xs text-slate-500 font-medium">
                      {formatMes(item.mes)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gastos por categoría */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border">
          <div className="flex items-center gap-2 mb-6">
            <TrendingDown className="text-red-500" size={20} />
            <h3 className="font-semibold text-lg text-slate-900">Gastos por Categoría</h3>
          </div>

          {data.gastosPorCategoria.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No hay datos de gastos</div>
          ) : (
            <div className="space-y-4">
              {data.gastosPorCategoria.map((item: any, idx: number) => {
                const width = Math.max((Number(item.total) / maxGastosCat) * 100, 5);
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{item.categoria}</span>
                      <span className="text-slate-900 font-semibold">L. {Number(item.total).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${getCategoriaColor(item.categoria)}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top clientes */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border">
        <div className="flex items-center gap-2 mb-6">
          <Users className="text-amber-600" size={20} />
          <h3 className="font-semibold text-lg text-slate-900">Top Clientes</h3>
        </div>

        {data.topClientes.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay clientes registrados</div>
        ) : (
          <div className="space-y-4">
            {data.topClientes.map((cliente: any, idx: number) => {
              const width = Math.max((Number(cliente.total) / maxTopClientes) * 100, 5);
              return (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-700 font-medium">{cliente.cliente}</span>
                      <span className="text-slate-900 font-semibold">L. {Number(cliente.total).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}