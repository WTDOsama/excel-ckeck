// Excel Compare & Audit – Type Definitions

export type Language = 'ar' | 'en';
export type Theme = 'light' | 'dark';

export type FileSide = 'original' | 'comparison';

export interface WorkbookData {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  sheets: Record<string, SheetData>;
}

export interface SheetData {
  name: string;
  rows: CellValue[][]; // raw rows including header
  rowCount: number;
  colCount: number;
}

export type CellValue = string | number | boolean | Date | null;

export interface FileConfig {
  fileName: string;
  fileSize: number;
  workbook: WorkbookData | null;
  selectedSheet: string;
  headerRowIndex: number; // 0-based index of header row
  hasHeaders: boolean;
  previewRows: number; // how many preview rows to show
  error?: string;
}

export interface ColumnMapping {
  original: string | null;
  comparison: string | null;
  enabled: boolean;
  confidence?: number;
  suggested?: boolean;
}

export interface ComparisonSettings {
  matchingKeyOriginal: string | null;
  matchingKeyComparison: string | null;
  caseSensitive: boolean;
  trimWhitespace: boolean;
  ignoreEmptyRows: boolean;
  emptyEqualsBlank: boolean;
  numericPrecision: number;
  compareDatesAsDates: boolean;
  identifierMinLength: number;
  identifierMaxLength: number;
}

export type StatusType =
  | 'matched'
  | 'modified'
  | 'missing'
  | 'extra'
  | 'duplicate'
  | 'invalid'
  | 'structural';

export interface FieldDifference {
  field: string;
  originalValue: CellValue;
  comparisonValue: CellValue;
  result: 'same' | 'different';
}

export interface AuditRecord {
  id: string;
  identifier: string;
  status: StatusType;
  originalRow?: number;
  comparisonRow?: number;
  originalData: Record<string, CellValue>;
  comparisonData?: Record<string, CellValue>;
  differences: FieldDifference[];
  duplicateCount?: number;
  reason?: string;
}

export interface AuditSummary {
  originalCount: number;
  comparisonCount: number;
  matched: number;
  modified: number;
  missing: number;
  extra: number;
  duplicate: number;
  invalid: number;
  structural: number;
  matchingPercentage: number;
}

export interface AuditResult {
  records: AuditRecord[];
  summary: AuditSummary;
  unmappedOriginal: string[];
  unmappedComparison: string[];
  generatedAt: string;
  originalFileName: string;
  comparisonFileName: string;
  originalSheet: string;
  comparisonSheet: string;
  settings: ComparisonSettings;
}

// Used internally by the comparison engine
export interface RecordMap {
  status: 'valid' | 'duplicate' | 'invalid';
  firstRow: number;
  firstObject: Record<string, CellValue>;
  allRows: number[];
  allObjects: Record<string, CellValue>[];
  count: number;
  reason?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  description?: string;
}

export type WorkflowStep =
  | 'upload'
  | 'sheets'
  | 'mapping'
  | 'settings'
  | 'audit'
  | 'export';
