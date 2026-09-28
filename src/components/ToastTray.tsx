import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../lib/utils';

const iconFor = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorFor = {
  success: 'var(--color-success)',
  error: 'var(--color-danger)',
  warning: 'var(--color-warning)',
  info: 'var(--color-info)',
};

const bgFor = {
  success: 'var(--color-success-soft)',
  error: 'var(--color-danger-soft)',
  warning: 'var(--color-warning-soft)',
  info: 'var(--color-info-soft)',
};

export function ToastTray() {
  const { toasts, dismissToast } = useApp();
  return (
    <div
      className="fixed top-20 end-4 z-50 flex flex-col gap-2 w-[min(92vw,380px)] no-print pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = iconFor[t.type];
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 30, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.95 }}
              className={cn(
                'pointer-events-auto rounded-xl border shadow-[var(--shadow-elevated)] p-3 flex items-start gap-3 backdrop-blur-md',
                'border-[var(--color-border)] bg-[var(--color-bg-elevated)]/95'
              )}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: bgFor[t.type], color: colorFor[t.type] }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold leading-tight">{t.message}</p>
                {t.description && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
                    {t.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
