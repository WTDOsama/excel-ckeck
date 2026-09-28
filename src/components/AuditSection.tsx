import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import { DashboardCards } from './DashboardCards';
import { ResultsTable } from './ResultsTable';
import { DetailsPanel } from './DetailsPanel';
import { ArrowLeft, ArrowRight, Printer, RefreshCw } from 'lucide-react';

export function AuditSection() {
  const {
    language,
    audit,
    setCurrentStep,
    reset,
    pushToast,
  } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const ArrowBack = language === 'ar' ? ArrowRight : ArrowLeft;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!audit) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[var(--color-text-muted)]">
          {language === 'ar' ? 'لم يتم تشغيل التدقيق بعد.' : 'No audit has been run yet.'}
        </p>
      </div>
    );
  }

  const handleReset = () => {
    if (
      window.confirm(
        language === 'ar'
          ? 'هل أنت متأكد من رغبتك في إعادة التعيين؟ سيتم فقدان جميع البيانات الحالية.'
          : 'Are you sure you want to reset? All current data will be lost.'
      )
    ) {
      reset();
      pushToast({ type: 'info', message: tr('resetDone') });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <section className="space-y-5" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {tr('dashboardTitle')}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {audit.originalFileName} <span className="text-[var(--color-text-subtle)]">↔</span>{' '}
            {audit.comparisonFileName}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap no-print">
          <button
            onClick={handlePrint}
            className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-sm font-semibold flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            {tr('print')}
          </button>
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger-soft)] hover:bg-[var(--color-danger)] hover:text-white text-[var(--color-danger)] text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-4 h-4" />
            {tr('reset')}
          </button>
        </div>
      </header>

      <DashboardCards />

      <ResultsTable
        records={audit.records}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
      />

      <DetailsPanel recordId={selectedId} onClose={() => setSelectedId(null)} />

      <div className="flex justify-between pt-2 no-print">
        <button
          onClick={() => setCurrentStep(3)}
          className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] font-semibold flex items-center gap-2 text-sm"
        >
          <ArrowBack className="w-4 h-4" />
          {tr('previous')}
        </button>
        <button
          onClick={() => setCurrentStep(5)}
          className="px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)] shadow-sm"
        >
          {tr('stepExport')}
          {language === 'ar' ? (
            <ArrowLeft className="w-4 h-4" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </button>
      </div>
    </section>
  );
}
