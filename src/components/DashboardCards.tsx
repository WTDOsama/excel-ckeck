import { motion } from 'framer-motion';
import {
  FileSpreadsheet,
  CheckCircle2,
  Pencil,
  Minus,
  Plus,
  Copy,
  AlertCircle,
  Layers,
  Percent,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import type { StatusType } from '../types';

interface CardProps {
  label: string;
  value: number | string;
  icon: any;
  color: string;
  bgColor: string;
  delay?: number;
  isPercent?: boolean;
}

function Card({ label, value, icon: Icon, color, bgColor, delay = 0, isPercent }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4 overflow-hidden group hover:shadow-[var(--shadow-card)] transition-shadow"
    >
      <div
        className="absolute -top-6 -end-6 w-20 h-20 rounded-full opacity-20 group-hover:opacity-30 transition"
        style={{ background: bgColor }}
      />
      <div className="flex items-start justify-between gap-2 relative">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="text-2xl sm:text-3xl font-extrabold mt-1 tabular-nums">
            {isPercent ? `${Number(value).toFixed(1)}%` : value}
          </p>
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: bgColor, color }}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </motion.div>
  );
}

export function DashboardCards() {
  const { audit, language } = useApp();
  if (!audit) return null;
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  const s = audit.summary;
  const cards: {
    label: string;
    value: number | string;
    icon: any;
    color: string;
    bgColor: string;
    status?: StatusType;
    isPercent?: boolean;
  }[] = [
    { label: tr('originalCount'), value: s.originalCount, icon: FileSpreadsheet, color: 'var(--color-primary)', bgColor: 'var(--color-primary-soft)' },
    { label: tr('comparisonCount'), value: s.comparisonCount, icon: FileSpreadsheet, color: 'var(--color-accent)', bgColor: 'var(--color-accent-soft)' },
    { label: tr('matched'), value: s.matched, icon: CheckCircle2, color: 'var(--color-success)', bgColor: 'var(--color-success-soft)' },
    { label: tr('modified'), value: s.modified, icon: Pencil, color: 'var(--color-warning)', bgColor: 'var(--color-warning-soft)' },
    { label: tr('missing'), value: s.missing, icon: Minus, color: 'var(--color-danger)', bgColor: 'var(--color-danger-soft)' },
    { label: tr('extra'), value: s.extra, icon: Plus, color: 'var(--color-info)', bgColor: 'var(--color-info-soft)' },
    { label: tr('duplicate'), value: s.duplicate, icon: Copy, color: 'var(--color-violet)', bgColor: 'var(--color-violet-soft)' },
    { label: tr('invalid'), value: s.invalid, icon: AlertCircle, color: 'var(--color-text-muted)', bgColor: 'var(--color-surface-2)' },
    { label: tr('structural'), value: s.structural, icon: Layers, color: 'var(--color-accent)', bgColor: 'var(--color-accent-soft)' },
    { label: tr('matchingPercentage'), value: s.matchingPercentage, icon: Percent, color: 'var(--color-secondary)', bgColor: 'var(--color-secondary-soft)', isPercent: true },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((c, i) => (
        <Card key={c.label} {...c} delay={i * 0.04} />
      ))}
    </div>
  );
}
