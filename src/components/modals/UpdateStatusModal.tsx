import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useProductStore } from '../../store/useProductStore';
import { useToastStore } from '../../store/useToastStore';
import { Product, ProductStatus } from '../../types/models';
import { Package, Truck } from 'lucide-react';
import { cn } from '../../utils/cn';

interface UpdateStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function UpdateStatusModal({ isOpen, onClose, product }: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>('EnTransito');
  const { updateProductStatus } = useProductStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (product) {
      setSelectedStatus(product.status);
    }
  }, [product]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !product.id) return;
    
    try {
      await updateProductStatus(product.id, selectedStatus);
      addToast('Estado actualizado exitosamente', 'success');
      onClose();
    } catch (error: any) {
      addToast(error.message || 'Error al actualizar estado', 'error');
    }
  };

  if (!product) return null;

  const validStatuses: ProductStatus[] = ['Comprado', 'EnTransito', 'EnStock'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Actualizar Estado"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={handleSubmit}>Guardar Cambios</Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <p className="text-sm text-slate-600">
          Actualiza el estado de <strong>{product.name}</strong>.
        </p>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => setSelectedStatus('EnTransito')}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
              selectedStatus === 'EnTransito' 
                ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500" 
                : "border-slate-200 hover:bg-slate-50"
            )}
          >
            <div className={cn("p-2 rounded-lg", selectedStatus === 'EnTransito' ? "bg-brand-100 text-brand-600" : "bg-slate-100 text-slate-500")}>
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">En Tránsito</p>
              <p className="text-xs text-slate-500">El producto viene en camino hacia Perú.</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('EnStock')}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
              selectedStatus === 'EnStock' 
                ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500" 
                : "border-slate-200 hover:bg-slate-50"
            )}
          >
            <div className={cn("p-2 rounded-lg", selectedStatus === 'EnStock' ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500")}>
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">En Stock</p>
              <p className="text-xs text-slate-500">El producto ya llegó y está listo para la venta.</p>
            </div>
          </button>
        </div>
      </form>
    </Modal>
  );
}
