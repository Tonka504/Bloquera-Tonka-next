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
  LogOut
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
    <div className="flex min-h-screen bg-[#0F172A]">
      
      {/* Sidebar Industrial */}
      {/* Sidebar Industrial */}
<aside className="w-72 bg-[#0F172A] text-white flex flex-col border-r border-slate-800">

  {/* Logo / Encabezado del Sidebar */}
  <div className="px-8 py-8 border-b border-slate-800">
    <div className="flex items-center gap-4">
      <img 
        src="/logo-bloquera.png" 
        alt="Bloquera Tonka" 
        className="w-14 h-14 drop-shadow-lg" 
      />
      <div>
        <div className="font-bold text-[22px] tracking-[-1px] leading-none">BLOQUERA</div>
        <div className="font-bold text-[22px] tracking-[-1px] text-[#F59E0B] leading-none">TONKA</div>
        <div className="text-[10px] text-slate-400 mt-1 tracking-widest">SISTEMA DE GESTIÓN</div>
      </div>
    </div>
  </div>

  {/* Menú de Navegación */}
  <nav className="flex-1 px-5 py-8">
    <div className="space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 px-6 py-4 rounded-3xl text-[15px] font-medium transition-all ${
              isActive 
                ? 'bg-[#1E40AF] text-white shadow-lg' 
                : 'text-slate-300 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Icon size={21} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  </nav>

  {/* Footer del Sidebar */}
  <div className="p-6 border-t border-slate-800">
    <button
      onClick={() => {
        localStorage.removeItem('user');
        window.location.href = '/';
      }}
      className="flex w-full items-center justify-center gap-3 py-4 text-red-400 hover:bg-red-950/50 rounded-3xl transition font-medium text-[15px]"
    >
      <LogOut size={20} />
      Cerrar Sesión
    </button>
  </div>
</aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col">
        
        {/* Header */}
       {/* Header Superior Industrial */}
<header className="h-20 bg-[#020617] border-b border-slate-800 px-8 flex items-center justify-between text-white">
  
  {/* Título de la página actual */}
  <div className="text-2xl font-semibold tracking-tight">
    {menuItems.find(item => item.href === pathname)?.label || 'Dashboard'}
  </div>

  {/* Lado derecho del header */}
  <div className="flex items-center gap-4">
    
    {/* Badge de usuario mejorado */}
    <div className="flex items-center gap-3 px-5 py-2 bg-slate-900 border border-slate-700 rounded-2xl text-sm">
      <div className="w-8 h-8 bg-[#1E40AF] rounded-xl flex items-center justify-center">
        <span className="text-white text-xs font-bold">BT</span>
      </div>
      <div>
        <div className="font-medium text-white">Admin</div>
        <div className="text-[10px] text-slate-400 -mt-0.5">Administrador</div>
      </div>
    </div>

  </div>
</header>

        {/* Contenido */}
        <main className="flex-1 p-8 overflow-auto bg-slate-100 text-slate-900">
          {children}
        </main>
      </div>
    </div>
  );
}