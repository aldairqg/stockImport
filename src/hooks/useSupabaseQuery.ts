import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../db/database';
import { LedgerEntry, Product, Sale, Simulation } from '../types/models';

// Hook genérico para queries de Supabase con realtime
function useTable<T>(
  table: string,
  query: () => Promise<T[] | null>,
  orderBy?: string
) {
  const [data, setData] = useState<T[] | undefined>(undefined);

  const fetch = useCallback(async () => {
    const result = await query();
    setData(result || []);
  }, []);

  useEffect(() => {
    fetch();
    const channel = supabase
      .channel(`realtime-${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetch, table]);

  return data;
}

export function useLedger(limit?: number) {
  return useTable<LedgerEntry>('ledger', async () => {
    let q = supabase.from('ledger').select('*').order('date', { ascending: false });
    if (limit) q = q.limit(limit);
    const { data } = await q;
    return data?.map(d => ({ ...d, date: new Date(d.date) })) || [];
  });
}

export function useProducts() {
  return useTable<Product>('products', async () => {
    const { data } = await supabase.from('products').select('*').order('purchase_date', { ascending: false });
    return data?.map(d => ({ ...d, purchase_date: new Date(d.purchase_date), arrival_date: d.arrival_date ? new Date(d.arrival_date) : undefined })) || [];
  });
}

export function useSales() {
  return useTable<Sale>('sales', async () => {
    const { data } = await supabase.from('sales').select('*').order('sale_date', { ascending: false });
    return data?.map(d => ({ ...d, sale_date: new Date(d.sale_date) })) || [];
  });
}

export function useSimulations() {
  return useTable<Simulation>('simulations', async () => {
    const { data } = await supabase.from('simulations').select('*').order('created_at', { ascending: false });
    return data?.map(d => ({ ...d, created_at: new Date(d.created_at) })) || [];
  });
}
