import { InputHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

interface NumericInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string;
  value: string;
  onChange: (value: string) => void;
  allowDecimal?: boolean;
  className?: string;
}

export function NumericInput({ label, value, onChange, allowDecimal = true, className, ...props }: NumericInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const pattern = allowDecimal ? /^(\d+\.?\d*)?$/ : /^\d*$/;
    if (pattern.test(raw)) {
      onChange(raw);
    }
  };

  const handleBlur = () => {
    // Si queda vacío al salir del campo, poner 0
    if (value === '' || value === '.') {
      onChange('0');
    }
  };

  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        inputMode={allowDecimal ? 'decimal' : 'numeric'}
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={cn(
          'mt-1 block w-full px-3 py-2 border rounded-lg sm:text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
          className
        )}
        {...props}
      />
    </div>
  );
}
