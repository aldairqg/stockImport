import { create } from 'zustand';
import { supabase } from '../db/database';
import { LedgerEntry, Currency } from '../types/models';

interface LedgerState {
  addCapital: (amount: number, currency: Currency, description: string) => Promise<void>;
  removeCapital: (amount: number, currency: Currency, description: string) => Promise<void>;
  exchangeCurrency: (solesGiven: number, dollarsReceived: number, description: string) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
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

export const useLedgerStore = create<LedgerState>(() => ({
  addCapital: async (amount, currency, description) => {
    const { currentPen, currentUsd } = await getLastEntry();
    const entry: Omit<LedgerEntry, 'id'> = {
      date: new Date(),
      type: 'Aporte',
      currency,
      amount,
      balance_pen: currency === 'PEN' ? currentPen + amount : currentPen,
      balance_usd: currency === 'USD' ? currentUsd + amount : currentUsd,
      description,
    };
    const { error } = await supabase.from('ledger').insert(entry);
    if (error) throw new Error(error.message);
  },

  removeCapital: async (amount, currency, description) => {
    const { currentPen, currentUsd } = await getLastEntry();
    if (currency === 'PEN' && currentPen < amount) throw new Error('Saldo PEN insuficiente');
    if (currency === 'USD' && currentUsd < amount) throw new Error('Saldo USD insuficiente');
    const entry: Omit<LedgerEntry, 'id'> = {
      date: new Date(),
      type: 'Retiro',
      currency,
      amount: -amount,
      balance_pen: currency === 'PEN' ? currentPen - amount : currentPen,
      balance_usd: currency === 'USD' ? currentUsd - amount : currentUsd,
      description,
    };
    const { error } = await supabase.from('ledger').insert(entry);
    if (error) throw new Error(error.message);
  },

  exchangeCurrency: async (solesGiven, dollarsReceived, description) => {
    const { currentPen, currentUsd } = await getLastEntry();
    if (currentPen < solesGiven) throw new Error('Saldo PEN insuficiente para el cambio');
    const exchangeRate = parseFloat((solesGiven / dollarsReceived).toFixed(4));
    const entry: Omit<LedgerEntry, 'id'> = {
      date: new Date(),
      type: 'CambioDivisa',
      currency: 'USD',
      amount: dollarsReceived,
      exchange_rate: exchangeRate,
      balance_pen: currentPen - solesGiven,
      balance_usd: currentUsd + dollarsReceived,
      description,
    };
    const { error } = await supabase.from('ledger').insert(entry);
    if (error) throw new Error(error.message);
  },

  deleteEntry: async (id) => {
    const { error } = await supabase.from('ledger').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
}));
