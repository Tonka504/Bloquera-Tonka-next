'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet,
  AlertTriangle,
  Truck,
  Factory,
  Warehouse,
  Banknote,
  HandCoins,
  ChartColumn,
  Shovel,
  TrendingUp,
  Plus,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import { getDashboardResumen, type DashboardResumen } from '../actions';
import RangoFechas from '../components/RangoFechas';
import {
  AnilloProgreso,
  Cargando,
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
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const formatMes = (mesStr: string) => {
  const mes = Number(String(mesStr).slice(5, 7));
  return MESES[mes - 1] || mesStr;
};

function saludo(hora: number) {
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

type Usuario = { nombre?: string };

type ItemAgenda = {
  clave: string;
  titulo: string;
  detalle: string;
  valor: string;
  tono: 'alert' | 'safety' | 'machine';
  href?: string;
};

const PUNTO = {
  alert: 'bg-alert shadow-[0_0_8px_#e0574f]',
  safety: 'bg-safety shadow-[0_0_8px_#f28c28]',
  machine: 'bg-machine shadow-[0_0_8px_#e5b43c]',
};

export default function Dashboard() {
  const [user, setUser] = useState<Usuario | null>(null);
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

  const ahora = new Date();
  const fechaLarga = `${DIAS[ahora.getDay()]}, ${ahora.getDate()} de ${MESES_LARGOS[ahora.getMonth()]} de ${ahora.getFullYear()}`;
  const nombre = (user.nombre || 'Admin').split(' ')[0];

  const op = resumen.operacion;
  const maxVentas = Math.max(...resumen.ventasPorMes.map((v) => Number(v.total)), 1);
  const periodo = formatRangoLegible(fechaDesde, fechaHasta);
  const tiposBajos = op.inventarioPorTipo.filter((t) => t.cantidad < STOCK_MINIMO);
  const maxTipo = Math.max(...op.inventarioPorTipo.map((t) => t.cantidad), STOCK_MINIMO * 5, 1);
  const serieVentas = resumen.ventasPorMes.map((v) => Number(v.total));
  // Qué parte de lo vendido en el periodo ya se cobró.
  const pctCobrado = resumen.ventas > 0 ? Math.min(Math.round((op.dineroRecibido / resumen.ventas) * 100), 100) : 0;

  // Agenda: lo que requiere atención (saldos por cobrar y pedidos sin despachar).
  const agenda: ItemAgenda[] = [
    ...resumen.saldosSeguimiento.map((s) => ({
      clave: `seg-${s.id}`,
      titulo: s.cliente,
      detalle: `Cobrar · pedido #${s.id}`,
      valor: dinero(s.saldo_pendiente),
      tono: 'alert' as const,
      href: `/dashboard/seguimiento/${s.id}`,
    })),
    ...resumen.facturasPendientes.map((f) => ({
      clave: `fac-${f.num_factura}`,
      titulo: f.cliente,
      detalle: `Cobrar · factura #${f.num_factura}`,
      valor: dinero(Number(f.saldo_pendiente)),
      tono: 'machine' as const,
      href: '/dashboard/facturas',
    })),
    ...resumen.pedidosRecientes.map((p) => ({
      clave: `ped-${p.id}`,
      titulo: p.cliente,
      detalle: `Despachar · ${p.producto}`,
      valor: `${entero(p.cantidad)} und`,
      tono: 'safety' as const,
      href: '/dashboard/pedidos',
    })),
  ];

  return (
    <div className="px-4 sm:px-6 lg:pl-2 lg:pr-6 py-6 lg:py-7">
      {/* Saludo */}
      <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4 mb-7">
        <div>
          <h1 className="font-display text-3xl sm:text-[2.4rem] text-ink leading-tight">
            {saludo(ahora.getHours())}, {nombre}
          </h1>
          <p className="text-sm text-muted mt-1 first-letter:uppercase">
            {fechaLarga}
            {periodo && <span className="hidden sm:inline"> · Periodo del {periodo}</span>}
          </p>
        </div>
        <div className="flex flex-wrap xl:flex-nowrap items-center gap-3 shrink-0">
          <div className="glass rounded-2xl px-4 py-2.5">
            <RangoFechas
              fechaDesde={fechaDesde}
              fechaHasta={fechaHasta}
              onFechaDesde={cambiarDesde}
              onFechaHasta={cambiarHasta}
            />
          </div>
          <Link href="/dashboard/seguimiento" className="btn btn-primary px-5 py-3 text-sm">
            <Plus size={16} strokeWidth={2.2} /> Nuevo pedido
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Cargando texto="Cargando datos..." />
        </div>
      ) : (
        <div className="space-y-6">
          {/* ---------------- Tarjeta principal + agenda ---------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <section className="relative lg:col-span-2 overflow-hidden rounded-[26px] p-6 sm:p-8 text-white bg-[image:var(--grad-hero)] border border-white/40 shadow-[0_30px_60px_-28px_rgba(226,92,70,.75)] animate-[rise-in_.5s_cubic-bezier(.2,.8,.2,1)_backwards]">
              <div className="absolute -right-16 -top-20 w-72 h-72 rounded-full bg-white/20 blur-2xl pointer-events-none" />
              <div className="absolute left-1/3 -bottom-28 w-80 h-80 rounded-full bg-[#ffd39a]/25 blur-3xl pointer-events-none" />

              <div className="relative flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1 min-w-0">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/20 border border-white/35 backdrop-blur-md px-3 py-1 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" /> Resumen del periodo
                  </span>
                  <h2 className="font-display text-[1.75rem] sm:text-[2.1rem] leading-[1.1] mt-4">
                    {op.produccionPeriodo > 0
                      ? `Tu planta produjo ${entero(op.produccionPeriodo)} bloques este periodo`
                      : 'Tu bloquera, de un vistazo'}
                  </h2>
                  <p className="text-white/85 text-sm mt-2 max-w-lg">
                    Vendiste {dinero(resumen.ventas)} y has cobrado {dinero(op.dineroRecibido)}. Gastos del periodo:{' '}
                    {dinero(resumen.gastos)}.
                  </p>

                  <div className="grid grid-cols-3 gap-2.5 mt-6 max-w-lg">
                    {[
                      { valor: entero(op.pedidosPendientes), texto: 'Pedidos pendientes' },
                      { valor: entero(op.bloquesPorEntregar), texto: 'Bloques por entregar' },
                      { valor: dinero(resumen.balance), texto: 'Balance' },
                    ].map((m) => (
                      <div key={m.texto} className="rounded-2xl bg-white/15 border border-white/30 backdrop-blur-md px-3 py-2.5">
                        <p className="font-display text-lg leading-none truncate">{m.valor}</p>
                        <p className="text-[11px] text-white/80 mt-1 leading-tight">{m.texto}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap gap-2.5 mt-6">
                    <Link
                      href="/dashboard/reportes"
                      className="btn px-4 py-2.5 text-sm bg-white text-[#c2541a] shadow-[0_10px_24px_-10px_rgba(80,30,10,.5)]"
                    >
                      Ver reportes <ArrowRight size={15} />
                    </Link>
                    <Link
                      href="/dashboard/seguimiento"
                      className="btn px-4 py-2.5 text-sm text-white bg-white/15 border border-white/40 backdrop-blur-md"
                    >
                      <Truck size={15} /> Seguimiento
                    </Link>
                  </div>
                </div>

                <div className="flex md:flex-col items-center gap-3 md:pr-2">
                  <AnilloProgreso porcentaje={pctCobrado} tamano={150} grosor={12} claro>
                    <span className="font-display text-3xl leading-none">{pctCobrado}%</span>
                    <span className="text-[11px] text-white/85 mt-1">cobrado</span>
                  </AnilloProgreso>
                  <p className="text-xs text-white/80 max-w-[10rem] md:text-center">De lo vendido en el periodo</p>
                </div>
              </div>
            </section>

            {/* Agenda */}
            <section className="panel p-5 sm:p-6 flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="font-display text-[2.6rem] leading-none text-safety-deep">{ahora.getDate()}</div>
                  <div className="leading-tight">
                    <p className="font-display text-base text-ink capitalize">{DIAS[ahora.getDay()]}</p>
                    <p className="text-xs text-muted capitalize">
                      {MESES_LARGOS[ahora.getMonth()]} {ahora.getFullYear()}
                    </p>
                  </div>
                </div>
                <span className="icon-plate w-9 h-9 rounded-xl">
                  <CalendarDays size={17} strokeWidth={1.9} />
                </span>
              </div>
              <p className="text-xs font-semibold text-faint mb-2">Pendientes</p>
              {agenda.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-center text-sm text-faint py-8">
                  Todo al día: no hay cobros ni despachos pendientes.
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[300px] -mr-2 pr-2">
                  {agenda.slice(0, 8).map((a) => {
                    const fila = (
                      <>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${PUNTO[a.tono]}`} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ink truncate">{a.titulo}</p>
                          <p className="text-xs text-muted truncate">{a.detalle}</p>
                        </div>
                        <span className="text-sm font-semibold text-ink-soft tabular-nums whitespace-nowrap">{a.valor}</span>
                      </>
                    );
                    return a.href ? (
                      <Link
                        key={a.clave}
                        href={a.href}
                        className="flex items-center gap-3 rounded-2xl bg-white/50 border border-white/70 px-3 py-2.5 hover:bg-white/85 hover:translate-x-0.5 transition-all"
                      >
                        {fila}
                      </Link>
                    ) : (
                      <div key={a.clave} className="flex items-center gap-3 rounded-2xl bg-white/50 border border-white/70 px-3 py-2.5">
                        {fila}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* ---------------- Indicadores principales ---------------- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <IndicadorConsola
              etiqueta="Ventas del periodo"
              valor={dinero(resumen.ventas)}
              icono={TrendingUp}
              tono="ok"
              serie={serieVentas}
              chip="Periodo"
              href="/dashboard/reportes"
            />
            <IndicadorConsola
              etiqueta="Dinero recibido"
              valor={dinero(op.dineroRecibido)}
              detalle="Facturas y abonos del periodo"
              icono={HandCoins}
              tono="safety"
              progreso={pctCobrado}
              retraso={0.05}
            />
            <IndicadorConsola
              etiqueta="Saldos pendientes"
              valor={dinero(resumen.por_cobrar)}
              detalle="Deuda actual de clientes"
              icono={Wallet}
              tono="alert"
              chip="Actual"
              href="/dashboard/seguimiento"
              retraso={0.1}
            />
            <IndicadorConsola
              etiqueta="Inventario disponible"
              valor={`${entero(op.inventarioBloques)} und`}
              detalle={
                op.inventarioPorTipo.length
                  ? op.inventarioPorTipo.map((t) => `${t.tipo.replace('bloque_de_', '')} ${entero(t.cantidad)}`).join(' · ')
                  : 'Sin datos de inventario'
              }
              icono={Warehouse}
              tono={tiposBajos.length ? 'alert' : 'steel'}
              chip={tiposBajos.length ? 'Stock bajo' : undefined}
              href="/dashboard/inventario"
              retraso={0.15}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
            <IndicadorConsola
              etiqueta="Producción del día"
              valor={`${entero(op.produccionHoy)} und`}
              icono={IconoPilaBloques}
              tono="safety"
              chip="Hoy"
              href="/dashboard/inventario"
            />
            <IndicadorConsola
              etiqueta="Producción del periodo"
              valor={`${entero(op.produccionPeriodo)} und`}
              icono={Factory}
              tono="machine"
              chip="Periodo"
              retraso={0.05}
            />
            <IndicadorConsola
              etiqueta="Ventas del día"
              valor={dinero(op.ventasHoy)}
              icono={Banknote}
              tono="ok"
              chip="Hoy"
              retraso={0.1}
            />
            <IndicadorConsola
              etiqueta="Total bloques fabricados"
              valor={`${entero(op.bloquesFabricados)} und`}
              icono={IconoBloque}
              tono="steel"
              chip="Histórico"
              retraso={0.15}
            />
          </div>

          {/* ---------------- Gráfico + materiales ---------------- */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
                  <div className="absolute inset-x-0 top-6 bottom-7 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className="h-px border-t border-dashed border-[rgba(31,35,40,.08)]" />
                    ))}
                  </div>
                  <div className="relative flex items-end gap-3 sm:gap-6 h-full">
                    {resumen.ventasPorMes.map((item, idx) => {
                      const height = Math.max((Number(item.total) / maxVentas) * 100, 4);
                      const ultimo = idx === resumen.ventasPorMes.length - 1;
                      return (
                        <div key={idx} className="group flex-1 h-full flex flex-col items-center justify-end gap-2">
                          <span className="text-[11px] font-semibold text-ink-soft opacity-0 group-hover:opacity-100 transition-opacity tabular-nums whitespace-nowrap rounded-full bg-white/80 px-2 py-0.5">
                            {dinero(Number(item.total))}
                          </span>
                          <div
                            className={`w-full max-w-[42px] rounded-full transition-all duration-500 animate-[rise-in_.6s_cubic-bezier(.2,.8,.2,1)_backwards] ${
                              ultimo
                                ? 'bg-linear-to-t from-[#e0631c] to-[#ffb066] shadow-[0_10px_24px_-8px_rgba(242,118,43,.7)]'
                                : 'bg-linear-to-t from-[#f7c9a4] to-white/80 group-hover:from-[#f2802c] group-hover:to-[#ffb066] border border-white/80'
                            }`}
                            style={{ height: `${height}%`, animationDelay: `${idx * 0.06}s` }}
                            title={dinero(Number(item.total))}
                          />
                          <span className="text-xs font-semibold text-muted">{formatMes(item.mes)}</span>
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
                        <span className="flex items-center gap-2 text-ink-soft font-medium">
                          <IconoBloque size={15} className="text-faint" /> {nombreBloque(t.tipo)}
                        </span>
                        <span className={`font-semibold tabular-nums ${bajo ? 'text-alert-deep' : 'text-ink'}`}>
                          {entero(t.cantidad)} und
                        </span>
                      </div>
                      <div className="progress-track h-2">
                        <div
                          className={`progress-fill ${bajo ? 'bg-alert' : 'bg-safety'}`}
                          style={{ width: `${Math.max((t.cantidad / maxTipo) * 100, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="rounded-2xl bg-white/55 border border-white/80 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                      <IconoCemento size={13} /> Cemento
                    </div>
                    <p className="font-display text-xl text-ink mt-0.5 tabular-nums">
                      {entero(op.cementoBolsas)} <span className="text-xs font-sans font-medium text-muted">bolsas</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/55 border border-white/80 px-3 py-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
                      <Shovel size={13} strokeWidth={1.9} /> Arena
                    </div>
                    <p className="font-display text-xl text-ink mt-0.5 tabular-nums">
                      {op.arenaM3.toFixed(2)} <span className="text-xs font-sans font-medium text-muted">m³</span>
                    </p>
                  </div>
                </div>

                {resumen.stockBajo.length > 0 && (
                  <div className="rounded-2xl border border-alert/30 bg-alert/10 px-3.5 py-2.5">
                    <p className="flex items-center gap-2 text-xs font-semibold text-alert-deep">
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
        </div>
      )}
    </div>
  );
}
