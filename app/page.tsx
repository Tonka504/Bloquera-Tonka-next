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
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-brand-ink overflow-hidden">
      {/* Fondo decorativo: bloques sutiles */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '48px 32px',
        }}
      />
      <div
        aria-hidden
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-brand-primary/30 blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-brand-accent/10 blur-3xl"
      />

      <div className="w-full max-w-md relative">

        {/* Logo y Encabezado */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 mb-5 rounded-3xl bg-white/5 ring-1 ring-white/10 p-4 backdrop-blur-sm">
            <img
              src="/logo-bloquera.png"
              alt="Bloquera Tonka"
              className="w-full h-full object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Bloquera Tonka</h1>
          <p className="text-slate-400 mt-1.5 text-base tracking-wide">Sistema de Gestión Integral</p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-black/40 p-8 border border-white/10">
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Usuario */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-base transition-all"
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
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary text-base transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3 transition-all disabled:opacity-70 mt-2 shadow-lg shadow-brand-primary/20"
            >
              {loading ? (
                'Iniciando sesión...'
              ) : (
                <>
                  <LogIn size={20} />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Usuario de prueba: <span className="font-semibold text-slate-700">admin</span> / <span className="font-semibold text-slate-700">admin123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          © {new Date().getFullYear()} Bloquera Tonka · Santa Bárbara, S.B.
        </p>
      </div>
    </div>
  );
}
