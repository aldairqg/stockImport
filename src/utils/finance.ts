// Calcula el Tipo de Cambio Promedio Ponderado
export function calcNewTCPP(
  currentUsdBalance: number,
  currentTCPP: number,
  newDollars: number,
  newSoles: number
): number {
  const newTC = newSoles / newDollars;
  const totalDollars = currentUsdBalance + newDollars;
  if (totalDollars === 0) return 0;
  
  const weightedAvg = (currentUsdBalance * currentTCPP + newDollars * newTC) / totalDollars;
  return parseFloat(weightedAvg.toFixed(4));
}

// Calcula la Ganancia Neta y ROI de una venta
export function calcProfit(
  costPEN: number,
  saleCurrency: 'PEN' | 'USD',
  saleAmount: number,
  currentTCPP: number // Si la venta es en USD, necesitamos convertirla a PEN con el TC actual para calcular ganancia real en PEN
): { profit: number; roi: number } {
  const salePEN = saleCurrency === 'PEN' ? saleAmount : saleAmount * currentTCPP;
  const profit = salePEN - costPEN;
  const roi = costPEN > 0 ? (profit / costPEN) * 100 : 0;
  
  return { 
    profit: parseFloat(profit.toFixed(2)), 
    roi: parseFloat(roi.toFixed(2)) 
  };
}

// Calcula el Precio Sugerido de Venta en PEN basado en un margen objetivo (%)
export function calcSuggestedPrice(costPEN: number, targetMarginPercent: number): number {
  const marginMultiplier = 1 + (targetMarginPercent / 100);
  return parseFloat((costPEN * marginMultiplier).toFixed(2));
}

// Formateadores de moneda profesionales (usando código ISO)
export const formatPEN = (amount: number) => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: 'PEN',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
  }).format(amount).replace('PEN', 'PEN').trim(); // Ensure space format
};

export const formatUSD = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'code',
    minimumFractionDigits: 2,
  }).format(amount).replace('USD', 'USD').trim();
};
