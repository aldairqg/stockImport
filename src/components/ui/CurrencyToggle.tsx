import { Currency } from '../../types/models';
import { cn } from '../../utils/cn';

interface CurrencyToggleProps {
  value: Currency;
  onChange: (currency: Currency) => void;
}

export function CurrencyToggle({ value, onChange }: CurrencyToggleProps) {
  return (
    <div className="flex p-1 bg-slate-100 rounded-lg inline-flex">
      <button
        type="button"
        onClick={() => onChange('PEN')}
        className={cn(
          "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
          value === 'PEN' 
            ? "bg-white text-brand-600 shadow-sm" 
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        Soles (S/)
      </button>
      <button
        type="button"
        onClick={() => onChange('USD')}
        className={cn(
          "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
          value === 'USD' 
            ? "bg-white text-amber-600 shadow-sm" 
            : "text-slate-500 hover:text-slate-700"
        )}
      >
        Dólares ($)
      </button>
    </div>
  );
}
