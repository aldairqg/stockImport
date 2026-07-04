import { ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { ProductStatus } from '../../types/models';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'default';
}

export function Badge({ children, variant = 'default' }: BadgeProps) {
  const variants = {
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
    info: 'bg-blue-100 text-blue-700',
    default: 'bg-slate-100 text-slate-700',
  };

  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant])}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ProductStatus }) {
  const statusConfig: Record<ProductStatus, { label: string; variant: BadgeProps['variant'] }> = {
    Comprado: { label: 'Comprado', variant: 'info' },
    EnTransito: { label: 'En Tránsito', variant: 'warning' },
    EnStock: { label: 'En Stock', variant: 'success' },
    Reservado: { label: 'Reservado', variant: 'warning' },
    Vendido: { label: 'Vendido', variant: 'default' },
  };

  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
