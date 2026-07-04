import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export function ConfirmDeleteModal({ isOpen, onClose, onConfirm, title, message }: ConfirmDeleteModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={() => { onConfirm(); onClose(); }}>Sí, Eliminar</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center p-4 text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-2">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <p className="text-slate-600">{message}</p>
        <p className="text-sm font-semibold text-rose-600">Esta acción no se puede deshacer.</p>
      </div>
    </Modal>
  );
}
