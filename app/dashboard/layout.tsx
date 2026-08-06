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
  Settings,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { href: '/dashboard/facturas', label: 'Facturas', icon: FileText },
  { href: '/dashboard/inventario', label: 'Inventario', icon: Package },
  { href: '/dashboard/gastos', label: 'Gastos', icon: DollarSign },
  { href: '/dashboard/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/dashboard/config', label: 'Configuración', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-slate-100">

      {/* Sidebar */}
      <aside className="w-72 shrink-0 bg-brand-ink text-white flex flex-col border-r border-white/5">

        {/* Logo / Encabezado del Sidebar */}
        <div className="px-7 py-7 border-b border-white/5">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo-bloquera.png"
              alt="Bloquera Tonka"
              className="w-12 h-12 rounded-xl ring-1 ring-white/10 drop-shadow-lg"
            />
            <div>
              <div className="font-bold text-lg tracking-tight leading-none">BLOQUERA</div>
              <div className="font-bold text-lg tracking-tight text-brand-accent leading-none">TONKA</div>
              <div className="text-[10px] text-slate-400 mt-1.5 tracking-[0.2em] uppercase">Sistema de Gestión</div>
            </div>
          </div>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group relative flex items-center gap-3.5 px-4 py-3 rounded-xl text-[14px] font-medium transition-all ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full bg-brand-accent" />
                  )}
                  <Icon
                    size={19}
                    className={isActive ? 'text-brand-accent' : 'text-slate-500 group-hover:text-slate-300 transition-colors'}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer del Sidebar */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={() => {
              localStorage.removeItem('user');
              window.location.href = '/';
            }}
            className="flex w-full items-center justify-center gap-2.5 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors font-medium text-sm"
          >
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header Superior */}
        <header className="h-[72px] shrink-0 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <div className="text-xl font-semibold tracking-tight text-slate-900">
            {menuItems.find(item => item.href === pathname)?.label || 'Dashboard'}
          </div>

          <div className="flex items-center gap-3 pl-4 pr-5 py-2 bg-slate-50 border border-slate-200 rounded-full">
            <div className="w-8 h-8 bg-brand-primary rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">BT</span>
            </div>
            <div className="leading-tight">
              <div className="font-medium text-slate-900 text-sm">Admin</div>
              <div className="text-[11px] text-slate-500">Administrador</div>
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
