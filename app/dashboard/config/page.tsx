'use client';

import { useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function ConfigPage() {
  const [config, setConfig] = useState({
    bloquesPorBolsa: 42,
    arenaPor100Bloques: 0.40,
    precioBloque4: 22,
    precioBloque5: 25,
    precioBloque6: 28,
  });

  const guardarConfig = () => {
    // Aquí luego conectaremos con Supabase
    toast.success('Configuración guardada correctamente');
  };

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Configuración</h1>
        <p className="text-slate-500">Ajustes generales de producción y precios</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border p-8 space-y-8">
        
        {/* Producción */}
        <div>
          <h3 className="font-semibold text-lg mb-4 text-slate-800">Parámetros de Producción</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-600">Bloques por bolsa de cemento</label>
              <input
                type="number"
                step="0.1"
                value={config.bloquesPorBolsa}
                onChange={(e) => setConfig({ ...config, bloquesPorBolsa: parseFloat(e.target.value) })}
                className="w-full mt-2 border rounded-2xl px-4 py-3 text-lg"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Arena por 100 bloques (m³)</label>
              <input
                type="number"
                step="0.01"
                value={config.arenaPor100Bloques}
                onChange={(e) => setConfig({ ...config, arenaPor100Bloques: parseFloat(e.target.value) })}
                className="w-full mt-2 border rounded-2xl px-4 py-3 text-lg"
              />
            </div>
          </div>
        </div>

        {/* Precios */}
        <div>
          <h3 className="font-semibold text-lg mb-4 text-slate-800">Precios de Venta</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="text-sm font-medium text-slate-600">Precio Bloque 4"</label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-3.5 text-slate-400">L.</span>
                <input
                  type="number"
                  step="0.01"
                  value={config.precioBloque4}
                  onChange={(e) => setConfig({ ...config, precioBloque4: parseFloat(e.target.value) })}
                  className="w-full pl-8 border rounded-2xl px-4 py-3 text-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Precio Bloque 5"</label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-3.5 text-slate-400">L.</span>
                <input
                  type="number"
                  step="0.01"
                  value={config.precioBloque5}
                  onChange={(e) => setConfig({ ...config, precioBloque5: parseFloat(e.target.value) })}
                  className="w-full pl-8 border rounded-2xl px-4 py-3 text-lg"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600">Precio Bloque 6"</label>
              <div className="relative mt-2">
                <span className="absolute left-4 top-3.5 text-slate-400">L.</span>
                <input
                  type="number"
                  step="0.01"
                  value={config.precioBloque6}
                  onChange={(e) => setConfig({ ...config, precioBloque6: parseFloat(e.target.value) })}
                  className="w-full pl-8 border rounded-2xl px-4 py-3 text-lg"
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={guardarConfig}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-semibold text-lg transition mt-6"
        >
          <Save size={22} />
          Guardar Configuración
        </button>
      </div>
    </div>
  );
}