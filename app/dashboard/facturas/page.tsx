'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { getFacturas } from '../../actions';
import { generateInvoicePDF } from '@/lib/generateInvoicePDF';

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarFacturas = async () => {
    const result = await getFacturas();
    if (result.success) {
      setFacturas(result.data || []);
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarFacturas();
  }, []);

  const descargarPDF = (factura: any) => {
    generateInvoicePDF(factura);
    toast.success(`Factura #${factura.num_factura} descargada`);
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando facturas...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Facturas</h1>
          <p className="text-slate-500">Historial de facturas generadas</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-6 py-4 text-left">N° Factura</th>
              <th className="px-6 py-4 text-left">Fecha</th>
              <th className="px-6 py-4 text-left">Cliente</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-center">Estado</th>
              <th className="px-6 py-4 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {facturas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  No hay facturas registradas
                </td>
              </tr>
            ) : (
              facturas.map((f: any) => (
                <tr key={f.num_factura} className="border-t hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">#{f.num_factura}</td>
                  <td className="px-6 py-4 text-slate-600">{f.fecha_despacho}</td>
                  <td className="px-6 py-4">{f.cliente}</td>
                  <td className="px-6 py-4 text-right font-medium">
                    L. {Number(f.total_venta || f.total).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      f.estado === 'Pagado' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {f.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button 
                      onClick={() => descargarPDF(f)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl"
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
    </div>
  );
}