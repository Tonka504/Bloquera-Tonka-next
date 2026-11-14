'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw, Cog } from 'lucide-react';
import { toast } from 'sonner';
import { getConfiguracion, guardarConfiguracion } from '../../actions';

import { Cargando } from '../../components/ui';
export default function ConfigPage() {
  const [config, setConfig] = useState({
    bloques_por_bolsa: 36,
    arena_por_100_bloques: 0.30,
    precio_bloque_4: 19,
    precio_bloque_5: 20,
    precio_bloque_6: 22,
    precio_bolsa_cemento: 0,
    precio_m3_arena: 0,
  });
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargarConfig = async () => {
    setLoading(true);
    const result = await getConfiguracion();
    if (result.success && result.data) {
      setConfig({
        bloques_por_bolsa: Number(result.data.bloques_por_bolsa) || 36,
        arena_por_100_bloques: Number(result.data.arena_por_100_bloques) || 0.30,
        precio_bloque_4: Number(result.data.precio_bloque_4) || 19,
        precio_bloque_5: Number(result.data.precio_bloque_5) || 20,
        precio_bloque_6: Number(result.data.precio_bloque_6) || 22,
        precio_bolsa_cemento: Number(result.data.precio_bolsa_cemento) || 0,
        precio_m3_arena: Number(result.data.precio_m3_arena) || 0,
      });
    } else {
      toast.error(result.message || 'Error al cargar configuración');
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarConfig();
  }, []);

  const guardarConfig = async () => {
    setGuardando(true);
    const result = await guardarConfiguracion(config);
    if (result.success) {
      toast.success('Configuración guardada correctamente');
    } else {
      toast.error(result.message || 'Error al guardar');
    }
    setGuardando(false);
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-9 flex items-center justify-center gap-3 text-muted">
        <Cargando texto="Cargando configuración..." /></div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-9 max-w-3xl">
      <div className=" mb-8 lg:mb-10 flex items-center gap-4">
          <span className="icon-plate w-12 h-12 shrink-0">
            <Cog size={24} strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-[11px] font-semibold text-safety-deep uppercase tracking-[0.2em] mb-0.5">Ajustes</p>
            <h1 className="font-display text-3xl sm:text-4xl text-ink leading-none">Configuración</h1>
          </div>
        </div>

      <div className="panel p-5 sm:p-9 space-y-10">

        {/* Producción */}
        <div>
          <h3 className="font-display text-lg mb-6 text-ink">Parámetros de Producción</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-[0.1em]">Bloques por bolsa de cemento</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={config.bloques_por_bolsa}
                onChange={(e) => setConfig({ ...config, bloques_por_bolsa: parseFloat(e.target.value) || 1 })}
                className="field w-full mt-2 py-2.5 text-lg"
              />
              <p className="text-xs text-faint mt-2">Cantidad de bloques que se producen con una bolsa de cemento</p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-[0.1em]">Arena por 100 bloques (m³)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={config.arena_por_100_bloques}
                onChange={(e) => setConfig({ ...config, arena_por_100_bloques: parseFloat(e.target.value) || 0.01 })}
                className="field w-full mt-2 py-2.5 text-lg"
              />
              <p className="text-xs text-faint mt-2">Metros cúbicos de arena necesarios para 100 bloques</p>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-line" />

        {/* Precios */}
        <div>
          <h3 className="font-display text-lg mb-6 text-ink">Precios de Venta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-[0.1em]">Precio Bloque 4&quot;</label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 pointer-events-none -translate-y-1/2 text-muted">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={config.precio_bloque_4}
                  onChange={(e) => setConfig({ ...config, precio_bloque_4: parseFloat(e.target.value) || 0 })}
                  className="field w-full pl-9 py-2.5 text-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-[0.1em]">Precio Bloque 5&quot;</label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 pointer-events-none -translate-y-1/2 text-muted">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={config.precio_bloque_5}
                  onChange={(e) => setConfig({ ...config, precio_bloque_5: parseFloat(e.target.value) || 0 })}
                  className="field w-full pl-9 py-2.5 text-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-[0.1em]">Precio Bloque 6&quot;</label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 pointer-events-none -translate-y-1/2 text-muted">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={config.precio_bloque_6}
                  onChange={(e) => setConfig({ ...config, precio_bloque_6: parseFloat(e.target.value) || 0 })}
                  className="field w-full pl-9 py-2.5 text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-line" />

        {/* Costos de materia prima */}
        <div>
          <h3 className="font-display text-lg mb-2 text-ink">Costos de Materia Prima</h3>
          <p className="text-xs text-faint mb-6">Lo que pagas al comprar. Se usa para calcular el costo y la ganancia por bloque en Reportes.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-[0.1em]">Precio por bolsa de cemento</label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 pointer-events-none -translate-y-1/2 text-muted">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.precio_bolsa_cemento}
                  onChange={(e) => setConfig({ ...config, precio_bolsa_cemento: parseFloat(e.target.value) || 0 })}
                  className="field w-full pl-9 py-2.5 text-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted uppercase tracking-[0.1em]">Precio por m³ de arena</label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 pointer-events-none -translate-y-1/2 text-muted">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={config.precio_m3_arena}
                  onChange={(e) => setConfig({ ...config, precio_m3_arena: parseFloat(e.target.value) || 0 })}
                  className="field w-full pl-9 py-2.5 text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={guardarConfig}
          disabled={guardando}
          className="btn btn-success w-full flex items-center justify-center gap-3 py-3.5 text-sm tracking-wide"
        >
          {guardando ? (
            <RefreshCw size={18} className="animate-spin" />
          ) : (
            <Save size={18} strokeWidth={1.6} />
          )}
          {guardando ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
}
