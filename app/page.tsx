'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, Lock, ArrowRight } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#faf8f4]">
      <div className="w-full max-w-sm">

        {/* Logo y Encabezado */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo-bloquera.png"
            alt="Bloquera Tonka"
            className="w-16 h-16 rounded-full ring-1 ring-brand-accent/40 mb-6"
          />
          <h1 className="font-display text-4xl text-[#201c17] tracking-wide text-center leading-tight">
            Bloquera <span className="text-brand-accent">Tonka</span>
          </h1>
          <p className="text-[#8a8175] mt-2 text-sm tracking-[0.15em] uppercase">Sistema de Gestión</p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-white border border-brand-line p-9">
          <form onSubmit={handleLogin} className="space-y-6">

            {/* Usuario */}
            <div>
              <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.12em] mb-2">
                Usuario
              </label>
              <div className="relative">
                <User className="absolute left-0 top-1/2 -translate-y-1/2 text-[#c2b8a1]" size={17} strokeWidth={1.6} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-7 pr-1 py-2.5 border-0 border-b border-brand-line bg-transparent focus:outline-none focus:border-brand-accent text-base text-[#201c17] transition-colors"
                  placeholder="admin"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-medium text-[#8a8175] uppercase tracking-[0.12em] mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-[#c2b8a1]" size={17} strokeWidth={1.6} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-7 pr-1 py-2.5 border-0 border-b border-brand-line bg-transparent focus:outline-none focus:border-brand-accent text-base text-[#201c17] transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Botón */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary hover:bg-brand-ink-soft text-white py-3.5 flex items-center justify-center gap-2.5 transition-colors disabled:opacity-60 mt-2 tracking-wide text-sm"
            >
              {loading ? (
                'Iniciando sesión...'
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight size={16} strokeWidth={1.8} />
                </>
              )}
            </button>
          </form>

          {/* Credenciales de prueba */}
          <div className="mt-7 pt-6 border-t border-brand-line text-center">
            <p className="text-xs text-[#8a8175] tracking-wide">
              Usuario de prueba: <span className="font-medium text-[#201c17]">admin</span> / <span className="font-medium text-[#201c17]">admin123</span>
            </p>
          </div>
        </div>

        <p className="text-center text-[#a39a8c] text-xs mt-8 tracking-wide">
          © {new Date().getFullYear()} Bloquera Tonka · Santa Bárbara, S.B.
        </p>
      </div>
    </div>
  );
}
