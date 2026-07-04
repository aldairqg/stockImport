import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Package, ShoppingCart, FileBarChart, Settings, Calculator } from 'lucide-react';
import clsx from 'clsx';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ledger', label: 'Caja', icon: Wallet },
  { to: '/inventory', label: 'Inventario', icon: Package },
  { to: '/pos', label: 'Punto de Venta', icon: ShoppingCart },
  { to: '/simulator', label: 'Simulador', icon: Calculator },
  { to: '/reports', label: 'Reportes', icon: FileBarChart },
  { to: '/settings', label: 'Ajustes', icon: Settings },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white border-r border-slate-200">
      <div className="p-6">
        <h2 className="text-2xl font-bold tracking-tight text-brand-600">JAIFON</h2>
      </div>
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium',
                isActive
                  ? 'bg-brand-50 text-brand-600'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
