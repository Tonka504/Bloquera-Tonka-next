'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X, Truck, Wallet, Printer, Package, CheckCircle2, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPedidoSeguimientoDetalle,
  registrarEntregaAction,
  registrarAbonoAction,
  cerrarPedidoSeguimientoAction,
  type PedidoSeguimientoDetalle,
  type MetodoPago,
} from '../../../actions';
import { generateEntregaPDF, generateAbonoPDF } from '../../../../lib/generateComprobantesPDF';
import { METODOS_PAGO, dinero, entero, fechaCorta, hoyLocal, nombreBloque, estiloEstado } from '../formato';

import { Cargando } from '../../../components/ui';
const inputCls =
  'field w-full py-2.5 text-base text-ink';
const labelCls = 'block text-xs font-medium text-muted tracking-normal mb-1.5';
const thCls = 'px-5 py-3 text-[11px] font-medium text-muted tracking-normal';
const sectionTitleCls = 'text-xs font-medium text-muted tracking-normal';

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-muted tracking-normal mb-1">{label}</p>
      <div className="text-ink">{children}</div>
    </div>
  );
}

function Kpi({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="px-6 py-5">
      <p className="text-[11px] text-muted tracking-normal mb-1">{label}</p>
      <p className={`font-display text-2xl ${tone}`}>{value}</p>
    </div>
  );
}

export default function PedidoSeguimientoPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const router = useRouter();
  const [showCerrar, setShowCerrar] = useState(false);

  const [detalle, setDetalle] = useState<PedidoSeguimientoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEntrega, setShowEntrega] = useState(false);
  const [showAbono, setShowAbono] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cantidadEntrega, setCantidadEntrega] = useState('');
  const [montoAbono, setMontoAbono] = useState('');

  const aplicar = useCallback((result: Awaited<ReturnType<typeof getPedidoSeguimientoDetalle>>) => {
    if (result.success && result.data) {
      setDetalle(result.data);
      setError('');
    } else {
      setError(result.message || 'No se pudo cargar el pedido');
    }
    setLoading(false);
  }, []);

  // Recarga tras registrar una entrega o un abono.
  const cargar = async () => aplicar(await getPedidoSeguimientoDetalle(id));

  useEffect(() => {
    let activo = true;
    getPedidoSeguimientoDetalle(id).then((result) => {
      if (activo) aplicar(result);
    });
    return () => {
      activo = false;
    };
  }, [id, aplicar]);

  if (loading) {
    return (
      <div className="px-10 py-24 flex items-center justify-center gap-2 text-faint">
        <Cargando texto="Cargando pedido..." /></div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="px-10 py-24 text-center">
        <Package size={32} strokeWidth={1.4} className="mx-auto mb-3 text-faint-2" />
        <p className="text-muted mb-6">{error || 'Pedido no encontrado'}</p>
        <Link href="/dashboard/seguimiento" className="text-sm text-safety-deep hover:underline">
          Volver a Seguimiento
        </Link>
      </div>
    );
  }

  const { pedido, entregas, abonos } = detalle;
  const precioCentavos = Math.round(pedido.precio_unitario * 100);
  const totalEntregaPreview = (precioCentavos * (parseInt(cantidadEntrega) || 0)) / 100;

  const registrarEntrega = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const cantidad = parseInt(cantidadEntrega);
    if (!cantidad || cantidad <= 0) return toast.error('La cantidad debe ser mayor a 0');
    if (cantidad > pedido.cantidad_pendiente) {
      return toast.error(`Solo quedan ${entero(pedido.cantidad_pendiente)} bloques pendientes`);
    }

    setGuardando(true);
    const result = await registrarEntregaAction({
      pedido_id: pedido.id,
      cantidad,
      fecha: (form.elements.namedItem('fecha') as HTMLInputElement).value,
      observaciones: (form.elements.namedItem('observaciones') as HTMLTextAreaElement).value,
    });
    setGuardando(false);

    if (result.success) {
      toast.success('Entrega registrada');
      setShowEntrega(false);
      await cargar();
    } else {
      toast.error(result.message);
    }
  };

  const registrarAbono = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const monto = parseFloat(montoAbono);
    if (!monto || monto <= 0) return toast.error('El monto debe ser mayor a 0');
    if (Math.round(monto * 100) > Math.round(pedido.saldo_pendiente * 100)) {
      return toast.error(`El abono supera el saldo pendiente (${dinero(pedido.saldo_pendiente)})`);
    }

    setGuardando(true);
    const result = await registrarAbonoAction({
      pedido_id: pedido.id,
      monto,
      fecha: (form.elements.namedItem('fecha') as HTMLInputElement).value,
      metodo_pago: (form.elements.namedItem('metodo_pago') as HTMLSelectElement).value as MetodoPago,
      comprobante: (form.elements.namedItem('comprobante') as HTMLInputElement).value,
      observaciones: (form.elements.namedItem('observaciones') as HTMLTextAreaElement).value,
    });
    setGuardando(false);

    if (result.success) {
      toast.success('Abono registrado');
      setShowAbono(false);
      await cargar();
    } else {
      toast.error(result.message);
    }
  };

  // Cierra el pedido (entregado y pagado), genera su factura y vuelve a la lista.
  const cerrarPedido = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const valor = (nombre: string) => (form.elements.namedItem(nombre) as HTMLInputElement).value;

    setGuardando(true);
    const result = await cerrarPedidoSeguimientoAction({
      pedido_id: pedido.id,
      fecha: valor('fecha'),
      identidad: valor('identidad'),
      rtn: valor('rtn'),
      direccion: valor('direccion'),
    });
    setGuardando(false);

    if (result.success && result.data) {
      toast.success(`Pedido cerrado. Factura #${result.data.num_factura} generada`, {
        action: { label: 'Ver facturas', onClick: () => router.push('/dashboard/facturas') },
      });
      setShowCerrar(false);
      router.push('/dashboard/seguimiento');
    } else {
      toast.error(result.message);
    }
  };

  const listoParaCerrar = pedido.estado === 'Finalizado' && !pedido.cerrado;

  const abrirEntrega = () => {
    setCantidadEntrega('');
    setShowEntrega(true);
  };
  const abrirAbono = () => {
    setMontoAbono('');
    setShowAbono(true);
  };

  const totalEntregado = entregas.reduce((s, e) => s + Math.round(e.total * 100), 0) / 100;

  return (
    <div className="px-4 sm:px-6 lg:pl-2 lg:pr-6 py-6 lg:py-7 relative">
      {/* Header */}
      <Link
        href="/dashboard/seguimiento"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-safety-deep transition-colors mb-5"
      >
        <ArrowLeft size={14} /> Todos los pedidos
      </Link>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-9">
        <div>
          <p className="text-xs text-muted tracking-normal mb-1">Pedido #{pedido.id}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl text-ink">{pedido.cliente}</h1>
            {pedido.cerrado ? (
              <span className="badge badge-neutral">Cerrado · Factura #{pedido.num_factura}</span>
            ) : (
              <span className={`badge ${estiloEstado(pedido.estado)}`}>
                {pedido.estado}
              </span>
            )}
          </div>
        </div>
        {!pedido.cerrado && (
          <div className="flex flex-wrap gap-2">
            {listoParaCerrar && (
              <button
                onClick={() => setShowCerrar(true)}
                className="btn btn-success flex items-center gap-2 px-5 py-2.5 text-sm tracking-wide"
              >
                <CheckCircle2 size={16} /> Entregado · Generar factura
              </button>
            )}
            <button
              onClick={abrirEntrega}
              disabled={pedido.cantidad_pendiente === 0}
              title={pedido.cantidad_pendiente === 0 ? 'El pedido ya fue entregado completo' : undefined}
              className="btn btn-primary flex items-center gap-2 px-5 py-2.5 text-sm tracking-wide"
            >
              <Plus size={16} /> Agregar entrega
            </button>
            <button
              onClick={abrirAbono}
              disabled={pedido.saldo_pendiente <= 0}
              title={pedido.saldo_pendiente <= 0 ? 'El pedido ya está pagado' : undefined}
              className="btn btn-secondary flex items-center gap-2 px-5 py-2.5 text-sm tracking-wide"
            >
              <Plus size={16} /> Registrar abono
            </button>
          </div>
        )}
      </div>

      {/* Aviso de cierre */}
      {pedido.cerrado ? (
        <div className="panel flex flex-wrap items-center justify-between gap-3 px-5 py-4 mb-9">
          <span className="flex items-center gap-3 text-sm text-ink-soft">
            <ReceiptText size={18} className="text-ok-deep" />
            Este pedido ya se entregó, se pagó y se cerró con la factura #{pedido.num_factura}.
          </span>
          <Link href="/dashboard/facturas" className="text-xs font-semibold uppercase tracking-wider text-safety-deep hover:underline">
            Ir a Facturas →
          </Link>
        </div>
      ) : listoParaCerrar ? (
        <div className="panel flex items-center gap-3 px-5 py-4 mb-9 text-sm text-ink-soft">
          <span className="w-2 h-2 rounded-full bg-ok shadow-[0_0_8px_#36966a] shrink-0" />
          Pedido entregado y pagado por completo. Presione &quot;Entregado · Generar factura&quot; para crear su
          factura y sacarlo de la lista de Seguimiento.
        </div>
      ) : pedido.cantidad_pendiente === 0 && pedido.saldo_pendiente > 0 ? (
        <div className="panel flex items-center gap-3 px-5 py-4 mb-9 text-sm text-ink-soft">
          <span className="w-2 h-2 rounded-full bg-machine shadow-[0_0_8px_#e5b43c] shrink-0" />
          Ya se entregó todo. Cuando el cliente termine de pagar ({dinero(pedido.saldo_pendiente)} pendiente) podrá
          cerrar el pedido y generar la factura.
        </div>
      ) : null}

      {/* INFORMACIÓN GENERAL */}
      <section className="mb-9">
        <h2 className={`${sectionTitleCls} mb-3`}>Información general</h2>
        <div className="panel px-6 py-5 grid grid-cols-2 md:grid-cols-5 gap-6">
          <Dato label="N.° de pedido">#{pedido.id}</Dato>
          <Dato label="Cliente">{pedido.cliente}</Dato>
          <Dato label="Fecha">{fechaCorta(pedido.fecha)}</Dato>
          <Dato label="Tipo de bloque">{nombreBloque(pedido.tipo_bloque)}</Dato>
          <Dato label="Precio unitario">{dinero(pedido.precio_unitario)}</Dato>
          {pedido.observaciones && (
            <div className="col-span-2 md:col-span-5">
              <Dato label="Observaciones">
                <span className="text-sm text-ink-soft whitespace-pre-line">{pedido.observaciones}</span>
              </Dato>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-9 mb-9">
        {/* RESUMEN DE ENTREGAS */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className={sectionTitleCls}>Resumen de entregas</h2>
            <span className={`badge ${estiloEstado(pedido.estado_entrega)}`}>
              {pedido.estado_entrega}
            </span>
          </div>
          <div className="panel">
            <div className="grid grid-cols-3 divide-x divide-brand-line">
              <Kpi label="Solicitados" value={entero(pedido.cantidad_total)} />
              <Kpi label="Entregados" value={entero(pedido.cantidad_entregada)} tone="text-ok-deep" />
              <Kpi
                label="Pendientes"
                value={entero(pedido.cantidad_pendiente)}
                tone={pedido.cantidad_pendiente > 0 ? 'text-safety-deep' : 'text-ink'}
              />
            </div>
            <div className="px-6 pb-5 pt-1">
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>Avance de entrega</span>
                <span className="text-ink font-medium">{pedido.porcentaje_entrega}%</span>
              </div>
              <div className="progress-track h-3">
                <div
                  className={`progress-fill ${pedido.cantidad_pendiente === 0 ? 'bg-ok' : 'bg-safety'}`}
                  style={{ width: `${pedido.porcentaje_entrega}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* RESUMEN FINANCIERO */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className={sectionTitleCls}>Resumen financiero</h2>
            <span className={`badge ${estiloEstado(pedido.estado_pago)}`}>
              Pago: {pedido.estado_pago}
            </span>
          </div>
          <div className="panel">
            <div className="grid grid-cols-3 divide-x divide-brand-line">
              <Kpi label="Total del pedido" value={dinero(pedido.total)} />
              <Kpi label="Total abonado" value={dinero(pedido.total_abonado)} tone="text-ok-deep" />
              <Kpi
                label="Saldo pendiente"
                value={dinero(pedido.saldo_pendiente)}
                tone={pedido.saldo_pendiente > 0 ? 'text-alert-deep' : 'text-ink'}
              />
            </div>
            <div className="px-6 pb-5 pt-1">
              <div className="flex justify-between text-xs text-muted mb-1.5">
                <span>Avance de pago</span>
                <span className="text-ink font-medium">
                  {pedido.total > 0 ? Math.min(Math.round((pedido.total_abonado / pedido.total) * 1000) / 10, 100) : 0}%
                </span>
              </div>
              <div className="progress-track h-3">
                <div
                  className={`progress-fill ${pedido.saldo_pendiente <= 0 ? 'bg-ok' : 'bg-concrete-dark'}`}
                  style={{
                    width: `${pedido.total > 0 ? Math.min((pedido.total_abonado / pedido.total) * 100, 100) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* HISTORIAL DE ENTREGAS */}
      <section className="mb-9">
        <h2 className={`${sectionTitleCls} mb-3`}>Historial de entregas</h2>
        <div className="panel overflow-x-auto">
          <table className="table-industrial w-full">
            <thead>
              <tr className="border-b border-brand-line">
                <th className={`${thCls} text-left`}>#</th>
                <th className={`${thCls} text-left`}>Fecha</th>
                <th className={`${thCls} text-right`}>Cantidad</th>
                <th className={`${thCls} text-right`}>Precio unit.</th>
                <th className={`${thCls} text-right`}>Total</th>
                <th className={`${thCls} text-left`}>Observaciones</th>
                <th className={`${thCls} text-center`}>Comprobante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {entregas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-faint text-sm">
                    <Truck size={26} strokeWidth={1.4} className="mx-auto mb-2 text-faint-2" />
                    Todavía no se ha realizado ninguna entrega
                  </td>
                </tr>
              ) : (
                entregas.map((e, i) => (
                  <tr key={e.id} className="hover:bg-concrete-50 transition-colors">
                    <td className="px-5 py-3.5 text-muted text-sm">{i + 1}</td>
                    <td className="px-5 py-3.5 text-ink whitespace-nowrap">{fechaCorta(e.fecha)}</td>
                    <td className="px-5 py-3.5 text-right text-ink">{entero(e.cantidad)}</td>
                    <td className="px-5 py-3.5 text-right text-ink-soft">{dinero(e.precio_unitario)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-ink whitespace-nowrap">{dinero(e.total)}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-soft">{e.observaciones || '—'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => generateEntregaPDF(pedido, e, entregas)}
                        className="btn-icon p-1.5"
                        title="Imprimir comprobante de entrega"
                      >
                        <Printer size={16} strokeWidth={1.6} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {entregas.length > 0 && (
              <tfoot>
                <tr className="border-t border-brand-line bg-concrete-50">
                  <td colSpan={2} className="px-5 py-3 text-xs text-muted uppercase tracking-wide">
                    Total entregado
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-ink">{entero(pedido.cantidad_entregada)}</td>
                  <td />
                  <td className="px-5 py-3 text-right font-medium text-ink whitespace-nowrap">{dinero(totalEntregado)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* HISTORIAL DE ABONOS */}
      <section>
        <h2 className={`${sectionTitleCls} mb-3`}>Historial de abonos</h2>
        <div className="panel overflow-x-auto">
          <table className="table-industrial w-full">
            <thead>
              <tr className="border-b border-brand-line">
                <th className={`${thCls} text-left`}>#</th>
                <th className={`${thCls} text-left`}>Fecha</th>
                <th className={`${thCls} text-right`}>Monto</th>
                <th className={`${thCls} text-left`}>Método</th>
                <th className={`${thCls} text-left`}>Comprobante</th>
                <th className={`${thCls} text-left`}>Observaciones</th>
                <th className={`${thCls} text-center`}>Recibo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {abonos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-faint text-sm">
                    <Wallet size={26} strokeWidth={1.4} className="mx-auto mb-2 text-faint-2" />
                    Todavía no se ha registrado ningún abono
                  </td>
                </tr>
              ) : (
                abonos.map((a, i) => (
                  <tr key={a.id} className="hover:bg-concrete-50 transition-colors">
                    <td className="px-5 py-3.5 text-muted text-sm">{i + 1}</td>
                    <td className="px-5 py-3.5 text-ink whitespace-nowrap">{fechaCorta(a.fecha)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-ok-deep whitespace-nowrap">{dinero(a.monto)}</td>
                    <td className="px-5 py-3.5 text-ink-soft">{a.metodo_pago}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-soft">{a.comprobante || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-ink-soft">{a.observaciones || '—'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => generateAbonoPDF(pedido, a, abonos)}
                        className="btn-icon p-1.5"
                        title="Imprimir recibo de abono"
                      >
                        <Printer size={16} strokeWidth={1.6} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {abonos.length > 0 && (
              <tfoot>
                <tr className="border-t border-brand-line bg-concrete-50">
                  <td colSpan={2} className="px-5 py-3 text-xs text-muted uppercase tracking-wide">
                    Total abonado
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-ok-deep whitespace-nowrap">
                    {dinero(pedido.total_abonado)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* ========== MODAL CERRAR Y FACTURAR ========== */}
      {showCerrar && (
        <div className="modal-backdrop fixed inset-0 bg-graphite/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h3 className="font-display text-2xl text-ink">Entregado · Generar factura</h3>
                <p className="text-sm text-muted mt-1">
                  Pedido #{pedido.id} — {pedido.cliente}
                </p>
              </div>
              <button onClick={() => setShowCerrar(false)} className="text-muted hover:text-ink transition-colors">
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>

            <form onSubmit={cerrarPedido} className="px-8 pb-8 space-y-5">
              <div className="border border-brand-line divide-y divide-brand-line text-sm">
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted">Producto</span>
                  <span className="text-ink">
                    {entero(pedido.cantidad_total)} × {nombreBloque(pedido.tipo_bloque)}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span className="text-muted">Entregado</span>
                  <span className="text-ok-deep">{entero(pedido.cantidad_entregada)} de {entero(pedido.cantidad_total)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5 bg-concrete-50 font-medium">
                  <span className="text-ink">Total pagado</span>
                  <span className="text-ink">{dinero(pedido.total_abonado)}</span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Fecha de la factura *</label>
                <input name="fecha" type="date" required defaultValue={hoyLocal()} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Identidad</label>
                  <input name="identidad" className={inputCls} placeholder="Opcional" />
                </div>
                <div>
                  <label className={labelCls}>RTN</label>
                  <input name="rtn" className={inputCls} placeholder="Opcional" />
                </div>
              </div>
              <div>
                <label className={labelCls}>Dirección</label>
                <input name="direccion" className={inputCls} placeholder="SANTA BARBARA, S.B., HONDURAS" />
              </div>

              <p className="text-xs text-muted leading-relaxed">
                Se creará la factura como <strong className="text-ink-soft">Pagada</strong> y el pedido saldrá de la lista
                de Seguimiento (lo puede ver en el filtro &quot;Facturados&quot;). El inventario no cambia: ya se descontó
                con cada entrega.
              </p>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCerrar(false)} className="btn btn-secondary flex-1 py-3 text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="btn btn-success flex-1 py-3 text-sm tracking-wide">
                  {guardando ? 'Generando...' : 'Generar factura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL AGREGAR ENTREGA ========== */}
      {showEntrega && (
        <div className="modal-backdrop fixed inset-0 bg-graphite/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h3 className="font-display text-2xl text-ink">Agregar entrega</h3>
                <p className="text-sm text-muted mt-1">
                  Pedido #{pedido.id} — quedan {entero(pedido.cantidad_pendiente)} bloques por entregar
                </p>
              </div>
              <button onClick={() => setShowEntrega(false)} className="text-muted hover:text-ink transition-colors">
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>

            <form onSubmit={registrarEntrega} className="px-8 pb-8 space-y-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Bloques entregados *</label>
                  <input
                    type="number"
                    min="1"
                    max={pedido.cantidad_pendiente}
                    step="1"
                    required
                    autoFocus
                    value={cantidadEntrega}
                    onChange={(e) => setCantidadEntrega(e.target.value)}
                    className={inputCls}
                    placeholder={`Máx. ${pedido.cantidad_pendiente}`}
                  />
                </div>
                <div>
                  <label className={labelCls}>Fecha de entrega *</label>
                  <input name="fecha" type="date" required defaultValue={hoyLocal()} className={inputCls} />
                </div>
              </div>

              <div className="panel divide-y divide-brand-line">
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-muted">Precio unitario (del pedido)</span>
                  <span className="text-sm text-ink">{dinero(pedido.precio_unitario)}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3 bg-concrete-50">
                  <span className="text-sm text-ink font-medium">Total de la entrega</span>
                  <span className="font-display text-xl text-ink">{dinero(totalEntregaPreview)}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-muted">Pendientes después de esta entrega</span>
                  <span className="text-sm text-ink">
                    {entero(Math.max(pedido.cantidad_pendiente - (parseInt(cantidadEntrega) || 0), 0))}
                  </span>
                </div>
              </div>

              <div>
                <label className={labelCls}>Observaciones</label>
                <textarea
                  name="observaciones"
                  rows={2}
                  className={`${inputCls} resize-none`}
                  placeholder="Opcional (ej. placa del camión, quién recibió)"
                />
              </div>

              <p className="text-xs text-muted">
                La entrega descuenta los bloques del inventario de {nombreBloque(pedido.tipo_bloque)}.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEntrega(false)}
                  className="btn btn-secondary flex-1 py-3 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="btn btn-primary flex-1 py-3 text-sm tracking-wide"
                >
                  {guardando ? 'Guardando...' : 'Registrar entrega'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL REGISTRAR ABONO ========== */}
      {showAbono && (
        <div className="modal-backdrop fixed inset-0 bg-graphite/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h3 className="font-display text-2xl text-ink">Registrar abono</h3>
                <p className="text-sm text-muted mt-1">
                  Pedido #{pedido.id} — saldo pendiente {dinero(pedido.saldo_pendiente)}
                </p>
              </div>
              <button onClick={() => setShowAbono(false)} className="text-muted hover:text-ink transition-colors">
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>

            <form onSubmit={registrarAbono} className="px-8 pb-8 space-y-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Monto (L.) *</label>
                  <input
                    type="number"
                    min="0.01"
                    max={pedido.saldo_pendiente}
                    step="0.01"
                    required
                    autoFocus
                    value={montoAbono}
                    onChange={(e) => setMontoAbono(e.target.value)}
                    className={inputCls}
                    placeholder="0.00"
                  />
                  <button
                    type="button"
                    onClick={() => setMontoAbono(pedido.saldo_pendiente.toFixed(2))}
                    className="mt-1.5 text-[11px] text-safety-deep hover:underline"
                  >
                    Pagar saldo completo
                  </button>
                </div>
                <div>
                  <label className={labelCls}>Fecha del abono *</label>
                  <input name="fecha" type="date" required defaultValue={hoyLocal()} className={inputCls} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Método de pago *</label>
                  <select name="metodo_pago" defaultValue="Efectivo" className={inputCls}>
                    {METODOS_PAGO.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>N.° comprobante</label>
                  <input name="comprobante" className={inputCls} placeholder="Opcional" />
                </div>
              </div>

              <div className="flex justify-between items-center px-5 py-3 bg-concrete-50 border border-brand-line">
                <span className="text-sm text-muted">Saldo después del abono</span>
                <span className="font-display text-lg text-ink">
                  {dinero(
                    Math.max(Math.round(pedido.saldo_pendiente * 100) - Math.round((parseFloat(montoAbono) || 0) * 100), 0) / 100
                  )}
                </span>
              </div>

              <div>
                <label className={labelCls}>Observaciones</label>
                <textarea name="observaciones" rows={2} className={`${inputCls} resize-none`} placeholder="Opcional" />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAbono(false)}
                  className="btn btn-secondary flex-1 py-3 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="btn btn-primary flex-1 py-3 text-sm tracking-wide"
                >
                  {guardando ? 'Guardando...' : 'Registrar abono'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
