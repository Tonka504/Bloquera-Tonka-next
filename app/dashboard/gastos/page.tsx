'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, X, AlertCircle, Loader2, Receipt } from 'lucide-react';
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

  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + Number(g.monto), 0);

  return (
    <div className="px-10 py-9">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <p className="text-xs text-[#8a8175] uppercase tracking-[0.15em] mb-1">Operativo</p>
          <h1 className="font-display text-3xl text-[#201c17]">Gastos</h1>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[10px] text-[#8a8175] uppercase tracking-wide">Total filtrado</p>
            <p className="font-display text-xl text-[#201c17]">L. {totalGastos.toLocaleString()}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-primary hover:bg-brand-ink-soft text-white px-5 py-2.5 transition-colors text-sm tracking-wide"
          >
            <Plus size={16} />
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-[#c2b8a1]" size={16} strokeWidth={1.6} />
          <input
            type="text"
            placeholder="Buscar gasto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-6 pr-4 py-2.5 border-0 border-b border-brand-line bg-transparent focus:outline-none focus:border-brand-accent text-sm transition-colors"
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="px-4 py-2.5 border border-brand-line focus:outline-none focus:border-brand-accent text-sm bg-white transition-colors"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div className="border border-brand-line">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-line">
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Fecha</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Descripción</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Categoría</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Monto</th>
                <th className="px-5 py-3.5 text-center text-[11px] font-medium text-[#8a8175] uppercase tracking-[0.1em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2 text-[#a39a8c]">
                      <Loader2 className="animate-spin" size={18} /> Cargando gastos...
                    </div>
                  </td>
                </tr>
              ) : gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-[#a39a8c]">
                    <Receipt size={32} strokeWidth={1.4} className="mx-auto mb-3 text-[#d9d2c3]" />
                    {busqueda || filtroCategoria ? 'No se encontraron gastos' : 'No hay gastos registrados'}
                  </td>
                </tr>
              ) : (
                gastosFiltrados.map((gasto: any) => (
                  <tr key={gasto.id} className="hover:bg-[#faf8f4] transition-colors">
                    <td className="px-5 py-4 text-[#8a8175] text-sm">
                      {gasto.fecha ? new Date(gasto.fecha).toLocaleDateString('es-HN') : ''}
                    </td>
                    <td className="px-5 py-4 text-[#201c17]">{gasto.descripcion}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-[#8a8175] uppercase tracking-wide">
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-[#201c17]">
                      L. {Number(gasto.monto).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => abrirModalEliminar(gasto)}
                        className="p-1.5 text-[#8a8175] hover:text-red-800 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={16} strokeWidth={1.6} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-brand-line text-xs text-[#8a8175]">
          Mostrando {gastosFiltrados.length} de {gastos.length} gastos
        </div>
      </div>

      {/* Modal Nuevo Gasto */}
      {showModal && (
        <div className="fixed inset-0 bg-[#15130f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <h3 className="font-display text-2xl text-[#201c17]">Nuevo Gasto</h3>
              <button onClick={() => setShowModal(false)} className="text-[#8a8175] hover:text-[#201c17] transition-colors">
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>
            <form onSubmit={crearGasto} className="px-8 pb-8 space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Descripción *</label>
                <input
                  name="descripcion"
                  required
                  className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] placeholder:text-[#c2b8a1] focus:outline-none focus:border-brand-accent transition-colors"
                  placeholder="Ej: Compra de cemento, pago de luz, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Categoría</label>
                  <select name="categoria" className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base focus:outline-none focus:border-brand-accent bg-white transition-colors">
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em] mb-1.5">Monto (L.) *</label>
                  <input
                    name="monto"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full border-0 border-b border-brand-line px-0 py-2.5 text-base text-[#201c17] focus:outline-none focus:border-brand-accent transition-colors"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 border border-brand-line text-[#4a463e] text-sm hover:bg-[#faf8f4] transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3 bg-brand-primary hover:bg-brand-ink-soft text-white text-sm tracking-wide transition-colors">
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showEliminarModal && gastoAEliminar && (
        <div className="fixed inset-0 bg-[#15130f]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-8 text-center">
            <div className="w-14 h-14 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} strokeWidth={1.6} className="text-red-800" />
            </div>
            <h3 className="font-display text-xl text-[#201c17] mb-2">¿Eliminar Gasto?</h3>
            <p className="text-[#8a8175] text-sm mb-6">
              Vas a eliminar <span className="font-medium text-[#201c17]">{gastoAEliminar.descripcion}</span> por <span className="font-medium text-[#201c17]">L. {Number(gastoAEliminar.monto).toFixed(2)}</span>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowEliminarModal(false); setGastoAEliminar(null); }}
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
