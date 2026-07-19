'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LogOut, 
  User, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users,
  AlertTriangle,
  Package,
  FileText,
  ShoppingCart,
  ArrowRight
} from 'lucide-react';
import { getDashboardResumen } from '../actions';
import Link from 'next/link';

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
    const result = await getDashboardResumen() as any;

    if (result.success && result.data) {
    setResumen(result.data);
}
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  // Calcular máximo para el gráfico
  const maxVentas = Math.max(...resumen.ventasPorMes.map((v: any) => Number(v.total)), 1);

  // Formatear mes (acepta "2026-02" o "2026-02-01")
  const formatMes = (mesStr: string) => {
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    // Si viene como "2026-02", agregar día para crear fecha válida
    const fechaStr = mesStr.length === 7 ? mesStr + '-01' : mesStr;
    const date = new Date(fechaStr);
    return meses[date.getMonth()] || mesStr;
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Resumen general de tu bloquera</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-2xl transition"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando datos...</div>
      ) : (
        <>
          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Ventas Totales</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">
                    L. {resumen.ventas.toLocaleString()}
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
                  <p className="text-sm text-slate-500">Gastos Totales</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    L. {resumen.gastos.toLocaleString()}
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
                  <p className="text-sm text-slate-500">Balance</p>
                  <p className={`text-3xl font-bold mt-1 ${resumen.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    L. {resumen.balance.toLocaleString()}
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
                  <p className="text-sm text-slate-500">Por Cobrar</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">
                    L. {resumen.por_cobrar.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Users className="text-amber-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Gráfico de Ventas */}
            <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg text-slate-900">Ventas por Mes</h3>
                <Link href="/dashboard/reportes" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  Ver más <ArrowRight size={14} />
                </Link>
              </div>

              {resumen.ventasPorMes.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No hay datos de ventas</div>
              ) : (
                <div className="flex items-end gap-3 h-48">
                  {resumen.ventasPorMes.map((item: any, idx: number) => {
                    const height = Math.max((Number(item.total) / maxVentas) * 100, 5);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                        <div className="relative w-full flex justify-center">
                          <div 
                            className="w-full max-w-[60px] bg-blue-600 rounded-t-xl transition-all hover:bg-blue-700"
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

            {/* Alertas de Stock Bajo */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-amber-500" size={20} />
                <h3 className="font-semibold text-lg text-slate-900">Stock Bajo</h3>
              </div>

              {resumen.stockBajo.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  <Package size={32} className="mx-auto mb-2 text-slate-300" />
                  Todo el stock está en niveles normales
                </div>
              ) : (
                <div className="space-y-3">
                  {resumen.stockBajo.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-amber-50 rounded-2xl border border-amber-100">
                      <div className="flex items-center gap-3">
                        <Package size={16} className="text-amber-600" />
                        <span className="text-sm font-medium text-slate-700">
                          {item.tipo.replace('bloque_de_', 'Bloque de ').replace('"', '"')}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-amber-700">
                        {item.cantidad} und
                      </span>
                    </div>
                  ))}
                  <Link 
                    href="/dashboard/inventario" 
                    className="block text-center text-sm text-blue-600 hover:underline mt-2"
                  >
                    Ir a Inventario →
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pedidos Recientes */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-blue-600" size={20} />
                  <h3 className="font-semibold text-lg text-slate-900">Pedidos Recientes</h3>
                </div>
                <Link href="/dashboard/pedidos" className="text-sm text-blue-600 hover:underline">
                  Ver todos
                </Link>
              </div>

              {resumen.pedidosRecientes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No hay pedidos recientes</div>
              ) : (
                <div className="space-y-3">
                  {resumen.pedidosRecientes.map((pedido: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{pedido.cliente}</p>
                        <p className="text-xs text-slate-500">{pedido.producto} — {pedido.cantidad} und</p>
                      </div>
                      <span className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
                        {pedido.estado}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Facturas Pendientes */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="text-red-500" size={20} />
                  <h3 className="font-semibold text-lg text-slate-900">Facturas Pendientes</h3>
                </div>
                <Link href="/dashboard/facturas" className="text-sm text-blue-600 hover:underline">
                  Ver todas
                </Link>
              </div>

              {resumen.facturasPendientes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No hay facturas pendientes</div>
              ) : (
                <div className="space-y-3">
                  {resumen.facturasPendientes.map((factura: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded-2xl border border-red-100">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{factura.cliente}</p>
                        <p className="text-xs text-slate-500">Factura #{factura.num_factura}</p>
                      </div>
                      <span className="text-sm font-bold text-red-600">
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