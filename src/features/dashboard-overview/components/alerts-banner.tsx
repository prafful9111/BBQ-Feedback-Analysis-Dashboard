import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronRight, X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import type { DashboardAlert } from '@/shared/types/feedback';

interface AlertsBannerProps {
  alerts: DashboardAlert[];
}

const levelClasses: Record<DashboardAlert['level'], string> = {
  Critical: 'border-red-200 bg-red-100 text-red-700',
  Warning: 'border-amber-200 bg-amber-100 text-amber-700',
  Alert: 'border-orange-200 bg-orange-100 text-orange-700',
  Info: 'border-blue-200 bg-blue-100 text-blue-700',
};

export const AlertsBanner = ({ alerts }: AlertsBannerProps) => {
  const [dismissedAlertKeys, setDismissedAlertKeys] = useState<string[]>([]);

  const visibleAlerts = useMemo(() => {
    const dismissed = new Set(dismissedAlertKeys);
    return alerts.filter((alert) => {
      const key = `${alert.level}:${alert.timestamp}:${alert.message}`;
      return !dismissed.has(key);
    });
  }, [alerts, dismissedAlertKeys]);

  const dismissAlert = (alert: DashboardAlert) => {
    const shouldDismiss = window.confirm('Are you sure you want to dismiss this alert?');
    if (!shouldDismiss) {
      return;
    }

    const key = `${alert.level}:${alert.timestamp}:${alert.message}`;
    setDismissedAlertKeys((previous) => [...previous, key]);
  };

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 border-l-4 border-l-red-500 bg-white shadow-sm">
      <div className="flex items-start gap-4 bg-red-50/50 p-4">
        <div className="rounded-lg bg-red-100 p-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>

        <div className="flex-1">
          <h3 className="mb-2 text-sm font-bold text-red-900">Anomalies & Triggers Detected</h3>
          <ul className="space-y-1.5">
            {visibleAlerts.map((alert, index) => (
              <li
                key={`${alert.message}-${index}`}
                className="rounded-md border border-red-100 bg-white/60 p-2 text-[11px] font-medium text-red-700"
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider',
                        levelClasses[alert.level],
                      )}
                    >
                      {alert.level}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {new Date(alert.timestamp).toLocaleString(undefined, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissAlert(alert)}
                    className="rounded p-1 text-slate-400 transition-colors hover:bg-red-100 hover:text-red-600"
                    aria-label="Dismiss alert"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  <span>{alert.message}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
