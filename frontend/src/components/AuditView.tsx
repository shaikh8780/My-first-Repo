import { useState, useMemo, useEffect } from 'react';
import { auditEvents, actionColors, type AuditAction, type AuditEvent } from '../data/auditEvents';
import { EVIDENCE_KIND_LABEL } from '../data/sectionEvidence';
import { api } from '../api';
import { ACTING_ROLE_LABEL, canViewAuditTrail, type ActingRole } from '../data/workflowRoles';

type ActionFilter = 'all' | AuditAction;

export default function AuditView() {
  const [actionFilter, setActionFilter] = useState<ActionFilter>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  // "View as" role preview, consistent with the editor + dashboard. Lands on
  // Admin (the ESG Reporting Lead). The audit trail is an assurance-grade record
  // and is restricted to Editors and Admins (Adrian 2026-08-31); in production
  // the acting role comes from the signed-in user's AD/SSO group.
  const [viewAsRole, setViewAsRole] = useState<ActingRole>('admin');
  const canView = canViewAuditTrail(viewAsRole);

  // #5 — human-supplied source evidence appears in the audit trail as 'upload'
  // events, merged with the static log and sorted by time. Fetched once on mount
  // via the data-access layer.
  const [evidenceEvents, setEvidenceEvents] = useState<AuditEvent[]>([]);
  useEffect(() => {
    let alive = true;
    void api.report.evidence.get().then(docs => {
      if (!alive) return;
      setEvidenceEvents(docs
        .filter(e => e.evidenceKind || e.paragraphRef)
        .map(e => ({
          id: `ev-audit-${e.id}`,
          timestamp: e.addedAt,
          user: e.addedBy,
          role: 'Contributor',
          action: 'upload' as AuditAction,
          details: `Attached source evidence “${e.name}” (${EVIDENCE_KIND_LABEL[e.evidenceKind ?? 'other']})${e.paragraphRef ? ` for the claim: “${e.paragraphRef}”` : ''}`,
        })));
    });
    return () => { alive = false; };
  }, []);

  const allEvents = useMemo<AuditEvent[]>(() =>
    [...auditEvents, ...evidenceEvents].sort((a, b) => a.timestamp.localeCompare(b.timestamp)),
    [evidenceEvents]);

  const users = useMemo(() => [...new Set(allEvents.map(e => e.user))], [allEvents]);

  const filtered = useMemo(() => {
    return allEvents.filter(e => {
      if (actionFilter !== 'all' && e.action !== actionFilter) return false;
      if (userFilter !== 'all' && e.user !== userFilter) return false;
      return true;
    }).reverse();
  }, [actionFilter, userFilter, allEvents]);

  const exportLog = () => {
    if (!canView) return; // gate: not available to a read-only Guest
    const data = JSON.stringify(filtered, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const roleSwitcher = (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>View as</label>
      <select
        value={viewAsRole}
        onChange={e => setViewAsRole(e.target.value as ActingRole)}
        title="View the audit trail as each role. Access is restricted to Editors and Admins."
        style={{ fontSize: '12px', padding: '6px 8px', border: '1px solid var(--border-primary)', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontWeight: 600 }}
      >
        <option value="admin">Admin — ESG Reporting Lead</option>
        <option value="editor">Editor</option>
        <option value="owner">Owner</option>
        <option value="input_provider">Input Provider</option>
        <option value="guest">Guest</option>
        <option value="auditor">Auditor</option>
      </select>
      {canView && <button className="btn-secondary" onClick={exportLog}>Export JSON</button>}
    </div>
  );

  // Guest (read-only) has no access to the assurance-grade audit trail.
  if (!canView) {
    return (
      <>
        <div className="view-header">
          <h1 className="view-title">Audit Trail</h1>
          {roleSwitcher}
        </div>
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</div>
          <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Audit trail not available for the {ACTING_ROLE_LABEL[viewAsRole]} role</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto' }}>
            The audit trail is an assurance-grade record of every change, sign-off and export.
            Access is restricted to Editors and Admins; Input Providers, Owners, Guests and Auditors cannot view or export it.
            Switch “View as” to Editor or Admin to view it.
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Audit Trail</h1>
        {roleSwitcher}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{allEvents.length}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Contributors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{allEvents.filter(e => e.action === 'approve').length}</div>
          <div className="stat-label">Approvals</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">7 years</div>
          <div className="stat-label">Retention</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginTop: '20px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>Action</div>
            <div className="filter-tabs">
              <button className={`filter-tab ${actionFilter === 'all' ? 'active' : ''}`} onClick={() => setActionFilter('all')}>All</button>
              {(['edit', 'approve', 'comment', 'submit', 'generate', 'scan', 'upload', 'export'] as AuditAction[]).map(a => (
                <button key={a} className={`filter-tab ${actionFilter === a ? 'active' : ''}`} onClick={() => setActionFilter(a)}>{a}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>User</div>
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '12px', fontFamily: 'var(--font-sans)' }}
            >
              <option value="all">All Users</option>
              {users.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-muted)' }}>{filtered.length} events</div>
        </div>
      </div>

      {/* Event Table */}
      <div className="card" style={{ padding: '0', marginTop: '16px', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Section</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(evt => (
              <tr key={evt.id}>
                <td style={{ fontSize: '12px', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>{new Date(evt.timestamp).toLocaleString()}</td>
                <td style={{ fontWeight: 500 }}>{evt.user}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{evt.role}</td>
                <td>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: actionColors[evt.action] + '20', color: actionColors[evt.action], fontWeight: 600 }}>
                    {evt.action}
                  </span>
                </td>
                <td style={{ fontSize: '12px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.section || '—'}</td>
                <td style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{evt.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
