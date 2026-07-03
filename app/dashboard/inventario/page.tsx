'use client';

import { useEffect, useState } from 'react';
import { Plus, Hammer } from 'lucide-react';
import { toast } from 'sonner';
import { getInventario, abastecerInventarioAction, producirBloquesAction } from '../../actions';

export default function InventarioPage() {
  const [inventario, setInventario] = useState<any>({});
  const [showAbastecer, setShowAbastecer] = useState(false);
  const [showProducir, setShowProducir] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargarInventario = async () => {
    const result = await getInventario();
    if (result.success) {
      setInventario(result.data || {});
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarInventario();
  }, []);

  const abastecer = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const cemento = parseFloat((form.elements.namedItem('cemento') as HTMLInputElement).value) || 0;
    const arena = parseFloat((form.elements.namedItem('arena') as HTMLInputElement).value) || 0;

    const result = await abastecerInventarioAction(cemento, arena);

    if (result.success) {
      toast.success('Inventario actualizado');
      setShowAbastecer(false);
      cargarInventario();
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

    const result = await producirBloquesAction(producto, cantidad);

    if (result.success) {
      toast.success('Producción registrada');
      setShowProducir(false);
      cargarInventario();
      form.reset();
    } else {
      toast.error(result.message);
    }
  };

  if (loading) {
    return <div className="p-8">Cargando inventario...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventario</h1>
          <p className="text-slate-500">Control de materiales y producción</p>
        </div>
        <div className="flex gap-3">
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
            Producir Bloques
          </button>
        </div>
      </div>

      {/* Tarjetas de Inventario */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500">Cemento</p>
              <p className="text-4xl font-bold text-slate-900 mt-2">{inventario.cemento_bolsas || 0}</p>
              <p className="text-slate-500">bolsas</p>
            </div>
            <div className="text-5xl">🛢️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-slate-500">Arena</p>
              <p className="text-4xl font-bold text-slate-900 mt-2">{inventario.arena_m3 || 0}</p>
              <p className="text-slate-500">m³</p>
            </div>
            <div className="text-5xl">🏖️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border">
          <p className="text-sm text-slate-500 mb-4">Bloques en Stock</p>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Bloque de 4"</span>
              <span className="font-semibold">{inventario['bloque_de_4"'] || 0} und</span>
            </div>
            <div className="flex justify-between">
              <span>Bloque de 5"</span>
              <span className="font-semibold">{inventario['bloque_de_5"'] || 0} und</span>
            </div>
            <div className="flex justify-between">
              <span>Bloque de 6"</span>
              <span className="font-semibold">{inventario['bloque_de_6"'] || 0} und</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Abastecer */}
      {showAbastecer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">Abastecer Inventario</h3>
            <form onSubmit={abastecer} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Cemento (bolsas)</label>
                <input name="cemento" type="number" defaultValue="50" className="w-full mt-1 border rounded-2xl px-4 py-3" />
              </div>
              <div>
                <label className="text-sm font-medium">Arena (m³)</label>
                <input name="arena" type="number" defaultValue="10" className="w-full mt-1 border rounded-2xl px-4 py-3" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowAbastecer(false)} className="flex-1 py-3 rounded-2xl border">Cancelar</button>
                <button type="submit" className="flex-1 py-3 rounded-2xl bg-emerald-600 text-white">Abastecer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Producir */}
      {showProducir && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">Producir Bloques</h3>
            <form onSubmit={producir} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tipo de Bloque</label>
                <select name="producto" className="w-full mt-1 border rounded-2xl px-4 py-3">
                  <option value='bloque_de_4"'>Bloque de 4"</option>
                  <option value='bloque_de_5"'>Bloque de 5"</option>
                  <option value='bloque_de_6"'>Bloque de 6"</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Cantidad a Producir</label>
                <input name="cantidad" type="number" defaultValue="200" className="w-full mt-1 border rounded-2xl px-4 py-3" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setShowProducir(false)} className="flex-1 py-3 rounded-2xl border">Cancelar</button>
                <button type="submit" className="flex-1 py-3 rounded-2xl bg-blue-600 text-white">Producir</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}