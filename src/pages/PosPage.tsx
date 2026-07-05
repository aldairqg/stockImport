import { useState } from 'react';
import { useProducts, useSales } from '../hooks/useSupabaseQuery';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { CheckoutModal } from '../components/modals/CheckoutModal';
import { CollectPendingModal } from '../components/modals/CollectPendingModal';
import { Product, Sale } from '../types/models';
import { ShoppingCart, CircleDollarSign } from 'lucide-react';
import { formatPEN, formatUSD } from '../utils/finance';

export default function PosPage() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const availableProducts = useProducts()?.filter(p => p.status === 'EnStock') || [];
  const pendingSales = useSales()?.filter(s => !s.is_fully_paid) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Punto de Venta</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Columna Izquierda: Productos en Stock listos para vender */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-brand-600" /> Productos en Stock
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
            {availableProducts.length === 0 && (
              <div className="p-6 text-center text-slate-500">No hay productos en stock.</div>
            )}
            
            {availableProducts.map(product => (
              <div key={product.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-semibold text-slate-800">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-500 font-mono">Serie: {product.serie || '-'}</span>
                    <StatusBadge status={product.status} />
                  </div>
                </div>
                <div className="text-left sm:text-right flex sm:block justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-500 mb-0 sm:mb-1">Costo Base</p>
                    <p className="font-bold text-brand-600 mb-0 sm:mb-2">{formatPEN(product.total_cost_pen)}</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setSelectedProduct(product)}>
                    Vender
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha: Cobros pendientes */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CircleDollarSign className="w-5 h-5 text-rose-600" /> Cobros Pendientes
          </h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-100">
            {pendingSales.length === 0 && (
              <div className="p-6 text-center text-slate-500">No hay ventas con saldo pendiente.</div>
            )}

            {pendingSales.map(sale => (
              <div key={sale.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-0 hover:bg-slate-50 transition-colors">
                <div>
                  <h3 className="font-semibold text-slate-800">{sale.customer_name}</h3>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-xs text-slate-500">Total: {sale.sale_currency === 'USD' ? formatUSD(sale.total_price) : formatPEN(sale.total_price)}</span>
                    <span className="text-xs text-emerald-600 font-medium">Abonado: {sale.sale_currency === 'USD' ? formatUSD(sale.amount_paid) : formatPEN(sale.amount_paid)}</span>
                  </div>
                </div>
                <div className="text-left sm:text-right flex sm:block justify-between items-center">
                  <div>
                    <p className="text-xs text-rose-500 font-medium mb-0 sm:mb-1">Deuda Pendiente</p>
                    <p className="font-bold text-rose-600 mb-0 sm:mb-2">
                      {sale.sale_currency === 'USD' ? formatUSD(sale.pending_amount) : formatPEN(sale.pending_amount)}
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setSelectedSale(sale)}>
                    Cobrar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <CheckoutModal 
        isOpen={!!selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        product={selectedProduct} 
      />
      <CollectPendingModal 
        isOpen={!!selectedSale} 
        onClose={() => setSelectedSale(null)} 
        sale={selectedSale} 
      />
    </div>
  );
}
