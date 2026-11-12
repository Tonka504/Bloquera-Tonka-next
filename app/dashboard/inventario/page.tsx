'use client';

import { useState, useEffect } from 'react';
import {
  getInventario,
  getHistorialInventario,
  abastecerInventarioAction,
  producirBloquesAction,
} from '../../actions';
import { toast } from 'sonner';
import RangoFechas from '../../components/RangoFechas';
import { rangoMesActual } from '../../../lib/dates';
import { Truck, Factory, History, AlertTriangle, X, Warehouse, Shovel } from 'lucide-react';

import { Cargando, IconoBloque, IconoCemento } from '../../components/ui';
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
  if (cantidad <= 0) return { label: 'Agotado', color: 'text-alert-deep' };
  if (cantidad < 100) return { label: 'Bajo', color: 'text-safety-deep' };
  return { label: 'Normal', color: 'text-ok-deep' };
}

export default function InventarioPage() {
  const [inventario, setInventario] = useState<Record<string, number>>({});
  const [historial, setHistorial] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAbastecer, setShowAbastecer] = useState(false);
  const [showProducir, setShowProducir] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  const { fechaDesde: desdeInicial, fechaHasta: hastaInicial } = rangoMesActual();
  const [fechaDesde, setFechaDesde] = useState(desdeInicial);
  const [fechaHasta, setFechaHasta] = useState(hastaInicial);

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

    const hist = await getHistorialInventario(fechaDesde, fechaHasta);
    if (hist.success) {
      setHistorial(hist.data);
    }

    setLoading(false);
  }

  useEffect(() => {
    cargarDatos();
  }, [fechaDesde, fechaHasta]);

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
      <div className="flex items-center justify-center gap-3 h-96 text-muted">
        <Cargando texto="Cargando inventario..." /></div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-9 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="icon-plate w-12 h-12 shrink-0">
            <Warehouse size={24} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-safety-deep uppercase tracking-[0.2em] mb-0.5">Materiales</p>
            <h1 className="font-display text-3xl sm:text-4xl text-ink leading-none">Inventario</h1>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowHistorial(true)}
            className="btn btn-secondary flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 text-sm"
          >
            <History className="w-4 h-4" strokeWidth={1.6} />
            Historial
          </button>
          <button
            onClick={() => setShowAbastecer(true)}
            className="btn btn-secondary flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 text-sm"
          >
            <Truck className="w-4 h-4" strokeWidth={1.6} />
            Abastecer
          </button>
          <button
            onClick={() => setShowProducir(true)}
            className="btn btn-primary flex flex-1 sm:flex-none items-center justify-center gap-2 px-4 py-2.5 text-sm"
          >
            <Factory className="w-4 h-4" strokeWidth={1.6} />
            Producir
          </button>
        </div>
      </div>

      {/* Alertas de stock bajo */}
      {(inventario['bloque_de_4"'] < 100 || inventario['bloque_de_5"'] < 100 || inventario['bloque_de_6"'] < 100) && (
        <div className="panel overflow-hidden border-l-0 p-4 pl-6 flex items-start gap-3 before:absolute before:inset-y-0 before:left-0 before:w-2 before:bg-[image:var(--tx-hazard)]">
          <AlertTriangle className="w-5 h-5 text-safety-deep mt-0.5 flex-shrink-0" strokeWidth={1.6} />
          <div>
            <h3 className="font-medium text-ink text-sm">Stock bajo detectado</h3>
            <p className="text-muted text-sm mt-1">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 kpi-grid">
        {/* Cemento */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted uppercase tracking-[0.1em]">Cemento</p>
            <span className="icon-plate w-8 h-8"><IconoCemento size={16} /></span>
          </div>
          <p className="font-display text-3xl text-ink tabular-nums">
            {inventario.cemento_bolsas || 0}
            <span className="text-sm font-sans font-normal normal-case tracking-normal text-muted ml-1">bolsas</span>
          </p>
          {getStockStatus(inventario.cemento_bolsas || 0).label !== 'Normal' && (
            <span className={`text-xs font-medium ${getStockStatus(inventario.cemento_bolsas || 0).color}`}>
              {getStockStatus(inventario.cemento_bolsas || 0).label}
            </span>
          )}
        </div>

        {/* Arena */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-muted uppercase tracking-[0.1em]">Arena</p>
            <span className="icon-plate w-8 h-8"><Shovel size={16} strokeWidth={1.75} /></span>
          </div>
          <p className="font-display text-3xl text-ink tabular-nums">
            {(inventario.arena_m3 || 0).toFixed(2)}
            <span className="text-sm font-sans font-normal normal-case tracking-normal text-muted ml-1">m³</span>
          </p>
          {getStockStatus(inventario.arena_m3 || 0).label !== 'Normal' && (
            <span className={`text-xs font-medium ${getStockStatus(inventario.arena_m3 || 0).color}`}>
              {getStockStatus(inventario.arena_m3 || 0).label}
            </span>
          )}
        </div>

        {/* Bloques */}
        {['bloque_de_4"', 'bloque_de_5"', 'bloque_de_6"'].map((tipo) => {
          const cantidad = inventario[tipo] || 0;
          const status = getStockStatus(cantidad);
          return (
            <div key={tipo} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-muted uppercase tracking-[0.1em]">{formatTipo(tipo)}</p>
                <span className="icon-plate w-8 h-8"><IconoBloque size={16} /></span>
              </div>
              <p className="font-display text-3xl text-ink tabular-nums">
                {cantidad.toLocaleString()}
                <span className="text-sm font-sans font-normal normal-case tracking-normal text-muted ml-1">und</span>
              </p>
              {status.label !== 'Normal' && (
                <span className={`text-xs font-medium ${status.color}`}>
                  {status.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Abastecer */}
      {showAbastecer && (
        <div className="modal-backdrop fixed inset-0 bg-graphite/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-ink">Abastecer Inventario</h2>
              <button onClick={() => setShowAbastecer(false)} className="text-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" strokeWidth={1.6} />
              </button>
            </div>
            <form onSubmit={handleAbastecer} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5">Cemento (bolsas)</label>
                <input
                  type="number"
                  value={cementoAbastecer}
                  onChange={(e) => setCementoAbastecer(e.target.value)}
                  className="field w-full py-2.5"
                  placeholder="0"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5">Arena (m³)</label>
                <input
                  type="number"
                  value={arenaAbastecer}
                  onChange={(e) => setArenaAbastecer(e.target.value)}
                  className="field w-full py-2.5"
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full py-3 text-sm tracking-wide"
              >
                Registrar Abastecimiento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Producir - MANUAL */}
      {showProducir && (
        <div className="modal-backdrop fixed inset-0 bg-graphite/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-xl text-ink">Registrar Producción</h2>
              <button onClick={() => setShowProducir(false)} className="text-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" strokeWidth={1.6} />
              </button>
            </div>
            <form onSubmit={handleProducir} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5">Tipo de Bloque</label>
                <select
                  value={productoProducir}
                  onChange={(e) => setProductoProducir(e.target.value)}
                  className="field w-full py-2.5"
                >
                  <option value='bloque_de_4"'>Bloque de 4&quot;</option>
                  <option value='bloque_de_5"'>Bloque de 5&quot;</option>
                  <option value='bloque_de_6"'>Bloque de 6&quot;</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5">
                  Cantidad de Bloques Producidos
                </label>
                <input
                  type="number"
                  value={cantidadProducir}
                  onChange={(e) => setCantidadProducir(e.target.value)}
                  className="field w-full py-2.5"
                  placeholder="Ej: 500"
                  min="1"
                  step="1"
                  required
                />
              </div>

              <div className="border-t border-brand-line pt-5">
                <p className="text-xs font-medium text-ink uppercase tracking-[0.1em] mb-3">Materiales Gastados (Ingreso Manual)</p>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5">
                      Cemento (bolsas)
                    </label>
                    <input
                      type="number"
                      value={cementoGastado}
                      onChange={(e) => setCementoGastado(e.target.value)}
                      className="field w-full py-2.5"
                      placeholder="Ej: 14"
                      min="0.01"
                      step="0.01"
                      required
                    />
                    <p className="text-xs text-faint mt-1.5">
                      Stock actual: {inventario.cemento_bolsas || 0} bolsas
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted uppercase tracking-[0.1em] mb-1.5">
                      Arena (m³)
                    </label>
                    <input
                      type="number"
                      value={arenaGastada}
                      onChange={(e) => setArenaGastada(e.target.value)}
                      className="field w-full py-2.5"
                      placeholder="Ej: 2.5"
                      min="0.01"
                      step="0.01"
                      required
                    />
                    <p className="text-xs text-faint mt-1.5">
                      Stock actual: {(inventario.arena_m3 || 0).toFixed(2)} m³
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-brand-accent-soft border border-brand-accent/20 text-sm text-ink-soft">
                <p className="font-medium text-ink">Ingreso manual</p>
                <p className="mt-1">
                  Ingresa la cantidad real de cemento y arena que gastaste en esta producción. El sistema validará que haya suficiente stock disponible.
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full py-3 text-sm tracking-wide"
              >
                Registrar Producción
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Historial */}
      {showHistorial && (
        <div className="modal-backdrop fixed inset-0 bg-graphite/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex flex-col gap-4 p-7 border-b border-brand-line">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-ink">Historial de Movimientos</h2>
                <button onClick={() => setShowHistorial(false)} className="text-muted hover:text-ink transition-colors">
                  <X className="w-5 h-5" strokeWidth={1.6} />
                </button>
              </div>
              <RangoFechas
                fechaDesde={fechaDesde}
                fechaHasta={fechaHasta}
                onFechaDesde={setFechaDesde}
                onFechaHasta={setFechaHasta}
              />
            </div>
            <div className="overflow-auto p-7">
              {historial.length === 0 ? (
                <div className="text-center text-muted py-8">
                  <History className="w-10 h-10 mx-auto mb-3 text-faint-2" strokeWidth={1.4} />
                  <p className="text-sm">No hay movimientos registrados</p>
                </div>
              ) : (
                <div className="divide-y divide-brand-line">
                  {historial.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between py-4"
                    >
                      <div>
                        <p className="text-sm text-ink">{formatAccion(item.accion)}</p>
                        <p className="text-xs text-muted mt-0.5">{formatTipo(item.tipo)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-ink">
                          {item.accion === 'produccion_uso' ? '−' : '+'}
                          {Number(item.cantidad).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
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
