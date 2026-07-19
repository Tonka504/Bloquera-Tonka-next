'use client';

import { useEffect, useState } from 'react';
import { Download, Search, Filter, X, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { getFacturas, getFacturasFiltradas, actualizarEstadoFactura } from '../../actions';
import { generateInvoicePDF } from '../../../lib/generateInvoicePDF';

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [facturasFiltradas, setFacturasFiltradas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const cargarFacturas = async () => {
    setLoading(true);
    const result = await getFacturas();
    if (result.success) {
      setFacturas(result.data || []);
      setFacturasFiltradas(result.data || []);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarFacturas();
  }, []);

  // Aplicar filtros
  const aplicarFiltros = async () => {
    setLoading(true);
    setPaginaActual(1);

    const filtros: any = {};
    if (busqueda.trim()) filtros.cliente = busqueda.trim();
    if (filtroEstado) filtros.estado = filtroEstado;
    if (fechaDesde) filtros.fechaDesde = fechaDesde;
    if (fechaHasta) filtros.fechaHasta = fechaHasta;

    // Si no hay filtros especiales, filtrar localmente
    if (Object.keys(filtros).length === 0 && !busqueda.trim()) {
      setFacturasFiltradas(facturas);
      setLoading(false);
      return;
    }

    // Si hay filtros de fecha o estado, usar server action
    if (filtros.fechaDesde || filtros.fechaHasta || filtros.estado) {
      const result = await getFacturasFiltradas(filtros);
      if (result.success) {
        setFacturasFiltradas(result.data || []);
      }
    } else {
      // Filtro solo por cliente (local)
      const filtro = busqueda.toLowerCase();
      setFacturasFiltradas(
        facturas.filter(f => 
          f.cliente?.toLowerCase().includes(filtro) ||
          String(f.num_factura).includes(filtro) ||
          f.producto?.toLowerCase().includes(filtro)
        )
      );
    }
    setLoading(false);
  };

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('');
    setFechaDesde('');
    setFechaHasta('');
    setFacturasFiltradas(facturas);
    setPaginaActual(1);
  };

  const descargarPDF = (factura: any) => {
    generateInvoicePDF(factura);
    toast.success(`Factura #${factura.num_factura} descargada`);
  };

  const cambiarEstado = async (numFactura: number, nuevoEstado: string) => {
    const result = await actualizarEstadoFactura(numFactura, nuevoEstado);
    if (result.success) {
      toast.success('Estado actualizado');
      cargarFacturas();
    } else {
      toast.error(result.message);
    }
  };

  // Paginación
  const totalPaginas = Math.ceil(facturasFiltradas.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const facturasPagina = facturasFiltradas.slice(inicio, inicio + itemsPorPagina);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pagado': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Con Anticipo': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pendiente': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Facturas</h1>
          <p className="text-slate-500">Historial de facturas generadas</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FileText size={16} />
          {facturas.length} facturas totales
        </div>
      </div>

      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por cliente, producto o número..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
            className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 text-sm"
          />
        </div>
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium text-sm transition ${
            mostrarFiltros ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Filter size={18} />
          Filtros
        </button>
        <button
          onClick={aplicarFiltros}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium text-sm transition"
        >
          Buscar
        </button>
      </div>

      {/* Panel de filtros avanzados */}
      {mostrarFiltros && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="">Todos</option>
                <option value="Pagado">Pagado</option>
                <option value="Con Anticipo">Con Anticipo</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Desde</label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Hasta</label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition"
            >
              <X size={14} />
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">N° Factura</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Saldo</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-slate-400">Cargando facturas...</td></tr>
              ) : facturasPagina.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <FileText size={48} className="mx-auto mb-3 text-slate-300" />
                    No hay facturas registradas
                  </td>
                </tr>
              ) : (
                facturasPagina.map((f: any) => (
                  <tr key={f.num_factura} className="border-t hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-900">#{f.num_factura}</td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{f.fecha_despacho}</td>
                    <td className="px-6 py-4 text-slate-700">
                      <div>
                        <p className="font-medium">{f.cliente}</p>
                        {f.rtn && <p className="text-xs text-slate-400">RTN: {f.rtn}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-sm">{f.producto}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-900">
                      L. {Number(f.total_venta).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {Number(f.saldo_pendiente) > 0 ? (
                        <span className="text-red-600 font-medium">L. {Number(f.saldo_pendiente).toFixed(2)}</span>
                      ) : (
                        <span className="text-emerald-600 font-medium text-sm">Pagado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <select
                        value={f.estado}
                        onChange={(e) => cambiarEstado(f.num_factura, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer focus:outline-none ${getEstadoColor(f.estado)}`}
                      >
                        <option value="Pagado">Pagado</option>
                        <option value="Con Anticipo">Con Anticipo</option>
                        <option value="Pendiente">Pendiente</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => descargarPDF(f)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                        title="Descargar PDF"
                      >
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t">
            <p className="text-sm text-slate-500">
              Mostrando {inicio + 1} - {Math.min(inicio + itemsPorPagina, facturasFiltradas.length)} de {facturasFiltradas.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="p-2 rounded-xl border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-slate-700 px-3">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="p-2 rounded-xl border border-slate-200 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}