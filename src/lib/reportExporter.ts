import * as XLSX from 'xlsx';
import type {
  AuditRecord,
  AuditResult,
  CellValue,
  ColumnMapping,
  ComparisonSettings,
} from '../types';
import { formatCell, formatDate } from './utils';

const REPORT_AR_SHEETS: Record<string, string> = {
  Summary: 'ملخص',
  Matched: 'متطابق',
  Modified: 'معدل',
  Missing: 'مفقود',
  Extra: 'زائد',
  Duplicate: 'مكرر',
  Invalid: 'غير صالح',
  Detailed: 'تفاصيل الفروقات',
  Mapping: 'ربط الأعمدة',
  Structural: 'فروقات هيكلية',
  Settings: 'الإعدادات',
};

function getSheetName(base: string, useArabic: boolean): string {
  if (!useArabic) return base;
  return REPORT_AR_SHEETS[base] ?? base;
}

function cellToCsv(v: string | number | boolean | Date | null): string {
  if (v === null || v === undefined) return '';
  let s: string;
  if (v instanceof Date) s = isNaN(v.getTime()) ? '' : v.toISOString().slice(0, 10);
  else s = String(v);
  if (/[",\n]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function aoaToCsv(aoa: (string | number | boolean | Date | null)[][]): string {
  return aoa.map((row) => row.map(cellToCsv).join(',')).join('\n');
}

function buildSummarySheet(
  result: AuditResult,
  mappings: ColumnMapping[],
  origHeaders: string[],
  compHeaders: string[]
): (string | number | boolean | null)[][] {
  const s = result.summary;
  const rows: (string | number | null)[][] = [];
  rows.push(['Field', 'Value']);
  rows.push(['Generated at', formatDate(result.generatedAt)]);
  rows.push(['Original file', result.originalFileName]);
  rows.push(['Comparison file', result.comparisonFileName]);
  rows.push(['Original sheet', result.originalSheet]);
  rows.push(['Comparison sheet', result.comparisonSheet]);
  rows.push(['', '']);
  rows.push(['Original records', s.originalCount]);
  rows.push(['Comparison records', s.comparisonCount]);
  rows.push(['Matched', s.matched]);
  rows.push(['Modified', s.modified]);
  rows.push(['Missing', s.missing]);
  rows.push(['Extra', s.extra]);
  rows.push(['Duplicate', s.duplicate]);
  rows.push(['Invalid', s.invalid]);
  rows.push(['Structural differences', s.structural]);
  rows.push(['Matching percentage', `${s.matchingPercentage.toFixed(2)}%`]);
  rows.push(['', '']);
  rows.push(['Settings']);
  const set = result.settings;
  rows.push(['Case sensitive', set.caseSensitive ? 'Yes' : 'No']);
  rows.push(['Trim whitespace', set.trimWhitespace ? 'Yes' : 'No']);
  rows.push(['Ignore empty rows', set.ignoreEmptyRows ? 'Yes' : 'No']);
  rows.push(['Empty equals blank', set.emptyEqualsBlank ? 'Yes' : 'No']);
  rows.push(['Numeric precision', set.numericPrecision]);
  rows.push(['Compare dates as dates', set.compareDatesAsDates ? 'Yes' : 'No']);
  rows.push(['Identifier min length', set.identifierMinLength || '-']);
  rows.push(['Identifier max length', set.identifierMaxLength || '-']);
  rows.push(['Matching key (original)', set.matchingKeyOriginal || '-']);
  rows.push(['Matching key (comparison)', set.matchingKeyComparison || '-']);
  rows.push(['', '']);
  rows.push(['Column mapping']);
  rows.push(['Original', 'Comparison', 'Enabled']);
  for (const m of mappings) {
    rows.push([m.original || '-', m.comparison || '-', m.enabled ? 'Yes' : 'No']);
  }
  rows.push(['', '']);
  rows.push(['Original headers', '', compHeaders.join(', ')]);
  rows.push(['Comparison headers', '', origHeaders.join(', ')]);
  return rows;
}

function buildRecordSheet(
  records: AuditRecord[],
  statusFilter?: string,
  origHeaders?: string[],
  compHeaders?: string[]
): (string | number | boolean | Date | null)[][] {
  const filtered = statusFilter ? records.filter((r) => r.status === statusFilter) : records;
  const headers: string[] = [
    'Status',
    'Identifier',
    'Original Row',
    'Comparison Row',
    'Reason',
    ...(origHeaders ? origHeaders.map((h) => `O: ${h}`) : []),
    ...(compHeaders ? compHeaders.map((h) => `C: ${h}`) : []),
  ];
  const rows: (string | number | boolean | Date | null)[][] = [headers];
  for (const r of filtered) {
    const row: (string | number | boolean | Date | null)[] = [
      r.status,
      r.identifier,
      r.originalRow ?? '',
      r.comparisonRow ?? '',
      r.reason ?? '',
    ];
    if (origHeaders) {
      for (const h of origHeaders) row.push(r.originalData[h] ?? '');
    }
    if (compHeaders) {
      for (const h of compHeaders) row.push(r.comparisonData?.[h] ?? '');
    }
    rows.push(row);
  }
  return rows;
}

function buildDetailedDifferencesSheet(
  records: AuditRecord[],
  mappings: ColumnMapping[]
): (string | number | boolean | null)[][] {
  const rows: (string | number | null)[][] = [
    [
      'Status',
      'Identifier',
      'Original Row',
      'Comparison Row',
      'Field',
      'Original Value',
      'Comparison Value',
      'Result',
    ],
  ];
  for (const r of records) {
    if (r.differences.length === 0) continue;
    for (const d of r.differences) {
      const compField = mappings.find((m) => m.original === d.field)?.comparison;
      rows.push([
        r.status,
        r.identifier,
        r.originalRow ?? '',
        r.comparisonRow ?? '',
        `${d.field}${compField ? ` ↔ ${compField}` : ''}`,
        formatCell(d.originalValue),
        formatCell(d.comparisonValue),
        d.result,
      ]);
    }
  }
  return rows;
}

function buildMappingSheet(mappings: ColumnMapping[]): (string | number | boolean | null)[][] {
  const rows: (string | number | null)[][] = [
    ['Original Column', 'Comparison Column', 'Enabled', 'Confidence'],
  ];
  for (const m of mappings) {
    rows.push([m.original || '', m.comparison || '', m.enabled ? 'Yes' : 'No', m.confidence ?? '']);
  }
  return rows;
}

function buildStructuralSheet(
  unmappedOriginal: string[],
  unmappedComparison: string[]
): (string | number | boolean | null)[][] {
  const rows: (string | number | null)[][] = [['Side', 'Column']];
  for (const h of unmappedOriginal) rows.push(['Original', h]);
  for (const h of unmappedComparison) rows.push(['Comparison', h]);
  return rows;
}

function buildSettingsSheet(settings: ComparisonSettings): (string | number | boolean | null)[][] {
  return [
    ['Setting', 'Value'],
    ['Case sensitive', settings.caseSensitive ? 'Yes' : 'No'],
    ['Trim whitespace', settings.trimWhitespace ? 'Yes' : 'No'],
    ['Ignore empty rows', settings.ignoreEmptyRows ? 'Yes' : 'No'],
    ['Empty equals blank', settings.emptyEqualsBlank ? 'Yes' : 'No'],
    ['Numeric precision', settings.numericPrecision],
    ['Compare dates as dates', settings.compareDatesAsDates ? 'Yes' : 'No'],
    ['Identifier min length', settings.identifierMinLength || '-'],
    ['Identifier max length', settings.identifierMaxLength || '-'],
    ['Matching key (original)', settings.matchingKeyOriginal || '-'],
    ['Matching key (comparison)', settings.matchingKeyComparison || '-'],
  ];
}

export interface ExportOptions {
  result: AuditResult;
  mappings: ColumnMapping[];
  origHeaders: string[];
  compHeaders: string[];
  useArabicSheetNames?: boolean;
}

export function exportFullReport(opts: ExportOptions): Blob {
  const wb = XLSX.utils.book_new();
  const useAr = !!opts.useArabicSheetNames;

  const summaryAoa = buildSummarySheet(
    opts.result,
    opts.mappings,
    opts.origHeaders,
    opts.compHeaders
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(summaryAoa),
    getSheetName('Summary', useAr)
  );

  const detailAoa = buildDetailedDifferencesSheet(opts.result.records, opts.mappings);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(detailAoa),
    getSheetName('Detailed', useAr)
  );

  const matchedAoa = buildRecordSheet(opts.result.records, 'matched', opts.origHeaders, opts.compHeaders);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(matchedAoa),
    getSheetName('Matched', useAr)
  );

  const modifiedAoa = buildRecordSheet(opts.result.records, 'modified', opts.origHeaders, opts.compHeaders);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(modifiedAoa),
    getSheetName('Modified', useAr)
  );

  const missingAoa = buildRecordSheet(opts.result.records, 'missing', opts.origHeaders, opts.compHeaders);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(missingAoa),
    getSheetName('Missing', useAr)
  );

  const extraAoa = buildRecordSheet(opts.result.records, 'extra', opts.origHeaders, opts.compHeaders);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(extraAoa),
    getSheetName('Extra', useAr)
  );

  const dupAoa = buildRecordSheet(opts.result.records, 'duplicate', opts.origHeaders, opts.compHeaders);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(dupAoa),
    getSheetName('Duplicate', useAr)
  );

  const invAoa = buildRecordSheet(opts.result.records, 'invalid', opts.origHeaders, opts.compHeaders);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(invAoa),
    getSheetName('Invalid', useAr)
  );

  const mapAoa = buildMappingSheet(opts.mappings);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(mapAoa),
    getSheetName('Mapping', useAr)
  );

  const structAoa = buildStructuralSheet(
    opts.result.unmappedOriginal,
    opts.result.unmappedComparison
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(structAoa),
    getSheetName('Structural', useAr)
  );

  const settingsAoa = buildSettingsSheet(opts.result.settings);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(settingsAoa),
    getSheetName('Settings', useAr)
  );

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function exportFilteredSheet(
  records: AuditRecord[],
  status: string,
  origHeaders: string[],
  compHeaders: string[]
): Blob {
  const wb = XLSX.utils.book_new();
  const aoa = buildRecordSheet(records, status, origHeaders, compHeaders);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  XLSX.utils.book_append_sheet(wb, ws, status || 'Results');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

export function exportCsv(
  records: AuditRecord[],
  origHeaders: string[],
  compHeaders: string[]
): Blob {
  const aoa = buildRecordSheet(records, undefined, origHeaders, compHeaders);
  const csv = aoaToCsv(aoa);
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}
