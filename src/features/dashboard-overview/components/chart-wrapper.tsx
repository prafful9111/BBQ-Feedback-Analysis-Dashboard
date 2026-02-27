import type { ReactNode } from 'react';
import { Info, TrendingUp } from 'lucide-react';

interface ChartWrapperProps {
  title: string;
  children: ReactNode;
}

export const ChartWrapper = ({ title, children }: ChartWrapperProps) => {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-slate-800">
          {title}
          <Info className="h-3 w-3 text-slate-300" />
        </h3>
        <button type="button" className="rounded-lg p-1.5 transition-all hover:bg-slate-50">
          <TrendingUp className="h-3.5 w-3.5 text-slate-400" />
        </button>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
};
