import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import type { AuditRecord, FieldDifference } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatCell, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, FileSpreadsheet } from 'lucide-react';

interface Props {
  recordId: string | null;
  onClose: () => void;
}

export function DetailsPanel({ recordId, onClose }: Props) {
  const { language, audit, mappings } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);

  const record: AuditRecord | null = useMemo(() => {
    if (!audit || !recordId) return null;
    return audit.records.find((r) => r.id === recordId) ?? null;
  }, [audit, recordId]);

  if (!record) return null;

  const compFieldFor = (origField: string): string | null => {
    return mappings.find((m) => m.original === origField)?.comparison ?? null;
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-0 sm:p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--color-bg-elevated)] rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col shadow-[var(--shadow-elevated)]"
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <header className="flex items-start justify-between gap-3 p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <StatusBadge status={record.status} />
                {record.duplicateCount && record.duplicateCount > 1 && (
                  <span className="text-xs text-[var(--color-violet)] font-bold">
                    ×{record.duplicateCount}
                  </span>
                )}
              </div>
              <p className="font-mono text-sm font-bold truncate" title={record.identifier}>
                {record.identifier}
              </p>
              <p className="text-xs text-[var(--color-text-subtle)] mt-1">
                {record.reason ?? (
                  <>
                    {language === 'ar' ? 'صف الأصل' : 'Original Row'}:{' '}
                    <span className="font-mono">{record.originalRow ?? '—'}</span>
                    {' • '}
                    {language === 'ar' ? 'صف التدقيق' : 'Comparison Row'}:{' '}
                    <span className="font-mono">{record.comparisonRow ?? '—'}</span>
                  </>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-surface)] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </header>

          <div className="overflow-auto p-4 space-y-4">
            {record.differences.length > 0 ? (
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-2)]">
                    <th className="px-3 py-2 text-start text-xs font-bold">{tr('field')}</th>
                    <th className="px-3 py-2 text-start text-xs font-bold">{tr('originalValue')}</th>
                    <th className="px-3 py-2 text-start text-xs font-bold">{tr('comparisonValue')}</th>
                    <th className="px-3 py-2 text-start text-xs font-bold">{tr('result')}</th>
                  </tr>
                </thead>
                <tbody>
                  {record.differences.map((d) => (
                    <DiffRow key={d.field} d={d} compLabel={compFieldFor(d.field)} />
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
                {language === 'ar'
                  ? 'لا توجد فروقات في الحقول المفعّلة.'
                  : 'No differences in enabled fields.'}
              </p>
            )}

            {record.status === 'duplicate' && (
              <DuplicateSection record={record} />
            )}
            {(record.status === 'missing' || record.status === 'extra' ||
              record.status === 'invalid') && (
              <FullRecordSection title={tr('affectedRecords')} record={record} />
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DiffRow({
  d,
  compLabel,
}: {
  d: FieldDifference;
  compLabel: string | null;
}) {
  const { language } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const isDiff = d.result === 'different';
  return (
    <tr className="border-t border-[var(--color-border)] align-top">
      <td className="px-3 py-2 font-semibold text-xs">
        <span className="block">{d.field}</span>
        {compLabel && (
          <span className="block text-[10px] text-[var(--color-text-subtle)] mt-0.5">
            ↔ {compLabel}
          </span>
        )}
      </td>
      <td
        className={cn(
          'px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all',
          isDiff && 'bg-[var(--color-danger-soft)] text-[var(--color-danger)] rounded'
        )}
      >
        {formatCell(d.originalValue, 500) || (
          <span className="text-[var(--color-text-subtle)] italic">
            {language === 'ar' ? 'فارغ' : 'empty'}
          </span>
        )}
      </td>
      <td
        className={cn(
          'px-3 py-2 text-xs font-mono whitespace-pre-wrap break-all',
          isDiff && 'bg-[var(--color-success-soft)] text-[var(--color-success)] rounded'
        )}
      >
        {formatCell(d.comparisonValue, 500) || (
          <span className="text-[var(--color-text-subtle)] italic">
            {language === 'ar' ? 'فارغ' : 'empty'}
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-xs">
        {isDiff ? (
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-warning-soft)] text-[var(--color-warning)] font-bold">
            {tr('different')}
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-[var(--color-success-soft)] text-[var(--color-success)] font-bold">
            {tr('same')}
          </span>
        )}
      </td>
    </tr>
  );
}

function DuplicateSection({ record }: { record: AuditRecord }) {
  const { language } = useApp();
  return (
    <div className="rounded-lg border border-[var(--color-violet)]/30 bg-[var(--color-violet-soft)]/50 p-3">
      <p className="text-xs font-bold text-[var(--color-violet)] mb-1.5 flex items-center gap-1.5">
        <FileSpreadsheet className="w-3.5 h-3.5" />
        {language === 'ar'
          ? `عدد مرات التكرار: ${record.duplicateCount}`
          : `Duplicated ${record.duplicateCount} times`}
      </p>
      <p className="text-xs text-[var(--color-text-muted)]">
        {record.reason ??
          (language === 'ar'
            ? 'تم وضع علامة على هذا السجل كمكرر بسبب تكرار المعرّف.'
            : 'This record has been flagged as duplicate because its identifier appears more than once.')}
      </p>
    </div>
  );
}

function FullRecordSection({ title, record }: { title: string; record: AuditRecord }) {
  const { language } = useApp();
  const data =
    record.status === 'missing' || record.status === 'invalid'
      ? record.originalData
      : record.comparisonData ?? {};
  const side =
    record.status === 'missing' || (record.status === 'invalid' && record.originalRow)
      ? language === 'ar' ? 'الأصل' : 'Original'
      : language === 'ar' ? 'التدقيق' : 'Comparison';
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <p className="px-3 py-2 text-xs font-bold border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
        {title} — {side}
      </p>
      <div className="max-h-64 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <tbody>
            {Object.entries(data).map(([k, v]) => (
              <tr key={k} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-1.5 font-semibold text-[var(--color-text-muted)] align-top w-1/3">
                  {k}
                </td>
                <td className="px-3 py-1.5 font-mono whitespace-pre-wrap break-all">
                  {formatCell(v, 500) || (
                    <span className="text-[var(--color-text-subtle)] italic">
                      {language === 'ar' ? 'فارغ' : 'empty'}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
