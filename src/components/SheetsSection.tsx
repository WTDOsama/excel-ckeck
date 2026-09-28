import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import { formatCell, cn } from '../lib/utils';
import { ChevronDown, ArrowLeft, ArrowRight, ListChecks, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface FilePreviewProps {
  side: 'original' | 'comparison';
}

function FilePreview({ side }: FilePreviewProps) {
  const {
    language,
    original,
    comparison,
    setOriginalSheet,
    setComparisonSheet,
    setOriginalHeaderRow,
    setComparisonHeaderRow,
  } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const fc = side === 'original' ? original : comparison;
  const setSheet = side === 'original' ? setOriginalSheet : setComparisonSheet;
  const setHeader = side === 'original' ? setOriginalHeaderRow : setComparisonHeaderRow;
  const accent =
    side === 'original' ? 'var(--color-primary)' : 'var(--color-accent)';
  const title = side === 'original' ? tr('originalFile') : tr('comparisonFile');

  const previewData = useMemo(() => {
    if (!fc.workbook || !fc.selectedSheet) return null;
    const sheet = fc.workbook.sheets[fc.selectedSheet];
    if (!sheet) return null;
    return sheet;
  }, [fc.workbook, fc.selectedSheet]);

  if (!fc.workbook) return null;

  const maxPreviewRows = Math.min(8, previewData?.rowCount ?? 0);

  return (
    <div
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden"
      style={{ borderTopColor: accent, borderTopWidth: 3 }}
    >
      <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base">{title}</h3>
            <p className="text-xs text-[var(--color-text-subtle)] truncate" title={fc.fileName}>
              {fc.fileName}
            </p>
          </div>
          <div className="text-xs text-[var(--color-text-muted)] flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1">
              <span className="font-bold text-[var(--color-text)]">
                {previewData?.rowCount ?? 0}
              </span>{' '}
              {tr('rows')}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="font-bold text-[var(--color-text)]">
                {previewData?.colCount ?? 0}
              </span>{' '}
              {tr('cols')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs">
            <span className="font-semibold text-[var(--color-text-muted)] mb-1 block">
              {tr('selectSheet')}
            </span>
            <div className="relative">
              <select
                value={fc.selectedSheet}
                onChange={(e) => setSheet(e.target.value)}
                className="w-full appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-lg px-3 py-2 text-sm font-medium pr-9"
              >
                {fc.workbook.sheetNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute top-1/2 -translate-y-1/2 end-2 pointer-events-none text-[var(--color-text-subtle)]" />
            </div>
          </label>

          <label className="text-xs">
            <span className="font-semibold text-[var(--color-text-muted)] mb-1 block">
              {tr('headerRow')}
            </span>
            <div className="flex items-stretch gap-2">
              <select
                value={fc.headerRowIndex}
                onChange={(e) =>
                  setHeader(parseInt(e.target.value, 10), fc.hasHeaders)
                }
                className="flex-1 appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-lg px-3 py-2 text-sm font-medium pr-9 relative"
              >
                {Array.from({ length: Math.min(10, previewData?.rowCount ?? 0) }).map(
                  (_, i) => (
                    <option key={i} value={i}>
                      {language === 'ar' ? `الصف ${i + 1}` : `Row ${i + 1}`}
                    </option>
                  )
                )}
              </select>
            </div>
          </label>
        </div>

        <label className="mt-3 flex items-center gap-2 cursor-pointer text-xs select-none">
          <input
            type="checkbox"
            checked={fc.hasHeaders}
            onChange={(e) => setHeader(fc.headerRowIndex, e.target.checked)}
            className="w-4 h-4 rounded accent-[var(--color-primary)]"
          />
          <span className="font-semibold">{tr('firstRowIsHeader')}</span>
        </label>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Eye className="w-3.5 h-3.5 text-[var(--color-text-subtle)]" />
          <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            {tr('previewData')}
          </span>
        </div>
        <div className="overflow-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-[var(--color-surface-2)]">
                <th className="px-2 py-2 border-b border-[var(--color-border)] text-start font-bold text-[var(--color-text-subtle)] sticky start-0 bg-[var(--color-surface-2)] z-10 w-10">
                  #
                </th>
                {previewData &&
                  Array.from({ length: previewData.colCount }).map((_, c) => (
                    <th
                      key={c}
                      className={cn(
                        'px-2 py-2 border-b border-[var(--color-border)] text-start font-bold whitespace-nowrap',
                        fc.hasHeaders && c < (previewData.rows[fc.headerRowIndex]?.length ?? 0)
                          ? 'text-[var(--color-primary)]'
                          : 'text-[var(--color-text-subtle)]'
                      )}
                    >
                      {fc.hasHeaders
                        ? formatCell(
                            previewData.rows[fc.headerRowIndex]?.[c] ?? '',
                            40
                          ) || `Col ${c + 1}`
                        : `Col ${c + 1}`}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {previewData &&
                Array.from({ length: maxPreviewRows }).map((_, r) => {
                  const actualRow = fc.hasHeaders ? fc.headerRowIndex + 1 + r : r;
                  const row = previewData.rows[actualRow] ?? [];
                  return (
                    <tr key={r} className="hover:bg-[var(--color-surface-2)]">
                      <td className="px-2 py-1.5 border-b border-[var(--color-border)] text-start font-mono text-[10px] text-[var(--color-text-subtle)] sticky start-0 bg-[var(--color-surface)] z-10">
                        {actualRow + 1}
                      </td>
                      {Array.from({ length: previewData.colCount }).map((_, c) => (
                        <td
                          key={c}
                          className="px-2 py-1.5 border-b border-[var(--color-border)] text-start whitespace-nowrap max-w-[180px] truncate"
                          title={formatCell(row[c] ?? '')}
                        >
                          {formatCell(row[c] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {previewData && previewData.rowCount > maxPreviewRows && (
          <p className="text-[10px] text-[var(--color-text-subtle)] mt-2 text-center">
            {language === 'ar'
              ? `يتم عرض أول ${maxPreviewRows} صفوف من ${previewData.rowCount}`
              : `Showing first ${maxPreviewRows} of ${previewData.rowCount} rows`}
          </p>
        )}
      </div>
    </div>
  );
}

export function SheetsSection() {
  const { language, original, comparison, setCurrentStep, mappings, setMappings } =
    useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const ArrowBack = language === 'ar' ? ArrowRight : ArrowLeft;
  const ArrowFwd = language === 'ar' ? ArrowLeft : ArrowRight;

  const canProceed =
    !!original.selectedSheet &&
    !!comparison.selectedSheet &&
    (mappings.length > 0
      ? mappings.some((m) => m.original)
      : true);

  // When entering this section we don't pre-build mappings (we wait for mapping step),
  // but we do allow proceeding directly if sheets selected.
  return (
    <section className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {tr('stepSheets')}
        </h2>
        <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-3xl">
          {language === 'ar'
            ? 'اختر الورقة المراد تدقيقها من كل ملف، ثم حدّد صف العناوين. يمكنك المعاينة قبل المتابعة.'
            : 'Select the sheet to audit in each file, then choose the header row. You can preview before continuing.'}
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5"
      >
        <FilePreview side="original" />
        <FilePreview side="comparison" />
      </motion.div>

      <div className="rounded-xl border border-[var(--color-info)]/40 bg-[var(--color-info-soft)]/40 p-4 flex items-start gap-3">
        <ListChecks className="w-5 h-5 text-[var(--color-info)] shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-[var(--color-text-muted)]">
          <p className="font-semibold text-[var(--color-info)] mb-0.5">
            {language === 'ar' ? 'نصيحة' : 'Tip'}
          </p>
          <p>
            {language === 'ar'
              ? 'إذا كان اسم الورقة أو ترتيب الأعمدة مختلفًا بين الملفين فهذا طبيعي؛ يمكنك تعديل كل شيء في خطوة ربط الأعمدة.'
              : 'Different sheet names or column order between files is perfectly fine — everything can be reconciled in the column-mapping step.'}
          </p>
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={() => setCurrentStep(0)}
          className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] font-semibold flex items-center gap-2 text-sm"
        >
          <ArrowBack className="w-4 h-4" />
          {tr('previous')}
        </button>
        <button
          disabled={!canProceed}
          onClick={() => setCurrentStep(2)}
          className={cn(
            'px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition shadow-sm',
            canProceed
              ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)]'
              : 'bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] cursor-not-allowed border border-[var(--color-border)]'
          )}
        >
          {tr('next')}
          <ArrowFwd className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
