import React, { useState, useMemo } from 'react';
import { useLedger } from '../hooks/useSupabaseQuery';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { NewCapitalModal } from '../components/modals/NewCapitalModal';
import { ExchangeCurrencyModal } from '../components/modals/ExchangeCurrencyModal';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';
import { formatPEN, formatUSD } from '../utils/finance';
import { useLedgerStore } from '../store/useLedgerStore';
import { useToastStore } from '../store/useToastStore';
import { ArrowDownToLine, ArrowUpFromLine, RefreshCcw, Wallet, Trash2, MoreVertical, ChevronDown, ChevronUp } from 'lucide-react';

export default function LedgerPage() {
  const [isCapitalModalOpen, setCapitalModalOpen] = useState(false);
  const [capitalType, setCapitalType] = useState<'Aporte' | 'Retiro'>('Aporte');
  const [isExchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { deleteEntry } = useLedgerStore();
  const { addToast } = useToastStore();

  const ledger = useLedger();

  const { penBalance, usdBalance, currentTcpp } = useMemo(() => {
    if (!ledger || ledger.length === 0) return { penBalance: 0, usdBalance: 0, currentTcpp: 3.8 };
    
    const lastEntry = ledger[0];
    
    // Buscar el último TC de cambio registrado para tener la referencia del TCPP
    const lastExchange = ledger.find(l => l.type === 'CambioDivisa');
    const tcpp = lastExchange ? (lastExchange.exchange_rate || 3.8) : 3.8;

    return {
      penBalance: lastEntry.balance_pen,
      usdBalance: lastEntry.balance_usd,
      currentTcpp: tcpp
    };
  }, [ledger]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Caja y Bancos</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => { setCapitalType('Retiro'); setCapitalModalOpen(true); }}>
            <ArrowUpFromLine className="w-4 h-4 mr-2" /> Retirar
          </Button>
          <Button variant="primary" onClick={() => { setCapitalType('Aporte'); setCapitalModalOpen(true); }}>
            <ArrowDownToLine className="w-4 h-4 mr-2" /> Aportar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bóveda Soles */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Wallet className="w-24 h-24" />
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Bóveda Soles</p>
          <p className="text-4xl font-black text-brand-600">{formatPEN(penBalance)}</p>
          
          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
            <p className="text-xs text-slate-500">TC Promedio (TCPP): <strong className="text-slate-800">S/ {currentTcpp}</strong></p>
            <Button variant="ghost" size="sm" onClick={() => setExchangeModalOpen(true)}>
              <RefreshCcw className="w-4 h-4 mr-2 text-amber-500" />
              Cambiar Divisa
            </Button>
          </div>
        </div>

        {/* Bóveda Dólares */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Wallet className="w-24 h-24" />
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Bóveda Dólares</p>
          <p className="text-4xl font-black text-amber-500">{formatUSD(usdBalance)}</p>
          <div className="mt-6 pt-4 border-t border-slate-100">
            <p className="text-xs text-slate-500">Equivalente: <strong className="text-slate-800">{formatPEN(usdBalance * currentTcpp)}</strong></p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Historial de Transacciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 hidden md:table-cell">Detalle</th>
                <th className="px-4 py-3 text-right">Monto</th>
                <th className="px-4 py-3 text-right hidden lg:table-cell">Saldo (S/)</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Saldo ($)</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {ledger?.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">No hay movimientos registrados.</td></tr>
              )}
              {ledger?.map((entry) => (
                <React.Fragment key={entry.id}>
                  <tr className="border-b last:border-0 border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-700 whitespace-nowrap">{entry.date.toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <Badge variant={entry.amount > 0 ? 'success' : entry.type === 'CostoVenta' ? 'warning' : 'danger'}>{entry.type === 'CostoVenta' ? 'Costo Venta' : entry.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600 truncate max-w-[200px] hidden md:table-cell" title={entry.description}>{entry.description}</td>
                    <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${entry.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {entry.amount > 0 ? '+' : ''}
                      {entry.currency === 'USD' ? formatUSD(entry.amount) : formatPEN(entry.amount)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 hidden lg:table-cell whitespace-nowrap">{formatPEN(entry.balance_pen)}</td>
                    <td className="px-4 py-3 text-right text-slate-600 hidden md:table-cell whitespace-nowrap">{formatUSD(entry.balance_usd)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => setEntryToDelete(entry.id!)}
                          className="text-slate-400 hover:text-rose-600 p-2 rounded transition-colors hidden md:block"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id!)}
                          className="md:hidden text-slate-400 hover:text-brand-600 p-2"
                        >
                          {expandedRow === entry.id ? <ChevronUp className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Fila Expandible (Solo Móvil/Tablet) */}
                  {expandedRow === entry.id && (
                    <tr className="md:hidden bg-slate-50/80 border-b border-slate-100">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="flex flex-col gap-3 text-sm">
                          <div className="md:hidden">
                            <span className="text-slate-500 block mb-1">Detalle</span>
                            <p className="text-slate-800 font-medium">{entry.description || '-'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-3 lg:hidden">
                            <div>
                              <span className="text-slate-500 block mb-1">Saldo Total (S/)</span>
                              <p className="font-semibold text-slate-800">{formatPEN(entry.balance_pen)}</p>
                            </div>
                            <div className="md:hidden">
                              <span className="text-slate-500 block mb-1">Saldo Dólares ($)</span>
                              <p className="font-semibold text-slate-800">{formatUSD(entry.balance_usd)}</p>
                            </div>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button 
                              onClick={() => setEntryToDelete(entry.id!)}
                              className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-2 rounded-lg font-medium"
                            >
                              <Trash2 className="w-4 h-4" /> Eliminar Movimiento
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <NewCapitalModal 
        isOpen={isCapitalModalOpen} 
        onClose={() => setCapitalModalOpen(false)} 
        type={capitalType} 
      />
      <ExchangeCurrencyModal 
        isOpen={isExchangeModalOpen} 
        onClose={() => setExchangeModalOpen(false)} 
      />
      <ConfirmDeleteModal
        isOpen={!!entryToDelete}
        onClose={() => setEntryToDelete(null)}
        title="Eliminar Registro de Caja"
        message="¿Estás seguro que deseas eliminar este registro? Esto NO recalculará el saldo de los registros siguientes automáticamente."
        onConfirm={async () => {
          if (entryToDelete) {
            try {
              await deleteEntry(entryToDelete);
              addToast('Registro eliminado', 'success');
            } catch {
              addToast('Error al eliminar', 'error');
            }
          }
        }}
      />
    </div>
  );
}
