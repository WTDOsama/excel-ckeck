import { useApp } from '../context/AppContext';
import { t } from '../lib/translations';

export function Footer() {
  const { language } = useApp();
  const tr = (k: Parameters<typeof t>[1]) => t(language, k);
  return (
    <footer
      className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] mt-auto"
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-[var(--color-text-muted)] text-center sm:text-start">
          {tr('footer')}
        </p>
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-subtle)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--color-success)] animate-pulse-soft" />
          <span>{tr('privacyNotice')}</span>
        </div>
      </div>
    </footer>
  );
}
