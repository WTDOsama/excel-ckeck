import { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Stepper } from './components/Stepper';
import { UploadSection } from './components/UploadSection';
import { SheetsSection } from './components/SheetsSection';
import { MappingSection } from './components/MappingSection';
import { SettingsSection } from './components/SettingsSection';
import { AuditSection } from './components/AuditSection';
import { ExportSection } from './components/ExportSection';
import { ToastTray } from './components/ToastTray';
import { HelpDrawer } from './components/HelpDrawer';
import { motion, AnimatePresence } from 'framer-motion';

function Shell() {
  const { currentStep } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <Header />
      <Stepper />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {currentStep === 0 && <UploadSection />}
            {currentStep === 1 && <SheetsSection />}
            {currentStep === 2 && <MappingSection />}
            {currentStep === 3 && <SettingsSection />}
            {currentStep === 4 && <AuditSection />}
            {currentStep === 5 && <ExportSection />}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <ToastTray />
      <HelpDrawer />
    </div>
  );
}

export default function App() {
  // Apply theme class on initial mount to avoid flash
  useEffect(() => {
    const stored = (() => {
      try {
        return JSON.parse(localStorage.getItem('xca_prefs_v1') || '{}');
      } catch {
        return {};
      }
    })();
    const theme = stored.theme === 'light' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
  }, []);

  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
