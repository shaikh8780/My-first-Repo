import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth/useAuth';
import LandingView from './components/LandingView';
import DashboardView from './components/DashboardView';
import EditorView from './components/EditorView';
import ComplianceView from './components/ComplianceView';
import KnowledgeBaseView from './components/KnowledgeBaseView';
import BenchmarkingView from './components/BenchmarkingView';
import AuditView from './components/AuditView';
import AuditorView from './components/AuditorView';
import UploadView from './components/UploadView';
import UserGuideView from './components/UserGuideView';
import ArchitectureView from './components/ArchitectureView';
import AiSuggestionsView from './components/AiSuggestionsView';
import PreviousReportsView from './components/PreviousReportsView';
import ConsistencyCheckView from './components/ConsistencyCheckView';
import PolicyInventoryView from './components/PolicyInventoryView';
import AnalysisView, { type AnalysisTab } from './components/AnalysisView';
import DemoScriptView from './components/DemoScriptView';
import ParallelReportView from './components/ParallelReportView';
import StructureAdminView from './components/StructureAdminView';
import AdminView from './components/AdminView';
import SendToDialog from './components/SendToDialog';
import {
  ScopedDashboard, ScopedStructure, ScopedCompliance, ScopedConsistency, ScopedAudit, ScopedParallelEditor,
} from './components/scoped/ScopedViews';
import { reports } from './data/reports';
import { useActiveReport } from './context/ReportContext';
import { canEditStructure } from './data/permissions';
import './index.css';

type View = 'home' | 'dashboard' | 'editor' | 'analysis' | 'compliance' | 'knowledgebase' | 'benchmarking' | 'audit' | 'auditview' | 'upload' | 'guide' | 'architecture' | 'suggestions' | 'reports' | 'consistency' | 'policies' | 'demo' | 'report' | 'structure' | 'admin';

const ALL_VIEWS: View[] = ['home', 'dashboard', 'editor', 'analysis', 'compliance', 'knowledgebase', 'benchmarking', 'audit', 'auditview', 'upload', 'guide', 'architecture', 'suggestions', 'reports', 'consistency', 'policies', 'demo', 'report', 'structure', 'admin'];

// The cross-report Home landing lives at the app root ("/"); every other view
// maps to "/<view>".
function pathToView(pathname: string): View {
  const seg = pathname.replace(/^\/+/, '').split('/')[0];
  if (!seg) return 'home';
  return (ALL_VIEWS as string[]).includes(seg) ? (seg as View) : 'home';
}
function viewToPath(view: View): string {
  return view === 'home' ? '/' : `/${view}`;
}

// Compliance / Consistency / Peer benchmarking now live as tabs inside the
// merged "Analysis" view (Adrian 2026-07-14). The old standalone paths still
// resolve (deep links / shared URLs keep working) and just select the tab.
const ANALYSIS_TAB_FOR_VIEW: Partial<Record<View, AnalysisTab>> = {
  analysis: 'compliance',
  compliance: 'compliance',
  consistency: 'consistency',
  benchmarking: 'benchmarking',
};

// Tabs fall into three scopes:
//  - 'report'  : content belongs to the selected report (follows the switcher)
//  - 'shared'  : one instance shared across all reports (knowledge base, policies…)
//  - 'app'     : app-level / report-agnostic (guide, architecture, demo…)
type NavScope = 'top' | 'report' | 'shared' | 'more';
interface NavItem { id: View; icon: string; label: string; scope: NavScope }

// Simplified nav (Adrian 2026-07-14): Compliance/Consistency/Peer benchmarking
// collapsed into one "Analysis" item; Audit Trail and the workspace/shared
// utility views moved into a lower-prominence "More" group.
const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: '⌂', label: 'Home', scope: 'top' },
  { id: 'dashboard', icon: '■', label: 'Dashboard', scope: 'report' },
  { id: 'editor', icon: '✎', label: 'Report Editor', scope: 'report' },
  { id: 'analysis', icon: '☑', label: 'Analysis', scope: 'report' },
  { id: 'structure', icon: '⚙', label: 'Section Structure', scope: 'report' },
  { id: 'knowledgebase', icon: '📚', label: 'Knowledge Base', scope: 'report' },
  { id: 'upload', icon: '⬆', label: 'Upload Documents', scope: 'report' },
  // Lower-prominence utilities (audit, workspace, references).
  { id: 'audit', icon: '📄', label: 'Audit Trail', scope: 'more' },
  { id: 'auditview', icon: '🔍', label: 'Audit View', scope: 'more' },
  { id: 'policies', icon: '📜', label: 'Policy Inventory', scope: 'more' },
  { id: 'reports', icon: '📋', label: 'Previous Reports', scope: 'more' },
  { id: 'guide', icon: '📖', label: 'User Guide', scope: 'more' },
  { id: 'architecture', icon: '🏗', label: 'Architecture', scope: 'more' },
  { id: 'suggestions', icon: '💡', label: 'AI Suggestions', scope: 'more' },
  { id: 'demo', icon: '🎯', label: 'Demo', scope: 'more' },
  { id: 'admin', icon: '🛠', label: 'Admin', scope: 'more' },
];

const SCOPE_HEADINGS: Record<NavScope, string> = {
  top: '',
  report: 'This report',
  shared: 'Shared across reports',
  more: 'More',
};
const NAV_SCOPE_ORDER: NavScope[] = ['top', 'report', 'shared', 'more'];

export default function App() {
  const { isAuthenticated, isLoading, alias, login, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  // "Send To" is available on every page (Adrian 2026-08-31).
  const [showSendTo, setShowSendTo] = useState(false);
  const [sendToToast, setSendToToast] = useState<string | null>(null);
  // `view` is derived from the URL so each tab has its own address (e.g. /editor);
  // setView navigates, keeping the existing onNavigate(view) child interface intact.
  const view = pathToView(location.pathname);
  const setView = useCallback((next: View) => navigate(viewToPath(next)), [navigate]);
  const { activeReport, setActiveReport } = useActiveReport();
  const activeReportDef = reports.find(r => r.id === activeReport) ?? reports[0];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && window.location.pathname !== '/callback') login();
  }, [isLoading, isAuthenticated, login]);

  // After the OAuth redirect lands on /callback and auth completes, move to the
  // app root so the callback URL doesn't linger in the address bar.
  useEffect(() => {
    if (isAuthenticated && location.pathname === '/callback') navigate('/', { replace: true });
  }, [isAuthenticated, location.pathname, navigate]);

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 700 }}>Novartis ESG Authoring Studio</div>
          <div style={{ color: '#A3A3A3', fontSize: '13px', marginTop: '8px' }}>Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">N</div>
          <div className="sidebar-brand-name">ESG Authoring Studio</div>
        </div>

        {/* G — parallel report switcher */}
        <div style={{ padding: '0 12px 8px' }}>
          <label style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Report</label>
          <select
            value={activeReport}
            onChange={e => {
              const next = e.target.value as typeof activeReport;
              setActiveReport(next);
              // Every report-scoped view now resolves by activeReport, so the user
              // stays on the current tab when switching reports. Only the legacy
              // standalone '/report' landing route is redirected home so it doesn't
              // strand the user on a now-redundant view.
              if (view === 'report') setView('dashboard');
            }}
            style={{ width: '100%', marginTop: '4px', padding: '8px 10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '12px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 600 }}
          >
            {reports.map(r => (
              <option key={r.id} value={r.id}>{r.shortName}{r.status !== 'active' ? ` · ${r.status}` : ''}</option>
            ))}
          </select>
        </div>

        <nav className="sidebar-nav">
          {NAV_SCOPE_ORDER.map(scope => {
            // Section Structure is administrative-only (Thevi, 21 Aug 2026): hide
            // it from non-Admin/Editor seats so other roles never see the page.
            const canStructure = canEditStructure(alias);
            const items = NAV_ITEMS.filter(i => i.scope === scope && !(i.id === 'structure' && !canStructure));
            if (items.length === 0) return null;
            // Treat the current standalone analysis paths as the Analysis item
            // being active so the merged nav entry highlights correctly.
            const isActive = (id: View) =>
              view === id || (id === 'analysis' && (view === 'compliance' || view === 'consistency' || view === 'benchmarking'));
            return (
              <div key={scope} className="nav-group">
                {scope !== 'top' && (
                  <div className="nav-group-heading">
                    {scope === 'report' ? `${SCOPE_HEADINGS.report} · ${activeReportDef.shortName}` : SCOPE_HEADINGS[scope]}
                  </div>
                )}
                {items.map(item => (
                  <button
                    key={item.id}
                    className={`nav-item ${isActive(item.id) ? 'active' : ''}`}
                    onClick={() => setView(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span> {item.label}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{alias?.slice(0, 2).toUpperCase() || '?'}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{alias || 'User'}</div>
              <div className="sidebar-user-role">ESG Reporting Lead</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="theme-toggle" onClick={() => setDarkMode(d => !d)}>{darkMode ? '☀' : '☽'}</button>
            <button className="theme-toggle" onClick={logout} title="Sign out">{'⏻'}</button>
          </div>
        </div>
      </aside>
      <div className="app-main">
        {/* Global top bar — "Send To" is available on every page, to every role.
            Sticky so it stays visible while the content scrolls, with a solid
            background and border so the button always reads clearly. */}
        <div style={{ position: 'sticky', top: 0, zIndex: 20, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', padding: '10px 24px', background: 'var(--bg-primary)', borderBottom: '1px solid var(--border-primary)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {sendToToast && (
            <span style={{ fontSize: '12px', color: 'var(--success, #16a34a)', fontWeight: 600 }}>✓ {sendToToast}</span>
          )}
          <button className="btn-primary" onClick={() => setShowSendTo(true)} title="Assign an action or request to someone" style={{ fontSize: '13px', padding: '8px 16px' }}>
            ➤ Send to…
          </button>
        </div>
        <main className="app-content">
          {/* Report-scoped views resolve by activeReport. RNFM keeps the full
              authoring studio (rich existing views); parallel reports render their
              own scoped content. Shared/app-level views are report-agnostic. */}
          {view === 'home' && (
            <LandingView
              alias={alias}
              onOpenReport={(id) => { setActiveReport(id); setView('dashboard'); }}
            />
          )}
          {view === 'report' && <ParallelReportView reportId={activeReport} />}
          {view === 'dashboard' && (activeReport === 'rnfm' ? <DashboardView onNavigate={setView} /> : <ScopedDashboard reportId={activeReport} />)}
          {view === 'editor' && (activeReport === 'rnfm' ? <EditorView /> : <ScopedParallelEditor reportId={activeReport} />)}
          {view === 'structure' && (activeReport === 'rnfm' ? <StructureAdminView /> : <ScopedStructure reportId={activeReport} />)}
          {ANALYSIS_TAB_FOR_VIEW[view] && (
            <AnalysisView
              reportId={activeReport}
              tab={ANALYSIS_TAB_FOR_VIEW[view]!}
              onTab={(t) => setView(t === 'compliance' ? 'analysis' : t)}
            />
          )}
          {view === 'audit' && (activeReport === 'rnfm' ? <AuditView /> : <ScopedAudit reportId={activeReport} />)}
          {view === 'auditview' && <AuditorView />}
          {view === 'upload' && <UploadView />}
          {view === 'knowledgebase' && <KnowledgeBaseView />}
          {view === 'policies' && <PolicyInventoryView />}
          {view === 'reports' && <PreviousReportsView />}
          {view === 'guide' && <UserGuideView />}
          {view === 'architecture' && <ArchitectureView />}
          {view === 'suggestions' && <AiSuggestionsView />}
          {view === 'demo' && <DemoScriptView onNavigate={setView} />}
          {view === 'admin' && <AdminView />}
        </main>
      </div>

      {showSendTo && (
        <SendToDialog
          currentActor={alias || 'ESG Lead'}
          onClose={() => setShowSendTo(false)}
          onSent={(msg) => { setSendToToast(msg); setTimeout(() => setSendToToast(null), 4000); }}
        />
      )}
    </div>
  );
}
