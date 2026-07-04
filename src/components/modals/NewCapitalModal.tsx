import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { CurrencyToggle } from '../ui/CurrencyToggle';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useToastStore } from '../../store/useToastStore';
import { Currency } from '../../types/models';

interface NewCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'Aporte' | 'Retiro';
}

export function NewCapitalModal({ isOpen, onClose, type }: NewCapitalModalProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('PEN');
  const [description, setDescription] = useState('');
  
  const { addCapital, removeCapital } = useLedgerStore();
  const { addToast } = useToastStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    
    if (!numAmount || numAmount <= 0) {
      addToast('Ingrese un monto válido mayor a 0', 'error');
      return;
    }
    
    try {
      if (type === 'Aporte') {
        await addCapital(numAmount, currency, description || 'Aporte de capital');
        addToast('Capital agregado correctamente', 'success');
      } else {
        await removeCapital(numAmount, currency, description || 'Retiro de capital');
        addToast('Retiro registrado correctamente', 'success');
      }
      onClose();
      setAmount('');
      setDescription('');
    } catch (error: any) {
      addToast(error.message || 'Error al procesar la operación', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={type === 'Aporte' ? 'Ingresar Capital' : 'Retirar Capital'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit}>Confirmar {type}</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-center mb-6">
          <CurrencyToggle value={currency} onChange={setCurrency} />
        </div>
        
        <AmountInput
          label="Monto"
          currency={currency}
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          placeholder="0.00"
          autoFocus
        />

        <div className="flex flex-col space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Motivo (Opcional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={type === 'Aporte' ? 'Ej. Ahorros' : 'Ej. Gastos personales'}
            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
          />
        </div>
      </form>
    </Modal>
  );
}
