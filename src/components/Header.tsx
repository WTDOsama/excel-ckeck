import { motion } from 'framer-motion';
import { Moon, Sun, Languages, ShieldCheck, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';
import { LogoMark } from './LogoMark';

interface Props {
  onOpenHelp?: () => void;
}

export function Header({ onOpenHelp }: Props) {
  const { language, theme, toggleTheme, setLanguage } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);

  return (
    <header
      className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]/85 backdrop-blur-md no-print"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <LogoMark className="w-10 h-10 shrink-0" />
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-extrabold leading-tight truncate">
              {tr('appName')}
            </h1>
            <div className="text-[11px] text-[var(--color-text-subtle)] flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3" />
              <span className="truncate">{tr('privacyNotice')}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="h-9 px-3 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] text-sm font-semibold flex items-center gap-1.5 transition"
            title={tr('language')}
          >
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">{language === 'ar' ? 'EN' : 'ع'}</span>
          </button>

          <button
            onClick={toggleTheme}
            className="h-9 w-9 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] flex items-center justify-center transition"
            title={theme === 'dark' ? tr('lightTheme') : tr('darkTheme')}
          >
            <motion.span
              key={theme}
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.25 }}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.span>
          </button>

          {onOpenHelp && (
            <button
              onClick={onOpenHelp}
              className="h-9 w-9 rounded-lg border border-[var(--color-border)] hover:border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-2)] flex items-center justify-center transition"
              title={tr('help')}
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
