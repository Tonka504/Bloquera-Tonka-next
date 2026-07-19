'use client';

import { useEffect, useState } from 'react';
import { Plus, Hammer, AlertTriangle, History, Package, X } from 'lucide-react';
import { toast } from 'sonner';
import { getInventario, getHistorialInventario, abastecerInventarioAction, producirBloquesAction } from '../../actions';

export default function InventarioPage() {
  const [inventario, setInventario] = useState<Record<string, number>>({});
  const [historial, setHistorial] = useState<any[]>([]);
  const [showAbastecer, setShowAbastecer] = useState(false);
  const [showProducir, setShowProducir] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargarInventario = async () => {
    setLoading(true);
    const result = await getInventario();
    if (result.success) {
      setInventario(result.data || {});
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const cargarHistorial = async () => {
    const result = await getHistorialInventario();
    if (result.success) {
      setHistorial(result.data || []);
    }
  };

  useEffect(() => {
    cargarInventario();
    cargarHistorial();
  }, []);

  const abastecer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const cemento = parseFloat((form.elements.namedItem('cemento') as HTMLInputElement).value) || 0;
    const arena = parseFloat((form.elements.namedItem('arena') as HTMLInputElement).value) || 0;

    if (cemento <= 0 && arena <= 0) {
      toast.error('Debes ingresar al menos un material');
      return;
    }

    const result = await abastecerInventarioAction(cemento, arena);

    if (result.success) {
      toast.success('Inventario actualizado');
      setShowAbastecer(false);
      cargarInventario();
      cargarHistorial();
      form.reset();
    } else {
      toast.error(result.message);
    }
  };

  const producir = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const producto = (form.elements.namedItem('producto') as HTMLSelectElement).value;
    const cantidad = parseInt((form.elements.namedItem('cantidad') as HTMLInputElement).value) || 0;

    if (cantidad <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    const result = await producirBloquesAction(producto, cantidad);

    if (result.success) {
      toast.success(result.message || 'Producción registrada');
      setShowProducir(false);
      cargarInventario();
      cargarHistorial();
      form.reset();
    } else {
      toast.error(result.message);
    }
  };

  const getStockStatus = (cantidad: number) => {
    if (cantidad <= 0) return { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Agotado' };
    if (cantidad < 100) return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Bajo' };
    return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Normal' };
  };

  const formatTipo = (tipo: string) => {
    return tipo
      .replace('bloque_de_', 'Bloque de ')
      .replace('cemento_bolsas', 'Cemento')
      .replace('arena_m3', 'Arena');
  };

  const formatAccion = (accion: string) => {
    const map: Record<string, string> = {
      'abastecimiento': 'Abastecimiento',
      'produccion': 'Producción',
      'produccion_uso': 'Uso en producción',
      'despacho': 'Despacho',
    };
    return map[accion] || accion;
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Cargando inventario...</div>;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-500">Control de materiales y producción</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowHistorial(true); cargarHistorial(); }}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-800 text-white px-5 py-3 rounded-2xl font-medium transition"
          >
            <History size={20} />
            Historial
          </button>
          <button
            onClick={() => setShowAbastecer(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-2xl font-medium transition"
          >
            <Plus size={20} />
            Abastecer
          </button>
          <button
            onClick={() => setShowProducir(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-2xl font-medium transition"
          >
            <Hammer size={20} />
            Producir
          </button>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {(inventario['bloque_de_4"'] < 100 || inventario['bloque_de_5"'] < 100 || inventario['bloque_de_6"'] < 100) && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800 text-sm">Stock bajo detectado</p>
            <p className="text-amber-700 text-sm mt-0.5">
              {[
                inventario['bloque_de_4"'] < 100 && `Bloque de 4": ${inventario['bloque_de_4"']} und`,
                inventario['bloque_de_5"'] < 100 && `Bloque de 5": ${inventario['bloque_de_5"']} und`,
                inventario['bloque_de_6"'] < 100 && `Bloque de 6": ${inventario['bloque_de_6"']} und`,
              ].filter(Boolean).join(' | ')}
            </p>
          </div>
        </div>
      )}

      {/* Tarjetas de Inventario */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Cemento */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-slate-500">Cemento</p>
              <p className="text-4xl font-bold text-slate-900 mt-2">{inventario.cemento_bolsas || 0}</p>
              <p className="text-slate-500">bolsas</p>
              {getStockStatus(inventario.cemento_bolsas || 0).label !== 'Normal' && (
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${getStockStatus(inventario.cemento_bolsas || 0).bg} ${getStockStatus(inventario.cemento_bolsas || 0).color}`}>
                  {getStockStatus(inventario.cemento_bolsas || 0).label}
                </span>
              )}
            </div>
            <div className="text-5xl">🛢️</div>
          </div>
        </div>

        {/* Arena */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <p className="text-sm text-slate-500">Arena</p>
              <p className="text-4xl font-bold text-slate-900 mt-2">{inventario.arena_m3 || 0}</p>
              <p className="text-slate-500">m³</p>
              {getStockStatus(inventario.arena_m3 || 0).label !== 'Normal' && (
                <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${getStockStatus(inventario.arena_m3 || 0).bg} ${getStockStatus(inventario.arena_m3 || 0).color}`}>
                  {getStockStatus(inventario.arena_m3 || 0).label}
                </span>
              )}
            </div>
            <div className="text-5xl">🏖️</div>
          </div>
        </div>

        {/* Bloques */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-sm text-slate-500 mb-4">Bloques en Stock</p>
          <div className="space-y-4">
            {['bloque_de_4"', 'bloque_de_5"', 'bloque_de_6"'].map((tipo) => {
              const cantidad = inventario[tipo] || 0;
              const status = getStockStatus(cantidad);
              return (
                <div key={tipo} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package size={16} className={status.color} />
                    <span className="text-sm text-slate-700">{formatTipo(tipo)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${status.color}`}>{cantidad.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">und</span>
                    {status.label !== 'Normal' && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Abastecer */}
      {showAbastecer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Abastecer Inventario</h3>
              <button onClick={() => setShowAbastecer(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={abastecer} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Cemento (bolsas)</label>
                <input name="cemento" type="number" min="0" step="0.1" defaultValue="50" className="w-full mt-1.5 border border-slate-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Arena (m³)</label>
                <input name="arena" type="number" min="0" step="0.01" defaultValue="10" className="w-full mt-1.5 border border-slate-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowAbastecer(false)} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition">Abastecer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Producir */}
      {showProducir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Producir Bloques</h3>
              <button onClick={() => setShowProducir(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={producir} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Tipo de Bloque</label>
                <select name="producto" className="w-full mt-1.5 border border-slate-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 bg-white">
                  <option value='bloque_de_4"'>Bloque de 4"</option>
                  <option value='bloque_de_5"'>Bloque de 5"</option>
                  <option value='bloque_de_6"'>Bloque de 6"</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Cantidad a Producir</label>
                <input name="cantidad" type="number" min="1" defaultValue="200" className="w-full mt-1.5 border border-slate-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-blue-500" />
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs text-blue-700">
                  💡 Se descontará automáticamente el cemento y arena necesarios según la configuración de producción.
                </p>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowProducir(false)} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition">Cancelar</button>
                <button type="submit" className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">Producir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {showHistorial && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <h3 className="text-2xl font-bold text-slate-900">Historial de Movimientos</h3>
              <button onClick={() => setShowHistorial(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-8 pb-8">
              {historial.length === 0 ? (
                <div className="text-center py-12 text-slate-400">No hay movimientos registrados</div>
              ) : (
                <div className="space-y-2">
                  {historial.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.accion === 'abastecimiento' ? 'bg-emerald-100 text-emerald-600' :
                          item.accion === 'produccion' ? 'bg-blue-100 text-blue-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          <Package size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 text-sm">{formatAccion(item.accion)}</p>
                          <p className="text-xs text-slate-500">{formatTipo(item.tipo)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{Number(item.cantidad).toFixed(2)}</p>
                        <p className="text-xs text-slate-400">
                          {new Date(item.fecha).toLocaleDateString('es-HN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}