import { create } from 'zustand';
import { db } from '../db/database';
import { Sale, LedgerEntry, Currency } from '../types/models';

interface SalesState {
  registerSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  collectPending: (saleId: string, amountToCollect: number, currency: Currency) => Promise<void>;
}

export const useSalesStore = create<SalesState>(() => ({
  registerSale: async (sale: Omit<Sale, 'id'>) => {
    await db.transaction('rw', db.sales, db.products, db.ledger, async () => {
      // 1. Guardar la venta
      const saleId = await db.sales.add(sale as Sale);

      // 2. Actualizar estado del producto
      const newStatus = sale.is_fully_paid ? 'Vendido' : 'Reservado';
      await db.products.update(sale.product_id, { status: newStatus });

      // 3. Registrar ingreso en Caja (por el monto pagado)
      if (sale.amount_paid > 0) {
        const lastEntry = await db.ledger.orderBy('date').last();
        const currentPen = lastEntry?.balance_pen || 0;
        const currentUsd = lastEntry?.balance_usd || 0;

        const ledgerEntry: LedgerEntry = {
          date: sale.sale_date,
          type: sale.is_fully_paid ? 'Venta' : 'Adelanto',
          currency: sale.sale_currency,
          amount: sale.amount_paid,
          balance_pen: sale.sale_currency === 'PEN' ? currentPen + sale.amount_paid : currentPen,
          balance_usd: sale.sale_currency === 'USD' ? currentUsd + sale.amount_paid : currentUsd,
          description: `Venta: ${sale.customer_name} ${sale.is_fully_paid ? '' : '(Adelanto)'}`,
          product_id: sale.product_id
        };
        await db.ledger.add(ledgerEntry);
      }
    });
  },

  collectPending: async (saleId: string, amountToCollect: number, currency: Currency) => {
    await db.transaction('rw', db.sales, db.products, db.ledger, async () => {
      const sale = await db.sales.get(saleId);
      if (!sale) throw new Error('Venta no encontrada');
      if (sale.pending_amount < amountToCollect) throw new Error('El cobro supera el monto pendiente');

      const newPending = sale.pending_amount - amountToCollect;
      const isFullyPaid = newPending <= 0;

      // 1. Actualizar Venta
      await db.sales.update(saleId, {
        amount_paid: sale.amount_paid + amountToCollect,
        pending_amount: newPending,
        is_fully_paid: isFullyPaid
      });

      // 2. Si se pagó completo, actualizar producto a 'Vendido'
      if (isFullyPaid) {
        await db.products.update(sale.product_id, { status: 'Vendido' });
      }

      // 3. Registrar ingreso en Caja
      const lastEntry = await db.ledger.orderBy('date').last();
      const currentPen = lastEntry?.balance_pen || 0;
      const currentUsd = lastEntry?.balance_usd || 0;

      const ledgerEntry: LedgerEntry = {
        date: new Date(),
        type: 'Venta',
        currency,
        amount: amountToCollect,
        balance_pen: currency === 'PEN' ? currentPen + amountToCollect : currentPen,
        balance_usd: currency === 'USD' ? currentUsd + amountToCollect : currentUsd,
        description: `Cobro saldo pendiente: ${sale.customer_name}`,
        product_id: sale.product_id
      };
      await db.ledger.add(ledgerEntry);
    });
  }
}));
