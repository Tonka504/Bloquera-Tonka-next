'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Package,
  DollarSign,
  BarChart3,
  LogOut,
} from 'lucide-react';

// Nota: "Configuración" se ocultó del menú a pedido — la ruta
// /dashboard/config sigue existiendo, solo no aparece en la navegación.
const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/dashboard/facturas', label: 'Facturas', icon: FileText },
  { href: '/dashboard/inventario', label: 'Inventario', icon: Package },
  { href: '/dashboard/gastos', label: 'Gastos', icon: DollarSign },
  { href: '/dashboard/reportes', label: 'Reportes', icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#faf8f4]">

      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-brand-ink text-white flex flex-col">

        {/* Logo / Encabezado del Sidebar */}
        <div className="px-7 py-8">
          <div className="flex items-center gap-3">
            <img
              src="/logo-bloquera.png"
              alt="Bloquera Tonka"
              className="w-10 h-10 rounded-full ring-1 ring-brand-accent/40"
            />
            <div>
              <div className="font-display text-xl leading-none tracking-wide">Bloquera</div>
              <div className="font-display text-xl leading-none tracking-wide text-brand-accent -mt-0.5">Tonka</div>
            </div>
          </div>
          <div className="mt-5 h-px bg-white/10" />
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 px-5">
          <div className="space-y-0.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3.5 pl-4 pr-3 py-3 text-[13.5px] tracking-wide transition-colors ${
                    isActive
                      ? 'text-white'
                      : 'text-white/45 hover:text-white/80'
                  }`}
                >
                  <span
                    className={`absolute left-0 top-1/2 -translate-y-1/2 h-4 w-px transition-colors ${
                      isActive ? 'bg-brand-accent h-5' : 'bg-transparent'
                    }`}
                  />
                  <Icon size={17} strokeWidth={1.6} className={isActive ? 'text-brand-accent' : 'text-white/40 group-hover:text-white/70'} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer del Sidebar */}
        <div className="px-5 pb-7 pt-4">
          <div className="h-px bg-white/10 mb-4" />
          <button
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/';
            }}
            className="flex w-full items-center gap-3.5 pl-4 py-2.5 text-white/45 hover:text-white/80 transition-colors text-[13.5px] tracking-wide"
          >
            <LogOut size={17} strokeWidth={1.6} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header Superior */}
        <header className="h-20 shrink-0 bg-[#faf8f4] border-b border-brand-line px-10 flex items-center justify-between">
          <div className="font-display text-2xl text-[#201c17] tracking-wide">
            {menuItems.find(item => item.href === pathname)?.label || 'Dashboard'}
          </div>

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-ink flex items-center justify-center ring-1 ring-brand-accent/30">
              <span className="text-brand-accent text-[11px] font-semibold tracking-wide">BT</span>
            </div>
            <div className="leading-tight">
              <div className="font-medium text-[#201c17] text-sm">Admin</div>
              <div className="text-[11px] text-[#8a8175]">Administrador</div>
            </div>
          </div>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
