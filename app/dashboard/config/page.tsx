'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getConfiguracion, guardarConfiguracion } from '../../actions';

export default function ConfigPage() {
  const [config, setConfig] = useState({
    bloques_por_bolsa: 36,
    arena_por_100_bloques: 0.30,
    precio_bloque_4: 19,
    precio_bloque_5: 20,
    precio_bloque_6: 22,
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
      <div className="px-10 py-9 flex items-center justify-center gap-3 text-[#8a8175]">
        <Loader2 className="animate-spin" size={20} />
        Cargando configuración...
      </div>
    );
  }

  return (
    <div className="px-10 py-9 max-w-3xl">
      <div className="mb-10">
        <p className="text-xs text-[#8a8175] uppercase tracking-[0.15em] mb-1">Ajustes</p>
        <h1 className="font-display text-3xl text-[#201c17]">Configuración</h1>
      </div>

      <div className="border border-brand-line p-9 space-y-10">

        {/* Producción */}
        <div>
          <h3 className="font-display text-lg mb-6 text-[#201c17]">Parámetros de Producción</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em]">Bloques por bolsa de cemento</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={config.bloques_por_bolsa}
                onChange={(e) => setConfig({ ...config, bloques_por_bolsa: parseFloat(e.target.value) || 1 })}
                className="w-full mt-2 border-0 border-b border-brand-line px-0 py-2.5 text-lg focus:outline-none focus:border-brand-accent transition-colors"
              />
              <p className="text-xs text-[#a39a8c] mt-2">Cantidad de bloques que se producen con una bolsa de cemento</p>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em]">Arena por 100 bloques (m³)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={config.arena_por_100_bloques}
                onChange={(e) => setConfig({ ...config, arena_por_100_bloques: parseFloat(e.target.value) || 0.01 })}
                className="w-full mt-2 border-0 border-b border-brand-line px-0 py-2.5 text-lg focus:outline-none focus:border-brand-accent transition-colors"
              />
              <p className="text-xs text-[#a39a8c] mt-2">Metros cúbicos de arena necesarios para 100 bloques</p>
            </div>
          </div>
        </div>

        <div className="border-t border-brand-line" />

        {/* Precios */}
        <div>
          <h3 className="font-display text-lg mb-6 text-[#201c17]">Precios de Venta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <label className="text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em]">Precio Bloque 4&quot;</label>
              <div className="relative mt-2">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8a8175]">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={config.precio_bloque_4}
                  onChange={(e) => setConfig({ ...config, precio_bloque_4: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-6 border-0 border-b border-brand-line px-0 py-2.5 text-lg focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em]">Precio Bloque 5&quot;</label>
              <div className="relative mt-2">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8a8175]">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={config.precio_bloque_5}
                  onChange={(e) => setConfig({ ...config, precio_bloque_5: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-6 border-0 border-b border-brand-line px-0 py-2.5 text-lg focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#8a8175] uppercase tracking-[0.1em]">Precio Bloque 6&quot;</label>
              <div className="relative mt-2">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[#8a8175]">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={config.precio_bloque_6}
                  onChange={(e) => setConfig({ ...config, precio_bloque_6: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-6 border-0 border-b border-brand-line px-0 py-2.5 text-lg focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={guardarConfig}
          disabled={guardando}
          className="w-full flex items-center justify-center gap-3 bg-brand-primary hover:bg-brand-ink-soft disabled:opacity-60 text-white py-3.5 text-sm tracking-wide transition-colors"
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
