import { ReactNode } from 'react';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  colorClass?: string;
}

export function StatCard({ title, value, icon, trend, trendUp, colorClass = 'text-brand-600 bg-brand-100' }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className={cn("p-2 rounded-xl", colorClass)}>
          {icon}
        </div>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        {trend && (
          <div className={cn("text-xs font-medium mt-1", trendUp ? "text-emerald-600" : "text-rose-600")}>
            {trendUp ? '↑' : '↓'} {trend}
          </div>
        )}
      </div>
    </div>
  );
}
