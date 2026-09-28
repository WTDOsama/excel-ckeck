import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { UploadPanel } from './UploadPanel';
import { t } from '../lib/translations';
import { ShieldCheck, ArrowLeft, ArrowRight, Download } from 'lucide-react';
import { downloadBlob, cn } from '../lib/utils';
import {
  buildWorkbookFromCsv,
  generateSampleCsv,
  originalSampleCsv,
  comparisonSampleCsv,
} from '../lib/sampleData';

export function UploadSection() {
  const {
    language,
    original,
    comparison,
    setOriginalWorkbook,
    setComparisonWorkbook,
    setCurrentStep,
    pushToast,
  } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;

  // Listen for demo load events from upload panels
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ side: 'original' | 'comparison' }>;
      const side = ce.detail?.side;
      if (!side) return;
      const csv = side === 'original' ? originalSampleCsv : comparisonSampleCsv;
      const name = side === 'original' ? 'original-sample.csv' : 'comparison-sample.csv';
      const wb = buildWorkbookFromCsv(name, csv, 'Sheet1');
      if (side === 'original') setOriginalWorkbook(wb, name, csv.length);
      else setComparisonWorkbook(wb, name, csv.length);
      pushToast({
        type: 'info',
        message: language === 'ar' ? 'تم تحميل العيّنة التجريبية' : 'Demo data loaded',
      });
    };
    window.addEventListener('xca:load-demo', handler as EventListener);
    return () => window.removeEventListener('xca:load-demo', handler as EventListener);
  }, [language, setOriginalWorkbook, setComparisonWorkbook, pushToast]);

  const downloadSample = (kind: 'original' | 'comparison') => {
    const csv = generateSampleCsv(kind);
    const name = kind === 'original' ? 'original-sample.csv' : 'comparison-sample.csv';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, name);
  };

  const canProceed = !!original.workbook && !!comparison.workbook;

  return (
    <section className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {tr('stepUpload')}
        </h2>
        <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-3xl">
          {language === 'ar'
            ? 'ارفع ملفين للمقارنة: الكشف الأصلي المعتمد والكشف المراد تدقيقه. تتم معالجة الملفات محليًا في متصفحك فقط.'
            : 'Upload two files for comparison: the original reference file and the file to be audited. Files are processed locally in your browser only.'}
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5"
      >
        <UploadPanel side="original" />
        <UploadPanel side="comparison" />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[var(--color-primary-soft)] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
          </div>
          <div className="text-sm">
            <p className="font-semibold mb-0.5">
              {language === 'ar' ? 'خصوصية كاملة' : 'Full Privacy'}
            </p>
            <p className="text-[var(--color-text-muted)] text-xs sm:text-sm">
              {tr('privacyNotice')}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">
            {language === 'ar' ? 'تنزيل عيّنة تجريبية' : 'Download demo sample'}
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => downloadSample('original')}
              className="flex-1 text-xs px-2.5 py-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] flex items-center justify-center gap-1"
            >
              <Download className="w-3 h-3" />
              Original
            </button>
            <button
              onClick={() => downloadSample('comparison')}
              className="flex-1 text-xs px-2.5 py-2 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] flex items-center justify-center gap-1"
            >
              <Download className="w-3 h-3" />
              Comparison
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          disabled={!canProceed}
          onClick={() => setCurrentStep(1)}
          className={cn(
            'px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition shadow-sm',
            canProceed
              ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)]'
              : 'bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] cursor-not-allowed border border-[var(--color-border)]'
          )}
        >
          {tr('next')}
          <Arrow className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
