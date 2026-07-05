import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { useProductStore } from '../../store/useProductStore';
import { useToastStore } from '../../store/useToastStore';
import { Product } from '../../types/models';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function EditProductModal({ isOpen, onClose, product }: EditProductModalProps) {
  const { updateProduct } = useProductStore();
  const { addToast } = useToastStore();
  
  // Info Form
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [variante, setVariante] = useState('');
  const [serie, setSerie] = useState('');
  const [notes, setNotes] = useState('');

  // Costs Form
  const [priceUsd, setPriceUsd] = useState('');
  const [freightCost, setFreightCost] = useState('');
  const [opCost, setOpCost] = useState('');
  const [redChannel, setRedChannel] = useState('');
  const [otherCosts, setOtherCosts] = useState('');
  const [peruTaxRate, setPeruTaxRate] = useState('');
  const [tcManual, setTcManual] = useState('');

  useEffect(() => {
    if (product && isOpen) {
      setName(product.name);
      setColor(product.color || '');
      setVariante(product.variante || '');
      setSerie(product.serie || '');
      setNotes(product.notes || '');
      
      setPriceUsd(String(product.purchase_price_usd));
      setFreightCost(String(product.freight_cost_usd));
      setOpCost(String(product.operational_cost_usd));
      setRedChannel(String(product.red_channel_cost_usd));
      setOtherCosts(String(product.other_costs_usd));
      setPeruTaxRate(String(product.peru_import_tax_rate * 100));
      setTcManual(String(product.manual_exchange_rate));
    }
  }, [product, isOpen]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !product.id) return;
    
    // Recalcular costos
    const numPrice = parseFloat(priceUsd) || 0;
    const taxUsaRate = product.tax_usa_rate; // keep original or could make editable
    const taxUsaAmount = numPrice * taxUsaRate;
    
    const numFreight = parseFloat(freightCost) || 0;
    const numOpCost = parseFloat(opCost) || 0;
    const numRedChannel = parseFloat(redChannel) || 0;
    const numOtherCosts = parseFloat(otherCosts) || 0;
    const numPeruTaxRate = (parseFloat(peruTaxRate) || 0) / 100;
    const peruTaxAmount = numPrice * numPeruTaxRate;
    const numTcManual = parseFloat(tcManual) || 3.8;
    
    const totalCostUsd = numPrice + taxUsaAmount + numFreight + numOpCost + peruTaxAmount + numRedChannel + numOtherCosts;
    const totalCostPen = totalCostUsd * numTcManual;

    try {
      const updates: Partial<Product> = {
        name, color, variante, serie, notes,
        purchase_price_usd: numPrice,
        tax_usa_amount: taxUsaAmount,
        freight_cost_usd: numFreight,
        operational_cost_usd: numOpCost,
        peru_import_tax_rate: numPeruTaxRate,
        peru_import_tax_amount: peruTaxAmount,
        red_channel_cost_usd: numRedChannel,
        other_costs_usd: numOtherCosts,
        total_cost_usd: totalCostUsd,
        manual_exchange_rate: numTcManual,
        total_cost_pen: totalCostPen,
      };

      await updateProduct(product.id, updates);
      addToast('Producto actualizado correctamente', 'success');
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Error al actualizar', 'error');
    }
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Producto"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm}>Guardar Cambios</Button>
        </div>
      }
    >
      <form onSubmit={handleConfirm} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-800 border-b pb-2">Información Principal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Variante <span className="text-slate-400">(opcional)</span></label>
              <input type="text" value={variante} onChange={e => setVariante(e.target.value)} placeholder="Ej. 256GB, Talla 42" className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Color <span className="text-slate-400">(opcional)</span></label>
              <input type="text" value={color} onChange={e => setColor(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Nº de Serie / Código <span className="text-slate-400">(opcional)</span></label>
              <input type="text" value={serie} onChange={e => setSerie(e.target.value)} placeholder="Ej. IMEI, S/N, código de lote" className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Notas</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" rows={2}></textarea>
            </div>
          </div>

          <h3 className="text-sm font-semibold text-slate-800 border-b pb-2 pt-4">Costos Reales (Se recalculará el total)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-end">
            <AmountInput label="Precio Base" currency="USD" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} />
            <div>
              <label className="text-sm font-medium text-slate-700">Flete ($)</label>
              <input type="number" step="0.1" value={freightCost} onChange={e => setFreightCost(e.target.value)} className="block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Gastos Op. ($)</label>
              <input type="number" step="0.1" value={opCost} onChange={e => setOpCost(e.target.value)} className="block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Canal Rojo ($)</label>
              <input type="number" step="0.1" value={redChannel} onChange={e => setRedChannel(e.target.value)} className="block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Otros Gastos ($)</label>
              <input type="number" step="0.1" value={otherCosts} onChange={e => setOtherCosts(e.target.value)} className="block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Tax Perú (%)</label>
              <input type="number" step="1" value={peruTaxRate} onChange={e => setPeruTaxRate(e.target.value)} className="block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-brand-700">TC Manual (S/)</label>
              <input type="number" step="0.0001" value={tcManual} onChange={e => setTcManual(e.target.value)} className="block w-full px-3 py-2 border border-brand-300 bg-brand-50 rounded-lg sm:text-sm" />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
