'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { User, Lock, ArrowRight, Factory, Truck, Warehouse } from 'lucide-react';
import { loginAction } from './actions';
import { IconoBloque } from './components/ui';

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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_1fr] gap-5">
        {/* Presentación (solo pantallas grandes) */}
        <div className="relative hidden lg:flex flex-col justify-between gap-10 min-h-[560px] overflow-hidden rounded-[28px] p-10 text-white bg-[image:var(--grad-hero)] shadow-[0_30px_60px_-24px_rgba(226,92,70,.6)] animate-[rise-in_.5s_cubic-bezier(.2,.8,.2,1)_backwards]">
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-24 w-80 h-80 rounded-full bg-[#ffd39a]/30 blur-3xl pointer-events-none" />

          <div className="relative flex items-center gap-3">
            <img src="/logo-bloquera.png" alt="Bloquera Tonka" className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/70" />
            <div className="font-display text-xl">Bloquera Tonka</div>
          </div>

          <div className="relative max-w-md">
            <p className="text-sm font-semibold text-white/80 mb-3">Sistema de gestión</p>
            <h2 className="font-display text-[2.6rem] leading-[1.05]">Producción, pedidos y entregas en un solo lugar.</h2>
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { icon: Factory, texto: 'Producción' },
                { icon: IconoBloque, texto: 'Inventario de bloques' },
                { icon: Truck, texto: 'Entregas parciales' },
                { icon: Warehouse, texto: 'Materiales' },
              ].map(({ icon: Icon, texto }, i) => (
                <div
                  key={texto}
                  className="flex items-center gap-3 rounded-2xl bg-white/15 border border-white/30 backdrop-blur-md px-3 py-3 animate-[rise-in_.5s_cubic-bezier(.2,.8,.2,1)_backwards]"
                  style={{ animationDelay: `${0.1 + i * 0.06}s` }}
                >
                  <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 text-safety-deep">
                    <Icon size={17} strokeWidth={1.9} />
                  </span>
                  <span className="text-sm font-semibold">{texto}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="relative text-xs text-white/75">
            © {new Date().getFullYear()} Bloquera Tonka · Santa Bárbara, S.B.
          </p>
        </div>

        {/* Formulario */}
        <div className="flex items-center justify-center">
          <div className="w-full max-w-sm lg:max-w-none">
            {/* Logo (móvil) */}
            <div className="flex flex-col items-center mb-8 lg:hidden">
              <img src="/logo-bloquera.png" alt="Bloquera Tonka" className="w-20 h-20 rounded-3xl object-cover ring-4 ring-white/80 shadow-[0_14px_30px_-12px_rgba(150,80,30,.6)] mb-5" />
              <h1 className="font-display text-3xl text-ink text-center">Bloquera Tonka</h1>
              <p className="text-muted mt-1 text-sm">Sistema de gestión</p>
            </div>

            {/* Tarjeta de Login */}
            <div className="glass-strong rounded-[28px] p-8 sm:p-10 animate-[rise-in_.5s_cubic-bezier(.2,.8,.2,1)_backwards]">
              <h2 className="font-display text-3xl text-ink">Bienvenido</h2>
              <p className="text-muted mt-1.5 mb-8 text-sm">Ingrese sus datos para continuar.</p>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Usuario */}
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Usuario</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" size={17} strokeWidth={1.9} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="field pl-10 py-3 text-base"
                      placeholder="admin"
                      required
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-faint pointer-events-none" size={17} strokeWidth={1.9} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field pl-10 py-3 text-base"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {/* Botón */}
                <button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5 mt-2 text-sm">
                  {loading ? (
                    'Iniciando sesión...'
                  ) : (
                    <>
                      Iniciar sesión
                      <ArrowRight size={16} strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              {/* Credenciales de prueba */}
              <div className="mt-7 pt-5 border-t border-line text-center">
                <p className="text-xs text-muted">
                  Usuario de prueba: <span className="font-semibold text-ink">admin</span> / <span className="font-semibold text-ink">admin123</span>
                </p>
              </div>
            </div>

            <p className="text-center text-faint text-xs mt-8 lg:hidden">
              © {new Date().getFullYear()} Bloquera Tonka · Santa Bárbara, S.B.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
