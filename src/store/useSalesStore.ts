import { create } from 'zustand';
import { supabase } from '../db/database';
import { Sale, LedgerEntry, Currency } from '../types/models';

interface SalesState {
  registerSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  collectPending: (saleId: string, amountToCollect: number, currency: Currency) => Promise<void>;
}

const getLastEntry = async () => {
  const { data } = await supabase
    .from('ledger')
    .select('balance_pen, balance_usd')
    .order('date', { ascending: false })
    .limit(1)
    .single();
  return { currentPen: data?.balance_pen || 0, currentUsd: data?.balance_usd || 0 };
};

export const useSalesStore = create<SalesState>(() => ({
  registerSale: async (sale) => {
    // 1. Obtener producto para conocer su costo
    const { data: product, error: productFetchError } = await supabase
      .from('products')
      .select('name, total_cost_usd, total_cost_pen, manual_exchange_rate')
      .eq('id', sale.product_id)
      .single();
    if (productFetchError || !product) throw new Error('Producto no encontrado');

    // 2. Guardar venta
    const { error: saleError } = await supabase.from('sales').insert(sale);
    if (saleError) throw new Error(saleError.message);

    // 3. Actualizar estado del producto
    const newStatus = sale.is_fully_paid ? 'Vendido' : 'Reservado';
    const { error: productError } = await supabase
      .from('products').update({ status: newStatus }).eq('id', sale.product_id);
    if (productError) throw new Error(productError.message);

    // 4. Registrar ingreso en caja (lo que pagó el cliente)
    if (sale.amount_paid > 0) {
      const { currentPen, currentUsd } = await getLastEntry();
      const entry: Omit<LedgerEntry, 'id'> = {
        date: sale.sale_date,
        type: sale.is_fully_paid ? 'Venta' : 'Adelanto',
        currency: sale.sale_currency,
        amount: sale.amount_paid,
        balance_pen: sale.sale_currency === 'PEN' ? currentPen + sale.amount_paid : currentPen,
        balance_usd: sale.sale_currency === 'USD' ? currentUsd + sale.amount_paid : currentUsd,
        description: `Venta: ${product.name}${sale.is_fully_paid ? '' : ' (Adelanto)'} — Cliente: ${sale.customer_name}`,
        product_id: sale.product_id,
      };
      const { error: ledgerError } = await supabase.from('ledger').insert(entry);
      if (ledgerError) throw new Error(ledgerError.message);
    }

    // 5. Registrar egreso del costo del producto (salida de inventario valorizado)
    //    Solo cuando la venta está completamente pagada
    if (sale.is_fully_paid) {
      const { currentPen, currentUsd } = await getLastEntry();
      const costoEntry: Omit<LedgerEntry, 'id'> = {
        date: sale.sale_date,
        type: 'CostoVenta',
        currency: 'USD',
        amount: -product.total_cost_usd,
        balance_pen: currentPen,
        balance_usd: currentUsd - product.total_cost_usd,
        description: `Costo de venta: ${product.name} — Cliente: ${sale.customer_name}`,
        product_id: sale.product_id,
      };
      const { error: costoError } = await supabase.from('ledger').insert(costoEntry);
      if (costoError) throw new Error(costoError.message);
    }
  },

  collectPending: async (saleId, amountToCollect, currency) => {
    // 1. Obtener venta y producto
    const { data: sale, error: fetchError } = await supabase
      .from('sales').select().eq('id', saleId).single();
    if (fetchError || !sale) throw new Error('Venta no encontrada');
    if (sale.pending_amount < amountToCollect) throw new Error('El cobro supera el monto pendiente');

    const { data: product } = await supabase
      .from('products')
      .select('name, total_cost_usd, total_cost_pen')
      .eq('id', sale.product_id)
      .single();

    const newPending = sale.pending_amount - amountToCollect;
    const isFullyPaid = newPending <= 0;

    // 2. Actualizar venta
    const { error: saleError } = await supabase.from('sales')
      .update({ amount_paid: sale.amount_paid + amountToCollect, pending_amount: newPending, is_fully_paid: isFullyPaid })
      .eq('id', saleId);
    if (saleError) throw new Error(saleError.message);

    // 3. Si pagó completo, marcar producto como Vendido
    if (isFullyPaid) {
      await supabase.from('products').update({ status: 'Vendido' }).eq('id', sale.product_id);
    }

    // 4. Registrar ingreso del cobro
    const { currentPen, currentUsd } = await getLastEntry();
    const entry: Omit<LedgerEntry, 'id'> = {
      date: new Date(),
      type: 'Venta',
      currency,
      amount: amountToCollect,
      balance_pen: currency === 'PEN' ? currentPen + amountToCollect : currentPen,
      balance_usd: currency === 'USD' ? currentUsd + amountToCollect : currentUsd,
      description: `Cobro pendiente: ${sale.customer_name}`,
      product_id: sale.product_id,
    };
    const { error: ledgerError } = await supabase.from('ledger').insert(entry);
    if (ledgerError) throw new Error(ledgerError.message);

    // 5. Si con este cobro quedó saldado, registrar egreso del costo
    if (isFullyPaid && product) {
      const { currentPen: p2, currentUsd: u2 } = await getLastEntry();
      const costoEntry: Omit<LedgerEntry, 'id'> = {
        date: new Date(),
        type: 'CostoVenta',
        currency: 'USD',
        amount: -product.total_cost_usd,
        balance_pen: p2,
        balance_usd: u2 - product.total_cost_usd,
        description: `Costo de venta: ${product.name} — Cliente: ${sale.customer_name}`,
        product_id: sale.product_id,
      };
      await supabase.from('ledger').insert(costoEntry);
    }
  },
}));
