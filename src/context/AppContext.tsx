import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import type {
  AuditResult,
  ColumnMapping,
  ComparisonSettings,
  FileConfig,
  Language,
  Theme,
  ToastMessage,
  WorkbookData,
} from '../types';
import { uid } from '../lib/utils';

interface State {
  language: Language;
  theme: Theme;
  original: FileConfig;
  comparison: FileConfig;
  mappings: ColumnMapping[];
  settings: ComparisonSettings;
  audit: AuditResult | null;
  toasts: ToastMessage[];
  currentStep: number;
  isProcessing: boolean;
}

interface AppContextValue extends State {
  setLanguage: (l: Language) => void;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setOriginalWorkbook: (wb: WorkbookData | null, fileName: string, fileSize: number) => void;
  setComparisonWorkbook: (wb: WorkbookData | null, fileName: string, fileSize: number) => void;
  setOriginalSheet: (s: string) => void;
  setComparisonSheet: (s: string) => void;
  setOriginalHeaderRow: (i: number, hasHeaders: boolean) => void;
  setComparisonHeaderRow: (i: number, hasHeaders: boolean) => void;
  setMappings: (m: ColumnMapping[]) => void;
  updateMapping: (originalHeader: string, patch: Partial<ColumnMapping>) => void;
  setSettings: (patch: Partial<ComparisonSettings>) => void;
  setAudit: (a: AuditResult | null) => void;
  setCurrentStep: (s: number) => void;
  setIsProcessing: (b: boolean) => void;
  pushToast: (t: Omit<ToastMessage, 'id'>) => void;
  dismissToast: (id: string) => void;
  reset: () => void;
}

const Ctx = createContext<AppContextValue | null>(null);

const PREF_KEY = 'xca_prefs_v1';

function defaultFileConfig(): FileConfig {
  return {
    fileName: '',
    fileSize: 0,
    workbook: null,
    selectedSheet: '',
    headerRowIndex: 0,
    hasHeaders: true,
    previewRows: 5,
  };
}

function defaultSettings(): ComparisonSettings {
  return {
    matchingKeyOriginal: null,
    matchingKeyComparison: null,
    caseSensitive: false,
    trimWhitespace: true,
    ignoreEmptyRows: true,
    emptyEqualsBlank: true,
    numericPrecision: -1,
    compareDatesAsDates: true,
    identifierMinLength: 0,
    identifierMaxLength: 0,
  };
}

function loadPrefs(): { language: Language; theme: Theme } {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const lang: Language = parsed.language === 'en' ? 'en' : 'ar';
      const theme: Theme = parsed.theme === 'light' ? 'light' : 'dark';
      return { language: lang, theme };
    }
  } catch {
    // ignore
  }
  return { language: 'ar', theme: 'dark' };
}

function savePrefs(language: Language, theme: Theme) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify({ language, theme }));
  } catch {
    // ignore
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const initial = useMemo(() => loadPrefs(), []);
  const [language, setLanguageState] = useState<Language>(initial.language);
  const [theme, setThemeState] = useState<Theme>(initial.theme);
  const [original, setOriginal] = useState<FileConfig>(defaultFileConfig());
  const [comparison, setComparison] = useState<FileConfig>(defaultFileConfig());
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [settings, setSettingsState] = useState<ComparisonSettings>(defaultSettings());
  const [audit, setAudit] = useState<AuditResult | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    savePrefs(language, theme);
  }, [language, theme]);

  const setLanguage = useCallback((l: Language) => setLanguageState(l), []);
  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggleTheme = useCallback(
    () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')),
    []
  );

  const setOriginalWorkbook = useCallback(
    (wb: WorkbookData | null, fileName: string, fileSize: number) => {
      setOriginal({
        fileName,
        fileSize,
        workbook: wb,
        selectedSheet: wb?.sheetNames[0] ?? '',
        headerRowIndex: 0,
        hasHeaders: true,
        previewRows: 5,
        error: undefined,
      });
    },
    []
  );
  const setComparisonWorkbook = useCallback(
    (wb: WorkbookData | null, fileName: string, fileSize: number) => {
      setComparison({
        fileName,
        fileSize,
        workbook: wb,
        selectedSheet: wb?.sheetNames[0] ?? '',
        headerRowIndex: 0,
        hasHeaders: true,
        previewRows: 5,
        error: undefined,
      });
    },
    []
  );

  const setOriginalSheet = useCallback((s: string) => {
    setOriginal((p) => ({ ...p, selectedSheet: s, headerRowIndex: 0 }));
  }, []);
  const setComparisonSheet = useCallback((s: string) => {
    setComparison((p) => ({ ...p, selectedSheet: s, headerRowIndex: 0 }));
  }, []);
  const setOriginalHeaderRow = useCallback((i: number, hasHeaders: boolean) => {
    setOriginal((p) => ({ ...p, headerRowIndex: i, hasHeaders }));
  }, []);
  const setComparisonHeaderRow = useCallback((i: number, hasHeaders: boolean) => {
    setComparison((p) => ({ ...p, headerRowIndex: i, hasHeaders }));
  }, []);

  const updateMapping = useCallback(
    (originalHeader: string, patch: Partial<ColumnMapping>) => {
      setMappings((prev) =>
        prev.map((m) => (m.original === originalHeader ? { ...m, ...patch } : m))
      );
    },
    []
  );

  const setSettings = useCallback((patch: Partial<ComparisonSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...patch }));
  }, []);

  const pushToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = uid();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const reset = useCallback(() => {
    setOriginal(defaultFileConfig());
    setComparison(defaultFileConfig());
    setMappings([]);
    setSettingsState(defaultSettings());
    setAudit(null);
    setCurrentStep(0);
  }, []);

  const value: AppContextValue = {
    language,
    theme,
    original,
    comparison,
    mappings,
    settings,
    audit,
    toasts,
    currentStep,
    isProcessing,
    setLanguage,
    setTheme,
    toggleTheme,
    setOriginalWorkbook,
    setComparisonWorkbook,
    setOriginalSheet,
    setComparisonSheet,
    setOriginalHeaderRow,
    setComparisonHeaderRow,
    setMappings,
    updateMapping,
    setSettings,
    setAudit,
    setCurrentStep,
    setIsProcessing,
    pushToast,
    dismissToast,
    reset,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useApp must be used within AppProvider');
  return v;
}
