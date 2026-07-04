import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Wallet, Package, ShoppingCart, MoreHorizontal, Calculator } from 'lucide-react';
import clsx from 'clsx';

const BOTTOM_NAV_ITEMS = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard },
  { to: '/ledger', label: 'Caja', icon: Wallet },
  { to: '/inventory', label: 'Stock', icon: Package },
  { to: '/pos', label: 'Venta', icon: ShoppingCart },
  { to: '/simulator', label: 'Simular', icon: Calculator },
  { to: '/reports', label: 'Más', icon: MoreHorizontal }, // Simplificamos en móvil
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex justify-around items-center h-16">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive ? 'text-brand-600' : 'text-slate-500 hover:text-slate-800'
              )
            }
          >
            <item.icon className="w-6 h-6" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
