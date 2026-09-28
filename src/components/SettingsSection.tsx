import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Settings2, Play, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import { runAudit } from '../lib/comparisonEngine';
import {
  rowsToObjects,
  splitHeaderAndData,
} from '../lib/excelReader';
import { cn } from '../lib/utils';
import type { PreparedData } from '../lib/comparisonEngine';

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-[var(--color-surface-2)] cursor-pointer border border-transparent hover:border-[var(--color-border)]">
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {description && (
          <p className="text-xs text-[var(--color-text-subtle)] mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-10 h-6 rounded-full transition shrink-0',
          checked ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border-strong)]'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all',
            checked ? 'end-0.5' : 'start-0.5'
          )}
        />
      </button>
    </label>
  );
}

export function SettingsSection() {
  const {
    language,
    settings,
    setSettings,
    original,
    comparison,
    mappings,
    setAudit,
    setCurrentStep,
    setIsProcessing,
    pushToast,
    isProcessing,
  } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const ArrowBack = language === 'ar' ? ArrowRight : ArrowLeft;

  const enabledMappings = mappings.filter(
    (m) => m.enabled && m.original && m.comparison
  );

  const handleStart = async () => {
    const origSheet = original.workbook?.sheets[original.selectedSheet];
    const compSheet = comparison.workbook?.sheets[comparison.selectedSheet];
    if (!origSheet || !compSheet) {
      pushToast({ type: 'error', message: tr('pleaseUploadBoth') });
      return;
    }
    if (!settings.matchingKeyOriginal || !settings.matchingKeyComparison) {
      pushToast({ type: 'error', message: tr('pleaseSelectKey') });
      return;
    }
    if (enabledMappings.length === 0) {
      pushToast({ type: 'error', message: tr('pleaseMapColumns') });
      return;
    }
    setIsProcessing(true);
    try {
      // Yield so spinner can render
      await new Promise((r) => setTimeout(r, 60));
      const origSplit = splitHeaderAndData(
        origSheet,
        original.headerRowIndex,
        original.hasHeaders,
        settings.ignoreEmptyRows
      );
      const compSplit = splitHeaderAndData(
        compSheet,
        comparison.headerRowIndex,
        comparison.hasHeaders,
        settings.ignoreEmptyRows
      );
      const origStart = original.headerRowIndex + 2; // 1-based header + 1 for first data row
      const compStart = comparison.headerRowIndex + 2;
      const origRowNumbers = origSplit.data.map((_, i) => origStart + i);
      const compRowNumbers = compSplit.data.map((_, i) => compStart + i);

      const origPrepared: PreparedData = {
        headers: origSplit.headers,
        data: origSplit.data,
        rowNumbers: origRowNumbers,
        objects: rowsToObjects(origSplit.headers, origSplit.data),
      };
      const compPrepared: PreparedData = {
        headers: compSplit.headers,
        data: compSplit.data,
        rowNumbers: compRowNumbers,
        objects: rowsToObjects(compSplit.headers, compSplit.data),
      };

      const result = runAudit({
        original: origPrepared,
        comparison: compPrepared,
        keyHeaderOriginal: settings.matchingKeyOriginal,
        keyHeaderComparison: settings.matchingKeyComparison,
        mappings: enabledMappings.map((m) => ({
          original: m.original!,
          comparison: m.comparison!,
        })),
        settings,
      });
      result.originalFileName = original.fileName;
      result.comparisonFileName = comparison.fileName;
      result.originalSheet = original.selectedSheet;
      result.comparisonSheet = comparison.selectedSheet;

      setAudit(result);
      pushToast({ type: 'success', message: tr('auditComplete') });
      setCurrentStep(4);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      pushToast({
        type: 'error',
        message: tr('auditFailed'),
        description: msg,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <header className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          {tr('settingsTitle')}
        </h2>
        <p className="text-sm sm:text-base text-[var(--color-text-muted)] max-w-3xl">
          {language === 'ar'
            ? 'اضبط خيارات المقارنة حسب طبيعة بياناتك.'
            : 'Configure comparison options to match the nature of your data.'}
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5"
      >
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="font-bold">
              {language === 'ar' ? 'القواعد العامة' : 'General Rules'}
            </h3>
          </div>
          <div className="space-y-1">
            <Toggle
              checked={settings.trimWhitespace}
              onChange={(v) => setSettings({ trimWhitespace: v })}
              label={tr('trimWhitespace')}
              description={
                language === 'ar'
                  ? 'تجاهل الفراغات في بداية ونهاية القيم النصية.'
                  : 'Ignore leading/trailing whitespace in text values.'
              }
            />
            <Toggle
              checked={settings.caseSensitive}
              onChange={(v) => setSettings({ caseSensitive: v })}
              label={tr('caseSensitive')}
              description={
                language === 'ar'
                  ? 'اعتبر الأحرف الكبيرة والصغيرة مختلفة.'
                  : 'Treat uppercase and lowercase as different.'
              }
            />
            <Toggle
              checked={settings.ignoreEmptyRows}
              onChange={(v) => setSettings({ ignoreEmptyRows: v })}
              label={tr('ignoreEmptyRows')}
              description={
                language === 'ar'
                  ? 'تجاهل الصفوف التي لا تحتوي على بيانات.'
                  : 'Skip rows that contain no data.'
              }
            />
            <Toggle
              checked={settings.emptyEqualsBlank}
              onChange={(v) => setSettings({ emptyEqualsBlank: v })}
              label={tr('emptyEqualsBlank')}
              description={
                language === 'ar'
                  ? 'اعتبر الخلايا الفارغة والقيم الفارغة مكافئة.'
                  : 'Treat empty cells and empty strings as equivalent.'
              }
            />
            <Toggle
              checked={settings.compareDatesAsDates}
              onChange={(v) => setSettings({ compareDatesAsDates: v })}
              label={tr('compareDatesAsDates')}
              description={
                language === 'ar'
                  ? 'قارن التواريخ حسب قيمتها الزمنية لا كنص.'
                  : 'Compare dates by their timestamp, not as text.'
              }
            />
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className="w-5 h-5 text-[var(--color-accent)]" />
            <h3 className="font-bold">
              {language === 'ar' ? 'الدقة والتحقق' : 'Precision & Validation'}
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <label className="block">
              <span className="font-semibold text-[var(--color-text-muted)] mb-1 block">
                {tr('numericPrecision')}
              </span>
              <select
                value={settings.numericPrecision}
                onChange={(e) =>
                  setSettings({ numericPrecision: parseInt(e.target.value, 10) })
                }
                className="w-full appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-lg px-3 py-2 text-sm"
              >
                <option value={-1}>{tr('noRounding')}</option>
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
                <option value={6}>6</option>
              </select>
            </label>

            <div>
              <span className="font-semibold text-[var(--color-text-muted)] mb-1 block">
                {tr('identifierLength')}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-text-subtle)] w-12">
                    {tr('minLength')}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={settings.identifierMinLength}
                    onChange={(e) =>
                      setSettings({
                        identifierMinLength: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="0"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--color-text-subtle)] w-12">
                    {tr('maxLength')}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={settings.identifierMaxLength}
                    onChange={(e) =>
                      setSettings({
                        identifierMaxLength: Math.max(0, parseInt(e.target.value, 10) || 0),
                      })
                    }
                    className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-lg px-3 py-2 text-sm font-mono"
                    placeholder="0"
                  />
                </label>
              </div>
              <p className="text-[10px] text-[var(--color-text-subtle)] mt-1">
                {language === 'ar'
                  ? 'اترك القيمة 0 لتعطيل التحقق من الطول.'
                  : 'Leave 0 to disable length validation.'}
              </p>
            </div>

            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
              <p className="font-semibold mb-2 text-[var(--color-text-muted)]">
                {language === 'ar' ? 'ملخص الإعدادات' : 'Settings Summary'}
              </p>
              <ul className="space-y-1 text-[var(--color-text-muted)]">
                <li>
                  {language === 'ar' ? 'الأعمدة المفعّلة' : 'Enabled mappings'}:{' '}
                  <span className="font-bold text-[var(--color-text)]">
                    {enabledMappings.length}
                  </span>
                </li>
                <li>
                  {language === 'ar' ? 'المفتاح' : 'Key'}:{' '}
                  <span className="font-mono text-[var(--color-text)] text-[11px]">
                    {settings.matchingKeyOriginal} ↔ {settings.matchingKeyComparison}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between pt-2">
        <button
          onClick={() => setCurrentStep(2)}
          className="px-4 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] font-semibold flex items-center gap-2 text-sm"
        >
          <ArrowBack className="w-4 h-4" />
          {tr('previous')}
        </button>
        <button
          onClick={handleStart}
          disabled={isProcessing}
          className={cn(
            'px-5 py-2.5 rounded-lg font-bold flex items-center gap-2 transition shadow-sm',
            isProcessing
              ? 'bg-[var(--color-surface-2)] text-[var(--color-text-subtle)] cursor-wait border border-[var(--color-border)]'
              : 'bg-[var(--color-secondary)] text-white hover:brightness-110'
          )}
        >
          {isProcessing ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              {tr('processing')}
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              {tr('startAudit')}
            </>
          )}
        </button>
      </div>
    </section>
  );
}
