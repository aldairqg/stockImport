import { useState, useMemo, useEffect } from 'react';
import { useLedger } from '../../hooks/useSupabaseQuery';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { CurrencyToggle } from '../ui/CurrencyToggle';
import { useSalesStore } from '../../store/useSalesStore';
import { useToastStore } from '../../store/useToastStore';
import { calcProfit, calcSuggestedPrice } from '../../utils/finance';
import { Product, Currency, Sale } from '../../types/models';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function CheckoutModal({ isOpen, onClose, product }: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [saleCurrency, setSaleCurrency] = useState<Currency>('PEN');
  const [totalPrice, setTotalPrice] = useState('');
  const [isAdelanto, setIsAdelanto] = useState(false);
  const [amountPaid, setAmountPaid] = useState('');
  
  const { registerSale } = useSalesStore();
  const { addToast } = useToastStore();

  const ledgerEntries = useLedger();
  const tcpp = useMemo(() => {
    if (!ledgerEntries) return 3.8;
    const lastExchange = ledgerEntries.filter(el => el.type === 'CambioDivisa').pop();
    return lastExchange ? lastExchange.exchange_rate || 3.8 : 3.8;
  }, [ledgerEntries]);

  // Cálculos en tiempo real
  const numTotalPrice = parseFloat(totalPrice) || 0;
  const numAmountPaid = isAdelanto ? (parseFloat(amountPaid) || 0) : numTotalPrice;
  const pendingAmount = numTotalPrice - numAmountPaid;

  const { profit, roi } = useMemo(() => {
    if (!product || numTotalPrice <= 0) return { profit: 0, roi: 0 };
    return calcProfit(product.total_cost_pen, saleCurrency, numTotalPrice, tcpp);
  }, [product, numTotalPrice, saleCurrency, tcpp]);

  const suggestedPrice = product ? calcSuggestedPrice(product.total_cost_pen, 25) : 0;

  // Reset form when modal opens with new product
  useEffect(() => {
    if (isOpen) {
      setCustomerName('');
      setTotalPrice('');
      setIsAdelanto(false);
      setAmountPaid('');
      setSaleCurrency('PEN');
    }
  }, [isOpen, product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    if (!customerName.trim() || numTotalPrice <= 0) {
      addToast('Ingrese cliente y precio total válidos', 'error');
      return;
    }

    if (isAdelanto && (numAmountPaid <= 0 || numAmountPaid >= numTotalPrice)) {
      addToast('El adelanto debe ser mayor a 0 y menor al precio total', 'error');
      return;
    }

    try {
      const sale: Omit<Sale, 'id'> = {
        product_id: product.id!,
        customer_name: customerName,
        sale_date: new Date(),
        sale_currency: saleCurrency,
        total_price: numTotalPrice,
        amount_paid: numAmountPaid,
        pending_amount: pendingAmount,
        is_fully_paid: pendingAmount <= 0
      };

      await registerSale(sale);
      addToast('Venta registrada exitosamente', 'success');
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Error al registrar la venta', 'error');
    }
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Venta"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit}>Confirmar Venta</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info referencial para negociar */}
        <div className="flex gap-4">
          <div className="flex-1 bg-rose-50 border border-rose-100 p-3 rounded-xl text-center">
            <span className="block text-xs text-rose-600 font-semibold mb-1">Costo (Break-even)</span>
            <span className="text-lg font-bold text-rose-700">S/ {product.total_cost_pen.toFixed(2)}</span>
          </div>
          <div className="flex-1 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-center">
            <span className="block text-xs text-emerald-600 font-semibold mb-1">Precio Sugerido</span>
            <span className="text-lg font-bold text-emerald-700">S/ {suggestedPrice.toFixed(2)}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Nombre del Cliente</label>
            <input 
              type="text" 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg sm:text-sm focus:ring-brand-500 focus:border-brand-500" 
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div className="flex justify-center py-2">
            <CurrencyToggle value={saleCurrency} onChange={setSaleCurrency} />
          </div>

          <AmountInput
            label="Precio Acordado"
            currency={saleCurrency}
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
          />

          <div className="flex items-center gap-2 mt-4">
            <input 
              type="checkbox" 
              id="isAdelanto" 
              checked={isAdelanto} 
              onChange={(e) => setIsAdelanto(e.target.checked)}
              className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500"
            />
            <label htmlFor="isAdelanto" className="text-sm font-medium text-slate-700">Venta con Adelanto (Reserva)</label>
          </div>

          {isAdelanto && (
            <div className="pl-6 animate-in fade-in slide-in-from-top-2">
              <AmountInput
                label="Monto Pagado (Adelanto)"
                currency={saleCurrency}
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
              />
              <p className="text-sm text-slate-500 mt-2">Saldo Pendiente: {saleCurrency === 'USD' ? '$' : 'S/'} {pendingAmount.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Resumen de Ganancia */}
        {numTotalPrice > 0 && (
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl mt-6">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Proyección de Ganancia</h4>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-sm text-slate-600 mb-1">Ganancia Neta (PEN)</p>
                <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {profit >= 0 ? '+' : '-'} S/ {Math.abs(profit).toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-600 mb-1">ROI</p>
                <div className={`inline-block px-2 py-1 rounded-lg text-sm font-bold ${roi >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                  {roi}%
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}
