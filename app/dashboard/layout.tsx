'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Gauge,
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
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
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

/** Separador con aspecto de placa metálica atornillada. */
function PlacaSeparadora() {
  return (
    <div className="relative my-1 h-[3px] rounded-full bg-linear-to-b from-black/60 to-white/[0.07]">
      <span className="absolute -top-[2px] left-0 w-[7px] h-[7px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#8d9395,#262c2f)]" />
      <span className="absolute -top-[2px] right-0 w-[7px] h-[7px] rounded-full bg-[radial-gradient(circle_at_35%_35%,#8d9395,#262c2f)]" />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cerrar el menú móvil al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const actual = [...menuItems, ...otrasRutas].find((item) => esRutaActiva(pathname, item.href)) || menuItems[0];
  const IconoActual = actual.icon;

  return (
    <div className="flex min-h-screen">

      {/* Backdrop (solo móvil, cuando el sidebar está abierto) */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-graphite/70 backdrop-blur-sm lg:hidden animate-[fade-in_.2s_ease-out_both]"
          aria-hidden="true"
        />
      )}

      {/* Sidebar: grafito industrial con estructura metálica */}
      <aside
        className={`steel-surface fixed inset-y-0 left-0 z-50 w-[17rem] shrink-0 text-white flex flex-col border-r border-black shadow-[inset_-1px_0_0_rgba(255,255,255,.06),8px_0_24px_-12px_rgba(0,0,0,.5)] transform transition-transform duration-300 ease-out lg:sticky lg:top-0 lg:h-screen lg:z-auto lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="hazard-strip shrink-0" />

        {/* Logo / Encabezado del Sidebar */}
        <div className="px-6 pt-7 pb-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative p-[3px] rounded-full bg-linear-to-br from-[#8d9395] via-[#2c3336] to-[#5a6266] shadow-[0_4px_12px_rgba(0,0,0,.5)]">
                <img
                  src="/logo-bloquera.png"
                  alt="Bloquera Tonka"
                  className="w-11 h-11 rounded-full ring-1 ring-black"
                />
              </div>
              <div className="leading-none">
                <div className="font-display text-[1.35rem] tracking-[0.08em] text-[#f1f0eb]">Bloquera</div>
                <div className="font-display text-[1.35rem] tracking-[0.08em] text-safety -mt-0.5">Tonka</div>
              </div>
            </div>
            {/* Cerrar (solo móvil) */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white/50 hover:text-white transition-colors"
              aria-label="Cerrar menú"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>
          <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#7d8486]">Centro de operaciones</p>
          <div className="mt-3">
            <PlacaSeparadora />
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 px-4 overflow-y-auto">
          <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#5f6669]">Módulos</p>
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = esRutaActiva(pathname, item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3 pl-3 pr-3 py-2.5 rounded-[7px] text-[14.5px] font-medium tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-linear-to-r from-safety/20 via-safety/[0.06] to-transparent shadow-[inset_0_1px_0_rgba(255,255,255,.06),inset_0_0_0_1px_rgba(242,140,40,.18)]'
                      : 'text-[#a3a9aa] hover:text-white hover:bg-white/[0.05] hover:translate-x-0.5'
                  }`}
                >
                  {/* Indicador naranja del módulo activo */}
                  <span
                    className={`absolute -left-4 top-1/2 -translate-y-1/2 w-[4px] rounded-r-full bg-safety transition-all duration-300 ${
                      isActive ? 'h-7 opacity-100 shadow-[0_0_12px_#f28c28]' : 'h-0 opacity-0'
                    }`}
                  />
                  <span
                    className={`flex items-center justify-center w-8 h-8 rounded-[6px] border transition-all duration-200 ${
                      isActive
                        ? 'bg-[#0f1213] border-safety/50 text-safety shadow-[0_0_14px_-2px_rgba(242,140,40,.6)]'
                        : 'bg-white/[0.03] border-white/[0.07] text-[#8d9395] group-hover:text-[#d5d8d8] group-hover:border-white/15'
                    }`}
                  >
                    <Icon size={17} strokeWidth={1.75} />
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-safety shadow-[0_0_8px_#f28c28] animate-[led-pulse_2.4s_ease-in-out_infinite]" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer del Sidebar */}
        <div className="px-4 pb-6 pt-4">
          <PlacaSeparadora />
          <div className="mt-4 flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-[7px] bg-[#0f1213] border border-white/10 flex items-center justify-center shrink-0">
              <span className="font-display text-safety text-sm">BT</span>
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold text-[#f1f0eb] truncate">Admin</div>
              <div className="text-[11px] text-[#7d8486]">Administrador</div>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/';
            }}
            className="mt-4 flex w-full items-center justify-center gap-2.5 py-2.5 rounded-[7px] border border-white/10 bg-white/[0.03] text-[#a3a9aa] hover:text-white hover:border-alert/60 hover:bg-alert/10 active:translate-y-px transition-all text-[13px] font-medium tracking-wide"
          >
            <LogOut size={16} strokeWidth={1.75} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header Superior: franja de concreto con placa de título */}
        <header className="sticky top-0 z-30 h-16 lg:h-[4.5rem] shrink-0 border-b border-line bg-[#eeede8]/90 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,.8)_inset,0_6px_16px_-12px_rgba(23,27,29,.4)] px-4 sm:px-6 lg:px-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Botón hamburguesa (solo móvil) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn-icon lg:hidden p-2"
              aria-label="Abrir menú"
            >
              <Menu size={20} strokeWidth={1.75} />
            </button>
            <span className="hidden sm:flex icon-plate w-9 h-9">
              <IconoActual size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.24em] text-muted leading-none mb-1">
                Bloquera Tonka
              </div>
              <div className="font-display text-xl sm:text-2xl text-ink leading-none truncate">{actual.label}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-line bg-surface shadow-[inset_0_1px_2px_rgba(23,27,29,.06)]">
              <span className="w-2 h-2 rounded-full bg-ok shadow-[0_0_8px_#36966a] animate-[led-pulse_2.4s_ease-in-out_infinite]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft">Sistema en línea</span>
            </div>
            <div className="w-9 h-9 rounded-[7px] steel-surface flex items-center justify-center border border-black shrink-0 shadow-[0_2px_6px_-2px_rgba(10,12,13,.5)]">
              <span className="font-display text-safety text-sm">BT</span>
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
