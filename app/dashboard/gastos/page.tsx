'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getGastos, crearGastoAction, eliminarGastoAction } from '../../actions';

export default function GastosPage() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const cargarGastos = async () => {
    const result = await getGastos();
    if (result.success) {
      setGastos(result.data || []);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarGastos();
  }, []);

  const crearGasto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const nuevoGasto = {
      fecha: new Date().toISOString().split('T')[0],
      descripcion: (form.elements.namedItem('descripcion') as HTMLInputElement).value,
      categoria: (form.elements.namedItem('categoria') as HTMLSelectElement).value,
      monto: parseFloat((form.elements.namedItem('monto') as HTMLInputElement).value)
    };

    const result = await crearGastoAction(nuevoGasto);

    if (result.success) {
      toast.success('Gasto registrado');
      setShowModal(false);
      cargarGastos();
      form.reset();
    } else {
      toast.error(result.message);
    }
  };

  const eliminarGasto = async (id: number) => {
    if (!confirm('¿Eliminar este gasto?')) return;

    const result = await eliminarGastoAction(id);

    if (result.success) {
      toast.success('Gasto eliminado');
      cargarGastos();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gastos</h1>
          <p className="text-slate-500">Registro de gastos operativos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition"
        >
          <Plus size={20} />
          Nuevo Gasto
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">Fecha</th>
              <th className="px-6 py-4 text-left">Descripción</th>
              <th className="px-6 py-4 text-left">Categoría</th>
              <th className="px-6 py-4 text-right">Monto</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400">
                  No hay gastos registrados
                </td>
              </tr>
            ) : (
              gastos.map((gasto: any) => (
                <tr key={gasto.id} className="border-t hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600">{gasto.fecha}</td>
                  <td className="px-6 py-4">{gasto.descripcion}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 text-xs rounded-full bg-slate-100 text-slate-600">
                      {gasto.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">L. {gasto.monto}</td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => eliminarGasto(gasto.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Nuevo Gasto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md">
            <h3 className="text-xl font-bold mb-6">Nuevo Gasto</h3>
            <form onSubmit={crearGasto} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <input name="descripcion" required className="w-full mt-1 border rounded-2xl px-4 py-3" placeholder="Descripción del gasto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Categoría</label>
                  <select name="categoria" className="w-full mt-1 border rounded-2xl px-4 py-3">
                    <option>Materia Prima</option>
                    <option>Mano de Obra</option>
                    <option>Transporte</option>
                    <option>Servicios</option>
                    <option>Otro</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Monto (L.)</label>
                  <input name="monto" type="number" required className="w-full mt-1 border rounded-2xl px-4 py-3" defaultValue="1000" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-2xl border">Cancelar</button>
                <button type="submit" className="flex-1 py-3 rounded-2xl bg-blue-600 text-white">Guardar Gasto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}