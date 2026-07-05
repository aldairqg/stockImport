import { useLedger, useProducts, useSales } from '../hooks/useSupabaseQuery';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Wallet, Package, TrendingUp, Activity, ArrowRight, CircleDollarSign } from 'lucide-react';
import { formatPEN, formatUSD } from '../utils/finance';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';

export default function DashboardPage() {
  const ledger = useLedger(10);
  const products = useProducts();
  const sales = useSales();

  const { totalLiquidityPen, activeInvestment, netProfit, globalRoi } = useMemo(() => {
    if (!ledger || !products || !sales) return { totalLiquidityPen: 0, activeInvestment: 0, netProfit: 0, globalRoi: 0 };

    // 1. Liquidez Total
    const lastEntry = ledger[0];
    const penBalance = lastEntry?.balance_pen || 0;
    const usdBalance = lastEntry?.balance_usd || 0;
    
    // Buscar TCPP
    const lastExchange = [...ledger].reverse().find(l => l.type === 'CambioDivisa');
    const tcpp = lastExchange ? (lastExchange.exchange_rate || 3.8) : 3.8;
    
    const totalLiquidityPen = penBalance + (usdBalance * tcpp);

    // 2. Inversión Activa (Productos en Tránsito o En Stock)
    const activeProducts = products.filter(p => p.status === 'EnTransito' || p.status === 'EnStock' || p.status === 'Comprado');
    const activeInvestment = activeProducts.reduce((sum, p) => sum + p.total_cost_pen, 0);

    // 3. Ganancia Neta y ROI
    // Sumamos la ganancia (realizada en PEN) de todas las ventas
    let totalCostSold = 0;
    let totalSalePen = 0;

    sales.forEach(s => {
      const p = products.find(prod => prod.id === s.product_id);
      if (p) {
        totalCostSold += p.total_cost_pen;
        const saleAmountPen = s.sale_currency === 'PEN' ? s.total_price : s.total_price * tcpp;
        totalSalePen += saleAmountPen;
      }
    });

    const netProfit = totalSalePen - totalCostSold;
    const globalRoi = totalCostSold > 0 ? (netProfit / totalCostSold) * 100 : 0;

    return { totalLiquidityPen, activeInvestment, netProfit, globalRoi };
  }, [ledger, products, sales]);

  const pendingSales = sales?.filter(s => !s.is_fully_paid) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Liquidez Total"
          value={formatPEN(totalLiquidityPen)}
          icon={<Wallet className="w-5 h-5 text-brand-600" />}
        />
        <StatCard
          title="Capital Dormido"
          value={formatPEN(activeInvestment)}
          icon={<Package className="w-5 h-5 text-amber-600" />}
          colorClass="text-amber-600 bg-amber-100"
        />
        <StatCard
          title="Ganancia Neta"
          value={formatPEN(netProfit)}
          icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          colorClass="text-emerald-600 bg-emerald-100"
        />
        <StatCard
          title="ROI Global"
          value={`${globalRoi.toFixed(2)}%`}
          icon={<Activity className="w-5 h-5 text-purple-600" />}
          colorClass="text-purple-600 bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-800">Últimos Movimientos</h2>
            <Link to="/ledger" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center">
              Ver todos <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Detalle</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger?.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No hay movimientos recientes.</td></tr>
                  )}
                  {ledger?.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0 border-slate-100 hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-medium text-slate-700">{entry.date.toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.amount > 0 ? 'success' : 'danger'}>{entry.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 truncate max-w-[150px]">{entry.description}</td>
                      <td className={`px-4 py-3 text-right font-bold ${entry.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {entry.amount > 0 ? '+' : ''}
                        {entry.currency === 'USD' ? formatUSD(entry.amount) : formatPEN(entry.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">Cobros Pendientes</h2>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {pendingSales.length === 0 ? (
              <div className="p-6 text-center text-slate-500">
                <CircleDollarSign className="w-12 h-12 text-slate-200 mx-auto mb-2" />
                <p className="text-sm">No hay cobros pendientes</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingSales.map(sale => (
                  <div key={sale.id} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-800">{sale.customer_name}</span>
                      <span className="font-bold text-rose-600">
                        {sale.sale_currency === 'USD' ? formatUSD(sale.pending_amount) : formatPEN(sale.pending_amount)}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Venta del {sale.sale_date.toLocaleDateString()}
                    </div>
                    <div className="mt-2 text-right">
                      <Link to="/pos" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
                        Ir a cobrar →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
