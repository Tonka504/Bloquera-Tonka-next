'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, FileText, ShoppingCart, Users, BarChart3, Loader2 } from 'lucide-react';
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
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-[#8a8175]">
        <Loader2 className="animate-spin" size={20} />
        Cargando reporte...
      </div>
    );
  }

  if (!data) {
    return <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-9 text-red-800">Error al cargar el reporte</div>;
  }

  const maxVentasMes = Math.max(...data.ventasPorMes.map((v: any) => Number(v.total)), 1);
  const maxGastosCat = Math.max(...data.gastosPorCategoria.map((g: any) => Number(g.total)), 1);
  const maxTopClientes = Math.max(...data.topClientes.map((c: any) => Number(c.total)), 1);

  const formatMes = (mesStr: string) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const date = new Date(mesStr + '-01');
    return meses[date.getMonth()] || mesStr;
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-9">
      <div className="mb-8 lg:mb-10">
        <p className="text-xs text-[#8a8175] uppercase tracking-[0.15em] mb-1">Análisis</p>
        <h1 className="font-display text-3xl text-[#201c17]">Reporte General</h1>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-brand-line border border-brand-line mb-6">
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-[#8a8175] text-xs uppercase tracking-[0.1em] mb-2">
            <TrendingUp size={14} strokeWidth={1.6} /> Total Ventas
          </div>
          <p className="font-display text-2xl text-[#201c17]">L. {data.totalVentas.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-[#8a8175] text-xs uppercase tracking-[0.1em] mb-2">
            <TrendingDown size={14} strokeWidth={1.6} /> Total Gastos
          </div>
          <p className="font-display text-2xl text-[#201c17]">L. {data.totalGastos.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-[#8a8175] text-xs uppercase tracking-[0.1em] mb-2">
            <DollarSign size={14} strokeWidth={1.6} /> Ganancia Neta
          </div>
          <p className={`font-display text-2xl ${data.ganancia >= 0 ? 'text-[#201c17]' : 'text-red-800'}`}>
            L. {data.ganancia.toLocaleString()}
          </p>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-[#8a8175] text-xs uppercase tracking-[0.1em] mb-2">
            <Package size={14} strokeWidth={1.6} /> Bloques en Stock
          </div>
          <p className="font-display text-2xl text-[#201c17]">{data.totalBloquesStock.toLocaleString()} und</p>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-[#8a8175] text-xs uppercase tracking-[0.1em] mb-2">
            <FileText size={14} strokeWidth={1.6} /> Facturas Emitidas
          </div>
          <p className="font-display text-2xl text-[#201c17]">{data.totalFacturas}</p>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-[#8a8175] text-xs uppercase tracking-[0.1em] mb-2">
            <ShoppingCart size={14} strokeWidth={1.6} /> Pedidos Pendientes
          </div>
          <p className="font-display text-2xl text-brand-accent">{data.totalPedidosPendientes}</p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ventas por mes */}
        <div className="border border-brand-line p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="text-[#8a8175]" size={17} strokeWidth={1.6} />
            <h3 className="font-display text-lg text-[#201c17]">Ventas por Mes</h3>
          </div>

          {data.ventasPorMes.length === 0 ? (
            <div className="text-center py-12 text-[#a39a8c] text-sm">No hay datos de ventas</div>
          ) : (
            <div className="flex items-end gap-3 h-44">
              {data.ventasPorMes.map((item: any, idx: number) => {
                const height = Math.max((Number(item.total) / maxVentasMes) * 100, 5);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-full max-w-[34px] bg-brand-ink hover:bg-brand-accent transition-colors"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`L. ${Number(item.total).toLocaleString()}`}
                      />
                    </div>
                    <span className="text-[11px] text-[#8a8175] uppercase tracking-wide">
                      {formatMes(item.mes)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gastos por categoría */}
        <div className="border border-brand-line p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-8">
            <TrendingDown className="text-[#8a8175]" size={17} strokeWidth={1.6} />
            <h3 className="font-display text-lg text-[#201c17]">Gastos por Categoría</h3>
          </div>

          {data.gastosPorCategoria.length === 0 ? (
            <div className="text-center py-12 text-[#a39a8c] text-sm">No hay datos de gastos</div>
          ) : (
            <div className="space-y-4">
              {data.gastosPorCategoria.map((item: any, idx: number) => {
                const width = Math.max((Number(item.total) / maxGastosCat) * 100, 5);
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-[#4a463e]">{item.categoria}</span>
                      <span className="text-[#201c17] font-medium">L. {Number(item.total).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#f0ece2]">
                      <div
                        className="h-full bg-brand-ink"
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
      <div className="border border-brand-line p-5 sm:p-7">
        <div className="flex items-center gap-2 mb-8">
          <Users className="text-[#8a8175]" size={17} strokeWidth={1.6} />
          <h3 className="font-display text-lg text-[#201c17]">Top Clientes</h3>
        </div>

        {data.topClientes.length === 0 ? (
          <div className="text-center py-12 text-[#a39a8c] text-sm">No hay clientes registrados</div>
        ) : (
          <div className="space-y-4">
            {data.topClientes.map((cliente: any, idx: number) => {
              const width = Math.max((Number(cliente.total) / maxTopClientes) * 100, 5);
              return (
                <div key={idx} className="flex items-center gap-4">
                  <span className="font-display text-sm text-[#8a8175] w-5 flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-[#4a463e]">{cliente.cliente}</span>
                      <span className="text-[#201c17] font-medium">L. {Number(cliente.total).toLocaleString()}</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#f0ece2]">
                      <div
                        className="h-full bg-brand-accent"
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
