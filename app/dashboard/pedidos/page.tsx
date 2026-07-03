'use client';

import { useEffect, useState } from 'react';
import { Plus, Truck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getPedidos, crearPedidoAction, eliminarPedidoAction, despacharPedidoAction } from '../../actions';

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDespachoModal, setShowDespachoModal] = useState(false);
  const [pedidoADespachar, setPedidoADespachar] = useState<any>(null);
  const [estadoPago, setEstadoPago] = useState("Pendiente");

  const cargarPedidos = async () => {
    const result = await getPedidos();
    if (result.success) setPedidos(result.data || []);
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

const crearPedido = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const form = e.currentTarget;

  const estadoPagoSeleccionado = (form.elements.namedItem('estado_pago') as HTMLSelectElement).value;
  const anticipoInput = form.elements.namedItem('anticipo') as HTMLInputElement;

  const nuevoPedido = {
    fecha: new Date().toISOString().split('T')[0],
    cliente: (form.elements.namedItem('cliente') as HTMLInputElement).value,
    producto: (form.elements.namedItem('producto') as HTMLSelectElement).value,
    cantidad: parseInt((form.elements.namedItem('cantidad') as HTMLInputElement).value),
    precio_unitario: parseFloat((form.elements.namedItem('precio') as HTMLInputElement).value),
    estado: 'Pendiente',
    estado_pago: estadoPagoSeleccionado,
    anticipo: estadoPagoSeleccionado === "Con Anticipo" && anticipoInput 
      ? parseFloat(anticipoInput.value) 
      : 0
  };

  const result = await crearPedidoAction(nuevoPedido);

  if (result.success) {
    toast.success('Pedido creado correctamente');
    setShowModal(false);
    setEstadoPago("Pendiente"); // resetear estado
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

  const confirmarDespacho = async () => {
    if (!pedidoADespachar) return;

    const result = await despacharPedidoAction(pedidoADespachar.id);

    if (result.success) {
      toast.success('Pedido despachado');
      setShowDespachoModal(false);
      setPedidoADespachar(null);
      cargarPedidos();
    } else {
      toast.error(result.message);
    }
  };

  const eliminarPedido = async (id: number) => {
    if (!confirm('¿Eliminar este pedido?')) return;
    const result = await eliminarPedidoAction(id);
    if (result.success) {
      toast.success('Pedido eliminado');
      cargarPedidos();
    }
  };

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pedidos</h1>
          <p className="text-slate-500">Gestión de pedidos y despachos</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition">
          <Plus size={20} /> Nuevo Pedido
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">ID</th>
              <th className="px-6 py-4 text-left">Cliente</th>
              <th className="px-6 py-4 text-left">Producto</th>
              <th className="px-6 py-4 text-right">Cantidad</th>
              <th className="px-6 py-4 text-right">Precio</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400">No hay pedidos registrados</td></tr>
            ) : (
              pedidos.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">#{p.id}</td>
                  <td className="px-6 py-4">{p.cliente}</td>
                  <td className="px-6 py-4">{p.producto}</td>
                  <td className="px-6 py-4 text-right">{p.cantidad}</td>
                  <td className="px-6 py-4 text-right">L. {p.precio_unitario}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-3 py-1 text-xs rounded-full bg-amber-100 text-amber-700">{p.estado}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => abrirModalDespacho(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"><Truck size={18} /></button>
                      <button onClick={() => eliminarPedido(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

    {/* Modal Nuevo Pedido - Con Anticipo condicional */}
{showModal && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-3xl w-full max-w-md shadow-xl">
      
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <h3 className="text-2xl font-bold text-slate-900">Nuevo Pedido</h3>
        <button 
          onClick={() => {
            setShowModal(false);
            setEstadoPago("Pendiente"); // resetear al cerrar
          }} 
          className="text-slate-400 hover:text-slate-600 text-2xl leading-none transition"
        >
          ×
        </button>
      </div>

      <form onSubmit={crearPedido} className="px-8 pb-8 space-y-5">
        
        {/* Cliente */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Cliente</label>
          <input 
            name="cliente" 
            required 
            className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition" 
            placeholder="Nombre del cliente"
          />
        </div>

        {/* Producto */}
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

        {/* Cantidad + Precio */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Cantidad</label>
            <input 
              name="cantidad" 
              type="number" 
              defaultValue="100" 
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Precio Unitario (L.)</label>
            <input 
              name="precio" 
              type="number" 
              step="0.01" 
              defaultValue="25" 
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition" 
            />
          </div>
        </div>

        {/* Estado de Pago */}
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

        {/* Campo de Anticipo (solo aparece si elige "Con Anticipo") */}
        {estadoPago === "Con Anticipo" && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto del Anticipo (L.)</label>
            <input 
              name="anticipo" 
              type="number" 
              step="0.01"
              defaultValue="0"
              className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition" 
              placeholder="Ej: 500"
            />
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <button 
            type="button" 
            onClick={() => {
              setShowModal(false);
              setEstadoPago("Pendiente");
            }} 
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
      {/* Modal Despacho */}
      {showDespachoModal && pedidoADespachar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">Despachar Pedido #{pedidoADespachar.id}</h3>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowDespachoModal(false)} className="flex-1 py-3 rounded-2xl border">Cancelar</button>
              <button onClick={confirmarDespacho} className="flex-1 py-3 rounded-2xl bg-blue-600 text-white">Confirmar Despacho</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}