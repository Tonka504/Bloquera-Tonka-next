'use client';

import { useEffect, useState } from 'react';
import { Download, Search, Filter, X, ChevronLeft, ChevronRight, FileText, ReceiptText, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getFacturasFiltradas, actualizarEstadoFactura } from '../../actions';
import { generateInvoicePDF } from '../../../lib/generateInvoicePDF';
import { compartirPorWhatsApp } from '../../../lib/compartirWhatsApp';
import RangoFechas from '../../components/RangoFechas';
import { rangoMesActual } from '../../../lib/dates';

import { Cargando } from '../../components/ui';
export default function FacturasPage() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [facturasFiltradas, setFacturasFiltradas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const { fechaDesde: desdeInicial, fechaHasta: hastaInicial } = rangoMesActual();
  const [fechaDesde, setFechaDesde] = useState(desdeInicial);
  const [fechaHasta, setFechaHasta] = useState(hastaInicial);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = 10;

  const buscarFacturas = async (filtros: { cliente?: string; estado?: string; fechaDesde?: string; fechaHasta?: string }) => {
    setLoading(true);
    setPaginaActual(1);

    const result = await getFacturasFiltradas(filtros);
    if (result.success) {
      setFacturas(result.data || []);
      setFacturasFiltradas(result.data || []);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const aplicarFiltros = () => {
    buscarFacturas({
      cliente: busqueda.trim() || undefined,
      estado: filtroEstado || undefined,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
    });
  };

  useEffect(() => {
    aplicarFiltros();
  }, [fechaDesde, fechaHasta]);

  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroEstado('');
    setFechaDesde(desdeInicial);
    setFechaHasta(hastaInicial);
    buscarFacturas({ fechaDesde: desdeInicial, fechaHasta: hastaInicial });
  };

  const descargarPDF = (factura: any) => {
    generateInvoicePDF(factura);
    toast.success(`Factura #${factura.num_factura} descargada`);
  };

  const enviarWhatsApp = async (factura: any) => {
    const r = await compartirPorWhatsApp(factura);
    if (r === 'descargado') toast.success('PDF descargado: adjúntalo en el chat de WhatsApp que se abrió');
    else if (r === 'compartido') toast.success('Enviado a WhatsApp');
  };

  const cambiarEstado = async (numFactura: number, nuevoEstado: string) => {
    const result = await actualizarEstadoFactura(numFactura, nuevoEstado);
    if (result.success) {
      toast.success('Estado actualizado');
      aplicarFiltros();
    } else {
      toast.error(result.message);
    }
  };

  const totalPaginas = Math.ceil(facturasFiltradas.length / itemsPorPagina);
  const inicio = (paginaActual - 1) * itemsPorPagina;
  const facturasPagina = facturasFiltradas.slice(inicio, inicio + itemsPorPagina);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'Pagado': return 'badge-ok';
      case 'Con Anticipo': return 'badge-progress';
      case 'Pendiente': return 'badge-pending';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-9">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <span className="icon-plate w-12 h-12 shrink-0">
            <ReceiptText size={24} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-safety-deep uppercase tracking-[0.2em] mb-0.5">Historial</p>
            <h1 className="font-display text-3xl sm:text-4xl text-ink leading-none">Facturas</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted uppercase tracking-wide">
          <FileText size={14} strokeWidth={1.6} />
          {facturas.length} facturas totales
        </div>
      </div>

      {/* Barra de búsqueda, rango de fechas y filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 pointer-events-none -translate-y-1/2 text-faint-2" size={16} strokeWidth={1.6} />
          <input
            type="text"
            placeholder="Buscar por cliente, producto o número..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
            className="field w-full pl-9 py-2.5 text-sm"
          />
        </div>
        <RangoFechas
          fechaDesde={fechaDesde}
          fechaHasta={fechaHasta}
          onFechaDesde={setFechaDesde}
          onFechaHasta={setFechaHasta}
        />
        <button
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className={`flex items-center gap-2 px-5 py-2.5 text-sm rounded-[5px] transition-all border ${
            mostrarFiltros ? 'steel-surface text-white border-graphite shadow-[inset_0_-3px_0_var(--safety)]' : 'bg-surface border-[#b9b8b1] text-ink-soft hover:border-concrete-dark shadow-[0_1px_2px_rgba(23,27,29,.1)]'
          }`}
        >
          <Filter size={15} strokeWidth={1.6} />
          Filtros
        </button>
        <button
          onClick={aplicarFiltros}
          className="btn btn-primary px-5 py-2.5 text-sm"
        >
          Buscar
        </button>
      </div>

      {/* Panel de filtros avanzados */}
      {mostrarFiltros && (
        <div className="panel p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5">Estado</label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="field w-full py-2.5 text-sm"
              >
                <option value="">Todos</option>
                <option value="Pagado">Pagado</option>
                <option value="Con Anticipo">Con Anticipo</option>
                <option value="Pendiente">Pendiente</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-2 text-xs text-muted hover:text-ink transition-colors uppercase tracking-wide"
            >
              <X size={13} />
              Limpiar filtros
            </button>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="panel">
        <div className="overflow-x-auto">
          <table className="table-industrial w-full">
            <thead>
              <tr className="border-b border-brand-line">
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted uppercase tracking-[0.1em]">N° Factura</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Fecha</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Cliente</th>
                <th className="px-5 py-3.5 text-left text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Producto</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Total</th>
                <th className="px-5 py-3.5 text-right text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Saldo</th>
                <th className="px-5 py-3.5 text-center text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Estado</th>
                <th className="px-5 py-3.5 text-center text-[11px] font-medium text-muted uppercase tracking-[0.1em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-line">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-16">
                    <div className="flex items-center justify-center gap-2 text-faint">
                      <Cargando texto="Cargando facturas..." /></div>
                  </td>
                </tr>
              ) : facturasPagina.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-faint">
                    <FileText size={32} strokeWidth={1.4} className="mx-auto mb-3 text-faint-2" />
                    No hay facturas registradas
                  </td>
                </tr>
              ) : (
                facturasPagina.map((f: any) => (
                  <tr key={f.num_factura} className="hover:bg-concrete-50 transition-colors">
                    <td className="px-5 py-4 text-ink">#{f.num_factura}</td>
                    <td className="px-5 py-4 text-muted text-sm">
                      {f.fecha_despacho ? new Date(f.fecha_despacho).toLocaleDateString('es-HN') : ''}
                    </td>
                    <td className="px-5 py-4 text-ink">
                      <div>
                        <p>{f.cliente}</p>
                        {f.rtn && <p className="text-xs text-muted mt-0.5">RTN: {f.rtn}</p>}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-ink-soft text-sm">{f.producto}</td>
                    <td className="px-5 py-4 text-right font-medium text-ink">
                      L. {Number(f.total_venta).toFixed(2)}
                      {Number(f.descuento_monto) > 0 && (
                        <p className="text-[11px] font-normal text-safety-deep mt-0.5">−L. {Number(f.descuento_monto).toFixed(2)} desc.</p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {Number(f.saldo_pendiente) > 0 ? (
                        <span className="text-safety-deep font-medium">L. {Number(f.saldo_pendiente).toFixed(2)}</span>
                      ) : (
                        <span className="text-ok-deep text-sm">Pagado</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <select
                        value={f.estado}
                        onChange={(e) => cambiarEstado(f.num_factura, e.target.value)}
                        className={`badge cursor-pointer focus:outline-none ${getEstadoColor(f.estado)}`}
                      >
                        <option value="Pagado">Pagado</option>
                        <option value="Con Anticipo">Con Anticipo</option>
                        <option value="Pendiente">Pendiente</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => descargarPDF(f)}
                        className="btn-icon p-1.5"
                        title="Descargar PDF"
                      >
                        <Download size={16} strokeWidth={1.6} />
                      </button>
                      <button
                        onClick={() => enviarWhatsApp(f)}
                        className="btn-icon p-1.5 ml-1 text-ok-deep"
                        title="Enviar por WhatsApp"
                      >
                        <MessageCircle size={16} strokeWidth={1.6} />
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
          <div className="flex items-center justify-between px-5 py-3 border-t border-brand-line">
            <p className="text-xs text-muted">
              Mostrando {inicio + 1} - {Math.min(inicio + itemsPorPagina, facturasFiltradas.length)} de {facturasFiltradas.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="btn-icon p-1.5"
              >
                <ChevronLeft size={16} strokeWidth={1.6} />
              </button>
              <span className="text-xs text-ink-soft px-3">
                {paginaActual} / {totalPaginas}
              </span>
              <button
                onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                disabled={paginaActual === totalPaginas}
                className="btn-icon p-1.5"
              >
                <ChevronRight size={16} strokeWidth={1.6} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
