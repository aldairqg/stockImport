import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../utils/cn';

interface AmountInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  currency?: 'PEN' | 'USD';
  label?: string;
  error?: string;
}

export const AmountInput = forwardRef<HTMLInputElement, AmountInputProps>(
  ({ className, currency = 'USD', label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col space-y-1.5 w-full">
        {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={cn("text-slate-500 sm:text-sm font-medium", currency === 'USD' ? 'text-amber-600' : 'text-brand-600')}>
              {currency === 'USD' ? '$' : 'S/'}
            </span>
          </div>
          <input
            type="number"
            step="0.01"
            min="0"
            ref={ref}
            className={cn(
              "block w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-shadow",
              error && "border-rose-300 focus:ring-rose-500 focus:border-rose-500",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-rose-500">{error}</p>}
      </div>
    );
  }
);
AmountInput.displayName = 'AmountInput';
