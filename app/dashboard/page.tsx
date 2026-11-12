'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  AlertTriangle,
  ClipboardList,
  Truck,
  Factory,
  Warehouse,
  Banknote,
  HandCoins,
  ChartColumn,
  ReceiptText,
  Shovel,
} from 'lucide-react';
import { getDashboardResumen, type DashboardResumen } from '../actions';
import RangoFechas from '../components/RangoFechas';
import {
  Cargando,
  EncabezadoPagina,
  IconoBloque,
  IconoCemento,
  IconoPilaBloques,
  IndicadorConsola,
  Panel,
} from '../components/ui';
import { rangoMesActual, formatRangoLegible } from '../../lib/dates';
import { dinero, entero, hoyLocal, nombreBloque } from './seguimiento/formato';

const STOCK_MINIMO = 100;

const RESUMEN_VACIO: DashboardResumen = {
  ventas: 0,
  gastos: 0,
  balance: 0,
  por_cobrar: 0,
  pedidosRecientes: [],
  ventasPorMes: [],
  stockBajo: [],
  facturasPendientes: [],
  saldosSeguimiento: [],
  operacion: {
    produccionHoy: 0,
    produccionPeriodo: 0,
    bloquesFabricados: 0,
    inventarioBloques: 0,
    inventarioPorTipo: [],
    cementoBolsas: 0,
    arenaM3: 0,
    ventasHoy: 0,
    pedidosPendientes: 0,
    bloquesPorEntregar: 0,
    dineroRecibido: 0,
  },
};

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const formatMes = (mesStr: string) => {
  const mes = Number(String(mesStr).slice(5, 7));
  return MESES[mes - 1] || mesStr;
};

/** Rótulo de sección con placa metálica. */
function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-2 h-2 rotate-45 bg-safety" />
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-ink-soft">{titulo}</h2>
        <span className="flex-1 h-px bg-linear-to-r from-[#bdbcb5] to-transparent" />
      </div>
      {children}
    </section>
  );
}

export default function Dashboard() {
  const [user, setUser] = useState<unknown>(null);
  const [resumen, setResumen] = useState<DashboardResumen>(RESUMEN_VACIO);
  const [loading, setLoading] = useState(true);
  const { fechaDesde: desdeInicial, fechaHasta: hastaInicial } = rangoMesActual();
  const [fechaDesde, setFechaDesde] = useState(desdeInicial);
  const [fechaHasta, setFechaHasta] = useState(hastaInicial);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- lectura única de localStorage al montar
    setUser(JSON.parse(savedUser));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    let activo = true;
    getDashboardResumen(fechaDesde, fechaHasta, hoyLocal()).then((result) => {
      if (!activo) return;
      if (result.data) setResumen({ ...RESUMEN_VACIO, ...result.data });
      setLoading(false);
    });
    return () => {
      activo = false;
    };
  }, [user, fechaDesde, fechaHasta]);

  const cambiarDesde = (v: string) => {
    setLoading(true);
    setFechaDesde(v);
  };
  const cambiarHasta = (v: string) => {
    setLoading(true);
    setFechaHasta(v);
  };

  if (!user) return null;

  const op = resumen.operacion;
  const maxVentas = Math.max(...resumen.ventasPorMes.map((v) => Number(v.total)), 1);
  const periodo = formatRangoLegible(fechaDesde, fechaHasta);
  const tiposBajos = op.inventarioPorTipo.filter((t) => t.cantidad < STOCK_MINIMO);
  const maxTipo = Math.max(...op.inventarioPorTipo.map((t) => t.cantidad), STOCK_MINIMO * 5, 1);

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-9">
      <EncabezadoPagina etiqueta="Centro de operaciones" titulo="Panel de planta" icono={Factory}>
        <div className="panel px-4 py-3">
          <RangoFechas
            fechaDesde={fechaDesde}
            fechaHasta={fechaHasta}
            onFechaDesde={cambiarDesde}
            onFechaHasta={cambiarHasta}
          />
        </div>
      </EncabezadoPagina>

      {periodo && (
        <p className="-mt-5 mb-7 text-sm text-muted">
          Mostrando el periodo del <span className="font-semibold text-ink-soft">{periodo}</span>
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Cargando texto="Cargando datos de la planta..." />
        </div>
      ) : (
        <div className="space-y-9">
          {/* ---------------- Consola de operaciones ---------------- */}
          <Seccion titulo="Producción">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <IndicadorConsola
                etiqueta="Producción del día"
                valor={`${entero(op.produccionHoy)} und`}
                detalle="Bloques registrados hoy"
                icono={IconoPilaBloques}
                tono="safety"
                href="/dashboard/inventario"
              />
              <IndicadorConsola
                etiqueta="Producción del periodo"
                valor={`${entero(op.produccionPeriodo)} und`}
                detalle={periodo || 'Periodo seleccionado'}
                icono={Factory}
                tono="machine"
                retraso={0.05}
              />
              <IndicadorConsola
                etiqueta="Total bloques fabricados"
                valor={`${entero(op.bloquesFabricados)} und`}
                detalle="Histórico de producción"
                icono={IconoBloque}
                tono="steel"
                retraso={0.1}
              />
            </div>
          </Seccion>

          <Seccion titulo="Inventario y logística">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <IndicadorConsola
                etiqueta="Inventario disponible"
                valor={`${entero(op.inventarioBloques)} und`}
                detalle={
                  op.inventarioPorTipo.length
                    ? op.inventarioPorTipo.map((t) => `${t.tipo.replace('bloque_de_', '')} ${entero(t.cantidad)}`).join(' · ')
                    : 'Sin datos de inventario'
                }
                icono={Warehouse}
                tono={tiposBajos.length ? 'alert' : 'ok'}
                href="/dashboard/inventario"
              />
              <IndicadorConsola
                etiqueta="Pedidos pendientes"
                valor={entero(op.pedidosPendientes)}
                detalle="Pedidos + Seguimiento con bloques por entregar"
                icono={ClipboardList}
                tono="machine"
                href="/dashboard/pedidos"
                retraso={0.05}
              />
              <IndicadorConsola
                etiqueta="Entregas pendientes"
                valor={`${entero(op.bloquesPorEntregar)} und`}
                detalle="Bloques que faltan por entregar"
                icono={Truck}
                tono="safety"
                href="/dashboard/seguimiento"
                retraso={0.1}
              />
            </div>
          </Seccion>

          <Seccion titulo="Caja y cobros">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <IndicadorConsola
                etiqueta="Ventas del día"
                valor={dinero(op.ventasHoy)}
                detalle="Despachos y entregas de hoy"
                icono={Banknote}
                tono="ok"
              />
              <IndicadorConsola
                etiqueta="Dinero recibido"
                valor={dinero(op.dineroRecibido)}
                detalle="Cobrado en el periodo (facturas y abonos)"
                icono={HandCoins}
                tono="ok"
                retraso={0.05}
              />
              <IndicadorConsola
                etiqueta="Saldos pendientes"
                valor={dinero(resumen.por_cobrar)}
                detalle="Deuda actual de clientes"
                icono={Wallet}
                tono="alert"
                href="/dashboard/seguimiento"
                retraso={0.1}
              />
            </div>
          </Seccion>

          {/* ---------------- Finanzas del periodo ---------------- */}
          <Seccion titulo="Finanzas del periodo">
            <div className="grid grid-cols-1 md:grid-cols-3 kpi-grid">
              <div className="p-5 pt-6">
                <div className="flex items-center gap-2 text-muted text-xs font-semibold uppercase tracking-[0.12em] mb-2">
                  <TrendingUp size={14} strokeWidth={1.9} className="text-ok" /> Ventas del periodo
                </div>
                <p className="font-display text-3xl text-ink tabular-nums">{dinero(resumen.ventas)}</p>
              </div>
              <div className="p-5 pt-6">
                <div className="flex items-center gap-2 text-muted text-xs font-semibold uppercase tracking-[0.12em] mb-2">
                  <TrendingDown size={14} strokeWidth={1.9} className="text-alert" /> Gastos del periodo
                </div>
                <p className="font-display text-3xl text-ink tabular-nums">{dinero(resumen.gastos)}</p>
              </div>
              <div className="p-5 pt-6">
                <div className="flex items-center gap-2 text-muted text-xs font-semibold uppercase tracking-[0.12em] mb-2">
                  <Scale size={14} strokeWidth={1.9} className="text-safety-deep" /> Balance del periodo
                </div>
                <p className={`font-display text-3xl tabular-nums ${resumen.balance >= 0 ? 'text-ok-deep' : 'text-alert-deep'}`}>
                  {dinero(resumen.balance)}
                </p>
              </div>
            </div>
          </Seccion>

          {/* ---------------- Gráfico + materiales ---------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Panel
              titulo="Ventas por mes"
              icono={ChartColumn}
              accion={{ href: '/dashboard/reportes', texto: 'Ver reportes' }}
              className="lg:col-span-2"
            >
              {resumen.ventasPorMes.length === 0 ? (
                <div className="text-center py-12 text-faint text-sm">No hay datos de ventas</div>
              ) : (
                <div className="relative h-56 pt-6">
                  {/* líneas guía */}
                  <div className="absolute inset-x-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="h-px bg-[#dddcd5]" />
                    ))}
                  </div>
                  <div className="relative flex items-end gap-3 sm:gap-5 h-full">
                    {resumen.ventasPorMes.map((item, idx) => {
                      const height = Math.max((Number(item.total) / maxVentas) * 100, 4);
                      return (
                        <div key={idx} className="group flex-1 h-full flex flex-col items-center justify-end gap-2">
                          <span className="text-[11px] font-semibold text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity tabular-nums whitespace-nowrap">
                            {dinero(Number(item.total))}
                          </span>
                          <div
                            className="w-full max-w-[44px] rounded-t-[4px] bg-linear-to-t from-concrete-dark to-cement group-hover:from-safety-deep group-hover:to-safety border border-b-0 border-black/20 shadow-[inset_1px_0_0_rgba(255,255,255,.25)] transition-[height,background] duration-700 ease-out animate-[rise-in_.6s_cubic-bezier(.2,.8,.2,1)_backwards]"
                            style={{ height: `${height}%`, animationDelay: `${idx * 0.06}s` }}
                            title={dinero(Number(item.total))}
                          />
                          <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">{formatMes(item.mes)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </Panel>

            <Panel titulo="Niveles de material" icono={Warehouse} accion={{ href: '/dashboard/inventario', texto: 'Inventario' }}>
              <div className="space-y-4">
                {op.inventarioPorTipo.map((t) => {
                  const bajo = t.cantidad < STOCK_MINIMO;
                  return (
                    <div key={t.tipo}>
                      <div className="flex items-center justify-between text-sm mb-1.5">
                        <span className="flex items-center gap-2 text-ink-soft">
                          <IconoBloque size={15} className="text-faint" /> {nombreBloque(t.tipo)}
                        </span>
                        <span className={`font-semibold tabular-nums ${bajo ? 'text-alert-deep' : 'text-ink'}`}>
                          {entero(t.cantidad)} und
                        </span>
                      </div>
                      <div className="progress-track h-2">
                        <div
                          className={`progress-fill ${bajo ? 'bg-alert' : 'bg-concrete-dark'}`}
                          style={{ width: `${Math.max((t.cantidad / maxTipo) * 100, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-[6px] border border-line bg-concrete-50 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <IconoCemento size={13} /> Cemento
                    </div>
                    <p className="font-display text-xl text-ink mt-0.5 tabular-nums">
                      {entero(op.cementoBolsas)} <span className="text-xs font-sans font-normal normal-case text-muted">bolsas</span>
                    </p>
                  </div>
                  <div className="rounded-[6px] border border-line bg-concrete-50 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                      <Shovel size={13} strokeWidth={1.9} /> Arena
                    </div>
                    <p className="font-display text-xl text-ink mt-0.5 tabular-nums">
                      {op.arenaM3.toFixed(2)} <span className="text-xs font-sans font-normal normal-case text-muted">m³</span>
                    </p>
                  </div>
                </div>

                {resumen.stockBajo.length > 0 && (
                  <div className="relative overflow-hidden rounded-[6px] border border-alert/40 bg-[#fbe7e6] pl-5 pr-3 py-2.5">
                    <span className="absolute inset-y-0 left-0 w-2 bg-[image:var(--tx-hazard)]" />
                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-alert-deep">
                      <AlertTriangle size={14} strokeWidth={2} /> Stock bajo
                    </p>
                    <p className="text-sm text-ink-soft mt-1">
                      {resumen.stockBajo.map((s) => `${nombreBloque(s.tipo)}: ${entero(s.cantidad)} und`).join(' · ')}
                    </p>
                  </div>
                )}
              </div>
            </Panel>
          </div>

          {/* ---------------- Listados ---------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Panel
              titulo="Pedidos recientes"
              icono={ClipboardList}
              accion={{ href: '/dashboard/pedidos', texto: 'Ver todos' }}
              cuerpo="px-5 sm:px-6 py-2"
            >
              {resumen.pedidosRecientes.length === 0 ? (
                <div className="text-center py-8 text-faint text-sm">No hay pedidos recientes</div>
              ) : (
                <div className="divide-y divide-line">
                  {resumen.pedidosRecientes.map((pedido, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{pedido.cliente}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {pedido.producto} — {entero(pedido.cantidad)} und
                        </p>
                      </div>
                      <span className="badge badge-pending">{pedido.estado}</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              titulo="Saldos por cobrar"
              icono={ReceiptText}
              accion={{ href: '/dashboard/seguimiento', texto: 'Ver todos' }}
              cuerpo="px-5 sm:px-6 py-2"
            >
              {resumen.saldosSeguimiento.length === 0 && resumen.facturasPendientes.length === 0 ? (
                <div className="text-center py-8 text-faint text-sm">No hay saldos pendientes</div>
              ) : (
                <div className="divide-y divide-line">
                  {/* Pedidos de Seguimiento con saldo pendiente */}
                  {resumen.saldosSeguimiento.map((s) => (
                    <Link
                      key={`seg-${s.id}`}
                      href={`/dashboard/seguimiento/${s.id}`}
                      className="flex items-center justify-between gap-3 py-3 -mx-2 px-2 rounded-[6px] hover:bg-[#fdf3e6] transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{s.cliente}</p>
                        <p className="text-xs text-muted mt-0.5">Pedido en seguimiento #{s.id}</p>
                      </div>
                      <span className="text-sm font-semibold text-alert-deep tabular-nums whitespace-nowrap">
                        {dinero(s.saldo_pendiente)}
                      </span>
                    </Link>
                  ))}
                  {resumen.facturasPendientes.map((factura, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{factura.cliente}</p>
                        <p className="text-xs text-muted mt-0.5">Factura #{factura.num_factura}</p>
                      </div>
                      <span className="text-sm font-semibold text-alert-deep tabular-nums whitespace-nowrap">
                        {dinero(Number(factura.saldo_pendiente))}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
}
