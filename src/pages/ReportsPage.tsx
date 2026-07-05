import { useState, useMemo } from 'react';
import { useLedger, useProducts, useSales } from '../hooks/useSupabaseQuery';
import { Button } from '../components/ui/Button';
import { Download, FileBarChart, Filter } from 'lucide-react';
import { formatPEN } from '../utils/finance';
import * as XLSX from 'xlsx';

export default function ReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const sales = useSales();
  const products = useProducts();
  const ledger = useLedger();

  // Derive stats for the selected month
  const reportData = useMemo(() => {
    if (!sales || !products || !ledger) return { totalSales: 0, netProfit: 0, soldCount: 0, rows: [] };
    
    const year = parseInt(selectedMonth.split('-')[0]);
    const month = parseInt(selectedMonth.split('-')[1]) - 1; // 0-indexed

    // Encontrar TCPP del mes (aproximado usando el último registrado antes o durante el mes)
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);
    
    let tcpp = 3.8;
    const pastExchanges = ledger
      .filter(l => l.type === 'CambioDivisa' && l.date <= monthEnd)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    if (pastExchanges.length > 0) {
      tcpp = pastExchanges[pastExchanges.length - 1].exchange_rate || 3.8;
    }

    const monthlySales = sales.filter(s => {
      const d = new Date(s.sale_date);
      return d.getFullYear() === year && d.getMonth() === month;
    });

    let totalSales = 0;
    let netProfit = 0;
    let soldCount = 0;
    const rows: any[] = [];

    monthlySales.forEach(s => {
      const p = products.find(prod => prod.id === s.product_id);
      if (p) {
        soldCount++;
        const salePen = s.sale_currency === 'PEN' ? s.total_price : s.total_price * tcpp;
        totalSales += salePen;
        const profit = salePen - p.total_cost_pen;
        netProfit += profit;
        
        rows.push({
          Fecha: s.sale_date.toLocaleDateString(),
          Cliente: s.customer_name,
          Producto: p.name,
          Serie: p.serie || '',
          Costo_PEN: p.total_cost_pen.toFixed(2),
          Precio_Venta: s.sale_currency === 'PEN' ? s.total_price.toFixed(2) : (s.total_price * tcpp).toFixed(2),
          Ganancia_PEN: profit.toFixed(2),
          Estado_Pago: s.is_fully_paid ? 'Pagado' : 'Pendiente'
        });
      }
    });

    return { totalSales, netProfit, soldCount, rows };
  }, [sales, products, ledger, selectedMonth]);

  const handleExportExcel = () => {
    if (reportData.rows.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(reportData.rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, `Reporte_Ventas_${selectedMonth}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Reportes Mensuales</h1>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-brand-500"
          />
        </div>
        
        <Button variant="secondary" onClick={handleExportExcel} disabled={reportData.rows.length === 0}>
          <Download className="w-4 h-4 mr-2" /> Exportar Excel
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100">
          <p className="text-sm font-semibold text-brand-700 mb-1">Productos Vendidos</p>
          <p className="text-3xl font-bold text-brand-900">{reportData.soldCount}</p>
        </div>
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
          <p className="text-sm font-semibold text-blue-700 mb-1">Ventas Brutas</p>
          <p className="text-3xl font-bold text-blue-900">{formatPEN(reportData.totalSales)}</p>
        </div>
        <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
          <p className="text-sm font-semibold text-emerald-700 mb-1">Ganancia Neta (PEN)</p>
          <p className="text-3xl font-bold text-emerald-900">{formatPEN(reportData.netProfit)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <FileBarChart className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-800">Detalle de Ventas ({selectedMonth})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3 text-right">Ganancia</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody>
              {reportData.rows.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No hay ventas registradas en este mes.</td></tr>
              )}
              {reportData.rows.map((row, idx) => (
                <tr key={idx} className="border-b last:border-0 border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-slate-600">{row.Fecha}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{row.Producto}</td>
                  <td className="px-4 py-3 text-slate-600">{row.Cliente}</td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">S/ {row.Ganancia_PEN}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${row.Estado_Pago === 'Pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {row.Estado_Pago}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
