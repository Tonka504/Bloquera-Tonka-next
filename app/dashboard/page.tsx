'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  AlertTriangle,
  Package,
  FileText,
  ShoppingCart,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { getDashboardResumen } from '../actions';
import Link from 'next/link';

const CARD = 'bg-white border border-brand-line';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [resumen, setResumen] = useState({
    ventas: 0,
    gastos: 0,
    balance: 0,
    por_cobrar: 0,
    pedidosRecientes: [],
    ventasPorMes: [],
    stockBajo: [],
    facturasPendientes: [],
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(savedUser));
    cargarDatos();
  }, [router]);

  const cargarDatos = async () => {
    const result: any = await getDashboardResumen();
    if (result.data) {
      setResumen(result.data);
    }
    setLoading(false);
  };

  if (!user) return null;

  const maxVentas = Math.max(...resumen.ventasPorMes.map((v: any) => Number(v.total)), 1);

  const formatMes = (mesStr: string) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const fechaStr = mesStr.length === 7 ? mesStr + '-01' : mesStr;
    const date = new Date(fechaStr);
    return meses[date.getMonth()] || mesStr;
  };

  return (
    <div className="px-10 py-9">
      <div className="mb-10">
        <p className="text-xs text-[#8a8175] uppercase tracking-[0.15em] mb-1">Resumen general</p>
        <h1 className="font-display text-3xl text-[#201c17]">Tu bloquera, de un vistazo</h1>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 py-24 text-[#8a8175]">
          <Loader2 className="animate-spin" size={20} />
          Cargando datos...
        </div>
      ) : (
        <>
          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-brand-line divide-y md:divide-y-0 md:divide-x divide-brand-line mb-10">
            <div className="p-6">
              <div className="flex items-center gap-2 text-[#8a8175] text-xs uppercase tracking-[0.1em] mb-2">
                <TrendingUp size={14} strokeWidth={1.6} /> Ventas Totales
              </div>
              <p className="font-display text-3xl text-[#201c17]">
                L. {resumen.ventas.toLocaleString()}
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 text-[#8a8175] text-xs uppercase tracking-[0.1em] mb-2">
                <TrendingDown size={14} strokeWidth={1.6} /> Gastos Totales
              </div>
              <p className="font-display text-3xl text-[#201c17]">
                L. {resumen.gastos.toLocaleString()}
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 text-[#8a8175] text-xs uppercase tracking-[0.1em] mb-2">
                <DollarSign size={14} strokeWidth={1.6} /> Balance
              </div>
              <p className={`font-display text-3xl ${resumen.balance >= 0 ? 'text-[#201c17]' : 'text-red-800'}`}>
                L. {resumen.balance.toLocaleString()}
              </p>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-2 text-[#8a8175] text-xs uppercase tracking-[0.1em] mb-2">
                <Users size={14} strokeWidth={1.6} /> Por Cobrar
              </div>
              <p className="font-display text-3xl text-brand-accent">
                L. {resumen.por_cobrar.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Gráfico de Ventas */}
            <div className={`${CARD} lg:col-span-2 p-7`}>
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-lg text-[#201c17]">Ventas por Mes</h3>
                <Link href="/dashboard/reportes" className="text-xs text-[#8a8175] hover:text-brand-accent flex items-center gap-1 transition-colors uppercase tracking-wide">
                  Ver más <ArrowRight size={12} />
                </Link>
              </div>

              {resumen.ventasPorMes.length === 0 ? (
                <div className="text-center py-12 text-[#a39a8c] text-sm">No hay datos de ventas</div>
              ) : (
                <div className="flex items-end gap-4 h-44">
                  {resumen.ventasPorMes.map((item: any, idx: number) => {
                    const height = Math.max((Number(item.total) / maxVentas) * 100, 5);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-3">
                        <div className="relative w-full flex justify-center">
                          <div
                            className="w-full max-w-[36px] bg-brand-ink hover:bg-brand-accent transition-colors"
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

            {/* Alertas de Stock Bajo */}
            <div className={`${CARD} p-7`}>
              <div className="flex items-center gap-2 mb-5">
                <AlertTriangle className="text-brand-accent" size={17} strokeWidth={1.6} />
                <h3 className="font-display text-lg text-[#201c17]">Stock Bajo</h3>
              </div>

              {resumen.stockBajo.length === 0 ? (
                <div className="text-center py-8 text-[#a39a8c] text-sm">
                  <Package size={28} strokeWidth={1.4} className="mx-auto mb-2 text-[#d9d2c3]" />
                  Todo el stock está en niveles normales
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-brand-line">
                  {resumen.stockBajo.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-3">
                      <span className="text-sm text-[#201c17]">
                        {item.tipo.replace('bloque_de_', 'Bloque de ').replace('"', '"')}
                      </span>
                      <span className="text-sm font-medium text-brand-accent">
                        {item.cantidad} und
                      </span>
                    </div>
                  ))}
                  <Link
                    href="/dashboard/inventario"
                    className="block text-center text-xs text-[#8a8175] hover:text-brand-accent uppercase tracking-wide pt-4 transition-colors"
                  >
                    Ir a Inventario →
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pedidos Recientes */}
            <div className={`${CARD} p-7`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-[#8a8175]" size={17} strokeWidth={1.6} />
                  <h3 className="font-display text-lg text-[#201c17]">Pedidos Recientes</h3>
                </div>
                <Link href="/dashboard/pedidos" className="text-xs text-[#8a8175] hover:text-brand-accent transition-colors uppercase tracking-wide">
                  Ver todos
                </Link>
              </div>

              {resumen.pedidosRecientes.length === 0 ? (
                <div className="text-center py-8 text-[#a39a8c] text-sm">No hay pedidos recientes</div>
              ) : (
                <div className="divide-y divide-brand-line">
                  {resumen.pedidosRecientes.map((pedido: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm text-[#201c17]">{pedido.cliente}</p>
                        <p className="text-xs text-[#8a8175] mt-0.5">{pedido.producto} — {pedido.cantidad} und</p>
                      </div>
                      <span className="text-[11px] text-brand-accent uppercase tracking-wide">
                        {pedido.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Facturas Pendientes */}
            <div className={`${CARD} p-7`}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FileText className="text-[#8a8175]" size={17} strokeWidth={1.6} />
                  <h3 className="font-display text-lg text-[#201c17]">Facturas Pendientes</h3>
                </div>
                <Link href="/dashboard/facturas" className="text-xs text-[#8a8175] hover:text-brand-accent transition-colors uppercase tracking-wide">
                  Ver todas
                </Link>
              </div>

              {resumen.facturasPendientes.length === 0 ? (
                <div className="text-center py-8 text-[#a39a8c] text-sm">No hay facturas pendientes</div>
              ) : (
                <div className="divide-y divide-brand-line">
                  {resumen.facturasPendientes.map((factura: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between py-3">
                      <div>
                        <p className="text-sm text-[#201c17]">{factura.cliente}</p>
                        <p className="text-xs text-[#8a8175] mt-0.5">Factura #{factura.num_factura}</p>
                      </div>
                      <span className="text-sm font-medium text-red-800">
                        L. {Number(factura.saldo_pendiente).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
