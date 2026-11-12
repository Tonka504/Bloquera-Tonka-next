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
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Lado industrial (solo pantallas grandes) */}
      <div className="steel-surface relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white">
        <div className="hazard-strip absolute top-0 inset-x-0" />
        {/* Retícula de estructura metálica */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        <div className="absolute -right-24 -bottom-24 w-[28rem] h-[28rem] rounded-full bg-safety/10 blur-3xl pointer-events-none" />

        <div className="relative flex items-center gap-3">
          <div className="p-[3px] rounded-full bg-linear-to-br from-[#8d9395] via-[#2c3336] to-[#5a6266]">
            <img src="/logo-bloquera.png" alt="Bloquera Tonka" className="w-12 h-12 rounded-full ring-1 ring-black" />
          </div>
          <div className="font-display text-2xl tracking-[0.08em]">
            Bloquera <span className="text-safety">Tonka</span>
          </div>
        </div>

        <div className="relative max-w-md">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-safety mb-4">Centro de operaciones</p>
          <h2 className="font-display text-5xl leading-[0.95] text-[#f1f0eb]">
            Producción, pedidos y entregas en un solo panel.
          </h2>
          <div className="mt-10 grid grid-cols-2 gap-3">
            {[
              { icon: Factory, texto: 'Producción' },
              { icon: IconoBloque, texto: 'Inventario de bloques' },
              { icon: Truck, texto: 'Entregas parciales' },
              { icon: Warehouse, texto: 'Materiales' },
            ].map(({ icon: Icon, texto }, i) => (
              <div
                key={texto}
                className="flex items-center gap-3 rounded-[8px] border border-white/[0.08] bg-white/[0.03] px-3 py-3 animate-[rise-in_.5s_cubic-bezier(.2,.8,.2,1)_backwards]"
                style={{ animationDelay: `${0.1 + i * 0.06}s` }}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-[6px] bg-[#0f1213] border border-safety/40 text-safety">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span className="text-sm text-[#c9cdcd]">{texto}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-[#7d8486] tracking-wide">
          © {new Date().getFullYear()} Bloquera Tonka · Santa Bárbara, S.B.
        </p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm">
          {/* Logo (móvil) */}
          <div className="flex flex-col items-center mb-8 lg:hidden">
            <div className="p-[3px] rounded-full bg-linear-to-br from-[#8d9395] via-[#2c3336] to-[#5a6266] mb-5">
              <img src="/logo-bloquera.png" alt="Bloquera Tonka" className="w-16 h-16 rounded-full ring-1 ring-black" />
            </div>
            <h1 className="font-display text-4xl text-ink tracking-wide text-center leading-tight">
              Bloquera <span className="text-safety-deep">Tonka</span>
            </h1>
            <p className="text-muted mt-1 text-xs font-semibold tracking-[0.2em] uppercase">Sistema de Gestión</p>
          </div>

          {/* Tarjeta de Login */}
          <div className="panel panel-raised overflow-hidden">
            <div className="hazard-strip" />
            <div className="p-8 sm:p-9">
              <p className="text-[11px] font-semibold text-safety-deep uppercase tracking-[0.2em]">Acceso</p>
              <h2 className="font-display text-3xl text-ink leading-none mt-1 mb-7">Iniciar sesión</h2>

              <form onSubmit={handleLogin} className="space-y-5">
                {/* Usuario */}
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                    Usuario
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" size={17} strokeWidth={1.75} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="field pl-10 py-2.5 text-base"
                      placeholder="admin"
                      required
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase tracking-[0.12em] mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-faint pointer-events-none" size={17} strokeWidth={1.75} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="field pl-10 py-2.5 text-base"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {/* Botón */}
                <button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5 mt-2 text-sm uppercase">
                  {loading ? (
                    'Iniciando sesión...'
                  ) : (
                    <>
                      Iniciar Sesión
                      <ArrowRight size={16} strokeWidth={2} />
                    </>
                  )}
                </button>
              </form>

              {/* Credenciales de prueba */}
              <div className="mt-7 pt-5 border-t border-line text-center">
                <p className="text-xs text-muted tracking-wide">
                  Usuario de prueba: <span className="font-semibold text-ink">admin</span> / <span className="font-semibold text-ink">admin123</span>
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-faint text-xs mt-8 tracking-wide lg:hidden">
            © {new Date().getFullYear()} Bloquera Tonka · Santa Bárbara, S.B.
          </p>
        </div>
      </div>
    </div>
  );
}
