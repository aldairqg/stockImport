export type Currency = 'PEN' | 'USD';
export type LedgerType = 'Aporte' | 'Retiro' | 'Compra' | 'Venta' | 'Adelanto' | 'CambioDivisa' | 'CostoVenta';
export type ProductStatus = 'Comprado' | 'EnTransito' | 'EnStock' | 'Reservado' | 'Vendido';

export interface LedgerEntry {
  id?: string;
  date: Date;
  type: LedgerType;
  currency: Currency;
  amount: number;
  exchange_rate?: number;
  balance_pen: number;
  balance_usd: number;
  description: string;
  product_id?: string;
}

export interface Product {
  id?: string;
  name: string;
  color?: string;
  variante?: string;   // Ej: talla, capacidad, versión
  serie?: string;      // Ej: IMEI, número de serie, código de lote
  notes?: string;
  purchase_price_usd: number;
  tax_usa_rate: number;
  tax_usa_amount: number;
  freight_cost_usd: number;
  operational_cost_usd: number;
  peru_import_tax_rate: number;
  peru_import_tax_amount: number;
  red_channel_cost_usd: number;
  other_costs_usd: number;
  total_cost_usd: number;
  manual_exchange_rate: number;
  total_cost_pen: number;
  purchase_date: Date;
  arrival_date?: Date;
  status: ProductStatus;
}

export interface Sale {
  id?: string;
  product_id: string;
  customer_name: string;
  sale_date: Date;
  sale_currency: Currency;
  total_price: number;
  amount_paid: number;
  pending_amount: number;
  is_fully_paid: boolean;
  delivery_date?: Date;
}

export interface Simulation {
  id?: string;
  name: string;
  variante?: string;
  color?: string;
  purchase_price_usd: number;
  tax_usa_rate: number;
  tax_usa_amount: number;
  freight_cost_usd: number;
  operational_cost_usd: number;
  peru_import_tax_rate: number;
  peru_import_tax_amount: number;
  red_channel_cost_usd: number;
  other_costs_usd: number;
  total_cost_usd: number;
  exchange_rate: number;
  total_cost_pen: number;
  
  expected_sale_price_pen: number;
  expected_profit_pen: number;
  expected_roi: number;
  
  created_at: Date;
}
