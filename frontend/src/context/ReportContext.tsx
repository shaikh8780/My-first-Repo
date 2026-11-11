import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ReportId } from '../data/reports';

// The active-report selection is app-wide state: the sidebar switcher sets it and
// EVERY report-scoped view (dashboard, editor, structure, compliance, consistency,
// audit, upload) reads it to resolve its own data. Previously activeReport was a
// local useState in App that only the editor/compliance branches could see, which
// is why the other tabs showed RNFM data regardless of the selected report.
interface ReportContextValue {
  activeReport: ReportId;
  setActiveReport: (id: ReportId) => void;
}

const ReportContext = createContext<ReportContextValue | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [activeReport, setActiveReportState] = useState<ReportId>(() => {
    const stored = localStorage.getItem('active-report');
    return (stored === 'rnfm' || stored === 'esg-index' || stored === 'upc' || stored === 'asrs' || stored === 'tcfd-uk' || stored === 'hrs')
      ? stored
      : 'rnfm';
  });
  const setActiveReport = useCallback((id: ReportId) => {
    setActiveReportState(id);
    localStorage.setItem('active-report', id);
  }, []);
  return (
    <ReportContext.Provider value={{ activeReport, setActiveReport }}>
      {children}
    </ReportContext.Provider>
  );
}

export function useActiveReport(): ReportContextValue {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error('useActiveReport must be used within a ReportProvider');
  return ctx;
}
