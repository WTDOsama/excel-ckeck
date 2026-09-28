import { compareValues, normalizeIdentifier, isEmpty } from './utils';
import type {
  AuditRecord,
  AuditResult,
  AuditSummary,
  CellValue,
  ComparisonSettings,
  FieldDifference,
  RecordMap,
  StatusType,
} from '../types';

export interface PreparedData {
  headers: string[];
  data: CellValue[][];
  rowNumbers: number[]; // 1-based original row numbers
  objects: Record<string, CellValue>[];
}

export interface ComparisonInput {
  original: PreparedData;
  comparison: PreparedData;
  keyHeaderOriginal: string;
  keyHeaderComparison: string;
  // mapping: originalHeader -> comparisonHeader (only enabled)
  mappings: { original: string; comparison: string }[];
  settings: ComparisonSettings;
}

export function runAudit(input: ComparisonInput): AuditResult {
  const { original, comparison, keyHeaderOriginal, keyHeaderComparison, mappings, settings } =
    input;

  // 1) Build identifier-keyed maps with duplicate detection.
  const originalMap = new Map<string, RecordMap>();
  const comparisonMap = new Map<string, RecordMap>();
  const duplicateKeysOrig = new Set<string>();
  const duplicateKeysComp = new Set<string>();

  indexByIdentifier(
    original,
    keyHeaderOriginal,
    settings,
    originalMap,
    duplicateKeysOrig
  );
  indexByIdentifier(
    comparison,
    keyHeaderComparison,
    settings,
    comparisonMap,
    duplicateKeysComp
  );

  const records: AuditRecord[] = [];
  const seenInComparison = new Set<string>();

  // 2) Iterate original: matched / modified / missing / duplicate / invalid
  for (const [key, rec] of originalMap) {
    const baseId = `orig-${key}`;
    const comp = comparisonMap.get(key);
    seenInComparison.add(key);

    if (rec.status === 'duplicate') {
      records.push({
        id: `${baseId}-dup-0`,
        identifier: key,
        status: 'duplicate',
        originalRow: rec.firstRow,
        originalData: rec.firstObject,
        differences: [],
        duplicateCount: rec.count,
        reason: 'Duplicate identifier in original',
      });
      for (let i = 1; i < rec.allRows.length; i++) {
        records.push({
          id: `${baseId}-dup-${i}`,
          identifier: key,
          status: 'duplicate',
          originalRow: rec.allRows[i],
          originalData: rec.allObjects[i],
          differences: [],
          duplicateCount: rec.count,
          reason: 'Duplicate identifier in original',
        });
      }
      // If the comparison has a matching identifier for an original duplicate,
      // mark the comparison row as invalid (ambiguous) — never silently match.
      if (comp && comp.status !== 'invalid') {
        for (let i = 0; i < comp.allRows.length; i++) {
          records.push({
            id: `comp-${key}-amb-${i}`,
            identifier: key,
            status: 'invalid',
            comparisonRow: comp.allRows[i],
            originalData: {},
            comparisonData: comp.allObjects[i],
            differences: [],
            reason:
              'Ambiguous match: identifier duplicated in original',
          });
        }
      }
      continue;
    }

    if (rec.status === 'invalid') {
      records.push({
        id: `${baseId}-inv`,
        identifier: key,
        status: 'invalid',
        originalRow: rec.firstRow,
        originalData: rec.firstObject,
        differences: [],
        reason: rec.reason || 'Invalid identifier',
      });
      continue;
    }

    if (!comp) {
      records.push({
        id: baseId,
        identifier: key,
        status: 'missing',
        originalRow: rec.firstRow,
        originalData: rec.firstObject,
        differences: [],
      });
      continue;
    }

    if (comp.status === 'duplicate') {
      records.push({
        id: `${baseId}-amb`,
        identifier: key,
        status: 'invalid',
        originalRow: rec.firstRow,
        originalData: rec.firstObject,
        comparisonData: comp.firstObject,
        differences: [],
        reason: 'Ambiguous match: identifier duplicated in comparison',
      });
      continue;
    }

    // Compare mapped fields
    const differences: FieldDifference[] = [];
    for (const m of mappings) {
      const a = rec.firstObject[m.original] ?? null;
      const b = comp.firstObject[m.comparison] ?? null;
      const same = compareValues(a, b, {
        trimWhitespace: settings.trimWhitespace,
        caseSensitive: settings.caseSensitive,
        emptyEqualsBlank: settings.emptyEqualsBlank,
        numericPrecision: settings.numericPrecision,
        compareDatesAsDates: settings.compareDatesAsDates,
      });
      differences.push({
        field: m.original,
        originalValue: a,
        comparisonValue: b,
        result: same ? 'same' : 'different',
      });
    }
    const anyDiff = differences.some((d) => d.result === 'different');
    records.push({
      id: baseId,
      identifier: key,
      status: anyDiff ? 'modified' : 'matched',
      originalRow: rec.firstRow,
      comparisonRow: comp.firstRow,
      originalData: rec.firstObject,
      comparisonData: comp.firstObject,
      differences,
    });
  }

  // 3) Iterate comparison for extras and duplicate-only
  for (const [key, rec] of comparisonMap) {
    if (seenInComparison.has(key)) continue;
    if (rec.status === 'duplicate') {
      records.push({
        id: `comp-${key}-dup-0`,
        identifier: key,
        status: 'duplicate',
        comparisonRow: rec.firstRow,
        originalData: {},
        comparisonData: rec.firstObject,
        differences: [],
        duplicateCount: rec.count,
        reason: 'Duplicate identifier in comparison',
      });
      for (let i = 1; i < rec.allRows.length; i++) {
        records.push({
          id: `comp-${key}-dup-${i}`,
          identifier: key,
          status: 'duplicate',
          comparisonRow: rec.allRows[i],
          originalData: {},
          comparisonData: rec.allObjects[i],
          differences: [],
          duplicateCount: rec.count,
          reason: 'Duplicate identifier in comparison',
        });
      }
      continue;
    }
    if (rec.status === 'invalid') {
      records.push({
        id: `comp-${key}-inv`,
        identifier: key,
        status: 'invalid',
        comparisonRow: rec.firstRow,
        originalData: {},
        comparisonData: rec.firstObject,
        differences: [],
        reason: rec.reason || 'Invalid identifier',
      });
      continue;
    }
    records.push({
      id: `comp-${key}`,
      identifier: key,
      status: 'extra',
      comparisonRow: rec.firstRow,
      originalData: {},
      comparisonData: rec.firstObject,
      differences: [],
    });
  }

  // 4) Structural differences: enabled mappings vs actual headers
  const enabledOrig = new Set(mappings.map((m) => m.original));
  const enabledComp = new Set(mappings.map((m) => m.comparison));
  const unmappedOriginal = original.headers.filter((h) => !enabledOrig.has(h));
  const unmappedComparison = comparison.headers.filter((h) => !enabledComp.has(h));

  // 5) Sort records for stable output: by status priority then identifier
  const priority: Record<StatusType, number> = {
    missing: 0,
    extra: 1,
    modified: 2,
    duplicate: 3,
    invalid: 4,
    matched: 5,
    structural: 6,
  };
  records.sort((a, b) => {
    const pa = priority[a.status];
    const pb = priority[b.status];
    if (pa !== pb) return pa - pb;
    return a.identifier.localeCompare(b.identifier);
  });

  const summary = computeSummary(
    records,
    original.rowNumbers.length,
    comparison.rowNumbers.length,
    unmappedOriginal.length + unmappedComparison.length
  );

  return {
    records,
    summary,
    unmappedOriginal,
    unmappedComparison,
    generatedAt: new Date().toISOString(),
    originalFileName: '',
    comparisonFileName: '',
    originalSheet: '',
    comparisonSheet: '',
    settings,
  };
}

function indexByIdentifier(
  data: PreparedData,
  keyHeader: string,
  settings: ComparisonSettings,
  map: Map<string, RecordMap>,
  duplicates: Set<string>
) {
  for (let i = 0; i < data.rowNumbers.length; i++) {
    const obj = data.objects[i];
    const raw = obj[keyHeader];
    if (isEmpty(raw)) {
      const k = `__invalid_blank_${i}`;
      map.set(k, {
        status: 'invalid',
        firstRow: data.rowNumbers[i],
        firstObject: obj,
        allRows: [data.rowNumbers[i]],
        allObjects: [obj],
        count: 1,
        reason: 'Blank identifier',
      });
      continue;
    }
    const key = normalizeIdentifier(raw, {
      trim: settings.trimWhitespace,
      caseSensitive: settings.caseSensitive,
    });
    if (
      settings.identifierMinLength > 0 &&
      key.length < settings.identifierMinLength
    ) {
      map.set(`__invalid_short_${i}_${key}`, {
        status: 'invalid',
        firstRow: data.rowNumbers[i],
        firstObject: obj,
        allRows: [data.rowNumbers[i]],
        allObjects: [obj],
        count: 1,
        reason: `Identifier shorter than ${settings.identifierMinLength}`,
      });
      continue;
    }
    if (
      settings.identifierMaxLength > 0 &&
      key.length > settings.identifierMaxLength
    ) {
      map.set(`__invalid_long_${i}_${key}`, {
        status: 'invalid',
        firstRow: data.rowNumbers[i],
        firstObject: obj,
        allRows: [data.rowNumbers[i]],
        allObjects: [obj],
        count: 1,
        reason: `Identifier longer than ${settings.identifierMaxLength}`,
      });
      continue;
    }
    const existing = map.get(key);
    if (existing) {
      duplicates.add(key);
      existing.status = 'duplicate';
      existing.count += 1;
      existing.allRows.push(data.rowNumbers[i]);
      existing.allObjects.push(obj);
    } else {
      map.set(key, {
        status: 'valid',
        firstRow: data.rowNumbers[i],
        firstObject: obj,
        allRows: [data.rowNumbers[i]],
        allObjects: [obj],
        count: 1,
      });
    }
  }
}

function computeSummary(
  records: AuditRecord[],
  originalCount: number,
  comparisonCount: number,
  structural: number
): AuditSummary {
  const counts: Record<StatusType, number> = {
    matched: 0,
    modified: 0,
    missing: 0,
    extra: 0,
    duplicate: 0,
    invalid: 0,
    structural,
  };
  for (const r of records) counts[r.status] += 1;
  // Exclude ambiguous (duplicate + invalid) from the reliable base used to calculate percentage.
  const reliableBase = Math.max(
    1,
    originalCount - counts.duplicate - counts.invalid
  );
  const matchingPercentage = (counts.matched / reliableBase) * 100;
  return {
    originalCount,
    comparisonCount,
    matched: counts.matched,
    modified: counts.modified,
    missing: counts.missing,
    extra: counts.extra,
    duplicate: counts.duplicate,
    invalid: counts.invalid,
    structural: counts.structural,
    matchingPercentage: isFinite(matchingPercentage) ? matchingPercentage : 0,
  };
}
