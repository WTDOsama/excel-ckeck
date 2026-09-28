import * as XLSX from 'xlsx';
import type { WorkbookData, SheetData, CellValue } from '../types';

// Read any supported file (xlsx, xls, csv) into our internal WorkbookData structure.
// Files are read locally; no network calls.
export async function readWorkbook(file: File): Promise<WorkbookData> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false,
    raw: false,
  });
  const sheets: Record<string, SheetData> = {};
  for (const name of wb.SheetNames) {
    sheets[name] = readSheet(wb, name);
  }
  return {
    fileName: file.name,
    fileSize: file.size,
    sheetNames: wb.SheetNames,
    sheets,
  };
}

function readSheet(wb: XLSX.WorkBook, name: string): SheetData {
  const ws = wb.Sheets[name];
  if (!ws) return { name, rows: [], rowCount: 0, colCount: 0 };
  // header:1 returns array of arrays
  const aoa = XLSX.utils.sheet_to_json<CellValue[]>(ws, {
    header: 1,
    defval: null,
    blankrows: false,
    raw: false,
    dateNF: 'yyyy-mm-dd',
  });
  const rows = (aoa as unknown as CellValue[][]).map((r) => r.map(normalizeCell));
  const rowCount = rows.length;
  const colCount = rowCount > 0 ? Math.max(...rows.map((r) => r.length)) : 0;
  return { name, rows, rowCount, colCount };
}

function normalizeCell(v: unknown): CellValue {
  if (v === null || v === undefined || v === '') return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (trimmed === '') return null;
    return trimmed;
  }
  return v as CellValue;
}

export function getSheet(workbook: WorkbookData, sheetName: string): SheetData | null {
  return workbook.sheets[sheetName] ?? null;
}

export function isWorkbookEmpty(wb: WorkbookData): boolean {
  return wb.sheetNames.length === 0 || Object.keys(wb.sheets).length === 0;
}

export function sheetIsEmpty(sheet: SheetData): boolean {
  return sheet.rowCount === 0 || sheet.colCount === 0;
}

// Extract headers (row at headerRowIndex) and data rows (everything after)
export function splitHeaderAndData(
  sheet: SheetData,
  headerRowIndex: number,
  hasHeaders: boolean,
  ignoreEmptyRows: boolean
): { headers: string[]; data: CellValue[][]; headerRowNumber: number } {
  if (sheet.rowCount === 0) {
    return { headers: [], data: [], headerRowNumber: headerRowIndex + 1 };
  }
  const safeIdx = Math.max(0, Math.min(headerRowIndex, sheet.rowCount - 1));
  const headerRowNumber = safeIdx + 1; // 1-based for display

  if (!hasHeaders) {
    // Generate column names
    const colCount = Math.max(...sheet.rows.map((r) => r.length));
    const headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
    let data = sheet.rows.slice(safeIdx);
    if (ignoreEmptyRows) data = data.filter((r) => !isRowEmpty(r));
    return { headers, data, headerRowNumber };
  }

  const headerRow = sheet.rows[safeIdx] ?? [];
  const headers = headerRow.map((h, i) => {
    const s = h === null || h === undefined ? '' : String(h).trim();
    return s === '' ? `Column ${i + 1}` : s;
  });
  // Trim trailing empties
  while (headers.length > 0 && headers[headers.length - 1] === '') headers.pop();

  let data = sheet.rows.slice(safeIdx + 1);
  // Pad data rows to match header width
  const colCount = headers.length;
  data = data.map((r) => {
    if (r.length === colCount) return r;
    const padded = [...r];
    while (padded.length < colCount) padded.push(null);
    return padded.slice(0, colCount);
  });
  if (ignoreEmptyRows) data = data.filter((r) => !isRowEmpty(r));

  return { headers, data, headerRowNumber };
}

export function isRowEmpty(row: CellValue[]): boolean {
  for (const c of row) {
    if (c === null || c === undefined) continue;
    if (typeof c === 'string' && c.trim() === '') continue;
    return false;
  }
  return true;
}

// Extract just the header row at headerRowIndex, given the hasHeaders flag.
// If hasHeaders is false, generates "Column N" names based on colCount.
export function getHeaders(
  sheet: SheetData,
  headerRowIndex: number,
  hasHeaders: boolean
): string[] {
  if (sheet.rowCount === 0) return [];
  const safeIdx = Math.max(0, Math.min(headerRowIndex, sheet.rowCount - 1));
  if (!hasHeaders) {
    return Array.from({ length: sheet.colCount }, (_, i) => `Column ${i + 1}`);
  }
  const headerRow = sheet.rows[safeIdx] ?? [];
  const headers = headerRow.map((h, i) => {
    const s = h === null || h === undefined ? '' : String(h).trim();
    return s === '' ? `Column ${i + 1}` : s;
  });
  while (headers.length > 0 && headers[headers.length - 1] === '') headers.pop();
  return headers;
}

export function rowsToObjects(
  headers: string[],
  rows: CellValue[][]
): Record<string, CellValue>[] {
  return rows.map((r) => {
    const obj: Record<string, CellValue> = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] ?? null;
    });
    return obj;
  });
}
