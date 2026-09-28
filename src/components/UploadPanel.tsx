import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, X, AlertTriangle, Download, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { readWorkbook } from '../lib/excelReader';
import { t } from '../lib/translations';
import { cn, formatBytes } from '../lib/utils';
import type { FileSide } from '../types';

interface Props {
  side: FileSide;
}

export function UploadPanel({ side }: Props) {
  const {
    language,
    original,
    comparison,
    setOriginalWorkbook,
    setComparisonWorkbook,
    pushToast,
    setIsProcessing,
    isProcessing,
  } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);

  const fileConfig = side === 'original' ? original : comparison;
  const setWorkbook =
    side === 'original' ? setOriginalWorkbook : setComparisonWorkbook;
  const title = side === 'original' ? tr('originalFile') : tr('comparisonFile');

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);

  const acceptedExtensions = ['.xlsx', '.xls', '.csv'];
  const maxSize = 50 * 1024 * 1024; // 50 MB

  const validate = (f: File): string | null => {
    const lower = f.name.toLowerCase();
    if (!acceptedExtensions.some((ext) => lower.endsWith(ext))) {
      return tr('fileError');
    }
    if (f.size > maxSize) {
      return language === 'ar'
        ? 'حجم الملف يتجاوز الحد المسموح به (50 ميجابايت)'
        : 'File exceeds 50 MB limit';
    }
    if (f.size === 0) {
      return language === 'ar' ? 'الملف فارغ' : 'File is empty';
    }
    return null;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const f = files[0];
    const err = validate(f);
    if (err) {
      pushToast({ type: 'error', message: err });
      return;
    }
    setBusy(true);
    setIsProcessing(true);
    try {
      // Yield so spinner can render
      await new Promise((r) => setTimeout(r, 30));
      const wb = await readWorkbook(f);
      if (wb.sheetNames.length === 0) {
        throw new Error(language === 'ar' ? 'الملف لا يحتوي أوراق' : 'File has no sheets');
      }
      setWorkbook(wb, f.name, f.size);
      pushToast({
        type: 'success',
        message: tr('uploaded'),
        description: `${f.name} • ${formatBytes(f.size)}`,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      pushToast({
        type: 'error',
        message: tr('fileError'),
        description: msg,
      });
    } finally {
      setBusy(false);
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onDemo = () => {
    // demo loaded via separate function in parent
    if (side === 'original') {
      window.dispatchEvent(new CustomEvent('xca:load-demo', { detail: { side } }));
    } else {
      window.dispatchEvent(new CustomEvent('xca:load-demo', { detail: { side } }));
    }
  };

  const onRemove = () => {
    setWorkbook(null, '', 0);
    pushToast({ type: 'info', message: tr('removed') });
  };

  const hasFile = !!fileConfig.workbook;

  return (
    <div
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className={cn(
        'relative rounded-2xl border-2 transition-all p-5 sm:p-6',
        hasFile
          ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/40'
          : dragOver
          ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]/60 scale-[1.01]'
          : 'border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/60',
        busy && 'pointer-events-none opacity-70'
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center',
              side === 'original'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-accent)] text-white'
            )}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base">{title}</h3>
            <p className="text-xs text-[var(--color-text-subtle)]">{tr('supportedFormats')}</p>
          </div>
        </div>
        {hasFile && (
          <button
            onClick={onRemove}
            className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[var(--color-surface)] hover:bg-[var(--color-danger-soft)] hover:text-[var(--color-danger)] border border-[var(--color-border)]"
          >
            <X className="w-3.5 h-3.5" />
            {tr('remove')}
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {busy || (isProcessing && busy) ? (
          <motion.div
            key="busy"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
            <span className="text-sm font-medium">{tr('processing')}</span>
          </motion.div>
        ) : !hasFile ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 sm:p-8 text-center"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center mb-3">
              <Upload className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <p className="font-semibold text-sm mb-1">{tr('uploadHint')}</p>
            <p className="text-xs text-[var(--color-text-subtle)] mb-4">
              {tr('supportedFormats')}
            </p>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <button
                onClick={() => inputRef.current?.click()}
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-strong)] text-white text-sm font-semibold shadow-sm"
              >
                {tr('browse')}
              </button>
              <button
                onClick={onDemo}
                className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-sm font-semibold flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {tr('loadDemo')}
              </button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="loaded"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-[var(--color-success-soft)] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5 text-[var(--color-success)]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" title={fileConfig.fileName}>
                {fileConfig.fileName}
              </p>
              <p className="text-xs text-[var(--color-text-subtle)]">
                {formatBytes(fileConfig.fileSize)} •{' '}
                {fileConfig.workbook?.sheetNames.length}{' '}
                {language === 'ar' ? 'أوراق' : 'sheets'}
              </p>
            </div>
            <button
              onClick={() => inputRef.current?.click()}
              className="text-xs flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[var(--color-surface-2)] hover:bg-[var(--color-primary-soft)] border border-[var(--color-border)]"
            >
              {tr('replace')}
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {fileConfig.error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-danger)] bg-[var(--color-danger-soft)] rounded-md px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5" />
          {fileConfig.error}
        </div>
      )}
    </div>
  );
}
