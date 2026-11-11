import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../auth/useAuth';
import { canEditStructure } from '../data/permissions';
import { ROLE_PERMISSIONS, ACTING_ROLE_LABEL, type ActingRole } from '../data/workflowRoles';
import { auditEvents } from '../data/auditEvents';
import { kbStats } from '../data/knowledgeBaseDocuments';
import { complianceStats, complianceMappings } from '../data/complianceMappings';
import {
  getAdminConfig, saveAdminConfig, refreshKnowledgeBase,
  DEFAULT_ADMIN_CONFIG, DEFAULT_VV_ACTIVITIES, type AdminConfig, type AiCapability,
} from '../api/adminClient';
import { AD_GROUPS, claimFor, type AdUser } from '../data/syntheticDirectory';
import { directorySummary } from '../data/directoryResolver';

// Admin control panel (admin-gated). Home for platform monitoring + the app-wide
// AI/config controls: prompt tuning, global context, knowledge-base refresh, plus
// read-only views of users/activity, roles, and metrics. Thresholds/alerts and
// the verification & validation framework are placeholders wired to the config
// shape, ready for the detailed spec.

type AdminTab = 'activity' | 'roles' | 'directory' | 'ai' | 'kb' | 'metrics' | 'thresholds' | 'vv';

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'activity', label: 'Users & Activity' },
  { id: 'roles', label: 'Roles & Permissions' },
  { id: 'directory', label: 'Directory (AD / SSO)' },
  { id: 'ai', label: 'AI Tuning' },
  { id: 'kb', label: 'Knowledge Base' },
  { id: 'metrics', label: 'Metrics & Confidence' },
  { id: 'thresholds', label: 'Thresholds & Alerts' },
  { id: 'vv', label: 'Verification & Validation' },
];

const ROLE_BADGE: Record<string, { bg: string; fg: string }> = {
  admin:          { bg: '#ede6fc', fg: '#7c3aed' },
  editor:         { bg: '#dcfce7', fg: '#15803d' },
  owner:          { bg: '#e0ecfb', fg: '#1b5ec4' },
  input_provider: { bg: '#fef3c7', fg: '#b45309' },
  guest:          { bg: '#f3f4f6', fg: '#6b7280' },
};

const AI_CAPABILITIES: { key: AiCapability; label: string; hint: string }[] = [
  { key: 'draft', label: 'Draft generation', hint: 'How a first draft is created; what to carry forward year-on-year.' },
  { key: 'compliance', label: 'Compliance rationale', hint: 'How coverage gaps are explained and fill text proposed.' },
  { key: 'chat', label: 'In-editor chat', hint: 'How the assistant answers and drafts inside the editor.' },
  { key: 'peer', label: 'Peer benchmarking', hint: 'How peer comparisons are synthesised.' },
  { key: 'analyze', label: 'Section review', hint: 'How typo/style/consistency issues are flagged.' },
];

const card: React.CSSProperties = { padding: '20px', marginTop: '16px' };
const sectionTitle: React.CSSProperties = { fontSize: '14px', fontWeight: 700, marginBottom: '4px' };
const hint: React.CSSProperties = { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 };

export default function AdminView() {
  const { alias } = useAuth();
  const isAdmin = canEditStructure(alias);

  const [tab, setTab] = useState<AdminTab>('activity');
  const [dirUser, setDirUser] = useState<AdUser | null>(null);
  const directory = useMemo(() => directorySummary(), []);
  const [config, setConfig] = useState<AdminConfig>(DEFAULT_ADMIN_CONFIG);
  const [loadingCfg, setLoadingCfg] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    if (!isAdmin) return;
    let alive = true;
    void getAdminConfig().then(c => { if (alive) { setConfig(c); setLoadingCfg(false); } });
    return () => { alive = false; };
  }, [isAdmin]);

  const saveConfig = async () => {
    setSaving(true);
    const saved = await saveAdminConfig(config);
    setConfig(saved);
    setSaving(false);
    showToast('Configuration saved — applies to new AI requests immediately.');
  };

  // --- derived read-only data ------------------------------------------------
  const userActivity = useMemo(() => {
    const byUser = new Map<string, { user: string; role: string; count: number; last: string }>();
    for (const e of auditEvents) {
      const cur = byUser.get(e.user) ?? { user: e.user, role: e.role, count: 0, last: e.timestamp };
      cur.count += 1;
      if (e.timestamp > cur.last) cur.last = e.timestamp;
      byUser.set(e.user, cur);
    }
    return Array.from(byUser.values()).sort((a, b) => b.count - a.count);
  }, []);

  const avgConfidence = useMemo(() => {
    if (!complianceMappings.length) return 0;
    return Math.round(complianceMappings.reduce((s, m) => s + m.confidence, 0) / complianceMappings.length * 100);
  }, []);

  if (!isAdmin) {
    return (
      <>
        <div className="view-header"><h1 className="view-title">Admin</h1></div>
        <div className="card" style={card}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            🔒 The Admin panel is restricted to administrators. Your account does not have
            admin access. Contact the ESG Reporting Lead if you need it.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Admin</h1>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Platform administration & monitoring</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderBottom: '1px solid var(--border-primary)', marginBottom: '4px' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: '8px 14px', fontSize: '13px', fontWeight: tab === t.id ? 700 : 500,
              color: tab === t.id ? 'var(--accent)' : 'var(--text-secondary)', background: 'none', border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {toast && <div className="toast" style={{ margin: '12px 0' }}>{toast}</div>}

      {/* ===== USERS & ACTIVITY ===== */}
      {tab === 'activity' && (
        <div className="card" style={card}>
          <div style={sectionTitle}>Users & activity</div>
          <div style={hint}>Contributors and their recent activity, derived from the audit trail.</div>
          <table className="data-table" style={{ width: '100%', fontSize: '13px' }}>
            <thead><tr><th>User</th><th>Role (most recent)</th><th>Actions</th><th>Last active</th></tr></thead>
            <tbody>
              {userActivity.map(u => (
                <tr key={u.user}>
                  <td style={{ fontWeight: 500 }}>{u.user}</td>
                  <td>{u.role}</td>
                  <td>{u.count}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{new Date(u.last).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== ROLES & PERMISSIONS ===== */}
      {tab === 'roles' && (
        <div className="card" style={card}>
          <div style={sectionTitle}>Roles & permissions</div>
          <div style={hint}>The permission matrix every gate in the app derives from (read-only).</div>
          <table className="data-table" style={{ width: '100%', fontSize: '12px' }}>
            <thead><tr>
              <th>Role</th><th>Edit</th><th>Edit w/o tracking</th><th>Review changes</th><th>Comment</th><th>Sign-off</th><th>Level</th><th>Scope</th>
            </tr></thead>
            <tbody>
              {(Object.keys(ROLE_PERMISSIONS) as ActingRole[]).map(r => {
                const p = ROLE_PERMISSIONS[r];
                const yn = (b: boolean) => b ? '✓' : '—';
                return (
                  <tr key={r}>
                    <td style={{ fontWeight: 600 }}>{ACTING_ROLE_LABEL[r]}</td>
                    <td>{yn(p.canEdit)}</td><td>{yn(p.canEditWithoutTracking)}</td><td>{yn(p.canReviewChanges)}</td>
                    <td>{yn(p.canComment)}</td><td>{yn(p.canSignOff)}</td><td>{p.signOffLevel ?? '—'}</td><td>{p.editScope}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== DIRECTORY (AD / SSO) — synthetic-connection simulation ===== */}
      {tab === 'directory' && (
        <>
          <div className="card" style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <div style={sectionTitle}>Directory integration — Microsoft Entra ID (Azure AD)</div>
              <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', padding: '2px 8px', borderRadius: '10px', background: '#fef3c7', color: '#b45309' }}>Simulated connection</span>
            </div>
            <div style={hint}>
              This is a <strong>synthetic simulation</strong> of how roles integrate with Novartis's corporate
              directory — not a live connection. It shows the exact flow a production federation runs.
              Sign-in federates <strong>Entra ID → Amazon Cognito</strong>; the user's <strong>AD group</strong> arrives
              as a token claim and maps to an acting role. Per-section ownership stays app-managed, keyed to the
              user's stable directory id — so AD needs only a handful of role groups, never one per section.
            </div>
            {/* The flow seam */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '10px 0 4px' }}>
              {['Novartis Entra ID', 'SAML / OIDC', 'Amazon Cognito', 'groups claim', 'Acting role'].map((step, i, arr) => (
                <span key={step} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, padding: '5px 10px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>{step}</span>
                  {i < arr.length - 1 && <span style={{ color: 'var(--text-muted)' }}>→</span>}
                </span>
              ))}
            </div>
          </div>

          {/* Capability vs assignment */}
          <div className="card" style={card}>
            <div style={sectionTitle}>Two layers: capability vs. assignment</div>
            <div style={hint}>The key design decision — what comes from AD, and what stays in the app.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '14px', borderLeft: '3px solid #7c3aed' }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Capability — from AD group</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>“What KIND of actor are you?” A membership in one of {AD_GROUPS.length} role groups grants an acting role. Changes rarely; managed in AD.</div>
              </div>
              <div style={{ border: '1px solid var(--border-primary)', borderRadius: '8px', padding: '14px', borderLeft: '3px solid #1b5ec4' }}>
                <div style={{ fontSize: '13px', fontWeight: 700 }}>Assignment — app-managed</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>“WHICH section do you own?” Assigned per section/subsection in the app, keyed to the user's stable AD id. Changes each cycle; no AD ticket needed.</div>
              </div>
            </div>
          </div>

          {/* Group -> role mapping */}
          <div className="card" style={card}>
            <div style={sectionTitle}>AD group → role mapping</div>
            <div style={hint}>The groups Novartis creates, and the acting role each grants. Confirmed with Novartis IT before go-live.</div>
            <table className="data-table" style={{ width: '100%', fontSize: '12.5px' }}>
              <thead><tr><th>AD security group</th><th>Grants role</th><th>Purpose</th></tr></thead>
              <tbody>
                {AD_GROUPS.map(g => {
                  const b = ROLE_BADGE[g.role];
                  return (
                    <tr key={g.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{g.name}</td>
                      <td><span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: b.bg, color: b.fg }}>{ACTING_ROLE_LABEL[g.role]}</span></td>
                      <td style={{ color: 'var(--text-secondary)' }}>{g.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Directory users + resolved role + assignments */}
          <div className="card" style={card}>
            <div style={sectionTitle}>Directory users (synthetic)</div>
            <div style={hint}>Each user's AD groups resolve to a role; their app-managed section assignments are shown alongside. Click a row to inspect the token claim the app would receive.</div>
            <table className="data-table" style={{ width: '100%', fontSize: '12.5px' }}>
              <thead><tr><th>User</th><th>Department</th><th>AD groups → role</th><th>Owns / provides input (sections)</th></tr></thead>
              <tbody>
                {directory.map(row => {
                  const b = row.primary ? ROLE_BADGE[row.primary] : { bg: '#fee2e2', fg: '#b91c1c' };
                  const owns = row.assignments.asOwner.length;
                  const ip = row.assignments.asInputProvider.length;
                  return (
                    <tr key={row.user.oid} onClick={() => setDirUser(row.user)} style={{ cursor: 'pointer' }}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{row.user.displayName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{row.user.upn}</div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{row.user.department}</td>
                      <td>
                        {row.primary
                          ? <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: b.bg, color: b.fg }}>{ACTING_ROLE_LABEL[row.primary]}</span>
                          : <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: b.bg, color: b.fg }}>No access — no group</span>}
                        {row.roles.length > 1 && <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '6px' }}>+{row.roles.length - 1} more</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {owns === 0 && ip === 0 ? '—' : [owns ? `Owner ×${owns}` : null, ip ? `Input Provider ×${ip}` : null].filter(Boolean).join(' · ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Claim inspector */}
          {dirUser && (
            <div className="card" style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={sectionTitle}>Token claim — {dirUser.displayName}</div>
                <button className="btn-ghost" onClick={() => setDirUser(null)} style={{ fontSize: '12px' }}>Close</button>
              </div>
              <div style={hint}>The (simulated) OIDC/SAML claim Cognito receives from Entra for this user. The app reads <code>cognito:groups</code> to resolve the role and <code>oid</code> to look up section assignments.</div>
              <pre style={{ fontSize: '12px', background: 'var(--bg-secondary)', padding: '14px', borderRadius: '8px', overflowX: 'auto', margin: 0 }}>
{JSON.stringify(claimFor(dirUser), null, 2)}
              </pre>
              {(() => {
                const a = directory.find(d => d.user.oid === dirUser.oid)!.assignments;
                return (
                  <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <strong>Resolved section assignments (app-managed):</strong>
                    <div style={{ marginTop: '4px' }}>Owner of: {a.asOwner.length ? a.asOwner.map(x => x.ref).join(', ') : '—'}</div>
                    <div>Input Provider of: {a.asInputProvider.length ? a.asInputProvider.map(x => x.ref).join(', ') : '—'}</div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Production note */}
          <div className="card" style={{ ...card, borderLeft: '3px solid var(--accent)' }}>
            <div style={sectionTitle}>Going live with Novartis</div>
            <ul style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: '18px', margin: 0 }}>
              <li><strong>Auth:</strong> add Entra ID as a SAML (or OIDC) IdP on the Cognito user pool — the SPA sign-in flow is unchanged.</li>
              <li><strong>Groups claim:</strong> Entra releases the group claim; Cognito maps it into the token (confirm the claim can be released, else a Microsoft Graph lookup — a separate access approval).</li>
              <li><strong>People-picker:</strong> section assignment resolves real people via Graph (here, the synthetic directory above).</li>
              <li><strong>Enforcement:</strong> the API validates the role claim server-side — front-end gates are UX only.</li>
              <li><strong>From Novartis:</strong> IdP choice + metadata, the group names + group→role mapping, and who administers group membership.</li>
            </ul>
          </div>
        </>
      )}

      {/* ===== AI TUNING ===== */}
      {tab === 'ai' && (
        <div className="card" style={card}>
          <div style={sectionTitle}>AI tuning</div>
          <div style={hint}>
            Give the model clear instructions per capability (e.g. how a draft is created, what to carry
            forward to the new year). These are <strong>appended</strong> to the built-in prompts — the safety
            guardrails (never invent figures, grounding) always remain. Changes apply to new AI requests immediately.
          </div>
          {loadingCfg ? <div style={hint}>Loading…</div> : (
            <>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600 }}>App-wide context</label>
                <div style={hint}>Relevant across the whole app — added to every AI call (e.g. "FY2026 reporting boundary now includes JV sites").</div>
                <textarea value={config.globalContext}
                  onChange={e => setConfig({ ...config, globalContext: e.target.value })}
                  rows={3} style={{ width: '100%', fontSize: '13px', padding: '8px', fontFamily: 'inherit' }}
                  placeholder="Context that should inform every AI response across the platform…" />
              </div>
              {AI_CAPABILITIES.map(c => (
                <div key={c.key} style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600 }}>{c.label}</label>
                  <div style={hint}>{c.hint}</div>
                  <textarea value={config.promptOverrides[c.key]}
                    onChange={e => setConfig({ ...config, promptOverrides: { ...config.promptOverrides, [c.key]: e.target.value } })}
                    rows={3} style={{ width: '100%', fontSize: '13px', padding: '8px', fontFamily: 'inherit' }}
                    placeholder={`Extra instructions for ${c.label.toLowerCase()}…`} />
                </div>
              ))}
              <button className="btn-primary" onClick={saveConfig} disabled={saving}>
                {saving ? 'Saving…' : 'Save AI configuration'}
              </button>
            </>
          )}
        </div>
      )}

      {/* ===== KNOWLEDGE BASE ===== */}
      {tab === 'kb' && (
        <div className="card" style={card}>
          <div style={sectionTitle}>Knowledge base</div>
          <div style={hint}>Source corpus grounding the AI. Trigger a refresh / re-embed so no stale data is used and new data is indexed.</div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', marginBottom: '16px', fontSize: '13px' }}>
            <div><div style={{ fontSize: '22px', fontWeight: 700 }}>{kbStats.totalDocuments}</div><div style={{ color: 'var(--text-muted)' }}>documents</div></div>
            <div><div style={{ fontSize: '22px', fontWeight: 700 }}>{kbStats.indexed}</div><div style={{ color: 'var(--text-muted)' }}>indexed</div></div>
            <div><div style={{ fontSize: '22px', fontWeight: 700 }}>{kbStats.totalChunks}</div><div style={{ color: 'var(--text-muted)' }}>chunks</div></div>
            <div><div style={{ fontSize: '13px', fontWeight: 600 }}>{config.kb.status}</div><div style={{ color: 'var(--text-muted)' }}>refresh status</div></div>
          </div>
          {config.kb.lastRefreshRequestedAt && (
            <div style={{ ...hint, marginBottom: '12px' }}>Last refresh requested {new Date(config.kb.lastRefreshRequestedAt).toLocaleString()} by {config.kb.lastRefreshBy}.</div>
          )}
          <button className="btn-primary" onClick={async () => {
            const r = await refreshKnowledgeBase();
            showToast(r.message);
            void getAdminConfig().then(setConfig);
          }}>⟳ Refresh / re-embed knowledge base</button>
        </div>
      )}

      {/* ===== METRICS & CONFIDENCE ===== */}
      {tab === 'metrics' && (
        <div className="card" style={card}>
          <div style={sectionTitle}>Metrics & confidence</div>
          <div style={hint}>Platform-wide metrics and AI confidence rollups. (Live V&V metrics land in the Verification & Validation tab.)</div>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px' }}>
            <div><div style={{ fontSize: '22px', fontWeight: 700 }}>{complianceStats.coveragePercent}%</div><div style={{ color: 'var(--text-muted)' }}>ESRS coverage</div></div>
            <div><div style={{ fontSize: '22px', fontWeight: 700 }}>{avgConfidence}%</div><div style={{ color: 'var(--text-muted)' }}>avg. compliance confidence</div></div>
            <div><div style={{ fontSize: '22px', fontWeight: 700 }}>{complianceStats.covered}/{complianceStats.total}</div><div style={{ color: 'var(--text-muted)' }}>DRs covered</div></div>
            <div><div style={{ fontSize: '22px', fontWeight: 700 }}>{auditEvents.length}</div><div style={{ color: 'var(--text-muted)' }}>audit events</div></div>
          </div>
        </div>
      )}

      {/* ===== THRESHOLDS & ALERTS (placeholder) ===== */}
      {tab === 'thresholds' && (
        <div className="card" style={card}>
          <div style={sectionTitle}>Thresholds & alerts</div>
          <div style={hint}>
            Define confidence thresholds and alerting rules (e.g. block sign-off below a confidence level,
            alert on metric breaches). <strong>Placeholder</strong> — the full framework is coming; the settings
            below are stored but not yet enforced.
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', fontSize: '13px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Minimum confidence (%)
              <input type="number" min={0} max={100}
                value={config.thresholds.minConfidence ?? ''}
                onChange={e => setConfig({ ...config, thresholds: { ...config.thresholds, minConfidence: e.target.value === '' ? null : Number(e.target.value) } })}
                style={{ width: '80px', padding: '4px 8px' }} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input type="checkbox" checked={config.thresholds.alertsEnabled}
                onChange={e => setConfig({ ...config, thresholds: { ...config.thresholds, alertsEnabled: e.target.checked } })} />
              Enable alerts
            </label>
            <button className="btn-secondary" onClick={saveConfig} disabled={saving}>{saving ? 'Saving…' : 'Save thresholds'}</button>
          </div>
          <div style={{ ...hint, marginTop: '16px', fontStyle: 'italic' }}>
            Coming: per-metric rules, alert routing (email/Teams), and enforcement at sign-off.
          </div>
        </div>
      )}

      {/* ===== VERIFICATION & VALIDATION (placeholder) ===== */}
      {tab === 'vv' && (
        <div className="card" style={card}>
          <div style={sectionTitle}>Verification & validation framework</div>
          <div style={hint}>
            AI output quality can only be truly validated on <strong>real data in the Novartis environment</strong> — a
            prototype on synthetic data proves the process, not the content. This is the structured UAT /
            prompt-tuning / audit methodology the team works through, tracked per activity so progress is auditable.
          </div>
          {loadingCfg ? <div style={hint}>Loading…</div> : (() => {
            const vv = config.vv ?? { activities: [], environment: 'prototype_synthetic' as const, lastUpdatedAt: null };
            const activities = vv.activities.length ? vv.activities : DEFAULT_VV_ACTIVITIES;
            const envLabel: Record<string, string> = {
              prototype_synthetic: 'Prototype — synthetic data (content not yet validated)',
              novartis_uat: 'Novartis UAT — real data connected',
              novartis_prod: 'Novartis production',
            };
            const setActivity = (id: string, patch: Partial<typeof activities[number]>) => {
              const next = activities.map(a => a.id === id ? { ...a, ...patch } : a);
              setConfig({ ...config, vv: { ...vv, activities: next, lastUpdatedAt: null } });
            };
            const passed = activities.filter(a => a.status === 'passed').length;
            const statusColor: Record<string, string> = { not_started: '#9ca3af', in_progress: '#f59e0b', blocked: '#dc2626', passed: '#16a34a' };
            return (
              <>
                <div style={{ padding: '10px 14px', background: 'var(--accent-light)', borderRadius: '8px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>Environment:</span>
                  <select value={vv.environment} onChange={e => setConfig({ ...config, vv: { ...vv, activities, environment: e.target.value as typeof vv.environment, lastUpdatedAt: null } })}
                    style={{ fontSize: '12px', padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-primary)' }}>
                    <option value="prototype_synthetic">{envLabel.prototype_synthetic}</option>
                    <option value="novartis_uat">{envLabel.novartis_uat}</option>
                    <option value="novartis_prod">{envLabel.novartis_prod}</option>
                  </select>
                  <span style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>{passed}/{activities.length} activities passed</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {activities.map(a => (
                    <div key={a.id} style={{ borderLeft: `4px solid ${statusColor[a.status]}`, paddingLeft: '14px', paddingTop: '4px', paddingBottom: '4px' }}>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{a.phase}</span>
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{a.title}</span>
                        <select value={a.status} onChange={e => setActivity(a.id, { status: e.target.value as typeof a.status })}
                          style={{ marginLeft: 'auto', fontSize: '11px', padding: '3px 6px', borderRadius: '6px', border: '1px solid var(--border-primary)', color: statusColor[a.status], fontWeight: 700 }}>
                          <option value="not_started">Not started</option>
                          <option value="in_progress">In progress</option>
                          <option value="blocked">Blocked</option>
                          <option value="passed">Passed</option>
                        </select>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 6px' }}>{a.description} <span style={{ color: 'var(--text-muted)' }}>· owner: {a.owner}</span></div>
                      <input value={a.note} onChange={e => setActivity(a.id, { note: e.target.value })} placeholder="Notes / evidence link…"
                        style={{ width: '100%', fontSize: '12px', padding: '5px 8px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} />
                    </div>
                  ))}
                </div>
                <button className="btn-primary" onClick={saveConfig} disabled={saving} style={{ marginTop: '16px' }}>
                  {saving ? 'Saving…' : 'Save V&V status'}
                </button>
              </>
            );
          })()}
        </div>
      )}
    </>
  );
}
