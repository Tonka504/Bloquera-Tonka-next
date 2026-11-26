'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  ReceiptText,
  Warehouse,
  HandCoins,
  ChartColumn,
  Cog,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

// Nota: "Configuración" se ocultó del menú a pedido — la ruta
// /dashboard/config sigue existiendo, solo no aparece en la navegación.
const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/dashboard/seguimiento', label: 'Seguimiento', icon: Truck },
  { href: '/dashboard/facturas', label: 'Facturas', icon: ReceiptText },
  { href: '/dashboard/inventario', label: 'Inventario', icon: Warehouse },
  { href: '/dashboard/gastos', label: 'Gastos', icon: HandCoins },
  { href: '/dashboard/reportes', label: 'Reportes', icon: ChartColumn },
];

// Rutas que no están en el menú pero sí necesitan título en el encabezado.
const otrasRutas = [{ href: '/dashboard/config', label: 'Configuración', icon: Cog }];

// Activo en la ruta exacta o en sus subrutas (ej. /dashboard/seguimiento/12).
// '/dashboard' solo coincide exacto para no quedar activo en todas las secciones.
function esRutaActiva(pathname: string, href: string) {
  if (pathname === href) return true;
  return href !== '/dashboard' && pathname.startsWith(href + '/');
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar el menú móvil al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const actual = [...menuItems, ...otrasRutas].find((item) => esRutaActiva(pathname, item.href)) || menuItems[0];

  return (
    <div className="flex min-h-screen">

      {/* Backdrop (solo móvil, cuando el sidebar está abierto) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-[#3c281c]/20 backdrop-blur-sm lg:hidden animate-[fade-in_.2s_ease-out_both]"
          aria-hidden="true"
        />
      )}

      {/* Sidebar flotante de vidrio */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[16.5rem] shrink-0 p-3 lg:p-4 transform transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="glass-strong h-full rounded-[26px] flex flex-col overflow-hidden">
          {/* Logo */}
          <div className="px-5 pt-6 pb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src="/logo-bloquera.png"
                  alt="Bloquera Tonka"
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white shadow-[0_8px_18px_-8px_rgba(150,80,30,.6)]"
                />
                <div className="leading-tight min-w-0">
                  <div className="font-display text-[15px] text-ink truncate">Bloquera Tonka</div>
                  <div className="text-xs text-muted">Sistema de gestión</div>
                </div>
              </div>
              {/* Cerrar (solo móvil) */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="btn-icon lg:hidden p-1.5"
                aria-label="Cerrar menú"
              >
                <X size={18} strokeWidth={1.9} />
              </button>
            </div>
          </div>

          {/* Menú de Navegación */}
          <nav className="flex-1 px-3 overflow-y-auto">
            <p className="px-3 mb-2 text-[11px] font-semibold tracking-normal text-faint">Menú</p>
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = esRutaActiva(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 px-2.5 py-2 rounded-2xl text-[14px] font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-white/90 text-ink shadow-[inset_0_1px_0_#fff,0_8px_20px_-10px_rgba(150,80,30,.45)]'
                        : 'text-muted hover:text-ink hover:bg-white/55 hover:translate-x-0.5'
                    }`}
                  >
                    <span
                      className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-linear-to-br from-[#ffa257] to-[#e0631c] text-white shadow-[0_8px_16px_-6px_rgba(242,118,43,.7)]'
                          : 'bg-white/50 text-muted group-hover:text-safety-deep'
                      }`}
                    >
                      <Icon size={17} strokeWidth={1.9} />
                    </span>
                    <span>{item.label}</span>
                    {isActive && <span className="ml-auto mr-1 w-1.5 h-1.5 rounded-full bg-safety shadow-[0_0_8px_#f28c28]" />}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Footer del Sidebar */}
          <div className="p-3">
            <div className="rounded-2xl bg-white/55 border border-white/80 p-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#ffa257] to-[#e0631c] text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  BT
                </div>
                <div className="leading-tight min-w-0">
                  <div className="text-sm font-semibold text-ink truncate">Admin</div>
                  <div className="text-xs text-muted">Administrador</div>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 py-2 rounded-xl text-muted hover:text-alert-deep hover:bg-white/80 active:translate-y-px transition-all text-[13px] font-semibold"
              >
                <LogOut size={15} strokeWidth={1.9} />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Encabezado superior de vidrio */}
        <header className="sticky top-0 z-30 px-3 sm:px-4 lg:pl-2 lg:pr-6 pt-3 lg:pt-4">
          <div className="glass rounded-[20px] h-14 lg:h-16 px-3 sm:px-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Botón hamburguesa (solo móvil) */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="btn-icon lg:hidden p-2"
                aria-label="Abrir menú"
              >
                <Menu size={19} strokeWidth={1.9} />
              </button>
              <div className="min-w-0">
                <div className="hidden sm:block text-[11px] font-medium text-faint leading-none mb-1">
                  Bloquera Tonka / {actual.label}
                </div>
                <div className="font-display text-lg sm:text-xl text-ink leading-none truncate">{actual.label}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 border border-white/80">
                <span className="w-2 h-2 rounded-full bg-ok shadow-[0_0_8px_#2f9e6a] animate-[led-pulse_2.4s_ease-in-out_infinite]" />
                <span className="text-xs font-semibold text-ink-soft">En línea</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-linear-to-br from-[#ffa257] to-[#e0631c] text-white flex items-center justify-center shrink-0 text-xs font-bold shadow-[0_8px_16px_-8px_rgba(242,118,43,.7)]">
                BT
              </div>
            </div>
          </div>
        </header>

        {/* Contenido (con transición suave entre pantallas) */}
        <main className="flex-1">
          <div key={pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
