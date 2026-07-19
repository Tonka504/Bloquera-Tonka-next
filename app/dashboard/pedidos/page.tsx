'use client';

import { useEffect, useState } from 'react';
import { Plus, Truck, Trash2, Search, X, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getPedidos, crearPedidoAction, eliminarPedidoAction, despacharPedidoAction } from '../../actions';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [pedidosFiltrados, setPedidosFiltrados] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDespachoModal, setShowDespachoModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [pedidoADespachar, setPedidoADespachar] = useState<any>(null);
  const [pedidoAEliminar, setPedidoAEliminar] = useState<any>(null);
  const [estadoPago, setEstadoPago] = useState("Pendiente");
  const [loading, setLoading] = useState(true);

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

  // Filtrar pedidos
  useEffect(() => {
    if (!busqueda.trim()) {
      setPedidosFiltrados(pedidos);
      return;
    }
    const filtro = busqueda.toLowerCase();
    setPedidosFiltrados(
      pedidos.filter(p => 
        p.cliente?.toLowerCase().includes(filtro) ||
        p.producto?.toLowerCase().includes(filtro) ||
        String(p.id).includes(filtro)
      )
    );
  }, [busqueda, pedidos]);

  const crearPedido = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const estadoPagoSeleccionado = (form.elements.namedItem('estado_pago') as HTMLSelectElement).value;
    const anticipoInput = form.elements.namedItem('anticipo') as HTMLInputElement;
    const cantidad = parseInt((form.elements.namedItem('cantidad') as HTMLInputElement).value);
    const precio = parseFloat((form.elements.namedItem('precio') as HTMLInputElement).value);

    // Validaciones
    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }
    if (precio <= 0) {
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
      if (anticipo > cantidad * precio) {
        toast.error('El anticipo no puede ser mayor al total');
        return;
      }
    }

    const nuevoPedido = {
      fecha: new Date().toISOString().split('T')[0],
      cliente: (form.elements.namedItem('cliente') as HTMLInputElement).value.trim(),
      producto: (form.elements.namedItem('producto') as HTMLSelectElement).value,
      cantidad,
      precio_unitario: precio,
      estado: 'Pendiente',
      estado_pago: estadoPagoSeleccionado,
      anticipo
    };

    const result = await crearPedidoAction(nuevoPedido);

    if (result.success) {
      toast.success('Pedido creado correctamente');
      setShowModal(false);
      setEstadoPago("Pendiente");
      cargarPedidos();
      form.reset();
    } else {
      toast.error(result.message);
    }
  };

  const abrirModalDespacho = (pedido: any) => {
    setPedidoADespachar(pedido);
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
      case 'Pagado': return 'bg-emerald-100 text-emerald-700';
      case 'Con Anticipo': return 'bg-blue-100 text-blue-700';
      case 'Pendiente': return 'bg-amber-100 text-amber-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="p-8 relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
          <p className="text-slate-500">Gestión de pedidos y despachos</p>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition"
        >
          <Plus size={20} /> Nuevo Pedido
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por cliente, producto o ID..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-sm"
        />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Pago</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">Cargando...</td></tr>
              ) : pedidosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    {busqueda ? 'No se encontraron pedidos' : 'No hay pedidos registrados'}
                  </td>
                </tr>
              ) : (
                pedidosFiltrados.map((p: any) => (
                  <tr key={p.id} className="border-t hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">#{p.id}</td>
                    <td className="px-6 py-4 text-slate-700">{p.cliente}</td>
                    <td className="px-6 py-4 text-slate-700">{p.producto}</td>
                    <td className="px-6 py-4 text-right text-slate-700">{p.cantidad.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-700">L. {Number(p.precio_unitario).toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-slate-900">
                      L. {(p.cantidad * p.precio_unitario).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700 font-medium">
                        {p.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${getEstadoColor(p.estado_pago || 'Pendiente')}`}>
                        {p.estado_pago || 'Pendiente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button 
                          onClick={() => abrirModalDespacho(p)} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition" 
                          title="Despachar"
                        >
                          <Truck size={18} />
                        </button>
                        <button 
                          onClick={() => abrirModalEliminar(p)} 
                          className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition" 
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Contador */}
        <div className="px-6 py-3 bg-slate-50 border-t text-xs text-slate-500">
          Mostrando {pedidosFiltrados.length} de {pedidos.length} pedidos
        </div>
      </div>

      {/* ========== MODAL NUEVO PEDIDO ========== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <h3 className="text-2xl font-bold text-slate-900">Nuevo Pedido</h3>
              <button 
                onClick={() => { setShowModal(false); setEstadoPago("Pendiente"); }} 
                className="text-slate-400 hover:text-slate-600 text-2xl leading-none transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={crearPedido} className="px-8 pb-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente *</label>
                <input 
                  name="cliente" 
                  required 
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition" 
                  placeholder="Nombre completo del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Producto</label>
                <select 
                  name="producto" 
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition bg-white"
                >
                  <option value='Bloque de 4"'>Bloque de 4"</option>
                  <option value='Bloque de 5"'>Bloque de 5"</option>
                  <option value='Bloque de 6"'>Bloque de 6"</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Cantidad *</label>
                  <input 
                    name="cantidad" 
                    type="number" 
                    min="1"
                    defaultValue="100" 
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio Unitario (L.) *</label>
                  <input 
                    name="precio" 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    defaultValue="25" 
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado de Pago</label>
                <select 
                  name="estado_pago" 
                  value={estadoPago}
                  onChange={(e) => setEstadoPago(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition bg-white"
                >
                  <option value="Pendiente">Pendiente</option>
                  <option value="Pagado">Pagado</option>
                  <option value="Con Anticipo">Con Anticipo</option>
                </select>
              </div>

              {estadoPago === "Con Anticipo" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto del Anticipo (L.)</label>
                  <input 
                    name="anticipo" 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    defaultValue="0"
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition" 
                    placeholder="Ej: 500"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowModal(false); setEstadoPago("Pendiente"); }} 
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Despachar Pedido</h3>
                <p className="text-sm text-slate-500 mt-1">#{pedidoADespachar.id} — {pedidoADespachar.cliente}</p>
              </div>
              <button 
                onClick={() => { setShowDespachoModal(false); setPedidoADespachar(null); }} 
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* RESUMEN DE PAGO */}
            <div className="mx-8 mb-6">
              <h4 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Resumen de Pago</h4>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden">
                {/* Producto */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Producto</span>
                  <span className="text-sm font-medium text-slate-900">{pedidoADespachar.producto}</span>
                </div>
                {/* Cantidad */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Cantidad</span>
                  <span className="text-sm font-medium text-slate-900">{pedidoADespachar.cantidad.toLocaleString()} und</span>
                </div>
                {/* Precio Unit. */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-500">Precio Unitario</span>
                  <span className="text-sm font-medium text-slate-900">L. {Number(pedidoADespachar.precio_unitario).toFixed(2)}</span>
                </div>
                {/* Total a Pagar */}
                <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 bg-blue-50">
                  <span className="text-sm font-semibold text-blue-700">Total a Pagar</span>
                  <span className="text-lg font-bold text-blue-700">
                    L. {(pedidoADespachar.cantidad * pedidoADespachar.precio_unitario).toFixed(2)}
                  </span>
                </div>
                {/* Anticipo (si existe) */}
                {Number(pedidoADespachar.anticipo) > 0 && (
                  <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 bg-emerald-50">
                    <span className="text-sm font-semibold text-emerald-700">Anticipo Recibido</span>
                    <span className="text-lg font-bold text-emerald-700">
                      L. {Number(pedidoADespachar.anticipo).toFixed(2)}
                    </span>
                  </div>
                )}
                {/* Cantidad Faltante */}
                {Number(pedidoADespachar.anticipo) > 0 && Number(pedidoADespachar.anticipo) < (pedidoADespachar.cantidad * pedidoADespachar.precio_unitario) && (
                  <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100 bg-amber-50">
                    <span className="text-sm font-semibold text-amber-700">Cantidad Faltante</span>
                    <span className="text-lg font-bold text-amber-700">
                      L. {Math.max(0, (pedidoADespachar.cantidad * pedidoADespachar.precio_unitario) - Number(pedidoADespachar.anticipo)).toFixed(2)}
                    </span>
                  </div>
                )}
                {/* Estado */}
                <div className="flex justify-between items-center px-5 py-3 bg-emerald-100">
                  <span className="text-sm font-semibold text-emerald-800">Estado del Pago</span>
                  <span className="px-3 py-1 text-sm font-bold text-emerald-800 bg-emerald-200 rounded-full">
                    PAGADO
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={confirmarDespacho} className="px-8 pb-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Fecha de Despacho *</label>
                <input 
                  name="fecha_despacho" 
                  type="date" 
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Identidad del Cliente</label>
                <input 
                  name="identidad" 
                  type="text" 
                  placeholder="Ej: 0801-1990-12345"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">RTN</label>
                <input 
                  name="rtn" 
                  type="text" 
                  placeholder="Ej: 08011990123456"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
                <input 
                  name="direccion" 
                  type="text" 
                  defaultValue="SANTA BARBARA, S.B., HONDURAS"
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition" 
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <CheckCircle size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-emerald-700">
                  Al confirmar el despacho, la factura se generará con estado <strong>PAGADO</strong>. El producto se entregó y el pago está completo.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setShowDespachoModal(false); setPedidoADespachar(null); }} 
                  className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition"
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={28} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Pedido?</h3>
            <p className="text-slate-500 mb-6">
              Estás a punto de eliminar el pedido <span className="font-semibold text-slate-700">#{pedidoAEliminar.id}</span> de <span className="font-semibold text-slate-700">{pedidoAEliminar.cliente}</span>. 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowEliminarModal(false); setPedidoAEliminar(null); }} 
                className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmarEliminar} 
                className="flex-1 py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-semibold transition"
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