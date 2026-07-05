import React, { useState } from 'react';
import { useProducts } from '../hooks/useSupabaseQuery';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { AddProductModal } from '../components/modals/AddProductModal';
import { UpdateStatusModal } from '../components/modals/UpdateStatusModal';
import { EditProductModal } from '../components/modals/EditProductModal';
import { ConfirmDeleteModal } from '../components/modals/ConfirmDeleteModal';
import { useProductStore } from '../store/useProductStore';
import { useToastStore } from '../store/useToastStore';
import { Product, ProductStatus } from '../types/models';
import { Plus, Search, Edit, Trash2, MoreVertical, ChevronUp } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatUSD, formatPEN } from '../utils/finance';

const TABS: { id: ProductStatus | 'Todos', label: string }[] = [
  { id: 'Todos', label: 'Todos' },
  { id: 'Comprado', label: 'Comprados' },
  { id: 'EnTransito', label: 'En Tránsito' },
  { id: 'EnStock', label: 'En Stock' },
  { id: 'Reservado', label: 'Reservados' },
  { id: 'Vendido', label: 'Vendidos' }
];

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<ProductStatus | 'Todos'>('Todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [selectedStatusProduct, setSelectedStatusProduct] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const { deleteProduct } = useProductStore();
  const { addToast } = useToastStore();

  const products = useProducts();

  const filteredProducts = products?.filter(p => {
    const matchesTab = activeTab === 'Todos' || p.status === activeTab;
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.serie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variante?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  }) || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Inventario</h1>
        <Button variant="primary" onClick={() => setAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Nuevo Producto
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-2 rounded-xl shadow-sm border border-slate-100">
        <div className="flex w-full md:w-auto overflow-x-auto hide-scrollbar gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === tab.id 
                  ? "bg-brand-50 text-brand-700" 
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar serie, variante..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 hidden lg:table-cell">Serie</th>
                <th className="px-4 py-3 hidden md:table-cell">Costo USD</th>
                <th className="px-4 py-3 hidden sm:table-cell">Costo PEN</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No hay productos en esta categoría.</td></tr>
              )}
              {filteredProducts.map((product) => (
                <React.Fragment key={product.id}>
                  <tr className="border-b last:border-0 border-slate-100 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800 truncate max-w-[150px] sm:max-w-xs">{product.name}</p>
                      <p className="text-xs text-slate-500">{[product.variante, product.color].filter(Boolean).join(' - ')}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono text-xs hidden lg:table-cell">{product.serie || '-'}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{formatUSD(product.total_cost_usd)}</td>
                    <td className="px-4 py-3 font-medium text-slate-800 hidden sm:table-cell">{formatPEN(product.total_cost_pen)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className="hidden md:flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedStatusProduct(product)}>
                            Estado
                          </Button>
                          <button 
                            onClick={() => setProductToEdit(product)}
                            className="text-slate-400 hover:text-brand-600 p-2 rounded transition-colors"
                            title="Editar Producto"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setProductToDelete(product)}
                            className="text-slate-400 hover:text-rose-600 p-2 rounded transition-colors"
                            title="Eliminar Producto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => setExpandedRow(expandedRow === product.id ? null : product.id!)}
                          className="md:hidden text-slate-400 hover:text-brand-600 p-2"
                        >
                          {expandedRow === product.id ? <ChevronUp className="w-5 h-5" /> : <MoreVertical className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedRow === product.id && (
                    <tr className="md:hidden bg-slate-50/80 border-b border-slate-100">
                      <td colSpan={6} className="px-4 py-4">
                        <div className="flex flex-col gap-3 text-sm">
                          <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3 lg:hidden">
                            <div className="lg:hidden">
                              <span className="text-slate-500 block mb-1">Serie</span>
                              <p className="font-mono text-slate-800">{product.serie || '-'}</p>
                            </div>
                            <div className="sm:hidden">
                              <span className="text-slate-500 block mb-1">Costo PEN</span>
                              <p className="font-semibold text-slate-800">{formatPEN(product.total_cost_pen)}</p>
                            </div>
                            <div className="md:hidden">
                              <span className="text-slate-500 block mb-1">Costo USD</span>
                              <p className="font-semibold text-slate-800">{formatUSD(product.total_cost_usd)}</p>
                            </div>
                            <div>
                              <span className="text-slate-500 block mb-1">TC Registrado</span>
                              <p className="font-semibold text-slate-800">{product.manual_exchange_rate}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 pt-1 justify-end">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedStatusProduct(product)}>
                              Actualizar Estado
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => setProductToEdit(product)}>
                              <Edit className="w-4 h-4 mr-1" /> Editar
                            </Button>
                            <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => setProductToDelete(product)}>
                              <Trash2 className="w-4 h-4 mr-1" /> Eliminar
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddProductModal 
        isOpen={isAddModalOpen} 
        onClose={() => setAddModalOpen(false)} 
      />
      <UpdateStatusModal 
        isOpen={!!selectedStatusProduct} 
        onClose={() => setSelectedStatusProduct(null)} 
        product={selectedStatusProduct} 
      />
      <EditProductModal
        isOpen={!!productToEdit}
        onClose={() => setProductToEdit(null)}
        product={productToEdit}
      />
      <ConfirmDeleteModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Eliminar Producto"
        message={`¿Deseas eliminar el producto ${productToDelete?.name}? Se borrarán también las ventas asociadas.`}
        onConfirm={async () => {
          if (productToDelete?.id) {
            try {
              await deleteProduct(productToDelete.id);
              addToast('Producto eliminado exitosamente', 'success');
            } catch {
              addToast('Error al eliminar producto', 'error');
            }
          }
        }}
      />
    </div>
  );
}
