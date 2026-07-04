import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { useSalesStore } from '../../store/useSalesStore';
import { useToastStore } from '../../store/useToastStore';
import { Sale } from '../../types/models';

interface CollectPendingModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null;
}

export function CollectPendingModal({ isOpen, onClose, sale }: CollectPendingModalProps) {
  const [amountToCollect, setAmountToCollect] = useState('');
  
  const { collectPending } = useSalesStore();
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sale) return;

    const numAmount = parseFloat(amountToCollect);
    if (!numAmount || numAmount <= 0) {
      addToast('Ingrese un monto válido mayor a 0', 'error');
      return;
    }
    
    if (numAmount > sale.pending_amount) {
      addToast('El monto supera la deuda pendiente', 'error');
      return;
    }

    try {
      await collectPending(sale.id!, numAmount, sale.sale_currency);
      addToast('Cobro registrado exitosamente', 'success');
      onClose();
      setAmountToCollect('');
    } catch (error: any) {
      addToast(error.message || 'Error al registrar el cobro', 'error');
    }
  };

  if (!sale) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cobrar Saldo Pendiente"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit}>Registrar Cobro</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
          <p className="text-sm text-slate-600 mb-1">Cliente</p>
          <p className="font-bold text-slate-800 text-lg mb-4">{sale.customer_name}</p>
          
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-sm text-slate-500">Precio Total</span>
            <span className="font-medium text-slate-700">{sale.sale_currency === 'USD' ? '$' : 'S/'} {sale.total_price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-slate-200">
            <span className="text-sm text-slate-500">Pagado hasta ahora</span>
            <span className="font-medium text-emerald-600">{sale.sale_currency === 'USD' ? '$' : 'S/'} {sale.amount_paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-bold text-slate-700">Saldo Pendiente</span>
            <span className="font-bold text-rose-600 text-lg">{sale.sale_currency === 'USD' ? '$' : 'S/'} {sale.pending_amount.toFixed(2)}</span>
          </div>
        </div>

        <AmountInput
          label="Monto a Cobrar Ahora"
          currency={sale.sale_currency}
          value={amountToCollect}
          onChange={(e) => setAmountToCollect(e.target.value)}
          autoFocus
        />
        
        <p className="text-xs text-slate-500 mt-2">
          Si el monto cobrado iguala el saldo pendiente, el equipo pasará a estado "Vendido".
        </p>
      </form>
    </Modal>
  );
}
