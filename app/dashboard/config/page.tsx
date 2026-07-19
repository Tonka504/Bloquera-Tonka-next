'use client';

import { useEffect, useState } from 'react';
import { Save, RefreshCw } from 'lucide-react';
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
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="animate-spin text-blue-600" size={24} />
        <span className="ml-3 text-slate-500">Cargando configuración...</span>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500">Ajustes generales de producción y precios</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border p-8 space-y-10">

        {/* Producción */}
        <div>
          <h3 className="font-semibold text-lg mb-5 text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
              <RefreshCw size={16} className="text-blue-600" />
            </span>
            Parámetros de Producción
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-600">Bloques por bolsa de cemento</label>
              <input
                type="number"
                step="0.1"
                min="1"
                value={config.bloques_por_bolsa}
                onChange={(e) => setConfig({ ...config, bloques_por_bolsa: parseFloat(e.target.value) || 1 })}
                className="w-full mt-2 border border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500 transition"
              />
              <p className="text-xs text-slate-400 mt-1.5">Cantidad de bloques que se producen con una bolsa de cemento</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Arena por 100 bloques (m³)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={config.arena_por_100_bloques}
                onChange={(e) => setConfig({ ...config, arena_por_100_bloques: parseFloat(e.target.value) || 0.01 })}
                className="w-full mt-2 border border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500 transition"
              />
              <p className="text-xs text-slate-400 mt-1.5">Metros cúbicos de arena necesarios para 100 bloques</p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Precios */}
        <div>
          <h3 className="font-semibold text-lg mb-5 text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 font-bold text-sm">
              L.
            </span>
            Precios de Venta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-600">Precio Bloque 4"</label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-3.5 text-slate-400 font-medium">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={config.precio_bloque_4}
                  onChange={(e) => setConfig({ ...config, precio_bloque_4: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 border border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Precio Bloque 5"</label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-3.5 text-slate-400 font-medium">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={config.precio_bloque_5}
                  onChange={(e) => setConfig({ ...config, precio_bloque_5: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 border border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Precio Bloque 6"</label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-3.5 text-slate-400 font-medium">L.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={config.precio_bloque_6}
                  onChange={(e) => setConfig({ ...config, precio_bloque_6: parseFloat(e.target.value) || 0 })}
                  className="w-full pl-10 border border-slate-200 rounded-2xl px-4 py-3 text-lg focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={guardarConfig}
          disabled={guardando}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white py-4 rounded-2xl font-semibold text-lg transition"
        >
          {guardando ? (
            <RefreshCw size={22} className="animate-spin" />
          ) : (
            <Save size={22} />
          )}
          {guardando ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
}