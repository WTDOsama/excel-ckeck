import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import {
  exportCsv,
  exportFilteredSheet,
  exportFullReport,
} from '../lib/reportExporter';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Layers,
  Minus,
  Plus,
  Pencil,
  Copy,
  AlertCircle,
} from 'lucide-react';
import { cn, downloadBlob, formatDate } from '../lib/utils';
import { splitHeaderAndData, getHeaders } from '../lib/excelReader';

interface ExportCardProps {
  icon: any;
  title: string;
  description: string;
  color: string;
  bgColor: string;
  onClick: () => void;
  busy?: boolean;
  done?: boolean;
}

function ExportCard({ icon: Icon, title, description, color, bgColor, onClick, busy, done }: ExportCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn(
        'group text-start rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 transition shadow-sm hover:shadow-[var(--shadow-card)] disabled:opacity-60',
        'hover:border-[var(--color-primary)]/40'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform"
          style={{ background: bgColor, color }}
        >
          {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm sm:text-base">{title}</p>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">{description}</p>
        </div>
      </div>
    </button>
  );
}

export function ExportSection() {
  const {
    language,
    audit,
    mappings,
    original,
    comparison,
    pushToast,
    setCurrentStep,
  } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const ArrowBack = language === 'ar' ? ArrowRight : ArrowLeft;

  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [doneKey, setDoneKey] = useState<string | null>(null);

  const origHeaders = useMemo(() => {
    if (!original.workbook) return [] as string[];
    const sheet = original.workbook.sheets[original.selectedSheet];
    if (!sheet) return [];
    return getHeaders(sheet, original.headerRowIndex, original.hasHeaders);
  }, [original.workbook, original.selectedSheet, original.headerRowIndex, original.hasHeaders]);

  const compHeaders = useMemo(() => {
    if (!comparison.workbook) return [] as string[];
    const sheet = comparison.workbook.sheets[comparison.selectedSheet];
    if (!sheet) return [];
    return getHeaders(sheet, comparison.headerRowIndex, comparison.hasHeaders);
  }, [comparison.workbook, comparison.selectedSheet, comparison.headerRowIndex, comparison.hasHeaders]);

  if (!audit) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[var(--color-text-muted)]">
          {language === 'ar' ? 'لا توجد نتائج لتصديرها.' : 'No audit results to export.'}
        </p>
      </div>
    );
  }

  const stamp = new Date()
    .toISOString()
    .slice(0, 16)
    .replace(/[-:T]/g, '');

  const baseFileName = `audit_${stamp}`;

  const performExport = async (
    key: string,
    action: () => Blob,
    fileName: string,
    successMsg: string
  ) => {
    setBusyKey(key);
    setDoneKey(null);
    try {
      await new Promise((r) => setTimeout(r, 30));
      const blob = action();
      downloadBlob(blob, fileName);
      setDoneKey(key);
      pushToast({ type: 'success', message: tr('exportSuccess'), description: fileName });
      setTimeout(() => setDoneKey(null), 2500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      pushToast({ type: 'error', message: tr('exportFailed'), description: msg });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <section className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {tr('stepExport')}
        </h2>
        <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-3xl">
          {language === 'ar'
            ? 'صدّر التقارير الكاملة أو الجزئية بصيغة Excel أو CSV. لن يتم تعديل ملفاتك الأصلية.'
            : 'Export full or partial reports in Excel or CSV. Your source files will not be modified.'}
        </p>
      </header>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="flex items-center gap-3 mb-4">
          <FileSpreadsheet className="w-6 h-6 text-[var(--color-primary)]" />
          <div>
            <p className="font-bold">{tr('exportAll')}</p>
            <p className="text-xs text-[var(--color-text-subtle)]">
              {language === 'ar'
                ? 'تقرير شامل بكل أوراق العمل والملخص والإعدادات.'
                : 'Full workbook with all worksheets, summary, and settings.'}
            </p>
          </div>
        </div>
        <ExportCard
          icon={Layers}
          title={tr('exportAll')}
          description={
            language === 'ar'
              ? 'يحتوي على: ملخص، متطابق، معدّل، مفقود، زائد، مكرّر، غير صالح، تفاصيل، ربط الأعمدة، فروقات هيكلية، الإعدادات.'
              : 'Includes: Summary, Matched, Modified, Missing, Extra, Duplicate, Invalid, Detailed Differences, Column Mapping, Structural Differences, Settings.'
          }
          color="white"
          bgColor="var(--color-primary)"
          onClick={() =>
            performExport(
              'all',
              () =>
                exportFullReport({
                  result: audit,
                  mappings,
                  origHeaders,
                  compHeaders,
                  useArabicSheetNames: language === 'ar',
                }),
              `${baseFileName}_full.xlsx`,
              tr('exportSuccess')
            )
          }
          busy={busyKey === 'all'}
          done={doneKey === 'all'}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <ExportCard
          icon={Pencil}
          title={tr('exportModified')}
          description={language === 'ar' ? 'سجلات معدّلة فقط مع تفاصيل الفروقات' : 'Modified records only, with detailed differences'}
          color="var(--color-warning)"
          bgColor="var(--color-warning-soft)"
          onClick={() =>
            performExport(
              'modified',
              () => exportFilteredSheet(audit.records, 'modified', origHeaders, compHeaders),
              `${baseFileName}_modified.xlsx`,
              tr('exportSuccess')
            )
          }
          busy={busyKey === 'modified'}
          done={doneKey === 'modified'}
        />
        <ExportCard
          icon={Minus}
          title={tr('exportMissing')}
          description={language === 'ar' ? 'سجلات موجودة في الأصل فقط' : 'Records present only in the original'}
          color="var(--color-danger)"
          bgColor="var(--color-danger-soft)"
          onClick={() =>
            performExport(
              'missing',
              () => exportFilteredSheet(audit.records, 'missing', origHeaders, compHeaders),
              `${baseFileName}_missing.xlsx`,
              tr('exportSuccess')
            )
          }
          busy={busyKey === 'missing'}
          done={doneKey === 'missing'}
        />
        <ExportCard
          icon={Plus}
          title={tr('exportExtra')}
          description={language === 'ar' ? 'سجلات موجودة في التدقيق فقط' : 'Records present only in the comparison'}
          color="var(--color-info)"
          bgColor="var(--color-info-soft)"
          onClick={() =>
            performExport(
              'extra',
              () => exportFilteredSheet(audit.records, 'extra', origHeaders, compHeaders),
              `${baseFileName}_extra.xlsx`,
              tr('exportSuccess')
            )
          }
          busy={busyKey === 'extra'}
          done={doneKey === 'extra'}
        />
        <ExportCard
          icon={Copy}
          title={tr('exportDuplicate')}
          description={language === 'ar' ? 'سجلات مكرّرة في كلا الملفين' : 'Duplicate identifiers in either file'}
          color="var(--color-violet)"
          bgColor="var(--color-violet-soft)"
          onClick={() =>
            performExport(
              'duplicate',
              () => exportFilteredSheet(audit.records, 'duplicate', origHeaders, compHeaders),
              `${baseFileName}_duplicate.xlsx`,
              tr('exportSuccess')
            )
          }
          busy={busyKey === 'duplicate'}
          done={doneKey === 'duplicate'}
        />
        <ExportCard
          icon={AlertCircle}
          title={language === 'ar' ? 'غير صالحة' : 'Invalid Records'}
          description={language === 'ar' ? 'سجلات بمعرّفات فارغة أو غامضة' : 'Records with blank or ambiguous identifiers'}
          color="var(--color-text-muted)"
          bgColor="var(--color-surface-2)"
          onClick={() =>
            performExport(
              'invalid',
              () => exportFilteredSheet(audit.records, 'invalid', origHeaders, compHeaders),
              `${baseFileName}_invalid.xlsx`,
              tr('exportSuccess')
            )
          }
          busy={busyKey === 'invalid'}
          done={doneKey === 'invalid'}
        />
        <ExportCard
          icon={FileText}
          title={tr('exportCSV')}
          description={language === 'ar' ? 'تصدير CSV للنتائج (كل السجلات)' : 'CSV export of all records'}
          color="var(--color-secondary)"
          bgColor="var(--color-secondary-soft)"
          onClick={() =>
            performExport(
              'csv',
              () => exportCsv(audit.records, origHeaders, compHeaders),
              `${baseFileName}_all.csv`,
              tr('exportSuccess')
            )
          }
          busy={busyKey === 'csv'}
          done={doneKey === 'csv'}
        />
      </div>

      <div className="rounded-xl border border-[var(--color-info)]/30 bg-[var(--color-info-soft)]/40 p-4 text-xs sm:text-sm text-[var(--color-text-muted)] flex items-start gap-3">
        <Download className="w-5 h-5 text-[var(--color-info)] shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-[var(--color-info)] mb-0.5">
            {language === 'ar' ? 'معلومات التقرير' : 'Report Information'}
          </p>
          <p>
            {language === 'ar' ? 'تاريخ الإنشاء' : 'Generated'}: {formatDate(audit.generatedAt)}
            {' • '}
            {language === 'ar' ? 'الكشف الأصلي' : 'Original'}: {audit.originalFileName}
            {' • '}
            {language === 'ar' ? 'الكشف المراد تدقيقه' : 'Comparison'}: {audit.comparisonFileName}
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={() => setCurrentStep(4)}
          className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] font-semibold flex items-center gap-2 text-sm"
        >
          <ArrowBack className="w-4 h-4" />
          {tr('previous')}
        </button>
      </div>
    </section>
  );
}
