import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import { BookOpen, X, ShieldCheck, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export function HelpDrawer() {
  const { language } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const [open, setOpen] = useState(false);

  const steps = language === 'ar'
    ? [
        { t: 'رفع الملفات', d: 'ارفع الكشف الأصلي المعتمد والكشف المراد تدقيقه.' },
        { t: 'اختيار الأوراق والعناوين', d: 'حدّد الورقة المناسبة من كل ملف وصف العناوين.' },
        { t: 'ربط الأعمدة', d: 'طابق الأعمدة المتقابلة واختر مفتاح المطابقة (مثل رقم الهوية).' },
        { t: 'إعدادات التدقيق', d: 'اضبط حساسية الحالة، الفراغات، الدقة العددية، إلخ.' },
        { t: 'بدء التدقيق', d: 'اضغط زر بدء التدقيق وانتظر النتائج.' },
        { t: 'مراجعة النتائج', d: 'استعرض لوحة المؤشرات والجدول التفصيلي مع الفرز والبحث.' },
        { t: 'تصدير التقارير', d: 'صدّر النتائج بصيغة Excel أو CSV.' },
      ]
    : [
        { t: 'Upload Files', d: 'Upload the original reference file and the file to be audited.' },
        { t: 'Select Sheets & Headers', d: 'Choose the relevant sheet in each file and set the header row.' },
        { t: 'Map Columns', d: 'Match columns across the files and choose the matching key (e.g. National ID).' },
        { t: 'Configure Settings', d: 'Adjust case-sensitivity, whitespace, numeric precision, etc.' },
        { t: 'Run Audit', d: 'Click the Start Audit button and wait for results.' },
        { t: 'Review Results', d: 'Inspect the dashboard metrics and the detailed results table with sorting and search.' },
        { t: 'Export Reports', d: 'Export results in Excel or CSV format.' },
      ];

  const Arrow = language === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 z-30 w-12 h-12 rounded-full shadow-[var(--shadow-elevated)] flex items-center justify-center text-white no-print',
          'bg-[var(--color-primary)] hover:bg-[var(--color-primary-strong)] transition',
          language === 'ar' ? 'start-6' : 'end-6'
        )}
        title={tr('help')}
      >
        <BookOpen className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end"
            onClick={() => setOpen(false)}
          >
            <motion.aside
              initial={{ x: language === 'ar' ? '-100%' : '100%' }}
              animate={{ x: 0 }}
              exit={{ x: language === 'ar' ? '-100%' : '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md h-full bg-[var(--color-bg-elevated)] border-s border-[var(--color-border)] overflow-y-auto shadow-[var(--shadow-elevated)]"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              <header className="sticky top-0 bg-[var(--color-bg-elevated)]/95 backdrop-blur-md z-10 p-4 border-b border-[var(--color-border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[var(--color-primary)]" />
                  <h2 className="font-bold">{tr('helpTitle')}</h2>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </header>
              <div className="p-4 space-y-5 text-sm">
                <div>
                  <h3 className="font-bold mb-3 flex items-center gap-2">
                    <Arrow className="w-4 h-4 text-[var(--color-primary)]" />
                    {tr('helpSteps')}
                  </h3>
                  <ol className="space-y-3">
                    {steps.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                      >
                        <p className="text-[11px] font-bold text-[var(--color-primary)] mb-0.5">
                          {language === 'ar' ? `الخطوة ${i + 1}` : `Step ${i + 1}`}
                        </p>
                        <p className="font-semibold">{s.t}</p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">{s.d}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--color-success)]" />
                    {tr('helpPrivacy')}
                  </h3>
                  <div className="rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success-soft)]/50 p-3 text-xs space-y-1.5">
                    <p>{tr('privacyNotice')}</p>
                    <ul className="list-disc ps-5 space-y-1 text-[var(--color-text-muted)]">
                      <li>
                        {language === 'ar'
                          ? 'لا يتم تخزين السجلات أو المعرّفات في localStorage.'
                          : 'Records and identifiers are never stored in localStorage.'}
                      </li>
                      <li>
                        {language === 'ar'
                          ? 'لا يتم تعديل ملفات المصدر أو رفعها إلى الإنترنت.'
                          : 'Source files are never modified or uploaded.'}
                      </li>
                      <li>
                        {language === 'ar'
                          ? 'تتم المعالجة بالكامل داخل المتصفح.'
                          : 'All processing happens entirely in your browser.'}
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[var(--color-warning)]" />
                    {tr('helpLimits')}
                  </h3>
                  <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning-soft)]/50 p-3 text-xs space-y-1.5 text-[var(--color-text-muted)]">
                    <ul className="list-disc ps-5 space-y-1">
                      <li>
                        {language === 'ar'
                          ? 'الحجم الأقصى للملف الواحد 50 ميجابايت.'
                          : 'Maximum file size is 50 MB per file.'}
                      </li>
                      <li>
                        {language === 'ar'
                          ? 'المعرّفات المكررة أو الفارغة تُعلّم للمراجعة دون مطابقة عشوائية.'
                          : 'Duplicate or blank identifiers are flagged for review — never guessed.'}
                      </li>
                      <li>
                        {language === 'ar'
                          ? 'القيم النصية لا تخضع لأي مطابقة جزئية أو ضبابية.'
                          : 'No fuzzy/partial matching is applied to identifiers.'}
                      </li>
                      <li>
                        {language === 'ar'
                          ? 'قد تحتوي ملفات XLSX على صيغ معقدة أو تنسيقات غير قياسية.'
                          : 'XLSX files may contain complex formulas or non-standard formatting.'}
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2">
                    {language === 'ar' ? 'تصدير التقارير' : 'Report Exports'}
                  </h3>
                  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-xs space-y-1.5">
                    <p>
                      {language === 'ar'
                        ? 'تتضمن التقارير أوراق عمل متعددة: ملخص، متطابق، معدّل، مفقود، زائد، مكرّر، غير صالح، تفاصيل الفروقات، ربط الأعمدة، فروقات هيكلية، الإعدادات.'
                        : 'Reports include multiple worksheets: Summary, Matched, Modified, Missing, Extra, Duplicate, Invalid, Detailed Differences, Column Mapping, Structural Differences, Settings.'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
