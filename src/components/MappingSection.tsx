import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link2, Wand2, ArrowLeft, ArrowRight, KeyRound, Check, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import {
  autoMapColumns,
  findUnmappedColumns,
  suggestIdentifierColumn,
} from '../lib/columnMapper';
import { splitHeaderAndData, getHeaders } from '../lib/excelReader';
import { cn } from '../lib/utils';

export function MappingSection() {
  const {
    language,
    original,
    comparison,
    mappings,
    setMappings,
    updateMapping,
    settings,
    setSettings,
    setCurrentStep,
    pushToast,
  } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const ArrowBack = language === 'ar' ? ArrowRight : ArrowLeft;
  const ArrowFwd = language === 'ar' ? ArrowLeft : ArrowRight;

  const origSheetData = original.workbook?.sheets[original.selectedSheet] ?? null;
  const compSheetData = comparison.workbook?.sheets[comparison.selectedSheet] ?? null;

  const origHeaders = useMemo(() => {
    if (!origSheetData) return [] as string[];
    return getHeaders(origSheetData, original.headerRowIndex, original.hasHeaders);
  }, [origSheetData, original.headerRowIndex, original.hasHeaders]);

  const compHeaders = useMemo(() => {
    if (!compSheetData) return [] as string[];
    return getHeaders(compSheetData, comparison.headerRowIndex, comparison.hasHeaders);
  }, [compSheetData, comparison.headerRowIndex, comparison.hasHeaders]);

  // Initialize mappings when headers become available
  useEffect(() => {
    if (origHeaders.length === 0 || compHeaders.length === 0) {
      if (mappings.length > 0) setMappings([]);
      return;
    }
    // If the existing mappings don't align with current headers, regenerate
    const align = mappings.length === origHeaders.length &&
      mappings.every((m, i) => m.original === origHeaders[i]);
    if (!align) {
      const auto = autoMapColumns(origHeaders, compHeaders);
      setMappings(auto);
      // Suggest matching key automatically if not set
      if (!settings.matchingKeyOriginal) {
        const origKey = suggestIdentifierColumn(origHeaders);
        const compKey = origKey
          ? auto.find((m) => m.original === origKey)?.comparison ?? null
          : suggestIdentifierColumn(compHeaders);
        setSettings({
          matchingKeyOriginal: origKey,
          matchingKeyComparison: compKey,
        });
      }
      pushToast({
        type: 'info',
        message: tr('autoMap'),
        description:
          language === 'ar'
            ? 'تم اقتراح المطابقات تلقائيًا. يمكنك تعديلها.'
            : 'Auto-suggestions applied. Edit as needed.',
      });
    }
  }, [origHeaders.join('|'), compHeaders.join('|')]);

  const { unmappedOriginal, unmappedComparison } = useMemo(
    () => findUnmappedColumns(mappings, origHeaders, compHeaders),
    [mappings, origHeaders, compHeaders]
  );

  const handleAutoMap = () => {
    const auto = autoMapColumns(origHeaders, compHeaders);
    setMappings(auto);
    pushToast({ type: 'info', message: tr('autoMap') });
  };

  const canProceed =
    mappings.filter((m) => m.enabled && m.original && m.comparison).length > 0 &&
    !!settings.matchingKeyOriginal &&
    !!settings.matchingKeyComparison;

  const setMatchingKey = (side: 'original' | 'comparison', value: string) => {
    if (side === 'original') setSettings({ matchingKeyOriginal: value });
    else setSettings({ matchingKeyComparison: value });
  };

  return (
    <section className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {tr('mappingTitle')}
        </h2>
        <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-3xl">
          {tr('mappingSubtitle')}
        </p>
      </header>

      {/* Matching Key */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-5 h-5 text-[var(--color-primary)]" />
          <h3 className="font-bold">{tr('matchingKey')}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-xs">
            <span className="font-semibold text-[var(--color-text-muted)] mb-1 block">
              {tr('matchingKeyOriginal')}
            </span>
            <select
              value={settings.matchingKeyOriginal ?? ''}
              onChange={(e) => setMatchingKey('original', e.target.value)}
              className="w-full appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-lg px-3 py-2 text-sm font-medium"
            >
              <option value="">{language === 'ar' ? '— اختر —' : '— Select —'}</option>
              {origHeaders.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="font-semibold text-[var(--color-text-muted)] mb-1 block">
              {tr('matchingKeyComparison')}
            </span>
            <select
              value={settings.matchingKeyComparison ?? ''}
              onChange={(e) => setMatchingKey('comparison', e.target.value)}
              className="w-full appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-lg px-3 py-2 text-sm font-medium"
            >
              <option value="">{language === 'ar' ? '— اختر —' : '— Select —'}</option>
              {compHeaders.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {/* Mapping Table */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="font-bold">{tr('mappingTitle')}</h3>
            <span className="text-xs text-[var(--color-text-subtle)]">
              • {mappings.filter((m) => m.enabled && m.comparison).length} / {mappings.length}
            </span>
          </div>
          <button
            onClick={handleAutoMap}
            className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-primary-soft)] text-xs font-semibold flex items-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            {tr('autoMap')}
          </button>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-[var(--color-surface-2)] text-xs">
              <tr>
                <th className="px-3 py-2 text-start font-bold">{tr('mappingEnabled')}</th>
                <th className="px-3 py-2 text-start font-bold">{tr('originalColumn')}</th>
                <th className="px-3 py-2 text-center font-bold w-12">↔</th>
                <th className="px-3 py-2 text-start font-bold">{tr('comparisonColumn')}</th>
                <th className="px-3 py-2 text-start font-bold text-[var(--color-text-subtle)]">
                  {language === 'ar' ? 'الثقة' : 'Confidence'}
                </th>
              </tr>
            </thead>
            <tbody>
              {mappings.map((m, idx) => (
                <tr
                  key={m.original ?? idx}
                  className={cn(
                    'border-t border-[var(--color-border)] hover:bg-[var(--color-surface-2)]',
                    m.original === settings.matchingKeyOriginal && 'bg-[var(--color-primary-soft)]/40'
                  )}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={(e) => updateMapping(m.original!, { enabled: e.target.checked })}
                      className="w-4 h-4 rounded accent-[var(--color-primary)]"
                      aria-label="enabled"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-semibold flex items-center gap-2">
                      <span className="truncate max-w-[220px]" title={m.original ?? ''}>
                        {m.original}
                      </span>
                      {m.original === settings.matchingKeyOriginal && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-primary)] text-white font-bold">
                          KEY
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center text-[var(--color-text-subtle)]">↔</td>
                  <td className="px-3 py-2">
                    <select
                      value={m.comparison ?? ''}
                      onChange={(e) =>
                        updateMapping(m.original!, {
                          comparison: e.target.value || null,
                          suggested: false,
                        })
                      }
                      disabled={!m.enabled}
                      className="w-full appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-md px-2 py-1 text-sm"
                    >
                      <option value="">{tr('ignoreColumn')}</option>
                      {compHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    {typeof m.confidence === 'number' && m.suggested ? (
                      <span className="text-xs font-mono text-[var(--color-text-muted)]">
                        {(m.confidence * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--color-text-subtle)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {(unmappedOriginal.length > 0 || unmappedComparison.length > 0) && (
          <div className="p-3 sm:p-4 bg-[var(--color-warning-soft)]/50 border-t border-[var(--color-warning)]/30 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {unmappedOriginal.length > 0 && (
              <div>
                <p className="font-bold text-[var(--color-warning)] mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {tr('unmatchedOriginal')} ({unmappedOriginal.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {unmappedOriginal.map((h) => (
                    <span
                      key={h}
                      className="px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-warning)]/40"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {unmappedComparison.length > 0 && (
              <div>
                <p className="font-bold text-[var(--color-warning)] mb-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {tr('unmatchedComparison')} ({unmappedComparison.length})
                </p>
                <div className="flex flex-wrap gap-1">
                  {unmappedComparison.map((h) => (
                    <span
                      key={h}
                      className="px-2 py-0.5 rounded bg-[var(--color-surface)] border border-[var(--color-warning)]/40"
                    >
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <button
          onClick={() => setCurrentStep(1)}
          className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] font-semibold flex items-center gap-2 text-sm"
        >
          <ArrowBack className="w-4 h-4" />
          {tr('previous')}
        </button>
        <button
          disabled={!canProceed}
          onClick={() => {
            pushToast({ type: 'success', message: tr('mappingConfirmed') });
            setCurrentStep(3);
          }}
          className={cn(
            'px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition shadow-sm',
            canProceed
              ? 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-strong)]'
              : 'bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] cursor-not-allowed border border-[var(--color-border)]'
          )}
        >
          <Check className="w-4 h-4" />
          {tr('next')}
          <ArrowFwd className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
