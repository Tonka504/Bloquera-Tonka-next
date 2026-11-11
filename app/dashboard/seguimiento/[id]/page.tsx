'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Loader2, Truck, Wallet, Printer, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPedidoSeguimientoDetalle,
  registrarEntregaAction,
  registrarAbonoAction,
  type PedidoSeguimientoDetalle,
  type MetodoPago,
} from '../../../actions';
import { generateEntregaPDF, generateAbonoPDF } from '../../../../lib/generateComprobantesPDF';
import { METODOS_PAGO, dinero, entero, fechaCorta, hoyLocal, nombreBloque, estiloEstado } from '../formato';

const inputCls =
  'w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] placeholder:text-[#c2b8a1] focus:outline-none focus:border-brand-accent transition-colors bg-white';
const labelCls = 'block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5';
const thCls = 'px-5 py-3 text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]';
const sectionTitleCls = 'text-xs font-medium text-[#8a8175] uppercase tracking-[0.15em]';

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-[#8a8175] uppercase tracking-[0.12em] mb-1">{label}</p>
      <div className="text-[#201c17]">{children}</div>
    </div>
  );
}

function Kpi({ label, value, tone = 'text-[#201c17]' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="px-6 py-5">
      <p className="text-[11px] text-[#8a8175] uppercase tracking-[0.12em] mb-1">{label}</p>
      <p className={`font-display text-2xl ${tone}`}>{value}</p>
    </div>
  );
}

export default function PedidoSeguimientoPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);

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
      <div className="px-10 py-24 flex items-center justify-center gap-2 text-[#a39a8c]">
        <Loader2 className="animate-spin" size={18} /> Cargando pedido...
      </div>
    );
  }

  if (error || !detalle) {
    return (
      <div className="px-10 py-24 text-center">
        <Package size={32} strokeWidth={1.4} className="mx-auto mb-3 text-[#d9d2c3]" />
        <p className="text-[#8a8175] mb-6">{error || 'Pedido no encontrado'}</p>
        <Link href="/dashboard/seguimiento" className="text-sm text-brand-accent hover:underline">
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
    <div className="px-10 py-9 relative">
      {/* Header */}
      <Link
        href="/dashboard/seguimiento"
        className="inline-flex items-center gap-1.5 text-xs text-[#8a8175] hover:text-brand-accent transition-colors mb-5"
      >
        <ArrowLeft size={14} /> Todos los pedidos
      </Link>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-9">
        <div>
          <p className="text-xs text-[#8a8175] uppercase tracking-[0.15em] mb-1">Pedido #{pedido.id}</p>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl text-[#201c17]">{pedido.cliente}</h1>
            <span className={`inline-block px-2.5 py-1 text-[11px] uppercase tracking-wide border ${estiloEstado(pedido.estado)}`}>
              {pedido.estado}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={abrirEntrega}
            disabled={pedido.cantidad_pendiente === 0}
            title={pedido.cantidad_pendiente === 0 ? 'El pedido ya fue entregado completo' : undefined}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-ink-soft disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2.5 transition-colors text-sm tracking-wide"
          >
            <Plus size={16} /> Agregar entrega
          </button>
          <button
            onClick={abrirAbono}
            disabled={pedido.saldo_pendiente <= 0}
            title={pedido.saldo_pendiente <= 0 ? 'El pedido ya está pagado' : undefined}
            className="flex items-center gap-2 border border-brand-primary text-[#201c17] hover:bg-[#faf8f4] disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 transition-colors text-sm tracking-wide"
          >
            <Plus size={16} /> Registrar abono
          </button>
        </div>
      </div>

      {/* INFORMACIÓN GENERAL */}
      <section className="mb-9">
        <h2 className={`${sectionTitleCls} mb-3`}>Información general</h2>
        <div className="border border-brand-line px-6 py-5 grid grid-cols-2 md:grid-cols-5 gap-6">
          <Dato label="N.° de pedido">#{pedido.id}</Dato>
          <Dato label="Cliente">{pedido.cliente}</Dato>
          <Dato label="Fecha">{fechaCorta(pedido.fecha)}</Dato>
          <Dato label="Tipo de bloque">{nombreBloque(pedido.tipo_bloque)}</Dato>
          <Dato label="Precio unitario">{dinero(pedido.precio_unitario)}</Dato>
          {pedido.observaciones && (
            <div className="col-span-2 md:col-span-5">
              <Dato label="Observaciones">
                <span className="text-sm text-[#4a463e] whitespace-pre-line">{pedido.observaciones}</span>
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
            <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide border ${estiloEstado(pedido.estado_entrega)}`}>
              {pedido.estado_entrega}
            </span>
          </div>
          <div className="border border-brand-line">
            <div className="grid grid-cols-3 divide-x divide-brand-line">
              <Kpi label="Solicitados" value={entero(pedido.cantidad_total)} />
              <Kpi label="Entregados" value={entero(pedido.cantidad_entregada)} tone="text-emerald-800" />
              <Kpi
                label="Pendientes"
                value={entero(pedido.cantidad_pendiente)}
                tone={pedido.cantidad_pendiente > 0 ? 'text-brand-accent' : 'text-[#201c17]'}
              />
            </div>
            <div className="px-6 pb-5 pt-1">
              <div className="flex justify-between text-xs text-[#8a8175] mb-1.5">
                <span>Avance de entrega</span>
                <span className="text-[#201c17] font-medium">{pedido.porcentaje_entrega}%</span>
              </div>
              <div className="h-2.5 bg-[#efeae0]">
                <div
                  className={`h-full transition-all ${pedido.cantidad_pendiente === 0 ? 'bg-emerald-700' : 'bg-brand-accent'}`}
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
            <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wide border ${estiloEstado(pedido.estado_pago)}`}>
              Pago: {pedido.estado_pago}
            </span>
          </div>
          <div className="border border-brand-line">
            <div className="grid grid-cols-3 divide-x divide-brand-line">
              <Kpi label="Total del pedido" value={dinero(pedido.total)} />
              <Kpi label="Total abonado" value={dinero(pedido.total_abonado)} tone="text-emerald-800" />
              <Kpi
                label="Saldo pendiente"
                value={dinero(pedido.saldo_pendiente)}
                tone={pedido.saldo_pendiente > 0 ? 'text-red-800' : 'text-[#201c17]'}
              />
            </div>
            <div className="px-6 pb-5 pt-1">
              <div className="flex justify-between text-xs text-[#8a8175] mb-1.5">
                <span>Avance de pago</span>
                <span className="text-[#201c17] font-medium">
                  {pedido.total > 0 ? Math.min(Math.round((pedido.total_abonado / pedido.total) * 1000) / 10, 100) : 0}%
                </span>
              </div>
              <div className="h-2.5 bg-[#efeae0]">
                <div
                  className={`h-full transition-all ${pedido.saldo_pendiente <= 0 ? 'bg-emerald-700' : 'bg-[#201c17]'}`}
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
        <div className="border border-brand-line overflow-x-auto">
          <table className="w-full">
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
                  <td colSpan={7} className="text-center py-10 text-[#a39a8c] text-sm">
                    <Truck size={26} strokeWidth={1.4} className="mx-auto mb-2 text-[#d9d2c3]" />
                    Todavía no se ha realizado ninguna entrega
                  </td>
                </tr>
              ) : (
                entregas.map((e, i) => (
                  <tr key={e.id} className="hover:bg-[#faf8f4] transition-colors">
                    <td className="px-5 py-3.5 text-[#8a8175] text-sm">{i + 1}</td>
                    <td className="px-5 py-3.5 text-[#201c17] whitespace-nowrap">{fechaCorta(e.fecha)}</td>
                    <td className="px-5 py-3.5 text-right text-[#201c17]">{entero(e.cantidad)}</td>
                    <td className="px-5 py-3.5 text-right text-[#4a463e]">{dinero(e.precio_unitario)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-[#201c17] whitespace-nowrap">{dinero(e.total)}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4a463e]">{e.observaciones || '—'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => generateEntregaPDF(pedido, e, entregas)}
                        className="p-1.5 text-[#8a8175] hover:text-brand-accent transition-colors"
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
                <tr className="border-t border-brand-line bg-[#faf8f4]">
                  <td colSpan={2} className="px-5 py-3 text-xs text-[#8a8175] uppercase tracking-wide">
                    Total entregado
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-[#201c17]">{entero(pedido.cantidad_entregada)}</td>
                  <td />
                  <td className="px-5 py-3 text-right font-medium text-[#201c17] whitespace-nowrap">{dinero(totalEntregado)}</td>
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
        <div className="border border-brand-line overflow-x-auto">
          <table className="w-full">
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
                  <td colSpan={7} className="text-center py-10 text-[#a39a8c] text-sm">
                    <Wallet size={26} strokeWidth={1.4} className="mx-auto mb-2 text-[#d9d2c3]" />
                    Todavía no se ha registrado ningún abono
                  </td>
                </tr>
              ) : (
                abonos.map((a, i) => (
                  <tr key={a.id} className="hover:bg-[#faf8f4] transition-colors">
                    <td className="px-5 py-3.5 text-[#8a8175] text-sm">{i + 1}</td>
                    <td className="px-5 py-3.5 text-[#201c17] whitespace-nowrap">{fechaCorta(a.fecha)}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-emerald-800 whitespace-nowrap">{dinero(a.monto)}</td>
                    <td className="px-5 py-3.5 text-[#4a463e]">{a.metodo_pago}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4a463e]">{a.comprobante || '—'}</td>
                    <td className="px-5 py-3.5 text-sm text-[#4a463e]">{a.observaciones || '—'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => generateAbonoPDF(pedido, a, abonos)}
                        className="p-1.5 text-[#8a8175] hover:text-brand-accent transition-colors"
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
                <tr className="border-t border-brand-line bg-[#faf8f4]">
                  <td colSpan={2} className="px-5 py-3 text-xs text-[#8a8175] uppercase tracking-wide">
                    Total abonado
                  </td>
                  <td className="px-5 py-3 text-right font-medium text-emerald-800 whitespace-nowrap">
                    {dinero(pedido.total_abonado)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* ========== MODAL AGREGAR ENTREGA ========== */}
      {showEntrega && (
        <div className="fixed inset-0 bg-[#15130f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h3 className="font-display text-2xl text-[#201c17]">Agregar entrega</h3>
                <p className="text-sm text-[#8a8175] mt-1">
                  Pedido #{pedido.id} — quedan {entero(pedido.cantidad_pendiente)} bloques por entregar
                </p>
              </div>
              <button onClick={() => setShowEntrega(false)} className="text-[#8a8175] hover:text-[#201c17] transition-colors">
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

              <div className="border border-brand-line divide-y divide-brand-line">
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-[#8a8175]">Precio unitario (del pedido)</span>
                  <span className="text-sm text-[#201c17]">{dinero(pedido.precio_unitario)}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3 bg-[#faf8f4]">
                  <span className="text-sm text-[#201c17] font-medium">Total de la entrega</span>
                  <span className="font-display text-xl text-[#201c17]">{dinero(totalEntregaPreview)}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-[#8a8175]">Pendientes después de esta entrega</span>
                  <span className="text-sm text-[#201c17]">
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

              <p className="text-xs text-[#8a8175]">
                La entrega descuenta los bloques del inventario de {nombreBloque(pedido.tipo_bloque)}.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEntrega(false)}
                  className="flex-1 py-3 border border-brand-line text-[#4a463e] text-sm hover:bg-[#faf8f4] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-3 bg-brand-primary hover:bg-brand-ink-soft disabled:opacity-60 text-white text-sm tracking-wide transition-colors"
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
        <div className="fixed inset-0 bg-[#15130f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h3 className="font-display text-2xl text-[#201c17]">Registrar abono</h3>
                <p className="text-sm text-[#8a8175] mt-1">
                  Pedido #{pedido.id} — saldo pendiente {dinero(pedido.saldo_pendiente)}
                </p>
              </div>
              <button onClick={() => setShowAbono(false)} className="text-[#8a8175] hover:text-[#201c17] transition-colors">
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
                    className="mt-1.5 text-[11px] text-brand-accent hover:underline"
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

              <div className="flex justify-between items-center px-5 py-3 bg-[#faf8f4] border border-brand-line">
                <span className="text-sm text-[#8a8175]">Saldo después del abono</span>
                <span className="font-display text-lg text-[#201c17]">
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
                  className="flex-1 py-3 border border-brand-line text-[#4a463e] text-sm hover:bg-[#faf8f4] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="flex-1 py-3 bg-brand-primary hover:bg-brand-ink-soft disabled:opacity-60 text-white text-sm tracking-wide transition-colors"
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
