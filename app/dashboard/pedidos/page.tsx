'use client';

import { useEffect, useState } from 'react';
import { Plus, Truck, Trash2, Printer, Search, X, CheckCircle, Loader2, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { getPedidos, crearPedidoAction, eliminarPedidoAction, despacharPedidoAction } from '../../actions';
import { calcularDescuento, labelDescuento, UMBRAL_DESCUENTO_AUTOMATICO, type DescuentoTipo } from '../../../lib/descuento';
import { generateInvoicePDF } from '../../../lib/generateInvoicePDF';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState<'reciente' | 'antiguo'>('reciente');
  const [showModal, setShowModal] = useState(false);
  const [showDespachoModal, setShowDespachoModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [pedidoADespachar, setPedidoADespachar] = useState<any>(null);
  const [pedidoAEliminar, setPedidoAEliminar] = useState<any>(null);
  const [estadoPago, setEstadoPago] = useState("Pendiente");
  const [loading, setLoading] = useState(true);

  // Nuevo Pedido: cantidad/precio/descuento controlados para previsualizar el total
  const [npCantidad, setNpCantidad] = useState(100);
  const [npPrecio, setNpPrecio] = useState(25);
  const [npDescuentoTipo, setNpDescuentoTipo] = useState<DescuentoTipo>('ninguno');
  const [npDescuentoValor, setNpDescuentoValor] = useState(0);
  // Mientras el usuario no toque el selector de descuento a mano, se sugiere
  // el automático apenas la cantidad supera el umbral (y se retira si baja).
  const [npDescuentoTocado, setNpDescuentoTocado] = useState(false);
  const npSubtotal = npCantidad * npPrecio;
  const npDescuentoMonto = calcularDescuento(npSubtotal, npCantidad, npDescuentoTipo, npDescuentoValor);
  const npTotal = npSubtotal - npDescuentoMonto;

  useEffect(() => {
    if (npDescuentoTocado) return;
    setNpDescuentoTipo(npCantidad > UMBRAL_DESCUENTO_AUTOMATICO ? 'automatico' : 'ninguno');
  }, [npCantidad, npDescuentoTocado]);

  const resetNuevoPedido = () => {
    setNpCantidad(100);
    setNpPrecio(25);
    setNpDescuentoTipo('ninguno');
    setNpDescuentoValor(0);
    setNpDescuentoTocado(false);
    setEstadoPago('Pendiente');
  };

  // Despacho: descuento controlado, precargado del pedido pero ajustable
  const [despDescuentoTipo, setDespDescuentoTipo] = useState<DescuentoTipo>('ninguno');
  const [despDescuentoValor, setDespDescuentoValor] = useState(0);
  const despSubtotal = pedidoADespachar ? pedidoADespachar.cantidad * pedidoADespachar.precio_unitario : 0;
  const despDescuentoMonto = pedidoADespachar
    ? calcularDescuento(despSubtotal, pedidoADespachar.cantidad, despDescuentoTipo, despDescuentoValor)
    : 0;
  const despTotal = despSubtotal - despDescuentoMonto;

  const cargarPedidos = async () => {
    setLoading(true);
    const result = await getPedidos();
    if (result.success) {
      setPedidos(result.data || []);
      setPedidosFiltrados(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  useEffect(() => {
    let lista = pedidos;

    if (busqueda.trim()) {
      const filtro = busqueda.toLowerCase();
      lista = lista.filter(p =>
        p.cliente?.toLowerCase().includes(filtro) ||
        p.producto?.toLowerCase().includes(filtro) ||
        String(p.id).includes(filtro)
      );
    }

    lista = [...lista].sort((a, b) => {
      const diff = new Date(a.fecha).getTime() - new Date(b.fecha).getTime() || a.id - b.id;
      return orden === 'reciente' ? -diff : diff;
    });

    setPedidosFiltrados(lista);
  }, [busqueda, orden, pedidos]);

  const crearPedido = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const estadoPagoSeleccionado = (form.elements.namedItem('estado_pago') as HTMLSelectElement).value;
    const anticipoInput = form.elements.namedItem('anticipo') as HTMLInputElement;

    if (npCantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    if (npPrecio <= 0) {
      toast.error('El precio debe ser mayor a 0');
      return;
    }

    let anticipo = 0;
    if (estadoPagoSeleccionado === "Con Anticipo" && anticipoInput?.value) {
      anticipo = parseFloat(anticipoInput.value);
      if (anticipo <= 0) {
        toast.error('El anticipo debe ser mayor a 0');
        return;
      }
      if (anticipo > npTotal) {
        toast.error('El anticipo no puede ser mayor al total (con descuento aplicado)');
        return;
      }
    }

    const nuevoPedido = {
      fecha: new Date().toISOString().split('T')[0],
      cliente: (form.elements.namedItem('cliente') as HTMLInputElement).value.trim(),
      producto: (form.elements.namedItem('producto') as HTMLSelectElement).value,
      cantidad: npCantidad,
      precio_unitario: npPrecio,
      estado: 'Pendiente',
      estado_pago: estadoPagoSeleccionado,
      anticipo,
      descuento_tipo: npDescuentoTipo,
      descuento_valor: npDescuentoValor,
    };

    const result = await crearPedidoAction(nuevoPedido);

    if (result.success) {
      toast.success('Pedido creado correctamente');
      setShowModal(false);
      resetNuevoPedido();
      cargarPedidos();
      form.reset();
    } else {
      toast.error(result.message);
    }
  };

  const abrirModalDespacho = (pedido: any) => {
    setPedidoADespachar(pedido);
    const tipoGuardado: DescuentoTipo = pedido.descuento_tipo || 'ninguno';
    // Si el pedido no traía descuento pero ya supera las 500 unidades
    // (p. ej. quedó así antes de esta función), se sugiere el automático.
    const tipoSugerido: DescuentoTipo =
      tipoGuardado === 'ninguno' && pedido.cantidad > UMBRAL_DESCUENTO_AUTOMATICO ? 'automatico' : tipoGuardado;
    setDespDescuentoTipo(tipoSugerido);
    setDespDescuentoValor(Number(pedido.descuento_valor) || 0);
    setShowDespachoModal(true);
  };

  const confirmarDespacho = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pedidoADespachar) return;

    const form = e.currentTarget;
    const datosFactura = {
      fecha_despacho: (form.elements.namedItem('fecha_despacho') as HTMLInputElement).value,
      identidad: (form.elements.namedItem('identidad') as HTMLInputElement).value.trim(),
      rtn: (form.elements.namedItem('rtn') as HTMLInputElement).value.trim(),
      direccion: (form.elements.namedItem('direccion') as HTMLInputElement).value.trim() || 'SANTA BARBARA, S.B., HONDURAS',
      descuento_tipo: despDescuentoTipo,
      descuento_valor: despDescuentoValor,
    };

    const result = await despacharPedidoAction(pedidoADespachar.id, datosFactura);

    if (result.success) {
      toast.success(result.message || 'Pedido despachado correctamente');
      setShowDespachoModal(false);
      setPedidoADespachar(null);
      cargarPedidos();
    } else {
      toast.error(result.message);
    }
  };

  const imprimirPedido = (pedido: any) => {
    const subtotalPedido = pedido.cantidad * pedido.precio_unitario;
    const descuentoTipoPedido: DescuentoTipo = pedido.descuento_tipo || 'ninguno';
    const descuentoValorPedido = Number(pedido.descuento_valor) || 0;
    const descuentoMontoPedido = calcularDescuento(subtotalPedido, pedido.cantidad, descuentoTipoPedido, descuentoValorPedido);

    generateInvoicePDF({
      id: pedido.id,
      fecha: pedido.fecha,
      cliente: pedido.cliente,
      producto: pedido.producto,
      cantidad: pedido.cantidad,
      precio_unitario: pedido.precio_unitario,
      subtotal: subtotalPedido,
      descuento_tipo: descuentoTipoPedido,
      descuento_valor: descuentoValorPedido,
      descuento_monto: descuentoMontoPedido,
      total_venta: subtotalPedido - descuentoMontoPedido,
      anticipo: pedido.anticipo,
    });
    toast.success(`Cotización del pedido #${pedido.id} descargada`);
  };

  const abrirModalEliminar = (pedido: any) => {
    setPedidoAEliminar(pedido);
    setShowEliminarModal(true);
  };

  const confirmarEliminar = async () => {
    if (!pedidoAEliminar) return;

    const result = await eliminarPedidoAction(pedidoAEliminar.id);
    if (result.success) {
      toast.success('Pedido eliminado');
      setShowEliminarModal(false);
      setPedidoAEliminar(null);
      cargarPedidos();
    } else {
      toast.error(result.message);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pagado': return 'text-emerald-800';
      case 'Con Anticipo': return 'text-[#8a8175]';
      case 'Pendiente': return 'text-brand-accent';
      default: return 'text-[#8a8175]';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-9 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-9">
        <div>
          <p className="text-xs text-[#8a8175] uppercase tracking-[0.15em] mb-1">Gestión</p>
          <h1 className="font-display text-3xl text-[#201c17]">Pedidos</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-brand-primary hover:bg-brand-ink-soft text-white px-5 py-2.5 transition-colors text-sm tracking-wide"
        >
          <Plus size={16} /> Nuevo Pedido
        </button>
      </div>

      {/* Búsqueda y orden */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#c2b8a1]" size={16} strokeWidth={1.6} />
          <input
            type="text"
            placeholder="Buscar por cliente, producto o ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-6 pr-4 py-2.5 border-0 border-b border-brand-line bg-transparent focus:outline-none focus:border-brand-accent text-sm transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em]">Orden</label>
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as 'reciente' | 'antiguo')}
            className="px-4 py-2.5 border border-brand-line focus:outline-none focus:border-brand-accent text-sm bg-white transition-colors"
          >
            <option value="reciente">Más reciente primero</option>
            <option value="antiguo">Más reciente al final</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="border border-brand-line">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-line">
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">ID</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Cliente</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Producto</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Cantidad</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Precio</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Total</th>
                <th className="px-5 py-3.5 text-center text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Estado</th>
                <th className="px-5 py-3.5 text-center text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Pago</th>
                <th className="px-5 py-3.5 text-center text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2 text-[#a39a8c]">
                      <Loader2 className="animate-spin" size={18} /> Cargando pedidos...
                    </div>
                  </td>
                </tr>
              ) : pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-[#a39a8c]">
                    <ShoppingCart size={32} strokeWidth={1.4} className="mx-auto mb-3 text-[#d9d2c3]" />
                    {busqueda ? 'No se encontraron pedidos' : 'No hay pedidos registrados'}
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p: any) => {
                  const pSubtotal = p.cantidad * p.precio_unitario;
                  const pDescuento = calcularDescuento(pSubtotal, p.cantidad, p.descuento_tipo || 'ninguno', Number(p.descuento_valor) || 0);
                  return (
                  <tr key={p.id} className="hover:bg-[#faf8f4] transition-colors">
                    <td className="px-5 py-4 text-[#201c17]">#{p.id}</td>
                    <td className="px-5 py-4 text-[#201c17]">{p.cliente}</td>
                    <td className="px-5 py-4 text-[#4a463e]">{p.producto}</td>
                    <td className="px-5 py-4 text-right text-[#4a463e]">{p.cantidad.toLocaleString()}</td>
                    <td className="px-5 py-4 text-right text-[#4a463e]">L. {Number(p.precio_unitario).toFixed(2)}</td>
                    <td className="px-5 py-4 text-right font-medium text-[#201c17]">
                      L. {(pSubtotal - pDescuento).toFixed(2)}
                      {pDescuento > 0 && (
                        <p className="text-[11px] font-normal text-brand-accent mt-0.5">−L. {pDescuento.toFixed(2)} desc.</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-xs text-brand-accent uppercase tracking-wide">
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs uppercase tracking-wide ${getEstadoColor(p.estado_pago || 'Pendiente')}`}>
                        {p.estado_pago || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="flex justify-center gap-1">
                        <button
                          onClick={() => abrirModalDespacho(p)}
                          className="p-1.5 text-[#8a8175] hover:text-brand-accent transition-colors"
                          title="Despachar"
                        >
                          <Truck size={16} strokeWidth={1.6} />
                        </button>
                        <button
                          onClick={() => imprimirPedido(p)}
                          className="p-1.5 text-[#8a8175] hover:text-brand-accent transition-colors"
                          title="Imprimir cotización"
                        >
                          <Printer size={16} strokeWidth={1.6} />
                        </button>
                        <button
                          onClick={() => abrirModalEliminar(p)}
                          className="p-1.5 text-[#8a8175] hover:text-red-800 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 size={16} strokeWidth={1.6} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Contador */}
        <div className="px-5 py-3 border-t border-brand-line text-xs text-[#8a8175]">
          Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos
        </div>
      </div>

      {/* ========== MODAL NUEVO PEDIDO ========== */}
      {showModal && (
        <div className="fixed inset-0 bg-[#15130f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <h3 className="font-display text-2xl text-[#201c17]">Nuevo Pedido</h3>
              <button
                onClick={() => { setShowModal(false); resetNuevoPedido(); }}
                className="text-[#8a8175] hover:text-[#201c17] transition-colors"
              >
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>

            <form onSubmit={crearPedido} className="px-8 pb-8 space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Cliente *</label>
                <input
                  name="cliente"
                  required
                  className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] placeholder:text-[#c2b8a1] focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="Nombre completo del cliente"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Producto</label>
                <select
                  name="producto"
                  className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors bg-white"
                >
                  <option value='Bloque de 4"'>Bloque de 4"</option>
                  <option value='Bloque de 5"'>Bloque de 5"</option>
                  <option value='Bloque de 6"'>Bloque de 6"</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Cantidad *</label>
                  <input
                    name="cantidad"
                    type="number"
                    min="1"
                    value={npCantidad}
                    onChange={(e) => setNpCantidad(parseInt(e.target.value) || 0)}
                    className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Precio Unit. (L.) *</label>
                  <input
                    name="precio"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={npPrecio}
                    onChange={(e) => setNpPrecio(parseFloat(e.target.value) || 0)}
                    className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors"
                  />
                </div>
              </div>

              {/* Descuento */}
              <div className="border-t border-brand-line pt-5">
                <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Descuento</label>
                <select
                  value={npDescuentoTipo}
                  onChange={(e) => { setNpDescuentoTipo(e.target.value as DescuentoTipo); setNpDescuentoTocado(true); }}
                  className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors bg-white"
                >
                  <option value="ninguno">Sin descuento</option>
                  <option value="no_aplica">No aplica para descuentos</option>
                  <option value="automatico">Automático — 10% si son más de {UMBRAL_DESCUENTO_AUTOMATICO} bloques</option>
                  <option value="porcentaje">Manual — % sobre el subtotal</option>
                  <option value="monto">Manual — monto fijo (L.)</option>
                </select>

                {npDescuentoTipo === 'automatico' && npCantidad <= UMBRAL_DESCUENTO_AUTOMATICO && (
                  <p className="text-xs text-brand-accent mt-2">
                    No se aplicará todavía: se necesitan más de {UMBRAL_DESCUENTO_AUTOMATICO} bloques.
                  </p>
                )}

                {(npDescuentoTipo === 'porcentaje' || npDescuentoTipo === 'monto') && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">
                      {npDescuentoTipo === 'porcentaje' ? 'Porcentaje de descuento (%)' : 'Monto de descuento (L.)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={npDescuentoTipo === 'porcentaje' ? 100 : undefined}
                      value={npDescuentoValor}
                      onChange={(e) => setNpDescuentoValor(parseFloat(e.target.value) || 0)}
                      className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors"
                      placeholder={npDescuentoTipo === 'porcentaje' ? 'Ej: 5' : 'Ej: 200'}
                    />
                  </div>
                )}

                {npDescuentoMonto > 0 && (
                  <div className="mt-4 border border-brand-line divide-y divide-brand-line text-sm">
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-[#8a8175]">Subtotal</span>
                      <span className="text-[#201c17]">L. {npSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-2.5">
                      <span className="text-brand-accent whitespace-nowrap">{labelDescuento(npDescuentoTipo, npDescuentoValor)}</span>
                      <span className="text-brand-accent whitespace-nowrap">− L. {npDescuentoMonto.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between px-4 py-2.5 bg-[#faf8f4] font-medium">
                      <span className="text-[#201c17]">Total</span>
                      <span className="text-[#201c17]">L. {npTotal.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Estado de Pago</label>
                <select
                  name="estado_pago"
                  value={estadoPago}
                  onChange={(e) => setEstadoPago(e.target.value)}
                  className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors bg-white"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Con Anticipo">Con Anticipo</option>
                </select>
              </div>

              {estadoPago === "Con Anticipo" && (
                <div>
                  <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Monto del Anticipo (L.)</label>
                  <input
                    name="anticipo"
                    type="number"
                    step="0.01"
                    min="0.01"
                    defaultValue="0"
                    className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder="Ej: 500"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetNuevoPedido(); }}
                  className="flex-1 py-3 border border-brand-line text-[#4a463e] text-sm hover:bg-[#faf8f4] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-primary hover:bg-brand-ink-soft text-white text-sm tracking-wide transition-colors"
                >
                  Guardar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL DESPACHO COMPLETO ========== */}
      {showDespachoModal && pedidoADespachar && (
        <div className="fixed inset-0 bg-[#15130f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h3 className="font-display text-2xl text-[#201c17]">Despachar Pedido</h3>
                <p className="text-sm text-[#8a8175] mt-1">#{pedidoADespachar.id} — {pedidoADespachar.cliente}</p>
              </div>
              <button
                onClick={() => { setShowDespachoModal(false); setPedidoADespachar(null); }}
                className="text-[#8a8175] hover:text-[#201c17] transition-colors"
              >
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>

            {/* DESCUENTO */}
            <div className="mx-8 mb-6">
              <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Descuento</label>
              <select
                value={despDescuentoTipo}
                onChange={(e) => setDespDescuentoTipo(e.target.value as DescuentoTipo)}
                className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors bg-white"
              >
                <option value="ninguno">Sin descuento</option>
                <option value="no_aplica">No aplica para descuentos</option>
                <option value="automatico">Automático — 10% si son más de {UMBRAL_DESCUENTO_AUTOMATICO} bloques</option>
                <option value="porcentaje">Manual — % sobre el subtotal</option>
                <option value="monto">Manual — monto fijo (L.)</option>
              </select>

              {despDescuentoTipo === 'automatico' && pedidoADespachar.cantidad <= UMBRAL_DESCUENTO_AUTOMATICO && (
                <p className="text-xs text-brand-accent mt-2">
                  No se aplicará: este pedido tiene {UMBRAL_DESCUENTO_AUTOMATICO} bloques o menos.
                </p>
              )}

              {(despDescuentoTipo === 'porcentaje' || despDescuentoTipo === 'monto') && (
                <div className="mt-3">
                  <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">
                    {despDescuentoTipo === 'porcentaje' ? 'Porcentaje de descuento (%)' : 'Monto de descuento (L.)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={despDescuentoTipo === 'porcentaje' ? 100 : undefined}
                    value={despDescuentoValor}
                    onChange={(e) => setDespDescuentoValor(parseFloat(e.target.value) || 0)}
                    className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder={despDescuentoTipo === 'porcentaje' ? 'Ej: 5' : 'Ej: 200'}
                  />
                </div>
              )}
            </div>

            {/* RESUMEN DE PAGO */}
            <div className="mx-8 mb-6">
              <h4 className="text-xs font-medium text-[#8a8175] uppercase tracking-[0.12em] mb-3">Resumen de Pago</h4>
              <div className="border border-brand-line divide-y divide-brand-line">
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-[#8a8175]">Producto</span>
                  <span className="text-sm text-[#201c17]">{pedidoADespachar.producto}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-[#8a8175]">Cantidad</span>
                  <span className="text-sm text-[#201c17]">{pedidoADespachar.cantidad.toLocaleString()} und</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-[#8a8175]">Precio Unitario</span>
                  <span className="text-sm text-[#201c17]">L. {Number(pedidoADespachar.precio_unitario).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center px-5 py-3">
                  <span className="text-sm text-[#8a8175]">Subtotal</span>
                  <span className="text-sm text-[#201c17]">L. {despSubtotal.toFixed(2)}</span>
                </div>
                {despDescuentoMonto > 0 && (
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 px-5 py-3">
                    <span className="text-sm text-brand-accent font-medium whitespace-nowrap">{labelDescuento(despDescuentoTipo, despDescuentoValor)}</span>
                    <span className="text-sm font-medium text-brand-accent whitespace-nowrap">− L. {despDescuentoMonto.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center px-5 py-3 bg-[#faf8f4]">
                  <span className="text-sm text-[#201c17] font-medium">Total a Pagar</span>
                  <span className="text-lg font-display text-[#201c17]">
                    L. {despTotal.toFixed(2)}
                  </span>
                </div>
                {Number(pedidoADespachar.anticipo) > 0 && (
                  <div className="flex justify-between items-center px-5 py-3">
                    <span className="text-sm text-emerald-800 font-medium">Anticipo Recibido</span>
                    <span className="text-sm font-medium text-emerald-800">
                      L. {Number(pedidoADespachar.anticipo).toFixed(2)}
                    </span>
                  </div>
                )}
                {Number(pedidoADespachar.anticipo) > 0 && Number(pedidoADespachar.anticipo) < despTotal && (
                  <div className="flex justify-between items-center px-5 py-3">
                    <span className="text-sm text-brand-accent font-medium">Cantidad Faltante</span>
                    <span className="text-sm font-medium text-brand-accent">
                      L. {Math.max(0, despTotal - Number(pedidoADespachar.anticipo)).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center px-5 py-3 bg-brand-ink">
                  <span className="text-xs font-medium text-white/70 uppercase tracking-wide">Estado del Pago</span>
                  <span className="text-xs font-medium text-brand-accent uppercase tracking-wide">
                    Pagado
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={confirmarDespacho} className="px-8 pb-8 space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Fecha de Despacho *</label>
                <input
                  name="fecha_despacho"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Identidad del Cliente</label>
                <input
                  name="identidad"
                  type="text"
                  placeholder="Ej: 0801-1990-12345"
                  className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] placeholder:text-[#c2b8a1] focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">RTN</label>
                <input
                  name="rtn"
                  type="text"
                  placeholder="Ej: 08011990123456"
                  className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] placeholder:text-[#c2b8a1] focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Dirección</label>
                <input
                  name="direccion"
                  type="text"
                  defaultValue="SANTA BARBARA, S.B., HONDURAS"
                  className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-brand-accent-soft border border-brand-accent/20">
                <CheckCircle size={16} strokeWidth={1.6} className="text-brand-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#4a463e]">
                  Al confirmar el despacho, la factura se generará con estado <strong>PAGADO</strong>. El producto se entregó y el pago está completo.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowDespachoModal(false); setPedidoADespachar(null); }}
                  className="flex-1 py-3 border border-brand-line text-[#4a463e] text-sm hover:bg-[#faf8f4] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-brand-primary hover:bg-brand-ink-soft text-white text-sm tracking-wide transition-colors"
                >
                  Confirmar Despacho y Pago
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========== MODAL CONFIRMAR ELIMINAR ========== */}
      {showEliminarModal && pedidoAEliminar && (
        <div className="fixed inset-0 bg-[#15130f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-8 text-center">
            <div className="w-14 h-14 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={22} strokeWidth={1.6} className="text-red-800" />
            </div>
            <h3 className="font-display text-xl text-[#201c17] mb-2">¿Eliminar Pedido?</h3>
            <p className="text-[#8a8175] text-sm mb-6">
              Estás a punto de eliminar el pedido <span className="font-medium text-[#201c17]">#{pedidoAEliminar.id}</span> de <span className="font-medium text-[#201c17]">{pedidoAEliminar.cliente}</span>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowEliminarModal(false); setPedidoAEliminar(null); }}
                className="flex-1 py-3 border border-brand-line text-[#4a463e] text-sm hover:bg-[#faf8f4] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                className="flex-1 py-3 bg-red-800 hover:bg-red-900 text-white text-sm tracking-wide transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
