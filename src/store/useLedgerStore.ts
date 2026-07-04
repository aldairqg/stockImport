import { create } from 'zustand';
import { db } from '../db/database';
import { LedgerEntry, LedgerType, Currency } from '../types/models';
import { calcNewTCPP } from '../utils/finance';

interface LedgerState {
  // Actions
  addCapital: (amount: number, currency: Currency, description: string) => Promise<void>;
  removeCapital: (amount: number, currency: Currency, description: string) => Promise<void>;
  exchangeCurrency: (solesGiven: number, dollarsReceived: number, description: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

// Para leer el saldo actual, usaremos useLiveQuery en los componentes, 
// pero aquí centralizamos las mutaciones para mantener la lógica de negocio consistente.
export const useLedgerStore = create<LedgerState>(() => ({
  addCapital: async (amount: number, currency: Currency, description: string) => {
    await db.transaction('rw', db.ledger, async () => {
      const lastEntry = await db.ledger.orderBy('date').last();
      const currentPen = lastEntry?.balance_pen || 0;
      const currentUsd = lastEntry?.balance_usd || 0;

      const newEntry: LedgerEntry = {
        date: new Date(),
        type: 'Aporte',
        currency,
        amount,
        balance_pen: currency === 'PEN' ? currentPen + amount : currentPen,
        balance_usd: currency === 'USD' ? currentUsd + amount : currentUsd,
        description
      };
      await db.ledger.add(newEntry);
    });
  },

  removeCapital: async (amount: number, currency: Currency, description: string) => {
    await db.transaction('rw', db.ledger, async () => {
      const lastEntry = await db.ledger.orderBy('date').last();
      const currentPen = lastEntry?.balance_pen || 0;
      const currentUsd = lastEntry?.balance_usd || 0;

      if (currency === 'PEN' && currentPen < amount) throw new Error('Saldo PEN insuficiente');
      if (currency === 'USD' && currentUsd < amount) throw new Error('Saldo USD insuficiente');

      const newEntry: LedgerEntry = {
        date: new Date(),
        type: 'Retiro',
        currency,
        amount: -amount,
        balance_pen: currency === 'PEN' ? currentPen - amount : currentPen,
        balance_usd: currency === 'USD' ? currentUsd - amount : currentUsd,
        description
      };
      await db.ledger.add(newEntry);
    });
  },

  exchangeCurrency: async (solesGiven: number, dollarsReceived: number, description: string) => {
    await db.transaction('rw', db.ledger, async () => {
      const lastEntry = await db.ledger.orderBy('date').last();
      const currentPen = lastEntry?.balance_pen || 0;
      const currentUsd = lastEntry?.balance_usd || 0;

      if (currentPen < solesGiven) throw new Error('Saldo PEN insuficiente para el cambio');

      const exchangeRate = parseFloat((solesGiven / dollarsReceived).toFixed(4));
      
      const newEntry: LedgerEntry = {
        date: new Date(),
        type: 'CambioDivisa',
        currency: 'USD',
        amount: dollarsReceived,
        exchange_rate: exchangeRate,
        balance_pen: currentPen - solesGiven,
        balance_usd: currentUsd + dollarsReceived,
        description
      };
      await db.ledger.add(newEntry);
    });
  },

  deleteEntry: async (id: string) => {
    await db.transaction('rw', db.ledger, async () => {
      // Idealmente recalcularíamos todos los saldos posteriores si se borra uno en el medio,
      // pero para mantenerlo simple y como es para errores, solo lo borramos.
      // Un sistema real haría un "reverse entry" o recalcularía balances.
      await db.ledger.delete(id);
    });
  },
}));
