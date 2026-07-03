'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';
import { getDashboardResumen } from '../actions';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [resumen, setResumen] = useState({
    ventas: 0,
    gastos: 0,
    balance: 0,
    por_cobrar: 0,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      router.push('/');
      return;
    }
    setUser(JSON.parse(savedUser));
    cargarDatos();
  }, [router]);

  const cargarDatos = async () => {
    const result = await getDashboardResumen();

    if (result.success && result.data) {
      setResumen(result.data);
    } else {
      console.error(result.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) return null;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Resumen general de tu bloquera</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-2xl transition"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Cargando datos...</div>
      ) : (
        <>
          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Ventas Totales</p>
                  <p className="text-3xl font-bold text-emerald-600 mt-1">
                    L. {resumen.ventas.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                  <TrendingUp className="text-emerald-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Gastos Totales</p>
                  <p className="text-3xl font-bold text-red-600 mt-1">
                    L. {resumen.gastos.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center">
                  <TrendingDown className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Balance</p>
                  <p className="text-3xl font-bold text-blue-600 mt-1">
                    L. {resumen.balance.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                  <DollarSign className="text-blue-600" size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Por Cobrar</p>
                  <p className="text-3xl font-bold text-amber-600 mt-1">
                    L. {resumen.por_cobrar.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center">
                  <Users className="text-amber-600" size={24} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border">
            <h3 className="font-semibold text-lg mb-4">Bienvenido de nuevo, {user.nombre}</h3>
            <p className="text-slate-600">
              Aquí podrás ver el resumen general de tu negocio. 
              Las demás secciones están disponibles en el menú lateral.
            </p>
          </div>
        </>
      )}
    </div>
  );
}