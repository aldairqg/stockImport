import { create } from 'zustand';
import { db } from '../db/database';
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
    await db.simulations.add(simulation as Simulation);
  },

  updateSimulation: async (id, updates) => {
    await db.simulations.update(id, updates);
  },

  deleteSimulation: async (id) => {
    await db.simulations.delete(id);
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
      status: 'Comprado'
    };

    // 2. Usar useProductStore para agregar y que descuente de caja
    await useProductStore.getState().addProduct(product);

    // 3. Eliminar la simulación si la compra fue exitosa
    if (simulation.id) {
      await db.simulations.delete(simulation.id);
    }
  }
}));
