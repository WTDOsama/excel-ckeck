import type { ColumnMapping } from '../types';

// Arabic + English ID-column synonyms (header heuristics)
const ID_HEADER_SYNONYMS = [
  'national id',
  'nationalid',
  'id number',
  'idnumber',
  'identity number',
  'identitynumber',
  'id',
  'iqama',
  'iid',
  'رقم الهوية',
  'الهوية',
  'رقم الهوية الشخصية',
  'رقم الهوية الوطني',
  'رقم وطني',
  'الهوية الوطنية',
  'رقم هوية',
  'الرقم الوطني',
  'هوية',
  'رقم مدني',
  'الرقم المدني',
];

const NAME_HEADER_SYNONYMS = [
  'name',
  'full name',
  'fullname',
  'employee name',
  'citizen name',
  'الاسم',
  'اسم',
  'الاسم الكامل',
  'الاسم الرباعي',
  'اسم الموظف',
  'اسم المواطن',
];

const REGION_HEADER_SYNONYMS = [
  'region',
  'city',
  'area',
  'location',
  'address',
  'المنطقة',
  'المدينة',
  'الحي',
  'العنوان',
  'مكان السكن',
];

const PHONE_HEADER_SYNONYMS = [
  'phone',
  'mobile',
  'telephone',
  'contact',
  'الجوال',
  'الهاتف',
  'رقم الجوال',
  'رقم الهاتف',
];

const EMAIL_HEADER_SYNONYMS = ['email', 'e-mail', 'mail', 'البريد', 'البريد الإلكتروني'];

const DATE_HEADER_SYNONYMS = ['date', 'تاريخ', 'التاريخ'];

const STATUS_HEADER_SYNONYMS = ['status', 'state', 'الحالة', 'الحاله'];

// Normalize a header for similarity comparison
function normHeader(h: string): string {
  return h
    .toLowerCase()
    .replace(/[\u064B-\u0652]/g, '') // strip Arabic diacritics
    .replace(/[^\p{L}\p{N}]+/gu, '') // strip non-letters/numbers
    .trim();
}

// Levenshtein distance for fuzzy header fallback
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0)
  );
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[a.length][b.length];
}

// Build all known synonym groups
function buildSynonymGroups(): string[][] {
  const groups = [
    ID_HEADER_SYNONYMS,
    NAME_HEADER_SYNONYMS,
    REGION_HEADER_SYNONYMS,
    PHONE_HEADER_SYNONYMS,
    EMAIL_HEADER_SYNONYMS,
    DATE_HEADER_SYNONYMS,
    STATUS_HEADER_SYNONYMS,
  ];
  return groups.map((g) => g.map(normHeader).filter(Boolean));
}

// Determine which synonym group (if any) a header belongs to
function groupOf(header: string, groups: string[][]): number {
  const n = normHeader(header);
  if (!n) return -1;
  for (let i = 0; i < groups.length; i++) {
    if (groups[i].includes(n)) return i;
  }
  // Fuzzy: only try for short headers
  if (n.length <= 30) {
    let bestGroup = -1;
    let bestDist = Infinity;
    for (let i = 0; i < groups.length; i++) {
      for (const syn of groups[i]) {
        if (!syn) continue;
        const d = levenshtein(n, syn);
        const threshold = Math.max(2, Math.floor(syn.length * 0.25));
        if (d < bestDist && d <= threshold) {
          bestDist = d;
          bestGroup = i;
        }
      }
    }
    if (bestGroup !== -1) return bestGroup;
  }
  return -1;
}

// Suggest a single best match for `targetHeader` from `candidates` (excluding `exclude`).
function suggestMatch(
  targetHeader: string,
  candidates: string[],
  groups: string[][],
  exclude: Set<string>
): { match: string; confidence: number } | null {
  const tn = normHeader(targetHeader);
  if (!tn) return null;
  let best: { match: string; confidence: number } | null = null;
  for (const cand of candidates) {
    if (exclude.has(cand)) continue;
    const cn = normHeader(cand);
    if (!cn) continue;
    // Exact normalized match
    if (cn === tn) {
      return { match: cand, confidence: 1 };
    }
    // Same synonym group
    const tg = groupOf(targetHeader, groups);
    const cg = groupOf(cand, groups);
    if (tg !== -1 && tg === cg) {
      const conf = 0.85;
      if (!best || best.confidence < conf) best = { match: cand, confidence: conf };
      continue;
    }
    // Fuzzy similarity
    const d = levenshtein(tn, cn);
    const maxLen = Math.max(tn.length, cn.length);
    if (maxLen === 0) continue;
    const sim = 1 - d / maxLen;
    if (sim >= 0.7) {
      const conf = sim * 0.7; // cap at 0.7 to ensure exact > group > fuzzy
      if (!best || best.confidence < conf) best = { match: cand, confidence: conf };
    }
  }
  return best;
}

// Auto-suggest column mappings between two header sets.
// Each mapping: pick the highest-confidence candidate per original column, ensuring uniqueness.
export function autoMapColumns(
  originalHeaders: string[],
  comparisonHeaders: string[]
): ColumnMapping[] {
  const groups = buildSynonymGroups();
  const used = new Set<string>();
  const suggestions: { orig: string; cand: string; confidence: number }[] = [];

  for (const orig of originalHeaders) {
    const s = suggestMatch(orig, comparisonHeaders, groups, used);
    if (s) suggestions.push({ orig, cand: s.match, confidence: s.confidence });
  }

  // Greedy uniqueness: pick highest-confidence first
  suggestions.sort((a, b) => b.confidence - a.confidence);
  const finalMap = new Map<string, { cand: string; confidence: number }>();
  for (const s of suggestions) {
    if (finalMap.has(s.orig)) continue;
    // Ensure no other orig already maps to this cand via different orig
    let taken = false;
    for (const v of finalMap.values()) {
      if (v.cand === s.cand) {
        taken = true;
        break;
      }
    }
    if (taken) continue;
    finalMap.set(s.orig, { cand: s.cand, confidence: s.confidence });
  }

  return originalHeaders.map((h) => {
    const m = finalMap.get(h);
    return {
      original: h,
      comparison: m ? m.cand : null,
      enabled: !!m,
      confidence: m?.confidence,
      suggested: !!m,
    };
  });
}

// Suggest the best identifier (matching key) column from a header list.
// Returns the original (un-normalized) header name.
export function suggestIdentifierColumn(headers: string[]): string | null {
  const groups = buildSynonymGroups();
  const idGroupIdx = 0; // first group is IDs
  // Prefer exact match in ID group
  for (const h of headers) {
    const n = normHeader(h);
    if (groups[idGroupIdx].includes(n)) return h;
  }
  // Then group membership
  for (const h of headers) {
    if (groupOf(h, groups) === idGroupIdx) return h;
  }
  // Finally fuzzy within ID group
  let best: { header: string; score: number } | null = null;
  for (const h of headers) {
    const n = normHeader(h);
    if (!n) continue;
    for (const syn of groups[idGroupIdx]) {
      if (!syn) continue;
      const d = levenshtein(n, syn);
      const maxLen = Math.max(n.length, syn.length);
      const sim = 1 - d / maxLen;
      if (sim >= 0.7 && (!best || sim > best.score)) {
        best = { header: h, score: sim };
      }
    }
  }
  return best ? best.header : null;
}

// Find unmapped columns in each side given current mappings.
export function findUnmappedColumns(
  mappings: ColumnMapping[],
  originalHeaders: string[],
  comparisonHeaders: string[]
): { unmappedOriginal: string[]; unmappedComparison: string[] } {
  const usedOrig = new Set(mappings.filter((m) => m.enabled).map((m) => m.original));
  const usedComp = new Set(mappings.filter((m) => m.enabled).map((m) => m.comparison));
  return {
    unmappedOriginal: originalHeaders.filter((h) => !usedOrig.has(h)),
    unmappedComparison: comparisonHeaders.filter((h) => !usedComp.has(h)),
  };
}
