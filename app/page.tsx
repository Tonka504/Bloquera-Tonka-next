'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, Lock, LogIn } from 'lucide-react';
import { loginAction } from './actions';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await loginAction(username, password);

    if (result.success && result.user) {
      localStorage.setItem('user', JSON.stringify(result.user));
      toast.success(`Bienvenido, ${result.user.nombre}`);
      router.push('/dashboard');
    } else {
      toast.error(result.message || 'Error al iniciar sesión');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1E2937] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo y Encabezado */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-4">
            <img 
              src="/logo-bloquera.png" 
              alt="Bloquera Tonka" 
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Bloquera Tonka</h1>
          <p className="text-slate-400 mt-1 text-lg">Sistema de Gestión Integral</p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-200">
          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Usuario */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-4 top-4 text-slate-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E40AF] text-lg transition-all"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#1E40AF] text-lg transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1E40AF] hover:bg-[#1E3A8A] text-white py-4 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-70 mt-2"
            >
              {loading ? (
                'Iniciando sesión...'
              ) : (
                <>
                  <LogIn size={22} />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-slate-500">
              Usuario de prueba: <span className="font-semibold text-slate-700">admin</span> / <span className="font-semibold text-slate-700">admin123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          © {new Date().getFullYear()} Bloquera Tonka - Santa Bárbara, S.B.
        </p>
      </div>
    </div>
  );
}