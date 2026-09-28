import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import type { AuditRecord, StatusType } from '../types';
import { StatusBadge } from './StatusBadge';
import { formatCell, cn } from '../lib/utils';
import { ChevronLeft, ChevronRight, Search, X, Eye, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const STATUSES: StatusType[] = [
  'matched',
  'modified',
  'missing',
  'extra',
  'duplicate',
  'invalid',
];

const STATUS_FILTER_KEYS: Record<StatusType, any> = {
  matched: 'statusMatched',
  modified: 'statusModified',
  missing: 'statusMissing',
  extra: 'statusExtra',
  duplicate: 'statusDuplicate',
  invalid: 'statusInvalid',
  structural: 'statusStructural',
};

interface Props {
  records: AuditRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ResultsTable({ records, selectedId, onSelect }: Props) {
  const { language } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<Set<StatusType>>(new Set(STATUSES));
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState<'status' | 'identifier' | 'originalRow' | 'comparisonRow'>('status');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase();
    let arr = records.filter((r) => statusFilter.has(r.status));
    if (q) {
      arr = arr.filter((r) => {
        if (r.identifier.toLocaleLowerCase().includes(q)) return true;
        // search in original + comparison data
        for (const v of Object.values(r.originalData)) {
          if (v != null && String(v).toLocaleLowerCase().includes(q)) return true;
        }
        if (r.comparisonData) {
          for (const v of Object.values(r.comparisonData)) {
            if (v != null && String(v).toLocaleLowerCase().includes(q)) return true;
          }
        }
        // changed field names
        for (const d of r.differences) {
          if (d.field.toLocaleLowerCase().includes(q)) return true;
        }
        return false;
      });
    }
    arr = [...arr].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortBy === 'status') return a.status.localeCompare(b.status) * dir;
      if (sortBy === 'identifier') return a.identifier.localeCompare(b.identifier) * dir;
      if (sortBy === 'originalRow') return ((a.originalRow ?? 0) - (b.originalRow ?? 0)) * dir;
      if (sortBy === 'comparisonRow') return ((a.comparisonRow ?? 0) - (b.comparisonRow ?? 0)) * dir;
      return 0;
    });
    return arr;
  }, [records, search, statusFilter, sortBy, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = filtered.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleStatus = (s: StatusType) => {
    setStatusFilter((prev) => {
      const n = new Set(prev);
      if (n.has(s)) n.delete(s);
      else n.add(s);
      return n;
    });
    setPage(0);
  };

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return null;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />;
  };

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[var(--color-text-muted)]" />
            <h3 className="font-bold">{tr('resultsTitle')}</h3>
            <span className="text-xs text-[var(--color-text-subtle)]">
              ({filtered.length})
            </span>
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-2.5 text-[var(--color-text-subtle)]" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder={tr('searchPlaceholder')}
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] focus:border-[var(--color-primary)] rounded-lg ps-8 pe-8 py-2 text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute top-1/2 -translate-y-1/2 end-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text)]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUSES.map((s) => {
            const active = statusFilter.has(s);
            return (
              <button
                key={s}
                onClick={() => toggleStatus(s)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition font-semibold',
                  active
                    ? 'bg-[var(--color-surface)] border-[var(--color-border-strong)]'
                    : 'bg-transparent border-[var(--color-border)] text-[var(--color-text-subtle)] line-through'
                )}
              >
                <StatusBadge status={s} size="sm" />
              </button>
            );
          })}
          <button
            onClick={() => {
              setStatusFilter(new Set(STATUSES));
              setPage(0);
            }}
            className="text-xs px-2 py-1 rounded-md text-[var(--color-text-subtle)] hover:text-[var(--color-text)] underline"
          >
            {tr('selectAll')}
          </button>
        </div>
      </div>

      <div className="overflow-auto max-h-[60vh]">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-[var(--color-surface-2)] sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2.5 text-start text-xs font-bold w-32">
                <button onClick={() => toggleSort('status')} className="hover:text-[var(--color-primary)]">
                  {tr('status')} <SortIcon col="status" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-start text-xs font-bold">
                <button onClick={() => toggleSort('identifier')} className="hover:text-[var(--color-primary)]">
                  {tr('identifier')} <SortIcon col="identifier" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-start text-xs font-bold w-24">
                <button onClick={() => toggleSort('originalRow')} className="hover:text-[var(--color-primary)]">
                  {tr('originalRow')} <SortIcon col="originalRow" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-start text-xs font-bold w-24">
                <button onClick={() => toggleSort('comparisonRow')} className="hover:text-[var(--color-primary)]">
                  {tr('comparisonRow')} <SortIcon col="comparisonRow" />
                </button>
              </th>
              <th className="px-3 py-2.5 text-start text-xs font-bold">{tr('changedFields')}</th>
              <th className="px-3 py-2.5 text-end text-xs font-bold w-20">{tr('details')}</th>
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[var(--color-text-subtle)]">
                  {tr('noResults')}
                </td>
              </tr>
            )}
            {slice.map((r) => {
              const changed = r.differences.filter((d) => d.result === 'different');
              const isSel = r.id === selectedId;
              return (
                <tr
                  key={r.id}
                  onClick={() => onSelect(r.id)}
                  className={cn(
                    'border-t border-[var(--color-border)] cursor-pointer transition',
                    isSel
                      ? 'bg-[var(--color-primary-soft)]'
                      : 'hover:bg-[var(--color-surface-2)]'
                  )}
                >
                  <td className="px-3 py-2">
                    <StatusBadge status={r.status} size="sm" />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    <span title={r.identifier} className="block max-w-[260px] truncate">
                      {r.identifier}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--color-text-muted)]">
                    {r.originalRow ?? '—'}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-[var(--color-text-muted)]">
                    {r.comparisonRow ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.status === 'modified' && changed.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {changed.slice(0, 3).map((c) => (
                          <span
                            key={c.field}
                            className="px-1.5 py-0.5 rounded bg-[var(--color-warning-soft)] text-[var(--color-warning)] font-bold"
                          >
                            {c.field}
                          </span>
                        ))}
                        {changed.length > 3 && (
                          <span className="text-[var(--color-text-subtle)] font-bold">
                            +{changed.length - 3}
                          </span>
                        )}
                      </div>
                    ) : r.reason ? (
                      <span className="text-[var(--color-text-muted)] text-xs italic">
                        {r.reason}
                      </span>
                    ) : r.duplicateCount && r.duplicateCount > 1 ? (
                      <span className="text-[var(--color-violet)] text-xs font-bold">
                        ×{r.duplicateCount}
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-subtle)]">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-end">
                    <button
                      className={cn(
                        'inline-flex items-center justify-center w-7 h-7 rounded-md border transition',
                        isSel
                          ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-primary-soft)]'
                      )}
                      aria-label="View details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[var(--color-surface-2)]">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[var(--color-text-muted)]">{tr('show')}</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(parseInt(e.target.value, 10));
              setPage(0);
            }}
            className="appearance-none bg-[var(--color-surface)] border border-[var(--color-border)] rounded-md px-2 py-1 text-xs"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={-1}>{tr('showAll')}</option>
          </select>
          <span className="text-[var(--color-text-subtle)]">
            {language === 'ar'
              ? `${filtered.length} ${language === 'ar' ? 'سجل' : 'records'}`
              : `${filtered.length} records`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="w-8 h-8 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface)] disabled:opacity-40 flex items-center justify-center"
          >
            {language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
          <span className="text-xs font-bold px-2 tabular-nums">
            {safePage + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={safePage >= totalPages - 1}
            className="w-8 h-8 rounded-md border border-[var(--color-border)] hover:bg-[var(--color-surface)] disabled:opacity-40 flex items-center justify-center"
          >
            {language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
