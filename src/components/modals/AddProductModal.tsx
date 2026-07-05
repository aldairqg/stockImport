import { useState, useMemo, useEffect } from 'react';
import { useLedger } from '../../hooks/useSupabaseQuery';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AmountInput } from '../ui/AmountInput';
import { useProductStore } from '../../store/useProductStore';
import { useToastStore } from '../../store/useToastStore';
import { calcSuggestedPrice } from '../../utils/finance';
import { Product } from '../../types/models';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Valores por defecto (idealmente vendrían de un store de Settings)
const DEFAULT_SETTINGS = {
  tax_usa_rate: 0.07,
  freight_cost_usd: 25,
  operational_cost_usd: 5,
  peru_import_tax_rate: 0.24,
  peru_import_threshold: 200,
  red_channel_cost_usd: 15,
  target_margin_percent: 25,
};

export function AddProductModal({ isOpen, onClose }: AddProductModalProps) {
  const [step, setStep] = useState(1);
  const { addProduct } = useProductStore();
  const { addToast } = useToastStore();
  
  // Info Form
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [variante, setVariante] = useState('');
  const [serie, setSerie] = useState('');
  const [notes, setNotes] = useState('');

  // Costs Form
  const [priceUsd, setPriceUsd] = useState('');
  const [taxUsaRate, setTaxUsaRate] = useState(DEFAULT_SETTINGS.tax_usa_rate * 100);
  const [freightCost, setFreightCost] = useState(DEFAULT_SETTINGS.freight_cost_usd);
  const [opCost, setOpCost] = useState(DEFAULT_SETTINGS.operational_cost_usd);
  const [peruTaxRate, setPeruTaxRate] = useState(0); // 0 by default, auto-updated if > 200
  const [redChannel, setRedChannel] = useState(DEFAULT_SETTINGS.red_channel_cost_usd);
  const [otherCosts, setOtherCosts] = useState(0);
  
  const ledgerEntries = useLedger();
  const tcpp = useMemo(() => {
    if (!ledgerEntries) return 3.8;
    const lastExchange = ledgerEntries.filter(el => el.type === 'CambioDivisa').pop();
    return lastExchange ? lastExchange.exchange_rate || 3.8 : 3.8;
  }, [ledgerEntries]);

  const [tcManual, setTcManual] = useState(String(tcpp));

  useEffect(() => {
    if (tcpp && !tcManual) setTcManual(String(tcpp));
  }, [tcpp]);

  // Cálculos reactivos
  const numPrice = parseFloat(priceUsd) || 0;
  
  // Auto-detect Peru Tax
  useEffect(() => {
    if (numPrice > DEFAULT_SETTINGS.peru_import_threshold) {
      setPeruTaxRate(DEFAULT_SETTINGS.peru_import_tax_rate * 100);
    } else {
      setPeruTaxRate(0);
    }
  }, [numPrice]);

  const taxUsaAmount = numPrice * (taxUsaRate / 100);
  const peruTaxAmount = numPrice * (peruTaxRate / 100);
  
  const totalCostUsd = numPrice + taxUsaAmount + freightCost + opCost + peruTaxAmount + redChannel + otherCosts;
  const numTcManual = parseFloat(tcManual) || tcpp;
  const totalCostPen = totalCostUsd * numTcManual;
  
  const suggestedPricePen = calcSuggestedPrice(totalCostPen, DEFAULT_SETTINGS.target_margin_percent);

  const resetForm = () => {
    setStep(1);
    setName(''); setColor(''); setVariante(''); setSerie(''); setNotes('');
    setPriceUsd('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleConfirm = async () => {
    try {
      const newProduct: Omit<Product, 'id'> = {
        name, color, variante, serie, notes,
        purchase_price_usd: numPrice,
        tax_usa_rate: taxUsaRate / 100,
        tax_usa_amount: taxUsaAmount,
        freight_cost_usd: freightCost,
        operational_cost_usd: opCost,
        peru_import_tax_rate: peruTaxRate / 100,
        peru_import_tax_amount: peruTaxAmount,
        red_channel_cost_usd: redChannel,
        other_costs_usd: otherCosts,
        total_cost_usd: totalCostUsd,
        manual_exchange_rate: numTcManual,
        total_cost_pen: totalCostPen,
        purchase_date: new Date(),
        status: 'Comprado'
      };

      await addProduct(newProduct);
      addToast('Producto registrado exitosamente', 'success');
      handleClose();
    } catch (error: any) {
      addToast(error.message || 'Error al registrar el producto', 'error');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Registrar Compra (Paso ${step} de 3)`}
      footer={
        <div className="flex justify-between w-full">
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep(step - 1)}>Atrás</Button>
          ) : (
            <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
          )}
          
          {step < 3 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>Siguiente</Button>
          ) : (
            <Button variant="primary" onClick={handleConfirm}>Confirmar Registro</Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-slate-800 border-b pb-2">Información del Producto</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-700">Nombre del Producto</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej. iPhone 15 Pro, Zapatillas Nike, Laptop Dell" className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Variante <span className="text-slate-400">(opcional)</span></label>
                <input type="text" value={variante} onChange={e => setVariante(e.target.value)} placeholder="Ej. 256GB, Talla 42, v2" className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Color <span className="text-slate-400">(opcional)</span></label>
                <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="Ej. Negro, Azul" className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-700">Nº de Serie / Código <span className="text-slate-400">(opcional)</span></label>
                <input type="text" value={serie} onChange={e => setSerie(e.target.value)} placeholder="Ej. IMEI, S/N, código de lote" className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium text-slate-700">Notas Adicionales</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Proveedor, condición, observaciones..." className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" rows={2}></textarea>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-slate-800 border-b pb-2">Estructura de Costos</h3>
            <div className="grid grid-cols-2 gap-4 items-end">
              <AmountInput label="Precio Base" currency="USD" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} />
              
              <div>
                <label className="text-sm font-medium text-slate-700">Tax USA (%)</label>
                <input type="number" step="0.1" value={taxUsaRate} onChange={e => setTaxUsaRate(parseFloat(e.target.value) || 0)} className="block w-full px-3 py-2 border rounded-lg sm:text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Flete ($)</label>
                <input type="number" step="1" value={freightCost} onChange={e => setFreightCost(parseFloat(e.target.value) || 0)} className="block w-full px-3 py-2 border rounded-lg sm:text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Operativo ($)</label>
                <input type="number" step="1" value={opCost} onChange={e => setOpCost(parseFloat(e.target.value) || 0)} className="block w-full px-3 py-2 border rounded-lg sm:text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Tax Perú (%) {numPrice > 200 && <span className="text-rose-500">*Aplica</span>}</label>
                <input type="number" step="1" value={peruTaxRate} onChange={e => setPeruTaxRate(parseFloat(e.target.value) || 0)} className="block w-full px-3 py-2 border rounded-lg sm:text-sm" />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Canal Rojo ($)</label>
                <input type="number" step="1" value={redChannel} onChange={e => setRedChannel(parseFloat(e.target.value) || 0)} className="block w-full px-3 py-2 border rounded-lg sm:text-sm" />
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-brand-700">Tipo de Cambio Manual (S/)</label>
                <input type="number" step="0.0001" value={tcManual} onChange={e => setTcManual(e.target.value)} className="block w-full px-3 py-2 border border-brand-300 bg-brand-50 rounded-lg sm:text-sm" />
                <p className="text-xs text-brand-600 mt-1">Sugerencia actual de tu caja: {tcpp}</p>
              </div>
            </div>
            
            {/* Calculadora en tiempo real panel */}
            <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-slate-600">Total en Dólares:</span>
                <span className="font-bold text-slate-800">${totalCostUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-brand-600">Costo Histórico Bloqueado:</span>
                <span className="font-bold text-brand-700">S/ {totalCostPen.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-slate-800 border-b pb-2">Resumen de Compra</h3>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-sm">
              <p><strong>Producto:</strong> {name}</p>
              {variante && <p><strong>Variante:</strong> {variante}</p>}
              {color && <p><strong>Color:</strong> {color}</p>}
              {serie && <p><strong>Serie:</strong> {serie}</p>}
              <div className="border-t my-2 pt-2 grid grid-cols-2 gap-y-1">
                <span className="text-slate-500">Precio Base:</span> <span className="text-right">${numPrice.toFixed(2)}</span>
                <span className="text-slate-500">Tax USA:</span> <span className="text-right">${taxUsaAmount.toFixed(2)}</span>
                <span className="text-slate-500">Logística (Flete+Op):</span> <span className="text-right">${(freightCost + opCost).toFixed(2)}</span>
                <span className="text-slate-500">Aduana (Tax+Rojo):</span> <span className="text-right">${(peruTaxAmount + redChannel).toFixed(2)}</span>
                <span className="text-slate-500">Otros:</span> <span className="text-right">${otherCosts.toFixed(2)}</span>
              </div>
              <div className="border-t mt-2 pt-2 flex justify-between items-center text-lg font-bold text-slate-800">
                <span>Total USD:</span>
                <span>${totalCostUsd.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-brand-50 p-4 rounded-xl border border-brand-200">
              <p className="text-xs text-brand-600 uppercase font-bold mb-1">Valorización (TC: {numTcManual})</p>
              <div className="flex justify-between items-center">
                <span className="text-slate-700 font-medium">Costo Histórico:</span>
                <span className="text-xl font-bold text-brand-700">S/ {totalCostPen.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-white border border-rose-100 p-3 rounded-lg text-center shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Precio Mínimo</p>
                <p className="text-rose-600 font-bold">S/ {totalCostPen.toFixed(2)}</p>
              </div>
              <div className="bg-white border border-emerald-100 p-3 rounded-lg text-center shadow-sm">
                <p className="text-xs text-slate-500 font-medium">Sugerido (+25%)</p>
                <p className="text-emerald-600 font-bold">S/ {suggestedPricePen.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
