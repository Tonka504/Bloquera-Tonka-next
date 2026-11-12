'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Package, FileText, ShoppingCart, Users, BarChart3, Truck, Wallet, ClipboardList, ChartColumn } from 'lucide-react';
import Link from 'next/link';
import { getReporteGeneral } from '../../actions';
import RangoFechas from '../../components/RangoFechas';
import { rangoMesActual } from '../../../lib/dates';

import { Cargando } from '../../components/ui';
export default function ReportesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { fechaDesde: desdeInicial, fechaHasta: hastaInicial } = rangoMesActual();
  const [fechaDesde, setFechaDesde] = useState(desdeInicial);
  const [fechaHasta, setFechaHasta] = useState(hastaInicial);

  const cargarReporte = async () => {
    setLoading(true);
    const result = await getReporteGeneral(fechaDesde, fechaHasta);
    if (result.success) {
      setData(result.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarReporte();
  }, [fechaDesde, fechaHasta]);

  const formatMes = (mesStr: string) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const date = new Date(mesStr + '-01');
    return meses[date.getMonth()] || mesStr;
  };

  const maxVentasMes = data ? Math.max(...data.ventasPorMes.map((v: any) => Number(v.total)), 1) : 1;
  const maxGastosCat = data ? Math.max(...data.gastosPorCategoria.map((g: any) => Number(g.total)), 1) : 1;
  const maxTopClientes = data ? Math.max(...data.topClientes.map((c: any) => Number(c.total)), 1) : 1;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-9">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8 lg:mb-10">
        <div className="flex items-center gap-4">
          <span className="icon-plate w-12 h-12 shrink-0">
            <ChartColumn size={24} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-safety-deep uppercase tracking-[0.2em] mb-0.5">Análisis</p>
            <h1 className="font-display text-3xl sm:text-4xl text-ink leading-none">Reporte General</h1>
          </div>
        </div>
        <RangoFechas
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onFechaDesde={setFechaDesde}
          onFechaHasta={setFechaHasta}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-muted">
          <Cargando texto="Cargando reporte..." /></div>
      ) : !data ? (
        <div className="text-alert-deep">Error al cargar el reporte</div>
      ) : (
        <>
      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 kpi-grid mb-6">
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-[0.1em] mb-2">
            <TrendingUp size={14} strokeWidth={1.6} /> Total Ventas
          </div>
          <p className="font-display text-2xl text-ink">L. {data.totalVentas.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-[0.1em] mb-2">
            <TrendingDown size={14} strokeWidth={1.6} /> Total Gastos
          </div>
          <p className="font-display text-2xl text-ink">L. {data.totalGastos.toLocaleString()}</p>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-[0.1em] mb-2">
            <DollarSign size={14} strokeWidth={1.6} /> Ganancia Neta
          </div>
          <p className={`font-display text-2xl ${data.ganancia >= 0 ? 'text-ink' : 'text-alert-deep'}`}>
            L. {data.ganancia.toLocaleString()}
          </p>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-[0.1em] mb-2">
            <Package size={14} strokeWidth={1.6} /> Bloques en Stock
          </div>
          <p className="font-display text-2xl text-ink">{data.totalBloquesStock.toLocaleString()} und</p>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-[0.1em] mb-2">
            <FileText size={14} strokeWidth={1.6} /> Facturas Emitidas
          </div>
          <p className="font-display text-2xl text-ink">{data.totalFacturas}</p>
        </div>
        <div className="p-6 bg-white">
          <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-[0.1em] mb-2">
            <ShoppingCart size={14} strokeWidth={1.6} /> Pedidos Pendientes
          </div>
          <p className="font-display text-2xl text-safety-deep">{data.totalPedidosPendientes}</p>
        </div>
      </div>

      {/* Seguimiento de pedidos (entregas parciales y abonos) */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="flex items-center gap-2 text-xs font-medium text-muted uppercase tracking-[0.15em]">
            <ClipboardList size={14} strokeWidth={1.6} /> Seguimiento de pedidos
          </h2>
          <Link href="/dashboard/seguimiento" className="text-xs text-muted hover:text-safety-deep transition-colors uppercase tracking-wide">
            Ver pedidos
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 kpi-grid">
          <div className="p-6 bg-white">
            <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-[0.1em] mb-2">
              <Truck size={14} strokeWidth={1.6} /> Entregado en el periodo
            </div>
            <p className="font-display text-2xl text-ink">L. {Number(data.seguimientoEntregado || 0).toLocaleString()}</p>
            <p className="text-[11px] text-faint mt-1">Ya incluido en Total Ventas</p>
          </div>
          <div className="p-6 bg-white">
            <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-[0.1em] mb-2">
              <Wallet size={14} strokeWidth={1.6} /> Abonos cobrados en el periodo
            </div>
            <p className="font-display text-2xl text-ok-deep">L. {Number(data.seguimientoCobrado || 0).toLocaleString()}</p>
          </div>
          <div className="p-6 bg-white">
            <div className="flex items-center gap-2 text-muted text-xs uppercase tracking-[0.1em] mb-2">
              <Users size={14} strokeWidth={1.6} /> Saldo por cobrar (actual)
            </div>
            <p className="font-display text-2xl text-alert-deep">L. {Number(data.seguimientoPorCobrar || 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ventas por mes */}
        <div className="panel p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-8">
            <BarChart3 className="text-muted" size={17} strokeWidth={1.6} />
            <h3 className="font-display text-lg text-ink">Ventas por Mes</h3>
          </div>

          {data.ventasPorMes.length === 0 ? (
            <div className="text-center py-12 text-faint text-sm">No hay datos de ventas</div>
          ) : (
            <div className="flex items-end gap-3 h-44">
              {data.ventasPorMes.map((item: any, idx: number) => {
                const height = Math.max((Number(item.total) / maxVentasMes) * 100, 5);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                    <div className="relative w-full flex justify-center">
                      <div
                        className="w-full max-w-[34px] bg-linear-to-t from-concrete-dark to-cement hover:from-safety-deep hover:to-safety rounded-t-[3px] transition-colors"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`L. ${Number(item.total).toLocaleString()}`}
                      />
                    </div>
                    <span className="text-[11px] text-muted uppercase tracking-wide">
                      {formatMes(item.mes)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Gastos por categoría */}
        <div className="panel p-5 sm:p-7">
          <div className="flex items-center gap-2 mb-8">
            <TrendingDown className="text-muted" size={17} strokeWidth={1.6} />
            <h3 className="font-display text-lg text-ink">Gastos por Categoría</h3>
          </div>

          {data.gastosPorCategoria.length === 0 ? (
            <div className="text-center py-12 text-faint text-sm">No hay datos de gastos</div>
          ) : (
            <div className="space-y-4">
              {data.gastosPorCategoria.map((item: any, idx: number) => {
                const width = Math.max((Number(item.total) / maxGastosCat) * 100, 5);
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-ink-soft">{item.categoria}</span>
                      <span className="text-ink font-medium">L. {Number(item.total).toLocaleString()}</span>
                    </div>
                    <div className="progress-track w-full h-2">
                      <div
                        className="progress-fill bg-concrete-dark"
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
      <div className="panel p-5 sm:p-7">
        <div className="flex items-center gap-2 mb-8">
          <Users className="text-muted" size={17} strokeWidth={1.6} />
          <h3 className="font-display text-lg text-ink">Top Clientes</h3>
        </div>

        {data.topClientes.length === 0 ? (
          <div className="text-center py-12 text-faint text-sm">No hay clientes registrados</div>
        ) : (
          <div className="space-y-4">
            {data.topClientes.map((cliente: any, idx: number) => {
              const width = Math.max((Number(cliente.total) / maxTopClientes) * 100, 5);
              return (
                <div key={idx} className="flex items-center gap-4">
                  <span className="font-display text-sm text-muted w-5 flex-shrink-0">{idx + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-ink-soft">{cliente.cliente}</span>
                      <span className="text-ink font-medium">L. {Number(cliente.total).toLocaleString()}</span>
                    </div>
                    <div className="progress-track w-full h-2">
                      <div
                        className="progress-fill bg-safety"
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
        </>
      )}
    </div>
  );
}
