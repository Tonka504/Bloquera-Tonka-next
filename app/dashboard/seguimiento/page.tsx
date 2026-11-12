'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, X, ClipboardList, ArrowRight, Truck } from 'lucide-react';
import { toast } from 'sonner';
import {
  getPedidosSeguimiento,
  crearPedidoSeguimientoAction,
  getConfiguracion,
  type PedidoSeguimiento,
  type Configuracion,
} from '../../actions';
import { TIPOS_BLOQUE, dinero, entero, fechaCorta, hoyLocal, nombreBloque, estiloEstado } from './formato';

import { Cargando } from '../../components/ui';
const FILTROS = ['Todos', 'Pendiente', 'En proceso', 'Entregado', 'Pagado', 'Finalizado'] as const;

const inputCls =
  'field w-full py-2.5 text-base text-ink';
const labelCls = 'block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5';
const thCls = 'px-5 py-3.5 text-[11px] font-medium text-muted uppercase tracking-[0.1em]';

function precioConfig(config: Configuracion | null, tipo: string) {
  if (!config) return '';
  const p = tipo.includes('4') ? config.precio_bloque_4 : tipo.includes('5') ? config.precio_bloque_5 : config.precio_bloque_6;
  return Number(p) > 0 ? String(Number(p)) : '';
}

export default function SeguimientoPage() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<PedidoSeguimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('Todos');

  const [showModal, setShowModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [tipo, setTipo] = useState(TIPOS_BLOQUE[0].value);
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');

  useEffect(() => {
    let activo = true;
    getPedidosSeguimiento().then((result) => {
      if (!activo) return;
      if (result.success) setPedidos(result.data || []);
      else toast.error(result.message);
      setLoading(false);
    });
    getConfiguracion().then((r) => {
      if (activo && r.success && r.data) setConfig(r.data);
    });
    return () => {
      activo = false;
    };
  }, []);

  const abrirModal = () => {
    setTipo(TIPOS_BLOQUE[0].value);
    setCantidad('');
    setPrecio(precioConfig(config, TIPOS_BLOQUE[0].value));
    setShowModal(true);
  };

  const cambiarTipo = (t: string) => {
    setTipo(t);
    const sugerido = precioConfig(config, t);
    if (sugerido) setPrecio(sugerido);
  };

  const totalPreview = (Math.round(Number(precio) * 100) * (parseInt(cantidad) || 0)) / 100;

  const crear = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const cant = parseInt(cantidad);
    const prec = parseFloat(precio);
    if (!cant || cant <= 0) return toast.error('La cantidad debe ser mayor a 0');
    if (!prec || prec <= 0) return toast.error('El precio debe ser mayor a 0');

    setGuardando(true);
    const result = await crearPedidoSeguimientoAction({
      cliente: (form.elements.namedItem('cliente') as HTMLInputElement).value,
      fecha: (form.elements.namedItem('fecha') as HTMLInputElement).value,
      tipo_bloque: tipo,
      cantidad_total: cant,
      precio_unitario: prec,
      observaciones: (form.elements.namedItem('observaciones') as HTMLTextAreaElement).value,
    });
    setGuardando(false);

    if (result.success && result.data) {
      toast.success(`Pedido #${result.data.id} creado`);
      setShowModal(false);
      router.push(`/dashboard/seguimiento/${result.data.id}`);
    } else {
      toast.error(result.message);
    }
  };

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos.filter((p) => {
      if (filtro !== 'Todos' && p.estado !== filtro) return false;
      if (!q) return true;
      return p.cliente.toLowerCase().includes(q) || String(p.id).includes(q);
    });
  }, [pedidos, busqueda, filtro]);

  const totales = useMemo(
    () => ({
      activos: pedidos.filter((p) => p.estado !== 'Finalizado').length,
      bloquesPendientes: pedidos.reduce((s, p) => s + p.cantidad_pendiente, 0),
      saldo: pedidos.reduce((s, p) => s + Math.round(p.saldo_pendiente * 100), 0) / 100,
    }),
    [pedidos]
  );

  return (
    <div className="px-10 py-9 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-9">
        <div className="flex items-center gap-4">
          <span className="icon-plate w-12 h-12 shrink-0">
            <Truck size={24} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-safety-deep uppercase tracking-[0.2em] mb-0.5">Entregas parciales y saldos</p>
            <h1 className="font-display text-3xl sm:text-4xl text-ink leading-none">Seguimiento de Pedidos</h1>
          </div>
        </div>
        <button
          onClick={abrirModal}
          className="btn btn-primary flex items-center gap-2 px-5 py-2.5 text-sm tracking-wide"
        >
          <Plus size={16} /> Nuevo Pedido
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 kpi-grid mb-9">
        <div className="px-6 py-5">
          <p className="text-[11px] text-muted uppercase tracking-[0.12em] mb-1">Pedidos activos</p>
          <p className="font-display text-2xl text-ink">{entero(totales.activos)}</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-[11px] text-muted uppercase tracking-[0.12em] mb-1">Bloques por entregar</p>
          <p className="font-display text-2xl text-ink">{entero(totales.bloquesPendientes)}</p>
        </div>
        <div className="px-6 py-5">
          <p className="text-[11px] text-muted uppercase tracking-[0.12em] mb-1">Saldo por cobrar</p>
          <p className="font-display text-2xl text-alert-deep">{dinero(totales.saldo)}</p>
        </div>
      </div>

      {/* Búsqueda + filtros */}
      <div className="flex flex-col lg:flex-row lg:items-end gap-5 mb-8">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 pointer-events-none -translate-y-1/2 text-faint-2" size={16} strokeWidth={1.6} />
          <input
            type="text"
            placeholder="Buscar por cliente o número de pedido..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="field w-full pl-9 py-2.5 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-[5px] border transition-all ${
                filtro === f
                  ? 'steel-surface text-white border-graphite shadow-[inset_0_-3px_0_var(--safety)]'
                  : 'bg-surface border-[#b9b8b1] text-ink-soft hover:border-safety hover:text-ink'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="panel">
        <div className="overflow-x-auto">
          <table className="table-industrial w-full">
            <thead>
              <tr className="border-b border-brand-line">
                <th className={`${thCls} text-left`}>N.°</th>
                <th className={`${thCls} text-left`}>Cliente</th>
                <th className={`${thCls} text-left`}>Fecha</th>
                <th className={`${thCls} text-left`}>Producto</th>
                <th className={`${thCls} text-left min-w-[180px]`}>Entregas</th>
                <th className={`${thCls} text-right`}>Total</th>
                <th className={`${thCls} text-right`}>Saldo</th>
                <th className={`${thCls} text-center`}>Estado</th>
                <th className={`${thCls} text-center`}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2 text-faint">
                      <Cargando texto="Cargando pedidos..." /></div>
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-faint">
                    <ClipboardList size={32} strokeWidth={1.4} className="mx-auto mb-3 text-faint-2" />
                    {pedidos.length === 0 ? 'No hay pedidos registrados' : 'No se encontraron pedidos'}
                  </td>
                </tr>
              ) : (
                filtrados.map((p) => (
                  <tr key={p.id} className="hover:bg-concrete-50 transition-colors">
                    <td className="px-5 py-4 text-ink">#{p.id}</td>
                    <td className="px-5 py-4 text-ink">{p.cliente}</td>
                    <td className="px-5 py-4 text-ink-soft whitespace-nowrap">{fechaCorta(p.fecha)}</td>
                    <td className="px-5 py-4 text-ink-soft whitespace-nowrap">{nombreBloque(p.tipo_bloque)}</td>
                    <td className="px-5 py-4">
                      <div className="flex justify-between text-xs text-ink-soft mb-1.5">
                        <span>
                          {entero(p.cantidad_entregada)} / {entero(p.cantidad_total)}
                        </span>
                        <span className="text-muted">{p.porcentaje_entrega}%</span>
                      </div>
                      <div className="progress-track h-2">
                        <div
                          className={`progress-fill ${p.cantidad_pendiente === 0 ? 'bg-ok' : 'bg-safety'}`}
                          style={{ width: `${p.porcentaje_entrega}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right text-ink whitespace-nowrap">{dinero(p.total)}</td>
                    <td
                      className={`px-5 py-4 text-right font-medium whitespace-nowrap ${
                        p.saldo_pendiente > 0 ? 'text-alert-deep' : 'text-ok-deep'
                      }`}
                    >
                      {dinero(p.saldo_pendiente)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`badge ${estiloEstado(p.estado)}`}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <Link
                        href={`/dashboard/seguimiento/${p.id}`}
                        className="btn btn-secondary inline-flex items-center gap-1.5 text-xs tracking-wide px-3 py-1.5 whitespace-nowrap"
                      >
                        Gestionar pedido <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-brand-line text-xs text-muted">
          Mostrando {filtrados.length} de {pedidos.length} pedidos
        </div>
      </div>

      {/* ========== MODAL NUEVO PEDIDO ========== */}
      {showModal && (
        <div className="modal-backdrop fixed inset-0 bg-graphite/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <h3 className="font-display text-2xl text-ink">Nuevo Pedido</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-ink transition-colors">
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>

            <form onSubmit={crear} className="px-8 pb-8 space-y-5">
              <div>
                <label className={labelCls}>Cliente *</label>
                <input name="cliente" required className={inputCls} placeholder="Nombre completo del cliente" />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Fecha del pedido *</label>
                  <input name="fecha" type="date" required defaultValue={hoyLocal()} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Tipo de bloque *</label>
                  <select value={tipo} onChange={(e) => cambiarTipo(e.target.value)} className={inputCls}>
                    {TIPOS_BLOQUE.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className={labelCls}>Cantidad total *</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    className={inputCls}
                    placeholder="Ej: 1000"
                  />
                </div>
                <div>
                  <label className={labelCls}>Precio unit. (L.) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className={inputCls}
                    placeholder="Ej: 20.00"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center px-5 py-4 bg-concrete-50 border border-brand-line">
                <span className="text-sm text-muted">Total del pedido</span>
                <span className="font-display text-xl text-ink">{dinero(totalPreview)}</span>
              </div>

              <div>
                <label className={labelCls}>Observaciones</label>
                <textarea name="observaciones" rows={2} className={`${inputCls} resize-none`} placeholder="Opcional" />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1 py-3 text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="btn btn-primary flex-1 py-3 text-sm tracking-wide"
                >
                  {guardando ? 'Guardando...' : 'Crear Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
