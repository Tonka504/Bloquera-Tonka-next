'use client';

import { useState, useEffect } from 'react';
import {
  getInventario,
  getHistorialInventario,
  abastecerInventarioAction,
  producirBloquesAction,
} from '../../actions';
import { toast } from 'sonner';
import {
  Package,
  Truck,
  Factory,
  History,
  AlertTriangle,
  X,
  Droplets,
  Box,
} from 'lucide-react';

function formatTipo(tipo: string) {
  return tipo
    .replace('bloque_de_', 'Bloque de ')
    .replace('cemento_bolsas', 'Cemento')
    .replace('arena_m3', 'Arena');
}

function formatAccion(accion: string) {
  const map: Record<string, string> = {
    abastecimiento: 'Abastecimiento',
    produccion: 'Producción',
    produccion_uso: 'Uso en producción',
    venta: 'Venta',
  };
  return map[accion] || accion;
}

function getStockStatus(cantidad: number) {
  if (cantidad <= 0) return { label: 'Agotado', color: 'bg-red-100 text-red-700' };
  if (cantidad < 100) return { label: 'Bajo', color: 'bg-amber-100 text-amber-700' };
  return { label: 'Normal', color: 'bg-emerald-100 text-emerald-700' };
}

export default function InventarioPage() {
  const [inventario, setInventario] = useState<Record<string, number>>({});
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAbastecer, setShowAbastecer] = useState(false);
  const [showProducir, setShowProducir] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  const [cementoAbastecer, setCementoAbastecer] = useState('');
  const [arenaAbastecer, setArenaAbastecer] = useState('');

  const [productoProducir, setProductoProducir] = useState('bloque_de_4"');
  const [cantidadProducir, setCantidadProducir] = useState('');
  const [cementoGastado, setCementoGastado] = useState('');
  const [arenaGastada, setArenaGastada] = useState('');

  async function cargarDatos() {
    setLoading(true);

    const inv = await getInventario();
    if (inv.success) {
      setInventario(inv.data);
    }

    const hist = await getHistorialInventario();
    if (hist.success) {
      setHistorial(hist.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  async function handleAbastecer(e: React.FormEvent) {
    e.preventDefault();
    const cemento = parseFloat(cementoAbastecer) || 0;
    const arena = parseFloat(arenaAbastecer) || 0;

    if (cemento <= 0 && arena <= 0) {
      toast.error('Ingresa al menos una cantidad válida');
      return;
    }

    const res = await abastecerInventarioAction(cemento, arena);
    if (!res.success) {
      toast.error(res.message || 'Error al abastecer');
      return;
    }
    toast.success('Abastecimiento registrado');
    setCementoAbastecer('');
    setArenaAbastecer('');
    setShowAbastecer(false);
    cargarDatos();
  }

  async function handleProducir(e: React.FormEvent) {
    e.preventDefault();
    const cantidad = parseInt(cantidadProducir) || 0;
    const cemento = parseFloat(cementoGastado) || 0;
    const arena = parseFloat(arenaGastada) || 0;

    if (cantidad <= 0) {
      toast.error('La cantidad de bloques debe ser mayor a 0');
      return;
    }
    if (cemento <= 0) {
      toast.error('La cantidad de cemento gastado debe ser mayor a 0');
      return;
    }
    if (arena <= 0) {
      toast.error('La cantidad de arena gastada debe ser mayor a 0');
      return;
    }

    const res = await producirBloquesAction({
      producto: productoProducir,
      cantidad,
      cemento_gastado: cemento,
      arena_gastada: arena,
    });

    if (!res.success) {
      toast.error(res.message || 'Error en la producción');
      return;
    }
    toast.success('Producción registrada correctamente');
    setCantidadProducir('');
    setCementoGastado('');
    setArenaGastada('');
    setShowProducir(false);
    cargarDatos();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-500 mt-1">Control de materiales y producción</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowHistorial(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 transition"
          >
            <History className="w-4 h-4" />
            Historial
          </button>
          <button
            onClick={() => setShowAbastecer(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            <Truck className="w-4 h-4" />
            Abastecer
          </button>
          <button
            onClick={() => setShowProducir(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
          >
            <Factory className="w-4 h-4" />
            Producir
          </button>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {(inventario['bloque_de_4"'] < 100 || inventario['bloque_de_5"'] < 100 || inventario['bloque_de_6"'] < 100) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-800">Stock bajo detectado</h3>
            <p className="text-amber-700 text-sm mt-1">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Cemento */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Cemento</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {inventario.cemento_bolsas || 0}
                <span className="text-sm font-normal text-slate-500 ml-1">bolsas</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <Droplets className="w-6 h-6 text-slate-600" />
            </div>
          </div>
          {getStockStatus(inventario.cemento_bolsas || 0).label !== 'Normal' && (
            <span className={`inline-block mt-3 text-xs font-medium px-2.5 py-1 rounded-lg ${getStockStatus(inventario.cemento_bolsas || 0).color}`}>
              {getStockStatus(inventario.cemento_bolsas || 0).label}
            </span>
          )}
        </div>

        {/* Arena */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Arena</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {(inventario.arena_m3 || 0).toFixed(2)}
                <span className="text-sm font-normal text-slate-500 ml-1">m³</span>
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Box className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          {getStockStatus(inventario.arena_m3 || 0).label !== 'Normal' && (
            <span className={`inline-block mt-3 text-xs font-medium px-2.5 py-1 rounded-lg ${getStockStatus(inventario.arena_m3 || 0).color}`}>
              {getStockStatus(inventario.arena_m3 || 0).label}
            </span>
          )}
        </div>

        {/* Bloques */}
        {['bloque_de_4"', 'bloque_de_5"', 'bloque_de_6"'].map((tipo) => {
          const cantidad = inventario[tipo] || 0;
          const status = getStockStatus(cantidad);
          return (
            <div key={tipo} className="bg-white rounded-2xl border border-slate-200 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">{formatTipo(tipo)}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">
                    {cantidad.toLocaleString()}
                    <span className="text-sm font-normal text-slate-500 ml-1">und</span>
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              {status.label !== 'Normal' && (
                <span className={`inline-block mt-3 text-xs font-medium px-2.5 py-1 rounded-lg ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Abastecer */}
      {showAbastecer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Abastecer Inventario</h2>
              <button onClick={() => setShowAbastecer(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAbastecer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cemento (bolsas)</label>
                <input
                  type="number"
                  value={cementoAbastecer}
                  onChange={(e) => setCementoAbastecer(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Arena (m³)</label>
                <input
                  type="number"
                  value={arenaAbastecer}
                  onChange={(e) => setArenaAbastecer(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded-xl py-3 font-medium hover:bg-blue-700 transition"
              >
                Registrar Abastecimiento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Producir - MANUAL */}
      {showProducir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Registrar Producción</h2>
              <button onClick={() => setShowProducir(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleProducir} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Bloque</label>
                <select
                  value={productoProducir}
                  onChange={(e) => setProductoProducir(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition bg-white"
                >
                  <option value='bloque_de_4"'>Bloque de 4&quot;</option>
                  <option value='bloque_de_5"'>Bloque de 5&quot;</option>
                  <option value='bloque_de_6"'>Bloque de 6&quot;</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Cantidad de Bloques Producidos
                </label>
                <input
                  type="number"
                  value={cantidadProducir}
                  onChange={(e) => setCantidadProducir(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                  placeholder="Ej: 500"
                  min="1"
                  step="1"
                  required
                />
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Materiales Gastados (Ingreso Manual)</p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Cemento (bolsas)
                    </label>
                    <input
                      type="number"
                      value={cementoGastado}
                      onChange={(e) => setCementoGastado(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                      placeholder="Ej: 14"
                      min="0.01"
                      step="0.01"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Stock actual: {inventario.cemento_bolsas || 0} bolsas
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Arena (m³)
                    </label>
                    <input
                      type="number"
                      value={arenaGastada}
                      onChange={(e) => setArenaGastada(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition"
                      placeholder="Ej: 2.5"
                      min="0.01"
                      step="0.01"
                      required
                    />
                    <p className="text-xs text-slate-400 mt-1">
                      Stock actual: {(inventario.arena_m3 || 0).toFixed(2)} m³
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-sm text-blue-700">
                <p className="font-medium">💡 Ingreso manual</p>
                <p className="mt-1">
                  Ingresa la cantidad real de cemento y arena que gastaste en esta producción. El sistema validará que haya suficiente stock disponible.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 text-white rounded-xl py-3 font-medium hover:bg-emerald-700 transition"
              >
                Registrar Producción
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {showHistorial && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Historial de Movimientos</h2>
              <button onClick={() => setShowHistorial(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto p-6">
              {historial.length === 0 ? (
                <div className="text-center text-slate-500 py-8">
                  <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>No hay movimientos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historial.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          item.accion === 'abastecimiento' ? 'bg-blue-100 text-blue-600' :
                          item.accion === 'produccion' ? 'bg-emerald-100 text-emerald-600' :
                          item.accion === 'produccion_uso' ? 'bg-amber-100 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{formatAccion(item.accion)}</p>
                          <p className="text-sm text-slate-500">{formatTipo(item.tipo)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">
                          {item.accion === 'produccion_uso' ? '-' : '+'}
                          {Number(item.cantidad).toFixed(2)}
                        </p>
                        <p className="text-sm text-slate-500">
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