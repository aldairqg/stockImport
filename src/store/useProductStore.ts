import { create } from 'zustand';
import { db } from '../db/database';
import { Product, ProductStatus, LedgerEntry } from '../types/models';

interface ProductState {
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProductStatus: (id: string, status: ProductStatus) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

export const useProductStore = create<ProductState>(() => ({
  addProduct: async (product: Omit<Product, 'id'>) => {
    await db.transaction('rw', db.products, db.ledger, async () => {
      // 1. Verificar saldo USD
      const lastEntry = await db.ledger.orderBy('date').last();
      const currentPen = lastEntry?.balance_pen || 0;
      const currentUsd = lastEntry?.balance_usd || 0;

      if (currentUsd < product.total_cost_usd) {
        throw new Error('Saldo USD insuficiente en caja para registrar esta compra');
      }

      // 2. Guardar producto
      const productId = await db.products.add(product as Product);

      // 3. Registrar en Ledger (salida de dinero)
      const ledgerEntry: LedgerEntry = {
        date: product.purchase_date,
        type: 'Compra',
        currency: 'USD',
        amount: -product.total_cost_usd,
        balance_pen: currentPen,
        balance_usd: currentUsd - product.total_cost_usd,
        description: `Compra: ${product.name}${product.variante ? ' ' + product.variante : ''}`,
        product_id: productId
      };
      await db.ledger.add(ledgerEntry);
    });
  },

  updateProductStatus: async (id: string, status: ProductStatus) => {
    const updates: Partial<Product> = { status };
    if (status === 'EnStock') {
      updates.arrival_date = new Date();
    }
    await db.products.update(id, updates);
  },
  
  updateProduct: async (id: string, updates: Partial<Product>) => {
    await db.products.update(id, updates);
  },

  deleteProduct: async (id: string) => {
    await db.transaction('rw', db.products, db.ledger, db.sales, async () => {
      // Opcional: Podríamos revertir el dinero en la caja si se borra un producto,
      // pero usualmente borrar es por error. Si se borra, también se pueden borrar sus ventas asociadas.
      await db.sales.where('product_id').equals(id).delete();
      await db.products.delete(id);
    });
  }
}));
