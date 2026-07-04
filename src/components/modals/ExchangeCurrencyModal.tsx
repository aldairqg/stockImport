import { useState, useMemo } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useToastStore } from '../../store/useToastStore';
import { ArrowRightLeft } from 'lucide-react';

interface ExchangeCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExchangeCurrencyModal({ isOpen, onClose }: ExchangeCurrencyModalProps) {
  const [solesGiven, setSolesGiven] = useState('');
  const [dollarsReceived, setDollarsReceived] = useState('');
  const [description, setDescription] = useState('Cambio de divisa (Compra de dólares)');
  
  const { exchangeCurrency } = useLedgerStore();
  const { addToast } = useToastStore();

  const numSoles = parseFloat(solesGiven) || 0;
  const numDollars = parseFloat(dollarsReceived) || 0;
  
  const currentTC = useMemo(() => {
    if (numSoles > 0 && numDollars > 0) {
      return (numSoles / numDollars).toFixed(4);
    }
    return '0.0000';
  }, [numSoles, numDollars]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numSoles <= 0 || numDollars <= 0) {
      addToast('Ingrese montos válidos', 'error');
      return;
    }
    
    try {
      await exchangeCurrency(numSoles, numDollars, description);
      addToast('Cambio de divisa registrado exitosamente', 'success');
      onClose();
      setSolesGiven('');
      setDollarsReceived('');
    } catch (error: any) {
      addToast(error.message || 'Error al cambiar divisa', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cambiar Divisa"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit}>Registrar Cambio</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <AmountInput
              label="Entregas (Soles)"
              currency="PEN"
              value={solesGiven}
              onChange={(e) => setSolesGiven(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="pt-6">
            <ArrowRightLeft className="text-slate-400 w-6 h-6" />
          </div>
          <div className="flex-1">
            <AmountInput
              label="Recibes (Dólares)"
              currency="USD"
              value={dollarsReceived}
              onChange={(e) => setDollarsReceived(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 flex justify-between items-center">
          <span className="text-sm font-medium text-brand-800">Tipo de Cambio Calculado:</span>
          <span className="text-lg font-bold text-brand-600">S/ {currentTC}</span>
        </div>

        <div className="flex flex-col space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
          />
        </div>
      </form>
    </Modal>
  );
}
