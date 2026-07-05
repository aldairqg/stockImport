import { create } from 'zustand';
import { supabase } from '../db/database';
import { Simulation, Product } from '../types/models';
import { useProductStore } from './useProductStore';

interface SimulationState {
  addSimulation: (simulation: Omit<Simulation, 'id'>) => Promise<void>;
  updateSimulation: (id: string, updates: Partial<Simulation>) => Promise<void>;
  deleteSimulation: (id: string) => Promise<void>;
  convertToProduct: (simulation: Simulation) => Promise<void>;
}

export const useSimulationStore = create<SimulationState>(() => ({
  addSimulation: async (simulation) => {
    const { error } = await supabase.from('simulations').insert(simulation);
    if (error) throw new Error(error.message);
  },

  updateSimulation: async (id, updates) => {
    const { error } = await supabase.from('simulations').update(updates).eq('id', id);
    if (error) throw new Error(error.message);
  },

  deleteSimulation: async (id) => {
    const { error } = await supabase.from('simulations').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  convertToProduct: async (simulation) => {
    const product: Omit<Product, 'id'> = {
      name: simulation.name,
      color: simulation.color,
      variante: simulation.variante,
      purchase_price_usd: simulation.purchase_price_usd,
      tax_usa_rate: simulation.tax_usa_rate,
      tax_usa_amount: simulation.tax_usa_amount,
      freight_cost_usd: simulation.freight_cost_usd,
      operational_cost_usd: simulation.operational_cost_usd,
      peru_import_tax_rate: simulation.peru_import_tax_rate,
      peru_import_tax_amount: simulation.peru_import_tax_amount,
      red_channel_cost_usd: simulation.red_channel_cost_usd,
      other_costs_usd: simulation.other_costs_usd,
      total_cost_usd: simulation.total_cost_usd,
      manual_exchange_rate: simulation.exchange_rate,
      total_cost_pen: simulation.total_cost_pen,
      purchase_date: new Date(),
      status: 'Comprado',
    };
    await useProductStore.getState().addProduct(product);
    if (simulation.id) {
      await supabase.from('simulations').delete().eq('id', simulation.id);
    }
  },
}));
