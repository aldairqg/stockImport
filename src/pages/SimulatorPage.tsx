import React, { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { useSimulationStore } from '../store/useSimulationStore';
import { useToastStore } from '../store/useToastStore';
import { Button } from '../components/ui/Button';
import { AmountInput } from '../components/ui/AmountInput';
import { Calculator, Save, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { formatPEN, formatUSD } from '../utils/finance';

const DEFAULT_SETTINGS = {
  tax_usa_rate: 0.07,
  freight_cost_usd: 25,
  operational_cost_usd: 5,
  peru_import_tax_rate: 0.24,
  peru_import_threshold: 200,
  red_channel_cost_usd: 15,
};

export default function SimulatorPage() {
  const { addSimulation, deleteSimulation, convertToProduct } = useSimulationStore();
  const { addToast } = useToastStore();
  
  const simulations = useLiveQuery(() => db.simulations.orderBy('created_at').reverse().toArray());
  const ledgerEntries = useLiveQuery(() => db.ledger.orderBy('date').toArray());
  
  // Extraer último TC de la caja
  const tcpp = useMemo(() => {
    if (!ledgerEntries) return 3.8;
    const lastExchange = ledgerEntries.filter(el => el.type === 'CambioDivisa').pop();
    return lastExchange ? lastExchange.exchange_rate || 3.8 : 3.8;
  }, [ledgerEntries]);

  // Form State
  const [name, setName] = useState('');
  const [variante, setVariante] = useState('');
  const [color, setColor] = useState('');
  
  const [priceUsd, setPriceUsd] = useState('');
  const [taxUsaRate, setTaxUsaRate] = useState(DEFAULT_SETTINGS.tax_usa_rate * 100);
  const [freightCost, setFreightCost] = useState(DEFAULT_SETTINGS.freight_cost_usd);
  const [opCost, setOpCost] = useState(DEFAULT_SETTINGS.operational_cost_usd);
  const [peruTaxRate, setPeruTaxRate] = useState(0);
  const [redChannel, setRedChannel] = useState(DEFAULT_SETTINGS.red_channel_cost_usd);
  
  const [expectedSalePricePen, setExpectedSalePricePen] = useState('');
  const [targetMargin, setTargetMargin] = useState(''); // Nuevo input para %
  const [tcManual, setTcManual] = useState('');

  useEffect(() => {
    if (tcpp && !tcManual) setTcManual(String(tcpp));
  }, [tcpp]);

  // Calculations
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
  
  const totalCostUsd = numPrice + taxUsaAmount + freightCost + opCost + peruTaxAmount + redChannel;
  const numTcManual = parseFloat(tcManual) || tcpp;
  const totalCostPen = totalCostUsd * numTcManual;

  const expectedSaleNum = parseFloat(expectedSalePricePen) || 0;
  const expectedProfitPen = expectedSaleNum > 0 ? expectedSaleNum - totalCostPen : 0;
  const expectedRoi = totalCostPen > 0 && expectedSaleNum > 0 ? (expectedProfitPen / totalCostPen) * 100 : 0;

  // Sincronizar Precio de Venta <-> Margen
  const handleMarginChange = (val: string) => {
    setTargetMargin(val);
    const margin = parseFloat(val);
    if (!isNaN(margin) && totalCostPen > 0) {
      const newPrice = totalCostPen * (1 + margin / 100);
      setExpectedSalePricePen(newPrice.toFixed(2));
    } else {
      setExpectedSalePricePen('');
    }
  };

  const handleSalePriceChange = (val: string) => {
    setExpectedSalePricePen(val);
    const price = parseFloat(val);
    if (!isNaN(price) && totalCostPen > 0) {
      const margin = ((price - totalCostPen) / totalCostPen) * 100;
      setTargetMargin(margin.toFixed(1));
    } else {
      setTargetMargin('');
    }
  };

  // Semáforo Color
  const getRoiColor = (roi: number) => {
    if (roi <= 0) return 'text-slate-400 bg-slate-100 border-slate-200';
    if (roi < 10) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (roi < 20) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const handleSaveSimulation = async () => {
    if (!name || numPrice <= 0) {
      addToast('Falta nombre o precio base', 'error');
      return;
    }
    try {
      await addSimulation({
        name,
        variante,
        color,
        purchase_price_usd: numPrice,
        tax_usa_rate: taxUsaRate / 100,
        tax_usa_amount: taxUsaAmount,
        freight_cost_usd: freightCost,
        operational_cost_usd: opCost,
        peru_import_tax_rate: peruTaxRate / 100,
        peru_import_tax_amount: peruTaxAmount,
        red_channel_cost_usd: redChannel,
        other_costs_usd: 0,
        total_cost_usd: totalCostUsd,
        exchange_rate: numTcManual,
        total_cost_pen: totalCostPen,
        expected_sale_price_pen: expectedSaleNum,
        expected_profit_pen: expectedProfitPen,
        expected_roi: expectedRoi,
        created_at: new Date()
      });
      addToast('Simulación guardada', 'success');
      setName(''); setPriceUsd(''); setExpectedSalePricePen(''); setTargetMargin(''); setVariante(''); setColor('');
    } catch (e: any) {
      addToast(e.message || 'Error al guardar', 'error');
    }
  };

  const handleBuy = async (sim: any) => {
    if (window.confirm(`¿Estás seguro de registrar la compra de ${sim.name}? Esto descontará saldo USD de tu caja.`)) {
      try {
        await convertToProduct(sim);
        addToast('¡Compra registrada exitosamente!', 'success');
      } catch (e: any) {
        addToast(e.message || 'Error al registrar la compra', 'error');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-brand-600" /> Simulador de Compras
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORMULARIO */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 border-b pb-2">Datos del Equipo</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-sm font-medium text-slate-700">Nombre del Producto</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" placeholder="Ej. iPhone 15, Zapatillas Nike" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Variante <span className="text-slate-400">(opcional)</span></label>
              <input type="text" value={variante} onChange={e => setVariante(e.target.value)} placeholder="256GB, Talla 42" className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Color <span className="text-slate-400">(opcional)</span></label>
              <input type="text" value={color} onChange={e => setColor(e.target.value)} placeholder="Negro, Azul" className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 border-b pb-2 pt-2">Costos</h2>
          <div className="grid grid-cols-2 gap-4">
            <AmountInput label="Precio Base (USD)" currency="USD" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} />
            <div>
              <label className="text-sm font-medium text-slate-700">Tax USA (%)</label>
              <input type="number" step="0.1" value={taxUsaRate} onChange={e => setTaxUsaRate(parseFloat(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Flete ($)</label>
              <input type="number" value={freightCost} onChange={e => setFreightCost(parseFloat(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Tax Perú (%)</label>
              <input type="number" value={peruTaxRate} onChange={e => setPeruTaxRate(parseFloat(e.target.value) || 0)} className="mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm" />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium text-brand-700">Tipo de Cambio Actual</label>
              <input type="number" step="0.001" value={tcManual} onChange={e => setTcManual(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-brand-200 bg-brand-50 rounded-lg sm:text-sm" />
            </div>
          </div>

          <h2 className="text-lg font-bold text-slate-800 border-b pb-2 pt-2">Proyección de Venta</h2>
          <div className="grid grid-cols-2 gap-4 items-end">
            <div>
              <label className="text-sm font-medium text-slate-700">Margen Deseado (%)</label>
              <div className="relative mt-1">
                <input 
                  type="number" 
                  step="0.1"
                  value={targetMargin} 
                  onChange={e => handleMarginChange(e.target.value)} 
                  placeholder="Ej. 30"
                  className="block w-full pl-3 pr-8 py-2 border rounded-lg sm:text-sm focus:ring-2 focus:ring-brand-500" 
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-slate-400 sm:text-sm">%</span>
                </div>
              </div>
            </div>
            
            <AmountInput 
              label="Precio de Venta (S/)" 
              currency="PEN" 
              value={expectedSalePricePen} 
              onChange={e => handleSalePriceChange(e.target.value)} 
            />
          </div>

          <Button variant="secondary" className="w-full mt-4" onClick={handleSaveSimulation}>
            <Save className="w-4 h-4 mr-2" /> Guardar Simulación
          </Button>
        </div>

        {/* RESULTADOS Y SEMÁFORO */}
        <div className="space-y-6">
          <div className="bg-slate-800 text-white p-6 rounded-2xl shadow-md">
            <h2 className="text-lg font-medium text-slate-300 mb-4">Resumen de Costos</h2>
            <div className="space-y-3 mb-6 border-b border-slate-700 pb-6">
              <div className="flex justify-between">
                <span className="text-slate-400">Precio Producto:</span>
                <span>${numPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Impuestos (USA + PER):</span>
                <span>${(taxUsaAmount + peruTaxAmount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Logística e Internamiento:</span>
                <span>${(freightCost + opCost + redChannel).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-brand-400 pt-2 border-t border-slate-700 mt-2">
                <span>Costo Total:</span>
                <span>${totalCostUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-white">
                <span>Costo en Soles:</span>
                <span>S/ {totalCostPen.toFixed(2)}</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border-2 ${getRoiColor(expectedRoi)} transition-colors duration-300`}>
              <h3 className="font-bold mb-2 flex items-center justify-between">
                Proyección de Ganancia
                {expectedRoi >= 20 && <span>🟢 Excelente</span>}
                {expectedRoi >= 10 && expectedRoi < 20 && <span>🟡 Aceptable</span>}
                {expectedRoi > 0 && expectedRoi < 10 && <span>🔴 Riesgoso</span>}
              </h3>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm opacity-80 mb-1">Utilidad Neta</p>
                  <p className="text-2xl font-black">S/ {expectedProfitPen.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80 mb-1">ROI (Retorno)</p>
                  <p className="text-2xl font-black">{expectedRoi.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LISTA DE SIMULACIONES GUARDADAS */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Simulaciones Guardadas</h2>
        
        {(!simulations || simulations.length === 0) ? (
          <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center text-slate-500">
            <Calculator className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p>No tienes simulaciones guardadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {simulations.map(sim => (
              <div key={sim.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-800">{sim.name}{sim.variante ? ' ' + sim.variante : ''}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold border ${getRoiColor(sim.expected_roi)}`}>
                      ROI {sim.expected_roi.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="text-sm text-slate-600 space-y-1 mb-4">
                    <div className="flex justify-between"><span>Costo Total:</span> <span>{formatUSD(sim.total_cost_usd)}</span></div>
                    <div className="flex justify-between"><span>Venta Esperada:</span> <span>{formatPEN(sim.expected_sale_price_pen)}</span></div>
                    <div className="flex justify-between font-medium text-emerald-600"><span>Ganancia:</span> <span>{formatPEN(sim.expected_profit_pen)}</span></div>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => deleteSimulation(sim.id!)}
                    className="text-slate-400 hover:text-rose-600 p-2 transition-colors"
                    title="Eliminar Simulación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <Button variant="primary" size="sm" onClick={() => handleBuy(sim)} className="w-full">
                    <ShoppingCart className="w-4 h-4 mr-2" /> Comprar Equipo
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
