import { Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import { cn } from '../lib/utils';

const STEPS: { key: Parameters<typeof t>[1]; label: string }[] = [
  { key: 'stepUpload', label: 'step' },
  { key: 'stepSheets', label: 'step' },
  { key: 'stepMapping', label: 'step' },
  { key: 'stepSettings', label: 'step' },
  { key: 'stepAudit', label: 'step' },
  { key: 'stepExport', label: 'step' },
];

export function Stepper() {
  const { language, currentStep, setCurrentStep, original, comparison, mappings, audit } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);

  const canGoTo = (i: number): boolean => {
    if (i === 0) return true;
    if (i === 1) return !!original.workbook && !!comparison.workbook;
    if (i === 2) return !!original.selectedSheet && !!comparison.selectedSheet;
    if (i === 3) return mappings.some((m) => m.enabled && m.original && m.comparison);
    if (i === 4) return !!audit;
    if (i === 5) return !!audit;
    return true;
  };

  return (
    <nav
      className="sticky top-16 z-20 bg-[var(--color-bg-elevated)]/80 backdrop-blur border-b border-[var(--color-border)] no-print"
      aria-label="Workflow steps"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <ol className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          {STEPS.map((s, i) => {
            const reachable = canGoTo(i);
            const active = i === currentStep;
            const done = i < currentStep;
            return (
              <li key={s.key} className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  disabled={!reachable}
                  onClick={() => reachable && setCurrentStep(i)}
                  className={cn(
                    'group flex items-center gap-2 rounded-full px-3 sm:px-3.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition-all border',
                    active &&
                      'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-sm',
                    !active && done && reachable &&
                      'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/40 hover:border-[var(--color-success)]',
                    !active && !done && reachable &&
                      'bg-[var(--color-surface)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
                    !reachable &&
                      'bg-transparent text-[var(--color-text-subtle)] border-[var(--color-border)] opacity-60 cursor-not-allowed'
                  )}
                >
                  <span
                    className={cn(
                      'inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold',
                      active && 'bg-white/20',
                      !active && done && 'bg-[var(--color-success)] text-white',
                      !active && !done && reachable && 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
                    )}
                  >
                    {done ? <Check className="w-3 h-3" /> : i + 1}
                  </span>
                  <span className="whitespace-nowrap">{tr(s.key)}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div
                    className={cn(
                      'w-4 sm:w-8 h-px',
                      done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border-strong)]'
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
