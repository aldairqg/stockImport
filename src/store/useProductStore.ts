import { create } from 'zustand';
import { supabase } from '../db/database';
import { Product, ProductStatus, LedgerEntry } from '../types/models';

interface ProductState {
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProductStatus: (id: string, status: ProductStatus) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>(() => ({
  addProduct: async (product) => {
    // 1. Verificar saldo USD
    const { data: lastEntry } = await supabase
      .from('ledger')
      .select('balance_usd, balance_pen')
      .order('date', { ascending: false })
      .limit(1)
      .single();

    const currentPen = lastEntry?.balance_pen || 0;
    const currentUsd = lastEntry?.balance_usd || 0;

    if (currentUsd < product.total_cost_usd) {
      throw new Error('Saldo USD insuficiente en caja para registrar esta compra');
    }

    // 2. Guardar producto
    const { data: newProduct, error: productError } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (productError) throw new Error(productError.message);

    // 3. Registrar en Ledger
    const ledgerEntry: Omit<LedgerEntry, 'id'> = {
      date: product.purchase_date,
      type: 'Compra',
      currency: 'USD',
      amount: -product.total_cost_usd,
      balance_pen: currentPen,
      balance_usd: currentUsd - product.total_cost_usd,
      description: `Compra: ${product.name}${product.variante ? ' ' + product.variante : ''}`,
      product_id: newProduct.id,
    };

    const { error: ledgerError } = await supabase.from('ledger').insert(ledgerEntry);
    if (ledgerError) throw new Error(ledgerError.message);
  },

  updateProductStatus: async (id, status) => {
    const updates: Partial<Product> = { status };
    if (status === 'EnStock') {
      updates.arrival_date = new Date();
    }
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  },

  updateProduct: async (id, updates) => {
    const { error } = await supabase.from('products').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  },

  deleteProduct: async (id) => {
    const { error: salesError } = await supabase.from('sales').delete().eq('product_id', id);
    if (salesError) throw new Error(salesError.message);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
}));
