'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, X, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getGastos, crearGastoAction, eliminarGastoAction } from '../../actions';

const CATEGORIAS = ['Materia Prima', 'Mano de Obra', 'Transporte', 'Servicios', 'Otro'];

export default function GastosPage() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [gastosFiltrados, setGastosFiltrados] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [gastoAEliminar, setGastoAEliminar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cargarGastos = async () => {
    setLoading(true);
    const result = await getGastos();
    if (result.success) {
      setGastos(result.data || []);
      setGastosFiltrados(result.data || []);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarGastos();
  }, []);

  // Filtrar localmente
  useEffect(() => {
    let filtrados = gastos;

    if (busqueda.trim()) {
      const filtro = busqueda.toLowerCase();
      filtrados = filtrados.filter(g => 
        g.descripcion?.toLowerCase().includes(filtro) ||
        g.categoria?.toLowerCase().includes(filtro)
      );
    }

    if (filtroCategoria) {
      filtrados = filtrados.filter(g => g.categoria === filtroCategoria);
    }

    setGastosFiltrados(filtrados);
  }, [busqueda, filtroCategoria, gastos]);

  const crearGasto = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;

    const descripcion = (form.elements.namedItem('descripcion') as HTMLInputElement).value.trim();
    const categoria = (form.elements.namedItem('categoria') as HTMLSelectElement).value;
    const monto = parseFloat((form.elements.namedItem('monto') as HTMLInputElement).value);

    if (!descripcion) {
      toast.error('La descripción es obligatoria');
      return;
    }
    if (monto <= 0) {
      toast.error('El monto debe ser mayor a 0');
      return;
    }

    const nuevoGasto = {
      fecha: new Date().toISOString().split('T')[0],
      descripcion,
      categoria,
      monto
    };

    const result = await crearGastoAction(nuevoGasto);

    if (result.success) {
      toast.success('Gasto registrado correctamente');
      setShowModal(false);
      cargarGastos();
      form.reset();
    } else {
      toast.error(result.message);
    }
  };

  const abrirModalEliminar = (gasto: any) => {
    setGastoAEliminar(gasto);
    setShowEliminarModal(true);
  };

  const confirmarEliminar = async () => {
    if (!gastoAEliminar) return;

    const result = await eliminarGastoAction(gastoAEliminar.id);
    if (result.success) {
      toast.success('Gasto eliminado');
      setShowEliminarModal(false);
      setGastoAEliminar(null);
      cargarGastos();
    } else {
      toast.error(result.message);
    }
  };

  const getCategoriaColor = (categoria: string) => {
    const map: Record<string, string> = {
      'Materia Prima': 'bg-purple-100 text-purple-700',
      'Mano de Obra': 'bg-orange-100 text-orange-700',
      'Transporte': 'bg-cyan-100 text-cyan-700',
      'Servicios': 'bg-pink-100 text-pink-700',
      'Otro': 'bg-slate-100 text-slate-600',
    };
    return map[categoria] || 'bg-slate-100 text-slate-600';
  };

  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + Number(g.monto), 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Gastos</h1>
          <p className="text-slate-500">Registro de gastos operativos</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-slate-500">Total filtrado</p>
            <p className="text-xl font-bold text-slate-900">L. {totalGastos.toLocaleString()}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-medium transition"
          >
            <Plus size={20} />
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar gasto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-sm bg-white"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Descripción</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Categoría</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Monto</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">Cargando...</td></tr>
              ) : gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400">
                    {busqueda || filtroCategoria ? 'No se encontraron gastos' : 'No hay gastos registrados'}
                  </td>
                </tr>
              ) : (
                gastosFiltrados.map((gasto: any) => (
                  <tr key={gasto.id} className="border-t hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-slate-600 text-sm">{gasto.fecha}</td>
                    <td className="px-6 py-4 text-slate-700">{gasto.descripcion}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${getCategoriaColor(gasto.categoria)}`}>
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      L. {Number(gasto.monto).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => abrirModalEliminar(gasto)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition"
                        title="Eliminar"
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

        <div className="px-6 py-3 bg-slate-50 border-t text-xs text-slate-500">
          Mostrando {gastosFiltrados.length} de {gastos.length} gastos
        </div>
      </div>

      {/* Modal Nuevo Gasto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <h3 className="text-2xl font-bold text-slate-900">Nuevo Gasto</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={crearGasto} className="px-8 pb-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Descripción *</label>
                <input 
                  name="descripcion" 
                  required 
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition" 
                  placeholder="Ej: Compra de cemento, pago de luz, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
                  <select name="categoria" className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base focus:outline-none focus:border-blue-500 bg-white">
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Monto (L.) *</label>
                  <input 
                    name="monto" 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    required 
                    className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-base text-slate-900 focus:outline-none focus:border-blue-500 transition" 
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition">
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showEliminarModal && gastoAEliminar && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={28} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Gasto?</h3>
            <p className="text-slate-500 mb-6">
              Vas a eliminar <span className="font-semibold text-slate-700">{gastoAEliminar.descripcion}</span> por <span className="font-semibold text-slate-700">L. {Number(gastoAEliminar.monto).toFixed(2)}</span>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => { setShowEliminarModal(false); setGastoAEliminar(null); }} 
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