import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import type { StatusType } from '../types';
import { Check, Pencil, Minus, Plus, Copy, AlertCircle, Layers } from 'lucide-react';

const config: Record<StatusType, { icon: any; classes: string; key: any }> = {
  matched: {
    icon: Check,
    classes:
      'bg-[var(--color-success-soft)] text-[var(--color-success)] border-[var(--color-success)]/30',
    key: 'statusMatched',
  },
  modified: {
    icon: Pencil,
    classes:
      'bg-[var(--color-warning-soft)] text-[var(--color-warning)] border-[var(--color-warning)]/30',
    key: 'statusModified',
  },
  missing: {
    icon: Minus,
    classes:
      'bg-[var(--color-danger-soft)] text-[var(--color-danger)] border-[var(--color-danger)]/30',
    key: 'statusMissing',
  },
  extra: {
    icon: Plus,
    classes:
      'bg-[var(--color-info-soft)] text-[var(--color-info)] border-[var(--color-info)]/30',
    key: 'statusExtra',
  },
  duplicate: {
    icon: Copy,
    classes:
      'bg-[var(--color-violet-soft)] text-[var(--color-violet)] border-[var(--color-violet)]/30',
    key: 'statusDuplicate',
  },
  invalid: {
    icon: AlertCircle,
    classes:
      'bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border-[var(--color-border-strong)]',
    key: 'statusInvalid',
  },
  structural: {
    icon: Layers,
    classes:
      'bg-[var(--color-accent-soft)] text-[var(--color-accent)] border-[var(--color-accent)]/30',
    key: 'statusStructural',
  },
};

interface Props {
  status: StatusType;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: Props) {
  const { language } = useApp();
  const cfg = config[status];
  const Icon = cfg.icon;
  const sm = size === 'sm';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-bold whitespace-nowrap ${
        sm ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'
      } ${cfg.classes} ${className ?? ''}`}
    >
      <Icon className={sm ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
      {t(language, cfg.key as any)}
    </span>
  );
}
