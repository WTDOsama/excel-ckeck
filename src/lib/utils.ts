import type { CellValue } from '../types';

// Format a cell value for display
export function formatCell(value: CellValue, maxLen = 80): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return String(value);
    return value.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }
  let s = String(value);
  if (s.length > maxLen) s = s.slice(0, maxLen) + '…';
  return s;
}

// Normalize identifier for comparison
export function normalizeIdentifier(
  value: CellValue,
  opts: { trim?: boolean; caseSensitive?: boolean } = {}
): string {
  if (value === null || value === undefined) return '';
  let s: string;
  if (value instanceof Date) {
    s = isNaN(value.getTime()) ? '' : value.toISOString();
  } else {
    s = String(value);
  }
  if (opts.trim !== false) s = s.trim();
  if (opts.caseSensitive === false) s = s.toLocaleLowerCase();
  return s;
}

// Compare two cell values considering settings
export function compareValues(
  a: CellValue,
  b: CellValue,
  opts: {
    trimWhitespace: boolean;
    caseSensitive: boolean;
    emptyEqualsBlank: boolean;
    numericPrecision: number;
    compareDatesAsDates: boolean;
  }
): boolean {
  const normA = normalizeValue(a, opts);
  const normB = normalizeValue(b, opts);

  // Both empty
  if (normA === '' && normB === '') return true;
  if (normA === '' || normB === '') {
    // One empty
    if (opts.emptyEqualsBlank) return false; // already checked both empty
    return false;
  }

  // Both numeric
  const numA = toNumber(normA);
  const numB = toNumber(normB);
  if (numA !== null && numB !== null) {
    if (opts.numericPrecision >= 0) {
      const factor = Math.pow(10, opts.numericPrecision);
      return Math.round(numA * factor) === Math.round(numB * factor);
    }
    return numA === numB;
  }

  // Both dates
  if (opts.compareDatesAsDates) {
    const dA = toDate(normA);
    const dB = toDate(normB);
    if (dA && dB) return dA.getTime() === dB.getTime();
  }

  // String compare
  return normA === normB;
}

function normalizeValue(
  v: CellValue,
  opts: { trimWhitespace: boolean; caseSensitive: boolean }
): string {
  if (v === null || v === undefined) return '';
  let s: string;
  if (v instanceof Date) {
    s = isNaN(v.getTime()) ? '' : v.toISOString();
  } else {
    s = String(v);
  }
  if (opts.trimWhitespace) s = s.trim();
  if (!opts.caseSensitive) s = s.toLocaleLowerCase();
  return s;
}

function toNumber(s: string): number | null {
  if (s === '' || s === null || s === undefined) return null;
  // Try locale-aware number parse: support comma decimal separator
  const cleaned = s.replace(/[\s,]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  if (isNaN(n)) return null;
  return n;
}

function toDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d;
  // Try dd/mm/yyyy format
  const m = s.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const dd = new Date(year, month, day);
    if (!isNaN(dd.getTime())) return dd;
  }
  return null;
}

export function isEmpty(v: CellValue): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  return false;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function formatDate(date: Date | string, locale = 'en-GB'): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
