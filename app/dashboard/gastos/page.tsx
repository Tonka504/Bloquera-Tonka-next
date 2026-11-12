'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Search, X, AlertCircle, Receipt, HandCoins } from 'lucide-react';
import { toast } from 'sonner';
import { getGastos, crearGastoAction, eliminarGastoAction } from '../../actions';
import RangoFechas from '../../components/RangoFechas';
import { rangoMesActual } from '../../../lib/dates';

import { Cargando } from '../../components/ui';
const CATEGORIAS = ['Materia Prima', 'Mano de Obra', 'Transporte', 'Servicios', 'Otro'];

export default function GastosPage() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [gastosFiltrados, setGastosFiltrados] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const { fechaDesde: desdeInicial, fechaHasta: hastaInicial } = rangoMesActual();
  const [fechaDesde, setFechaDesde] = useState(desdeInicial);
  const [fechaHasta, setFechaHasta] = useState(hastaInicial);
  const [showModal, setShowModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [gastoAEliminar, setGastoAEliminar] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const cargarGastos = async () => {
    setLoading(true);
    const result = await getGastos(fechaDesde, fechaHasta);
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
  }, [fechaDesde, fechaHasta]);

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
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-9">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <span className="icon-plate w-12 h-12 shrink-0">
            <HandCoins size={24} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-safety-deep uppercase tracking-[0.2em] mb-0.5">Operativo</p>
            <h1 className="font-display text-3xl sm:text-4xl text-ink leading-none">Gastos</h1>
          </div>
        </div>
        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[10px] text-muted uppercase tracking-wide">Total filtrado</p>
            <p className="font-display text-xl text-ink">L. {totalGastos.toLocaleString()}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center gap-2 px-5 py-2.5 text-sm tracking-wide"
          >
            <Plus size={16} />
            Nuevo Gasto
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 pointer-events-none -translate-y-1/2 text-faint-2" size={16} strokeWidth={1.6} />
          <input
            type="text"
            placeholder="Buscar gasto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="field w-full pl-9 py-2.5 text-sm"
          />
        </div>
        <select
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
          className="field py-2.5 text-sm"
        >
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <RangoFechas
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onFechaDesde={setFechaDesde}
          onFechaHasta={setFechaHasta}
        />
      </div>

      {/* Tabla */}
      <div className="panel">
        <div className="overflow-x-auto">
          <table className="table-industrial w-full">
            <thead>
              <tr className="border-b border-brand-line">
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Fecha</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Descripción</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Categoría</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Monto</th>
                <th className="px-5 py-3.5 text-center text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2 text-faint">
                      <Cargando texto="Cargando gastos..." /></div>
                  </td>
                </tr>
              ) : gastosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-faint">
                    <Receipt size={32} strokeWidth={1.4} className="mx-auto mb-3 text-faint-2" />
                    {busqueda || filtroCategoria ? 'No se encontraron gastos' : 'No hay gastos registrados'}
                  </td>
                </tr>
              ) : (
                gastosFiltrados.map((gasto: any) => (
                  <tr key={gasto.id} className="hover:bg-concrete-50 transition-colors">
                    <td className="px-5 py-4 text-muted text-sm">
                      {gasto.fecha ? new Date(gasto.fecha).toLocaleDateString('es-HN') : ''}
                    </td>
                    <td className="px-5 py-4 text-ink">{gasto.descripcion}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-muted uppercase tracking-wide">
                        {gasto.categoria}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-ink">
                      L. {Number(gasto.monto).toFixed(2)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <button
                        onClick={() => abrirModalEliminar(gasto)}
                        className="btn-icon btn-icon-danger p-1.5"
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

        <div className="px-5 py-3 border-t border-brand-line text-xs text-muted">
          Mostrando {gastosFiltrados.length} de {gastos.length} gastos
        </div>
      </div>

      {/* Modal Nuevo Gasto */}
      {showModal && (
        <div className="modal-backdrop fixed inset-0 bg-graphite/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md">
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <h3 className="font-display text-2xl text-ink">Nuevo Gasto</h3>
              <button onClick={() => setShowModal(false)} className="text-muted hover:text-ink transition-colors">
                <X size={20} strokeWidth={1.6} />
              </button>
            </div>
            <form onSubmit={crearGasto} className="px-8 pb-8 space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5">Descripción *</label>
                <input
                  name="descripcion"
                  required
                  className="field w-full py-2.5 text-base text-ink placeholder:text-faint-2"
                  placeholder="Ej: Compra de cemento, pago de luz, etc."
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5">Categoría</label>
                  <select name="categoria" className="field w-full py-2.5 text-base">
                    {CATEGORIAS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5">Monto (L.) *</label>
                  <input
                    name="monto"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="field w-full py-2.5 text-base text-ink"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1 py-3 text-sm">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success flex-1 py-3 text-sm tracking-wide">
                  Guardar Gasto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showEliminarModal && gastoAEliminar && (
        <div className="modal-backdrop fixed inset-0 bg-graphite/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-8 text-center">
            <div className="w-14 h-14 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={22} strokeWidth={1.6} className="text-alert-deep" />
            </div>
            <h3 className="font-display text-xl text-ink mb-2">¿Eliminar Gasto?</h3>
            <p className="text-muted text-sm mb-6">
              Vas a eliminar <span className="font-medium text-ink">{gastoAEliminar.descripcion}</span> por <span className="font-medium text-ink">L. {Number(gastoAEliminar.monto).toFixed(2)}</span>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowEliminarModal(false); setGastoAEliminar(null); }}
                className="btn btn-secondary flex-1 py-3 text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                className="btn btn-danger flex-1 py-3 text-sm tracking-wide"
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
