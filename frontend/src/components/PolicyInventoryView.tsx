import { useState, useMemo } from 'react';
import { policyDocuments, policyCategories, policyStats, type PolicyStatus } from '../data/policyInventory';

type CategoryFilter = string;
type StatusFilter = 'all' | PolicyStatus;

export default function PolicyInventoryView() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPolicy, setExpandedPolicy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return policyDocuments.filter(p => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (searchTerm && !p.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [categoryFilter, statusFilter, searchTerm]);

  const statusColor = (s: PolicyStatus) => s === 'indexed' ? '#16a34a' : s === 'pending' ? '#f59e0b' : '#ef4444';

  return (
    <>
      <div className="view-header">
        <h1 className="view-title">Policy Inventory</h1>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{policyStats.total} policies across {policyCategories.length} categories</div>
      </div>

      <div className="card" style={{ padding: '16px 20px', marginBottom: '16px', borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Complete inventory of Novartis policy documents that serve as source evidence for the RNFM. Each policy maps to specific ESRS disclosure requirements and is indexed in the Knowledge Base for AI draft generation.
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{policyStats.total}</div>
          <div className="stat-label">Total Policies</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#16a34a' }}>{policyStats.indexed}</div>
          <div className="stat-label">Indexed in KB</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#f59e0b' }}>{policyStats.pending}</div>
          <div className="stat-label">Pending Ingestion</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{policyCategories.length}</div>
          <div className="stat-label">Categories</div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card" style={{ padding: '20px', marginTop: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '12px' }}>Coverage by Category</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {policyStats.byCategory.map(({ category, count }) => (
            <div key={category} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '200px', fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>{category}</div>
              <div style={{ flex: 1, height: '8px', borderRadius: '4px', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                <div style={{ width: `${(count / policyStats.total) * 100}%`, height: '100%', background: 'var(--accent)', borderRadius: '4px', minWidth: '4px' }}></div>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, minWidth: '24px', textAlign: 'right' }}>{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: '16px 20px', marginTop: '16px' }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              style={{ padding: '6px 12px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '12px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            >
              <option value="all">All Categories</option>
              {policyCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
            <div className="filter-tabs">
              {(['all', 'indexed', 'pending', 'outdated'] as StatusFilter[]).map(s => (
                <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Search</div>
            <input
              type="text"
              placeholder="Search policies..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '6px 12px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '12px', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* Policy Table */}
      <div className="card" style={{ padding: '0', marginTop: '16px', overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Policy Title</th>
              <th style={{ width: '160px' }}>Category</th>
              <th style={{ width: '120px' }}>Owner</th>
              <th style={{ width: '60px' }}>Year</th>
              <th style={{ width: '80px' }}>Status</th>
              <th style={{ width: '120px' }}>ESRS Relevance</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(policy => (
              <>
                <tr key={policy.id} onClick={() => setExpandedPolicy(expandedPolicy === policy.id ? null : policy.id)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500, fontSize: '12px' }}>{policy.title}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{policy.category}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{policy.owner}</td>
                  <td style={{ fontSize: '12px' }}>{policy.year}</td>
                  <td>
                    <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: `${statusColor(policy.status)}15`, color: statusColor(policy.status) }}>
                      {policy.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                      {policy.esrsRelevance.slice(0, 3).map(dr => (
                        <span key={dr} style={{ fontSize: '9px', padding: '2px 5px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '3px', fontFamily: 'monospace' }}>{dr}</span>
                      ))}
                      {policy.esrsRelevance.length > 3 && (
                        <span style={{ fontSize: '9px', padding: '2px 5px', color: 'var(--text-muted)' }}>+{policy.esrsRelevance.length - 3}</span>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedPolicy === policy.id && (
                  <tr key={`${policy.id}-detail`}>
                    <td colSpan={6}>
                      <div style={{ padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '6px', margin: '4px 0' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Last Reviewed:</span> {policy.lastReviewed}
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>KB Status:</span> {policy.status === 'indexed' ? 'Indexed and available for RAG retrieval' : 'Awaiting ingestion'}
                          </div>
                          <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: 'var(--text-muted)' }}>ESRS Disclosure Requirements:</span>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {policy.esrsRelevance.map(dr => (
                                <span key={dr} style={{ fontSize: '10px', padding: '3px 8px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: '4px', fontFamily: 'monospace' }}>{dr}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
