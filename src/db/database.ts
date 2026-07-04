import Dexie, { Table } from 'dexie';
import { LedgerEntry, Product, Sale, Simulation } from '../types/models';

export class AppDatabase extends Dexie {
  ledger!: Table<LedgerEntry, string>;
  products!: Table<Product, string>;
  sales!: Table<Sale, string>;
  simulations!: Table<Simulation, string>;

  constructor() {
    super('JAIFONDatabase');
    this.version(3).stores({
      ledger: '++id, date, type, currency, product_id',
      products: '++id, status, purchase_date, serie',
      sales: '++id, product_id, is_fully_paid, sale_date',
      simulations: '++id, created_at'
    });
  }
}

export const db = new AppDatabase();
